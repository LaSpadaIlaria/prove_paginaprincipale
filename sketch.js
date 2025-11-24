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
        selectedContinent: '#7d7d7d91'
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
        { label: '4200 B.C.', value: -4200 },
        { label: '3200 B.C.', value: -3200 },
        { label: '2200 B.C.', value: -2200 },
        { label: '1200 B.C.', value: -1200 },
        { label: '200 B.C.', value: -200 },
        { label: '800 A.D.', value: 800 },
        { label: '1800 A.D.', value: 1800 },
        { label: '1850 A.D.', value: 1850 },
        { label: '1900 A.D.', value: 1900 },
        { label: '1950 A.D.', value: 1950 },
        { label: '2000 A.D.', value: 2000 },
        { label: '2050 A.D.', value: 2050 }
    ]
};

/* 
    - palette colori utilizzata per tutti gli elementi grafici,
    - impostazioni di layout (raggi min/max, larghezze box),
    - array di "secoli" / etichette usate per il selettore.
*/

// MODIFICA: Array degli anni per i cerchi concentrici secondo la timeline 
const CONCENTRIC_YEARS = [-4200, -3200, -2200, -1200, -200, 800, 1800, 1850, 1900, 1950, 2000, 2050];


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

/*
    Stato globale dell'applicazione.
    Contiene:
    - dati originali (volcanoData),
    - sottoinsiemi filtrati (filteredData), sono con il null perchè in questo modo dopo variano quando applico il filtro
    - selezioni utente (selectedCentury, selectedContinent),
    - posizioni e dati calcolati per il rendering (continentAngles, volcanoPositions),
    - dati di layout dinamici (centerX, centerY).
    
    Logica:
    1. Caricare i dati -> state.volcanoData.
    2. Applicare filtri -> state.filteredData.
    3. Calcoli che dipendono dai dati (angoli, posizioni) salvati qui per evitare ricalcoli ripetuti.
*/

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
/*

    Cosa fa, passo-passo:
    1. Itera tutte le righe della tabella.
    2. Legge colonne: Year, Name, Location, Country, Type, Impact, Deaths.
    3. Converte Year, Impact, Deaths a numeri con fallback (0 o 1).
    4. Mappa location in continente usando CONTINENT_MAP; fallback 'Sconosciuto'.
    5. Aggiunge ogni oggetto a state.volcanoData.
    6. Ordina i dati per anno decrescente (più recenti primi).
    7. Chiama initializeData per calcoli aggiuntivi.

*/

function initializeData() {
    state.filteredData = [...state.volcanoData];
    state.globalYearRange = getGlobalYearRange();
    calculateContinentData();
    calculateVolcanoPositions();
}
/*
    Prepara dati e calcoli che servono prima del rendering:
    1. Copia l'array originale su filteredData (stato iniziale: nessun filtro).
    2. Calcola anno min/max globale per possibili slider/timeline.
    3. Calcola conteggi e angoli dei continenti (usati per la "torta" circolare).
    4. Genera posizioni angolari casuali, coerenti per ogni vulcano, usando calculateVolcanoPositions.
*/

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
/*
    Calcola due cose correlate:
    A) state.continentCounts: conteggio dei vulcani per continente.
    B) state.continentAngles: angoli (start, end, mid) usati per dividere il cerchio principale in "fette".
    
    1. Inizializza un oggetto con chiavi per ogni continente a 0.
    2. Itera state.volcanoData incrementando il conteggio per il relativo continente (se esiste).
    3. Calcola il totale e converte ogni conteggio in una proporzione [0,1].
    4. Moltiplica la proporzione per TWO_PI per ottenere l'ampiezza angolare.
    5. Assegna start/end/mid accumulando startAngle.

    1. Normalizzare i continenti (garantito da CONTINENT_MAP).
    2. Contare items per continente.
    3. Convertire conteggi in angoli proporzionali.
    4. Salvare angoli per uso nel rendering (divider lines, slice selezionata).
*/

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
/*
    Associa a ogni vulcano un angolo casuale all'interno della "fetta" del suo continente.
    Lo fa usando una Map con chiave composta per garantire posizioni coerenti.
    
    Logica:
    1. Per ogni vulcano:
       a. costruisci una chiave unica (name-year-deaths) per identificare l'evento.
       b. prendi gli angoli del continente corrispondente.
       c. se non esiste ancora una posizione per quella chiave, genera random(angles.start, angles.end).
    2. Salva nella Map in modo da mantenere la posizione immutata nei redraw successivi.
*/

// Aggiornamento della funzione applyFilters per gestire gli intervalli corretti
function applyFilters() {
    state.filteredData = state.volcanoData.filter(v => {
        let centuryMatch = true;
        
        if (state.selectedCentury !== null) {
            // Trova l'indice del secolo selezionato
            const centuryIndex = CONCENTRIC_YEARS.indexOf(state.selectedCentury);
            if (centuryIndex !== -1 && centuryIndex < CONCENTRIC_YEARS.length - 1) {
                const startYear = CONCENTRIC_YEARS[centuryIndex];
                const endYear = CONCENTRIC_YEARS[centuryIndex + 1];
                
                // Gestione speciale per l'ultimo intervallo (inclusivo)
                if (centuryIndex === CONCENTRIC_YEARS.length - 2) {
                    centuryMatch = (v.year >= startYear && v.year <= endYear);
                } else {
                    centuryMatch = (v.year >= startYear && v.year < endYear);
                }
            } else {
                centuryMatch = false;
            }
        }
        
        const continentMatch = state.selectedContinent === null || 
                             v.continent === state.selectedContinent;
        return centuryMatch && continentMatch;
    });

    calculateContinentData();
    state.timelineYear = null;
}
/*
    Applica i filtri selezionati dall'utente (century e continente) e aggiorna filteredData.

    Come funziona:
    1. Per ogni vulcano valuta se rientra nell'intervallo di anni selezionato.
       - Usa CONCENTRIC_YEARS per trovare start/end dell'intervallo.
       - Per tutti gli intervalli eccetto l'ultimo, uso [start, end) (end escluso).
       - Per l'ultimo intervallo uso [start, end] (inclusivo) per includere l'ultimo anno.
    2. Controlla il filtro continente: se selectedContinent è null passa tutto.
    3. Ritorna i vulcani che soddisfano entrambi i filtri.
    4. Ricalcola i dati dei continenti (per aggiornare le proporzioni/angoli).
    5. Resetta timelineYear perché il filtro è cambiato.

    cose che mi hanno quasi fatto morire:
    - Usare CONCENTRIC_YEARS come riferimento garantisce che i filtri siano coerenti con gli anelli.
    - L'esclusione dell'end nei range evita doppie corrispondenze tra intervalli adiacenti.
*/

function getGlobalYearRange() { //mi dà l'intervallo min e max in questo modo lo posso usare per timeline e per il suo slider
    const years = state.volcanoData.map(v => v.year);
    return {
        min: Math.min(...years),
        max: Math.max(...years)
    };
}

// funzione per mappare l'anno a un raggio basato sugli anni concentrici
function getRadiusForYear(year) {
    // Trova l'indice dell'intervallo in cui si trova l'anno
    for (let i = 0; i < CONCENTRIC_YEARS.length - 1; i++) {
        const currentYear = CONCENTRIC_YEARS[i];
        const nextYear = CONCENTRIC_YEARS[i + 1];
        
        // Gestione speciale per l'ultimo intervallo (inclusivo)
        if (i === CONCENTRIC_YEARS.length - 2) {
            if (year >= currentYear && year <= nextYear) {
                return calculateRadiusInInterval(year, currentYear, nextYear, i);
            }
        } else {
            if (year >= currentYear && year < nextYear) {
                return calculateRadiusInInterval(year, currentYear, nextYear, i);
            }
        }
    }
    
    // Se l'anno è prima del primo anno concentric o dopo l'ultimo
    if (year < CONCENTRIC_YEARS[0]) {
        return CONFIG.layout.minRadius;
    } else {
        return CONFIG.layout.maxRadius;
    }
}
/*
    Mappa un anno al raggio corrispondente sul cerchio principale.

    Come:
    1. Scorre gli intervalli definiti in CONCENTRIC_YEARS.
    2. Trova l'intervallo che contiene l'anno.
    3. Per l'intervallo trovato chiama calculateRadiusInInterval per interpolare linearmente il raggio.
    4. Se l'anno è fuori range (< primo) -> minRadius; (> ultimo) -> maxRadius.

*/

// Funzione helper per calcolare il raggio all'interno di un intervallo
function calculateRadiusInInterval(year, startYear, endYear, intervalIndex) {
    const yearRange = endYear - startYear;
    const yearsFromStart = year - startYear;
    const proportion = yearsFromStart / yearRange;
    
    // Calcola il raggio corrispondente
    const radiusStep = (CONFIG.layout.maxRadius - CONFIG.layout.minRadius) / (CONCENTRIC_YEARS.length - 1);
    const startRadius = CONFIG.layout.minRadius + intervalIndex * radiusStep;
    const endRadius = CONFIG.layout.minRadius + (intervalIndex + 1) * radiusStep;
    
    return startRadius + proportion * (endRadius - startRadius);
}
/*
    Interpola linearmente il raggio per un anno all'interno di un intervallo:
    1. Calcola la proporzione temporale (0..1) dell'anno nell'intervallo.
    2. Calcola il passo di raggio per ogni intervallo in pixel (radiusStep).
    3. Determina startRadius/endRadius per l'intervallo corrente.
    4. Restituisce la posizione interpolata.

*/

// ===== SI INIZIA A DISEGNARE DA QUI =====
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
    textFont('Helvetica');
    text('ERUZIONI\nVULCANICHE', 60, 60);
}


function drawInfoBox() {
    const boxX = 60, boxY = 380;
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
/*
    Disegna il box delle informazioni che mostra dettagli sul vulcano selezionato (hover).
   
    1. Disegna sfondo e bordo del box.
    2. Se c'è un vulcano sotto il mouse (state.hoveredVolcano), chiama drawVolcanoInfo.
    3. Altrimenti mostra un messaggio 'Seleziona un vulcano'.

*/

function drawVolcanoInfo(boxX, boxY) { //Mostra i dettagli strutturati del vulcano passato (nome, anno, paese, ecc).
    const v = state.hoveredVolcano;
    const infoLines = [
        { label: 'ultima eruzione', value: formatYear(v.year) },
        { label: 'paese', value: v.country || 'N/A' },
        { label: 'tipo', value: v.type || 'N/A' },
        { label: 'conseguenze', value: v.impact || '1' },
       
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


// Array globale per salvare le posizioni delle checkbox
state.centuryCheckboxPositions = [];

function drawCenturySelector() {
    const boxX = 60, boxY = 580;
    const boxW = CONFIG.layout.infoBoxWidth, boxH = 280;

    fill(CONFIG.colors.infoBox);
    stroke(CONFIG.colors.accent);
    strokeWeight(0.5);
    rect(boxX, boxY, boxW, boxH, 0, 0, 10, 10);

    // Titolo del selettore: sempre bianco
    fill(CONFIG.colors.text);
    noStroke();
    textSize(16);
    text('seleziona secolo:', boxX + 30, boxY + 23);

    const checkYStart = boxY + 60;
    drawCenturyCheckboxes(boxX, checkYStart);
}

function drawCenturyCheckboxes(boxX, checkYStart) {
    const checkSpacing = 30;
    const column1X = boxX + 30;
    const column2X = boxX + 180;
    const itemsPerColumn = Math.ceil(CONFIG.centuries.length / 2);

    textSize(11);

    // Reset array delle posizioni
    state.centuryCheckboxPositions = [];

    CONFIG.centuries.forEach((century, i) => {
        const column = i < itemsPerColumn ? column1X : column2X;
        const row = i < itemsPerColumn ? i : i - itemsPerColumn;
        const cy = checkYStart + row * checkSpacing;
        const isSelected = (century.value === state.selectedCentury);

        drawCheckbox(column, cy, isSelected);

        // Il testo deve essere sempre bianco
        fill(CONFIG.colors.text);
        noStroke();
        text(century.label, column + 20, cy + 3);

        // Salva la posizione esatta della checkbox per il click
        state.centuryCheckboxPositions.push({
            x: column,
            y: cy,
            width: 15,
            height: 15,
            value: century.value
        });
    });
}

function drawCheckbox(x, y, isSelected) {
    if (isSelected) {
        // Casella selezionata: piena rossa con spunta bianca
        fill(CONFIG.colors.accent);
        noStroke();
        rect(x, y, 15, 15, 2);

        stroke(CONFIG.colors.text);
        strokeWeight(2);
        line(x + 3, y + 7, x + 6, y + 11);
        line(x + 6, y + 11, x + 12, y + 4);
    } else {
        // Casella non selezionata: solo bordo rosso, vuota
        noFill();
        stroke(CONFIG.colors.accent);
        strokeWeight(1);
        rect(x, y, 15, 15, 2);
    }
}

// --- Gestione click basata su posizioni salvate ---
function handleCenturySelection() {
    state.centuryCheckboxPositions.forEach(pos => {
        if (mouseX >= pos.x && mouseX <= pos.x + pos.width &&
            mouseY >= pos.y && mouseY <= pos.y + pos.height) {
            state.selectedCentury = (state.selectedCentury === pos.value) ? null : pos.value;
            applyFilters();
        }
    });
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
/*
    Disegna il "nucleo" della visualizzazione: il cerchio centrale con anelli, fette continente e i vulcani.
    1. push/translate per posizionare l'origine al centro del grafico.
    2. Disegna la slice del continente selezionato (se presente).
    3. Disegna gli anelli concentrici (usando CONCENTRIC_YEARS).
    4. Disegna i divisori dei continenti (linee radiali).
    5. Disegna i vulcani (se ci sono).
    6. Dopo il pop, chiama checkHover per aggiornare hoveredVolcano in base al mouse.

*/

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
/*
    Evidenzia la "fetta" del continente selezionato disegnando un arc che copre start..end.

    Logica:
    - Usa angles.start e angles.end calcolati in calculateContinentData.
    - Disegna solo se esiste un continente selezionato e l'intervallo ha ampiezza > 0.
*/

function drawConcentricCircles() {
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
/*
    Disegna gli anelli concentrici e le etichette degli anni lungo il raggio.
    1. Calcola radiusStep in pixel dividendo lo spazio disponibile per (n-1) intervalli.
    2. Per ogni anno in CONCENTRIC_YEARS:
       - calcola r = minRadius + i*radiusStep
       - disegna un circle con diametro r*2
       - posiziona l'etichetta year appena sopra l'anello.
*/

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
/*
    Disegna le linee radiali che separano le fette dei continenti.
    Come:
    - Per ogni continente prendi angles.start e traccia una linea dal centro fino al raggio massimo.
    
*/

function drawVolcanoes() {
    // Cicla su tutti i vulcani filtrati (filtri su secolo e continente)
    state.filteredData.forEach(v => {
        let key = `${v.name}-${v.year}-${v.deaths}`; // Chiave unica per identificare il vulcano nella mappa delle posizioni
        let angle = state.volcanoPositions.get(key); // Recupera l'angolo salvato per il vulcano
        const angles = state.continentAngles[v.continent]; // Angoli totali del continente

        // Se non c'è un angolo specifico per il vulcano, usa il centro del settore del continente
        if (!angle && angles) angle = angles.mid;
        if (!angle) return; 

        // Calcola il raggio dal centro usando l'anno dell'eruzione
        const r = getRadiusForYear(v.year);

        const x = cos(angle) * r; // Coordinata X
        const y = sin(angle) * r; // Coordinata Y

        // Determina se il vulcano deve essere evidenziato per timeline o hover
        const isHighlighted = (state.timelineYear !== null && v.year === state.timelineYear);
        const isHovered = (state.hoveredVolcano === v);

        // Disegna il glow se evidenziato o hover
        if (isHighlighted || isHovered) {
            drawVolcanoGlow(v, x, y);
        }
        // Disegna il punto principale del vulcano
        drawVolcanoDot(x, y, isHighlighted, isHovered);
    });
}

function drawVolcanoGlow(volcano, x, y) {
    // Imposta dimensioni e trasparenza del glow in base all'impatto del vulcano
    const glowSize = map(volcano.impact, 5, 15, 35, 55);
    const alpha = map(volcano.impact, 5, 15, 33, 55);

    fill(255, 69, 0, alpha); 
    noStroke();
    circle(x, y, glowSize); 
}

function drawVolcanoDot(x, y, isHighlighted, isHovered) {
    // Colora il punto in base allo stato (evidenziato, hover o normale)
    if (isHighlighted) {
        fill(CONFIG.colors.highlightGlow);
    } else if (isHovered) {
        fill(CONFIG.colors.accentLight);
    } else {
        fill(CONFIG.colors.text);
    }
    noStroke();
    circle(x, y, isHighlighted ? 6 : 4); // Punto principale più grande se evidenziato
}

function drawContinentLabels() {
    // Disegna label e indicatori per ogni continente
    CONTINENTS.forEach(cont => {
        const angles = state.continentAngles[cont];
        if (!angles) return;

        const angle = angles.mid; // Angolo centrale del settore
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
        fill(CONFIG.colors.accent); // Evidenzia il continente selezionato
        noStroke();
    } else {
        stroke(CONFIG.colors.accent);
        strokeWeight(2);
        noFill();
    }
    circle(x - 30, y, 12); // Cerchio piccolo a sinistra della label
}

function drawContinentLabel(x, y, continent) {
    const isSelected = (state.selectedContinent === continent);
    fill(isSelected ? CONFIG.colors.accent : CONFIG.colors.text);
    noStroke();
    textSize(14);
    textAlign(LEFT, CENTER);
    text(continent, x - 10, y); // Testo a fianco del bullet
}

// ===== TIMELINE =====
function drawTimeline() {
    // Posizionamento timeline sul lato destro della finestra
    const tlX = width - CONFIG.layout.timelineWidth;
    const tlY = 100;
    const tlH = height - 200;

    stroke(CONFIG.colors.timeline);
    strokeWeight(2);
    line(tlX, tlY, tlX, tlY + tlH); // Linea verticale principale

    if (state.filteredData.length > 0) {
        drawTimelineTicks(tlX, tlY, tlH); // Indicatori anno min e max
        if (state.timelineYear !== null) {
            drawTimelineSlider(tlX, tlY, tlH); // Slider per anno selezionato
        }
    }
}

function drawTimelineTicks(tlX, tlY, tlH) {
    const years = getEruptionYears(); // Lista anni con eruzioni
    if (years.length === 0) return;

    fill(CONFIG.colors.timeline);
    noStroke();

    circle(tlX, getYearPosition(years[0], tlY, tlH), 8); // Cerchio anno minimo
    circle(tlX, getYearPosition(years[years.length - 1], tlY, tlH), 8); // Cerchio anno massimo
}

function drawTimelineSlider(tlX, tlY, tlH) {
    // Posizione verticale dello slider in base all'anno selezionato
    const yPos = getYearPosition(state.timelineYear, tlY, tlH);

    stroke(CONFIG.colors.accent);
    strokeWeight(1);
    line(tlX - 20, yPos, tlX, yPos); // Linea orizzontale del cursore

    fill(CONFIG.colors.accent);
    noStroke();
    circle(tlX - 20, yPos, 15); // Pallino dello slider

    textSize(16);
    fill(CONFIG.colors.accent);
    textAlign(LEFT, CENTER);
    text(formatYear(state.timelineYear), tlX + 10, yPos); // Mostra anno selezionato
}

function drawSelectedYear() {
    // Mostra quante eruzioni ci sono nell'anno selezionato
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
    // Restituisce un array ordinato di anni unici presenti nei dati filtrati
    return [...new Set(state.filteredData.map(v => v.year))].sort((a, b) => a - b);
}

function getYearPosition(year, tlY, tlH) {
    // Calcola la posizione Y dello slider/tick sulla timeline in base all'anno
    const years = getEruptionYears();
    if (years.length <= 1) return tlY;

    const minYear = years[0];
    const maxYear = years[years.length - 1];
    const normalized = (year - minYear) / (maxYear - minYear);
    return tlY + (1 - normalized) * tlH; // Scala invertita per far partire dal basso
}

function getYearFromPosition(yPos, tlY, tlH) {
    // Converte la posizione verticale del mouse in anno più vicino
    const years = getEruptionYears();
    if (years.length === 0) return null;

    const minYear = years[0];
    const maxYear = years[years.length - 1];
    const normalized = 1 - ((yPos - tlY) / tlH);
    const year = minYear + normalized * (maxYear - minYear);

    // Trova l'anno più vicino alla posizione calcolata
    return years.reduce((closest, current) => {
        return Math.abs(current - year) < Math.abs(closest - year) ? current : closest;
    });
}

// ===== INTERAZIONI =====
function checkHover() {
    // Controlla se il mouse è sopra un vulcano
    if (state.filteredData.length === 0) {
        state.hoveredVolcano = null;
        return;
    }

    state.hoveredVolcano = state.filteredData.find(v => {
        const angles = state.continentAngles[v.continent];
        if (!angles) return false;

        const key = `${v.name}-${v.year}-${v.deaths}`;
        const angle = state.volcanoPositions.get(key) || angles.mid;
        const r = getRadiusForYear(v.year); // Raggio calcolato coerente con drawVolcanoes
        const x = state.centerX + cos(angle) * r;
        const y = state.centerY + sin(angle) * r;

        // Restituisce true se il mouse è vicino al vulcano (<8px)
        return dist(mouseX, mouseY, x, y) < 8;
    }) || null;
}

function mousePressed() {
    // Gestisce tutte le interazioni al click
    handleCenturySelection();
    handleContinentSelection();
    handleTimelineInteraction();
}

function mouseDragged() {
    // Aggiorna la timeline durante il trascinamento
    handleTimelineInteraction();
}

function handleCenturySelection() {
    // Controlla se l'utente ha cliccato su un secolo
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

        // Se il click cade sul checkbox, aggiorna il secolo selezionato
        if (mouseX >= column && mouseX <= column + 15 &&
            mouseY >= cy && mouseY <= cy + 15) {
            state.selectedCentury = (state.selectedCentury === century.value) ? null : century.value;
            applyFilters();
        }
    });
}

function handleContinentSelection() {
    // Controlla se l'utente ha cliccato su un continente
    CONTINENTS.forEach(cont => {
        const angles = state.continentAngles[cont];
        if (!angles) return;

        const angle = angles.mid;
        const r = CONFIG.layout.maxRadius + 50;
        const x = state.centerX + cos(angle) * r;
        const y = state.centerY + sin(angle) * r;

        // Se il click cade vicino al bullet del continente, aggiorna selezione
        if (dist(mouseX, mouseY, x - 30, y) < 10) {
            state.selectedContinent = (state.selectedContinent === cont) ? null : cont;
            applyFilters();
        }
    });
}

function handleTimelineInteraction() {
    // Controlla se l'utente sta interagendo con la timeline
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
    return year + (year < 0 ? 'B.C' : ' A.D.');
}

function windowResized() {
    // Aggiorna canvas e layout quando la finestra cambia dimensione
    resizeCanvas(windowWidth, windowHeight);
    updateLayout();
}
