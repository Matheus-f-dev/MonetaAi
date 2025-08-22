import json
from typing import Any, Dict, List

def parse_sns_event(event: Dict[str, Any]) -> List[dict]:
    payloads = []
    records = event.get("Records", [])
    for rec in records:
        sns_obj = rec.get("Sns", {})
        message_str = sns_obj.get("Message")
        if not message_str:
            continue
        try:
            payload = json.loads(message_str)
            payloads.append(payload)
        except json.JSONDecodeError:
            print(f"WARN: Falha ao decodificar SNS Message como JSON: {message_str[:200]}")
    print(f"DEBUG: parse_sns_event encontrou {len(payloads)} payload(s)")
    return payloads
