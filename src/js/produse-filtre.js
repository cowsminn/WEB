document.addEventListener('DOMContentLoaded', function() {
    console.log('Script produse-filtre încărcat');
    
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
    
    // Variabile pentru starea produselor
    let pinnedProducts = new Set();
    let hiddenTempProducts = new Set();
    let hiddenSessionProducts = new Set();
    
    // Variabile pentru paginare
    let paginaCurenta = 1;
    let produsePePagina = 12;
    let produseFiltrate = [];
    
    // Funcții pentru gestionarea stării produselor în sessionStorage - UPDATED
    function loadSessionState() {
        try {
            const sessionData = sessionStorage.getItem('hiddenSessionProducts');
            if (sessionData) {
                const hiddenArray = JSON.parse(sessionData);
                hiddenSessionProducts = new Set(hiddenArray);
                console.log('Stare încărcată din sessionStorage:', hiddenSessionProducts.size, 'produse ascunse');
                console.log('Produse ascunse pentru sesiune:', Array.from(hiddenSessionProducts));
            }
        } catch (error) {
            console.error('Eroare la încărcarea stării din sessionStorage:', error);
            hiddenSessionProducts = new Set();
        }
    }

    function saveSessionState() {
        try {
            const hiddenArray = Array.from(hiddenSessionProducts);
            sessionStorage.setItem('hiddenSessionProducts', JSON.stringify(hiddenArray));
            console.log('Stare salvată în sessionStorage:', hiddenSessionProducts.size, 'produse ascunse');
            console.log('Array salvat:', hiddenArray);
        } catch (error) {
            console.error('Eroare la salvarea stării în sessionStorage:', error);
        }
    }

    // Inițializează starea pentru butoanele de acțiune - UPDATED
    function initializeProductActions() {
        loadSessionState();
        
        // Aplică starea pentru produsele ascunse în sesiune
        hiddenSessionProducts.forEach(productId => {
            const productItem = document.querySelector(`[data-product-id="${productId}"]`)?.closest('.produs-item');
            if (productItem) {
                productItem.style.display = 'none';
                console.log(`Produs ${productId} ascuns pentru sesiune`);
            }
        });
        
        // Event listener pentru custom event din pagina principală
        document.addEventListener('sessionProductHidden', function(e) {
            const productId = e.detail.productId;
            if (!hiddenSessionProducts.has(productId)) {
                hiddenSessionProducts.add(productId);
                saveSessionState();
                console.log(`Produs ${productId} adăugat în starea sesiunii`);
                
                // Actualizează lista filtrată
                actualizareDupaActiune();
            }
        });
        
        // Event listeners pentru butoanele de acțiune folosind event delegation
        document.addEventListener('click', function(e) {
            if (e.target.closest('.pin-product')) {
                e.preventDefault();
                handlePinProduct(e.target.closest('.pin-product'));
            } else if (e.target.closest('.hide-temp')) {
                e.preventDefault();
                handleHideTemp(e.target.closest('.hide-temp'));
            } else if (e.target.closest('.hide-session')) {
                e.preventDefault();
                handleHideSession(e.target.closest('.hide-session'));
            }
        });
        
        console.log('Event listeners pentru butoanele de acțiune adăugați');
    }

    function handlePinProduct(button) {
        const productId = button.dataset.productId;
        const productCard = button.closest('.produs-card');
        const productItem = button.closest('.produs-item');
        
        console.log('Pin/Unpin produs:', productId);
        
        if (pinnedProducts.has(productId)) {
            // Unpin product
            pinnedProducts.delete(productId);
            productCard.classList.remove('pinned');
            button.classList.remove('btn-warning');
            button.classList.add('btn-outline-warning');
            button.title = 'Păstrează produsul afișat mereu (nu dispare la filtrare)';
            console.log(`Produs ${productId} unpinned`);
        } else {
            // Pin product
            pinnedProducts.add(productId);
            productCard.classList.add('pinned');
            button.classList.remove('btn-outline-warning');
            button.classList.add('btn-warning');
            button.title = 'Anulează păstrarea produsului (va putea fi ascuns la filtrare)';
            
            // Dacă era ascuns temporar, îl afișăm
            if (hiddenTempProducts.has(productId)) {
                hiddenTempProducts.delete(productId);
                productCard.classList.remove('hidden-temp');
                productItem.style.display = 'block';
            }
            console.log(`Produs ${productId} pinned`);
        }
    }

    function handleHideTemp(button) {
        const productId = button.dataset.productId;
        const productCard = button.closest('.produs-card');
        const productItem = button.closest('.produs-item');
        
        console.log('Hide/Show temporar produs:', productId);
        
        if (hiddenTempProducts.has(productId)) {
            // Show product again
            hiddenTempProducts.delete(productId);
            productCard.classList.remove('hidden-temp');
            productItem.style.display = 'block';
            button.classList.remove('btn-secondary');
            button.classList.add('btn-outline-secondary');
            button.title = 'Ascunde temporar produsul din afișarea curentă';
            console.log(`Produs ${productId} afișat din nou`);
        } else {
            // Hide product temporarily
            hiddenTempProducts.add(productId);
            productCard.classList.add('hidden-temp');
            button.classList.remove('btn-outline-secondary');
            button.classList.add('btn-secondary');
            
            // Nu ascundem complet dacă este pinned
            if (!pinnedProducts.has(productId)) {
                productItem.style.display = 'none';
            }
            button.title = 'Afișează din nou produsul';
            console.log(`Produs ${productId} ascuns temporar`);
        }
        
        // Actualizează paginarea
        actualizareDupaActiune();
    }

    function handleHideSession(button) {
        const productId = button.dataset.productId;
        const productItem = button.closest('.produs-item');
        
        if (confirm('Sigur doriți să ascundeți acest produs pentru toată sesiunea?')) {
            hiddenSessionProducts.add(productId);
            saveSessionState();
            
            // Elimină din toate seturile
            pinnedProducts.delete(productId);
            hiddenTempProducts.delete(productId);
            
            productItem.style.display = 'none';
            console.log(`Produs ${productId} ascuns pentru sesiune`);
            
            // Actualizează paginarea
            actualizareDupaActiune();
        }
    }

    function actualizareDupaActiune() {
        // Recalculează produsele filtrate
        actualizareProduseFiltrate();
        
        // Verifică dacă suntem pe o pagină care nu mai are produse
        const totalPagini = Math.ceil(produseFiltrate.length / produsePePagina);
        if (paginaCurenta > totalPagini && totalPagini > 0) {
            paginaCurenta = totalPagini;
        }
        
        // Actualizează paginarea
        aplicaPaginare();
    }
    
    // Creează mesajul pentru când nu sunt produse - UPDATED
    function createNoProductsMessage() {
        let messageDiv = document.getElementById('no-products-message');
        
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'no-products-message';
            messageDiv.className = 'alert alert-warning text-center mt-4';
            messageDiv.style.display = 'none';
            messageDiv.innerHTML = `
                <i class="bi bi-search"></i>
                <h5 class="mt-2">Nu au fost găsite produse</h5>
                <p class="mb-2">Nu există produse care să corespundă criteriilor de filtrare selectate.</p>
                <button id="btn-reset-filters-msg" class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-arrow-clockwise"></i> Resetează filtrele
                </button>
            `;
            
            const container = document.querySelector('#produse-container');
            if (container && container.parentNode) {
                container.parentNode.insertBefore(messageDiv, container.nextSibling);
            }
            
            // Adaugă event listener pentru butonul de reset
            const resetBtn = messageDiv.querySelector('#btn-reset-filters-msg');
            if (resetBtn) {
                resetBtn.addEventListener('click', reseteazaFiltre);
            }
        }
        
        return messageDiv;
    }
    
    // Funcția pentru afișarea/ascunderea mesajului - UPDATED
    function toggleNoProductsMessage(produseVizibile) {
        const messageDiv = createNoProductsMessage();
        const container = document.querySelector('#produse-container');
        const paginationControls = document.getElementById('pagination-controls');
        const paginationNav = document.querySelector('nav[aria-label="Paginare produse"]');
        
        console.log('Toggle no products message - produse vizibile:', produseVizibile);
        
        if (produseVizibile === 0) {
            messageDiv.style.display = 'block';
            if (container) container.style.display = 'none';
            if (paginationControls) paginationControls.style.display = 'none';
            if (paginationNav) paginationNav.style.display = 'none';
            console.log('Afișez mesajul "nu sunt produse"');
        } else {
            messageDiv.style.display = 'none';
            if (container) container.style.display = 'flex';
            if (paginationControls) paginationControls.style.display = 'flex';
            if (paginationNav) paginationNav.style.display = 'block';
            console.log('Ascund mesajul "nu sunt produse"');
        }
    }
    
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
    
    // Funcția de filtrare corectată - MAJOR UPDATE
    function filtreazaProduse() {
        console.log('Filtrare produse apelată');
        
        const erori = valideazaInputuri();
        if (erori.length > 0) {
            if (typeof showToast === 'function') {
                showToast('Erori de validare', erori.join('<br>'), 'danger');
            }
            return;
        }
        
        const toateProdusele = document.querySelectorAll('.produs-item');
        produseFiltrate = [];
        let produseVizibile = 0;
        
        // Obține valorile de filtrare
        const filtruNume = normalizareDiacritice(document.getElementById('filtru-nume')?.value.toLowerCase().trim() || '');
        const filtruDescriere = normalizareDiacritice(document.getElementById('filtru-descriere')?.value.toLowerCase().trim() || '');
        
        toateProdusele.forEach(function(produsItem) {
            const produs = produsItem.querySelector('.produs-card');
            if (!produs) return;
            
            const productId = produs.dataset.productId;
            
            // PRIORITATE MAXIMĂ: Verifică dacă produsul este ascuns pentru sesiune
            if (hiddenSessionProducts.has(productId)) {
                produsItem.style.display = 'none';
                return; // STOP - nu procesează mai departe
            }
            
            let afiseaza = true;
            
            // Filtrare pe nume cu normalizare diacritice
            if (filtruNume) {
                const numeProdusProceasat = normalizareDiacritice(produs.dataset.nume || '');
                if (!numeProdusProceasat.includes(filtruNume)) {
                    afiseaza = false;
                }
            }
            
            // Filtrare pe descriere cu normalizare diacritice
            if (afiseaza && filtruDescriere) {
                const descriereProdusProceasata = normalizareDiacritice(produs.dataset.descriere || '');
                if (!descriereProdusProceasata.includes(filtruDescriere)) {
                    afiseaza = false;
                }
            }
            
            // Filtru preț (range)
            if (afiseaza && filtre.pret) {
                const pretMaxim = parseFloat(filtre.pret.value);
                const pretProdus = parseFloat(produs.dataset.pret);
                if (pretProdus > pretMaxim) {
                    afiseaza = false;
                }
            }
            
            // Filtru tip prezentare (datalist)
            if (afiseaza && filtre.tip && filtre.tip.value.trim()) {
                const tipFilru = filtre.tip.value.trim();
                const tipProdus = produs.dataset.tip;
                if (tipProdus !== tipFilru) {
                    afiseaza = false;
                }
            }
            
            // Filtru culoare (radio)
            const culoareSelectata = document.querySelector('input[name="culoare"]:checked');
            if (afiseaza && culoareSelectata && culoareSelectata.value) {
                const culoareProdus = produs.dataset.culoare;
                const culoareFiltru = normalizareDiacritice(culoareSelectata.value.toLowerCase());
                const culoareProdusNorm = normalizareDiacritice(culoareProdus.toLowerCase());
                if (culoareProdusNorm !== culoareFiltru) {
                    afiseaza = false;
                }
            }
            
            // Filtru noutăți (checkbox)
            if (afiseaza && filtre.noutati && filtre.noutati.checked) {
                const dataProdus = new Date(produs.dataset.data);
                const dataNoutati = new Date('2024-03-01');
                if (dataProdus <= dataNoutati) {
                    afiseaza = false;
                }
            }
            
            // Filtru categorie (select simplu)
            if (afiseaza && filtre.categorie && filtre.categorie.value) {
                const categorieProdus = produs.dataset.categorie;
                if (categorieProdus !== filtre.categorie.value) {
                    afiseaza = false;
                }
            }
            
            // Filtru caracteristici (select multiplu)
            if (afiseaza && filtre.caracteristici) {
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
            if (afiseaza && filtre.garantie && filtre.garantie.checked) {
                const garantieProdus = produs.dataset.garantie === 'true';
                if (!garantieProdus) {
                    afiseaza = false;
                }
            }
            
            // Verifică dacă produsul este pinned (nu se ascunde niciodată, DACĂ nu e ascuns pentru sesiune)
            if (pinnedProducts.has(productId)) {
                afiseaza = true;
            }
            
            // Verifică dacă produsul este ascuns temporar
            if (hiddenTempProducts.has(productId) && !pinnedProducts.has(productId)) {
                afiseaza = false;
            }
            
            // Aplică vizibilitatea
            if (afiseaza) {
                produseFiltrate.push(produsItem);
                produseVizibile++;
                produsItem.style.display = 'block';
            } else {
                produsItem.style.display = 'none';
            }
        });
        
        console.log('Produse după filtrare:', produseFiltrate.length, 'vizibile:', produseVizibile);
        
        // IMPORTANT: Afișează/ascunde mesajul înainte de paginare
        toggleNoProductsMessage(produseVizibile);
        
        // Resetează la prima pagină după filtrare doar dacă sunt produse
        if (produseVizibile > 0) {
            paginaCurenta = 1;
            aplicaPaginare();
        }
        
        // After filtering, trigger cheapest product marking
        setTimeout(() => {
            if (typeof markCheapestProducts === 'function') {
                markCheapestProducts();
            }
            // Dispatch custom event for other listeners
            document.dispatchEvent(new CustomEvent('productFiltered'));
        }, 200);
        
        console.log(`Filtrare completă: ${produseFiltrate.length} produse găsite, ${produseVizibile} vizibile`);
    }
    
    // Funcțiile de sortare - UPDATED
    function sorteazaProduse(crescator = true) {
        const erori = valideazaInputuri();
        if (erori.length > 0) {
            alert('Erori de validare:\n' + erori.join('\n'));
            return;
        }
        
        // Fix: Update container selector to match HTML
        const container = document.querySelector('#produse-container') || document.querySelector('.row.g-4');
        if (!container) return;
        
        const produse = Array.from(container.children);
        
        produse.sort(function(a, b) {
            // Prima cheie: nume
            const produsCardA = a.querySelector('.produs-card');
            const produsCardB = b.querySelector('.produs-card');
            
            if (!produsCardA || !produsCardB) return 0;
            
            const numeA = produsCardA.dataset.nume;
            const numeB = produsCardB.dataset.nume;
            let comparatie = numeA.localeCompare(numeB);
            
            // A doua cheie: raportul dimensiune/preț
            if (comparatie === 0) {
                const raportA = parseFloat(produsCardA.dataset.dimensiune) / parseFloat(produsCardA.dataset.pret);
                const raportB = parseFloat(produsCardB.dataset.dimensiune) / parseFloat(produsCardB.dataset.pret);
                comparatie = raportA - raportB;
            }
            
            return crescator ? comparatie : -comparatie;
        });
        
        // Reordonează elementele în DOM
        produse.forEach(produs => container.appendChild(produs));
        
        // After sorting, trigger cheapest product marking
        setTimeout(() => {
            if (typeof markCheapestProducts === 'function') {
                markCheapestProducts();
            }
            document.dispatchEvent(new CustomEvent('productSorted'));
        }, 200);
        
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
    
    // Funcția de resetare - UPDATED
    function reseteazaFiltre() {
        if (!confirm('Sunteți sigur că doriți să resetați toate filtrele?')) {
            return;
        }
        
        console.log('Resetare filtre');
        
        // Resetează toate input-urile de filtrare
        document.getElementById('filtru-nume').value = '';
        document.getElementById('filtru-descriere').value = '';
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
        
        // Resetează starea produselor (doar pentru sesiunea curentă)
        pinnedProducts.clear();
        hiddenTempProducts.clear();
        // IMPORTANT: NU resetează hiddenSessionProducts - acestea rămân pentru toată sesiunea
        
        // Afișează toate produsele (exceptând cele ascunse pentru sesiune)
        const produse = document.querySelectorAll('.produs-item');
        produse.forEach(produsItem => {
            const productId = produsItem.querySelector('[data-product-id]')?.dataset.productId;
            
            // Verifică dacă este ascuns pentru sesiune
            if (!hiddenSessionProducts.has(productId)) {
                produsItem.style.display = 'block';
            } else {
                produsItem.style.display = 'none'; // Menține ascuns pentru sesiune
            }
            
            // Resetează clasele CSS
            const productCard = produsItem.querySelector('.produs-card');
            if (productCard) {
                productCard.classList.remove('pinned', 'hidden-temp');
            }
            
            // Resetează butoanele
            const pinBtn = produsItem.querySelector('.pin-product');
            const hideBtn = produsItem.querySelector('.hide-temp');
            if (pinBtn) {
                pinBtn.classList.remove('btn-warning');
                pinBtn.classList.add('btn-outline-warning');
                pinBtn.title = 'Păstrează produsul afișat mereu (nu dispare la filtrare)';
            }
            if (hideBtn) {
                hideBtn.classList.remove('btn-secondary');
                hideBtn.classList.add('btn-outline-secondary');
                hideBtn.title = 'Ascunde temporar produsul din afișarea curentă';
            }
        });
        
        // Resetează paginarea
        actualizareProduseFiltrate();
        paginaCurenta = 1;
        aplicaPaginare();
        
        console.log('Filtre și stare produse resetate');
    }
    
    // Funcții pentru paginare - CORECTARE PENTRU SELECT
    function initializarePaginare() {
        const itemsPerPageSelect = document.getElementById('items-per-page');
        if (itemsPerPageSelect) {
            console.log('Items per page select găsit, valoare inițială:', itemsPerPageSelect.value);
            
            // Setează valoarea inițială
            produsePePagina = parseInt(itemsPerPageSelect.value) || 12;
            
            // CORECTARE: Adaugă event listener corect
            itemsPerPageSelect.addEventListener('change', function(e) {
                const noualValoare = parseInt(this.value) || 12;
                console.log('Schimbare produse pe pagină de la', produsePePagina, 'la', noualValoare);
                produsePePagina = noualValoare;
                paginaCurenta = 1; // Reset la prima pagină
                aplicaPaginare();
            });
            
            // Event listener pentru debugging
            itemsPerPageSelect.addEventListener('click', function() {
                console.log('Click pe select, valoarea curentă:', this.value);
            });
        } else {
            console.error('Select items-per-page nu a fost găsit în DOM');
        }
        
        // Inițializează cu toate produsele vizibile
        actualizareProduseFiltrate();
        aplicaPaginare();
    }

    function actualizareProduseFiltrate() {
        const toateProdusele = document.querySelectorAll('.produs-item');
        produseFiltrate = Array.from(toateProdusele).filter(item => {
            const productId = item.querySelector('[data-product-id]')?.dataset.productId;
            
            // PRIMA VERIFICARE: Exclude produsele ascunse pentru sesiune
            if (hiddenSessionProducts.has(productId)) {
                return false;
            }
            
            // Exclude produsele ascunse temporar (dacă nu sunt pinned)
            if (hiddenTempProducts.has(productId) && !pinnedProducts.has(productId)) {
                return false;
            }
            
            return true;
        });
        
        console.log('Produse filtrate actualizate:', produseFiltrate.length);
        console.log('Produse ascunse pentru sesiune:', Array.from(hiddenSessionProducts));
    }

    function aplicaPaginare() {
        console.log('Aplicare paginare - produse pe pagină:', produsePePagina, 'pagina curentă:', paginaCurenta);
        
        if (!produseFiltrate || produseFiltrate.length === 0) {
            console.log('Nu există produse filtrate, actualizez lista');
            actualizareProduseFiltrate();
        }
        
        const totalProduse = produseFiltrate.length;
        const totalPagini = Math.ceil(totalProduse / produsePePagina);
        
        console.log('Total produse:', totalProduse, 'Total pagini:', totalPagini);
        
        // UPDATED: Verifică dacă nu sunt produse
        if (totalProduse === 0) {
            toggleNoProductsMessage(0);
            return;
        }
        
        // Validează pagina curentă
        if (paginaCurenta > totalPagini && totalPagini > 0) {
            paginaCurenta = totalPagini;
        }
        if (paginaCurenta < 1) {
            paginaCurenta = 1;
        }
        
        // Calculează intervalul pentru pagina curentă
        const startIndex = (paginaCurenta - 1) * produsePePagina;
        const endIndex = Math.min(startIndex + produsePePagina, totalProduse);
        
        console.log('Interval afișare:', startIndex, 'până la', endIndex);
        
        // Ascunde toate produsele din container
        const toateProdusele = document.querySelectorAll('.produs-item');
        toateProdusele.forEach(produs => {
            produs.style.display = 'none';
        });
        
        // Afișează doar produsele din pagina curentă din lista filtrată
        let produseAfisate = 0;
        for (let i = startIndex; i < endIndex && i < produseFiltrate.length; i++) {
            if (produseFiltrate[i]) {
                produseFiltrate[i].style.display = 'block';
                produseAfisate++;
            }
        }
        
        console.log('Produse afișate pe pagina curentă:', produseAfisate);
        
        // Actualizează informațiile de paginare
        actualizareInfoPaginare(Math.max(1, startIndex + 1), startIndex + produseAfisate, totalProduse);
        
        // Generează butoanele de paginare
        genereazaButoanePaginare(totalPagini);
        
        // UPDATED: Verifică dacă sunt produse vizibile pentru mesajul "nu există produse"
        toggleNoProductsMessage(produseAfisate);
        
        // After pagination, trigger cheapest product marking
        setTimeout(() => {
            if (typeof markCheapestProducts === 'function') {
                markCheapestProducts();
            }
        }, 100);
    }
    
    function actualizareInfoPaginare(start, end, total) {
        const startItem = document.getElementById('start-item');
        const endItem = document.getElementById('end-item');
        const totalItems = document.getElementById('total-items');
        
        if (startItem) startItem.textContent = start;
        if (endItem) endItem.textContent = end;
        if (totalItems) totalItems.textContent = total;
    }

    function genereazaButoanePaginare(totalPagini) {
        const paginationList = document.getElementById('pagination-list');
        if (!paginationList) return;
        
        paginationList.innerHTML = '';
        
        if (totalPagini <= 1) return;
        
        // Buton Previous
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${paginaCurenta === 1 ? 'disabled' : ''}`;
        prevItem.innerHTML = `<a class="page-link" href="#" data-page="${paginaCurenta - 1}">Anterior</a>`;
        paginationList.appendChild(prevItem);
        
        // Calculează intervalul de pagini de afișat
        let startPage = Math.max(1, paginaCurenta - 2);
        let endPage = Math.min(totalPagini, paginaCurenta + 2);
        
        // Ajustează intervalul pentru a avea mereu 5 pagini (dacă există)
        if (endPage - startPage < 4) {
            if (startPage === 1) {
                endPage = Math.min(totalPagini, startPage + 4);
            } else {
                startPage = Math.max(1, endPage - 4);
            }
        }
        
        // Prima pagină și "..."
        if (startPage > 1) {
            const firstItem = document.createElement('li');
            firstItem.className = 'page-item';
            firstItem.innerHTML = '<a class="page-link" href="#" data-page="1">1</a>';
            paginationList.appendChild(firstItem);
            
            if (startPage > 2) {
                const dotsItem = document.createElement('li');
                dotsItem.className = 'page-item disabled';
                dotsItem.innerHTML = '<span class="page-link">...</span>';
                paginationList.appendChild(dotsItem);
            }
        }
        
        // Paginile din interval
        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === paginaCurenta ? 'active' : ''}`;
            pageItem.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            paginationList.appendChild(pageItem);
        }
        
        // "..." și ultima pagină
        if (endPage < totalPagini) {
            if (endPage < totalPagini - 1) {
                const dotsItem = document.createElement('li');
                dotsItem.className = 'page-item disabled';
                dotsItem.innerHTML = '<span class="page-link">...</span>';
                paginationList.appendChild(dotsItem);
            }
            
            const lastItem = document.createElement('li');
            lastItem.className = 'page-item';
            lastItem.innerHTML = `<a class="page-link" href="#" data-page="${totalPagini}">${totalPagini}</a>`;
            paginationList.appendChild(lastItem);
        }
        
        // Buton Next
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${paginaCurenta === totalPagini ? 'disabled' : ''}`;
        nextItem.innerHTML = `<a class="page-link" href="#" data-page="${paginaCurenta + 1}">Următor</a>`;
        paginationList.appendChild(nextItem);
        
        // Adaugă event listeners pentru butoanele de paginare
        paginationList.addEventListener('click', function(e) {
            e.preventDefault();
            if (e.target.classList.contains('page-link') && !e.target.parentElement.classList.contains('disabled')) {
                const newPage = parseInt(e.target.dataset.page);
                if (newPage && newPage !== paginaCurenta) {
                    paginaCurenta = newPage;
                    aplicaPaginare();
                }
            }
        });
    }
    
    // Funcție pentru normalizarea textului (eliminarea diacriticelor)
    function normalizareDiacritice(text) {
        const diacriticeMap = {
            'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
            'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T',
            'á': 'a', 'à': 'a', 'ä': 'a', 'é': 'e', 'è': 'e', 'ë': 'e',
            'í': 'i', 'ì': 'i', 'ï': 'i', 'ó': 'o', 'ò': 'o', 'ö': 'o',
            'ú': 'u', 'ù': 'u', 'ü': 'u', 'ç': 'c', 'ñ': 'n'
        };
        
        return text.replace(/[ăâîșțĂÂÎȘȚáàäéèëíìïóòöúùüçñ]/g, function(match) {
            return diacriticeMap[match] || match;
        });
    }

    // Funcții pentru gestionarea stării produselor în sessionStorage
    function loadSessionState() {
        try {
            const sessionData = sessionStorage.getItem('hiddenSessionProducts');
            if (sessionData) {
                const hiddenArray = JSON.parse(sessionData);
                hiddenSessionProducts = new Set(hiddenArray);
                console.log('Stare încărcată din sessionStorage:', hiddenSessionProducts.size, 'produse ascunse');
                console.log('Produse ascunse pentru sesiune:', Array.from(hiddenSessionProducts));
            }
        } catch (error) {
            console.error('Eroare la încărcarea stării din sessionStorage:', error);
            hiddenSessionProducts = new Set();
        }
    }

    function saveSessionState() {
        try {
            const hiddenArray = Array.from(hiddenSessionProducts);
            sessionStorage.setItem('hiddenSessionProducts', JSON.stringify(hiddenArray));
            console.log('Stare salvată în sessionStorage:', hiddenSessionProducts.size, 'produse ascunse');
            console.log('Array salvat:', hiddenArray);
        } catch (error) {
            console.error('Eroare la salvarea stării în sessionStorage:', error);
        }
    }

    // Funcții pentru paginare
    function initializarePaginare() {
        const itemsPerPageSelect = document.getElementById('items-per-page');
        if (itemsPerPageSelect) {
            console.log('Items per page select găsit, valoare inițială:', itemsPerPageSelect.value);
            
            // Setează valoarea inițială
            produsePePagina = parseInt(itemsPerPageSelect.value) || 12;
            
            // Adaugă event listener
            itemsPerPageSelect.addEventListener('change', function(e) {
                const noualValoare = parseInt(this.value) || 12;
                console.log('Schimbare produse pe pagină de la', produsePePagina, 'la', noualValoare);
                produsePePagina = noualValoare;
                paginaCurenta = 1; // Reset la prima pagină
                aplicaPaginare();
            });
            
            // Event listener pentru debugging
            itemsPerPageSelect.addEventListener('click', function() {
                console.log('Click pe select, valoarea curentă:', this.value);
            });
        } else {
            console.error('Select items-per-page nu a fost găsit în DOM');
        }
        
        // Inițializează cu toate produsele vizibile
        actualizareProduseFiltrate();
        aplicaPaginare();
    }

    function actualizareProduseFiltrate() {
        const toateProdusele = document.querySelectorAll('.produs-item');
        produseFiltrate = Array.from(toateProdusele).filter(item => {
            const productId = item.querySelector('[data-product-id]')?.dataset.productId;
            
            // PRIMA VERIFICARE: Exclude produsele ascunse pentru sesiune
            if (hiddenSessionProducts.has(productId)) {
                return false;
            }
            
            // Exclude produsele ascunse temporar (dacă nu sunt pinned)
            if (hiddenTempProducts.has(productId) && !pinnedProducts.has(productId)) {
                return false;
            }
            
            return true;
        });
        
        console.log('Produse filtrate actualizate:', produseFiltrate.length);
        console.log('Produse ascunse pentru sesiune:', Array.from(hiddenSessionProducts));
    }

    function aplicaPaginare() {
        console.log('Aplicare paginare - produse pe pagină:', produsePePagina, 'pagina curentă:', paginaCurenta);
        
        if (!produseFiltrate || produseFiltrate.length === 0) {
            console.log('Nu există produse filtrate, actualizez lista');
            actualizareProduseFiltrate();
        }
        
        const totalProduse = produseFiltrate.length;
        const totalPagini = Math.ceil(totalProduse / produsePePagina);
        
        console.log('Total produse:', totalProduse, 'Total pagini:', totalPagini);
        
        // UPDATED: Verifică dacă nu sunt produse
        if (totalProduse === 0) {
            toggleNoProductsMessage(0);
            return;
        }
        
        // Validează pagina curentă
        if (paginaCurenta > totalPagini && totalPagini > 0) {
            paginaCurenta = totalPagini;
        }
        if (paginaCurenta < 1) {
            paginaCurenta = 1;
        }
        
        // Calculează intervalul pentru pagina curentă
        const startIndex = (paginaCurenta - 1) * produsePePagina;
        const endIndex = Math.min(startIndex + produsePePagina, totalProduse);
        
        console.log('Interval afișare:', startIndex, 'până la', endIndex);
        
        // Ascunde toate produsele din container
        const toateProdusele = document.querySelectorAll('.produs-item');
        toateProdusele.forEach(produs => {
            produs.style.display = 'none';
        });
        
        // Afișează doar produsele din pagina curentă din lista filtrată
        let produseAfisate = 0;
        for (let i = startIndex; i < endIndex && i < produseFiltrate.length; i++) {
            if (produseFiltrate[i]) {
                produseFiltrate[i].style.display = 'block';
                produseAfisate++;
            }
        }
        
        console.log('Produse afișate pe pagina curentă:', produseAfisate);
        
        // Actualizează informațiile de paginare
        actualizareInfoPaginare(Math.max(1, startIndex + 1), startIndex + produseAfisate, totalProduse);
        
        // Generează butoanele de paginare
        genereazaButoanePaginare(totalPagini);
        
        // UPDATED: Verifică dacă sunt produse vizibile pentru mesajul "nu există produse"
        toggleNoProductsMessage(produseAfisate);
        
        // After pagination, trigger cheapest product marking
        setTimeout(() => {
            if (typeof markCheapestProducts === 'function') {
                markCheapestProducts();
            }
        }, 100);
    }
    
    function actualizareInfoPaginare(start, end, total) {
        const startItem = document.getElementById('start-item');
        const endItem = document.getElementById('end-item');
        const totalItems = document.getElementById('total-items');
        
        if (startItem) startItem.textContent = start;
        if (endItem) endItem.textContent = end;
        if (totalItems) totalItems.textContent = total;
    }

    function genereazaButoanePaginare(totalPagini) {
        const paginationList = document.getElementById('pagination-list');
        if (!paginationList) return;
        
        paginationList.innerHTML = '';
        
        if (totalPagini <= 1) return;
        
        // Buton Previous
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${paginaCurenta === 1 ? 'disabled' : ''}`;
        prevItem.innerHTML = `<a class="page-link" href="#" data-page="${paginaCurenta - 1}">Anterior</a>`;
        paginationList.appendChild(prevItem);
        
        // Calculează intervalul de pagini de afișat
        let startPage = Math.max(1, paginaCurenta - 2);
        let endPage = Math.min(totalPagini, paginaCurenta + 2);
        
        // Ajustează intervalul pentru a avea mereu 5 pagini (dacă există)
        if (endPage - startPage < 4) {
            if (startPage === 1) {
                endPage = Math.min(totalPagini, startPage + 4);
            } else {
                startPage = Math.max(1, endPage - 4);
            }
        }
        
        // Prima pagină și "..."
        if (startPage > 1) {
            const firstItem = document.createElement('li');
            firstItem.className = 'page-item';
            firstItem.innerHTML = '<a class="page-link" href="#" data-page="1">1</a>';
            paginationList.appendChild(firstItem);
            
            if (startPage > 2) {
                const dotsItem = document.createElement('li');
                dotsItem.className = 'page-item disabled';
                dotsItem.innerHTML = '<span class="page-link">...</span>';
                paginationList.appendChild(dotsItem);
            }
        }
        
        // Paginile din interval
        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === paginaCurenta ? 'active' : ''}`;
            pageItem.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            paginationList.appendChild(pageItem);
        }
        
        // "..." și ultima pagină
        if (endPage < totalPagini) {
            if (endPage < totalPagini - 1) {
                const dotsItem = document.createElement('li');
                dotsItem.className = 'page-item disabled';
                dotsItem.innerHTML = '<span class="page-link">...</span>';
                paginationList.appendChild(dotsItem);
            }
            
            const lastItem = document.createElement('li');
            lastItem.className = 'page-item';
            lastItem.innerHTML = `<a class="page-link" href="#" data-page="${totalPagini}">${totalPagini}</a>`;
            paginationList.appendChild(lastItem);
        }
        
        // Buton Next
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${paginaCurenta === totalPagini ? 'disabled' : ''}`;
        nextItem.innerHTML = `<a class="page-link" href="#" data-page="${paginaCurenta + 1}">Următor</a>`;
        paginationList.appendChild(nextItem);
        
        // Adaugă event listeners pentru butoanele de paginare
        paginationList.addEventListener('click', function(e) {
            e.preventDefault();
            if (e.target.classList.contains('page-link') && !e.target.parentElement.classList.contains('disabled')) {
                const newPage = parseInt(e.target.dataset.page);
                if (newPage && newPage !== paginaCurenta) {
                    paginaCurenta = newPage;
                    aplicaPaginare();
                }
            }
        });
    }
    
    // Funcție pentru validarea cheilor de sortare
    function validateSortKeys() {
        const key1 = document.getElementById('sort-key-1')?.value;
        const key2 = document.getElementById('sort-key-2')?.value;
        
        if (key1 && key2 && key1 === key2) {
            showToast('Atenție', 'Cheile de sortare sunt identice. Se va folosi doar prima cheie.', 'warning');
            document.getElementById('sort-key-2').value = '';
        }
    }
    
    // Funcție pentru sortarea personalizabilă
    function sortarePersonalizabila() {
        console.log('Sortare personalizabilă apelată');
        
        const key1 = document.getElementById('sort-key-1')?.value;
        const order1 = document.getElementById('sort-order-1')?.value;
        const key2 = document.getElementById('sort-key-2')?.value;
        const order2 = document.getElementById('sort-order-2')?.value;
        
        console.log('Chei sortare:', { key1, order1, key2, order2 });
        
        if (!key1) {
            showToast('Eroare sortare', 'Trebuie să selectați prima cheie de sortare', 'warning');
            return;
        }
        
        // Obține toate produsele vizibile
        const container = document.getElementById('produse-container');
        if (!container) {
            console.error('Container produse nu a fost găsit');
            return;
        }
        
        const produseVizibile = Array.from(container.querySelectorAll('.produs-item')).filter(item => {
            return window.getComputedStyle(item).display !== 'none';
        });
        
        console.log('Produse vizibile pentru sortare:', produseVizibile.length);
        
        if (produseVizibile.length === 0) {
            showToast('Info', 'Nu sunt produse vizibile pentru sortare', 'info');
            return;
        }
        
        // Sortează produsele
        produseVizibile.sort((a, b) => {
            const cardA = a.querySelector('.produs-card');
            const cardB = b.querySelector('.produs-card');
            
            if (!cardA || !cardB) return 0;
            
            // Prima sortare
            let result = comparareProduse(cardA, cardB, key1, order1);
            
            // Dacă sunt egale și avem a doua cheie, sortează după ea
            if (result === 0 && key2 && key2 !== '') {
                result = comparareProduse(cardA, cardB, key2, order2);
            }
            
            return result;
        });
        
        // Reordonează în DOM
        produseVizibile.forEach(item => {
            container.appendChild(item);
        });
        
        // Actualizează array-ul de produse filtrate pentru paginare
        produseFiltrate = produseVizibile;
        paginaCurenta = 1;
        aplicaPaginare();
        
        const keyText1 = getSortKeyDisplayName(key1);
        const keyText2 = key2 && key2 !== '' ? `, apoi ${getSortKeyDisplayName(key2)}` : '';
        const orderText1 = order1 === 'asc' ? 'crescător' : 'descrescător';
        const orderText2 = key2 && key2 !== '' ? (order2 === 'asc' ? ' crescător' : ' descrescător') : '';
        
        const message = `Sortare după ${keyText1} (${orderText1})${keyText2}${orderText2}`;
        showToast('Sortare aplicată', message, 'success');
        
        console.log(`Sortare personalizată completă: ${key1} (${order1})${key2 ? ` + ${key2} (${order2})` : ''}`);
    }

    function comparareProduse(cardA, cardB, key, order) {
        let valueA = getProductValue(cardA, key);
        let valueB = getProductValue(cardB, key);
        
        // Normalizează pentru comparație
        if (typeof valueA === 'string') {
            valueA = normalizareDiacritice(valueA.toLowerCase());
        }
        if (typeof valueB === 'string') {
            valueB = normalizareDiacritice(valueB.toLowerCase());
        }
        
        let result;
        if (valueA < valueB) {
            result = -1;
        } else if (valueA > valueB) {
            result = 1;
        } else {
            result = 0;
        }
        
        return order === 'desc' ? -result : result;
    }

    function getProductValue(card, key) {
        switch (key) {
            case 'nume':
                return card.dataset.nume || card.querySelector('.card-title a')?.textContent || '';
            case 'pret':
                return parseFloat(card.dataset.pret) || 0;
            case 'categorie':
                return card.dataset.categorie || '';
            case 'culoare':
                return card.dataset.culoare || '';
            case 'dimensiune':
                return parseInt(card.dataset.dimensiune) || 0;
            case 'data':
                return new Date(card.dataset.data || '1970-01-01');
            case 'garantie':
                return card.dataset.garantie === 'true' ? 1 : 0;
            default:
                return '';
        }
    }

    function getSortKeyDisplayName(key) {
        const names = {
            'nume': 'nume',
            'pret': 'preț',
            'categorie': 'categorie',
            'culoare': 'culoare',
            'dimensiune': 'dimensiune',
            'data': 'data introducere',
            'garantie': 'garanție'
        };
        return names[key] || key;
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
        butoane.reseteaza.addEventListener('click', function() {
            if (!confirm('Sunteți sigur că doriți să resetați toate filtrele?')) {
                return;
            }
            
            console.log('Resetare filtre');
            
            // Resetează toate input-urile de filtrare
            document.getElementById('filtru-nume').value = '';
            document.getElementById('filtru-descriere').value = '';
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
            
            // Resetează starea produselor (doar pentru sesiunea curentă)
            pinnedProducts.clear();
            hiddenTempProducts.clear();
            // IMPORTANT: NU resetează hiddenSessionProducts - acestea rămân pentru toată sesiunea
            
            // Afișează toate produsele (exceptând cele ascunse pentru sesiune)
            const produse = document.querySelectorAll('.produs-item');
            produse.forEach(produsItem => {
                const productId = produsItem.querySelector('[data-product-id]')?.dataset.productId;
                
                // Verifică dacă este ascuns pentru sesiune
                if (!hiddenSessionProducts.has(productId)) {
                    produsItem.style.display = 'block';
                } else {
                    produsItem.style.display = 'none'; // Menține ascuns pentru sesiune
                }
                
                // Resetează clasele CSS
                const productCard = produsItem.querySelector('.produs-card');
                if (productCard) {
                    productCard.classList.remove('pinned', 'hidden-temp');
                }
                
                // Resetează butoanele
                const pinBtn = produsItem.querySelector('.pin-product');
                const hideBtn = produsItem.querySelector('.hide-temp');
                if (pinBtn) {
                    pinBtn.classList.remove('btn-warning');
                    pinBtn.classList.add('btn-outline-warning');
                    pinBtn.title = 'Păstrează produsul afișat mereu (nu dispare la filtrare)';
                }
                if (hideBtn) {
                    hideBtn.classList.remove('btn-secondary');
                    hideBtn.classList.add('btn-outline-secondary');
                    hideBtn.title = 'Ascunde temporar produsul din afișarea curentă';
                }
            });
            
            // Resetează paginarea
            actualizareProduseFiltrate();
            paginaCurenta = 1;
            aplicaPaginare();
            
            console.log('Filtre și stare produse resetate');
        });
    }
    
    // Event listeners pentru sortarea personalizabilă
    const btnSortareCustom = document.getElementById('btn-sortare-custom');
    if (btnSortareCustom) {
        console.log('Buton sortare custom găsit');
        btnSortareCustom.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Click pe buton sortare custom');
            sortarePersonalizabila();
        });
    } else {
        console.error('Butonul de sortare custom nu a fost găsit');
    }
    
    // Validare chei de sortare
    const sortKey1 = document.getElementById('sort-key-1');
    const sortKey2 = document.getElementById('sort-key-2');
    if (sortKey1 && sortKey2) {
        sortKey1.addEventListener('change', validateSortKeys);
        sortKey2.addEventListener('change', validateSortKeys);
    }
    
    console.log('Event listeners adăugați pentru toate butoanele');
    
    // Event listener pentru validarea în timp real a textarea-ului
    if (filtre.nume) {
        filtre.nume.addEventListener('input', function() {
            valideazaInputuri();
        });
    }

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
    
    // Inițializare
    initializeProductActions();
    initializarePaginare();
    
    // Initial marking of cheapest products after page load
    setTimeout(() => {
        if (typeof markCheapestProducts === 'function') {
            markCheapestProducts();
        }
    }, 500);
});
