/**
 * Service Areas Page Logic
 * Handles location search and state-based booking flow
 */

// State to City mapping for search
const StateCities = {
    'CA': ['Los Angeles', 'San Diego', 'San Francisco', 'San Jose', 'Sacramento', 'Fresno', 'Long Beach', 'Oakland'],
    'NY': ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Yonkers', 'New Rochelle', 'Mount Vernon'],
    'TX': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi'],
    'FL': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'Tallahassee', 'St. Petersburg', 'Hialeah'],
    'IL': ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield', 'Peoria', 'Elgin'],
    'PA': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem', 'Lancaster'],
    'OH': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton'],
    'GA': ['Atlanta', 'Augusta', 'Columbus', 'Savannah', 'Athens', 'Sandy Springs', 'Macon', 'Roswell'],
    'NC': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington'],
    'MI': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing', 'Flint', 'Dearborn']
};

// ZIP code prefixes for quick state detection (first 3 digits)
const ZipStateMap = {
    '900-929': 'CA', '930-961': 'CA',
    '100-119': 'NY', '120-149': 'NY',
    '750-799': 'TX', '885-885': 'TX',
    '320-349': 'FL',
    '600-629': 'IL',
    '150-196': 'PA',
    '430-459': 'OH',
    '300-319': 'GA', '398-399': 'GA',
    '270-289': 'NC',
    '480-499': 'MI'
};

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('locationSearch');
    const searchBtn = document.getElementById('searchBtn');
    
    // Search button handler
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', handleSearch);
        
        // Also allow Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Service card click handlers (for mobile - make entire card clickable)
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't trigger if user clicked the button directly
            if (e.target.classList.contains('btn')) return;
            
            const button = card.querySelector('.btn');
            if (button) {
                window.location.href = button.getAttribute('href');
            }
        });
        
        // Add hover effect
        card.style.cursor = 'pointer';
    });
});

function handleSearch() {
    const searchInput = document.getElementById('locationSearch');
    const query = searchInput.value.trim();
    
    if (!query) {
        showSearchMessage('Please enter a city or ZIP code', 'error');
        return;
    }
    
    // Check if it's a ZIP code (5 digits)
    const isZipCode = /^\d{5}$/.test(query);
    
    if (isZipCode) {
        const state = detectStateFromZip(query);
        if (state) {
            highlightServiceCard(state);
            window.location.href = `booking.html?state=${state}&zip=${query}`;
        } else {
            showSearchMessage(`ZIP code ${query} is not in our service area. <a href="contact.html">Contact us</a> to request coverage.`, 'warning');
        }
    } else {
        // Search by city name (case-insensitive)
        const state = findStateByCity(query.toLowerCase());
        if (state) {
            highlightServiceCard(state);
            window.location.href = `booking.html?state=${state}&city=${encodeURIComponent(query)}`;
        } else {
            showSearchMessage(`We don't currently serve "${query}". <a href="contact.html">Contact us</a> to request coverage.`, 'warning');
        }
    }
}

function detectStateFromZip(zip) {
    const prefix = parseInt(zip.substring(0, 3));
    
    for (const [range, state] of Object.entries(ZipStateMap)) {
        const [min, max] = range.split('-').map(Number);
        if (prefix >= min && prefix <= max) {
            return state;
        }
    }
    
    return null;
}

function findStateByCity(city) {
    const cityLower = city.toLowerCase().trim();
    
    for (const [state, cities] of Object.entries(StateCities)) {
        for (const stateCity of cities) {
            if (stateCity.toLowerCase().includes(cityLower) || cityLower.includes(stateCity.toLowerCase())) {
                return state;
            }
        }
    }
    
    return null;
}

function highlightServiceCard(stateCode) {
    const cards = document.querySelectorAll('.service-card');
    
    // Remove any existing highlights
    cards.forEach(card => card.classList.remove('service-card--highlight'));
    
    // Add highlight to matching card
    const targetCard = document.querySelector(`.service-card[data-state="${stateCode}"]`);
    if (targetCard) {
        targetCard.classList.add('service-card--highlight');
        
        // Scroll to card with smooth animation
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function showSearchMessage(message, type = 'info') {
    const searchForm = document.querySelector('.service-search__form');
    
    // Remove existing message if any
    const existingMsg = searchForm.querySelector('.search-message');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `search-message search-message--${type}`;
    messageDiv.innerHTML = message;
    
    // Insert after search form
    searchForm.insertAdjacentElement('afterend', messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}
