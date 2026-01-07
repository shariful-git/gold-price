// Configuration
const CONFIG = {
    refreshInterval: 300000, // 5 minutes
    apiEndpoint: '/prices'
};

// Bangla number conversion
const toBanglaNumber = (num) => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(digit => 
        /\d/.test(digit) ? banglaDigits[parseInt(digit)] : digit
    ).join('');
};

// Bangla month names
const banglaMonths = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

// Bangla day names
const banglaDays = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
];

// Format price in Bangla
const formatPriceBangla = (price) => {
    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
    return toBanglaNumber(formatted);
};

// Update date and time display
const updateDateTime = () => {
    const now = new Date();
    
    // Date
    const day = banglaDays[now.getDay()];
    const date = now.getDate();
    const month = banglaMonths[now.getMonth()];
    const year = now.getFullYear();
    
    const dateEl = document.getElementById('date-display');
    if (dateEl) {
        dateEl.textContent = `${day}, ${toBanglaNumber(date)} ${month} ${toBanglaNumber(year)}`;
    }
    
    // Time
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'অপরাহ্ণ' : 'পূর্বাহ্ণ';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    const timeEl = document.getElementById('time-display');
    if (timeEl) {
        timeEl.textContent = `${toBanglaNumber(displayHours)}:${toBanglaNumber(displayMinutes)} ${ampm}`;
    }
};

// Karat names in Bangla
const karatNamesBangla = {
    '24': '২৪ ক্যারেট',
    '22': '২২ ক্যারেট',
    '21': '২১ ক্যারেট',
    '18': '১৮ ক্যারেট',
    'traditional': 'ট্র্যাডিশনাল',
    'silver_21': '২১ ক্যারেট'
};

// Purity map
const purityMap = {
    '24': '৯৯.৯%',
    '22': '৯১.৬%',
    '21': '৮৭.৫%',
    '18': '৭৫.০%',
    'traditional': '৯৯.০%',
    'silver_21': '৮৭.৫%'
};

// Metal names and icons
const metalInfo = {
    gold: {
        name: 'স্বর্ণ',
        icon: '🪙',
        badge: 'সোনা'
    },
    silver: {
        name: 'রৌপ্য',
        icon: '⚪',
        badge: 'রুপা'
    }
};

// Create price card
const createPriceCard = (metal, karat, price) => {
    const card = document.createElement('div');
    card.className = `price-card ${metal}`;
    
    const karatName = karatNamesBangla[karat] || karat;
    const purity = purityMap[karat] || 'স্ট্যান্ডার্ড';
    const metalBadge = metalInfo[metal].badge;
    
    card.innerHTML = `
        <div class="card-type">${metalBadge}</div>
        <div class="card-karat">${karatName}</div>
        <div class="price-box">
            <div class="price-amount">৳${formatPriceBangla(price)}</div>
            <div class="price-label">প্রতি গ্রাম</div>
        </div>
        <div class="card-footer">
            <div class="purity-info">
                <strong>বিশুদ্ধতা:</strong> ${purity}
            </div>
            <div class="update-indicator"></div>
        </div>
    `;
    
    // Add animation
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    return card;
};

// Create metal section
const createMetalSection = (metal, prices) => {
    const section = document.createElement('div');
    section.className = 'metal-section';
    
    const info = metalInfo[metal];
    
    section.innerHTML = `
        <div class="section-header">
            <div class="section-icon">${info.icon}</div>
            <h2 class="section-title">${info.name}</h2>
        </div>
    `;
    
    const grid = document.createElement('div');
    grid.className = 'price-grid';
    
    // Sort entries
    const sortedEntries = Object.entries(prices);
    if (metal === 'gold') {
        sortedEntries.sort((a, b) => {
            const aNum = parseInt(a[0]);
            const bNum = parseInt(b[0]);
            if (isNaN(aNum)) return 1;
            if (isNaN(bNum)) return -1;
            return bNum - aNum;
        });
    }
    
    sortedEntries.forEach(([karat, price], index) => {
        const card = createPriceCard(metal, karat, price);
        grid.appendChild(card);
        
        // Animate card
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    section.appendChild(grid);
    return section;
};

// Show error
const showError = (message) => {
    const container = document.getElementById('prices-container');
    container.innerHTML = `
        <div class="error-state">
            <h3>⚠️ দাম লোড করতে ব্যর্থ</h3>
            <p>${message}</p>
            <button class="retry-btn" onclick="fetchPrices()">পুনরায় চেষ্টা করুন</button>
        </div>
    `;
};

// Fetch prices
async function fetchPrices() {
    const container = document.getElementById('prices-container');
    
    try {
        const response = await fetch(CONFIG.apiEndpoint);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            showError(data.error);
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        // Create sections
        const metals = ['gold', 'silver'];
        metals.forEach(metal => {
            if (data[metal] && Object.keys(data[metal]).length > 0) {
                const section = createMetalSection(metal, data[metal]);
                container.appendChild(section);
            }
        });
        
    } catch (error) {
        console.error('Error fetching prices:', error);
        showError('দয়া করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন এবং আবার চেষ্টা করুন।');
    }
}

// Auto-refresh
const startAutoRefresh = () => {
    setInterval(fetchPrices, CONFIG.refreshInterval);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    fetchPrices();
    startAutoRefresh();
    
    // Update time every second
    setInterval(updateDateTime, 1000);
});

// Refresh when tab becomes active
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateDateTime();
        fetchPrices();
    }
});