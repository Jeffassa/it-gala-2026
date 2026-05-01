from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720
    DATABASE_URL: str = "postgresql+psycopg://gala:gala@localhost:5432/gala"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    MAIL_FROM: str = "no-reply@gala.it"
    MAIL_FROM_NAME: str = "Gala IT Awards"
    MAIL_HOST: str = ""
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_TLS: bool = True
    MAIL_DEBUG: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
