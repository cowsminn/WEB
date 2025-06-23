class ComparareManager {
    constructor() {
        this.produse = [];
        this.containerComparare = null;
        this.storageKey = 'produse-comparare';
        this.timestampKey = 'comparare-timestamp';
        this.maxProduse = 2;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.checkExpiration();
        this.createCompareContainer();
        this.updateUI();
        this.bindEvents();
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.produse = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Eroare la încărcarea din localStorage:', error);
            this.produse = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.produse));
            localStorage.setItem(this.timestampKey, Date.now().toString());
        } catch (error) {
            console.error('Eroare la salvarea în localStorage:', error);
        }
    }

    checkExpiration() {
        const timestamp = localStorage.getItem(this.timestampKey);
        if (timestamp) {
            const dayInMs = 24 * 60 * 60 * 1000;
            if (Date.now() - parseInt(timestamp) > dayInMs) {
                this.clearAll();
            }
        }
    }

    createCompareContainer() {
        // Verifică dacă containerul există deja
        if (document.getElementById('container-comparare')) {
            this.containerComparare = document.getElementById('container-comparare');
            return;
        }
        
        this.containerComparare = document.createElement('div');
        this.containerComparare.id = 'container-comparare';
        this.containerComparare.className = 'compare-container';
        this.containerComparare.innerHTML = `
            <div class="compare-header">
                <h6><i class="fas fa-balance-scale"></i> Comparare produse</h6>
                <button class="btn-close-compare" onclick="comparareManager.clearAll()" title="Închide comparare">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="compare-content">
                <div id="compare-products-list"></div>
                <div id="compare-actions" style="display: none;">
                    <button class="btn btn-success btn-sm w-100" onclick="comparareManager.showComparison()">
                        <i class="fas fa-eye"></i> Afișează
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.containerComparare);
    }

    updateUI() {
        if (this.produse.length === 0) {
            if (this.containerComparare) {
                this.containerComparare.style.display = 'none';
            }
            this.enableAllCompareButtons();
            return;
        }

        this.containerComparare.style.display = 'block';
        this.updateProductsList();
        this.updateCompareButtons();
    }

    updateProductsList() {
        const list = document.getElementById('compare-products-list');
        const actions = document.getElementById('compare-actions');
        
        list.innerHTML = this.produse.map(produs => `
            <div class="compare-product-item">
                <span class="product-name">${produs.nume}</span>
                <button class="btn-remove-product" onclick="event.stopPropagation(); comparareManager.removeProduct('${produs.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        actions.style.display = this.produse.length === 2 ? 'block' : 'none';
    }

    updateCompareButtons() {
        const buttons = document.querySelectorAll('.btn-compare');
        
        buttons.forEach(btn => {
            const productId = btn.dataset.productId;
            const isInComparison = this.produse.some(p => p.id === productId);
            
            if (this.produse.length >= this.maxProduse && !isInComparison) {
                btn.disabled = true;
                btn.classList.add('disabled');
                btn.title = 'Ștergeți un produs din lista de comparare';
            } else {
                btn.disabled = false;
                btn.classList.remove('disabled');
                btn.title = isInComparison ? 'Produs deja în comparare' : 'Adaugă la comparare';
            }
        });
    }

    enableAllCompareButtons() {
        const buttons = document.querySelectorAll('.btn-compare');
        buttons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
            btn.title = 'Adaugă la comparare';
        });
    }

    addProduct(productData) {
        // Verifică dacă produsul există deja
        if (this.produse.some(p => p.id === productData.id)) {
            // Elimină notificarea - nu mai afișăm mesaj
            return;
        }

        // Verifică limita de 2 produse
        if (this.produse.length >= 2) {
            // Elimină notificarea - nu mai afișăm mesaj
            return;
        }

        this.produse.push(productData);
        this.saveToStorage();
        this.updateUI();
        
        // Elimină notificarea de succes
        // this.showMessage(`Produsul "${productData.nume}" a fost adăugat la comparare`, 'success');
    }

    removeProduct(productId) {
        this.produse = this.produse.filter(p => p.id !== productId);
        this.saveToStorage();
        this.updateUI();
        
        // Elimină notificarea de eliminare
        // this.showMessage('Produsul a fost eliminat din comparare', 'info');
    }

    clearAll() {
        this.produse = [];
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.timestampKey);
        this.updateUI();
        
        // Elimină notificarea de golire
        // this.showMessage('Lista de comparare a fost golită', 'info');
    }

    showComparison() {
        if (this.produse.length !== 2) {
            this.showMessage('Selectați exact 2 produse pentru comparare', 'warning');
            return;
        }

        const comparisonWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        comparisonWindow.document.write(this.generateComparisonHTML());
        comparisonWindow.document.close();
    }

    generateComparisonHTML() {
        const produs1 = this.produse[0];
        const produs2 = this.produse[1];
        
        const caracteristici = [
            { key: 'nume', label: 'Nume produs', icon: 'fas fa-tag' },
            { key: 'descriere', label: 'Descriere', icon: 'fas fa-align-left' },
            { key: 'pret', label: 'Preț (RON)', icon: 'fas fa-euro-sign' },
            { key: 'categorie_mare', label: 'Categorie', icon: 'fas fa-folder' },
            { key: 'culoare', label: 'Culoare', icon: 'fas fa-palette' },
            { key: 'dimensiune', label: 'Dimensiune (cm)', icon: 'fas fa-ruler' },
            { key: 'garantie', label: 'Garanție', icon: 'fas fa-shield-alt' },
            { key: 'tip_prezentare', label: 'Tip prezentare', icon: 'fas fa-truck' },
            { key: 'data_introducere', label: 'Data introducere', icon: 'fas fa-calendar' },
            { key: 'caracteristici_speciale', label: 'Caracteristici speciale', icon: 'fas fa-star' }
        ];

        return `
            <!DOCTYPE html>
            <html lang="ro">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Comparare Produse - ElectroDelicii</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
                <style>
                    body { 
                        font-family: Georgia, serif; 
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                        min-height: 100vh;
                    }
                    .comparison-header { 
                        background: linear-gradient(135deg, #CB4967, #F2305E); 
                        color: white; 
                        padding: 2rem; 
                        text-align: center; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    }
                    .product-image { 
                        width: 150px; 
                        height: 150px; 
                        object-fit: cover; 
                        border-radius: 10px; 
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    }
                    .comparison-table { 
                        background: white; 
                        border-radius: 15px; 
                        overflow: hidden; 
                        box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
                    }
                    .table th { 
                        background: linear-gradient(135deg, #f8f9fa, #e9ecef); 
                        font-weight: 600; 
                        color: #495057; 
                        border-bottom: 2px solid #CB4967;
                        vertical-align: middle;
                    }
                    .table td { 
                        vertical-align: middle; 
                        padding: 1.5rem; 
                        border-bottom: 1px solid #e9ecef;
                    }
                    .characteristic-icon { 
                        color: #CB4967; 
                        margin-right: 0.75rem; 
                        font-size: 1.1rem;
                    }
                    .product-header { 
                        text-align: center; 
                        padding: 2rem; 
                        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                    }
                    .price-highlight { 
                        color: #28a745; 
                        font-weight: bold; 
                        font-size: 1.3rem; 
                    }
                    .badge-custom { 
                        background: linear-gradient(135deg, #CB4967, #F2305E); 
                        color: white; 
                        padding: 0.5rem 1rem;
                        border-radius: 20px;
                        margin: 0.2rem;
                        display: inline-block;
                    }
                    .btn-print { 
                        position: fixed; 
                        bottom: 30px; 
                        right: 30px; 
                        z-index: 1000; 
                        border-radius: 50px;
                        padding: 1rem 1.5rem;
                        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                    }
                    .vs-indicator {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 2rem;
                        font-weight: bold;
                        color: #CB4967;
                        margin: 1rem 0;
                    }
                    .comparison-row:nth-child(even) {
                        background-color: rgba(248, 249, 250, 0.5);
                    }
                    .product-name-header {
                        font-size: 1.2rem;
                        font-weight: 600;
                        color: #CB4967;
                        margin-top: 1rem;
                    }
                </style>
            </head>
            <body>
                <div class="comparison-header">
                    <h1><i class="fas fa-balance-scale"></i> Comparare Produse</h1>
                    <p class="mb-0">ElectroDelicii - Comparație detaliată</p>
                    <div class="vs-indicator mt-3">
                        <span>${produs1.nume}</span>
                        <span class="mx-4">VS</span>
                        <span>${produs2.nume}</span>
                    </div>
                </div>
                
                <div class="container-fluid py-4">
                    <div class="comparison-table">
                        <table class="table table-hover mb-0">
                            <thead>
                                <tr>
                                    <th width="25%" class="text-center">Caracteristică</th>
                                    <th width="37.5%" class="text-center">
                                        <div class="product-header">
                                            <img src="/src/img/produse/${produs1.imagine}" class="product-image mb-3" alt="${produs1.nume}">
                                            <div class="product-name-header">${produs1.nume}</div>
                                        </div>
                                    </th>
                                    <th width="37.5%" class="text-center">
                                        <div class="product-header">
                                            <img src="/src/img/produse/${produs2.imagine}" class="product-image mb-3" alt="${produs2.nume}">
                                            <div class="product-name-header">${produs2.nume}</div>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                ${caracteristici.map(car => `
                                    <tr class="comparison-row">
                                        <td class="text-center fw-bold">
                                            <i class="${car.icon} characteristic-icon"></i>
                                            ${car.label}
                                        </td>
                                        <td class="text-center">
                                            ${this.formatValue(produs1[car.key], car.key)}
                                        </td>
                                        <td class="text-center">
                                            ${this.formatValue(produs2[car.key], car.key)}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="text-center mt-5">
                        <button class="btn btn-primary btn-lg me-3" onclick="window.print()">
                            <i class="fas fa-print"></i> Printează comparația
                        </button>
                        <button class="btn btn-secondary btn-lg" onclick="window.close()">
                            <i class="fas fa-times"></i> Închide
                        </button>
                    </div>
                </div>
                
                <button class="btn btn-primary btn-print" onclick="window.print()">
                    <i class="fas fa-print"></i>
                </button>
                
                <script>
                    // Add print styles
                    const printStyles = \`
                        @media print {
                            .btn-print, .text-center .btn { display: none !important; }
                            body { background: white !important; }
                            .comparison-header { break-inside: avoid; }
                            .table { break-inside: avoid; }
                        }
                    \`;
                    const styleSheet = document.createElement("style");
                    styleSheet.innerText = printStyles;
                    document.head.appendChild(styleSheet);
                </script>
            </body>
            </html>
        `;
    }

    formatValue(value, key) {
        if (!value && value !== 0 && value !== false) return '<span class="text-muted">N/A</span>';
        
        switch (key) {
            case 'pret':
                return `<span class="price-highlight">${value} RON</span>`;
            case 'garantie':
                return value === true || value === 'true' ? 
                    '<span class="badge bg-success">Da</span>' : 
                    '<span class="badge bg-secondary">Nu</span>';
            case 'tip_prezentare':
                return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            case 'data_introducere':
                try {
                    return new Date(value).toLocaleDateString('ro-RO');
                } catch (e) {
                    return value;
                }
            case 'caracteristici_speciale':
                if (!value || value.trim() === '') return '<span class="text-muted">Fără caracteristici speciale</span>';
                return value.split(',').map(car => 
                    `<span class="badge-custom">${car.trim()}</span>`
                ).join('');
            case 'categorie_mare':
            case 'culoare':
                return value.charAt(0).toUpperCase() + value.slice(1);
            case 'dimensiune':
                return `${value} cm`;
            default:
                return value;
        }
    }

    showMessage(message, type = 'info') {
        // Creează toast pentru feedback
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body"><strong>${message}</strong></div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Folosește Bootstrap Toast dacă este disponibil, altfel fallback la setTimeout
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
            toast.addEventListener('hidden.bs.toast', () => toast.remove());
        } else {
            // Fallback pentru când Bootstrap nu este disponibil
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
        return container;
    }

    bindEvents() {
        // Nu mai folosim event delegation global, ci event listeners specifici
        console.log('ComparareManager - Event listeners inițializați');
    }

    handleCompareClick(button, productId) {
        console.log('handleCompareClick apelat pentru produsul:', productId);
        
        // Extrage datele produsului din DOM
        const productData = this.extractProductData(button, productId);
        console.log('Date produs extrase:', productData);
        
        if (productData) {
            this.addProduct(productData);
        } else {
            console.error('Nu s-au putut extrage datele produsului');
            this.showMessage('Eroare la adăugarea produsului în comparare', 'error');
        }
    }

    extractProductData(button, productId) {
        console.log('Extragere date pentru produsul:', productId);
        
        // Prima încercare: căută în cardurile de produse
        let productElement = button.closest('.produs-card');
        if (!productElement) {
            productElement = button.closest('.produs-item');
        }
        if (!productElement) {
            productElement = document.querySelector(`[data-product-id="${productId}"]`);
        }

        if (productElement) {
            console.log('Element produs găsit:', productElement);
            
            // Caută datele în elementul ascuns cu toate informațiile
            const hiddenData = productElement.querySelector('.product-data');
            console.log('Date ascunse găsite:', hiddenData);
            
            if (hiddenData) {
                console.log('Dataset din hiddenData:', hiddenData.dataset);
                return {
                    id: productId,
                    nume: hiddenData.dataset.nume || 'Necunoscut',
                    descriere: hiddenData.dataset.descriere || '',
                    pret: hiddenData.dataset.pret || '0',
                    categorie_mare: hiddenData.dataset.categorie || '',
                    culoare: hiddenData.dataset.culoare || '',
                    dimensiune: hiddenData.dataset.dimensiune || '',
                    garantie: hiddenData.dataset.garantie === 'true',
                    tip_prezentare: hiddenData.dataset.tip || '',
                    data_introducere: hiddenData.dataset.data || '',
                    caracteristici_speciale: hiddenData.dataset.caracteristici || '',
                    imagine: hiddenData.dataset.imagine || productElement.querySelector('img')?.src?.split('/').pop() || 'default.jpg'
                };
            }
            
            // Fallback la dataset-ul din card
            if (productElement.dataset && productElement.dataset.nume) {
                console.log('Folosesc dataset din card:', productElement.dataset);
                return {
                    id: productId,
                    nume: productElement.dataset.nume || 'Necunoscut',
                    descriere: productElement.dataset.descriere || '',
                    pret: productElement.dataset.pret || '0',
                    categorie_mare: productElement.dataset.categorie || '',
                    culoare: productElement.dataset.culoare || '',
                    dimensiune: productElement.dataset.dimensiune || '',
                    garantie: productElement.dataset.garantie === 'true',
                    tip_prezentare: productElement.dataset.tip || '',
                    data_introducere: productElement.dataset.data || '',
                    caracteristici_speciale: productElement.dataset.caracteristici || '',
                    imagine: productElement.querySelector('img')?.src?.split('/').pop() || 'default.jpg'
                };
            }
        }

        // A doua încercare: pentru pagina individuală de produs
        const productSection = document.querySelector('.produs-detalii[data-product-id]');
        if (productSection && productSection.dataset.productId === productId) {
            console.log('Date găsite în secțiunea produs:', productSection.dataset);
            return {
                id: productId,
                nume: productSection.dataset.nume || document.querySelector('h1')?.textContent?.trim() || 'Produs necunoscut',
                descriere: productSection.dataset.descriere || document.querySelector('.produs-descriere p')?.textContent?.trim() || '',
                pret: productSection.dataset.pret || this.extractPriceFromPage() || '0',
                categorie_mare: productSection.dataset.categorie || this.extractCategoryFromPage() || '',
                culoare: productSection.dataset.culoare || this.extractColorFromPage() || '',
                dimensiune: productSection.dataset.dimensiune || this.extractDimensionFromPage() || '',
                garantie: productSection.dataset.garantie === 'true' || this.extractWarrantyFromPage(),
                tip_prezentare: productSection.dataset.tip || this.extractTypeFromPage() || '',
                data_introducere: productSection.dataset.data || this.extractDateFromPage() || '',
                caracteristici_speciale: productSection.dataset.caracteristici || this.extractCharacteristicsFromPage() || '',
                imagine: productSection.dataset.imagine || document.querySelector('.produs-imagine img')?.src?.split('/').pop() || 'default.jpg'
            };
        }

        // A treia încercare: fallback pentru pagina individuală
        if (window.location.pathname.includes('/produs/')) {
            console.log('Folosind fallback pentru pagina individuală');
            return this.extractFromProductPage(productId);
        }

        console.error('Nu s-au putut extrage datele produsului');
        return null;
    }

    extractFromProductPage(productId) {
        // Încearcă să extragă informațiile din structura HTML a paginii cu funcțiile helper
        const title = document.querySelector('h1, .produs-titlu')?.textContent?.trim() || 'Produs necunoscut';
        const description = document.querySelector('.produs-descriere p, .product-description p')?.textContent?.trim() || '';
        
        return {
            id: productId,
            nume: title,
            descriere: description,
            pret: this.extractPriceFromPage(),
            categorie_mare: this.extractCategoryFromPage(),
            culoare: this.extractColorFromPage(),
            dimensiune: this.extractDimensionFromPage(),
            garantie: this.extractWarrantyFromPage(),
            tip_prezentare: this.extractTypeFromPage(),
            data_introducere: this.extractDateFromPage(),
            caracteristici_speciale: this.extractCharacteristicsFromPage(),
            imagine: document.querySelector('.produs-imagine img, .product-image img')?.src?.split('/').pop() || 'default.jpg'
        };
    }
}

// Inițializează managerul de comparare
let comparareManager;
document.addEventListener('DOMContentLoaded', () => {
    comparareManager = new ComparareManager();
    // Fă managerul disponibil global
    window.comparareManager = comparareManager;
});
