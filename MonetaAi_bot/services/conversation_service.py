from typing import List, Dict, Any
import traceback
import os
from dynamodb_manager import DynamoDBManager
from services.openai_client import OpenAIClient
from services.whatsapp_service import WhatsAppService
from tools_manager import tools_manager
from session_context import session_context

class ConversationService:
    def __init__(self, dynamo: DynamoDBManager, openai_client: OpenAIClient):
        self.dynamo = dynamo
        self.openai_client = openai_client
        self.system_prompt = self.openai_client.load_system_prompt()
        self.whatsapp_service = WhatsAppService()  # For downloading images

    def _get_messages(self, chat_history: List[Dict[str, Any]]):
        # Aplica truncamento seguro antes de enviar
        truncated = self._truncate_chat_history(chat_history)
        if truncated is not chat_history:
            chat_history.clear()
            chat_history.extend(truncated)
        return [{"role": "system", "content": self.system_prompt}] + chat_history

    def _create_image_content(self, text: str, image_base64: str, mime_type: str) -> List[Dict[str, Any]]:
        """
        Creates OpenAI-compatible content for image messages
        """
        content = []
        
        # Add text if present
        if text and text.strip() and text != "[Imagem enviada]":
            content.append({
                "type": "text",
                "text": text
            })
        
        # Add image
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:{mime_type};base64,{image_base64}"
            }
        })
        
        return content

    def _create_audio_content(self, text: str, audio_base64: str, mime_type: str) -> str:
        """
        Transcreve áudio usando Whisper API e retorna texto
        """
        try:
            print(f"DEBUG: Transcrevendo áudio usando Whisper API")
            
            # Transcrever o áudio usando Whisper
            transcription = self.openai_client.transcribe_audio(audio_base64, mime_type)
            
            # Combinar texto original (se existir) com a transcrição
            combined_text = ""
            if text and text.strip() and text not in ["[Áudio enviado]", "[Mensagem de voz enviada]"]:
                combined_text = f"{text}\n\n"
            
            combined_text += f"[Transcrição do áudio]: {transcription}"
            
            return combined_text
            
        except Exception as e:
            print(f"ERROR: Falha ao transcrever áudio: {e}")
            # Se falhar a transcrição, retornar texto padrão
            if text and text.strip() and text not in ["[Áudio enviado]", "[Mensagem de voz enviada]"]:
                return f"{text}\n\n[Nota: Não foi possível transcrever o áudio enviado]"
            else:
                return "[Nota: Áudio recebido mas não foi possível transcrever]"

    def _llm_process_input(self, input_text: str, chat_history: List[Dict[str, Any]], image_data: Dict[str, Any] = None, audio_data: Dict[str, Any] = None, file_data: Dict[str, Any] = None):
        try:
            message_content = input_text
            
            # Handle image messages
            if image_data and image_data.get("id"):
                print(f"DEBUG: Processando mensagem com imagem - ID: {image_data['id']}")
                
                # Download the image
                image_base64 = self.whatsapp_service.download_media(image_data["id"])
                if image_base64:
                    # Create OpenAI-compatible content with image
                    message_content = self._create_image_content(
                        input_text, 
                        image_base64, 
                        image_data.get("mime_type", "image/jpeg")
                    )
                    print(f"DEBUG: Imagem processada e adicionada ao conteúdo da mensagem")
                else:
                    print("ERROR: Falha ao baixar imagem, enviando apenas texto")
                    message_content = f"{input_text}\n\n[Nota: Houve um erro ao processar a imagem enviada]"
            
            # Handle audio messages
            elif audio_data and audio_data.get("id"):
                print(f"DEBUG: Processando mensagem com áudio - ID: {audio_data['id']}")
                
                # Download the audio
                audio_base64 = self.whatsapp_service.download_media(audio_data["id"])
                if audio_base64:
                    # Transcrever áudio e criar conteúdo textual
                    message_content = self._create_audio_content(
                        input_text,
                        audio_base64,
                        audio_data.get("mime_type", "audio/ogg")
                    )
                    print(f"DEBUG: Áudio transcrito e processado")
                else:
                    print("ERROR: Falha ao baixar áudio, enviando apenas texto")
                    message_content = f"{input_text}\n\n[Nota: Houve um erro ao processar o áudio enviado]"
            
            # Handle file messages
            elif file_data and file_data.get("id"):
                print(f"DEBUG: Processando mensagem com arquivo - ID: {file_data['id']}, Nome: {file_data.get('filename', 'arquivo')}")
                
                # Download the file
                file_base64 = self.whatsapp_service.download_media(file_data["id"])
                if file_base64:
                    # Create OpenAI-compatible content with file
                    message_content = self.openai_client.create_file_content(
                        input_text,
                        file_base64,
                        file_data.get("filename", "arquivo"),
                        file_data.get("mime_type", "application/octet-stream")
                    )
                    print(f"DEBUG: Arquivo processado e adicionado ao conteúdo da mensagem")
                else:
                    print("ERROR: Falha ao baixar arquivo, enviando apenas texto")
                    message_content = f"{input_text}\n\n[Nota: Houve um erro ao processar o arquivo enviado: {file_data.get('filename', 'arquivo')}]"
            
            chat_history.append({"role": "user", "content": message_content})
            # Truncar imediatamente após adicionar usuário
            chat_history[:] = self._truncate_chat_history(chat_history)
            messages = self._get_messages(chat_history)
            return self.openai_client.make_request(messages)
        except Exception as e:
            print(f"ERROR: _llm_process_input: {e}")
            print(traceback.format_exc())
            raise

    def _handle_tool_calls(self, message: Dict[str, Any], chat_history: List[Dict[str, Any]], account_id: str):
        try:
            chat_history.append(message)
            for tool_call in message.get("tool_calls", []):
                tool_response = tools_manager.process_tool_call(tool_call, account_id)
                chat_history.append({"role": "tool", "content": tool_response, "tool_call_id": tool_call.get("id")})
        except Exception as e:
            print(f"ERROR: _handle_tool_calls: {e}")
            print(traceback.format_exc())
            raise

    def _extract_assistant_content(self, message: Dict[str, Any]):
        if not message:
            return "Sem resposta disponível."
        content = message.get("content")
        if isinstance(content, str) and content:
            return content
        if isinstance(content, list) and content:
            first = content[0]
            if isinstance(first, dict):
                return first.get("text", "Sem resposta disponível.")
        return "Sem resposta disponível."

    def _truncate_chat_history(self, chat_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Trunca histórico garantindo regras de integridade para tool calls.
        - Limite definido por CHAT_HISTORY_MAX_MESSAGES (default 50) (não conta system).
        - Nunca iniciar com role 'tool'. Se necessário inclui assistant com tool_calls anterior ou descarta tools órfãs.
        - Garante que cada 'tool' pertença a um assistant anterior (na janela) que contenha o tool_call correspondente.
        - Preserva múltiplas tool responses consecutivas do mesmo assistant.
        - Se o último assistant da janela tiver tool_calls, inclui as tool responses logo após (podendo exceder limite) e tenta incluir todas.
        - Remove tool_calls cujas respostas não estejam presentes (resiliência) e descarta assistant vazio após isso.
        Em caso de erro, retorna histórico completo para não quebrar fluxo.
        """
        try:
            max_messages = int(os.environ.get("CHAT_HISTORY_MAX_MESSAGES", "50"))
            if max_messages <= 0 or len(chat_history) <= max_messages:
                return chat_history

            start = len(chat_history) - max_messages
            end = len(chat_history)

            # Ajustar início para não começar com 'tool'
            while start < end and chat_history[start].get("role") == "tool":
                assistant_idx = start - 1
                found = False
                while assistant_idx >= 0:
                    msg = chat_history[assistant_idx]
                    if msg.get("role") == "assistant" and msg.get("tool_calls"):
                        start = assistant_idx
                        found = True
                        break
                    if msg.get("role") != "tool":
                        break
                    assistant_idx -= 1
                if not found:
                    start += 1  # descarta tool órfã inicial

            window = chat_history[start:end]

            # Limpeza preservando sequências de múltiplas tool responses do mesmo assistant
            cleaned: List[Dict[str, Any]] = []
            current_tool_ids: set[str] = set()  # tool_calls do último assistant válido

            for msg in window:
                role = msg.get("role")
                if role == "assistant":
                    tool_calls = msg.get("tool_calls") or []
                    if tool_calls:
                        current_tool_ids = {tc.get("id") for tc in tool_calls if tc.get("id")}
                    else:
                        current_tool_ids = set()
                    cleaned.append(msg)
                elif role == "tool":
                    tool_id = msg.get("tool_call_id")
                    if tool_id and tool_id in current_tool_ids and cleaned:  # pertence ao último assistant com tool_calls
                        cleaned.append(msg)
                    else:
                        # tool órfã: descarta
                        continue
                else:  # user ou outro tipo
                    current_tool_ids = set()  # quebra o contexto de tool_calls
                    cleaned.append(msg)

            window = cleaned

            # Se último assistant da janela tem tool_calls, anexar quaisquer tool responses faltantes logo após
            if window:
                last = window[-1]
                if last.get("role") == "assistant" and last.get("tool_calls"):
                    expected_all = {tc.get("id") for tc in last.get("tool_calls") if tc.get("id")}
                    already_present = {m.get("tool_call_id") for m in window if m.get("role") == "tool"}
                    missing = expected_all - already_present
                    k = end
                    # Avança enquanto não encontra nova mensagem de usuário/assistant (novo turno) e ainda há missing
                    while k < len(chat_history) and missing:
                        nxt = chat_history[k]
                        r = nxt.get("role")
                        if r == "tool":
                            tid = nxt.get("tool_call_id")
                            if tid in missing:
                                window.append(nxt)
                                missing.discard(tid)
                                k += 1
                                continue
                            else:
                                # tool de outro bloco -> pode interromper
                                break
                        else:
                            # novo turno -> parar
                            break
                    if missing:
                        print(f"WARN: Nem todas as tool responses foram encontradas para o último assistant. Faltando: {missing}")

            # Segunda passada: remover tool_calls sem respostas correspondentes
            i = 0
            new_window: List[Dict[str, Any]] = []
            while i < len(window):
                msg = window[i]
                if msg.get("role") == "assistant" and msg.get("tool_calls"):
                    # Coletar respostas adjacentes (até próximo assistant/user)
                    expected_ids = [tc.get("id") for tc in msg.get("tool_calls") if tc.get("id")]
                    missing_ids = set(expected_ids)
                    j = i + 1
                    while j < len(window) and window[j].get("role") == "tool":
                        tid = window[j].get("tool_call_id")
                        if tid in missing_ids:
                            missing_ids.discard(tid)
                        j += 1
                    if missing_ids:
                        before = len(msg["tool_calls"])
                        msg["tool_calls"] = [tc for tc in msg["tool_calls"] if tc.get("id") not in missing_ids]
                        removed = before - len(msg["tool_calls"])
                        print(f"WARN: Removendo {removed} tool_calls sem respostas: {missing_ids}")
                        if not msg["tool_calls"] and (msg.get("content") is None or msg.get("content") == ""):
                            # descarta assistant vazio
                            i += 1
                            continue
                    new_window.append(msg)
                    i += 1
                else:
                    new_window.append(msg)
                    i += 1
            window = new_window

            truncated = window
            print(f"DEBUG: Histórico truncado de {len(chat_history)} para {len(truncated)} mensagens (limite base {max_messages})")
            return truncated
        except Exception as e:
            print(f"ERROR: _truncate_chat_history: {e}")
            print(traceback.format_exc())
            return chat_history

    def process_conversation(self, user_input: str, whatsapp_id: str, image_data: Dict[str, Any] = None, audio_data: Dict[str, Any] = None, file_data: Dict[str, Any] = None):
        try:
            dynamo_chat_history = self.dynamo.get_chat_history(whatsapp_id)
            chat_history = dynamo_chat_history.get("chat_history", [])
            account_id = dynamo_chat_history.get("account_id", "")
            # Atualiza binding account->wa (se disponível)
            if account_id and whatsapp_id:
                session_context.bind_account(account_id, whatsapp_id)
            response = self._llm_process_input(user_input, chat_history, image_data, audio_data, file_data)
            while True:
                choices = response.get("choices", [])
                if not choices:
                    return {"error": "Resposta inesperada do agente - sem choices", "chat_history": chat_history}
                message = choices[0]["message"]
                if message.get("tool_calls"):
                    self._handle_tool_calls(message, chat_history, account_id)
                    # Truncar antes do novo request
                    chat_history[:] = self._truncate_chat_history(chat_history)
                    response = self.openai_client.make_request(self._get_messages(chat_history))
                    continue
                chat_history.append(message)
                chat_history[:] = self._truncate_chat_history(chat_history)
                self.dynamo.save_chat_history(whatsapp_id, account_id, chat_history)
                final_response = self._extract_assistant_content(message)
                return {"response": final_response, "chat_history": chat_history}
        except Exception as e:
            print(f"ERROR: process_conversation: {e}")
            print(traceback.format_exc())
            return {"error": str(e), "traceback": traceback.format_exc()}
