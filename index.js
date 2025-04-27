require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { OpenAI } = require('openai');

// Inicializar cliente de WhatsApp con sesión persistente en 'auth_session'
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './auth_session'
    })
});

// Inicializar cliente de OpenAI (ChatGPT)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Mostrar QR si es necesario
client.on('qr', (qr) => {
    console.log('Escanea este QR con tu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Mensaje cuando WhatsApp esté listo
client.on('ready', () => {
    console.log('¡Conexión a WhatsApp exitosa!');
});

// Escuchar mensajes entrantes
client.on('message', async (message) => {
    console.log('Mensaje recibido:', message.body);

    try {
        // Enviar el mensaje a ChatGPT
        const respuesta = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Eres un asistente de WhatsApp amigable y experto en tecnología. Responde de forma breve, clara y alegre.' },
                { role: 'user', content: message.body }
            ],
        });

        // Tomar la respuesta generada
        const respuestaTexto = respuesta.choices[0].message.content.trim();

        console.log('Respuesta de ChatGPT:', respuestaTexto);

        // Responder en WhatsApp
        await message.reply(respuestaTexto);

    } catch (error) {
        console.error('Error al consultar ChatGPT:', error);
        await message.reply('❌ Ocurrió un error al generar la respuesta.');
    }
});

// Iniciar cliente
client.initialize();
