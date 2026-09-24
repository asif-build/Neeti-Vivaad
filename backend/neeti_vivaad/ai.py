import json
import logging
import os
from urllib import error, request

from django.conf import settings

logger = logging.getLogger(__name__)


class AIServiceError(RuntimeError):
    """Raised when the configured AI model cannot return a response."""


def _call_gemini(prompt: str, api_key: str, model: str, temperature: float, max_tokens: int) -> str:
    """Invoke Google Gemini REST API directly."""
    clean_model = model or "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent?key={api_key}"
    payload_dict = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens
        }
    }
    api_request = request.Request(
        url,
        data=json.dumps(payload_dict).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with request.urlopen(api_request, timeout=45) as response:
        data = json.loads(response.read().decode("utf-8"))
        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts and "text" in parts[0]:
                return parts[0]["text"].strip()
    raise AIServiceError("Gemini returned no generated text.")


def _call_openai_compatible(prompt: str, api_key: str, base_url: str, model: str, temperature: float, max_tokens: int) -> str:
    """Invoke OpenRouter, NVIDIA NIM, or OpenAI-compatible endpoint."""
    clean_base = base_url.rstrip("/") or "https://openrouter.ai/api/v1"
    clean_model = model or "openrouter/free"

    payload_dict = {
        "model": clean_model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    if "nvidia" in clean_base.lower() and "openrouter" not in clean_base.lower():
        payload_dict["chat_template_kwargs"] = {"enable_thinking": False}

    api_request = request.Request(
        f"{clean_base}/chat/completions",
        data=json.dumps(payload_dict).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "HTTP-Referer": "https://neetisaarthi.gov.in",
            "X-Title": "Neeti Saarthi",
        },
        method="POST",
    )

    with request.urlopen(api_request, timeout=60) as response:
        result = json.loads(response.read().decode("utf-8"))

    choice = result.get("choices", [{}])[0]
    message_obj = choice.get("message", {})
    content = message_obj.get("content") or ""
    if not content and "text" in choice:
        content = choice["text"]
    if not content and message_obj.get("reasoning"):
        content = message_obj["reasoning"]

    if not isinstance(content, str) or not content.strip():
        raise AIServiceError("The AI endpoint returned an empty completion.")
    return content.strip()


def generate_text(prompt: str, *, temperature: float = 0.2, max_tokens: int = 2048) -> str:
    """
    Production-grade resilient text generation supporting:
    1. Google Gemini API (GEMINI_API_KEY)
    2. OpenRouter / NVIDIA NIM (OPENROUTER_API_KEY, NVIDIA_API_KEY)
    Gracefully handles timeouts, rate limits, and fallback between providers.
    """
    gemini_key = getattr(settings, "GEMINI_API_KEY", "").strip() or os.getenv("GEMINI_API_KEY", "").strip()
    gemini_model = getattr(settings, "GEMINI_MODEL", "").strip() or os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()

    openai_key = (
        getattr(settings, "OPENROUTER_API_KEY", "").strip()
        or getattr(settings, "NVIDIA_API_KEY", "").strip()
        or os.getenv("OPENROUTER_API_KEY", "").strip()
        or os.getenv("NVIDIA_API_KEY", "").strip()
    )
    openai_base = getattr(settings, "NVIDIA_API_BASE_URL", "").strip() or os.getenv("NVIDIA_API_BASE_URL", "https://openrouter.ai/api/v1")
    openai_model = getattr(settings, "NVIDIA_NEMOTRON_MODEL", "").strip() or os.getenv("NVIDIA_NEMOTRON_MODEL", "openrouter/free")

    if not gemini_key and not openai_key:
        raise AIServiceError("No AI API key is configured. Please provide GEMINI_API_KEY or OPENROUTER_API_KEY.")

    # Try Gemini first if configured
    if gemini_key:
        try:
            return _call_gemini(prompt, gemini_key, gemini_model, temperature, max_tokens)
        except Exception as exc:
            logger.warning("Gemini API call failed (%s). Attempting fallback if available.", type(exc).__name__)
            if not openai_key:
                raise AIServiceError("The AI service is temporarily unavailable. Please try again shortly.") from exc

    # Try OpenRouter / NVIDIA NIM
    if openai_key:
        try:
            return _call_openai_compatible(prompt, openai_key, openai_base, openai_model, temperature, max_tokens)
        except Exception as exc:
            logger.error("AI API request failed: %s", type(exc).__name__)
            raise AIServiceError("The AI service encountered a temporary error. Please try again shortly.") from exc

    raise AIServiceError("Failed to generate response from configured AI models.")
