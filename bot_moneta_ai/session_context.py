from typing import Optional, Dict
from utils.models import IncomingWhatsAppMessage
import threading

class SessionContext:
    """In-memory context to map account/user identifiers to WhatsApp routing data.
    Designed to be simple and easily replaceable by persistent storage later.
    Thread-safe via internal lock.
    """
    def __init__(self):
        self._lock = threading.RLock()
        self._by_account_id: Dict[str, Dict] = {}
        self._by_wa_id: Dict[str, Dict] = {}

    def update_from_incoming(self, msg: IncomingWhatsAppMessage):
        """Registers / refreshes minimal routing info using the wa_id and phone_number_id.
        Account binding may be added later when available.
        """
        if not msg or not msg.wa_id:
            return
        with self._lock:
            wa_entry = self._by_wa_id.get(msg.wa_id, {})
            wa_entry.update({
                'wa_id': msg.wa_id,
                'phone_number_id': msg.phone_number_id,
                'name': msg.name,
                'last_message_id': msg.message_id,
                'last_timestamp': msg.timestamp
            })
            self._by_wa_id[msg.wa_id] = wa_entry
            # If already bound to an account_id, reflect in account map
            account_id = wa_entry.get('account_id')
            if account_id:
                acct = self._by_account_id.get(account_id, {})
                acct.update(wa_entry)
                self._by_account_id[account_id] = acct

    def bind_account(self, account_id: str, wa_id: str):
        """Bind an account_id to an existing wa_id entry. Safe if called multiple times."""
        if not account_id or not wa_id:
            return
        with self._lock:
            wa_entry = self._by_wa_id.get(wa_id)
            if not wa_entry:
                wa_entry = {'wa_id': wa_id}
                self._by_wa_id[wa_id] = wa_entry
            wa_entry['account_id'] = account_id
            acct = self._by_account_id.get(account_id, {})
            acct.update(wa_entry)
            self._by_account_id[account_id] = acct

    def get_account_context(self, account_id: str) -> Optional[Dict]:
        with self._lock:
            return self._by_account_id.get(account_id)

    def get_wa_context(self, wa_id: str) -> Optional[Dict]:
        with self._lock:
            return self._by_wa_id.get(wa_id)

# Global instance
session_context = SessionContext()
