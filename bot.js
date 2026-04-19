const { Telegraf, Markup } = require('telegraf');
const path = require('path');
const fs = require('fs');
const http = require('http'); // Port uchun kerak
require('dotenv').config();

// Port sozlamasi
const PORT = 7777;

// Tokenni shu yerga qo'ying (yoki .env dan oling)
const bot = new Telegraf('8695736758:AAEnpkPEvlktCZemLXgHXjaIs5hDsWbdbQ4'); 

const movieDatabase = [
    { code: '1', fileName: '1.mp4', title: 'Qasoskorlar' }
];

const CHANNEL_ID = '@infortx_movichanel';

async function checkSub(ctx) {
    try {
        const res = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from.id);
        return ['creator', 'administrator', 'member'].includes(res.status);
    } catch (e) {
        return false;
    }
}

bot.start(async (ctx) => {
    const subscribed = await checkSub(ctx);
    
    if (!subscribed) {
        return ctx.reply(
            `👋 Salom! Botdan foydalanish uchun kanalga a'zo bo'ling.`,
            Markup.inlineKeyboard([
                [Markup.button.url("Kanalga o'tish", `https://t.me/${CHANNEL_ID.replace('@', '')}`)],
                [Markup.button.callback('✅ Tasdiqlash', 'verify')]
            ])
        );
    }
    ctx.reply('🎬 Kino kodini yuboring:');
});

bot.on('text', async (ctx) => {
    if (ctx.message.text === '/start') return;
    
    const movie = movieDatabase.find(m => m.code === ctx.message.text);
    if (movie) {
        const videoPath = path.join(__dirname, 'movie', movie.fileName);
        if (fs.existsSync(videoPath)) {
            await ctx.replyWithVideo({ source: videoPath }, { caption: movie.title });
        } else {
            ctx.reply('❌ Video topilmadi.');
        }
    } else {
        ctx.reply('❌ Kod noto\'g\'ri.');
    }
});

bot.action('verify', async (ctx) => {
    if (await checkSub(ctx)) {
        await ctx.deleteMessage();
        ctx.reply('✅ Rahmat! Kino kodini yuboring.');
    } else {
        await ctx.answerCbQuery("❌ A'zo emassiz!", { show_alert: true });
    }
});

// Portni band qilish va botni ishga tushirish
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running');
}).listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishlamoqda`);
});

bot.launch();
console.log('Bot muvaffaqiyatli ishladi!');