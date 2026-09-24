import os
from pathlib import Path
from datetime import timedelta
import dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
dotenv.load_dotenv(BASE_DIR / '.env')
dotenv.load_dotenv(BASE_DIR.parent / '.env')
dotenv.load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY') or os.getenv('DJANGO_SECRET_KEY', 'django-insecure-neeti-vivaad-sih2026-mospi-secret-key-key-12345')

DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')

allowed_hosts_env = os.getenv('ALLOWED_HOSTS')
if allowed_hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in allowed_hosts_env.split(',') if h.strip()]
else:
    ALLOWED_HOSTS = ['*'] if DEBUG else ['.onrender.com', 'localhost', '127.0.0.1']


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
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
    'whitenoise.middleware.WhiteNoiseMiddleware',
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

# Database Configuration (Supabase PostgreSQL via DATABASE_URL, local PG via DB_HOST, or SQLite fallback)
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=True if ('supabase' in DATABASE_URL or not DEBUG) else False,
        )
    }
elif os.getenv('DB_HOST'):
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

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage" if not DEBUG else "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

from corsheaders.defaults import default_headers

# CORS & CSRF Configuration
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = list(default_headers) + [
    'x-recaptcha-token',
    'x-user-role',
    'recaptcha_token',
    'captcha_token',
]

FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
APP_BASE_URL = os.getenv('APP_BASE_URL', FRONTEND_URL)

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^http://localhost:\d+$",
        r"^http://127\.0\.0\.1:\d+$",
        r"^http://192\.168\.\d+\.\d+:\d+$",
        r"^http://10\.\d+\.\d+\.\d+:\d+$",
    ]
else:
    CORS_ALLOW_ALL_ORIGINS = False
    cors_allowed = [
        h.strip() for h in os.getenv('CORS_ALLOWED_ORIGINS', '').split(',') if h.strip()
    ]
    if FRONTEND_URL and FRONTEND_URL.rstrip('/') not in cors_allowed:
        cors_allowed.append(FRONTEND_URL.rstrip('/'))
    if APP_BASE_URL and APP_BASE_URL.rstrip('/') not in cors_allowed:
        cors_allowed.append(APP_BASE_URL.rstrip('/'))
    CORS_ALLOWED_ORIGINS = cors_allowed
    CORS_ALLOWED_ORIGIN_REGEXES = [
        r"^https://[\w-]+\.vercel\.app$",
        r"^https://[\w-]+\.onrender\.com$",
    ]

# CSRF Trusted Origins
csrf_trusted = [
    h.strip() for h in os.getenv('CSRF_TRUSTED_ORIGINS', '').split(',') if h.strip()
]
if FRONTEND_URL and FRONTEND_URL.rstrip('/') not in csrf_trusted:
    csrf_trusted.append(FRONTEND_URL.rstrip('/'))
if APP_BASE_URL and APP_BASE_URL.rstrip('/') not in csrf_trusted:
    csrf_trusted.append(APP_BASE_URL.rstrip('/'))
CSRF_TRUSTED_ORIGINS = csrf_trusted or [
    'https://*.vercel.app',
    'https://*.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
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

# AI Integration Configuration (Gemini & OpenRouter / NVIDIA)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
NVIDIA_API_KEY = os.getenv('NVIDIA_API_KEY', '') or OPENROUTER_API_KEY
NVIDIA_API_BASE_URL = os.getenv('NVIDIA_API_BASE_URL', 'https://openrouter.ai/api/v1')
NVIDIA_NEMOTRON_MODEL = os.getenv('NVIDIA_NEMOTRON_MODEL', 'openrouter/free')

# Google reCAPTCHA v3 Configuration (Secret key is STRICTLY backend-only)
RECAPTCHA_ENABLED = os.getenv('RECAPTCHA_ENABLED', 'False' if DEBUG else 'True').lower() in ('true', '1', 't')
RECAPTCHA_SITE_KEY = os.getenv('RECAPTCHA_SITE_KEY', '')
RECAPTCHA_SECRET_KEY = os.getenv('RECAPTCHA_SECRET_KEY', '')
RECAPTCHA_MIN_SCORE = float(os.getenv('RECAPTCHA_MIN_SCORE', '0.5'))
RECAPTCHA_SCORE_THRESHOLD = RECAPTCHA_MIN_SCORE
RECAPTCHA_ALLOWED_HOSTNAMES = [h.strip() for h in os.getenv('RECAPTCHA_ALLOWED_HOSTNAMES', '').split(',') if h.strip()]

# Email Lifecycle Configuration (Gmail SMTP)
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend' if os.getenv('EMAIL_HOST_PASSWORD') else 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'neetisaarthi@gmail.com')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'Neeti Saarthi <neetisaarthi@gmail.com>')
SUPPORT_EMAIL = os.getenv('SUPPORT_EMAIL', 'neetisaarthi@gmail.com')
SEND_POST_VERIFICATION_EMAIL = os.getenv('SEND_POST_VERIFICATION_EMAIL', 'True').lower() in ('true', '1', 't')

# Security Hardening & Headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1', 't')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
