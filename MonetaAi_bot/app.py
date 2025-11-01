import json
import os
import requests
import traceback
from typing import Dict, Any
from tools_manager import tools_manager
from dynamodb_manager import DynamoDBManager
# Refatorado: utilizar serviços dedicados
from services.openai_client import OpenAIClient
from services.conversation_service import ConversationService
from services.whatsapp_service import WhatsAppService
from services.sns_event_parser import parse_sns_event
from utils.models import IncomingWhatsAppMessage
from session_context import session_context

# Novas variáveis de ambiente para integração WhatsApp Cloud API (Meta)
META_WHATSAPP_TOKEN = os.environ.get("META_WHATSAPP_TOKEN")  # Token de acesso da API do WhatsApp Cloud
META_WA_API_VERSION = os.environ.get("META_WA_API_VERSION", "v22.0")  # Versão da Graph API

# API Key da OpenAI
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

# Inicializa o gerenciador do DynamoDB
dynamodb_manager = DynamoDBManager()

# Instâncias singleton (avaliar lazy-init em produção para cold start se necessário)
_openai_client = OpenAIClient()
_conversation_service = ConversationService(dynamodb_manager, _openai_client)
_whatsapp_service = WhatsAppService()

def load_system_prompt():
    """Carrega o prompt do sistema a partir do arquivo system_prompt.txt"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        system_file_path = os.path.join(script_dir, 'system_prompt.txt')
        
        print(f"DEBUG: Tentando carregar system prompt de: {system_file_path}")
        
        with open(system_file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            print(f"DEBUG: System prompt carregado com sucesso. Tamanho: {len(content)} caracteres")
            return content
            
    except FileNotFoundError as e:
        error_msg = f"Erro: Arquivo {system_file_path} não encontrado: {e}"
        print(error_msg)
        print(f"Traceback completo:\n{traceback.format_exc()}")
        return ""
    except Exception as e:
        error_msg = f"Erro ao carregar o arquivo de sistema: {e}"
        print(error_msg)
        print(f"Traceback completo:\n{traceback.format_exc()}")
        return ""

system = load_system_prompt()


# Mantido para compatibilidade com possíveis chamadas externas antigas
def process_conversation_legacy(user_input: str, whatsapp_id: str):
    return _conversation_service.process_conversation(user_input, whatsapp_id)

# Wrapper for the new signature with optional media parameters
def process_conversation_wrapper(user_input: str, whatsapp_id: str, image_data: Dict[str, Any] = None, audio_data: Dict[str, Any] = None, file_data: Dict[str, Any] = None):
    return _conversation_service.process_conversation(user_input, whatsapp_id, image_data, audio_data, file_data)

process_conversation = process_conversation_wrapper


def lambda_handler(event, context):
    """Handler principal.
    Suporta:
      - Eventos SNS (webhooks WhatsApp) -> resposta via WhatsApp Cloud API
      - Chamada direta (API Gateway) -> retorna JSON
    """
    try:
        print(f"DEBUG: lambda_handler event keys: {list(event.keys())}")

        # Fluxo SNS
        if "Records" in event and isinstance(event["Records"], list) and event["Records"] and "Sns" in event["Records"][0]:
            payloads = parse_sns_event(event)
            all_results = []
            for p in payloads:
                incoming_list = _whatsapp_service.extract_messages_from_webhook(p)
                for incoming in incoming_list:
                    res = _process_incoming_whatsapp_message(incoming)
                    all_results.append(res)
            return _response(200, {
                'processed_messages': len(all_results),
                'results': all_results
            })

        # Fluxo API Gateway legado
        body = _parse_body(event)
        user_input = body.get("message", "")
        whatsapp_id = body.get("whatsapp_id", "")
        clear_history = body.get("clear_history", False)

        if clear_history and whatsapp_id:
            dynamodb_manager.clear_chat_history(whatsapp_id, "")
            return _response(200, {'message': 'Histórico do chat limpo com sucesso.'})

        if not user_input.strip():
            return _response(400, {'error': 'Mensagem não pode estar vazia.'})
        if not whatsapp_id.strip():
            return _response(400, {'error': 'ID do usuário é obrigatório.'})

        result = process_conversation(user_input, whatsapp_id)
        if 'error' in result:
            return _response(500, {'error': result['error'], 'traceback': result.get('traceback', '')})
        return _response(200, {'response': result['response'], 'chat_history': result['chat_history']})

    except Exception as e:
        print(f"ERROR: lambda_handler exception: {e}")
        print(traceback.format_exc())
        return _response(500, {'error': str(e), 'traceback': traceback.format_exc()})


def _process_incoming_whatsapp_message(msg: IncomingWhatsAppMessage):
    print(f"DEBUG: _process_incoming_whatsapp_message wa_id={msg.wa_id} text={msg.text} type={msg.message_type}")
    # Atualiza contexto de sessão com dados do WhatsApp (inclui phone_number_id)
    try:
        session_context.update_from_incoming(msg)
    except Exception as e:
        print(f"WARN: Falha ao atualizar session_context: {e}")

    # Check if it's an unsupported message type
    if msg.is_unsupported_type:
        print(f"DEBUG: Tipo de mensagem não suportado detectado: {msg.message_type}")
        
        # Create fallback messages based on message type
        fallback_messages = {
            "video": "Desculpe, mas não consigo processar vídeos no momento. Por favor, tente me enviar uma imagem, áudio, documento de texto ou uma mensagem de texto. 📹❌",
            "sticker": "Desculpe, mas não consigo processar stickers. Por favor, tente me enviar uma mensagem de texto, imagem, áudio ou documento. 😄❌", 
            "location": "Desculpe, mas não consigo processar informações de localização no momento. Por favor, tente me descrever o local em uma mensagem de texto. 📍❌",
            "contacts": "Desculpe, mas não consigo processar informações de contato compartilhadas. Por favor, tente me enviar uma mensagem de texto. 👤❌"
        }
        
        # Get specific fallback message or generic one
        fallback_response = fallback_messages.get(
            msg.message_type, 
            f"Desculpe, mas não consigo processar este tipo de mensagem ({msg.message_type}). Por favor, tente me enviar uma mensagem de texto, imagem, áudio ou documento. ❌"
        )
        
        send_result = _whatsapp_service.send_message(msg.phone_number_id, msg.wa_id, fallback_response)
        return {'fallback_response': fallback_response, 'send_result': send_result, 'reason': 'unsupported_message_type'}
    
    # Pass media data if available for supported types
    image_data = None
    audio_data = None
    file_data = None
    
    if msg.message_type == "image" and msg.image_data:
        image_data = msg.image_data
    elif msg.message_type in ["audio", "voice"] and msg.audio_data:
        audio_data = msg.audio_data
    elif msg.message_type == "document" and msg.file_data:
        file_data = msg.file_data
        
    conv_result = process_conversation(msg.text, msg.wa_id, image_data, audio_data, file_data)
    if 'response' in conv_result:
        send_result = _whatsapp_service.send_message(msg.phone_number_id, msg.wa_id, conv_result['response'])
        return {'conversation': conv_result, 'send_result': send_result}
    else:
        fallback = 'Desculpe, ocorreu um erro ao processar sua mensagem.'
        send_result = _whatsapp_service.send_message(msg.phone_number_id, msg.wa_id, fallback)
        return {'error': conv_result.get('error', 'Erro desconhecido'), 'send_result': send_result}


def _parse_body(event):
    if isinstance(event.get('body'), str):
        try:
            return json.loads(event['body'])
        except Exception:
            return {}
    return event.get('body', {}) or {}


def _response(status, body_dict):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': json.dumps(body_dict, ensure_ascii=False)
    }
