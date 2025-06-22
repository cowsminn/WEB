const { Client, Pool } = require("pg");

class AccesBD {
    static #instanta = null;
    static #initializat = false;

    /**
     * Constructorul clasei AccesBD. 
     * Este privat pentru a asigura că clasa este instanțiată doar o dată.
     * @throws {Error} Dacă clasa a fost deja instanțiată.
     */
    constructor() {
        if (AccesBD.#instanta) {
            throw new Error("Deja a fost instantiat");
        } else if (!AccesBD.#initializat) {
            throw new Error("Trebuie apelat doar din getInstanta; fara sa fi aruncat vreo eroare");
        }
    }

    /**
     * Inițializează conexiunea locală la baza de date.
     */
    initLocal() {
        this.client = new Client({
            database: "electrodelicii_db",
            user: "electrodelicii_user",
            password: "electrodelicii_pass123",
            host: "localhost",
            port: 5432
        });
        this.client.connect()
            .then(() => console.log("Conectat cu succes la baza de date locală"))
            .catch(err => console.error("Eroare la conectarea la baza de date locală:", err.message));
    }

    /**
     * Inițializează conexiunea la baza de date electrodelicii.
     */
    initElectrodelicii() {
        this.client = new Client({
            database: "electrodelicii_db",
            user: "electrodelicii_user",
            password: "electrodelicii_pass123",
            host: "localhost",
            port: 5432
        });
        this.client.connect()
            .then(() => console.log("Conectat cu succes la electrodelicii_db"))
            .catch(err => console.error("Eroare la conectarea la electrodelicii_db:", err.message));
    }

    /**
     * Returnează clientul utilizat pentru conexiunea la baza de date.
     * @throws {Error} Dacă clasa nu a fost instanțiată.
     * @returns {Client} Clientul utilizat pentru conexiunea la baza de date.
     */
    getClient() {
        if (!AccesBD.#instanta) {
            throw new Error("Nu a fost instantiata clasa");
        }
        return this.client;
    }

    /**
     * @typedef {object} ObiectConexiune - Obiectul primit de funcțiile care realizează un query.
     * @property {string} init - Tipul de conexiune ("local", "render", etc.).
     */

    /**
     * Returnează instanța unică a clasei AccesBD.
     * @param {ObiectConexiune} [init={}] - Obiectul cu datele pentru inițializare.
     * @returns {AccesBD} Instanța unică a clasei AccesBD.
     */
    static getInstanta({ init = "local" } = {}) {
        console.log(this); // this-ul e clasa nu instanta pt ca metoda statica
        if (!this.#instanta) {
            this.#initializat = true;
            this.#instanta = new AccesBD();

            try {
                switch (init) {
                    case "local": 
                        this.#instanta.initLocal();
                        break;
                    case "electrodelicii":
                        this.#instanta.initElectrodelicii();
                        break;
                }
            } catch (e) {
                console.error("Eroare la initializarea bazei de date!");
            }
        }
        return this.#instanta;
    }

    /**
     * @typedef {object} ObiectQuerySelect - Obiect primit de funcțiile care realizează un query.
     * @property {string} tabel - Numele tabelului.
     * @property {string[]} campuri - O listă de stringuri cu numele coloanelor afectate de query; poate cuprinde și elementul "*".
     * @property {string[]} conditiiAnd - Lista de stringuri cu condiții pentru WHERE.
     */

    /**
     * Callback pentru query-uri.
     * @callback QueryCallBack
     * @param {Error} err - Eventuala eroare în urma query-ului.
     * @param {Object} rez - Rezultatul query-ului.
     */

    /**
     * Selectează înregistrări din baza de date.
     * @param {ObiectQuerySelect} obj - Obiectul cu datele pentru query.
     * @param {QueryCallBack} callback - O funcție callback cu 2 parametri: eroare și rezultatul query-ului.
     * @param {Array} parametriQuery - Parametri pentru query-ul parametrizat.
     */
    select({ tabel = "", campuri = [], conditiiAnd = [] } = {}, callback, parametriQuery = []) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.error(comanda);
        this.client.query(comanda, parametriQuery, callback)
    }

    /**
     * Selectează înregistrări din baza de date utilizând async/await.
     * @param {ObiectQuerySelect} obj - Obiectul cu datele pentru query.
     * @returns {Promise<Object|null>} Rezultatul query-ului sau null în caz de eroare.
     */
    async selectAsync({ tabel = "", campuri = [], conditiiAnd = [] } = {}) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `select ${campuri.join(",")} from ${tabel} ${conditieWhere}`;
        console.error("selectAsync:", comanda);
        try {
            let rez = await this.client.query(comanda);
            console.log("selectasync: ", rez);
            return rez;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    /**
     * Inserează înregistrări în baza de date.
     * @param {Object} obj - Obiectul cu datele pentru query.
     * @param {string} obj.tabel - Numele tabelului.
     * @param {Object} obj.campuri - Un obiect cu numele coloanelor și valorile corespunzătoare.
     * @param {QueryCallBack} callback - O funcție callback cu 2 parametri: eroare și rezultatul query-ului.
     */
    insert({ tabel = "", campuri = {} } = {}, callback) {
        console.log("-------------------------------------------")
        console.log(Object.keys(campuri).join(","));
        console.log(Object.values(campuri).join(","));
        let comanda = `insert into ${tabel}(${Object.keys(campuri).join(",")}) values ( ${Object.values(campuri).map((x) => `'${x}'`).join(",")})`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }

    /**
     * Actualizează înregistrări în baza de date.
     * @param {Object} obj - Obiectul cu datele pentru query.
     * @param {string} obj.tabel - Numele tabelului.
     * @param {Object} obj.campuri - Un obiect cu numele coloanelor și valorile noi.
     * @param {string[]} obj.conditiiAnd - Lista de stringuri cu condiții pentru WHERE.
     * @param {QueryCallBack} callback - O funcție callback cu 2 parametri: eroare și rezultatul query-ului.
     * @param {Array} parametriQuery - Parametri pentru query-ul parametrizat.
     */
    update({ tabel = "", campuri = {}, conditiiAnd = [] } = {}, callback, parametriQuery = []) {
        let campuriActualizate = [];
        for (let prop in campuri)
            campuriActualizate.push(`${prop}='${campuri[prop]}'`);
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        let comanda = `update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }

    /**
     * Actualizează înregistrări în baza de date utilizând query parametrizat.
     * @param {Object} obj - Obiectul cu datele pentru query.
     * @param {string} obj.tabel - Numele tabelului.
     * @param {string[]} obj.campuri - Lista de stringuri cu numele coloanelor de actualizat.
     * @param {Array} obj.valori - Lista de valori noi pentru coloanele de actualizat.
     * @param {string[]} obj.conditiiAnd - Lista de stringuri cu condiții pentru WHERE.
     * @param {QueryCallBack} callback - O funcție callback cu 2 parametri: eroare și rezultatul query-ului.
     * @param {Array} parametriQuery - Parametri pentru query-ul parametrizat.
     * @throws {Error} Dacă numărul de coloane diferă de numărul de valori.
     */
    updateParametrizat({ tabel = "", campuri = [], valori = [], conditiiAnd = [] } = {}, callback, parametriQuery = []) {
        if (campuri.length != valori.length)
            throw new Error("Numarul de campuri difera de nr de valori")
        let campuriActualizate = [];
        for (let i = 0; i < campuri.length; i++)
            campuriActualizate.push(`${campuri[i]}=$${i + 1}`);
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        let comanda = `update ${tabel} set ${campuriActualizate.join(", ")}  ${conditieWhere}`;
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1111", comanda);
        this.client.query(comanda, valori, callback)
    }

    /**
     * Șterge înregistrări din baza de date.
     * @param {Object} obj - Obiectul cu datele pentru query.
     * @param {string} obj.tabel - Numele tabelului.
     * @param {string[]} obj.conditiiAnd - Lista de stringuri cu condiții pentru WHERE.
     * @param {QueryCallBack} callback - O funcție callback cu 2 parametri: eroare și rezultatul query-ului.
     */
    delete({ tabel = "", conditiiAnd = [] } = {}, callback) {
        let conditieWhere = "";
        if (conditiiAnd.length > 0)
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;

        let comanda = `delete from ${tabel} ${conditieWhere}`;
        console.log(comanda);
        this.client.query(comanda, callback)
    }

    /**
     * Execută un query personalizat.
     * @param {string} comanda - Comanda SQL de executat.
     * @param {QueryCallBack} callback - O funcție callback cu 2 parametri: eroare și rezultatul query-ului.
     */
    query(comanda, callback) {
        this.client.query(comanda, callback);
    }

    /**
     * Testează conexiunea la baza de date.
     * @returns {Promise<boolean>} True dacă conexiunea este funcțională.
     */
    async testConnection() {
        try {
            const result = await this.client.query('SELECT NOW()');
            console.log("Conexiunea este funcțională:", result.rows[0]);
            return true;
        } catch (err) {
            console.error("Eroare la testarea conexiunii:", err.message);
            return false;
        }
    }
}

module.exports = AccesBD;