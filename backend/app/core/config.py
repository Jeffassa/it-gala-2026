from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720
    DATABASE_URL: str = "postgresql+psycopg://gala:gala@localhost:5432/gala"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    CORS_ORIGIN_REGEX: str = (
        r"^https?://("
        r"localhost|"
        r"127\.0\.0\.1|"
        r"10(?:\.\d{1,3}){3}|"
        r"192\.168(?:\.\d{1,3}){2}|"
        r"172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}"
        r")(?::\d+)?$"
    )

    MAIL_FROM: str = "onboarding@resend.dev"
    MAIL_FROM_NAME: str = "IT Gala 2026"
    MAIL_HOST: str = ""
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_TLS: bool = True
    MAIL_DEBUG: bool = True

    # Resend API (port 443 → fonctionne sur Render free)
    RESEND_API_KEY: str = ""

    # Frontend URL for password reset links
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    def validate_security(self):
        if self.SECRET_KEY == "dev-secret-change-me":
            # Only allow default secret if we are clearly in a local dev environment
            if (
                "localhost" not in self.DATABASE_URL
                and "127.0.0.1" not in self.DATABASE_URL
            ):
                raise ValueError("SECRET_KEY must be changed for production!")


settings = Settings()
settings.validate_security()
