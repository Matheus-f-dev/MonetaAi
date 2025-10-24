import os
import requests
import traceback
import base64
import io
import time
from typing import List, Dict, Any
from tools_manager import tools_manager

class OpenAIClient:
    def __init__(self):
        self.api_key = os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        self.api_url = "https://api.openai.com/v1/chat/completions"
        self.whisper_url = "https://api.openai.com/v1/audio/transcriptions"
        self.model = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")  # Default to vision-capable model
        self.max_tokens = int(os.environ.get("OPENAI_MAX_COMPLETION_TOKENS", "2048"))
        self.temperature = float(os.environ.get("OPENAI_TEMPERATURE", "1"))
        self.transcribe_model = os.environ.get("TRANSCRIBE_MODEL", "gpt-4o-transcribe")
        self.transcribe_language = os.environ.get("TRANSCRIBE_LANGUAGE", "pt")
        self.transcribe_prompt = os.environ.get("TRANSCRIBE_PROMPT")  # optional biasing prompt
        self.transcribe_timeout = int(os.environ.get("TRANSCRIBE_TIMEOUT", "60"))
        self.enable_transcribe_postprocess = os.environ.get("TRANSCRIBE_POSTPROCESS", "False") not in ("0", "false", "False")

    def load_system_prompt(self, file_name: str = 'system_prompt.txt') -> str:
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            # Volta um nível (services -> root)
            root_dir = os.path.dirname(script_dir)
            system_file_path = os.path.join(root_dir, file_name)
            print(f"DEBUG: Carregando system prompt de: {system_file_path}")
            with open(system_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                print(f"DEBUG: System prompt carregado. Tamanho: {len(content)}")
                return content
        except Exception as e:
            print(f"ERROR: Falha ao carregar system prompt: {e}")
            print(traceback.format_exc())
            return ""

    def make_request(self, messages: List[Dict[str, Any]]):
        try:
            print(f"DEBUG: OpenAI request com {len(messages)} mensagens")
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {self.api_key}"}
            payload = {
                "model": self.model,
                "messages": messages,
                "response_format": {"type": "text"},
                "tools": tools_manager.get_openai_tools(),
                "temperature": self.temperature,
                "max_completion_tokens": self.max_tokens,
                "top_p": 1,
                "frequency_penalty": 0,
                "presence_penalty": 0
            }
            print(f"DEBUG: OpenAI request body: {payload}")
            resp = requests.post(self.api_url, headers=headers, json=payload)
            print(f"DEBUG: OpenAI status {resp.status_code}")
            data = resp.json()
            print(f"DEBUG: OpenAI JSON: {data}")
            resp.raise_for_status()
            return data
        except Exception as e:
            print(f"ERROR: make_request OpenAI: {e}")
            print(traceback.format_exc())
            raise

    def transcribe_audio(self, audio_base64: str, mime_type: str) -> str:
        """
        Transcreve áudio usando modelo configurável (default gpt-4o-transcribe) com fallback automático para whisper-1.
        Variáveis suportadas:
          - TRANSCRIBE_MODEL (default gpt-4o-transcribe)
          - TRANSCRIBE_LANGUAGE (default pt)
          - TRANSCRIBE_PROMPT (opcional)
          - TRANSCRIBE_TIMEOUT (default 60)
          - TRANSCRIBE_POSTPROCESS (default 1 = ativa normalização leve)
        """
        try:
            print(f"DEBUG: Iniciando transcrição de áudio. Modelo primário={self.transcribe_model}")
            started = time.time()
            # Decode base64 audio
            audio_data = base64.b64decode(audio_base64)

            # Mapear extensão
            mime_map = {
                "audio/ogg": "ogg",
                "audio/opus": "ogg",
                "audio/mp3": "mp3",
                "audio/mpeg": "mp3",
                "audio/wav": "wav",
                "audio/x-wav": "wav",
                "audio/m4a": "m4a",
                "audio/x-m4a": "m4a",
            }
            file_extension = mime_map.get(mime_type, "ogg")

            headers = {"Authorization": f"Bearer {self.api_key}"}

            def _attempt(model: str):
                files = {
                    'file': (f'audio.{file_extension}', io.BytesIO(audio_data), mime_type),
                    'model': (None, model),
                    'language': (None, self.transcribe_language)
                }
                if self.transcribe_prompt:
                    files['prompt'] = (None, self.transcribe_prompt)
                print(f"DEBUG: Enviando {len(audio_data)} bytes para transcrição com modelo={model}")
                resp = requests.post(self.whisper_url, headers=headers, files=files, timeout=self.transcribe_timeout)
                print(f"DEBUG: API STT status {resp.status_code} (model={model})")
                data = {}
                try:
                    data = resp.json()
                except Exception:
                    pass
                if resp.status_code != 200:
                    # Levanta para permitir fallback
                    raise RuntimeError(f"Falha transcrição ({model}): {resp.status_code} {data}")
                transcription = data.get('text', '').strip()
                return transcription

            primary_model = self.transcribe_model
            fallback_model = "whisper-1" if primary_model != "whisper-1" else None
            error_primary = None
            transcription = ""
            try:
                transcription = _attempt(primary_model)
            except Exception as e:
                error_primary = e
                print(f"WARN: Falha modelo primário {primary_model}: {e}")

            if (not transcription) and fallback_model:
                try:
                    print(f"DEBUG: Tentando fallback para {fallback_model}")
                    transcription = _attempt(fallback_model)
                    if transcription:
                        print(f"DEBUG: Fallback bem sucedido ({fallback_model})")
                except Exception as e2:
                    print(f"ERROR: Falha também no fallback {fallback_model}: {e2}")
                    if error_primary:
                        # Relevanta erro original para debug geral
                        raise error_primary
                    raise e2

            if not transcription:
                transcription = "[Áudio sem conteúdo transcritível]"

            # Pós-processamento leve
            if self.enable_transcribe_postprocess and transcription and not transcription.startswith("["):
                t = transcription.strip()
                if t and t[0].islower():
                    t = t[0].upper() + t[1:]
                if len(t) > 20 and t[-1] not in ".!?…":
                    t += "."
                transcription = t

            elapsed = time.time() - started
            print(f"DEBUG: Transcrição concluída em {elapsed:.2f}s (modelo_final={'fallback:'+fallback_model if (fallback_model and error_primary) else primary_model}) -> '{transcription[:100]}{'...' if len(transcription) > 100 else ''}'")
            return transcription

        except Exception as e:
            print(f"ERROR: transcribe_audio (model={getattr(self, 'transcribe_model', '?')}): {e}")
            print(traceback.format_exc())
            raise

    def create_file_content(self, text: str, file_base64: str, filename: str, mime_type: str) -> List[Dict[str, Any]]:
        """
        Creates OpenAI-compatible content for file messages
        """
        content = []
        
        # Add text if present
        if text and text.strip() and not text.startswith("[Arquivo enviado"):
            content.append({
                "type": "text",
                "text": text
            })
        
        # Add file according to OpenAI API format
        content.append({
            "type": "file",
            "file": {
                "filename": filename,
                "file_data": file_base64
            }
        })
        
        return content
