// Warehouse Configuration Rules
const warehouseConfig = {
  AISLE: {
    A01: { racks: 9, shelves: 9, getBins: () => 3 },
    A02: { racks: 13, shelves: 9, getBins: (r) => (r <= 8 ? 3 : 6) },
    A03: { racks: 20, shelves: 9, getBins: (r) => (r <= 19 ? 3 : 4) },
    A04: { racks: 27, shelves: 9, getBins: (r) => (r <= 24 ? 3 : 4) },
    A05: { racks: 27, shelves: 9, getBins: () => 3 },
    A06: { racks: 26, shelves: 9, getBins: () => 3 },
    A07: { racks: 27, shelves: 9, getBins: () => 3 },
    A08: { racks: 7, shelves: 9, getBins: () => 3 },
    A09: { racks: 12, shelves: 9, getBins: () => 3 },
    A10: { racks: 5, shelves: 9, getBins: (r) => (r === 1 ? 6 : 3) },
    A11: { racks: 11, shelves: 9, getBins: () => 3 },
    A12: { racks: 9, shelves: 4, getBins: () => 3 },
    A13: { racks: 1, shelves: 2, getBins: () => 1 },
    A14: { racks: 2, shelves: 5, getBins: () => 3 }
  },
  FNV: {
    FV01: {
      racks: 16,
      shelves: 8,
      getBins: (r) => {
        if (r >= 1 && r <= 10) return 1;
        if (r >= 11 && r <= 13) return 3;
        if (r >= 14 && r <= 15) return 1;
        if (r === 16) return 3;
      }
    }
  },
  CR: {
    CR01: {
      racks: 18,
      shelves: 8,
      getBins: () => 3
    }
  },
  FR: {
    FR01: {
      racks: 17,
      shelves: 8,
      getBins: () => 3
    }
  }
};

let state = {
  zone: 'AISLE',
  aisle: null,
  rack: null,
  shelf: null,
  view: 'AISLES'
};

const gridContainer = document.getElementById('selectionGrid');
const breadcrumb = document.getElementById('breadcrumb');
const qrDisplay = document.getElementById('qrDisplay');
const qrGrid = document.getElementById('qrGrid');
const qrTitle = document.getElementById('qrTitle');

function getBinLetters(count) {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
}

// Top Navigation Bar Listener
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    
    state.zone = e.target.dataset.type;
    state.aisle = null;
    state.rack = null;
    state.shelf = null;

    const availableAisles = Object.keys(warehouseConfig[state.zone] || {});
    if (availableAisles.length === 1) {
      state.aisle = availableAisles[0];
      renderRacks();
    } else {
      renderAisles();
    }
  });
});

// Clickable Breadcrumbs Renderer
function updateBreadcrumb() {
  breadcrumb.innerHTML = '';

  const singleAisleZone = Object.keys(warehouseConfig[state.zone]).length === 1;

  // 1. Zone Link
  if (singleAisleZone && state.view === 'RACKS') {
    breadcrumb.appendChild(createCrumbSpan(`Zone: ${state.zone}`, null, true));
  } else {
    breadcrumb.appendChild(createCrumbSpan(`Zone: ${state.zone}`, () => {
      if (singleAisleZone) {
        renderRacks();
      } else {
        renderAisles();
      }
    }));
  }

  // 2. Aisle / Section Link
  if (state.aisle && !singleAisleZone) {
    breadcrumb.appendChild(createSeparator());
    if (state.view === 'RACKS') {
      breadcrumb.appendChild(createCrumbSpan(state.aisle, null, true));
    } else {
      breadcrumb.appendChild(createCrumbSpan(state.aisle, () => renderRacks()));
    }
  }

  // 3. Rack Link
  if (state.rack) {
    breadcrumb.appendChild(createSeparator());
    const rackText = `Rack ${String(state.rack).padStart(3, '0')}`;
    
    if (state.view === 'SHELVES' || state.view === 'QRS') {
      const config = warehouseConfig[state.zone][state.aisle];
      const binCount = config.getBins(state.rack);
      
      if (state.view === 'QRS' && binCount === 1) {
        breadcrumb.appendChild(createCrumbSpan(rackText, null, true));
      } else if (state.view === 'SHELVES') {
        breadcrumb.appendChild(createCrumbSpan(rackText, null, true));
      } else {
        breadcrumb.appendChild(createCrumbSpan(rackText, () => renderShelves()));
      }
    }
  }

  // 4. Shelf Link (Active View)
  if (state.shelf && state.view === 'QRS') {
    breadcrumb.appendChild(createSeparator());
    const shelfText = `Shelf ${String(state.shelf).padStart(2, '0')}`;
    breadcrumb.appendChild(createCrumbSpan(shelfText, null, true));
  }
}

function createCrumbSpan(text, onClickHandler, isCurrent = false) {
  const span = document.createElement('span');
  if (isCurrent) {
    span.className = 'crumb-current';
    span.textContent = text;
  } else {
    span.className = 'crumb-link';
    span.textContent = text;
    span.onclick = onClickHandler;
  }
  return span;
}

function createSeparator() {
  const sep = document.createElement('span');
  sep.className = 'crumb-separator';
  sep.textContent = '-';
  return sep;
}

// Level 1: Render Aisles
function renderAisles() {
  state.view = 'AISLES';
  state.aisle = null;
  state.rack = null;
  state.shelf = null;

  qrDisplay.classList.add('hidden');
  gridContainer.classList.remove('hidden');
  updateBreadcrumb();
  gridContainer.innerHTML = '';

  const aisles = Object.keys(warehouseConfig[state.zone] || {});
  aisles.forEach(aisle => {
    const btn = document.createElement('button');
    btn.className = 'select-btn';
    btn.textContent = aisle;
    btn.onclick = () => {
      state.aisle = aisle;
      renderRacks();
    };
    gridContainer.appendChild(btn);
  });
}

// Level 2: Render Racks
function renderRacks() {
  state.view = 'RACKS';
  state.rack = null;
  state.shelf = null;

  qrDisplay.classList.add('hidden');
  gridContainer.classList.remove('hidden');
  updateBreadcrumb();
  gridContainer.innerHTML = '';

  const config = warehouseConfig[state.zone][state.aisle];
  for (let r = 1; r <= config.racks; r++) {
    const rackStr = String(r).padStart(3, '0');
    const binCount = config.getBins(r);
    
    const btn = document.createElement('button');
    btn.className = 'select-btn';
    btn.textContent = `Rack ${rackStr}`;
    
    btn.onclick = () => {
      state.rack = r;
      if (binCount === 1) {
        renderRackQRs();
      } else {
        renderShelves();
      }
    };
    gridContainer.appendChild(btn);
  }
}

// Level 3: Render Shelves
function renderShelves() {
  state.view = 'SHELVES';
  state.shelf = null;

  qrDisplay.classList.add('hidden');
  gridContainer.classList.remove('hidden');
  updateBreadcrumb();
  gridContainer.innerHTML = '';

  const config = warehouseConfig[state.zone][state.aisle];
  for (let s = 1; s <= config.shelves; s++) {
    const shelfStr = String(s).padStart(2, '0');
    const btn = document.createElement('button');
    btn.className = 'select-btn';
    btn.textContent = `Shelf ${shelfStr}`;
    btn.onclick = () => {
      state.shelf = s;
      renderShelfBinsQRs();
    };
    gridContainer.appendChild(btn);
  }
}

// Render QRs: Single-Bin Rack Mode
function renderRackQRs() {
  state.view = 'QRS';
  gridContainer.classList.add('hidden');
  qrDisplay.classList.remove('hidden');

  const rackStr = String(state.rack).padStart(3, '0');
  updateBreadcrumb();
  qrTitle.textContent = `${state.aisle} - Rack ${rackStr} (All Shelves)`;
  qrGrid.innerHTML = '';

  const config = warehouseConfig[state.zone][state.aisle];

  for (let s = 1; s <= config.shelves; s++) {
    const shelfStr = String(s).padStart(2, '0');
    const locString = `F0-${state.aisle}-${rackStr}-${shelfStr}-A`;
    createQRCard(locString);
  }
}

// Render QRs: Multi-Bin Shelf Mode
function renderShelfBinsQRs() {
  state.view = 'QRS';
  gridContainer.classList.add('hidden');
  qrDisplay.classList.remove('hidden');

  const rackStr = String(state.rack).padStart(3, '0');
  const shelfStr = String(state.shelf).padStart(2, '0');
  
  updateBreadcrumb();
  qrTitle.textContent = `${state.aisle} - Rack ${rackStr} - Shelf ${shelfStr}`;
  qrGrid.innerHTML = '';

  const config = warehouseConfig[state.zone][state.aisle];
  const binCount = config.getBins(state.rack);
  const bins = getBinLetters(binCount);

  bins.forEach(bin => {
    const locString = `F0-${state.aisle}-${rackStr}-${shelfStr}-${bin}`;
    createQRCard(locString);
  });
}

// Helper to generate a QR element
function createQRCard(locString) {
  const card = document.createElement('div');
  card.className = 'qr-card';

  const label = document.createElement('p');
  label.textContent = locString;
  card.appendChild(label);

  const qrDiv = document.createElement('div');
  card.appendChild(qrDiv);

  qrGrid.appendChild(card);

  new QRCode(qrDiv, {
    text: locString,
    width: 128,
    height: 128
  });
}

// Initial Run
renderAisles();