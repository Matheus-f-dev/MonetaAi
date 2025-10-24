import boto3
import json
from decimal import Decimal
from datetime import datetime, timedelta
import os
import traceback

class DynamoDBManager:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ.get('DYNAMODB_TABLE_NAME', 'ChatHistory')
        self.table = self.dynamodb.Table(self.table_name)
        
    def get_chat_history(self, whatsapp_id):
        """Recupera o histórico de chat do usuário."""
        try:
            response = self.table.get_item(
                Key={'whatsapp_id': whatsapp_id}
            )
            
            if 'Item' in response:
                item = response['Item']
                # Verifica se o histórico não expirou (24 horas)
                if self._is_history_expired(item.get('last_updated')):
                    # Remove histórico expirado
                    self.clear_chat_history(whatsapp_id)
                    return {
                        "chat_history": [],
                        "account_id": item.get('account_id', [])
                    }
                
                # Converte de Decimal para tipos Python nativos
                chat_history = self._convert_from_dynamodb_format(item.get('chat_history', []))
                return {
                    "chat_history": chat_history,
                    "account_id": item.get('account_id', [])
                }
            
            return {
                "chat_history": [],
                "account_id": ""
            }
            
        except Exception as e:
            error_msg = f"Erro ao recuperar histórico do chat: {e}"
            print(error_msg)
            print(f"Traceback completo:\n{traceback.format_exc()}")
            return {
                "chat_history": [],
                "account_id": ""
            }
    
    def save_chat_history(self, whatsapp_id, account_id, chat_history):
        """Salva o histórico de chat do usuário."""
        try:
            # Converte para formato compatível com DynamoDB
            dynamodb_history = self._convert_to_dynamodb_format(chat_history)
            
            self.table.put_item(
                Item={
                    'whatsapp_id': whatsapp_id,
                    "account_id": account_id,
                    'chat_history': dynamodb_history,
                    'last_updated': datetime.utcnow().isoformat(),
                    'ttl': int((datetime.utcnow() + timedelta(days=1)).timestamp())  # TTL de 24 horas
                }
            )
            
            return True
            
        except Exception as e:
            error_msg = f"Erro ao salvar histórico do chat: {e}"
            print(error_msg)
            print(f"Traceback completo:\n{traceback.format_exc()}")
            return False
    
    def clear_chat_history(self, whatsapp_id, account_id):
        """Limpa o histórico de chat do usuário."""
        try:
            self.table.put_item(
                Item={
                    'whatsapp_id': whatsapp_id,
                    "account_id": account_id,
                    'chat_history': [],
                    'last_updated': datetime.utcnow().isoformat(),
                    'ttl': int((datetime.utcnow() + timedelta(days=1)).timestamp())  # TTL de 24 horas
                }
            )
            return True
            
        except Exception as e:
            error_msg = f"Erro ao limpar histórico do chat: {e}"
            print(error_msg)
            print(f"Traceback completo:\n{traceback.format_exc()}")
            return False
    
    def _is_history_expired(self, last_updated_str):
        """Verifica se o histórico expirou (24 horas)."""
        if not last_updated_str:
            return True
            
        try:
            last_updated = datetime.fromisoformat(last_updated_str)
            expiry_time = last_updated + timedelta(hours=24)
            return datetime.utcnow() > expiry_time
        except Exception as e:
            error_msg = f"Erro ao verificar expiração do histórico: {e}"
            print(error_msg)
            print(f"Traceback completo:\n{traceback.format_exc()}")
            return True
    
    def _convert_to_dynamodb_format(self, data):
        """Converte dados Python para formato compatível com DynamoDB."""
        if isinstance(data, dict):
            return {k: self._convert_to_dynamodb_format(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._convert_to_dynamodb_format(item) for item in data]
        elif isinstance(data, float):
            return Decimal(str(data))
        elif isinstance(data, int):
            return Decimal(data)
        else:
            return data
    
    def _convert_from_dynamodb_format(self, data):
        """Converte dados do DynamoDB para formato Python nativo."""
        if isinstance(data, dict):
            return {k: self._convert_from_dynamodb_format(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._convert_from_dynamodb_format(item) for item in data]
        elif isinstance(data, Decimal):
            if data % 1 == 0:
                return int(data)
            else:
                return float(data)
        else:
            return data
