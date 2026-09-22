import logging
import hashlib
import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"
GENERIC_VERIFY_ERROR = "We couldn't verify this request. Please try again."

# Optional per-action minimum score thresholds
ACTION_MIN_SCORES = {
    'register': 0.5,
    'login': 0.5,
    'password_reset': 0.5,
    'resend_verification': 0.5,
    'contact_support': 0.5,
    'submit_review': 0.5,
    'resume_upload': 0.5,
    'generate_quiz': 0.5,
    'start_vivaad': 0.5,
    'submit_vivaad_decision': 0.5,
}

def get_allowed_hostnames():
    configured = getattr(settings, 'RECAPTCHA_ALLOWED_HOSTNAMES', None)
    if configured:
        return set(configured)
    
    # Fallback to ALLOWED_HOSTS if specified
    allowed = set()
    for host in getattr(settings, 'ALLOWED_HOSTS', []):
        clean = host.strip().lstrip('.').split(':')[0]
        if clean and clean != '*':
            allowed.add(clean.lower())
    
    # Always allow local dev hostnames
    allowed.update({'localhost', '127.0.0.1', 'testserver'})
    return allowed

def verify_recaptcha(request, expected_action: str, min_score: float | None = None) -> tuple[bool, str | None]:
    """
    Production-grade Google reCAPTCHA v3 backend verification.

    Enforces:
    1. RECAPTCHA_ENABLED toggle (default False in local dev only when explicitly configured).
    2. Token presence from request body ('recaptcha_token' / 'captcha_token') or header ('X-Recaptcha-Token').
    3. Single-use token enforcement via memory cache (rejects duplicate / replayed tokens).
    4. Safe 5-second timeout call to Google's siteverify endpoint without logging tokens or secrets.
    5. Success verification.
    6. Action matching (prevents token harvested on low-risk page being replayed on sensitive action).
    7. Hostname verification against allowed hosts.
    8. Configurable score verification against RECAPTCHA_MIN_SCORE (default 0.5 or per-action).
    9. Generic, human-readable user messaging on any verification failure.
    """
    is_enabled = getattr(settings, 'RECAPTCHA_ENABLED', False)
    if not is_enabled:
        return True, None

    secret_key = getattr(settings, 'RECAPTCHA_SECRET_KEY', '')
    if not secret_key:
        logger.warning("RECAPTCHA_ENABLED is True but RECAPTCHA_SECRET_KEY is not configured.")
        # If in production without a key, do not bypass silently
        if not getattr(settings, 'DEBUG', False):
            return False, GENERIC_VERIFY_ERROR
        return True, None

    # 1. Retrieve token
    token = None
    if hasattr(request, 'data') and isinstance(request.data, dict):
        token = request.data.get('recaptcha_token') or request.data.get('captcha_token')
    
    if not token and hasattr(request, 'POST'):
        token = request.POST.get('recaptcha_token') or request.POST.get('captcha_token')

    if not token and hasattr(request, 'headers'):
        token = request.headers.get('X-Recaptcha-Token')

    if not token:
        logger.info(f"reCAPTCHA token missing for action '{expected_action}'")
        return False, GENERIC_VERIFY_ERROR

    # 2. Reject duplicate tokens (Single-use defense)
    token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
    cache_key = f"recaptcha_used:{token_hash}"
    if not cache.add(cache_key, True, timeout=180):
        logger.warning(f"Duplicate or replayed reCAPTCHA token detected for action '{expected_action}'")
        return False, GENERIC_VERIFY_ERROR

    # 3. Extract remote IP
    remote_ip = ''
    if hasattr(request, 'META'):
        remote_ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR', '')

    # 4. Verify against Google siteverify endpoint with safe timeout
    try:
        response = requests.post(
            RECAPTCHA_VERIFY_URL,
            data={
                'secret': secret_key,
                'response': token,
                'remoteip': remote_ip
            },
            timeout=5
        )
        data = response.json()
    except requests.exceptions.Timeout:
        logger.error(f"reCAPTCHA verification timed out for action '{expected_action}'")
        return False, GENERIC_VERIFY_ERROR
    except requests.exceptions.RequestException as exc:
        logger.error(f"reCAPTCHA network error for action '{expected_action}': {exc.__class__.__name__}")
        return False, GENERIC_VERIFY_ERROR
    except Exception as exc:
        logger.error(f"reCAPTCHA unexpected error during verification: {exc.__class__.__name__}")
        return False, GENERIC_VERIFY_ERROR

    # 5. Verify success
    success = data.get('success', False)
    if not success:
        error_codes = data.get('error-codes', [])
        logger.warning(f"reCAPTCHA rejected token for action '{expected_action}'. Google error codes: {error_codes}")
        return False, GENERIC_VERIFY_ERROR

    # 6. Verify expected action
    returned_action = data.get('action')
    if returned_action and expected_action and returned_action != expected_action:
        logger.warning(f"reCAPTCHA action mismatch: expected '{expected_action}', got '{returned_action}'")
        return False, GENERIC_VERIFY_ERROR

    # 7. Verify hostname
    returned_hostname = data.get('hostname')
    if returned_hostname:
        clean_hostname = returned_hostname.strip().lower().split(':')[0]
        allowed_hostnames = get_allowed_hostnames()
        if allowed_hostnames and clean_hostname not in allowed_hostnames:
            logger.warning(f"reCAPTCHA hostname mismatch: '{clean_hostname}' not in allowed {allowed_hostnames}")
            return False, GENERIC_VERIFY_ERROR

    # 8. Verify score
    score = data.get('score', 0.0)
    required_score = min_score
    if required_score is None:
        required_score = ACTION_MIN_SCORES.get(
            expected_action,
            getattr(settings, 'RECAPTCHA_MIN_SCORE', getattr(settings, 'RECAPTCHA_SCORE_THRESHOLD', 0.5))
        )

    if score < required_score:
        logger.warning(f"reCAPTCHA score {score} is below required {required_score} for action '{expected_action}'")
        return False, GENERIC_VERIFY_ERROR

    return True, None
