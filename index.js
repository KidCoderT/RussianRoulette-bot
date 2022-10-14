import bot from "./src/bot.js";
import dotenv from 'dotenv';
dotenv.config()

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

bot(TOKEN, CLIENT_ID)