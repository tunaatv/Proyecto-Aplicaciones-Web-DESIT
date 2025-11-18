import os
from pathlib import Path

# ==========================
# Rutas base
# ==========================
BASE_DIR = Path(__file__).resolve().parent.parent

# ==========================
# Variables básicas
# ==========================

# En Render define SECRET_KEY en Environment
SECRET_KEY = os.environ.get(
    "SECRET_KEY",
    "-_&+lsebec(whhw!%n@ww&1j=4-^j_if9x8$q778+99oz&!ms2",  # solo para desarrollo local
)

# Por defecto False en producción, True en local si no se define
DEBUG = os.environ.get("DEBUG", "False") == "True"

# ALLOWED_HOSTS desde env, con valores por defecto válidos
ALLOWED_HOSTS = os.environ.get(
    "ALLOWED_HOSTS",
    "localhost,127.0.0.1,proyecto-aplicaciones-web-desit.onrender.com",
).split(",")

# ==========================
# Aplicaciones instaladas
# ==========================
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "django_filters",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",

    "control_escolar_desit_api",
]

# ==========================
# Middleware
# ==========================
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    # Whitenoise para archivos estáticos en Render
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",

    # CORS SIEMPRE antes de CommonMiddleware
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# ==========================
# CORS
# ==========================

# Si pones CORS_ALLOWED_ORIGINS en Render, se usa; si no, se abre para todos
cors_env = os.environ.get("CORS_ALLOWED_ORIGINS")
if cors_env:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        origin.strip() for origin in cors_env.split(",") if origin.strip()
    ]
else:
    # Más sencillo mientras pruebas: todo permitido
    CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True

# ==========================
# URLs y plantillas
# ==========================
ROOT_URLCONF = "control_escolar_desit_api.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "control_escolar_desit_api.wsgi.application"

# ==========================
# Base de datos
# ==========================

# Si existe la variable RENDER (en Render la pusimos a "1"), usamos SQLite
if os.environ.get("RENDER"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    # Configuración local con MySQL usando my.cnf
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.mysql",
            "OPTIONS": {
                "read_default_file": os.path.join(BASE_DIR, "my.cnf"),
                "charset": "utf8mb4",
            },
        }
    }

# ==========================
# Password validators
# ==========================
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ==========================
# Internacionalización
# ==========================
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_L10N = True
USE_TZ = True

# ==========================
# Archivos estáticos y media
# ==========================
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# ==========================
# DRF
# ==========================
REST_FRAMEWORK = {
    "COERCE_DECIMAL_TO_STRING": False,
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework.authentication.SessionAuthentication",
        "control_escolar_desit_api.models.BearerTokenAuthentication",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
}
