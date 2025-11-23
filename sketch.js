// ===== CONFIGURAZIONE =====
const CONFIG = {
    colors: {
        background: '#000000',
        text: '#FFFFFF',
        accent: '#FF4500',
        accentLight: '#FF4500',
        circle: '#ffffffb3',
        continentBase: '#FF4500',
        highlightGlow: '#FF4500',
        infoBox: '#000000ff',
        timeline: '#FF4500',
        selectedContinent: '#ff440057'
    },
    layout: {
        centerXRatio: 0.5,
        maxRadius: 380,
        minRadius: 20,
        timelineWidth: 150,
        infoBoxWidth: 300
    },
    centuries: [
        { label: 'tutti i secoli', value: null },
        { label: '4400 a.C.', value: -4400 },
        { label: '3400 a.C.', value: -3400 },
        { label: '2400 a.C.', value: -2400 },
        { label: '1400 a.C.', value: -1400 },
        { label: '400 a.C.', value: -400 },
        { label: '600 d.C.', value: 600 },
        { label: '1600 d.C.', value: 1600 },
        { label: '1800 d.C.', value: 1800 },
        { label: '1850 d.C.', value: 1850 },
        { label: '1900 d.C.', value: 1900 },
        { label: '1950 d.C.', value: 1950 },
        { label: '2000 d.C.', value: 2000 },
        { label: '2050 d.C.', value: 2050 }
    ]
};

// MODIFICA: Aggiungiamo la configurazione degli anni per i cerchi concentrici
const CONCENTRIC_YEARS = [-4400, -3400, -2400, -1400, -400, 600, 1600, 1800, 1850, 1900, 1950, 2000, 2050];

// ===== STATO APPLICAZIONE =====
let state = {
    volcanoData: [],
    filteredData: [],
    selectedCentury: null,
    selectedContinent: null,
    hoveredVolcano: null,
    timelineYear: null,
    centerX: 0,
    centerY: 0,
    continentAngles: {},
    continentCounts: {},
    volcanoPositions: new Map(),
    globalYearRange: { min: 0, max: 0 }
};

// ===== MAPPATURA CONTINENTI =====
const CONTINENT_MAP = {
    // ASIA
    'Arabia-S': 'Asia', 'Arabia-W': 'Asia', 'China-S': 'Asia', 'Halmahera-Indonesia': 'Asia',
    'Hokkaido-Japan': 'Asia', 'Honshu-Japan': 'Asia', 'Indonesia': 'Asia', 'Izu Is-Japan': 'Asia',
    'Java': 'Asia', 'Kamchatka': 'Asia', 'Kuril Is': 'Asia', 'Kyushu-Japan': 'Asia',
    'Lesser Sunda Is': 'Asia', 'Luzon-Philippines': 'Asia', 'Mindanao-Philippines': 'Asia',
    'Philippines-C': 'Asia', 'Ryukyu Is': 'Asia', 'Sangihe Is-Indonesia': 'Asia',
    'Sulawesi-Indonesia': 'Asia', 'Sumatra': 'Asia', 'Turkey': 'Asia',
    
    // AMERICHE
    'Alaska Peninsula': 'Americhe', 'Alaska-SW': 'Americhe', 'Aleutian Is': 'Americhe',
    'Canada': 'Americhe', 'Chile-C': 'Americhe', 'Chile-S': 'Americhe', 'Colombia': 'Americhe',
    'Costa Rica': 'Americhe', 'Ecuador': 'Americhe', 'El Salvador': 'Americhe', 'Galapagos': 'Americhe',
    'Guatemala': 'Americhe', 'Hawaiian Is': 'Americhe', 'Mexico': 'Americhe', 'Nicaragua': 'Americhe',
    'Peru': 'Americhe', 'US-Oregon': 'Americhe', 'US-Washington': 'Americhe', 'US-Wyoming': 'Americhe',
    'W Indies': 'Americhe',
    
    // EUROPA
    'Azores': 'Europa', 'Canary Is': 'Europa', 'Greece': 'Europa', 'Iceland-NE': 'Europa',
    'Iceland-S': 'Europa', 'Iceland-SE': 'Europa', 'Iceland-SW': 'Europa', 'Italy': 'Europa',
    
    // OCEANIA
    'Admiralty Is-SW Paci': 'Oceania', 'Banda Sea': 'Oceania', 'Bougainville-SW Paci': 'Oceania',
    'Kermadec Is': 'Oceania', 'New Britain-SW Pac': 'Oceania', 'New Guinea': 'Oceania',
    'New Guinea-NE of': 'Oceania', 'New Zealand': 'Oceania', 'Samoa-SW Pacific': 'Oceania',
    'Santa Cruz Is-SW Pac': 'Oceania', 'Solomon Is-SW Pacifi': 'Oceania', 'Tonga-SW Pacific': 'Oceania',
    'Vanuatu-SW Pacific': 'Oceania',
    
    // AFRICA
    'Africa-C': 'Africa', 'Africa-E': 'Africa', 'Africa-NE': 'Africa', 'Africa-W': 'Africa',
    'Cape Verde Is': 'Africa', 'Indian O-W': 'Africa', 'Red Sea': 'Africa'
};

const CONTINENTS = ['Asia', 'Americhe', 'Europa', 'Oceania', 'Africa'];

// ===== INIZIALIZZAZIONE =====
function preload() {
    loadTable('assets/data_impatto.csv', 'csv', 'header', processTableData);
}

function processTableData(table) {
    state.volcanoData = [];
    for (let r = 0; r < table.getRowCount(); r++) {
        let row = table.getRow(r);
        let location = row.getString('Location');
        
        let deaths = parseInt(row.getString('Deaths')) || 0;
        
        state.volcanoData.push({
            year: parseInt(row.getString('Year')) || 0,
            name: row.getString('Name'),
            location: location,
            country: row.getString('Country'),
            type: row.getString('Type'),
            impact: parseInt(row.getString('Impact')) || 1,
            deaths: deaths,
            continent: CONTINENT_MAP[location] || 'Sconosciuto'
        });
    }
    
    state.volcanoData.sort((a, b) => b.year - a.year);
    initializeData();
}

function initializeData() {
    state.filteredData = [...state.volcanoData];
    state.globalYearRange = getGlobalYearRange();
    calculateContinentData();
    calculateVolcanoPositions();
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    updateLayout();
}

function updateLayout() {
    state.centerX = width * CONFIG.layout.centerXRatio;
    state.centerY = height / 2;
}

// ===== CALCOLI =====
function calculateContinentData() {
    state.continentCounts = CONTINENTS.reduce((acc, cont) => {
        acc[cont] = 0;
        return acc;
    }, {});
    
    state.volcanoData.forEach(v => {
        if (state.continentCounts[v.continent] !== undefined) {
            state.continentCounts[v.continent]++;
        }
    });
    
    let total = state.volcanoData.length;
    let startAngle = 0;
    
    state.continentAngles = {};
    CONTINENTS.forEach(cont => {
        let proportion = total > 0 ? state.continentCounts[cont] / total : 0;
        let angleSize = proportion * TWO_PI;
        
        state.continentAngles[cont] = {
            start: startAngle,
            end: startAngle + angleSize,
            mid: startAngle + angleSize / 2
        };
        
        startAngle += angleSize;
    });
}

function calculateVolcanoPositions() {
    state.volcanoPositions.clear();
    
    state.volcanoData.forEach(v => {
        let key = `${v.name}-${v.year}-${v.deaths}`;
        let angles = state.continentAngles[v.continent];
        if (angles && !state.volcanoPositions.has(key)) {
            state.volcanoPositions.set(key, random(angles.start, angles.end));
        }
    });
}

function applyFilters() {
    state.filteredData = state.volcanoData.filter(v => {
        const centuryMatch = state.selectedCentury === null || 
                           (v.year >= state.selectedCentury && v.year < state.selectedCentury + 100);
        const continentMatch = state.selectedContinent === null || 
                             v.continent === state.selectedContinent;
        return centuryMatch && continentMatch;
    });

    calculateContinentData();
    state.timelineYear = null;
}

function getGlobalYearRange() {
    const years = state.volcanoData.map(v => v.year);
    return {
        min: Math.min(...years),
        max: Math.max(...years)
    };
}

// MODIFICA CRUCIALE: Nuova funzione per mappare l'anno a un raggio basato sugli anni concentrici
function getRadiusForYear(year) {
    // Trova l'indice dell'anno nel nostro array di anni concentrici
    for (let i = 0; i < CONCENTRIC_YEARS.length - 1; i++) {
        if (year >= CONCENTRIC_YEARS[i] && year < CONCENTRIC_YEARS[i + 1]) {
            // Calcola la proporzione tra i due anni concentrici
            const yearRange = CONCENTRIC_YEARS[i + 1] - CONCENTRIC_YEARS[i];
            const yearsFromStart = year - CONCENTRIC_YEARS[i];
            const proportion = yearsFromStart / yearRange;
            
            // Calcola il raggio corrispondente
            const radiusStep = (CONFIG.layout.maxRadius - CONFIG.layout.minRadius) / (CONCENTRIC_YEARS.length - 1);
            const startRadius = CONFIG.layout.minRadius + i * radiusStep;
            const endRadius = CONFIG.layout.minRadius + (i + 1) * radiusStep;
            
            return startRadius + proportion * (endRadius - startRadius);
        }
    }
    
    // Se l'anno è prima del primo anno concentric o dopo l'ultimo
    if (year < CONCENTRIC_YEARS[0]) {
        return CONFIG.layout.minRadius;
    } else {
        return CONFIG.layout.maxRadius;
    }
}

// ===== RENDERING =====
function draw() {
    background(CONFIG.colors.background);
    updateLayout();
    
    drawTitle();
    drawInfoBox();
    drawCenturySelector();
    drawMainCircle();
    drawContinentLabels();
    drawTimeline();
    drawSelectedYear();
}

function drawTitle() {
    fill(CONFIG.colors.accent);
    noStroke();
    textSize(48);
    textAlign(LEFT, TOP);
    textFont('Arial');
    text('ERUZIONI\nVULCANICHE', 60, 60);
}

function drawInfoBox() {
    const boxX = 60, boxY = 440;
    const boxW = CONFIG.layout.infoBoxWidth, boxH = 200;
    
    fill(CONFIG.colors.infoBox);
    stroke(CONFIG.colors.accent);
    strokeWeight(0.5);
    rect(boxX, boxY, boxW, boxH, 10, 10, 0, 0);
    
    fill(CONFIG.colors.accent);
    noStroke();
    textSize(16);
    text('informazioni:', boxX + 30, boxY + 20);
    
    fill(CONFIG.colors.text);
    if (state.hoveredVolcano) {
        drawVolcanoInfo(boxX, boxY);
    } else {
        textSize(14);
        text('Seleziona un\nvulcano', boxX + 30, boxY + 80);
    }
}

function drawVolcanoInfo(boxX, boxY) {
    const v = state.hoveredVolcano;
    const infoLines = [
        { label: 'ultima eruzione', value: formatYear(v.year) },
        { label: 'paese', value: v.country || 'N/A' },
        { label: 'tipo', value: v.type || 'N/A' },
        { label: 'conseguenze', value: v.impact || '1' },
        { label: 'numero morti', value: v.deaths || '0' }
    ];
    
    textSize(14);
    text(v.name, boxX + 30, boxY + 60);
    
    textSize(12);
    infoLines.forEach((line, i) => {
        const yPos = boxY + 90 + (i * 25);
        text(line.label, boxX + 30, yPos);
        text(line.value, boxX + 200, yPos);
    });
}

function drawCenturySelector() {
    const boxX = 60, boxY = 640;
    const boxW = CONFIG.layout.infoBoxWidth, boxH = 220;
    
    fill(CONFIG.colors.infoBox);
    stroke(CONFIG.colors.accent);
    strokeWeight(0.5);
    rect(boxX, boxY, boxW, boxH, 0, 0, 10, 10);
    
    fill(CONFIG.colors.accent);
    noStroke();
    textSize(16);
    text('seleziona secolo:', boxX + 30, boxY + 23);
    
    drawCenturyCheckboxes(boxX, boxY);
}

function drawCenturyCheckboxes(boxX, boxY) {
    const checkY = boxY + 60;
    const checkSpacing = 30;
    const column1X = boxX + 30;
    const column2X = boxX + 180;
    const itemsPerColumn = Math.ceil(CONFIG.centuries.length / 2);
    
    textSize(11);
    fill(CONFIG.colors.text);
    
    CONFIG.centuries.forEach((century, i) => {
        const column = i < itemsPerColumn ? column1X : column2X;
        const row = i < itemsPerColumn ? i : i - itemsPerColumn;
        const cy = checkY + row * checkSpacing;
        const isSelected = (century.value === state.selectedCentury);
        
        drawCheckbox(column, cy, isSelected);
        text(century.label, column + 20, cy + 3);
    });
}

function drawCheckbox(x, y, isSelected) {
    stroke(CONFIG.colors.accent);
    strokeWeight(1);
    isSelected ? fill(CONFIG.colors.accent) : noFill();
    rect(x, y, 15, 15, 2);
    
    if (isSelected) {
        stroke(CONFIG.colors.text);
        strokeWeight(2);
        line(x + 3, y + 7, x + 6, y + 11);
        line(x + 6, y + 11, x + 12, y + 4);
    }
}

function drawMainCircle() {
    push();
    translate(state.centerX, state.centerY);
    
    drawSelectedContinentSlice();
    drawConcentricCircles();
    drawContinentDividers();
    
    if (state.filteredData.length > 0) {
        drawVolcanoes();
    }
    
    pop();
    
    if (state.filteredData.length > 0) {
        checkHover();
    } else {
        state.hoveredVolcano = null;
    }
}

function drawSelectedContinentSlice() {
    if (state.selectedContinent) {
        const angles = state.continentAngles[state.selectedContinent];
        if (angles && angles.start !== angles.end) {
            fill(CONFIG.colors.selectedContinent);
            noStroke();
            arc(0, 0, CONFIG.layout.maxRadius * 2, CONFIG.layout.maxRadius * 2, 
                angles.start, angles.end, PIE);
        }
    }
}

function drawConcentricCircles() {
    // MODIFICA: Usiamo CONCENTRIC_YEARS invece di hardcodare gli anni
    const n = CONCENTRIC_YEARS.length;
    const radiusStep = (CONFIG.layout.maxRadius - CONFIG.layout.minRadius) / (n - 1);

    stroke(CONFIG.colors.circle);
    strokeWeight(0.5);
    noFill();

    CONCENTRIC_YEARS.forEach((year, i) => {
        const r = CONFIG.layout.minRadius + i * radiusStep;
        circle(0, 0, r * 2);

        push();
        rotate(PI * 2);
        fill(CONFIG.colors.text);
        noStroke();
        textSize(10);
        textAlign(CENTER, BOTTOM);
        text(formatYear(year), 0, -r - 5);
        pop();
    });
}

function drawContinentDividers() {
    stroke(CONFIG.colors.circle);
    strokeWeight(1);
    
    CONTINENTS.forEach(cont => {
        const angles = state.continentAngles[cont];
        if (angles) {
            line(0, 0, 
                 cos(angles.start) * CONFIG.layout.maxRadius, 
                 sin(angles.start) * CONFIG.layout.maxRadius);
        }
    });
}

function drawVolcanoes() {
    state.filteredData.forEach(v => {
        let key = `${v.name}-${v.year}-${v.deaths}`;
        let angle = state.volcanoPositions.get(key);
        const angles = state.continentAngles[v.continent];
        
        if (!angle && angles) angle = angles.mid;
        if (!angle) return;

        // MODIFICA IMPORTANTE: Usiamo la nuova funzione getRadiusForYear invece della mappatura lineare
        const r = getRadiusForYear(v.year);

        const x = cos(angle) * r;
        const y = sin(angle) * r;

        const isHighlighted = (state.timelineYear !== null && v.year === state.timelineYear);
        const isHovered = (state.hoveredVolcano === v);

        if (isHighlighted || isHovered) {
            drawVolcanoGlow(v, x, y);
        }
        drawVolcanoDot(x, y, isHighlighted, isHovered);
    });
}

function drawVolcanoGlow(volcano, x, y) {
    const glowSize = map(volcano.impact, 5, 15, 35, 55);
    const alpha = map(volcano.impact, 5, 15, 33, 55);
    
    fill(255, 69, 0, alpha);
    noStroke();
    circle(x, y, glowSize);
}

function drawVolcanoDot(x, y, isHighlighted, isHovered) {
    if (isHighlighted) {
        fill(CONFIG.colors.highlightGlow);
    } else if (isHovered) {
        fill(CONFIG.colors.accentLight);
    } else {
        fill(CONFIG.colors.text);
    }
    noStroke();
    circle(x, y, isHighlighted ? 6 : 4);
}

function drawContinentLabels() {
    CONTINENTS.forEach(cont => {
        const angles = state.continentAngles[cont];
        if (!angles) return;
        
        const angle = angles.mid;
        const r = CONFIG.layout.maxRadius + 50;
        const x = state.centerX + cos(angle) * r;
        const y = state.centerY + sin(angle) * r;
        
        drawContinentBullet(x, y, cont);
        drawContinentLabel(x, y, cont);
    });
}

function drawContinentBullet(x, y, continent) {
    const isSelected = (state.selectedContinent === continent);
    
    if (isSelected) {
        fill(CONFIG.colors.accent);
        noStroke();
    } else {
        stroke(CONFIG.colors.accent);
        strokeWeight(2);
        noFill();
    }
    circle(x - 30, y, 12);
}

function drawContinentLabel(x, y, continent) {
    const isSelected = (state.selectedContinent === continent);
    fill(isSelected ? CONFIG.colors.accent : CONFIG.colors.text);
    noStroke();
    textSize(14);
    textAlign(LEFT, CENTER);
    text(continent, x - 10, y);
}

// ===== TIMELINE =====
function drawTimeline() {
    const tlX = width - CONFIG.layout.timelineWidth;
    const tlY = 100;
    const tlH = height - 200;

    stroke(CONFIG.colors.timeline);
    strokeWeight(2);
    line(tlX, tlY, tlX, tlY + tlH);

    if (state.filteredData.length > 0) {
        drawTimelineTicks(tlX, tlY, tlH);
        if (state.timelineYear !== null) {
            drawTimelineSlider(tlX, tlY, tlH);
        }
    }
}

function drawTimelineTicks(tlX, tlY, tlH) {
    const years = getEruptionYears();
    if (years.length === 0) return;

    fill(CONFIG.colors.timeline);
    noStroke();

    circle(tlX, getYearPosition(years[0], tlY, tlH), 8);
    circle(tlX, getYearPosition(years[years.length - 1], tlY, tlH), 8);
}

function drawTimelineSlider(tlX, tlY, tlH) {
    const yPos = getYearPosition(state.timelineYear, tlY, tlH);

    stroke(CONFIG.colors.accent);
    strokeWeight(1);
    line(tlX - 20, yPos, tlX, yPos);

    fill(CONFIG.colors.accent);
    noStroke();
    circle(tlX - 20, yPos, 15);

    textSize(16);
    fill(CONFIG.colors.accent);
    textAlign(LEFT, CENTER);
    text(formatYear(state.timelineYear), tlX + 10, yPos);
}

function drawSelectedYear() {
    if (state.timelineYear !== null && state.filteredData.length > 0) {
        const eruptionsCount = state.filteredData.filter(v => v.year === state.timelineYear).length;
        if (eruptionsCount > 0) {
            fill(CONFIG.colors.text);
            textSize(14);
            textAlign(RIGHT, TOP);
            text(eruptionsCount + ' eruzioni', width - 120, 70);
        }
    }
}

function getEruptionYears() {
    return [...new Set(state.filteredData.map(v => v.year))].sort((a, b) => a - b);
}

function getYearPosition(year, tlY, tlH) {
    const years = getEruptionYears();
    if (years.length <= 1) return tlY;
    
    const minYear = years[0];
    const maxYear = years[years.length - 1];
    const normalized = (year - minYear) / (maxYear - minYear);
    return tlY + (1 - normalized) * tlH;
}

function getYearFromPosition(yPos, tlY, tlH) {
    const years = getEruptionYears();
    if (years.length === 0) return null;
    
    const minYear = years[0];
    const maxYear = years[years.length - 1];
    const normalized = 1 - ((yPos - tlY) / tlH);
    const year = minYear + normalized * (maxYear - minYear);
    
    return years.reduce((closest, current) => {
        return Math.abs(current - year) < Math.abs(closest - year) ? current : closest;
    });
}

// ===== INTERAZIONI =====
function checkHover() {
    if (state.filteredData.length === 0) {
        state.hoveredVolcano = null;
        return;
    }
    
    state.hoveredVolcano = state.filteredData.find(v => {
        const angles = state.continentAngles[v.continent];
        if (!angles) return false;
        
        const key = `${v.name}-${v.year}-${v.deaths}`;
        const angle = state.volcanoPositions.get(key) || angles.mid;
        // MODIFICA: Anche qui usiamo getRadiusForYear per coerenza
        const r = getRadiusForYear(v.year);
        const x = state.centerX + cos(angle) * r;
        const y = state.centerY + sin(angle) * r;
        
        return dist(mouseX, mouseY, x, y) < 8;
    }) || null;
}

function mousePressed() {
    handleCenturySelection();
    handleContinentSelection();
    handleTimelineInteraction();
}

function mouseDragged() {
    handleTimelineInteraction();
}

function handleCenturySelection() {
    const boxX = 60, boxY = 640;
    const checkYStart = boxY + 60;
    const checkSpacing = 30;
    const column1X = boxX + 30;
    const column2X = boxX + 180;
    const itemsPerColumn = Math.ceil(CONFIG.centuries.length / 2);

    CONFIG.centuries.forEach((century, i) => {
        const column = i < itemsPerColumn ? column1X : column2X;
        const row = i < itemsPerColumn ? i : i - itemsPerColumn;
        const cy = checkYStart + row * checkSpacing;

        if (mouseX >= column && mouseX <= column + 15 &&
            mouseY >= cy && mouseY <= cy + 15) {
            state.selectedCentury = (state.selectedCentury === century.value) ? null : century.value;
            applyFilters();
        }
    });
}

function handleContinentSelection() {
    CONTINENTS.forEach(cont => {
        const angles = state.continentAngles[cont];
        if (!angles) return;
        
        const angle = angles.mid;
        const r = CONFIG.layout.maxRadius + 50;
        const x = state.centerX + cos(angle) * r;
        const y = state.centerY + sin(angle) * r;
        
        if (dist(mouseX, mouseY, x - 30, y) < 10) {
            state.selectedContinent = (state.selectedContinent === cont) ? null : cont;
            applyFilters();
        }
    });
}

function handleTimelineInteraction() {
    const tlX = width - CONFIG.layout.timelineWidth;
    const tlY = 100;
    const tlH = height - 200;

    if (state.filteredData.length > 0 && 
        mouseX >= tlX - 50 && mouseX <= tlX + 50 && 
        mouseY >= tlY && mouseY <= tlY + tlH) {
        
        const selectedYear = getYearFromPosition(mouseY, tlY, tlH);
        if (selectedYear !== null) {
            state.timelineYear = selectedYear;
        }
    }
}

// ===== UTILITIES =====
function formatYear(year) {
    return year + (year < 0 ? ' a.C.' : ' d.C.');
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    updateLayout();
}
