import json
from urllib import error, request

from django.conf import settings


class AIServiceError(RuntimeError):
    """Raised when the configured NVIDIA-hosted model cannot return a response."""


def generate_text(prompt: str, *, temperature: float = 0.2, max_tokens: int = 2048) -> str:
    """Call NVIDIA NIM's OpenAI-compatible chat-completions endpoint."""
    api_key = getattr(settings, "NVIDIA_API_KEY", "").strip()
    if not api_key:
        raise AIServiceError("NVIDIA_API_KEY is not configured on the server.")

    base_url = getattr(settings, "NVIDIA_API_BASE_URL", "").rstrip("/")
    model = getattr(settings, "NVIDIA_NEMOTRON_MODEL", "").strip()
    if not base_url or not model:
        raise AIServiceError("The NVIDIA API endpoint or model is not configured.")

    payload = json.dumps(
        {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
            # The app needs concise final text/JSON, not a hidden reasoning trace.
            "chat_template_kwargs": {"enable_thinking": False},
        }
    ).encode("utf-8")
    api_request = request.Request(
        f"{base_url}/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(api_request, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = ""
        try:
            body = json.loads(exc.read().decode("utf-8"))
            api_error = body.get("error", {}) if isinstance(body, dict) else {}
            detail = body.get("detail", "") if isinstance(body, dict) else ""
            if not detail and isinstance(api_error, dict):
                detail = api_error.get("message", "")
            elif not detail and isinstance(api_error, str):
                detail = api_error
        except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
            pass
        suffix = f": {detail}" if isinstance(detail, str) and detail else ""
        raise AIServiceError(f"NVIDIA API request failed ({exc.code}){suffix}") from exc
    except (error.URLError, TimeoutError) as exc:
        raise AIServiceError("Could not reach the NVIDIA API.") from exc
    except json.JSONDecodeError as exc:
        raise AIServiceError("The NVIDIA API returned an invalid response.") from exc

    try:
        content = result["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise AIServiceError("The NVIDIA API returned no generated text.") from exc
    if not isinstance(content, str) or not content.strip():
        raise AIServiceError("The NVIDIA API returned no generated text.")
    return content.strip()
