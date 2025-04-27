const axios = require('axios');
const cheerio = require('cheerio');

// URL de la página que quieres scrapear
const URL = 'https://www.veneautoloans.com/inventory/'; // <-- Cambia esto a la URL real

async function obtenerVehiculos() {
    try {
        const { data } = await axios.get(URL);
        const $ = cheerio.load(data);

        let vehiculos = [];

        // Aquí depende del HTML de la página web
        // Voy a hacer un ejemplo general:
        $('.vehiculo-card').each((i, elem) => {
            const marca = $(elem).find('.marca').text().trim();
            const modelo = $(elem).find('.modelo').text().trim();
            const precio = $(elem).find('.precio').text().trim();
            const descripcion = $(elem).find('.descripcion').text().trim();

            vehiculos.push({ marca, modelo, precio, descripcion });
        });

        return vehiculos;
    } catch (error) {
        console.error('Error al scrapear:', error);
        return [];
    }
}
