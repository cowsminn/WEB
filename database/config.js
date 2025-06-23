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

async function getPriceRange() {
    try {
        const result = await pool.query(`
            SELECT MIN(pret) as min_pret, MAX(pret) as max_pret
            FROM produse
            WHERE pret IS NOT NULL
        `);
        
        const minPrice = result.rows[0].min_pret;
        const maxPrice = result.rows[0].max_pret;
        
        if (minPrice === null || maxPrice === null) {
            return { min: 0, max: 0 };
        }
        
        return {
            min: Math.floor(parseFloat(minPrice)),
            max: Math.ceil(parseFloat(maxPrice))
        };
    } catch (err) {
        console.error('Eroare la încărcarea intervalului de prețuri:', err);
        throw err;
    }
}

// Funcții pentru atribute dinamice ale input-urilor
async function getProductNames() {
    try {
        const result = await pool.query(`
            SELECT DISTINCT nume FROM produse ORDER BY nume ASC
        `);
        return result.rows.map(row => row.nume);
    } catch (err) {
        console.error('Eroare la încărcarea numelor de produse:', err);
        throw err;
    }
}

async function getDimensions() {
    try {
        const result = await pool.query(`
            SELECT DISTINCT dimensiune FROM produse 
            WHERE dimensiune IS NOT NULL 
            ORDER BY dimensiune ASC
        `);
        return result.rows.map(row => row.dimensiune);
    } catch (err) {
        console.error('Eroare la încărcarea dimensiunilor:', err);
        throw err;
    }
}

async function getGuarantees() {
    try {
        const result = await pool.query(`
            SELECT DISTINCT garantie FROM produse 
            WHERE garantie IS NOT NULL 
            ORDER BY garantie ASC
        `);
        return result.rows.map(row => row.garantie);
    } catch (err) {
        console.error('Eroare la încărcarea garanțiilor:', err);
        throw err;
    }
}

async function getDateRange() {
    try {
        const result = await pool.query(`
            SELECT MIN(data_introducere) as min_date, MAX(data_introducere) as max_date
            FROM produse
            WHERE data_introducere IS NOT NULL
        `);
        
        const minDate = result.rows[0].min_date;
        const maxDate = result.rows[0].max_date;
        
        if (minDate === null || maxDate === null) {
            return { min: '2020-01-01', max: '2024-12-31' };
        }
        
        return {
            min: minDate.toISOString().split('T')[0],
            max: maxDate.toISOString().split('T')[0]
        };
    } catch (err) {
        console.error('Eroare la încărcarea intervalului de date:', err);
        throw err;
    }
}

async function getSpecialCharacteristics() {
    try {
        const result = await pool.query(`
            SELECT DISTINCT caracteristici_speciale FROM produse 
            WHERE caracteristici_speciale IS NOT NULL 
            ORDER BY caracteristici_speciale ASC
        `);
        return result.rows.map(row => row.caracteristici_speciale);
    } catch (err) {
        console.error('Eroare la încărcarea caracteristicilor speciale:', err);
        throw err;
    }
}

async function getProductNameLengthRange() {
    try {
        const result = await pool.query(`
            SELECT MIN(LENGTH(nume)) as min_length, MAX(LENGTH(nume)) as max_length
            FROM produse
        `);
        
        return {
            min: result.rows[0].min_length || 1,
            max: result.rows[0].max_length || 100
        };
    } catch (err) {
        console.error('Eroare la calcularea lungimii numelor:', err);
        throw err;
    }
}

// Funcție pentru a obține toate atributele dinamice pentru pagina produse
async function getDynamicAttributes() {
    try {
        const [
            priceRange,
            categories,
            colors,
            dimensions,
            guarantees,
            dateRange,
            characteristics,
            nameLengthRange
        ] = await Promise.all([
            getPriceRange(),
            getCategories(),
            getColors(),
            getDimensions(),
            getGuarantees(),
            getDateRange(),
            getSpecialCharacteristics(),
            getProductNameLengthRange()
        ]);

        return {
            priceRange,
            categories,
            colors,
            dimensions,
            guarantees,
            dateRange,
            characteristics,
            nameLengthRange
        };
    } catch (err) {
        console.error('Eroare la încărcarea atributelor dinamice:', err);
        throw err;
    }
}

async function getSimilarProducts(productId, category, price, limit = 4) {
    try {
        // Calculate price range (±30% of current product price)
        const priceMin = price * 0.7;
        const priceMax = price * 1.3;
        
        const result = await pool.query(`
            SELECT id, nume, descriere, imagine, categorie_mare, pret, culoare, garantie
            FROM produse 
            WHERE categorie_mare = $1 
            AND id != $2 
            AND pret BETWEEN $3 AND $4
            ORDER BY 
                ABS(pret - $5) ASC,  -- Order by price similarity first
                RANDOM()             -- Then random for variety
            LIMIT $6
        `, [category, productId, priceMin, priceMax, price, limit]);
        
        // If we don't have enough similar products, get more from same category
        if (result.rows.length < limit) {
            const additionalResult = await pool.query(`
                SELECT id, nume, descriere, imagine, categorie_mare, pret, culoare, garantie
                FROM produse 
                WHERE categorie_mare = $1 
                AND id != $2 
                AND id NOT IN (${result.rows.map((_, i) => `$${i + 3}`).join(',') || 'NULL'})
                ORDER BY RANDOM()
                LIMIT $${result.rows.length + 3}
            `, [category, productId, ...result.rows.map(row => row.id), limit - result.rows.length]);
            
            result.rows = result.rows.concat(additionalResult.rows);
        }
        
        return result.rows;
    } catch (err) {
        console.error('Eroare la încărcarea produselor similare:', err);
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
    getPriceRange,
    getProductNames,
    getDimensions,
    getGuarantees,
    getDateRange,
    getSpecialCharacteristics,
    getProductNameLengthRange,
    getDynamicAttributes,
    getSimilarProducts,
    closePool
};
