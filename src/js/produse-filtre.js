document.addEventListener('DOMContentLoaded', function() {
    console.log('Script produse-filtre încărcat');
    
    // Inițializare tema la încărcarea paginii
    initializeTheme();
    
    // Elementele din DOM
    const filtre = {
        nume: document.getElementById('filtru-nume'),
        descriere: document.getElementById('filtru-descriere'),
        pret: document.getElementById('filtru-pret'),
        tip: document.getElementById('filtru-tip'),
        culoare: document.querySelectorAll('input[name="culoare"]'),
        noutati: document.getElementById('filtru-noutati'),
        categorie: document.getElementById('filtru-categorie'),
        caracteristici: document.getElementById('filtru-caracteristici'),
        garantie: document.getElementById('filtru-garantie')
    };
    
    const butoane = {
        filtreaza: document.getElementById('btn-filtreaza'),
        sorteazaAsc: document.getElementById('btn-sorteaza-asc'),
        sorteazaDesc: document.getElementById('btn-sorteaza-desc'),
        calculeaza: document.getElementById('btn-calculeaza'),
        reseteaza: document.getElementById('btn-reseteaza')
    };
    
    const produseLista = document.getElementById('produse-lista');
    const pretSelectat = document.getElementById('pret-selectat');
    
    // Actualizarea valorii afișate pentru range
    if (filtre.pret && pretSelectat) {
        filtre.pret.addEventListener('input', function() {
            pretSelectat.textContent = this.value;
        });
    }
    
    // Validarea inputurilor cu floating label
    function valideazaInputuri() {
        let erori = [];
        const textareaNume = filtre.nume;
        
        // Validare textarea nume cu floating label
        if (textareaNume && textareaNume.value.trim()) {
            if (/\d/.test(textareaNume.value)) {
                erori.push('Numele produsului nu poate conține cifre');
                textareaNume.classList.add('is-invalid');
                // Floating label devine invalid
                const label = document.querySelector('label[for="filtru-nume"]');
                if (label) label.classList.add('text-danger');
            } else {
                textareaNume.classList.remove('is-invalid');
                const label = document.querySelector('label[for="filtru-nume"]');
                if (label) label.classList.remove('text-danger');
            }
        } else {
            textareaNume.classList.remove('is-invalid');
            const label = document.querySelector('label[for="filtru-nume"]');
            if (label) label.classList.remove('text-danger');
        }

        // Validare text descriere - nu trebuie să conțină doar cifre
        if (filtre.descriere && filtre.descriere.value.trim()) {
            if (/^\d+$/.test(filtre.descriere.value)) {
                erori.push('Cuvântul cheie din descriere nu poate fi doar cifre');
                filtre.descriere.style.borderColor = 'red';
            } else {
                filtre.descriere.style.borderColor = '';
            }
        }
        
        return erori;
    }
    
    // Funcția de filtrare
    function filtreazaProduse() {
        const erori = valideazaInputuri();
        if (erori.length > 0) {
            // Folosește Bootstrap toast în loc de alert
            showToast('Erori de validare', erori.join('<br>'), 'danger');
            return;
        }
        
        const produse = document.querySelectorAll('.produs-card');
        let produseVizibile = 0;
        
        produse.forEach(function(produs) {
            const cardContainer = produs.closest('.col-lg-6, .col-xl-4');
            let afiseaza = true;
            
            // Filtru nume (textarea)
            if (filtre.nume && filtre.nume.value.trim()) {
                const numeFilru = filtre.nume.value.toLowerCase().trim();
                const numeProdus = produs.dataset.nume;
                if (!numeProdus.startsWith(numeFilru)) {
                    afiseaza = false;
                }
            }
            
            // Filtru descriere (text)
            if (filtre.descriere && filtre.descriere.value.trim()) {
                const descriereFilru = filtre.descriere.value.toLowerCase().trim();
                const descriereProdus = produs.dataset.descriere;
                if (!descriereProdus.includes(descriereFilru)) {
                    afiseaza = false;
                }
            }
            
            // Filtru preț (range)
            if (filtre.pret) {
                const pretMaxim = parseFloat(filtre.pret.value);
                const pretProdus = parseFloat(produs.dataset.pret);
                if (pretProdus > pretMaxim) {
                    afiseaza = false;
                }
            }
            
            // Filtru tip prezentare (datalist)
            if (filtre.tip && filtre.tip.value.trim()) {
                const tipFilru = filtre.tip.value.trim();
                const tipProdus = produs.dataset.tip;
                if (tipProdus !== tipFilru) {
                    afiseaza = false;
                }
            }
            
            // Filtru culoare (radio)
            const culoareSelectata = document.querySelector('input[name="culoare"]:checked');
            if (culoareSelectata && culoareSelectata.value) {
                const culoareProdus = produs.dataset.culoare;
                if (culoareProdus !== culoareSelectata.value) {
                    afiseaza = false;
                }
            }
            
            // Filtru noutăți (checkbox)
            if (filtre.noutati && filtre.noutati.checked) {
                const dataProdus = new Date(produs.dataset.data);
                const dataNoutati = new Date('2024-03-01');
                if (dataProdus <= dataNoutati) {
                    afiseaza = false;
                }
            }
            
            // Filtru categorie (select simplu)
            if (filtre.categorie && filtre.categorie.value) {
                const categorieProdus = produs.dataset.categorie;
                if (categorieProdus !== filtre.categorie.value) {
                    afiseaza = false;
                }
            }
            
            // Filtru caracteristici (select multiplu)
            if (filtre.caracteristici) {
                const caracteristiciSelectate = Array.from(filtre.caracteristici.selectedOptions).map(opt => opt.value);
                if (caracteristiciSelectate.length > 0) {
                    const caracteristiciProdus = produs.dataset.caracteristici.split(',').map(c => c.trim());
                    const areCaracteristici = caracteristiciSelectate.some(car => 
                        caracteristiciProdus.some(cp => cp.includes(car))
                    );
                    if (!areCaracteristici) {
                        afiseaza = false;
                    }
                }
            }
            
            // Filtru garanție (checkbox)
            if (filtre.garantie && filtre.garantie.checked) {
                const garantieProdus = produs.dataset.garantie === 'true';
                if (!garantieProdus) {
                    afiseaza = false;
                }
            }
            
            // Afișează/ascunde card-ul Bootstrap
            if (cardContainer) {
                cardContainer.style.display = afiseaza ? 'block' : 'none';
            }
            if (afiseaza) produseVizibile++;
        });
        
        console.log(`Filtrare completă: ${produseVizibile} produse vizibile`);
    }
    
    // Funcțiile de sortare
    function sorteazaProduse(crescator = true) {
        const erori = valideazaInputuri();
        if (erori.length > 0) {
            alert('Erori de validare:\n' + erori.join('\n'));
            return;
        }
        
        const container = document.querySelector('.produse-grid');
        if (!container) return;
        
        const produse = Array.from(container.children);
        
        produse.sort(function(a, b) {
            // Prima cheie: nume
            const numeA = a.dataset.nume;
            const numeB = b.dataset.nume;
            let comparatie = numeA.localeCompare(numeB);
            
            // A doua cheie: raportul dimensiune/preț
            if (comparatie === 0) {
                const raportA = parseFloat(a.dataset.dimensiune) / parseFloat(a.dataset.pret);
                const raportB = parseFloat(b.dataset.dimensiune) / parseFloat(b.dataset.pret);
                comparatie = raportA - raportB;
            }
            
            return crescator ? comparatie : -comparatie;
        });
        
        // Reordonează elementele în DOM
        produse.forEach(produs => container.appendChild(produs));
        
        console.log(`Sortare completă: ${crescator ? 'crescător' : 'descrescător'}`);
    }
    
    // Funcția de calculare
    function calculeazaPretMediu() {
        const erori = valideazaInputuri();
        if (erori.length > 0) {
            showToast('Erori de validare', erori.join('<br>'), 'danger');
            return;
        }
        
        const produseVizibile = document.querySelectorAll('.produs-card:not([style*="display: none"])');
        
        if (produseVizibile.length === 0) {
            showToast('Avertisment', 'Nu există produse vizibile pentru calculare!', 'warning');
            return;
        }
        
        let suma = 0;
        produseVizibile.forEach(function(produs) {
            suma += parseFloat(produs.dataset.pret);
        });
        
        const media = suma / produseVizibile.length;
        
        // Creează div-ul dinamic cu suport pentru tema
        const divCalcul = document.createElement('div');
        const currentTheme = localStorage.getItem('theme') || 'light';
        const isDark = currentTheme === 'dark';
        
        divCalcul.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: ${isDark ? '#2c3e50' : '#CB4967'};
            color: ${isDark ? '#ecf0f1' : 'white'};
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 1000;
            text-align: center;
            font-size: 1.2em;
            border: 2px solid ${isDark ? '#34495e' : '#F2305E'};
            animation: fadeInScale 0.3s ease-out;
        `;
        
        divCalcul.innerHTML = `
            <h3><i class="fas fa-calculator"></i> Preț mediu calculat</h3>
            <p><strong>${media.toFixed(2)} RON</strong></p>
            <p><small><i class="fas fa-eye"></i> ${produseVizibile.length} produse vizibile</small></p>
        `;
        
        document.body.appendChild(divCalcul);
        
        // Elimină div-ul după 2 secunde
        setTimeout(function() {
            if (document.body.contains(divCalcul)) {
                document.body.removeChild(divCalcul);
            }
        }, 2000);
        
        console.log(`Preț mediu calculat: ${media.toFixed(2)} RON pentru ${produseVizibile.length} produse`);
    }
    
    // Funcția de resetare
    function reseteazaFiltre() {
        if (!confirm('Sunteți sigur că doriți să resetați toate filtrele?')) {
            return;
        }
        
        // Resetează toate inputurile
        if (filtre.nume) filtre.nume.value = '';
        if (filtre.descriere) filtre.descriere.value = '';
        if (filtre.pret) {
            filtre.pret.value = filtre.pret.max;
            if (pretSelectat) pretSelectat.textContent = filtre.pret.max;
        }
        if (filtre.tip) filtre.tip.value = '';
        if (filtre.noutati) filtre.noutati.checked = false;
        if (filtre.categorie) filtre.categorie.value = '';
        if (filtre.garantie) filtre.garantie.checked = false;
        
        // Resetează radio buttons
        const radioTotalate = document.getElementById('culoare-toate');
        if (radioTotalate) radioTotalate.checked = true;
        
        // Resetează select multiplu
        if (filtre.caracteristici) {
            Array.from(filtre.caracteristici.options).forEach(opt => opt.selected = false);
        }
        
        // Resetează stilurile de eroare
        Object.values(filtre).forEach(filtru => {
            if (filtru && filtru.style) {
                filtru.style.borderColor = '';
            }
        });
        
        // Afișează toate produsele
        const produse = document.querySelectorAll('.produs-card');
        produse.forEach(produs => produs.style.display = 'block');
        
        // Resetează ordinea inițială (reîncarcă container-ul în ordinea din DOM)
        const container = document.querySelector('.produse-grid');
        if (container) {
            const produse = Array.from(container.children);
            produse.sort((a, b) => {
                const idA = parseInt(a.id.replace('artc-', ''));
                const idB = parseInt(b.id.replace('artc-', ''));
                return idA - idB;
            });
            produse.forEach(produs => container.appendChild(produs));
        }
        
        console.log('Filtre resetate');
    }
    
    // Event listeners pentru butoane
    if (butoane.filtreaza) {
        butoane.filtreaza.addEventListener('click', filtreazaProduse);
    }
    
    if (butoane.sorteazaAsc) {
        butoane.sorteazaAsc.addEventListener('click', () => sorteazaProduse(true));
    }
    
    if (butoane.sorteazaDesc) {
        butoane.sorteazaDesc.addEventListener('click', () => sorteazaProduse(false));
    }
    
    if (butoane.calculeaza) {
        butoane.calculeaza.addEventListener('click', calculeazaPretMediu);
    }
    
    if (butoane.reseteaza) {
        butoane.reseteaza.addEventListener('click', reseteazaFiltre);
    }
    
    console.log('Event listeners adăugați pentru toate butoanele');
    
    // Event listener pentru validarea în timp real a textarea-ului
    if (filtre.nume) {
        filtre.nume.addEventListener('input', function() {
            valideazaInputuri();
        });
    }

    // Tema este gestionată de theme-global.js - nu mai avem cod duplicat aici
    
    // Funcție pentru afișarea toast-urilor Bootstrap
    function showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toast-container') || createToastContainer();
        
        const toastHtml = `
            <div class="toast align-items-center text-bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <strong>${title}</strong><br>${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toastElement = toastContainer.lastElementChild;
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        
        // Remove toast element after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
        return container;
    }
});

// Funcție globală pentru aplicarea temei pe toate paginile
function applyGlobalTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-bs-theme', savedTheme);
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }
}

// Aplică tema imediat (înainte de DOMContentLoaded)
applyGlobalTheme();
