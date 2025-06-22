const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const sass = require('sass');
const app = express();
const port = 8000;

// Import configurația bazei de date
const AccesBD = require('./module_proprii/accesbd');

// Setează EJS ca motor de template
app.set('view engine', 'ejs');

// Afișarea căilor
console.log('__dirname (calea folderului fișierului):', __dirname);
console.log('__filename (calea completă a fișierului):', __filename);
console.log('process.cwd() (folderul curent de lucru):', process.cwd());

// Verificare dacă sunt la fel
console.log('Sunt __dirname și process.cwd() la fel?', __dirname === process.cwd());

// Vector cu foldere de creat
const vect_foldere = [
    "views",
    "views/pagini", 
    "views/fragmente",
    "src",
    "src/ico",
    "src/css",
    "src/scss",
    "src/video",
    "src/json",
    "src/img",
    "src/img/galerie",
    "src/img/erori",
    "temp",
    "backup"
];

// Creează structura de directoare
const createDirectories = () => {
    for (let folder of vect_foldere) {
        const dirPath = path.join(__dirname, folder);
        if (!fs.existsSync(dirPath)) {
            console.log(`Creating directory: ${dirPath}`);
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
};
createDirectories();

// Variabila globală pentru erori
let obGlobal = {
    obErori: null,
    folderScss: path.join(__dirname, 'src', 'scss'),
    folderCss: path.join(__dirname, 'src', 'css'),
    folderBackup: path.join(__dirname, 'backup')
};

// Funcția pentru inițializarea erorilor
function initErori() {
    try {
        const eroriJsonPath = path.join(__dirname, 'src', 'json', 'erori.json');
        const eroriData = fs.readFileSync(eroriJsonPath, 'utf8');
        const jsonData = JSON.parse(eroriData);
        
        // Procesează datele și setează căile absolute pentru imagini
        const caleAbsoluta = jsonData.cale_baza.startsWith('/') ? jsonData.cale_baza : '/' + jsonData.cale_baza;
        
        const obErori = {
            cale_baza: caleAbsoluta,
            eroare_default: {
                titlu: jsonData.eroare_default.titlu,
                text: jsonData.eroare_default.text,
                imagine: caleAbsoluta + "/" + jsonData.eroare_default.imagine
            },
            info_erori: jsonData.info_erori.map(eroare => ({
                identificator: eroare.identificator,
                status: eroare.status,
                titlu: eroare.titlu,
                text: eroare.text,
                imagine: caleAbsoluta + "/" + eroare.imagine
            }))
        };
        
        obGlobal.obErori = obErori;
        console.log('Configurația erorilor a fost încărcată și procesată din erori.json');
        
    } catch (error) {
        console.log('Nu s-a putut încărca erori.json, folosesc configurația implicită');
        // Fallback la configurația existentă cu căi absolute
        obGlobal.obErori = {
            cale_baza: "/src/img/erori",
            eroare_default: {
                titlu: "Eroare generică",
                text: "A apărut o eroare.",
                imagine: "/src/img/erori/eroare_default.jpg"
            },
            info_erori: [
                {
                    identificator: 404,
                    status: true,
                    titlu: "404 - Pagina nu a fost găsită",
                    text: "Ne pare rău, pagina pe care încercați să o accesați nu există.",
                    imagine: "/src/img/erori/404.jpg"
                }
            ]
        };
    }
}

// Inițializez erorile
initErori();

// Fac obiectul disponibil global
global.obGlobal = obGlobal;

// Funcție actualizată pentru afișarea erorilor
function afisareEroare(res, identificator, titlu, text, imagine) {
    const eroriConfig = global.obGlobal.obErori;
    
    if (identificator) {
        // Caută eroarea specifică în info_erori
        const eroareSpecifica = eroriConfig.info_erori.find(err => err.identificator === identificator);
        if (eroareSpecifica) {
            if (eroareSpecifica.status) {
                res.status(identificator);
            }
            res.render('pagini/eroare', {
                titlu: titlu || eroareSpecifica.titlu,
                text: text || eroareSpecifica.text,
                imagine: imagine || eroareSpecifica.imagine
            });
        } else {
            // Folosește eroarea default dacă nu găsește identificatorul
            res.status(500);
            res.render('pagini/eroare', {
                titlu: titlu || eroriConfig.eroare_default.titlu,
                text: text || eroriConfig.eroare_default.text,
                imagine: imagine || eroriConfig.eroare_default.imagine
            });
        }
    } else {
        // Eroare generică - folosește eroare_default
        res.status(500);
        res.render('pagini/eroare', {
            titlu: titlu || eroriConfig.eroare_default.titlu,
            text: text || eroriConfig.eroare_default.text,
            imagine: imagine || eroriConfig.eroare_default.imagine
        });
    }
}

// Creează un fișier EJS de test dacă nu există
const indexEjsPath = path.join(__dirname, "views", "pagini", "index.ejs");
if (!fs.existsSync(indexEjsPath)) {
    console.log("Creating test index.ejs");
    fs.writeFileSync(indexEjsPath, `<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <h1>Test Page</h1>
    <p>This is a test page.</p>
    <p>Your IP: <%= ip %></p>
</body>
</html>`);
}

// Funcție pentru verificarea intervalului de timp
function verificaInterval(intervalStr, oraTarget) {
    const [oraStart, oraEnd] = intervalStr.split('-');
    const [startOra, startMin] = oraStart.split(':').map(Number);
    const [endOra, endMin] = oraEnd.split(':').map(Number);
    const [targetOra, targetMin] = oraTarget.split(':').map(Number);
    
    const startMinute = startOra * 60 + startMin;
    const endMinute = endOra * 60 + endMin;
    const targetMinute = targetOra * 60 + targetMin;
    
    return targetMinute >= startMinute && targetMinute <= endMinute;
}

// Funcție pentru redimensionarea imaginilor cu Sharp
async function genereazaImaginiResponsive(caleOriginala, numeImagine) {
    const caleGalerie = path.join(__dirname, 'src', 'img', 'galerie');
    const caleMedium = path.join(caleGalerie, 'medium');
    const caleSmall = path.join(caleGalerie, 'small');
    
    const caleCompleta = path.join(caleGalerie, numeImagine);
    const caleMediumCompleta = path.join(caleMedium, numeImagine);
    const caleSmallCompleta = path.join(caleSmall, numeImagine);
    
    try {
        // Verifică dacă imaginea originală există
        if (!fs.existsSync(caleCompleta)) {
            console.log(`Imaginea ${numeImagine} nu există în galerie`);
            return false;
        }
        
        // Generează versiunea medium (300px) dacă nu există
        if (!fs.existsSync(caleMediumCompleta)) {
            await sharp(caleCompleta)
                .resize(300, 300, { fit: 'cover' })
                .jpeg({ quality: 85 })
                .toFile(caleMediumCompleta);
            console.log(`Generată versiunea medium pentru ${numeImagine}`);
        }
        
        // Generează versiunea small (200px) dacă nu există
        if (!fs.existsSync(caleSmallCompleta)) {
            await sharp(caleCompleta)
                .resize(200, 200, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toFile(caleSmallCompleta);
            console.log(`Generată versiunea small pentru ${numeImagine}`);
        }
        
        return true;
    } catch (error) {
        console.error(`Eroare la generarea imaginilor pentru ${numeImagine}:`, error);
        return false;
    }
}

// Funcție pentru încărcarea galeriei
async function incarcaGalerie() {
    try {
        const galerieJsonPath = path.join(__dirname, 'src', 'json', 'galerie.json');
        const galerieData = fs.readFileSync(galerieJsonPath, 'utf8');
        const jsonData = JSON.parse(galerieData);
        
        // Ora curentă pentru filtrare (modifică aici pentru testare)
        // const acum = new Date();
        // Pentru testare, setez o oră specifică:
        const acum = new Date();
        acum.setHours(10, 30, 0, 0); // 10:30 pentru testare
        
        const oraTarget = acum.getHours().toString().padStart(2, '0') + ':' + 
                         acum.getMinutes().toString().padStart(2, '0');
        
        console.log(`Filtrare galerie pentru ora: ${oraTarget}`);
        
        // Filtrează imaginile pe baza intervalului de timp
        const imaginiFiltrate = jsonData.imagini.filter(imagine => 
            verificaInterval(imagine.timp, oraTarget)
        ).slice(0, 10); // Maxim 10 imagini
        
        // Generează imagini responsive pentru fiecare imagine filtrată
        for (const imagine of imaginiFiltrate) {
            await genereazaImaginiResponsive(jsonData.cale_galerie, imagine.cale_imagine);
        }
        
        return {
            cale_galerie: '/' + jsonData.cale_galerie,
            imagini: imaginiFiltrate,
            oraFiltrare: oraTarget
        };
        
    } catch (error) {
        console.error('Eroare la încărcarea galeriei:', error);
        return {
            cale_galerie: '/src/img/galerie',
            imagini: [],
            oraFiltrare: '00:00'
        };
    }
}

// Funcție pentru generarea dinamică a CSS-ului pentru galeria animată
function genereazaCssGalerieAnimata(numarImagini) {
    const caleScss = path.join(__dirname, 'src', 'scss', 'galerie-animata.scss');
    const caleCss = path.join(__dirname, 'src', 'css', 'galerie-animata.css');
    
    try {
        // Compilează SCSS-ul existent care include toate keyframes-urile
        const rezultat = sass.compile(caleScss, {"sourceMap": true});
        
        // Scrie CSS-ul final - SCSS-ul conține deja toate animațiile necesare
        fs.writeFileSync(caleCss, rezultat.css);
        console.log(`CSS galerie animată generat pentru ${numarImagini} imagini`);
        return true;
        
    } catch (error) {
        console.error('Eroare la generarea CSS galerie animată:', error);
        return false;
    }
}

// Funcție pentru încărcarea galeriei animate
async function incarcaGalerieAnimata() {
    try {
        const galerieJsonPath = path.join(__dirname, 'src', 'json', 'galerie.json');
        const galerieData = fs.readFileSync(galerieJsonPath, 'utf8');
        const jsonData = JSON.parse(galerieData);
        
        // Filtrează imaginile care au galerie-animata: true
        const imaginiDisponibile = jsonData.imagini.filter(imagine => 
            imagine['galerie-animata'] === true
        );
        
        // Generează un număr aleator: 9, 12 sau 15
        const numerePosibile = [9, 12, 15];
        const numarAleator = numerePosibile[Math.floor(Math.random() * numerePosibile.length)];
        
        // Limitează numărul de imagini disponibile
        const numarMaxim = Math.min(numarAleator, imaginiDisponibile.length);
        
        // Selectează primele imagini (sunt deja filtrate pentru galerie-animata: true)
        const imaginiSelectate = imaginiDisponibile.slice(0, numarMaxim);
        
        // Generează CSS-ul dinamic pentru acest număr de imagini
        genereazaCssGalerieAnimata(numarMaxim);
        
        console.log(`Galerie animată: ${numarMaxim} imagini selectate`);
        
        return {
            cale_galerie: '/' + jsonData.cale_galerie,
            imagini: imaginiSelectate,
            numarImagini: numarMaxim
        };
        
    } catch (error) {
        console.error('Eroare la încărcarea galeriei animate:', error);
        return {
            cale_galerie: '/src/img/galerie',
            imagini: [],
            numarImagini: 9
        };
    }
}

// Inițializează conexiunea la baza de date
const bd = AccesBD.getInstanta({ init: "electrodelicii" });

// Testarea conexiunii la baza de date la pornirea serverului
bd.testConnection().then(success => {
    if (success) {
        console.log('✅ Conexiunea la baza de date PostgreSQL a fost stabilită');
    } else {
        console.log('❌ Nu s-a putut conecta la baza de date PostgreSQL');
    }
}).catch(err => {
    console.error('Eroare la testarea conexiunii:', err);
});

// Funcții helper pentru operații cu baza de date
async function getAllProducts() {
    return new Promise((resolve, reject) => {
        bd.select({
            tabel: "produse",
            campuri: ["*"],
            conditiiAnd: []
        }, (err, rez) => {
            if (err) reject(err);
            else resolve(rez.rows);
        });
    });
}

async function getProductById(id) {
    return new Promise((resolve, reject) => {
        bd.select({
            tabel: "produse",
            campuri: ["*"],
            conditiiAnd: [`id = ${id}`]
        }, (err, rez) => {
            if (err) reject(err);
            else resolve(rez.rows[0] || null);
        });
    });
}

async function getProductsByCategory(category) {
    return new Promise((resolve, reject) => {
        bd.select({
            tabel: "produse",
            campuri: ["*"],
            conditiiAnd: [`categorie_mare = '${category}'`]
        }, (err, rez) => {
            if (err) reject(err);
            else resolve(rez.rows);
        });
    });
}

async function getCategories() {
    return new Promise((resolve, reject) => {
        bd.query(`SELECT unnest(enum_range(NULL::categorie_mare)) as categorie`, (err, rez) => {
            if (err) reject(err);
            else resolve(rez.rows.map(row => row.categorie));
        });
    });
}

async function getColors() {
    return new Promise((resolve, reject) => {
        bd.query(`SELECT unnest(enum_range(NULL::culoare_produs)) as culoare`, (err, rez) => {
            if (err) reject(err);
            else resolve(rez.rows.map(row => row.culoare));
        });
    });
}

// Funcție pentru maparea culorilor la coduri hex
function getCuloareHex(culoare) {
    const culoriMap = {
        'negru': '#000000',
        'alb': '#FFFFFF',
        'maro': '#8B4513',
        'argintiu': '#C0C0C0',
        'auriu': '#FFD700',
        'rosu': '#FF0000',
        'albastru': '#0000FF',
        'verde': '#008000'
    };
    return culoriMap[culoare] || '#808080';
}

// Rută pentru produse - cu filtrare pe categorii
app.get('/produse', async (req, res) => {
    try {
        const categoria = req.query.categorie;
        let produse;
        let categoriaSelectata = null;
        
        // Încărcă categoriile pentru meniu
        const categorii = await getCategories();
        const culori = await getColors();
        
        if (categoria && categorii.includes(categoria)) {
            produse = await getProductsByCategory(categoria);
            categoriaSelectata = categoria;
        } else {
            produse = await getAllProducts();
        }
        
        res.render('pagini/produse', { 
            ip: req.ip,
            produse: produse,
            categorii: categorii,
            culori: culori,
            categoriaSelectata: categoriaSelectata
        });
    } catch (error) {
        console.log('Eroare la încărcarea produselor:', error.message);
        afisareEroare(res, 500);
    }
});

// Rută pentru produs individual
app.get('/produs/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        if (isNaN(productId)) {
            afisareEroare(res, 404, "Produs negăsit", "ID-ul produsului nu este valid.");
            return;
        }
        
        const produs = await getProductById(productId);
        
        if (!produs) {
            afisareEroare(res, 404, "Produs negăsit", "Produsul căutat nu există în baza de date.");
            return;
        }
        
        // Încărcă categoriile pentru meniu
        const categorii = await getCategories();
        
        res.render('pagini/produs', { 
            ip: req.ip,
            produs: produs,
            categorii: categorii,
            getCuloareHex: getCuloareHex
        });
    } catch (error) {
        console.log('Eroare la încărcarea produsului:', error.message);
        afisareEroare(res, 500);
    }
});

// Middleware pentru adăugarea categoriilor în toate paginile (pentru meniu)
app.use(async (req, res, next) => {
    try {
        if (!res.locals.categorii) {
            res.locals.categorii = await getCategories();
        }
    } catch (error) {
        console.log('Eroare la încărcarea categoriilor pentru meniu:', error.message);
        res.locals.categorii = [];
    }
    next();
});

// Rute de bază (actualizate pentru a include categoriile)
app.get('/', async (req, res) => {
    try {
        const galerie = await incarcaGalerie();
        const categorii = await getCategories();
        res.render('pagini/index', { 
            ip: req.ip,
            galerie: galerie,
            categorii: categorii
        });
    } catch (error) {
        console.log('Eroare la încărcarea paginii principale:', error.message);
        const galerie = await incarcaGalerie();
        res.render('pagini/index', { 
            ip: req.ip,
            galerie: galerie,
            categorii: []
        });
    }
});

app.get(['/index', '/home'], async (req, res) => {
    try {
        const galerie = await incarcaGalerie();
        const categorii = await getCategories();
        res.render('pagini/index', { 
            ip: req.ip,
            galerie: galerie,
            categorii: categorii
        });
    } catch (error) {
        console.log('Eroare la încărcarea paginii principale:', error.message);
        const galerie = await incarcaGalerie();
        res.render('pagini/index', { 
            ip: req.ip,
            galerie: galerie,
            categorii: []
        });
    }
});

// Rută pentru galerie statică - FĂRĂ filtrare pe timp
app.get('/galerie-statica', (req, res) => {
    try {
        const galerieJsonPath = path.join(__dirname, 'src', 'json', 'galerie.json');
        const galerieData = fs.readFileSync(galerieJsonPath, 'utf8');
        const jsonData = JSON.parse(galerieData);
        
        // Returnează TOATE imaginile fără filtrare
        const galerie = {
            cale_galerie: '/' + jsonData.cale_galerie,
            imagini: jsonData.imagini, // Toate imaginile
            oraFiltrare: null
        };
        
        res.render('pagini/galerie-statica', { 
            ip: req.ip,
            galerie: galerie 
        });
    } catch (error) {
        console.log('Eroare la încărcarea galeriei:', error.message);
        afisareEroare(res, 500);
    }
});

// Rută pentru galeria dinamică (animată)
app.get('/galerie-dinamica', async (req, res) => {
    try {
        const galerieAnimata = await incarcaGalerieAnimata();
        res.render('pagini/galerie-dinamica', { 
            ip: req.ip,
            galerieAnimata: galerieAnimata 
        });
    } catch (error) {
        console.log('Eroare la încărcarea galeriei animate:', error.message);
        afisareEroare(res, 500);
    }
});

// Blocare acces direct la fișiere .ejs
// — expresie regulată reală, nu string
app.get(/.*\.ejs$/, (req, res) => {
    afisareEroare(res, 400);
    console.log("Acces interzis la fișier .ejs: ", req.url);
});

// Ruta pentru favicon.ico
app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(__dirname, 'src', 'ico', 'favicon.ico');
    res.sendFile(faviconPath, (err) => {
        if (err) {
            console.log('Favicon nu a putut fi găsit:', err.message);
            res.status(404).end();
        }
    });
});

// Interceptează cererile către foldere din /src/ (fără fișier specificat)
app.get(/^\/src\/.*\/$/, (req, res) => {
    // Cerere către un folder din /src/ - returnează 403 Forbidden
    afisareEroare(res, 403);
    console.log("Acces interzis la folder: ", req.url);
});

// Interceptează cererile către /src fără slash final (foldere fără extensie)
app.get(/^\/src\/[^.]*[^\/]$/, (req, res, next) => {
    // Verifică dacă este cerere către un folder (fără extensie)
    const urlPath = req.url;
    if (!path.extname(urlPath)) {
        // Nu are extensie, probabil este folder - returnează 403
        afisareEroare(res, 403);
        console.log("Acces interzis la folder: ", req.url);
    } else {
        // Are extensie, las middleware-ul static să se ocupe
        next();
    }
});

// Directorul static /src
app.use('/src', express.static(path.join(__dirname, 'src')));

// Rută catch-all pentru pagini dinamice (actualizată)
app.get(/^\/[^.]*$/, async function(req, res){
    try {
        // Pentru pagini care necesită galerie
        const pagineCuGalerie = ['/galerie-statica', '/galerii'];
        let galerie = null;
        let categorii = [];
        
        if (pagineCuGalerie.includes(req.url)) {
            galerie = await incarcaGalerie();
        }
        
        // Încarcă categoriile pentru meniu
        try {
            categorii = await getCategories();
        } catch (dbError) {
            console.log('Nu s-au putut încărca categoriile pentru meniu:', dbError.message);
            categorii = [];
        }
        
        res.render("pagini" + req.url, { 
            galerie: galerie,
            categorii: categorii
        }, function(eroare, rezultatRandare){
            if (eroare) {
                if (eroare.message.startsWith("Failed to lookup view")) {
                    afisareEroare(res, 404);
                    console.log("Nu a gasit pagina: ", req.url);
                } else {
                    afisareEroare(res);
                    console.log("Eroare la randare:", eroare.message);
                }
            } else {
                res.send(rezultatRandare);
            }
        });         
    } catch (err1) {
        if (err1.message.startsWith("Cannot find module")) {
            afisareEroare(res, 404);
            console.log("Nu a gasit resursa: ", req.url);
        } else {
            afisareEroare(res);
            console.log("Eroare:", err1);
        }
    }
});

// Compilarea fișierelor SCSS
function compileazaScss(caleScss, caleCss){
    try {
        if(!caleCss){
            let numeFisExt = path.basename(caleScss);
            let numeFis = numeFisExt.split(".")[0];
            caleCss = numeFis + ".css";
        }
        
        if (!path.isAbsolute(caleScss))
            caleScss = path.join(obGlobal.folderScss, caleScss);
        if (!path.isAbsolute(caleCss))
            caleCss = path.join(obGlobal.folderCss, caleCss);
        
        // Verifică dacă fișierul SCSS există
        if (!fs.existsSync(caleScss)) {
            console.log(`Fișierul SCSS nu există: ${caleScss}`);
            return false;
        }
        
        // Creează folderul backup pentru CSS
        let caleBackup = path.join(obGlobal.folderBackup, "src/css");
        if (!fs.existsSync(caleBackup)) {
            fs.mkdirSync(caleBackup, { recursive: true });
        }
        
        // Salvează backup-ul fișierului CSS existent
        let numeFisCss = path.basename(caleCss);
        if (fs.existsSync(caleCss)) {
            try {
                fs.copyFileSync(caleCss, path.join(caleBackup, numeFisCss));
                console.log(`Backup creat pentru: ${numeFisCss}`);
            } catch (errorBackup) {
                console.error(`EROARE la copierea backup-ului pentru ${numeFisCss}:`, errorBackup.message);
            }
        }
        
        // Compilează SCSS în CSS
        let rez = sass.compile(caleScss, {"sourceMap": true});
        fs.writeFileSync(caleCss, rez.css);
        console.log(`Compilat SCSS: ${path.basename(caleScss)} -> ${path.basename(caleCss)}`);
        return true;
        
    } catch (error) {
        console.error(`Eroare la compilarea SCSS ${caleScss}:`, error.message);
        return false;
    }
}

// Compilarea tuturor fișierelor SCSS
try {
    let vFisiere = fs.readdirSync(obGlobal.folderScss);
    for (let numeFis of vFisiere) {
        if (path.extname(numeFis) == ".scss") {
            compileazaScss(numeFis);
        }
    }
} catch (error) {
    console.log('Folderul SCSS nu există sau nu poate fi citit:', error.message);
}

// Monitorizarea modificărilor în folderele SCSS
if (fs.existsSync(obGlobal.folderScss)) {
    fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
        if (eveniment == "change" || eveniment == "rename") {
            let caleCompleta = path.join(obGlobal.folderScss, numeFis);
            if (fs.existsSync(caleCompleta) && path.extname(numeFis) == ".scss") {
                console.log(`Detectată modificare în ${numeFis}`);
                compileazaScss(caleCompleta); 
            }
        }
    });
    console.log('Monitorizare SCSS activată în:', obGlobal.folderScss);
}

// Pornește serverul
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

// Cleanup la închiderea serverului
process.on('SIGINT', async () => {
    console.log('\nÎnchiderea serverului...');
    await bd.closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nÎnchiderea serverului...');
    await bd.closePool();
    process.exit(0);
});
