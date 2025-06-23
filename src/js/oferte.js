document.addEventListener('DOMContentLoaded', function() {
    let currentOffer = null;
    
    function updateOffers() {
        // Calea corectă către fișierul JSON
        fetch('/src/json/oferte.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Offers data loaded:', data);
                if (!data.oferte || data.oferte.length === 0) {
                    hideOfferDisplay();
                    return;
                }

                const now = new Date().getTime();
                
                // Găsește prima ofertă activă
                let activeOffer = null;
                for (let offer of data.oferte) {
                    const startTime = new Date(offer['data-incepere']).getTime();
                    const endTime = new Date(offer['data-finalizare']).getTime();
                    
                    if (now >= startTime && now <= endTime) {
                        activeOffer = offer;
                        break;
                    }
                }
                
                if (!activeOffer) {
                    hideOfferDisplay();
                    return;
                }
                
                currentOffer = activeOffer;
                const endTime = new Date(currentOffer['data-finalizare']).getTime();
                
                showOfferDisplay(currentOffer, endTime);
                updateProductPrices(currentOffer);
            })
            .catch(error => {
                console.error('Eroare la încărcarea ofertei:', error);
                hideOfferDisplay();
            });
    }
    
    function showOfferDisplay(offer, endTime) {
        const container = document.getElementById('oferte-container');
        const ofertaText = document.getElementById('oferta-text');
        const timer = document.getElementById('timer');
        
        if (!container || !ofertaText || !timer) {
            console.log('Elementele pentru afișarea ofertei nu au fost găsite pe această pagină');
            return;
        }
        
        const ofertaMessage = `Reducere de ${offer.reducere}% la produsele din categoria ${offer.categorie} până la ${new Date(offer['data-finalizare']).toLocaleString('ro-RO')}`;
        ofertaText.innerText = ofertaMessage;
        container.style.display = 'block';
        
        // Curăță orice interval existent
        if (timer.dataset.intervalId) {
            clearInterval(parseInt(timer.dataset.intervalId));
        }
        
        function updateTimer() {
            const now = new Date().getTime();
            const distance = endTime - now;
            
            if (distance < 0) {
                clearInterval(timerInterval);
                timer.innerText = "Oferta a expirat";
                timer.style.color = "";
                timer.style.animation = "";
                
                setTimeout(() => {
                    hideOfferDisplay();
                    updateOffers(); // Reîncarcă ofertele pentru a afișa următoarea
                }, 2000);
                return;
            }
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            let timeString = '';
            if (days > 0) {
                timeString = `${days}z ${hours}h ${minutes}m ${seconds}s`;
            } else {
                timeString = `${hours}h ${minutes}m ${seconds}s`;
            }
            timer.innerText = timeString;

            // Marchează ultimele 10 secunde în mod diferit
            if (distance < 10000) {
                timer.style.color = "red";
                timer.style.fontWeight = "bold";
                timer.style.animation = "blink 1s infinite";
                
                // Adaugă un sunet în ultimele 10 secunde (opțional)
                if (!timer.dataset.soundPlayed && distance < 10000) {
                    timer.dataset.soundPlayed = "true";
                    try {
                        const audio = new Audio('/src/audio/alert.mp3');
                        audio.volume = 0.3;
                        audio.play().catch(e => console.log('Nu s-a putut reda sunetul:', e));
                    } catch (e) {
                        console.log('Browser-ul nu permite redarea automată a sunetelor');
                    }
                }
            } else {
                timer.style.color = "";
                timer.style.fontWeight = "";
                timer.style.animation = "";
                delete timer.dataset.soundPlayed;
            }
        }

        const timerInterval = setInterval(updateTimer, 1000);
        updateTimer();
        
        timer.dataset.intervalId = timerInterval;
    }
    
    function hideOfferDisplay() {
        const container = document.getElementById('oferte-container');
        const timer = document.getElementById('timer');
        
        if (container) {
            container.style.display = 'none';
        }
        
        if (timer && timer.dataset.intervalId) {
            clearInterval(parseInt(timer.dataset.intervalId));
            delete timer.dataset.intervalId;
        }
        
        // Resetează prețurile produselor
        resetProductPrices();
        currentOffer = null;
    }
    
    function updateProductPrices(offer) {
        const priceDisplays = document.querySelectorAll('.price-display');
        
        priceDisplays.forEach(priceDisplay => {
            const category = priceDisplay.dataset.category;
            const originalPrice = parseFloat(priceDisplay.dataset.originalPrice);
            
            if (category === offer.categorie && !isNaN(originalPrice)) {
                const discountedPrice = originalPrice * (1 - offer.reducere / 100);
                
                const currentPriceEl = priceDisplay.querySelector('.current-price');
                const originalPriceEl = priceDisplay.querySelector('.original-price');
                const discountBadgeEl = priceDisplay.querySelector('.discount-badge');
                
                if (currentPriceEl && originalPriceEl && discountBadgeEl) {
                    // Afișează prețul redus
                    currentPriceEl.innerText = `${discountedPrice.toFixed(2)} RON`;
                    currentPriceEl.classList.add('text-success');
                    
                    // Afișează prețul original tăiat
                    originalPriceEl.innerText = `${originalPrice.toFixed(2)} RON`;
                    originalPriceEl.style.display = 'inline';
                    
                    // Afișează badge-ul cu reducerea
                    discountBadgeEl.innerText = `-${offer.reducere}%`;
                    discountBadgeEl.style.display = 'inline';
                    
                    // Adaugă un indicator de ofertă la container
                    priceDisplay.classList.add('has-offer');
                }
            }
        });
    }
    
    function resetProductPrices() {
        const priceDisplays = document.querySelectorAll('.price-display.has-offer');
        
        priceDisplays.forEach(priceDisplay => {
            const originalPrice = parseFloat(priceDisplay.dataset.originalPrice);
            
            if (!isNaN(originalPrice)) {
                const currentPriceEl = priceDisplay.querySelector('.current-price');
                const originalPriceEl = priceDisplay.querySelector('.original-price');
                const discountBadgeEl = priceDisplay.querySelector('.discount-badge');
                
                if (currentPriceEl && originalPriceEl && discountBadgeEl) {
                    // Resetează la prețul original
                    currentPriceEl.innerText = `${originalPrice.toFixed(2)} RON`;
                    currentPriceEl.classList.remove('text-success');
                    
                    // Ascunde prețul original și badge-ul cu reducerea
                    originalPriceEl.style.display = 'none';
                    discountBadgeEl.style.display = 'none';
                    
                    // Elimină indicatorul de ofertă
                    priceDisplay.classList.remove('has-offer');
                }
            }
        });
    }

    // Adaugă CSS pentru animația de blinking
    if (!document.getElementById('offer-animations')) {
        const style = document.createElement('style');
        style.id = 'offer-animations';
        style.textContent = `
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.5; }
            }
            .price-display.has-offer {
                position: relative;
            }
            .price-display.has-offer::before {
                content: "🔥";
                position: absolute;
                top: -5px;
                right: -10px;
                font-size: 1.2em;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
        `;
        document.head.appendChild(style);
    }

    // Inițializează ofertele
    updateOffers();
    
    // Actualizează ofertele la fiecare minut
    setInterval(updateOffers, 60000);
});