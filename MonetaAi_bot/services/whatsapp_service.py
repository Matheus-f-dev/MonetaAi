import os
import requests
import traceback
import base64
from typing import Any, Dict, List, Optional, Tuple
from utils.models import IncomingWhatsAppMessage

META_WHATSAPP_TOKEN = os.environ.get("META_WHATSAPP_TOKEN")
META_WA_API_VERSION = os.environ.get("META_WA_API_VERSION", "v22.0")

class WhatsAppService:
    def __init__(self):
        if not META_WHATSAPP_TOKEN:
            print("WARN: META_WHATSAPP_TOKEN não configurado.")

    def download_media(self, media_id: str) -> Optional[str]:
        """
        Downloads media from WhatsApp Cloud API and returns base64 encoded content
        """
        if not META_WHATSAPP_TOKEN:
            print("ERROR: META_WHATSAPP_TOKEN não configurado para download de mídia")
            return None
            
        try:
            # First get media URL
            url = f"https://graph.facebook.com/{META_WA_API_VERSION}/{media_id}"
            headers = {"Authorization": f"Bearer {META_WHATSAPP_TOKEN}"}
            
            print(f"DEBUG: Obtendo URL da mídia para ID: {media_id}")
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            media_info = response.json()
            media_url = media_info.get("url")
            
            if not media_url:
                print("ERROR: URL da mídia não encontrada na resposta")
                return None
            
            # Now download the actual media
            print(f"DEBUG: Baixando mídia de: {media_url}")
            media_response = requests.get(media_url, headers=headers, timeout=60)
            media_response.raise_for_status()
            
            # Convert to base64
            base64_content = base64.b64encode(media_response.content).decode('utf-8')
            print(f"DEBUG: Mídia baixada com sucesso. Tamanho: {len(media_response.content)} bytes")
            
            return base64_content
            
        except Exception as e:
            print(f"ERROR: Falha ao baixar mídia {media_id}: {e}")
            print(traceback.format_exc())
            return None

    def _api_headers(self, content_type: str = "application/json") -> Dict[str, str]:
        return {"Authorization": f"Bearer {META_WHATSAPP_TOKEN}", "Content-Type": content_type}

    def _endpoint(self, phone_number_id: str, suffix: str = "messages") -> str:
        return f"https://graph.facebook.com/{META_WA_API_VERSION}/{phone_number_id}/{suffix}"

    def _post(self, url: str, json_payload: Optional[Dict] = None, files: Optional[Dict] = None, headers: Optional[Dict] = None):
        try:
            resp = requests.post(url, headers=headers, json=json_payload, files=files, timeout=60)
            status = resp.status_code
            text = resp.text
            print(f"DEBUG: POST {url} status={status} body={text[:400]}")
            resp.raise_for_status()
            return {"status": "sucesso", "raw": resp.json(), "http_status": status}
        except Exception as e:
            print(f"ERROR: POST {url}: {e}")
            print(traceback.format_exc())
            return {"status": "erro", "erro": str(e), "http_status": getattr(e, 'response', None).status_code if hasattr(e, 'response') and e.response else None}

    def _upload_media(self, phone_number_id: str, media_base64: str, mime_type: str) -> Dict[str, Any]:
        """Uploads media (base64) to WhatsApp returning media id."""
        if not META_WHATSAPP_TOKEN:
            return {"status": "erro", "erro": "META_WHATSAPP_TOKEN ausente"}
        try:
            binary = base64.b64decode(media_base64)
        except Exception as e:
            return {"status": "erro", "erro": f"Base64 inválido: {e}"}
        url = self._endpoint(phone_number_id, suffix="media")
        headers = {"Authorization": f"Bearer {META_WHATSAPP_TOKEN}"}
        data = {"messaging_product": "whatsapp"}
        files = {
            "file": ("upload", binary, mime_type)
        }

        try:
            resp = requests.post(url, headers=headers, data=data, files=files, timeout=60)
            print(f"DEBUG: Upload mídia status={resp.status_code} resp={resp.text[:400]}")
            resp.raise_for_status()
            data = resp.json()
            return {"status": "sucesso", "media_id": data.get('id'), "raw": data}
        except Exception as e:
            print(f"ERROR: upload_media: {e}")
            print(traceback.format_exc())
            return {"status": "erro", "erro": str(e)}

    def send_text(self, phone_number_id: str, to: str, body: str) -> Dict[str, Any]:
        if not META_WHATSAPP_TOKEN:
            return {"status": "erro", "erro": "META_WHATSAPP_TOKEN ausente"}
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {"preview_url": False, "body": body}
        }
        url = self._endpoint(phone_number_id)
        return self._post(url, json_payload=payload, headers=self._api_headers())

    def send_image(self, phone_number_id: str, to: str, image_url: Optional[str] = None, image_base64: Optional[str] = None, caption: Optional[str] = None, mime_type: str = "image/jpeg") -> Dict[str, Any]:
        if not META_WHATSAPP_TOKEN:
            return {"status": "erro", "erro": "META_WHATSAPP_TOKEN ausente"}
        if bool(image_url) == bool(image_base64):
            return {"status": "erro", "erro": "Forneça apenas um: image_url OU image_base64"}
        media_id = None
        strategy = None
        if image_base64:
            upload = self._upload_media(phone_number_id, image_base64, mime_type)
            if upload.get("status") != "sucesso":
                return {"status": "erro", "erro": f"Falha upload: {upload.get('erro')}", "detalhes": upload}
            media_id = upload.get("media_id")
            strategy = "upload"
        else:
            strategy = "link"
        payload: Dict[str, Any] = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "image",
            "image": {}
        }
        if media_id:
            payload["image"]["id"] = media_id
        if image_url:
            payload["image"]["link"] = image_url
        if caption:
            payload["image"]["caption"] = caption[:1024]
        url = self._endpoint(phone_number_id)
        result = self._post(url, json_payload=payload, headers=self._api_headers())
        result.update({"media_strategy": strategy, "media_id": media_id})
        return result

    def send_message(self, phone_number_id: str, to: str, body: str):
        if not META_WHATSAPP_TOKEN:
            return {"warning": "META_WHATSAPP_TOKEN ausente"}
        url = f"https://graph.facebook.com/{META_WA_API_VERSION}/{phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {"preview_url": False, "body": body}
        }
        headers = {"Authorization": f"Bearer {META_WHATSAPP_TOKEN}", "Content-Type": "application/json"}
        try:
            print(f"DEBUG: Enviando mensagem WhatsApp para {to}")
            print(f"DEBUG: WhatsApp request body: {payload}")
            r = requests.post(url, headers=headers, json=payload, timeout=30)
            print(f"DEBUG: Status envio WhatsApp: {r.status_code} - {r.text}")
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"ERROR: send_message WhatsApp: {e}")
            print(traceback.format_exc())
            return {"error": str(e)}

    def mark_message_as_read(self, phone_number_id: str, message_id: str):
        """
        Mark a WhatsApp message as read
        """
        if not META_WHATSAPP_TOKEN:
            return {"warning": "META_WHATSAPP_TOKEN ausente"}
            
        url = f"https://graph.facebook.com/{META_WA_API_VERSION}/{phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id
        }
        headers = {"Authorization": f"Bearer {META_WHATSAPP_TOKEN}", "Content-Type": "application/json"}
        
        try:
            print(f"DEBUG: Marcando mensagem como lida - ID: {message_id}")
            r = requests.post(url, headers=headers, json=payload, timeout=30)
            print(f"DEBUG: Status confirmação de leitura: {r.status_code} - {r.text}")
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"ERROR: mark_message_as_read: {e}")
            print(traceback.format_exc())
            return {"error": str(e)}

    def send_typing_indicator(self, phone_number_id: str, to: str, message_id: str):
        """
        Mark message as read and send typing indicator to show the bot is typing
        """
        if not META_WHATSAPP_TOKEN:
            return {"warning": "META_WHATSAPP_TOKEN ausente"}
            
        url = f"https://graph.facebook.com/{META_WA_API_VERSION}/{phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id,
            "typing_indicator": {
                "type": "text"
            }
        }
        headers = {"Authorization": f"Bearer {META_WHATSAPP_TOKEN}", "Content-Type": "application/json"}
        
        try:
            print(f"DEBUG: Marcando como lida e enviando indicador de digitação para {to}")
            r = requests.post(url, headers=headers, json=payload, timeout=30)
            print(f"DEBUG: Status read + typing: {r.status_code} - {r.text}")
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"ERROR: send_typing_indicator: {e}")
            print(traceback.format_exc())
            return {"error": str(e)}

    def acknowledge_and_type(self, phone_number_id: str, to: str, message_id: str):
        """
        Convenience method to mark message as read and show typing indicator
        """
        return self.send_typing_indicator(phone_number_id, to, message_id)

    def extract_messages_from_webhook(self, payload: Dict[str, Any]) -> List[IncomingWhatsAppMessage]:
        results: List[IncomingWhatsAppMessage] = []
        try:
            for entry in payload.get("entry", []):
                for ch in entry.get("changes", []):
                    value = ch.get("value", {})
                    metadata = value.get("metadata", {})
                    phone_number_id = metadata.get("phone_number_id")
                    contacts = value.get("contacts", [])
                    name = None
                    wa_id_contact = None
                    if contacts:
                        contact = contacts[0]
                        name = contact.get("profile", {}).get("name")
                        wa_id_contact = contact.get("wa_id")
                    
                    for msg in value.get("messages", []):
                        msg_type = msg.get("type")
                        text_body = None
                        image_data = None
                        audio_data = None
                        file_data = None
                        is_unsupported_type = False
                        
                        # Lista de tipos suportados
                        supported_types = ["text", "image", "audio", "voice", "document"]
                        
                        if msg_type == "text":
                            text_body = msg.get("text", {}).get("body")
                        elif msg_type == "image":
                            # Extract image information
                            image_info = msg.get("image", {})
                            image_data = {
                                "id": image_info.get("id"),
                                "mime_type": image_info.get("mime_type"),
                                "sha256": image_info.get("sha256")
                            }
                            # Set a default text for image messages
                            text_body = "[Imagem enviada]"
                            print(f"DEBUG: Imagem recebida - ID: {image_data['id']}, MIME: {image_data['mime_type']}")
                        elif msg_type == "audio":
                            # Extract audio information
                            audio_info = msg.get("audio", {})
                            audio_data = {
                                "id": audio_info.get("id"),
                                "mime_type": audio_info.get("mime_type", "audio/ogg"),  # WhatsApp usually sends ogg
                                "sha256": audio_info.get("sha256")
                            }
                            # Set a default text for audio messages
                            text_body = "[Áudio enviado]"
                            print(f"DEBUG: Áudio recebido - ID: {audio_data['id']}, MIME: {audio_data['mime_type']}")
                        elif msg_type == "voice":
                            # Voice messages are similar to audio but different type
                            voice_info = msg.get("voice", {})
                            audio_data = {
                                "id": voice_info.get("id"),
                                "mime_type": voice_info.get("mime_type", "audio/ogg"),
                                "sha256": voice_info.get("sha256")
                            }
                            text_body = "[Mensagem de voz enviada]"
                            print(f"DEBUG: Mensagem de voz recebida - ID: {audio_data['id']}, MIME: {audio_data['mime_type']}")
                        elif msg_type == "document":
                            # Extract document/file information
                            doc_info = msg.get("document", {})
                            file_data = {
                                "id": doc_info.get("id"),
                                "mime_type": doc_info.get("mime_type"),
                                "sha256": doc_info.get("sha256"),
                                "filename": doc_info.get("filename", "arquivo")
                            }
                            # Set a default text for document messages
                            text_body = f"[Arquivo enviado: {file_data['filename']}]"
                            print(f"DEBUG: Documento recebido - ID: {file_data['id']}, Nome: {file_data['filename']}, MIME: {file_data['mime_type']}")
                        elif msg_type == "video":
                            # Vídeos não são suportados pelo OpenAI
                            text_body = "[Vídeo não suportado]"
                            is_unsupported_type = True
                            print(f"DEBUG: Tipo de mensagem não suportado: vídeo")
                        elif msg_type == "sticker":
                            # Stickers não são suportados
                            text_body = "[Sticker não suportado]"
                            is_unsupported_type = True
                            print(f"DEBUG: Tipo de mensagem não suportado: sticker")
                        elif msg_type == "location":
                            # Localização não é suportada
                            text_body = "[Localização não suportada]"
                            is_unsupported_type = True
                            print(f"DEBUG: Tipo de mensagem não suportado: localização")
                        elif msg_type == "contacts":
                            # Contatos não são suportados
                            text_body = "[Contato não suportado]"
                            is_unsupported_type = True
                            print(f"DEBUG: Tipo de mensagem não suportado: contatos")
                        elif msg_type not in supported_types:
                            # Qualquer outro tipo não suportado
                            text_body = f"[Tipo de mensagem não suportado: {msg_type}]"
                            is_unsupported_type = True
                            print(f"DEBUG: Tipo de mensagem não suportado: {msg_type}")
                        
                        # Skip messages we can't handle (mas agora temos fallback para tipos não suportados)
                        if not text_body and not image_data and not audio_data and not file_data and not is_unsupported_type:
                            print(f"DEBUG: Mensagem vazia ou inválida, tipo: {msg_type}")
                            continue
                            
                        # Create message object
                        incoming_message = IncomingWhatsAppMessage(
                            wa_id=wa_id_contact or msg.get("from"),
                            from_id=msg.get("from"),
                            text=text_body or "",
                            phone_number_id=phone_number_id,
                            name=name,
                            timestamp=msg.get("timestamp"),
                            message_id=msg.get("id"),  # Capture message ID for read receipts
                            raw_message=msg,
                            message_type=msg_type,
                            image_data=image_data,
                            audio_data=audio_data,
                            file_data=file_data,
                            is_unsupported_type=is_unsupported_type
                        )
                        
                        # Automatically mark as read and show typing indicator
                        if phone_number_id and msg.get("id") and msg.get("from"):
                            self.acknowledge_and_type(phone_number_id, msg.get("from"), msg.get("id"))
                        
                        results.append(incoming_message)
        except Exception as e:
            print(f"ERROR: extract_messages_from_webhook: {e}")
            print(traceback.format_exc())
        print(f"DEBUG: Mensagens extraídas do webhook: {len(results)}")
        return results
