require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { OpenAI } = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');

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

// URL de Veneauto
const URL = 'https://www.veneautoloans.com/inventory/';

// Función para scrapear vehículos en tiempo real
async function obtenerVehiculos() {
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);

        let vehiculos = [];

        $('.inventory-item').each((i, elem) => {
            const modelo = $(elem).find('.title').text().trim();
            const precio = $(elem).find('.price').text().trim();
            const kilometraje = $(elem).find('.mileage').text().trim();
            const transmision = $(elem).find('.transmission').text().trim();

            vehiculos.push({
                modelo,
                precio,
                kilometraje,
                transmision
            });
        });

        return vehiculos;
    } catch (error) {
        console.error('Error al scrapear:', error);
        return [];
    }
}

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

    // Si el usuario pregunta por los vehículos disponibles
    if (message.body.toLowerCase().includes('vehículos disponibles')) {
        const vehiculos = await obtenerVehiculos();
        if (vehiculos.length > 0) {
            let respuesta = '🚗 Vehículos disponibles en Veneauto:\n\n';
            vehiculos.slice(0, 5).forEach((v, index) => {
                respuesta += `${index + 1}. ${v.modelo}\nPrecio: ${v.precio}\nKilometraje: ${v.kilometraje}\nTransmisión: ${v.transmision}\n\n`;
            });
            await message.reply(respuesta);
        } else {
            await message.reply('❌ No pude encontrar vehículos disponibles en este momento.');
        }
        return;
    }

    // Para cualquier otro mensaje, usar ChatGPT como vendedor de carros
    try {
        const respuesta = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'Eres un asesor de ventas de autos experto y amable que trabaja para la empresa Veneauto. Tu objetivo es ayudar a los clientes a encontrar el vehículo ideal según sus necesidades. Siempre mencionas que perteneces a Veneauto. Respondes de manera breve, entusiasta y profesional. Ofreces opciones, resaltas los beneficios de los autos y transmites confianza. Utilizas un tono positivo y motivador en tus respuestas.' },
                { role: 'user', content: message.body }
            ],
        });

        const respuestaTexto = respuesta.choices[0].message.content.trim();

        console.log('Respuesta de ChatGPT:', respuestaTexto);

        await message.reply(respuestaTexto);

    } catch (error) {
        console.error('Error al consultar ChatGPT:', error);
        await message.reply('❌ Ocurrió un error al generar la respuesta.');
    }
});

// Iniciar cliente
client.initialize();
