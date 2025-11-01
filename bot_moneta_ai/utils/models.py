from dataclasses import dataclass
from typing import Any, List, Dict, Optional

@dataclass
class IncomingWhatsAppMessage:
    wa_id: str
    from_id: str
    text: str
    phone_number_id: str
    name: Optional[str] = None
    timestamp: Optional[str] = None
    message_id: Optional[str] = None  # WhatsApp message ID for read receipts
    raw_message: Optional[Dict[str, Any]] = None
    message_type: str = "text"
    image_data: Optional[Dict[str, Any]] = None  # Contains image info (id, mime_type, sha256)
    audio_data: Optional[Dict[str, Any]] = None  # Contains audio info (id, mime_type, sha256)
    file_data: Optional[Dict[str, Any]] = None   # Contains file info (id, mime_type, sha256, filename)
    is_unsupported_type: bool = False  # Flag to indicate if message type is not supported

@dataclass
class ConversationResult:
    response: Optional[str]
    chat_history: List[Dict[str, Any]]
    error: Optional[str] = None
    traceback: Optional[str] = None
