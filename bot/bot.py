import logging
import asyncio
import os
from dotenv import load_dotenv
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

load_dotenv(override=False)

TOKEN = os.getenv("TOKEN", "bot_token")
WEB_APP_URL = os.getenv("WEB_APP_URL", "https://google.com")

logging.basicConfig(level=logging.INFO)

bot = Bot(token=TOKEN)
dp = Dispatcher()


@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    web_app_button = InlineKeyboardButton(
        text="Смотреть раскидки", web_app=WebAppInfo(url=WEB_APP_URL)
    )
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[web_app_button]])

    await message.answer(
        "Нажмите кнопку ниже, чтобы открыть наш сайт", reply_markup=keyboard
    )


async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())