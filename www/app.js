// Application State Management
const state = {
    // Current base rates per gram in INR (Bangalore market, updated June 25 2026)
    rates: {
        gold24k: 14165.00,
        gold22k: 12975.49,
        gold18k: 10623.75,
        silver999: 214.29,
        silver925: 198.22
    },
    // Historical rates for charts (Simulated datasets)
    history: {
        '24H': [],
        '7D': [],
        '30D': []
    },
    // Active chart display range
    activeRange: '24H',
    // Active view (dashboard or billboard)
    activeView: 'dashboard',
    // Active theme
    theme: 'dark',
    // Billboard product prices (BUY/SELL) - Bangalore market June 25 2026
    billboard: {
        'g999-1kg': { buy: 141650, sell: 142037, stock: true },
        'g999-200g': { buy: 141367, sell: 142088, stock: true },
        'ind-1kg': { buy: 141227, sell: 141819, stock: true },
        'ind-200g': { buy: 141227, sell: 141845, stock: true },
        'sil-30kg': { buy: 214290, sell: 215579, stock: true },
        'sil-5kg': { buy: 214076, sell: 215571, stock: true },
        '995-1kg': { buy: 140379, sell: 141229, stock: false },
        'gold-mkt': { buy: 136962, sell: 137555, stock: false },
        'silver-mkt': { buy: 208504, sell: 215779, stock: false }
    },
    // Commodities section — Bangalore, June 25 2026
    commodities: {
        goldFut: { bid: 139022, ask: 139055, high: 141000, low: 138000 },
        silverFut: { bid: 208558, ask: 208654, high: 212000, low: 205000 },
        goldSpot: { bid: 4000.00, ask: 4000.08, high: 4050.00, low: 3970.00 },
        silverSpot: { bid: 57.72, ask: 57.75, high: 59.00, low: 56.80 },
        inrSpot: { bid: 94.65, ask: 94.66, high: 94.90, low: 94.40 },
        goldNext: { bid: 142397, ask: 142463, high: 143500, low: 141200 },
        silverNext: { bid: 212281, ask: 212381, high: 215500, low: 209500 }
    }
};

// Formatting helpers
function formatINR(number, decimals = 2) {
    return '₹' + number.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatRawNumber(number) {
    return Math.round(number).toLocaleString('en-IN');
}

// Generate starting history data
function initHistoricalData() {
    const now = new Date();
    
    // 24H Live: generate 15 points leading up to now (every hour)
    let gBase = state.rates.gold24k;
    let sBase = state.rates.silver999;
    
    for (let i = 14; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        gBase += (Math.random() - 0.5) * 40;
        sBase += (Math.random() - 0.5) * 1.5;
        state.history['24H'].push({
            label: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            gold: gBase,
            silver: sBase
        });
    }

    // 7D History
    gBase = state.rates.gold24k;
    sBase = state.rates.silver999;
    for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        gBase += (Math.random() - 0.5) * 120;
        sBase += (Math.random() - 0.5) * 4;
        state.history['7D'].push({
            label: date.toLocaleDateString([], { weekday: 'short' }),
            gold: gBase,
            silver: sBase
        });
    }

    // 30D History
    gBase = state.rates.gold24k;
    sBase = state.rates.silver999;
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        gBase += (Math.random() - 0.5) * 250;
        sBase += (Math.random() - 0.5) * 8;
        state.history['30D'].push({
            label: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
            gold: gBase,
            silver: sBase
        });
    }
}

// Update UI pricing displays
function updateUI(metalChanged = null, diffs = {}) {
    // 1. Dashboard View updates
    const elements = {
        'val-g24': { rate: state.rates.gold24k, suffix: '/g' },
        'val-g24-tola': { rate: state.rates.gold24k * 10, suffix: '' },
        'val-g24-8g': { rate: state.rates.gold24k * 8, suffix: '' },
        
        'val-g22': { rate: state.rates.gold22k, suffix: '/g' },
        'val-g22-tola': { rate: state.rates.gold22k * 10, suffix: '' },
        'val-g22-8g': { rate: state.rates.gold22k * 8, suffix: '' },
        
        'val-silver': { rate: state.rates.silver999, suffix: '/g' },
        'val-silver925': { rate: state.rates.silver925, suffix: '/g' },
        'val-silver-1kg': { rate: state.rates.silver999 * 1000, suffix: '' }
    };

    for (const [id, config] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = formatINR(config.rate, id.includes('1kg') || id.includes('tola') || id.includes('8g') ? 0 : 2) + config.suffix;
        }
    }

    // Flash Dashboard Cards if updated
    if (metalChanged) {
        const cardId = metalChanged === 'gold' ? 'card-gold24' : 'card-silver';
        const trendId = metalChanged === 'gold' ? 'trend-g24' : 'trend-silver';
        const cardEl = document.getElementById(cardId);
        const trendEl = document.getElementById(trendId);
        
        const change = diffs[metalChanged] || 0;
        
        if (cardEl && trendEl) {
            // Remove previous animation classes
            cardEl.classList.remove('flash-up', 'flash-down');
            
            if (change > 0) {
                cardEl.classList.add('flash-up');
                trendEl.className = 'price-trend trend-up';
                trendEl.innerHTML = `<i class="fa-solid fa-caret-up"></i> +₹${change.toFixed(2)} (${((change/configRate(metalChanged))*100).toFixed(2)}%)`;
            } else if (change < 0) {
                cardEl.classList.add('flash-down');
                trendEl.className = 'price-trend trend-down';
                trendEl.innerHTML = `<i class="fa-solid fa-caret-down"></i> -₹${Math.abs(change).toFixed(2)} (${((Math.abs(change)/configRate(metalChanged))*100).toFixed(2)}%)`;
            }
        }
        
        // Handle 22k card flash if gold changed
        if (metalChanged === 'gold') {
            const card22El = document.getElementById('card-gold22');
            const trend22El = document.getElementById('trend-g22');
            if (card22El && trend22El) {
                card22El.classList.remove('flash-up', 'flash-down');
                const change22 = change * 0.916; // proportional change
                if (change > 0) {
                    card22El.classList.add('flash-up');
                    trend22El.className = 'price-trend trend-up';
                    trend22El.innerHTML = `<i class="fa-solid fa-caret-up"></i> +₹${change22.toFixed(2)} (${((change22/state.rates.gold22k)*100).toFixed(2)}%)`;
                } else {
                    card22El.classList.add('flash-down');
                    trend22El.className = 'price-trend trend-down';
                    trend22El.innerHTML = `<i class="fa-solid fa-caret-down"></i> -₹${Math.abs(change22).toFixed(2)} (${((Math.abs(change22)/state.rates.gold22k)*100).toFixed(2)}%)`;
                }
            }
        }
    }

    function configRate(metal) {
        return metal === 'gold' ? state.rates.gold24k : state.rates.silver999;
    }

    // 2. Billboard View updates
    // Left Table items
    const bbItems = {
        'g999-1kg': 'g999-1kg',
        'g999-200g': 'g999-200g',
        'ind-1kg': 'ind-1kg',
        'ind-200g': 'ind-200g',
        'sil-30kg': 'sil-30kg',
        'sil-5kg': 'sil-5kg',
        '995-1kg': '995-1kg',
        'gold-mkt': 'gold-mkt',
        'silver-mkt': 'silver-mkt'
    };

    for (const [key, id] of Object.entries(bbItems)) {
        const buyEl = document.getElementById(`buy-${id}`);
        const sellEl = document.getElementById(`sell-${id}`);
        
        if (buyEl && sellEl) {
            const oldBuy = parseInt(buyEl.innerText.replace(/,/g, '')) || 0;
            const newBuy = Math.round(state.billboard[key].buy);
            
            buyEl.innerText = formatRawNumber(newBuy);
            sellEl.innerText = formatRawNumber(Math.round(state.billboard[key].sell));
            
            // Add custom flashing animation for billboard row
            if (newBuy > oldBuy && oldBuy > 0) {
                buyEl.className = 'bb-flash-up';
                sellEl.className = 'bb-flash-up';
                setTimeout(() => { buyEl.className = ''; sellEl.className = ''; }, 1000);
            } else if (newBuy < oldBuy && oldBuy > 0) {
                buyEl.className = 'bb-flash-down';
                sellEl.className = 'bb-flash-down';
                setTimeout(() => { buyEl.className = ''; sellEl.className = ''; }, 1000);
            }
        }
    }

    // Futures & Spots Column
    const bbCommodities = {
        'bid-gold-fut': state.commodities.goldFut.bid,
        'ask-gold-fut': state.commodities.goldFut.ask,
        'high-gold-fut': 'HIGH/' + Math.round(state.commodities.goldFut.high),
        'low-gold-fut': 'LOW/' + Math.round(state.commodities.goldFut.low),
        
        'bid-silver-fut': state.commodities.silverFut.bid,
        'ask-silver-fut': state.commodities.silverFut.ask,
        'high-silver-fut': 'HIGH/' + Math.round(state.commodities.silverFut.high),
        'low-silver-fut': 'LOW/' + Math.round(state.commodities.silverFut.low),
        
        'bid-gold-spot': state.commodities.goldSpot.bid.toFixed(2),
        'ask-gold-spot': state.commodities.goldSpot.ask.toFixed(2),
        'high-gold-spot': 'H ' + state.commodities.goldSpot.high.toFixed(2),
        'low-gold-spot': 'L ' + state.commodities.goldSpot.low.toFixed(2),
        
        'bid-silver-spot': state.commodities.silverSpot.bid.toFixed(2),
        'ask-silver-spot': state.commodities.silverSpot.ask.toFixed(2),
        'high-silver-spot': 'H ' + state.commodities.silverSpot.high.toFixed(2),
        'low-silver-spot': 'L ' + state.commodities.silverSpot.low.toFixed(2),
        
        'bid-inr-spot': state.commodities.inrSpot.bid.toFixed(2),
        'ask-inr-spot': state.commodities.inrSpot.ask.toFixed(2),
        'high-inr-spot': 'H ' + state.commodities.inrSpot.high.toFixed(2),
        'low-inr-spot': 'L ' + state.commodities.inrSpot.low.toFixed(2),
        
        'bid-gold-next': state.commodities.goldNext.bid,
        'ask-gold-next': state.commodities.goldNext.ask,
        'high-gold-next': 'HIGH/' + Math.round(state.commodities.goldNext.high),
        'low-gold-next': 'LOW/' + Math.round(state.commodities.goldNext.low),
        
        'bid-silver-next': state.commodities.silverNext.bid,
        'ask-silver-next': state.commodities.silverNext.ask,
        'high-silver-next': 'HIGH/' + Math.round(state.commodities.silverNext.high),
        'low-silver-next': 'LOW/' + Math.round(state.commodities.silverNext.low)
    };

    for (const [id, value] of Object.entries(bbCommodities)) {
        const el = document.getElementById(id);
        if (el) {
            if (typeof value === 'number') {
                el.innerText = formatRawNumber(value);
            } else {
                el.innerText = value;
            }
        }
    }
}

// Helper to recalculate all billboard and commodity values based on current rates
function updateDerivedRates(goldSpotUSD = null, silverSpotUSD = null, usdINR = null) {
    const gold24k = state.rates.gold24k;
    const silver999 = state.rates.silver999;
    const currentUsdINR = usdINR || state.commodities.inrSpot.bid;
    
    // Update billboard products (INR per 10g for gold, INR per 1kg for silver)
    state.billboard['g999-1kg'].buy = gold24k * 10;
    state.billboard['g999-1kg'].sell = state.billboard['g999-1kg'].buy + 387;
    
    state.billboard['g999-200g'].buy = gold24k * 10 * 0.998;
    state.billboard['g999-200g'].sell = state.billboard['g999-200g'].buy + 721;
    
    state.billboard['ind-1kg'].buy = gold24k * 10 * 0.997;
    state.billboard['ind-1kg'].sell = state.billboard['ind-1kg'].buy + 592;
    
    state.billboard['ind-200g'].buy = gold24k * 10 * 0.997;
    state.billboard['ind-200g'].sell = state.billboard['ind-200g'].buy + 618;
    
    state.billboard['sil-30kg'].buy = silver999 * 1000;
    state.billboard['sil-30kg'].sell = state.billboard['sil-30kg'].buy + 1289;
    
    state.billboard['sil-5kg'].buy = silver999 * 1000 * 0.999;
    state.billboard['sil-5kg'].sell = state.billboard['sil-5kg'].buy + 1495;
    
    state.billboard['995-1kg'].buy = gold24k * 10 * 0.991;
    state.billboard['995-1kg'].sell = state.billboard['995-1kg'].buy + 850;
    
    state.billboard['gold-mkt'].buy = gold24k * 10 * 0.967;
    state.billboard['gold-mkt'].sell = state.billboard['gold-mkt'].buy + 593;
    
    state.billboard['silver-mkt'].buy = silver999 * 1000 * 0.973;
    state.billboard['silver-mkt'].sell = state.billboard['silver-mkt'].buy + 7475;
    
    // Update commodities panel
    state.commodities.goldFut.bid = gold24k * 10 * 0.982;
    state.commodities.goldFut.ask = state.commodities.goldFut.bid + 33;
    if (state.commodities.goldFut.bid > state.commodities.goldFut.high) state.commodities.goldFut.high = state.commodities.goldFut.bid;
    if (state.commodities.goldFut.bid < state.commodities.goldFut.low) state.commodities.goldFut.low = state.commodities.goldFut.bid;
    
    state.commodities.silverFut.bid = silver999 * 1000 * 0.974;
    state.commodities.silverFut.ask = state.commodities.silverFut.bid + 96;
    if (state.commodities.silverFut.bid > state.commodities.silverFut.high) state.commodities.silverFut.high = state.commodities.silverFut.bid;
    if (state.commodities.silverFut.bid < state.commodities.silverFut.low) state.commodities.silverFut.low = state.commodities.silverFut.bid;
    
    if (goldSpotUSD !== null) {
        state.commodities.goldSpot.bid = goldSpotUSD;
        state.commodities.goldSpot.ask = goldSpotUSD + 0.08;
        if (state.commodities.goldSpot.bid > state.commodities.goldSpot.high) state.commodities.goldSpot.high = state.commodities.goldSpot.bid;
        if (state.commodities.goldSpot.bid < state.commodities.goldSpot.low) state.commodities.goldSpot.low = state.commodities.goldSpot.bid;
    } else if (currentUsdINR > 0) {
        const spotGoldUSD = (gold24k / 1.1635) * 31.1034768 / currentUsdINR;
        state.commodities.goldSpot.bid = spotGoldUSD;
        state.commodities.goldSpot.ask = spotGoldUSD + 0.08;
        if (state.commodities.goldSpot.bid > state.commodities.goldSpot.high) state.commodities.goldSpot.high = state.commodities.goldSpot.bid;
        if (state.commodities.goldSpot.bid < state.commodities.goldSpot.low) state.commodities.goldSpot.low = state.commodities.goldSpot.bid;
    }
    
    if (silverSpotUSD !== null) {
        state.commodities.silverSpot.bid = silverSpotUSD;
        state.commodities.silverSpot.ask = silverSpotUSD + 0.03;
        if (state.commodities.silverSpot.bid > state.commodities.silverSpot.high) state.commodities.silverSpot.high = state.commodities.silverSpot.bid;
        if (state.commodities.silverSpot.bid < state.commodities.silverSpot.low) state.commodities.silverSpot.low = state.commodities.silverSpot.bid;
    } else if (currentUsdINR > 0) {
        const spotSilverUSD = (silver999 / 1.220) * 31.1034768 / currentUsdINR;
        state.commodities.silverSpot.bid = spotSilverUSD;
        state.commodities.silverSpot.ask = spotSilverUSD + 0.03;
        if (state.commodities.silverSpot.bid > state.commodities.silverSpot.high) state.commodities.silverSpot.high = state.commodities.silverSpot.bid;
        if (state.commodities.silverSpot.bid < state.commodities.silverSpot.low) state.commodities.silverSpot.low = state.commodities.silverSpot.bid;
    }
    
    state.commodities.inrSpot.bid = currentUsdINR;
    state.commodities.inrSpot.ask = currentUsdINR + 0.01;
    if (state.commodities.inrSpot.bid > state.commodities.inrSpot.high) state.commodities.inrSpot.high = state.commodities.inrSpot.bid;
    if (state.commodities.inrSpot.bid < state.commodities.inrSpot.low) state.commodities.inrSpot.low = state.commodities.inrSpot.bid;
    
    state.commodities.goldNext.bid = gold24k * 10 * 1.005;
    state.commodities.goldNext.ask = state.commodities.goldNext.bid + 66;
    if (state.commodities.goldNext.bid > state.commodities.goldNext.high) state.commodities.goldNext.high = state.commodities.goldNext.bid;
    if (state.commodities.goldNext.bid < state.commodities.goldNext.low) state.commodities.goldNext.low = state.commodities.goldNext.bid;
    
    state.commodities.silverNext.bid = silver999 * 1000 * 0.991;
    state.commodities.silverNext.ask = state.commodities.silverNext.bid + 100;
    if (state.commodities.silverNext.bid > state.commodities.silverNext.high) state.commodities.silverNext.high = state.commodities.silverNext.bid;
    if (state.commodities.silverNext.bid < state.commodities.silverNext.low) state.commodities.silverNext.low = state.commodities.silverNext.bid;
}

// Fetch live rates from real-time API
async function fetchLivePrices() {
    try {
        const [xauRes, xagRes, exRes] = await Promise.all([
            fetch('https://api.gold-api.com/price/XAU').then(res => res.json()),
            fetch('https://api.gold-api.com/price/XAG').then(res => res.json()),
            fetch('https://open.er-api.com/v6/latest/USD').then(res => res.json())
        ]);
        
        if (xauRes && xagRes && exRes && exRes.rates && exRes.rates.INR) {
            const goldSpotUSD = xauRes.price;
            const silverSpotUSD = xagRes.price;
            const usdINR = exRes.rates.INR;
            
            // Calculate base prices in INR per gram
            // Troy ounce = 31.1034768 grams.
            // Gold premium 16.35% = 15% custom duty + 3% GST - local refining credit — calibrated to Bangalore market ₹14,165/g on June 25 2026
            // Silver premium 22.0% = 10% import duty + 3% GST + 9% local premium — calibrated to Bangalore market ₹214.29/g on June 25 2026
            const gold24k = (goldSpotUSD * usdINR / 31.1034768) * 1.1635;
            const silver999 = (silverSpotUSD * usdINR / 31.1034768) * 1.220;
            
            const oldGold = state.rates.gold24k;
            const oldSilver = state.rates.silver999;
            
            state.rates.gold24k = gold24k;
            state.rates.gold22k = gold24k * 0.9166;
            state.rates.gold18k = gold24k * 0.75;
            state.rates.silver999 = silver999;
            state.rates.silver925 = silver999 * 0.925;
            
            // Recalculate derived rates
            updateDerivedRates(goldSpotUSD, silverSpotUSD, usdINR);
            
            // Recalculate calculator and update UI
            calculatePurityPrice();
            
            const diffs = {
                gold: gold24k - oldGold,
                silver: silver999 - oldSilver
            };
            
            updateUI(oldGold > 7000 ? (Math.abs(diffs.gold) > Math.abs(diffs.silver) ? 'gold' : 'silver') : null, diffs);
        }
    } catch (err) {
        console.error('Failed to fetch live prices:', err);
    }
}

// Live price fluctuation simulator & API refresher
function startPriceSimulation() {
    // 1. Refresher for live API data every 60 seconds
    setInterval(async () => {
        await fetchLivePrices();
    }, 60000);

    // 2. Micro-fluctuation simulator every 4 seconds to animate the screen
    setInterval(() => {
        const rand = Math.random();
        let metalChanged = null;
        const diffs = { gold: 0, silver: 0 };
        
        if (rand < 0.45) {
            // Fluctuate Gold
            const change = (Math.random() - 0.5) * 2.0; // micro-change +/- 1 INR
            state.rates.gold24k = Math.max(7000, state.rates.gold24k + change);
            state.rates.gold22k = state.rates.gold24k * 0.9166;
            state.rates.gold18k = state.rates.gold24k * 0.75;
            metalChanged = 'gold';
            diffs.gold = change;
            
            // Update all derived values synchronously
            updateDerivedRates();
            
        } else if (rand < 0.90) {
            // Fluctuate Silver
            const change = (Math.random() - 0.5) * 0.08; // micro-change +/- 0.04 INR
            state.rates.silver999 = Math.max(80, state.rates.silver999 + change);
            state.rates.silver925 = state.rates.silver999 * 0.925;
            metalChanged = 'silver';
            diffs.silver = change;
            
            // Update all derived values synchronously
            updateDerivedRates();
            
        } else {
            // Fluctuate USD INR spot slightly
            const change = (Math.random() - 0.5) * 0.02;
            const newInr = Math.max(80, state.commodities.inrSpot.bid + change);
            
            // Update derived rates using the new exchange rate
            updateDerivedRates(null, null, newInr);
        }
        
        // Push a new tick onto 24H history and shift
        if (metalChanged) {
            const now = new Date();
            state.history['24H'].shift();
            state.history['24H'].push({
                label: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                gold: state.rates.gold24k,
                silver: state.rates.silver999
            });
            
            // Re-render chart if current range is 24H
            if (state.activeRange === '24H') {
                renderSVGChart();
            }
            
            // Recalculate calculator bill
            calculatePurityPrice();
        }
        
        updateUI(metalChanged, diffs);
    }, 4000);
}

// -------------------------------------------------------------
// Interactive SVG Chart Renderer
// -------------------------------------------------------------
function renderSVGChart() {
    const mountEl = document.getElementById('chart-mount');
    if (!mountEl) return;
    
    const dataset = state.history[state.activeRange];
    if (!dataset || dataset.length === 0) return;
    
    // Clear mount element
    mountEl.innerHTML = '';
    
    const svgNS = "http://www.w3.org/2000/svg";
    const width = mountEl.clientWidth || 550;
    const height = mountEl.clientHeight || 320;
    
    const padding = { top: 30, right: 30, bottom: 40, left: 55 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    
    // Create SVG element
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "chart-svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    
    // Calculate min/max for Gold & Silver
    const goldPrices = dataset.map(d => d.gold);
    const silverPrices = dataset.map(d => d.silver);
    
    const minGold = Math.min(...goldPrices) * 0.998;
    const maxGold = Math.max(...goldPrices) * 1.002;
    const minSilver = Math.min(...silverPrices) * 0.998;
    const maxSilver = Math.max(...silverPrices) * 1.002;
    
    const goldRange = maxGold - minGold;
    const silverRange = maxSilver - minSilver;
    
    // Helper to map rates to SVG plot coordinates
    // Gold y-axis on Left, Silver y-axis on Right
    function getX(index) {
        return padding.left + (index / (dataset.length - 1)) * plotWidth;
    }
    
    function getGoldY(price) {
        return padding.top + plotHeight - ((price - minGold) / goldRange) * plotHeight;
    }
    
    function getSilverY(price) {
        return padding.top + plotHeight - ((price - minSilver) / silverRange) * plotHeight;
    }
    
    // 1. Draw Grid lines and Y-Axis labels
    const gridCount = 5;
    for (let i = 0; i < gridCount; i++) {
        const ratio = i / (gridCount - 1);
        const y = padding.top + ratio * plotHeight;
        
        // Horizontal Grid line
        const gridLine = document.createElementNS(svgNS, "line");
        gridLine.setAttribute("x1", padding.left);
        gridLine.setAttribute("y1", y);
        gridLine.setAttribute("x2", width - padding.right);
        gridLine.setAttribute("y2", y);
        gridLine.setAttribute("stroke", "var(--chart-grid)");
        gridLine.setAttribute("stroke-width", "1");
        svg.appendChild(gridLine);
        
        // Left Y label (Gold Price)
        const goldValLabel = minGold + (1 - ratio) * goldRange;
        const goldLabelText = document.createElementNS(svgNS, "text");
        goldLabelText.setAttribute("x", padding.left - 8);
        goldLabelText.setAttribute("y", y + 4);
        goldLabelText.setAttribute("text-anchor", "end");
        goldLabelText.setAttribute("fill", "var(--text-secondary)");
        goldLabelText.setAttribute("font-size", "10px");
        goldLabelText.setAttribute("font-weight", "500");
        goldLabelText.textContent = Math.round(goldValLabel);
        svg.appendChild(goldLabelText);
        
        // Right Y label (Silver Price)
        const silverValLabel = minSilver + (1 - ratio) * silverRange;
        const silverLabelText = document.createElementNS(svgNS, "text");
        silverLabelText.setAttribute("x", width - padding.right + 8);
        silverLabelText.setAttribute("y", y + 4);
        silverLabelText.setAttribute("text-anchor", "start");
        silverLabelText.setAttribute("fill", "var(--text-secondary)");
        silverLabelText.setAttribute("font-size", "10px");
        silverLabelText.setAttribute("font-weight", "500");
        silverLabelText.textContent = silverValLabel.toFixed(1);
        svg.appendChild(silverLabelText);
    }
    
    // 2. Draw X-axis label points (Selective to avoid crowding)
    const step = Math.ceil(dataset.length / 5);
    dataset.forEach((data, index) => {
        if (index % step === 0 || index === dataset.length - 1) {
            const x = getX(index);
            const text = document.createElementNS(svgNS, "text");
            text.setAttribute("x", x);
            text.setAttribute("y", height - padding.bottom + 18);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("fill", "var(--text-secondary)");
            text.setAttribute("font-size", "10px");
            text.setAttribute("font-weight", "500");
            text.textContent = data.label;
            svg.appendChild(text);
        }
    });
    
    // 3. Construct paths for lines
    let goldPathD = `M ${getX(0)} ${getGoldY(goldPrices[0])}`;
    let silverPathD = `M ${getX(0)} ${getSilverY(silverPrices[0])}`;
    
    for (let i = 1; i < dataset.length; i++) {
        goldPathD += ` L ${getX(i)} ${getGoldY(goldPrices[i])}`;
        silverPathD += ` L ${getX(i)} ${getSilverY(silverPrices[i])}`;
    }
    
    // Draw Gold Line
    const goldPath = document.createElementNS(svgNS, "path");
    goldPath.setAttribute("d", goldPathD);
    goldPath.setAttribute("fill", "none");
    goldPath.setAttribute("stroke", "var(--chart-line-gold)");
    goldPath.setAttribute("stroke-width", "2.5");
    goldPath.setAttribute("stroke-linecap", "round");
    svg.appendChild(goldPath);
    
    // Draw Silver Line
    const silverPath = document.createElementNS(svgNS, "path");
    silverPath.setAttribute("d", silverPathD);
    silverPath.setAttribute("fill", "none");
    silverPath.setAttribute("stroke", "var(--chart-line-silver)");
    silverPath.setAttribute("stroke-width", "2.5");
    silverPath.setAttribute("stroke-linecap", "round");
    svg.appendChild(silverPath);
    
    // 4. Interactive Overlay Elements (vertical tracking line & tooltips)
    const trackingLine = document.createElementNS(svgNS, "line");
    trackingLine.setAttribute("class", "chart-hover-line");
    trackingLine.setAttribute("y1", padding.top);
    trackingLine.setAttribute("y2", height - padding.bottom);
    svg.appendChild(trackingLine);
    
    // Gold dot
    const goldDot = document.createElementNS(svgNS, "circle");
    goldDot.setAttribute("r", "5");
    goldDot.setAttribute("fill", "var(--chart-line-gold)");
    goldDot.setAttribute("stroke", "var(--bg-secondary)");
    goldDot.setAttribute("stroke-width", "2");
    goldDot.setAttribute("style", "opacity: 0;");
    svg.appendChild(goldDot);
    
    // Silver dot
    const silverDot = document.createElementNS(svgNS, "circle");
    silverDot.setAttribute("r", "5");
    silverDot.setAttribute("fill", "var(--chart-line-silver)");
    silverDot.setAttribute("stroke", "var(--bg-secondary)");
    silverDot.setAttribute("stroke-width", "2");
    silverDot.setAttribute("style", "opacity: 0;");
    svg.appendChild(silverDot);
    
    // Tooltip Group
    const tooltipGroup = document.createElementNS(svgNS, "g");
    tooltipGroup.setAttribute("class", "chart-tooltip-group");
    
    const tooltipBg = document.createElementNS(svgNS, "rect");
    tooltipBg.setAttribute("class", "chart-tooltip-bg");
    tooltipBg.setAttribute("width", "140");
    tooltipBg.setAttribute("height", "68");
    tooltipBg.setAttribute("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.15))");
    tooltipGroup.appendChild(tooltipBg);
    
    const tooltipTime = document.createElementNS(svgNS, "text");
    tooltipTime.setAttribute("class", "chart-tooltip-text");
    tooltipTime.setAttribute("x", "10");
    tooltipTime.setAttribute("y", "20");
    tooltipTime.setAttribute("font-weight", "bold");
    tooltipGroup.appendChild(tooltipTime);
    
    const tooltipGoldVal = document.createElementNS(svgNS, "text");
    tooltipGoldVal.setAttribute("class", "chart-tooltip-text");
    tooltipGoldVal.setAttribute("x", "10");
    tooltipGoldVal.setAttribute("y", "40");
    tooltipGoldVal.setAttribute("fill", "var(--accent-gold)");
    tooltipGroup.appendChild(tooltipGoldVal);
    
    const tooltipSilverVal = document.createElementNS(svgNS, "text");
    tooltipSilverVal.setAttribute("class", "chart-tooltip-text");
    tooltipSilverVal.setAttribute("x", "10");
    tooltipSilverVal.setAttribute("y", "56");
    tooltipSilverVal.setAttribute("fill", "var(--text-secondary)");
    tooltipGroup.appendChild(tooltipSilverVal);
    
    svg.appendChild(tooltipGroup);
    
    // Mouse hover listener container overlay (covers the plotting area)
    const overlay = document.createElementNS(svgNS, "rect");
    overlay.setAttribute("x", padding.left);
    overlay.setAttribute("y", padding.top);
    overlay.setAttribute("width", plotWidth);
    overlay.setAttribute("height", plotHeight);
    overlay.setAttribute("fill", "transparent");
    overlay.setAttribute("style", "cursor: crosshair;");
    svg.appendChild(overlay);
    
    // Handle tracking math
    overlay.addEventListener('mousemove', (e) => {
        const rect = svg.getBoundingClientRect();
        // Translate mouse coords inside SVG scaling
        const mouseX = ((e.clientX - rect.left) / rect.width) * width;
        
        // Find index matching x coordinate closest to cursor
        const xRatio = (mouseX - padding.left) / plotWidth;
        const rawIndex = xRatio * (dataset.length - 1);
        const index = Math.max(0, Math.min(dataset.length - 1, Math.round(rawIndex)));
        
        const tick = dataset[index];
        const xPos = getX(index);
        const yPosGold = getGoldY(tick.gold);
        const yPosSilver = getSilverY(tick.silver);
        
        // Update tracker lines and dots
        trackingLine.setAttribute("x1", xPos);
        trackingLine.setAttribute("x2", xPos);
        trackingLine.style.opacity = '1';
        
        goldDot.setAttribute("cx", xPos);
        goldDot.setAttribute("cy", yPosGold);
        goldDot.style.opacity = '1';
        
        silverDot.setAttribute("cx", xPos);
        silverDot.setAttribute("cy", yPosSilver);
        silverDot.style.opacity = '1';
        
        // Tooltip rendering positions
        let tooltipX = xPos + 15;
        let tooltipY = Math.min(yPosGold, yPosSilver) - 30;
        
        // Reposition tooltip if overflow boundaries
        if (tooltipX + 150 > width) {
            tooltipX = xPos - 155;
        }
        if (tooltipY < padding.top) {
            tooltipY = padding.top;
        }
        if (tooltipY + 70 > height - padding.bottom) {
            tooltipY = height - padding.bottom - 70;
        }
        
        tooltipGroup.setAttribute("transform", `translate(${tooltipX}, ${tooltipY})`);
        tooltipGroup.style.opacity = '1';
        
        tooltipTime.textContent = tick.label;
        tooltipGoldVal.textContent = `Au 24K: ₹${tick.gold.toFixed(1)}/g`;
        tooltipSilverVal.textContent = `Ag 999: ₹${tick.silver.toFixed(2)}/g`;
    });
    
    overlay.addEventListener('mouseleave', () => {
        trackingLine.style.opacity = '0';
        goldDot.style.opacity = '0';
        silverDot.style.opacity = '0';
        tooltipGroup.style.opacity = '0';
    });
    
    mountEl.appendChild(svg);
}

// -------------------------------------------------------------
// Calculator Logic
// -------------------------------------------------------------
function setupCalculator() {
    const metalSelect = document.getElementById('calc-metal');
    const puritySelect = document.getElementById('calc-purity');
    const weightInput = document.getElementById('calc-weight');
    const makingInput = document.getElementById('calc-making');
    const makingTypeSelect = document.getElementById('calc-making-type');
    
    if (!metalSelect || !puritySelect) return;
    
    // Repopulate purity selector depending on metal
    function populatePurities() {
        const metal = metalSelect.value;
        puritySelect.innerHTML = '';
        
        if (metal === 'gold') {
            const goldOptions = [
                { val: 'gold24k', text: '24 Karat (Pure 99.9%)' },
                { val: 'gold22k', text: '22 Karat (Jewellery 91.6%)' },
                { val: 'gold18k', text: '18 Karat (Studded 75.0%)' }
            ];
            goldOptions.forEach(opt => {
                const el = document.createElement('option');
                el.value = opt.val;
                el.text = opt.text;
                puritySelect.appendChild(el);
            });
        } else {
            const silverOptions = [
                { val: 'silver999', text: '999 Sterling (Pure 99.9%)' },
                { val: 'silver925', text: '925 Sterling (Standard 92.5%)' }
            ];
            silverOptions.forEach(opt => {
                const el = document.createElement('option');
                el.value = opt.val;
                el.text = opt.text;
                puritySelect.appendChild(el);
            });
        }
        calculatePurityPrice();
    }
    
    metalSelect.addEventListener('change', populatePurities);
    puritySelect.addEventListener('change', calculatePurityPrice);
    weightInput.addEventListener('input', calculatePurityPrice);
    makingInput.addEventListener('input', calculatePurityPrice);
    makingTypeSelect.addEventListener('change', calculatePurityPrice);
    
    // Run initial population
    populatePurities();
}

function calculatePurityPrice() {
    const purityKey = document.getElementById('calc-purity')?.value;
    const weight = parseFloat(document.getElementById('calc-weight')?.value) || 0;
    const makingChargeVal = parseFloat(document.getElementById('calc-making')?.value) || 0;
    const makingType = document.getElementById('calc-making-type')?.value;
    
    if (!purityKey || weight <= 0) {
        clearReceipt();
        return;
    }
    
    const currentGramRate = state.rates[purityKey];
    const metalCost = currentGramRate * weight;
    
    let makingChargeTotal = 0;
    if (makingType === 'percent') {
        makingChargeTotal = metalCost * (makingChargeVal / 100);
    } else {
        makingChargeTotal = weight * makingChargeVal;
    }
    
    const taxableAmount = metalCost + makingChargeTotal;
    const gstTotal = taxableAmount * 0.03; // Standard 3% Gold/Silver GST in India
    const finalTotal = taxableAmount + gstTotal;
    
    // Render Receipt Outputs
    document.getElementById('rec-metal-rate').innerText = `${formatINR(currentGramRate)} / gm`;
    document.getElementById('rec-metal-cost').innerText = formatINR(metalCost);
    document.getElementById('rec-making').innerText = formatINR(makingChargeTotal);
    document.getElementById('rec-gst').innerText = formatINR(gstTotal);
    document.getElementById('rec-total').innerText = formatINR(finalTotal);
}

function clearReceipt() {
    const keys = ['rec-metal-rate', 'rec-metal-cost', 'rec-making', 'rec-gst', 'rec-total'];
    keys.forEach(k => {
        const el = document.getElementById(k);
        if (el) el.innerText = '₹0.00';
    });
}

// -------------------------------------------------------------
// Interactive Event Toggles (Views, Theme, Range)
// -------------------------------------------------------------
function setupInteractiveToggles() {
    const viewBtn = document.getElementById('view-toggle-btn');
    const viewText = document.getElementById('view-toggle-text');
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    
    const dashboardView = document.getElementById('dashboard-view');
    const billboardView = document.getElementById('billboard-view');
    
    // View toggle handler
    if (viewBtn && dashboardView && billboardView) {
        viewBtn.addEventListener('click', () => {
            if (state.activeView === 'dashboard') {
                state.activeView = 'billboard';
                dashboardView.style.display = 'none';
                billboardView.style.display = 'grid';
                viewText.textContent = 'Dashboard View';
                viewBtn.innerHTML = '<i class="fa-solid fa-chart-line"></i> <span id="view-toggle-text">Dashboard</span>';
            } else {
                state.activeView = 'dashboard';
                dashboardView.style.display = 'grid';
                billboardView.style.display = 'none';
                viewText.textContent = 'Classic Board';
                viewBtn.innerHTML = '<i class="fa-solid fa-table-cells"></i> <span id="view-toggle-text">Classic Board</span>';
                // Trigger chart redraw to match clientWidth of dashboard cards
                setTimeout(renderSVGChart, 10);
            }
        });
    }
    
    // Theme toggle handler
    if (themeBtn && themeIcon) {
        themeBtn.addEventListener('click', () => {
            const html = document.documentElement;
            if (state.theme === 'dark') {
                state.theme = 'light';
                html.setAttribute('data-theme', 'light');
                themeIcon.className = 'fa-solid fa-moon';
            } else {
                state.theme = 'dark';
                html.setAttribute('data-theme', 'dark');
                themeIcon.className = 'fa-solid fa-sun';
            }
            if (state.activeView === 'dashboard') {
                renderSVGChart();
            }
        });
    }
    
    // Chart history range selectors
    document.querySelectorAll('.chart-select-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chart-select-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.activeRange = e.target.getAttribute('data-range');
            renderSVGChart();
        });
    });
    
    // Resize event listener for responsive chart drawing
    window.addEventListener('resize', () => {
        if (state.activeView === 'dashboard') {
            renderSVGChart();
        }
    });
}

// Initialize application on load
window.addEventListener('DOMContentLoaded', async () => {
    initHistoricalData();
    updateUI();
    setupCalculator();
    setupInteractiveToggles();
    renderSVGChart();
    
    // Fetch live prices on load and set up the active simulation
    await fetchLivePrices();
    startPriceSimulation();
});
