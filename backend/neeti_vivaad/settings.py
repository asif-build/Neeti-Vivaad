import os
from pathlib import Path
from datetime import timedelta
import dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
dotenv.load_dotenv(BASE_DIR / '.env')
dotenv.load_dotenv(BASE_DIR.parent / '.env')
dotenv.load_dotenv()

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-neeti-vivaad-sih2026-mospi-secret-key-key-12345')

DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')

allowed_hosts_env = os.getenv('ALLOWED_HOSTS')
if allowed_hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['*'] if DEBUG else ['localhost', '127.0.0.1']


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'corsheaders',
    
    # Neeti Vivaad Domain apps
    'core',
    'courses',
    'assessment',
    'debate',
    'dashboard',
    'buddy',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'neeti_vivaad.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'neeti_vivaad.wsgi.application'

# Database Configuration: SQLite default, PostgreSQL if DB_HOST configured
if os.getenv('DB_HOST'):
    DATABASES = {
        'default': {
            'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.postgresql'),
            'NAME': os.getenv('DB_NAME', 'neeti_vivaad'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
            'HOST': os.getenv('DB_HOST', 'db'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Custom User Model
AUTH_USER_MODEL = 'core.User'

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        'OPTIONS': {
            'user_attributes': ('username', 'email', 'first_name', 'last_name'),
            'max_similarity': 0.7,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
    ),
    'DEFAULT_THROTTLE_CLASSES': (
        'core.throttling.AuthenticatedUserThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        # Authentication
        'login_ip': os.getenv('THROTTLE_LOGIN_IP', '5/minute'),
        'login_account': os.getenv('THROTTLE_LOGIN_ACCOUNT', '10/hour'),
        'register_ip': os.getenv('THROTTLE_REGISTER_IP', '5/hour'),
        'verify_ip': os.getenv('THROTTLE_VERIFY_IP', '5/hour'),
        'resend_verify_account': os.getenv('THROTTLE_RESEND_VERIFY_ACC', '5/hour'),
        'resend_verify_ip': os.getenv('THROTTLE_RESEND_VERIFY_IP', '5/hour'),
        'password_reset_account': os.getenv('THROTTLE_PW_RESET_ACC', '5/hour'),
        'password_reset_ip': os.getenv('THROTTLE_PW_RESET_IP', '5/hour'),

        # Public / Read
        'public_catalogue': os.getenv('THROTTLE_PUBLIC_CATALOGUE', '120/minute'),
        'public_scenario': os.getenv('THROTTLE_PUBLIC_SCENARIO', '120/minute'),
        'user_normal_api': os.getenv('THROTTLE_USER_NORMAL_API', '120/minute'),

        # User Actions & AI
        'resume_upload': os.getenv('THROTTLE_RESUME_UPLOAD', '5/hour'),
        'resume_processing': os.getenv('THROTTLE_RESUME_PROC', '3/hour'),
        'course_recommendation': os.getenv('THROTTLE_COURSE_REC', '20/hour'),
        'knowledge_check_gen': os.getenv('THROTTLE_QUIZ_GEN', '10/hour'),
        'quiz_submission': os.getenv('THROTTLE_QUIZ_SUB', '30/minute'),
        'vivaad_scenario_gen': os.getenv('THROTTLE_VIVAAD_GEN', '10/hour'),
        'vivaad_decision': os.getenv('THROTTLE_VIVAAD_DEC', '20/hour'),
        'buddy': os.getenv('THROTTLE_BUDDY', '60/minute'),

        # Support & Reviews
        'support_ip': os.getenv('THROTTLE_SUPPORT_IP', '5/hour'),
        'support_email': os.getenv('THROTTLE_SUPPORT_EMAIL', '10/day'),
        'review_user': os.getenv('THROTTLE_REVIEW_USER', '1/day'),
        'review_ip': os.getenv('THROTTLE_REVIEW_IP', '5/hour'),

        # Admin
        'admin_ai_gen': os.getenv('THROTTLE_ADMIN_AI_GEN', '60/hour'),
        'admin_bulk': os.getenv('THROTTLE_ADMIN_BULK', '30/minute'),
    },
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

# Google reCAPTCHA v3 Configuration (Secret key is STRICTLY backend-only)
RECAPTCHA_ENABLED = os.getenv('RECAPTCHA_ENABLED', 'False').lower() in ('true', '1', 't')
RECAPTCHA_SITE_KEY = os.getenv('RECAPTCHA_SITE_KEY', '')
RECAPTCHA_SECRET_KEY = os.getenv('RECAPTCHA_SECRET_KEY', '')
RECAPTCHA_SCORE_THRESHOLD = float(os.getenv('RECAPTCHA_SCORE_THRESHOLD', '0.5'))

# Email Lifecycle Configuration (Gmail SMTP)
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend' if os.getenv('EMAIL_HOST_PASSWORD') else 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'neetisaarthi@gmail.com')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'Neeti Saarthi <neetisaarthi@gmail.com>')
SUPPORT_EMAIL = os.getenv('SUPPORT_EMAIL', 'neetisaarthi@gmail.com')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
SEND_POST_VERIFICATION_EMAIL = os.getenv('SEND_POST_VERIFICATION_EMAIL', 'True').lower() in ('true', '1', 't')

# Security Hardening & Headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Production-only SSL and Cookie Security Settings (Conditional on DEBUG)
if not DEBUG:
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1', 't')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    if not os.getenv('DJANGO_SECRET_KEY'):
        import warnings
        warnings.warn("DJANGO_SECRET_KEY environment variable is not set in production!")

# Support & Contact Configuration (Server-Side Recipient Lock)
SUPPORT_EMAIL = os.getenv('SUPPORT_EMAIL', 'neetisaarthi@gmail.com')

# Bot Protection (Google reCAPTCHA v3)
RECAPTCHA_SECRET_KEY = os.getenv('RECAPTCHA_SECRET_KEY', '')
RECAPTCHA_ENABLED = os.getenv('RECAPTCHA_ENABLED', 'False' if DEBUG else 'True').lower() in ('true', '1', 't')
RECAPTCHA_MIN_SCORE = float(os.getenv('RECAPTCHA_MIN_SCORE', os.getenv('RECAPTCHA_SCORE_THRESHOLD', '0.5')))
RECAPTCHA_SCORE_THRESHOLD = RECAPTCHA_MIN_SCORE  # Backwards compatibility alias
RECAPTCHA_ALLOWED_HOSTNAMES = [h.strip() for h in os.getenv('RECAPTCHA_ALLOWED_HOSTNAMES', '').split(',') if h.strip()]

