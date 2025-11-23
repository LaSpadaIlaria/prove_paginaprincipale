// ===== CONFIGURAZIONE =====
const CONFIG = { //qui ho inserito la palette colori
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
        centerXRatio: 0.5, //non accetta valori assoluti come windowidth / 2 quindi si dà un valore tra 0 e 1 in questo caso visto che lo voglio centrato metto 0.5
        maxRadius: 380,
        minRadius: 20,
        timelineWidth: 150, //posizione della timeline
        infoBoxWidth: 300
    },
    centuries: [ //decido di selezionare tutti i secoli di interesse
        { label: 'tutti i secoli', value: null },
        { label: '4000 a.C.', value: -4000 },
        { label: '2000 a.C.', value: -2000 },
        { label: '0', value: 0 },
        { label: '1000 d.C.', value: 1000 },
        { label: '1600 d.C.', value: 1600 },
        { label: '1700 d.C.', value: 1700 },
        { label: '1800 d.C.', value: 1800 },
        { label: '1900 d.C.', value: 1900 },
        { label: '2000 d.C.', value: 2000 },
    ]
};

// ===== STATO APPLICAZIONE =====
let state = { //Serve per mantenere lo stato corrente dell’interfaccia, così ogni funzione di rendering o interazione può usarlo e aggiornarlo senza calcolare tutto da zero
    volcanoData: [], // Tutti i dati dei vulcani
    filteredData: [], //Contiene solo i vulcani filtrati secondo le scelte dell’utente.
    selectedCentury: null, //Memorizza il secolo selezionato nella timeline.1700 se utente clicca sul XVIII secolo, null se non seleziona niente
    selectedContinent: null, //Memorizza il continente selezionato dall’utente.
    hoveredVolcano: null, //Memorizza il vulcano su cui il mouse sta passando.
    timelineYear: null, //Indica l'anno esatto in cui si trova la linea della timeline. indica l'anno preciso
    centerX: 0, //La posizione del centro del cerchio (la mappa radiale dove posizioni i vulcani).
    centerY: 0,
    continentAngles: {}, //aiuta a legare ogni continente a un angolo della visualizzazione radiale.in questo modo poi mi è comodo per le etichette e cose del genere
    continentCounts: {}, //Contiene quante eruzioni per continente ci sono nei dati filtrati.
    volcanoPositions: new Map() //Map che contiene la posizione esatta (x,y) di ogni vulcano nella rappresentazione. in pratica è perchè non devi ricalcolare ogni frame dove sta ogni vulcano: lo calcoli una volta e lo salvi.
};

// ===== MAPPATURA CONTINENTI =====
// Mappatura delle località geografiche ai continenti
const CONTINENT_MAP = {
  // ASIA (21 località)
  'Arabia-S': 'Asia',
  'Arabia-W': 'Asia',
  'China-S': 'Asia',
  'Halmahera-Indonesia': 'Asia',
  'Hokkaido-Japan': 'Asia',
  'Honshu-Japan': 'Asia',
  'Indonesia': 'Asia',
  'Izu Is-Japan': 'Asia',
  'Java': 'Asia',
  'Kamchatka': 'Asia',
  'Kuril Is': 'Asia',
  'Kyushu-Japan': 'Asia',
  'Lesser Sunda Is': 'Asia',
  'Luzon-Philippines': 'Asia',
  'Mindanao-Philippines': 'Asia',
  'Philippines-C': 'Asia',
  'Ryukyu Is': 'Asia',
  'Sangihe Is-Indonesia': 'Asia',
  'Sulawesi-Indonesia': 'Asia',
  'Sumatra': 'Asia',
  'Turkey': 'Asia',
  
  // AMERICHE (20 località)
  'Alaska Peninsula': 'Americhe',
  'Alaska-SW': 'Americhe',
  'Aleutian Is': 'Americhe',
  'Canada': 'Americhe',
  'Chile-C': 'Americhe',
  'Chile-S': 'Americhe',
  'Colombia': 'Americhe',
  'Costa Rica': 'Americhe',
  'Ecuador': 'Americhe',
  'El Salvador': 'Americhe',
  'Galapagos': 'Americhe',
  'Guatemala': 'Americhe',
  'Hawaiian Is': 'Americhe',
  'Mexico': 'Americhe',
  'Nicaragua': 'Americhe',
  'Peru': 'Americhe',
  'US-Oregon': 'Americhe',
  'US-Washington': 'Americhe',
  'US-Wyoming': 'Americhe',
  'W Indies': 'Americhe',
  
  // EUROPA (8 località)
  'Azores': 'Europa',
  'Canary Is': 'Europa',
  'Greece': 'Europa',
  'Iceland-NE': 'Europa',
  'Iceland-S': 'Europa',
  'Iceland-SE': 'Europa',
  'Iceland-SW': 'Europa',
  'Italy': 'Europa',
  
  // OCEANIA (13 località)
  'Admiralty Is-SW Paci': 'Oceania',
  'Banda Sea': 'Oceania',
  'Bougainville-SW Paci': 'Oceania',
  'Kermadec Is': 'Oceania',
  'New Britain-SW Pac': 'Oceania',
  'New Guinea': 'Oceania',
  'New Guinea-NE of': 'Oceania',
  'New Zealand': 'Oceania',
  'Samoa-SW Pacific': 'Oceania',
  'Santa Cruz Is-SW Pac': 'Oceania',
  'Solomon Is-SW Pacifi': 'Oceania',
  'Tonga-SW Pacific': 'Oceania',
  'Vanuatu-SW Pacific': 'Oceania',
  
  // AFRICA (7 località)
  'Africa-C': 'Africa',
  'Africa-E': 'Africa',
  'Africa-NE': 'Africa',
  'Africa-W': 'Africa',
  'Cape Verde Is': 'Africa',
  'Indian O-W': 'Africa',
  'Red Sea': 'Africa'
};

// array semplice dei continenti. è più comodo da usare dopo, forse melo laborioso
const CONTINENTS = ['Asia', 'Americhe', 'Europa', 'Oceania', 'Africa'];

// Funzione helper per ottenere il continente da una località
function getContinent(location) {
  return CONTINENT_MAP[location] || 'Sconosciuto';
}
 

// ===== INIZIAMO =====
function preload() {
    loadTable('assets/data_impatto.csv', 'csv', 'header', 
        function(table) {
            state.volcanoData = processTableData(table);
            initializeData();
        }
    );
}
//da qui in poi i passaggi sono numerati così è più chiaro, anche perchè poi nelle modifiche mi ricordo dove andare a modificare le cose

function processTableData(table) {
    let data = [];
    for (let r = 0; r < table.getRowCount(); r++) {
        let row = table.getRow(r);
        let location = row.getString('Location'); //Prende il valore della colonna “Location” per quella riga.
        let continent = CONTINENT_MAP[location] //Converte la località in continente usando la mappa CONTINENT_MAP.
        
        data.push({ //Crea un oggetto vulcano con tutte le proprietà chiave:
            year: parseInt(row.getString('Year')),
            name: row.getString('Name'),
            location: location,
            country: row.getString('Country'),
            type: row.getString('Type'),
            impact: parseInt(row.getString('Impact')) || 1,
            continent: continent
        });
    }
    return data.sort((a, b) => b.year - a.year); //Ordina l’array dal vulcano più recente al più antico (decrescente). mi è utile per dopo questa roba
}


function initializeData() { // 1 Serve per preparare tutti i dati necessari alla visualizzazione prima di disegnare qualsiasi cosa
    
    // Copia tutta la lista originale dei vulcani nei dati filtrati
    state.filteredData = [...state.volcanoData];

    // Calcola le proporzioni degli spazi dei continenti (punto 2)
    calculateContinentData();

    // Calcola la posizione grafica di ogni vulcano (punto 3)
    calculateVolcanoPositions();

    // Imposta il range generale degli anni da usare nella timeline o filtri
    state.globalYearRange = getGlobalYearRange();
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
function calculateContinentData() { // 2 mi aiuta a capire lo spazio per ogni continente
    // Inizializza i contatori quindi crea/azzera l'oggetto state.continentCounts e imposta un contatore a 0 per ogni continente definito in CONTINENTS.
    state.continentCounts = {};
    CONTINENTS.forEach(cont => state.continentCounts[cont] = 0);
    
    //Conta i vulcani per continente usando TUTTO il dataset. lo faccio su tutto il dataset perchè gli spicchi rimangono costanti anche se applichi filtri; solo i punti dentro gli spicchi cambieranno. diciamo che è sbatta fare in modo che cambi. cioè se più avanti capisco bene come si fa posso anche provarci, ma per ora lo mantengo fisso
    state.volcanoData.forEach(v => {
        if (state.continentCounts[v.continent] !== undefined) {
            state.continentCounts[v.continent]++;
        }
    });
    
    //total contiene il numero totale di record nel dataset completo; startAngle è l'angolo corrente da cui partire a disegnare il primo spicchio.
    let total = state.volcanoData.length;
    let startAngle = 0;
    
    //Calcola proporzioni e angoli degli spicchi
    state.continentAngles = {};
    CONTINENTS.forEach(cont => { //calcola la proportion (percentuale) di ogni continente rispetto al totale; converte la percentuale in angleSize (radianti) moltiplicando per TWO_PI (intero cerchio); salva per ogni continente: start, end e mid (quest’ultimo utile per posizionare etichette o per calcolare posizioni “centrali”). aggiorna startAngle per il continente successivo.
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
    console.log("Vulcani con posizione assegnata:", state.filteredData.filter(v => state.volcanoPositions.has(v.name + v.year)).length);
    // resettiamo le posizioni ad ogni filtro

     state.filteredData.forEach(v => {
        let key = v.name + v.year;
        // Se non esiste ancora la posizione, la generiamo
        if (!state.volcanoPositions.has(key)) {
            let angles = state.continentAngles[v.continent];
            if (angles) {
                let randomAngle = random(angles.start, angles.end);
                state.volcanoPositions.set(key, randomAngle);
            }
        }
    });
}

function applyFilters() {
    state.filteredData = [...state.volcanoData];

    if (state.selectedCentury !== null) {
        let centuryStart = state.selectedCentury;
        let centuryEnd = state.selectedCentury + 100;
        state.filteredData = state.filteredData.filter(v => v.year >= centuryStart && v.year < centuryEnd);
    }

    if (state.selectedContinent !== null) {
        state.filteredData = state.filteredData.filter(v => v.continent === state.selectedContinent);
    }

    calculateContinentData(); // aggiorna angoli spicchi
    state.timelineYear = null;
}


//==== DISEGNAMOOOO ====//
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
    text('ERUZIONI', 60, 60);
    text('VULCANICHE', 60, 110);
}
//COSE PER IL RETTANGOLINO
function drawInfoBox() {
    let boxX = 60;
    let boxY = 440;
    let boxW = CONFIG.layout.infoBoxWidth;
    let boxH = 200;
    
    // Box background
    fill(CONFIG.colors.infoBox);
    stroke(CONFIG.colors.accent);
    strokeWeight(0.5);
    rect(boxX, boxY, boxW, boxH, 10, 10, 0, 0);
    
    // Titolo
    fill(CONFIG.colors.accent);
    noStroke();
    textSize(16);
    textAlign(LEFT, TOP);
    text('informazioni:', boxX + 30, boxY + 20);
    
    // Contenuto
    fill(CONFIG.colors.text);
    textSize(14);
    textAlign(LEFT, TOP);
    
    if (state.hoveredVolcano) {
        drawVolcanoInfo(boxX, boxY); //vedi dopo
    } else {
        text('Seleziona un', boxX + 30, boxY + 80);
        text('vulcano', boxX + 30, boxY + 105);
    }
}

function drawVolcanoInfo(boxX, boxY) {
    let v = state.hoveredVolcano;
    text(v.name, boxX + 30, boxY + 60);
    
    textSize(12);
    text('ultima eruzione', boxX + 30, boxY + 90);
    text(formatYear(v.year), boxX + 200, boxY + 90);
    
    text('paese', boxX + 30, boxY + 115);
    text(v.country || 'N/A', boxX + 200, boxY + 115);
    
    text('tipo', boxX + 30, boxY + 140);
    text(v.type || 'N/A', boxX + 200, boxY + 140);
    
    text('conseguenze', boxX + 30, boxY + 165);
    text(v.impact || '1', boxX + 200, boxY + 165);
}

function drawCenturySelector() {
    let boxX = 60;
    let boxY = 640;
    let boxW = CONFIG.layout.infoBoxWidth;
    let boxH = 220;
    
    fill(CONFIG.colors.infoBox);
    stroke(CONFIG.colors.accent);
    strokeWeight(0.5);
    rect(boxX, boxY, boxW, boxH, 0, 0, 10, 10);
    
    fill(CONFIG.colors.accent);
    noStroke();
    textSize(16);
    textAlign(LEFT, TOP);
    text('seleziona secolo:', boxX + 30, boxY + 23);
    
    drawCenturyCheckboxes(boxX, boxY);
}

function drawCenturyCheckboxes(boxX, boxY) {
    let checkY = boxY + 60;
    let checkSpacing = 30;
    let column1X = boxX + 30;
    let column2X = boxX + 180;
    
    textSize(11);
    fill(CONFIG.colors.text);
    noStroke();
    
    CONFIG.centuries.forEach((century, i) => {
        let column = i < 5 ? column1X : column2X;
        let row = i < 5 ? i : i - 5;
        let cy = checkY + row * checkSpacing;
        let isSelected = (century.value === state.selectedCentury);
        
        drawCheckbox(column, cy, isSelected);
        fill('#FFFFFF'); 
        noStroke()
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
//DISEGNAMO IL CERCHIO
function drawMainCircle() { //vabbè in pratica gli diciamo di centrare il centro al centro in modo che le trasformazioni dopo siano giuste
    push();
    translate(state.centerX, state.centerY);
    
    if (state.filteredData.length === 0) {
        pop();
        return;
    }
    
    let yearRange = state.globalYearRange; //vedi punto 5
    drawSelectedContinentSlice(); //vedi punto 6
    drawConcentricCircles(yearRange); //vedi punto 7
    drawContinentDividers(); //vedi punto 8
    drawVolcanoes(yearRange);// vedi punto 9
    
    pop();
    checkHover();
}

// Questa funzione analizza TUTTI i vulcani per trovare l'anno minimo e massimo
function getGlobalYearRange() {
    const years = state.volcanoData.map(v => v.year);

    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    return { min: minYear, max: maxYear };
}

function getYearRange() { // 5 Crea un array di tutti gli anni dei vulcani filtrati. Restituisce un oggetto {min, max} con l’anno più vecchio e quello più recente. Serve per sapere dove posizionare i cerchi concentrici e i punti dei vulcani sul grafico.
    let years = state.filteredData.map(v => v.year);
    return {
        min: Math.min(...years),
        max: Math.max(...years)
    };
}


function drawSelectedContinentSlice() { //6 per il colorino quando seleziono i continenti
    if (state.selectedContinent) { //vedo se è stato selezionato il continente
        let angles = state.continentAngles[state.selectedContinent]; //Qui recuper0 i valori start ed end del continente selezionato
        if (angles && angles.start !== angles.end) { // <-- evita cerchi e Controllo se il settore esiste davvero 
            fill(CONFIG.colors.selectedContinent);
            noStroke();
            arc(0, 0, CONFIG.layout.maxRadius * 2, CONFIG.layout.maxRadius * 2, 
                angles.start, angles.end, PIE);
        }
    }
}

function drawConcentricCircles(yearRange) {
    // Lista personalizzata di anni per i cerchi
    let customYears = [-4000, -2000, 0, 1000, 1600, 1700, 1800, 1900, 2000];

    stroke(CONFIG.colors.circle);
    strokeWeight(0.5);
    noFill();

    let n = customYears.length; // numero di cerchi
    // distanza costante tra cerchi
    let radiusStep = (CONFIG.layout.maxRadius - CONFIG.layout.minRadius) / (n - 1);

    for (let i = 0; i < n; i++) {
        let y = customYears[i]; // anno corrente
        let r = CONFIG.layout.minRadius + i * radiusStep; // distanza costante

        circle(0, 0, r * 2);

        // scrivi l’anno accanto al cerchio
        push();
        rotate(PI * 2);
        fill(CONFIG.colors.text);
        noStroke();
        textSize(10);
        textAlign(CENTER, BOTTOM);
        text(formatYear(y), 0, -r - 5);
        pop();
    }
}


function drawContinentDividers() { //disegna le linee che separano i "settori" dei continenti nel cerchio principale
    CONTINENTS.forEach(cont => {
        let angles = state.continentAngles[cont];
        if (!angles) return;
        
        stroke(CONFIG.colors.circle);
        strokeWeight(1);
        line(0, 0, cos(angles.start) * CONFIG.layout.maxRadius, sin(angles.start) * CONFIG.layout.maxRadius);
    });
}

function drawVolcanoes(yearRange) { //disegna ogni vulcano come pallino sul cerchio principale
    console.log("Numero di vulcani da disegnare:", state.filteredData.length);
   // Disegna solo i vulcani filtrati
    state.filteredData.forEach(v => {
        // Recupera l'angolo fisso già calcolato a partire dal dataset completo
        let angle = state.volcanoPositions.get(v.name + v.year);

        // Se per qualche motivo non c'è angolo, usa il centro del settore
        let angles = state.continentAngles[v.continent];
        if (!angle) angle = angles.mid;

        // Raggio basato sugli anni globali, non filtrati
        let r = map(v.year, state.globalYearRange.min, state.globalYearRange.max,
                    CONFIG.layout.minRadius, CONFIG.layout.maxRadius);

        let x = cos(angle) * r;
        let y = sin(angle) * r;

        let isHighlighted = (state.timelineYear !== null && v.year === state.timelineYear);
        let isHovered = (state.hoveredVolcano === v);

        drawVolcanoGlow(v, x, y, isHighlighted, isHovered);
        drawVolcanoDot(v, x, y, isHighlighted, isHovered);
    });
}

function drawVolcanoGlow(volcano, x, y, isHighlighted, isHovered) { //disegna quello schifoso glow che mi ha fatto uscire di testa :)
    if (isHighlighted || isHovered) { //viene attivato solo se ci passi sopra con il mouse
        let glowSize = map(volcano.impact, 5, 15, 35, 55); //onverte l’impatto del vulcano (1-16) in una dimensione del glow da 10 a 40 px.
        let alpha = map(volcano.impact, 5, 15, 33, 55); //converte l’impatto in trasparenza (alpha) del bagliore.
        
        for (let i = glowSize; i > 0; i -= 2) { //crea vcerchi concentrici
            fill(255, 69, 0, alpha);
            noStroke();
            circle(x, y, i);

        }
    }
}

function drawVolcanoDot(volcano, x, y, isHighlighted, isHovered) { //disegna il pallino che rappresenta l'eruzione
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

function drawContinentLabels() { //Disegna le etichette dei continenti attorno al cerchio principale dei vulcani.
    CONTINENTS.forEach(cont => {
        let angles = state.continentAngles[cont];
        if (!angles) return;
        
        let angle = angles.mid;
        let r = CONFIG.layout.maxRadius + 50;
        let x = state.centerX + cos(angle) * r;
        let y = state.centerY + sin(angle) * r;
        
        drawContinentBullet(x, y, cont); //definito qui sotto
        drawContinentLabel(x, y, cont); //definito appena sotto
    });
}

function drawContinentBullet(x, y, continent) {
    let isSelected = (state.selectedContinent === continent);
    if (isSelected) {
        fill(CONFIG.colors.accent);
    } else {
        stroke(CONFIG.colors.accent);
        strokeWeight(2);
        noFill();
    }
    circle(x - 30, y, 12);
}

function drawContinentLabel(x, y, continent) {
    let isSelected = (state.selectedContinent === continent);
    fill(isSelected ? CONFIG.colors.accent : CONFIG.colors.text);
    noStroke();
    textSize(14);
    textAlign(LEFT, CENTER);
    text(continent, x - 10, y);
    
}

//LINEA DEL TEMPO// la odio
function getEruptionYears() {
    const years = [...new Set(state.filteredData.map(v => v.year))];
    years.sort((a, b) => a - b);
    return years;
}

// Converte l'anno in una posizione Y sulla timeline
function getYearPosition(year, tlY, tlH) {
    const years = getEruptionYears();
    if (years.length <= 1) return tlY;
    
    const minYear = years[0];
    const maxYear = years[years.length - 1];
    
    // Calcola la posizione in base all'anno (più recente in alto, più vecchio in basso)
    const normalized = (year - minYear) / (maxYear - minYear);
    return tlY + (1 - normalized) * tlH; // Invertito per avere i recenti in alto
}

// Converte una posizione Y in un anno (per l'interazione col mouse)
function getYearFromPosition(yPos, tlY, tlH) {
    const years = getEruptionYears();
    if (years.length === 0) return null;
    
    const minYear = years[0];
    const maxYear = years[years.length - 1];
    
    // Calcola l'anno in base alla posizione Y
    const normalized = 1 - ((yPos - tlY) / tlH); // Invertito per avere i recenti in alto
    const year = minYear + normalized * (maxYear - minYear);
    
    // Trova l'anno più vicino nella lista degli anni disponibili
    let closestYear = years[0];
    let minDiff = Math.abs(year - closestYear);
    
    for (let i = 1; i < years.length; i++) {
        const diff = Math.abs(year - years[i]);
        if (diff < minDiff) {
            minDiff = diff;
            closestYear = years[i];
        }
    }
    
    return closestYear;
}

// Disegna l'intera timeline verticale
function drawTimeline() {
    let tlX = width - CONFIG.layout.timelineWidth;
    let tlY = 100;
    let tlH = height - 200;

    // linea verticale principale
    stroke(CONFIG.colors.timeline);
    strokeWeight(2);
    line(tlX, tlY, tlX, tlY + tlH);

    if (state.filteredData.length === 0) return;

    drawTimelineTicks(tlX, tlY, tlH);
    drawTimelineSlider(tlX, tlY, tlH);
}

// Disegna i due pallini agli estremi della timeline
function drawTimelineTicks(tlX, tlY, tlH) {
    const years = getEruptionYears();
    if (years.length === 0) return;

    fill(CONFIG.colors.timeline);
    noStroke();

    // Primo anno (più recente) - in alto
    circle(tlX, getYearPosition(years[0], tlY, tlH), 8);
    
    // Ultimo anno (più vecchio) - in basso
    circle(tlX, getYearPosition(years[years.length - 1], tlY, tlH), 8);
}

// Disegna lo slider dell'anno selezionato
function drawTimelineSlider(tlX, tlY, tlH) {
    if (state.timelineYear === null) return;

    const yPos = getYearPosition(state.timelineYear, tlY, tlH);

    // Linea orizzontale che collega lo slider alla timeline
    stroke(CONFIG.colors.accent);
    strokeWeight(1);
    line(tlX - 20, yPos, tlX, yPos);

    // Cerchio dello slider
    fill(CONFIG.colors.accent);
    noStroke();
    circle(tlX - 20, yPos, 15);

    // Testo dell'anno selezionato
    textSize(16);
    fill(CONFIG.colors.accent);
    textAlign(LEFT, CENTER);
    text(formatYear(state.timelineYear), tlX + 10, yPos);
}

// Disegna il testo del conteggio eruzioni
function drawSelectedYear() {
    if (state.timelineYear !== null) {
        let eruptionsCount = state.filteredData.filter(v => v.year === state.timelineYear).length;
        if (eruptionsCount > 0) {
            fill(CONFIG.colors.text);
            textSize(14);
            textAlign(RIGHT, TOP);
            text(eruptionsCount + ' eruzioni', width - 120, 70);
        }
    }
}

// Gestisce tutte le interazioni con la timeline
function handleTimelineInteraction() {
    let tlX = width - CONFIG.layout.timelineWidth;
    let tlY = 100;
    let tlH = height - 200;

    // Area di interazione più ampia e intuitiva
    const interactionArea = {
        left: tlX - 50,    // 50px a sinistra della timeline
        right: tlX + 50,   // 50px a destra della timeline  
        top: tlY,
        bottom: tlY + tlH
    };

    // Controlla se il mouse è nell'area di interazione
    if (mouseX >= interactionArea.left && 
        mouseX <= interactionArea.right && 
        mouseY >= interactionArea.top && 
        mouseY <= interactionArea.bottom) {
        
        updateTimelineFromMouse(tlX, tlY, tlH);
    }
}

// Aggiorna la timeline in base alla posizione del mouse
function updateTimelineFromMouse(tlX, tlY, tlH) {
    const years = getEruptionYears();
    if (years.length === 0) return;

    // Converti la posizione Y del mouse in un anno
    const selectedYear = getYearFromPosition(mouseY, tlY, tlH);
    
    if (selectedYear !== null) {
        state.timelineYear = selectedYear;
    }
}

// Funzione per il drag del mouse (aggiungi al tuo codice principale)
function mouseDragged() {
    handleTimelineInteraction();
}

// Funzione per il click del mouse (aggiungi al tuo codice principale)
function mousePressed() {
    handleTimelineInteraction();
}
   

// ===== INTERAZIONI =====
function checkHover() { //Controlla se il mouse è sopra un vulcano e aggiorna lo stato. è praticamente la rova dell'hover come funziona. quindi il calcolo della distanza ecc.
    if (state.filteredData.length === 0) {
        state.hoveredVolcano = null;
        return;
    }
    
    let yearRange = getYearRange();
    let foundHover = false;
    
    for (let v of state.filteredData) {
        let angles = state.continentAngles[v.continent];
        if (!angles) continue;
        
        let key = v.name + v.year;
        let angle = state.volcanoPositions.get(key) || angles.mid;
        let r = map(v.year, yearRange.min, yearRange.max, CONFIG.layout.minRadius, CONFIG.layout.maxRadius);
        let x = state.centerX + cos(angle) * r;
        let y = state.centerY + sin(angle) * r;
        let d = dist(mouseX, mouseY, x, y);
        
        if (d < 8) {
            state.hoveredVolcano = v;
            foundHover = true;
            break;
        }
    }
    
    if (!foundHover) {
        state.hoveredVolcano = null;
    }
}

function mousePressed() { //viene chiamata automaticamente da p5.js quando premi il mouse. Controlla se hai cliccato su un secolo, un continente o la timeline.
    handleCenturySelection(); //vedi punto 4
    handleContinentSelection();
    handleTimelineInteraction();
}

function mouseDragged() { //quando trascini il mouse. Permette di spostare lo slider della timeline anche trascinando.
    handleTimelineInteraction();
}

function handleCenturySelection() { //NON FUNZIONA UN CAZZO
    // Calcolo dinamico della posizione del riquadro dei secoli
    const boxX = width * 0.05;   // 5% da sinistra
    const boxY = height * 0.6;   // 60% dall'alto
    const checkYStart = boxY + 50;
    const checkSpacing = 24;
    const column1X = boxX + 20;
    const column2X = boxX + 160;
    const checkboxSize = 20; // Hitbox più grande per sicurezza

    CONFIG.centuries.forEach((century, i) => {
        const column = i < 5 ? column1X : column2X;
        const row = i < 5 ? i : i - 5;
        const cy = checkYStart + row * checkSpacing;

        // Controllo se il mouse è dentro la hitbox del checkbox
        if (mouseX >= column && mouseX <= column + checkboxSize &&
            mouseY >= cy && mouseY <= cy + checkboxSize) {
            // Toggle selezione se il secolo era già selezionato
            state.selectedCentury = (state.selectedCentury === century.value) ? null : century.value;
            applyFilters();
        }
    });
}

function handleContinentSelection() { //Cicla su tutti i continenti. Calcola posizione (x, y) della etichetta / pallino del continente. Controlla se il mouse è vicino (distanza < 10px). Se sì →  selezione continente e aggiorna filtri.
    CONTINENTS.forEach(cont => {
        let angles = state.continentAngles[cont];
        if (!angles) return;
        
        let angle = angles.mid;
        let r = CONFIG.layout.maxRadius + 50;
        let x = state.centerX + cos(angle) * r;
        let y = state.centerY + sin(angle) * r;
        
        let d = dist(mouseX, mouseY, x - 30, y);
        if (d < 10) {
            state.selectedContinent = (state.selectedContinent === cont) ? null : cont;
            applyFilters();
        }
    });
}

function handleTimelineInteraction() { //controlla se il mouse è sopra la linea del tempo
    let tlX = width - CONFIG.layout.timelineWidth;
    let tlY = 100;
    let tlH = height - 200;
    
    if (mouseX > tlX - 20 && mouseX < tlX + 20 && mouseY > tlY && mouseY < tlY + tlH) {
        updateTimeline();
    }
}

function updateTimeline() { //Limita il mouse alla zona verticale della timeline. Converte la posizione Y del mouse in un anno usando map() (da Y → anno)
    if (state.filteredData.length === 0) return;
    
    let tlY = 100;
    let tlH = height - 200;
    let yearRange = getYearRange();
    
    let y = constrain(mouseY, tlY, tlY + tlH);
    state.timelineYear = Math.round(map(y, tlY + tlH, tlY, yearRange.min, yearRange.max));
}

// ===== UTILITIES =====
function formatYear(year) {
    return year + (year < 0 ? ' s.C.' : ' d.C.');
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    updateLayout();
}