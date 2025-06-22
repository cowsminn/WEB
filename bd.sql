-- Crearea bazei de date
CREATE DATABASE electrodelicii_db;

-- Conectare la baza de date
\c electrodelicii_db;

-- Crearea tipului ENUM pentru categoria mare
CREATE TYPE categorie_mare AS ENUM ('electronice', 'antichitati', 'mobilier', 'decoratiuni', 'colectii');

-- Crearea tipului ENUM pentru culoare
CREATE TYPE culoare_produs AS ENUM ('negru', 'alb', 'maro', 'argintiu', 'auriu', 'rosu', 'albastru', 'verde');

-- Crearea tabelului de produse
CREATE TABLE produse (
    id SERIAL PRIMARY KEY,
    nume VARCHAR(255) NOT NULL,
    descriere TEXT NOT NULL,
    imagine VARCHAR(500) NOT NULL,
    categorie_mare categorie_mare NOT NULL,
    tip_prezentare VARCHAR(100) NOT NULL, -- modalitatile de prezentare/expediere
    pret DECIMAL(10,2) NOT NULL,
    dimensiune INTEGER NOT NULL, -- caracteristica numerica secundara (cm)
    data_introducere DATE NOT NULL DEFAULT CURRENT_DATE,
    culoare culoare_produs NOT NULL,
    caracteristici_speciale TEXT, -- caracteristici multiple separate cu virgula
    garantie BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crearea utilizatorului pentru aplicatie
CREATE USER electrodelicii_user WITH PASSWORD 'electrodelicii_pass123';

-- Acordarea drepturilor
GRANT CONNECT ON DATABASE electrodelicii_db TO electrodelicii_user;
GRANT USAGE ON SCHEMA public TO electrodelicii_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO electrodelicii_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO electrodelicii_user;

-- Inserarea datelor de test (15-20 produse)
INSERT INTO produse (nume, descriere, imagine, categorie_mare, tip_prezentare, pret, dimensiune, data_introducere, culoare, caracteristici_speciale, garantie) VALUES
('Radio Vintage Grundig', 'Radio vintage din anii 60, în stare perfectă de funcționare, cu AM/FM și design autentic', 'targ1.jpeg', 'electronice', 'curier_rapid', 450.00, 25, '2024-01-15', 'maro', 'AM,FM,design_retro,lampi', true),
('Televizor Alb-Negru Dacia', 'Televizor românesc din epoca comunistă, ecran de 14 inch, funcțional', 'targ1.jpeg', 'electronice', 'ridicare_magazin', 320.00, 35, '2024-02-20', 'negru', 'ecran_convex,lampi,vintage', false),
('Telefon cu Disc Rotativ', 'Telefon cu disc mecanic din anii 70, complet funcțional', 'targ1.jpeg', 'electronice', 'posta_standard', 180.00, 20, '2024-03-10', 'negru', 'disc_rotativ,sonerie_mecanica', true),
('Gramofon cu Trompetă', 'Gramofon autentic cu trompetă din lemn și discuri de ebonită incluse', 'targ1.jpeg', 'antichitati', 'curier_rapid', 890.00, 40, '2024-01-05', 'maro', 'trompa_lemn,discuri_incluse,mecanism_ceas', true),
('Mașină de Scris Corona', 'Mașină de scris portabilă din anii 50, cu geantă originală', 'targ1.jpeg', 'antichitati', 'curier_standard', 650.00, 30, '2024-02-28', 'negru', 'geanta_originala,taste_metalice,panglica_noua', true),
('Ceas de Perete cu Pendulă', 'Ceas de perete din lemn masiv cu pendulă și sonerie', 'targ1.jpeg', 'antichitati', 'curier_rapid', 420.00, 45, '2024-01-20', 'maro', 'lemn_masiv,sonerie,pendula_functionala', true),
('Scaun Art Deco', 'Scaun din perioada Art Deco, tapițerie originală restaurată', 'targ1.jpeg', 'mobilier', 'curier_mobila', 1200.00, 85, '2024-03-15', 'rosu', 'tapiterie_restaurata,lemn_masiv,design_autentic', true),
('Masă de Cafea Vintage', 'Masă mică din lemn de nuc cu picioare metalice', 'targ1.jpeg', 'mobilier', 'curier_mobila', 380.00, 60, '2024-02-12', 'maro', 'lemn_nuc,picioare_metalice,design_retro', false),
('Bibliotecă Art Nouveau', 'Bibliotecă înaltă cu vitrine din sticlă și sculpturi decorative', 'targ1.jpeg', 'mobilier', 'transport_specializat', 2100.00, 180, '2024-01-08', 'maro', 'vitrine_sticla,sculpturi,lemn_masiv', true),
('Lampă de Birou Banker', 'Lampă clasică de bancă cu abajur verde și bază din alamă', 'targ1.jpeg', 'decoratiuni', 'curier_standard', 280.00, 35, '2024-03-05', 'verde', 'abajur_sticla,baza_alama,intrerupator_lantisor', true),
('Oglindă Barocă', 'Oglindă cu ramă sculptată în stil baroc, placată cu aur', 'targ1.jpeg', 'decoratiuni', 'curier_rapid', 750.00, 70, '2024-02-18', 'auriu', 'rama_sculptata,placare_aur,sticla_originala', true),
('Vază din Cristal Bohemian', 'Vază din cristal autentic din Boemia cu gravuri manuale', 'targ1.jpeg', 'decoratiuni', 'curier_fragil', 520.00, 25, '2024-01-30', 'alb', 'cristal_autentic,gravuri_manuale,certificat', true),
('Set Monede Aur România', 'Colecție de monede de aur românești din perioada 1900-1940', 'targ1.jpeg', 'colectii', 'curier_asigurat', 3500.00, 5, '2024-03-20', 'auriu', 'certificat_autenticitate,cutie_originala,catalog', true),
('Timbre Rare România Regală', 'Colecție de timbre din perioada României Regale, ștampilate', 'targ1.jpeg', 'colectii', 'posta_recomandata', 890.00, 8, '2024-02-25', 'rosu', 'album_inclus,certificat,stare_perfecta', true),
('Casetofon Portabil Sony', 'Casetofon vintage Sony cu radio AM/FM și înregistrare', 'targ1.jpeg', 'electronice', 'curier_standard', 320.00, 22, '2024-03-12', 'argintiu', 'radio_integrat,inregistrare,casti_incluse', true),
('Proiector Diapozitive Kodak', 'Proiector profesional pentru diapozitive cu lentile Carl Zeiss', 'targ1.jpeg', 'electronice', 'curier_rapid', 580.00, 38, '2024-01-25', 'negru', 'lentile_zeiss,telecomanda,tava_automata', true),
('Calculator Mecanic Facit', 'Calculator mecanic suedez pentru operații aritmetice complexe', 'targ1.jpeg', 'antichitati', 'curier_standard', 420.00, 28, '2024-02-08', 'verde', 'mecanism_precision,manual_original,functie_completa', true),
('Dulap Vintage cu Vitrine', 'Dulap din anii 60 cu uși din sticlă și rafturi ajustabile', 'targ1.jpeg', 'mobilier', 'transport_specializat', 980.00, 160, '2024-01-12', 'maro', 'usi_sticla,rafturi_ajustabile,cheie_originala', false),
('Lanternă cu Petrol Militară', 'Lanternă militară din Al Doilea Război Mondial, funcțională', 'targ1.jpeg', 'colectii', 'curier_standard', 380.00, 18, '2024-03-08', 'verde', 'militara_ww2,functie_completa,stare_exceptionala', true),
('Pictura Ulei pe Panza', 'Tablou original din anii 50, peisaj românesc, semnat de artist', 'targ1.jpeg', 'decoratiuni', 'curier_tablouri', 1250.00, 50, '2024-02-15', 'maro', 'semnat_artist,rama_originala,certificat_expertiza', true);

-- Trigger pentru actualizarea automată a updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_produse_updated_at 
    BEFORE UPDATE ON produse 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();