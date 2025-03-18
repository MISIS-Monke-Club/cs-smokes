import logging
import asyncio
import os

from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from aiogram.filters import CommandStart
from aiogram.fsm.storage.memory import MemoryStorage

# Getting environment variables from .env file
load_dotenv(override=False)

TOKEN = os.getenv("TOKEN", "bot_token")
WEB_APP_URL = os.getenv("WEB_APP_URL", "https://google.com")

logging.basicConfig(level=logging.INFO)

bot = Bot(token=TOKEN)
dp = Dispatcher(storage=MemoryStorage())


@dp.message(CommandStart())
async def start(message: types.Message):
    init_data = message.web_app_data.data if message.web_app_data else ""
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть веб-приложение",
                    web_app=WebAppInfo(url=f"{WEB_APP_URL}?initData={init_data}"),
                )
            ]
        ]
    )
    await message.answer(
        "Нажми на кнопочку ниже и посмотри все интересующие тебя смоки:",
        reply_markup=keyboard,
    )


async def on_startup():
    logging.info("Бот запущен!")


async def main():
    await on_startup()
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
