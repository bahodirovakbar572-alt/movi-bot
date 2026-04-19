const { Telegraf, Markup } = require('telegraf');
const http = require('http');
const fs = require('fs'); // Fayllarni o'qish uchun
require('dotenv').config();

const PORT = 7777;
const bot = new Telegraf('8695736758:AAEnpkPEvlktCZemLXgHXjaIs5hDsWbdbQ4');

// JSON fayldan ma'lumotlarni o'qish funksiyasi
function getMovies() {
    try {
        const data = fs.readFileSync('./movie.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("JSON o'qishda xato:", err);
        return [];
    }
}

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

    // Har gal xabar kelganda JSON dan oxirgi ma'lumotlarni olamiz
    const movieDatabase = getMovies();
    const movie = movieDatabase.find(m => m.code === ctx.message.text);

    if (movie) {
        try {
            await ctx.replyWithVideo(movie.url, { caption: movie.title });
        } catch (error) {
            console.error('Video yuborishda xato:', error);
            ctx.reply('❌ Video yuborishda xatolik yuz berdi.');
        }
    } else {
        ctx.reply('❌ Bunday kodli kino topilmadi.');
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

// Portni band qilish
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running');
}).listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishlamoqda`);
});

bot.launch();
console.log('Bot muvaffaqiyatli ishga tushdi!');