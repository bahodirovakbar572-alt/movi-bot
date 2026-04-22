import { Telegraf, Markup, Context } from 'telegraf';
import http from 'http';
import fs from 'fs';
import 'dotenv/config';

// 1. Ma'lumotlar uchun turlarni (Interface) e'lon qilamiz
interface Movie {
    code: string;
    url: string;
    title: string;
}

const PORT: number = Number(process.env.PORT) || 7777;
const CHANNEL_ID: string = '@infortx_movichanel';
const TOKEN: string = '8695736758:AAEnpkPEvlktCZemLXgHXjaIs5hDsWbdbQ4';

const bot = new Telegraf(TOKEN);

// 2. JSON fayldan ma'lumotlarni o'qish (Qaytarish tipi: Movie[])
function getMovies(): Movie[] {
    try {
        const data = fs.readFileSync('./movie.json', 'utf8');
        return JSON.parse(data) as Movie[];
    } catch (err) {
        console.error("JSON o'qishda xato:", err);
        return [];
    }
}

// 3. Obunani tekshirish funksiyasi
async function checkSub(ctx: Context): Promise<boolean> {
    if (!ctx.from) return false;
    try {
        const res = await ctx.telegram.getChatMember(CHANNEL_ID, ctx.from.id);
        const statuslar = ['creator', 'administrator', 'member'];
        return statuslar.includes(res.status);
    } catch (e) {
        console.error("Obunani tekshirishda xato:", e);
        return false;
    }
}

bot.start(async (ctx: Context) => {
    const subscribed = await checkSub(ctx);
    if (!subscribed) {
        const channelLink = `https://t.me/${CHANNEL_ID.replace('@', '')}`;
        return ctx.reply(
            `👋 Salom! Botdan foydalanish uchun kanalga a'zo bo'ling.`,
            Markup.inlineKeyboard([
                [Markup.button.url("Kanalga o'tish", channelLink)],
                [Markup.button.callback('✅ Tasdiqlash', 'verify')]
            ])
        );
    }
    ctx.reply('🎬 Kino kodini yuboring:');
});

bot.on('text', async (ctx: Context) => {
    // TypeScript-da xabarni tekshirish
    if (!('text' in ctx.message!) || ctx.message.text === '/start') return;

    const movieCode = ctx.message.text;
    const movieDatabase: Movie[] = getMovies();
    const movie = movieDatabase.find((m: Movie) => m.code === movieCode);

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

bot.action('verify', async (ctx: Context) => {
    if (await checkSub(ctx)) {
        try {
            await ctx.deleteMessage();
        } catch (e) {
            console.error("Xabarni o'chirishda xato");
        }
        ctx.reply('✅ Rahmat! Kino kodini yuboring.');
    } else {
        await ctx.answerCbQuery("❌ A'zo emassiz!", { show_alert: true });
    }
});

// Portni band qilish (Node.js HTTP server TS-da)
http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
    res.writeHead(200);
    res.end('Bot is running');
}).listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishlamoqda`);
});

bot.launch();
console.log('Bot muvaffaqiyatli ishga tushdi!');

// git add . && git commit -m "update" && git push