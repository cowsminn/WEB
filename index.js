const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 8080;

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
    "src/video",
    "src/json",
    "src/img",
    "src/img/erori",
    "temp"
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
    obErori: null
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

// Rute de bază
app.get('/', (req, res) => {
    res.render('pagini/index', { ip: req.ip });
});
app.get(['/index', '/home'], (req, res) => {
    res.render('pagini/index', { ip: req.ip });
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

// Rută catch-all pentru pagini dinamice
app.get(/^\/[^.]*$/, function(req, res){
    try {
        res.render("pagini" + req.url, function(eroare, rezultatRandare){
            if (eroare) {
                if (eroare.message.startsWith("Failed to lookup view")) {
                    // Pagina nu există - afișează eroarea 404
                    afisareEroare(res, 404);
                    console.log("Nu a gasit pagina: ", req.url);
                } else {
                    // Altă eroare - afișează eroarea generică
                    afisareEroare(res);
                    console.log("Eroare la randare:", eroare.message);
                }
            } else {
                // Nu sunt erori - trimite rezultatul randării către client
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


// Pornește serverul
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
