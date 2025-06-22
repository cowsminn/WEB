const { Pool } = require('pg');

// Configurația bazei de date
const dbConfig = {
    user: 'electrodelicii_user',
    host: 'localhost',
    database: 'electrodelicii_db',
    password: 'electrodelicii_pass123',
    port: 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

// Pool de conexiuni
const pool = new Pool(dbConfig);

// Event handlers pentru pool
pool.on('error', (err, client) => {
    console.error('Eroare neașteptată în pool-ul de conexiuni:', err);
    process.exit(-1);
});

// Funcție pentru testarea conexiunii
async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('Conectare reușită la baza de date PostgreSQL:', result.rows[0].now);
        client.release();
        return true;
    } catch (err) {
        console.error('Eroare la conectarea la baza de date:', err);
        return false;
    }
}

// Funcții pentru operații cu produse
async function getAllProducts() {
    try {
        const result = await pool.query(`
            SELECT id, nume, descriere, imagine, categorie_mare, tip_prezentare, 
                   pret, dimensiune, data_introducere, culoare, 
                   caracteristici_speciale, garantie, created_at, updated_at
            FROM produse 
            ORDER BY id ASC
        `);
        return result.rows;
    } catch (err) {
        console.error('Eroare la încărcarea produselor:', err);
        throw err;
    }
}

async function getProductById(id) {
    try {
        const result = await pool.query(`
            SELECT id, nume, descriere, imagine, categorie_mare, tip_prezentare, 
                   pret, dimensiune, data_introducere, culoare, 
                   caracteristici_speciale, garantie, created_at, updated_at
            FROM produse 
            WHERE id = $1
        `, [id]);
        return result.rows[0] || null;
    } catch (err) {
        console.error('Eroare la încărcarea produsului:', err);
        throw err;
    }
}

async function getProductsByCategory(category) {
    try {
        const result = await pool.query(`
            SELECT id, nume, descriere, imagine, categorie_mare, tip_prezentare, 
                   pret, dimensiune, data_introducere, culoare, 
                   caracteristici_speciale, garantie, created_at, updated_at
            FROM produse 
            WHERE categorie_mare = $1
            ORDER BY id ASC
        `, [category]);
        return result.rows;
    } catch (err) {
        console.error('Eroare la încărcarea produselor din categoria:', category, err);
        throw err;
    }
}

async function getCategories() {
    try {
        const result = await pool.query(`
            SELECT unnest(enum_range(NULL::categorie_mare)) as categorie
        `);
        return result.rows.map(row => row.categorie);
    } catch (err) {
        console.error('Eroare la încărcarea categoriilor:', err);
        throw err;
    }
}

async function getColors() {
    try {
        const result = await pool.query(`
            SELECT unnest(enum_range(NULL::culoare_produs)) as culoare
        `);
        return result.rows.map(row => row.culoare);
    } catch (err) {
        console.error('Eroare la încărcarea culorilor:', err);
        throw err;
    }
}

// Funcție pentru închiderea pool-ului (cleanup)
async function closePool() {
    await pool.end();
}

module.exports = {
    pool,
    testConnection,
    getAllProducts,
    getProductById,
    getProductsByCategory,
    getCategories,
    getColors,
    closePool
};
