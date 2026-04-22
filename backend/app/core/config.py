import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    @property
    def database_url(self) -> str:
        url = os.getenv("DATABASE_URL")
        if not url:
            raise ValueError("DATABASE_URL must be set in the environment")
        return url

    @property
    def secret_key(self) -> str:
        key = os.getenv("SECRET_KEY")
        if not key:
            raise ValueError("SECRET_KEY must be set in the environment")
        return key

    @property
    def access_token_expire_minutes(self) -> int:
        value = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
        return int(value)

    @property
    def frontend_url(self) -> str:
        return os.getenv("FRONTEND_URL", "http://localhost:5173")


settings = Settings()
