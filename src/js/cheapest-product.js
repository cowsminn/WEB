document.addEventListener('DOMContentLoaded', function() {
    markCheapestProducts();
    
    // Observe DOM changes to maintain cheapest markers after filtering/sorting
    const productsContainer = document.querySelector('#produse-container') || document.querySelector('.grid-produse');
    if (productsContainer) {
        const observer = new MutationObserver(function(mutations) {
            // Debounce the marking to avoid excessive calls
            clearTimeout(window.cheapestMarkingTimeout);
            window.cheapestMarkingTimeout = setTimeout(markCheapestProducts, 100);
        });
        
        observer.observe(productsContainer, { 
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
    
    // Re-mark after filtering operations
    document.addEventListener('productFiltered', markCheapestProducts);
    document.addEventListener('productSorted', markCheapestProducts);
});

function markCheapestProducts() {
    // Remove existing markers
    document.querySelectorAll('.cheapest-badge').forEach(badge => badge.remove());
    document.querySelectorAll('.produs-card').forEach(card => card.classList.remove('cheapest-product'));
    
    // Get all visible products using the current structure
    const products = document.querySelectorAll('.produs-item:not([style*="display: none"]):not([style*="display:none"]) .produs-card');
    
    // Group products by category
    const categorizedProducts = {};
    
    products.forEach(product => {
        const category = product.dataset.categorie || 'uncategorized';
        
        // Get product price from data attribute
        let price = null;
        const priceData = product.dataset.pret;
        if (priceData) {
            price = parseFloat(priceData);
        }
        
        if (price !== null && !isNaN(price)) {
            if (!categorizedProducts[category]) {
                categorizedProducts[category] = [];
            }
            
            categorizedProducts[category].push({
                element: product,
                price: price
            });
        }
    });
    
    // Find and mark the cheapest product in each category
    Object.keys(categorizedProducts).forEach(category => {
        if (categorizedProducts[category].length > 1) { // Only mark if there are multiple products in category
            // Sort by price (ascending)
            categorizedProducts[category].sort((a, b) => a.price - b.price);
            
            // Get the cheapest product
            const cheapest = categorizedProducts[category][0];
            
            // Create and add the marker
            const badge = document.createElement('div');
            badge.className = 'cheapest-badge';
            badge.innerHTML = '<i class="fas fa-crown"></i> Cel mai ieftin din categoria sa!';
            
            // Add classes and badge
            cheapest.element.classList.add('cheapest-product');
            cheapest.element.appendChild(badge);
            
            console.log(`Marked cheapest product in category ${category}: ${cheapest.price} RON`);
        }
    });
}

// Export function for manual calling if needed
window.markCheapestProducts = markCheapestProducts;
