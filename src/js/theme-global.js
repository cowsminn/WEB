// Script global pentru gestionarea temei pe toate paginile

// Aplică tema imediat pentru a evita flash-ul
(function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (document.body) {
        document.body.setAttribute('data-bs-theme', savedTheme);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            document.body.setAttribute('data-bs-theme', savedTheme);
        });
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    initializeGlobalTheme();
    
    function initializeGlobalTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        
        // Target only the standardized theme switches - remove conflicting selectors
        const themeSwitches = document.querySelectorAll('#headerThemeSwitch, .theme-toggle');
        
        themeSwitches.forEach(themeSwitch => {
            if (themeSwitch) {
                // Setează starea switch-ului
                themeSwitch.checked = savedTheme === 'dark';
                
                // Adaugă event listener
                themeSwitch.addEventListener('change', function() {
                    const newTheme = this.checked ? 'dark' : 'light';
                    applyTheme(newTheme);
                    localStorage.setItem('theme', newTheme);
                    
                    // Sincronizează toate switch-urile standardizate
                    document.querySelectorAll('#headerThemeSwitch, .theme-toggle').forEach(otherSwitch => {
                        if (otherSwitch !== this) {
                            otherSwitch.checked = this.checked;
                        }
                    });
                    
                    console.log(`Tema globală schimbată la: ${newTheme}`);
                    
                    // Dispatch custom event pentru alte scripturi
                    window.dispatchEvent(new CustomEvent('themeChanged', { 
                        detail: { theme: newTheme } 
                    }));
                });
            }
        });
        
        console.log(`Tema globală inițializată: ${savedTheme}`);
    }
    
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-bs-theme', theme);
        
        // Actualizează clasa pentru tema curentă pe body
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }
        
        // Aplică tema pe header și navigație
        const header = document.querySelector('header');
        const nav = document.querySelector('nav');
        
        if (header) {
            header.setAttribute('data-theme', theme);
            if (theme === 'dark') {
                header.classList.add('dark-theme');
                header.classList.remove('light-theme');
            } else {
                header.classList.add('light-theme');
                header.classList.remove('dark-theme');
            }
        }
        
        if (nav) {
            nav.setAttribute('data-theme', theme);
            if (theme === 'dark') {
                nav.classList.add('dark-theme');
                nav.classList.remove('light-theme');
            } else {
                nav.classList.add('light-theme');
                nav.classList.remove('dark-theme');
            }
        }
        
        // Aplică tema pe navigația specifică #variante-meniu
        const varianteMeniu = document.querySelector('#variante-meniu');
        if (varianteMeniu) {
            varianteMeniu.setAttribute('data-theme', theme);
            if (theme === 'dark') {
                varianteMeniu.classList.add('dark-theme');
                varianteMeniu.classList.remove('light-theme');
            } else {
                varianteMeniu.classList.add('light-theme');
                varianteMeniu.classList.remove('dark-theme');
            }
        }
        
        // Aplică tema pe toate elementele majore
        const mainElements = document.querySelectorAll('main, footer, .container, .card');
        mainElements.forEach(element => {
            element.setAttribute('data-theme', theme);
        });
    }
});

// Funcție globală pentru schimbarea temei din orice script
window.toggleGlobalTheme = function() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Aplică pe header și nav
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    
    if (header) header.setAttribute('data-theme', newTheme);
    if (nav) nav.setAttribute('data-theme', newTheme);
    
    // Sincronizează toate switch-urile
    document.querySelectorAll('#themeSwitch, #headerThemeSwitch, .theme-switch input, .theme-toggle').forEach(switchElement => {
        switchElement.checked = newTheme === 'dark';
    });
    
    console.log(`Tema globală comutată la: ${newTheme}`);
    return newTheme;
};
