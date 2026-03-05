const canvas = document.getElementById('warehouse-canvas');
const ctx = canvas.getContext('2d');

const drawButton = document.getElementById('draw-mode');
const selectButton = document.getElementById('select-mode');
const duplicateButton = document.getElementById('duplicate-bin');
const deleteButton = document.getElementById('delete-bin');
const clearButton = document.getElementById('clear-all');
const undoButton = document.getElementById('undo-action');
const redoButton = document.getElementById('redo-action');
const saveButton = document.getElementById('save-plan');
const loadButton = document.getElementById('load-plan');
const exportButton = document.getElementById('export-image');
const fileInput = document.getElementById('file-input');

const snapToggle = document.getElementById('snap-toggle');
const gridToggle = document.getElementById('grid-toggle');
const labelsToggle = document.getElementById('labels-toggle');
const autosaveToggle = document.getElementById('autosave-toggle');
const gridSizeInput = document.getElementById('grid-size');

const measureTooltip = document.getElementById('measure-tooltip');
const measureHandle = measureTooltip.querySelector('.tooltip-handle');
const lengthLabel = document.getElementById('measure-length');
const widthLabel = document.getElementById('measure-width');
const measureUnitToggle = document.getElementById('measure-unit-toggle');

const form = document.getElementById('bin-form');
const emptyState = document.getElementById('empty-state');
const fields = {
  name: document.getElementById('bin-name'),
  location: document.getElementById('bin-location'),
  section: document.getElementById('bin-section'),
  zone: document.getElementById('bin-zone'),
  notes: document.getElementById('bin-notes'),
  color: document.getElementById('bin-color'),
  locked: document.getElementById('bin-locked')
};

const PIXELS_PER_INCH = 4;
const STORAGE_KEY = 'dessin-warehouse-plan-v2';

let mode = 'draw';
let bins = [];
let selectedId = null;
let startPoint = null;
let dragOffset = null;
let tooltipDrag = null;

let options = {
  snapToGrid: true,
  showGrid: true,
  showLabels: true,
  autoSave: true,
  gridSize: 45,
  dimensionUnit: 'ft-in'
};

const undoStack = [];
const redoStack = [];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function deepCloneBins(source) {
  return source.map((bin) => ({ ...bin }));
}

function normalizeBin(raw) {
  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    x: Number(raw.x) || 0,
    y: Number(raw.y) || 0,
    width: Math.max(1, Number(raw.width) || 1),
    height: Math.max(1, Number(raw.height) || 1),
    name: raw.name || '',
    location: raw.location || '',
    section: raw.section || '',
    zone: raw.zone || '',
    notes: raw.notes || '',
    color: raw.color || '#9bb7ff',
    locked: Boolean(raw.locked)
  };
}

function pushHistory() {
  undoStack.push(deepCloneBins(bins));
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
}

function applyState(nextBins) {
  bins = nextBins.map(normalizeBin);
  if (selectedId && !bins.some((item) => item.id === selectedId)) {
    selectedId = null;
  }
  showForm(bins.find((item) => item.id === selectedId) || null);
  drawScene();
  persistIfEnabled();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(deepCloneBins(bins));
  const previous = undoStack.pop();
  applyState(previous);
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(deepCloneBins(bins));
  const next = redoStack.pop();
  applyState(next);
}

function toImperial(value) {
  const totalInches = Math.max(0, Math.round(value / PIXELS_PER_INCH));
  if (options.dimensionUnit === 'in') {
    return `${totalInches}"`;
  }

  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}' ${inches}"`;
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '').trim();
  const expanded = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized;

  const value = Number.parseInt(expanded, 16);
  if (Number.isNaN(value)) {
    return { r: 155, g: 183, b: 255 };
  }

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255
  };
}

function colorWithAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex || '#9bb7ff');
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function updateMeasureTooltip(width, height) {
  if (typeof width !== 'number' || typeof height !== 'number') {
    lengthLabel.textContent = '--';
    widthLabel.textContent = '--';
    return;
  }

  lengthLabel.textContent = toImperial(Math.max(width, height));
  widthLabel.textContent = toImperial(Math.min(width, height));
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function snap(value) {
  if (!options.snapToGrid) return value;
  return Math.round(value / options.gridSize) * options.gridSize;
}

function drawGrid() {
  if (!options.showGrid) return;

  ctx.save();
  ctx.strokeStyle = '#e3e9fb';
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += options.gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += options.gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawScene() {
  document.body.classList.toggle('hide-grid', !options.showGrid);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  bins.forEach((bin) => {
    const selected = bin.id === selectedId;
    const binColor = bin.color || '#9bb7ff';

    // Zone = ultra pâle
    ctx.fillStyle = colorWithAlpha(binColor, 0.12);
    ctx.fillRect(bin.x, bin.y, bin.width, bin.height);

    // Section = un peu plus visible
    const sectionInset = Math.min(bin.width, bin.height) * 0.08;
    ctx.fillStyle = colorWithAlpha(binColor, 0.2);
    ctx.fillRect(
      bin.x + sectionInset,
      bin.y + sectionInset,
      Math.max(1, bin.width - sectionInset * 2),
      Math.max(1, bin.height - sectionInset * 2)
    );

    // Bin = le plus foncé mais transparent pour voir la grille
    const binInset = Math.min(bin.width, bin.height) * 0.18;
    ctx.fillStyle = colorWithAlpha(binColor, 0.34);
    ctx.fillRect(
      bin.x + binInset,
      bin.y + binInset,
      Math.max(1, bin.width - binInset * 2),
      Math.max(1, bin.height - binInset * 2)
    );

    ctx.strokeStyle = selected ? '#1f4ecf' : '#4a6ad3';
    ctx.lineWidth = selected ? 3 : 1.6;
    ctx.strokeRect(bin.x, bin.y, bin.width, bin.height);

    if (bin.locked) {
      ctx.fillStyle = '#0f1f43';
      ctx.font = '20px -apple-system, sans-serif';
      ctx.fillText('🔒', bin.x + bin.width - 26, bin.y + 24);
    }

    if (options.showLabels) {
      ctx.fillStyle = '#0f1f43';
      ctx.font = '24px -apple-system, sans-serif';
      const title = bin.name?.trim() || 'Bin sans nom';
      ctx.fillText(title, bin.x + 10, bin.y + 30);

      ctx.fillStyle = '#233f8a';
      ctx.font = '18px -apple-system, sans-serif';
      ctx.fillText(`Zone: ${bin.zone || 'N/A'}`, bin.x + 10, bin.y + 56);
      ctx.fillText(`Section: ${bin.section || 'N/A'}`, bin.x + 10, bin.y + 78);
    }
  });
}

function setMode(nextMode) {
  mode = nextMode;
  drawButton.classList.toggle('active', mode === 'draw');
  selectButton.classList.toggle('active', mode === 'select');
}

function hitTest(x, y) {
  for (let i = bins.length - 1; i >= 0; i -= 1) {
    const bin = bins[i];
    if (x >= bin.x && x <= bin.x + bin.width && y >= bin.y && y <= bin.y + bin.height) {
      return bin;
    }
  }
  return null;
}

function showForm(bin) {
  if (!bin) {
    form.hidden = true;
    emptyState.hidden = false;
    return;
  }

  form.hidden = false;
  emptyState.hidden = true;
  fields.name.value = bin.name || '';
  fields.location.value = bin.location || '';
  fields.section.value = bin.section || '';
  fields.zone.value = bin.zone || '';
  fields.notes.value = bin.notes || '';
  fields.color.value = bin.color || '#9bb7ff';
  fields.locked.checked = Boolean(bin.locked);
}

function selectBin(bin) {
  selectedId = bin ? bin.id : null;
  showForm(bin);

  if (bin) {
    updateMeasureTooltip(bin.width, bin.height);
  } else {
    updateMeasureTooltip();
  }

  drawScene();
}

function clampTooltipPosition(x, y) {
  const maxX = window.innerWidth - measureTooltip.offsetWidth - 8;
  const maxY = window.innerHeight - measureTooltip.offsetHeight - 8;
  return {
    x: clamp(x, 8, maxX),
    y: clamp(y, 8, maxY)
  };
}

function setTooltipPosition(x, y) {
  const pos = clampTooltipPosition(x, y);
  measureTooltip.style.left = `${pos.x}px`;
  measureTooltip.style.top = `${pos.y}px`;
  measureTooltip.style.bottom = 'auto';
  measureTooltip.style.transform = 'none';
}

function persistIfEnabled() {
  if (!options.autoSave) return;
  const payload = { bins, options };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function restoreFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);
    bins = Array.isArray(parsed.bins) ? parsed.bins.map(normalizeBin) : [];
    options = {
      ...options,
      ...(parsed.options || {})
    };
    if (!['ft-in', 'in'].includes(options.dimensionUnit)) options.dimensionUnit = 'ft-in';
  } catch (_) {
    bins = [];
  }
}

function syncOptionsUI() {
  snapToggle.checked = options.snapToGrid;
  gridToggle.checked = options.showGrid;
  labelsToggle.checked = options.showLabels;
  autosaveToggle.checked = options.autoSave;
  gridSizeInput.value = String(options.gridSize);
  measureUnitToggle.textContent = options.dimensionUnit === 'in' ? '📏 po' : '📏 pi+po';
}

canvas.addEventListener('pointerdown', (event) => {
  canvas.setPointerCapture(event.pointerId);
  const pos = pointerPosition(event);

  if (mode === 'draw') {
    startPoint = { x: snap(pos.x), y: snap(pos.y) };
    return;
  }

  const hit = hitTest(pos.x, pos.y);
  selectBin(hit);

  if (hit && !hit.locked) {
    dragOffset = {
      x: pos.x - hit.x,
      y: pos.y - hit.y
    };
    pushHistory();
  }
});

canvas.addEventListener('pointermove', (event) => {
  const pos = pointerPosition(event);

  if (mode === 'draw' && startPoint) {
    drawScene();
    const currentX = snap(pos.x);
    const currentY = snap(pos.y);
    const width = currentX - startPoint.x;
    const height = currentY - startPoint.y;

    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#244bc5';
    ctx.lineWidth = 3;
    ctx.strokeRect(startPoint.x, startPoint.y, width, height);
    ctx.setLineDash([]);

    updateMeasureTooltip(Math.abs(width), Math.abs(height));
    return;
  }

  if (mode === 'select' && dragOffset && selectedId) {
    const current = bins.find((item) => item.id === selectedId);
    if (!current || current.locked) return;

    current.x = clamp(snap(pos.x - dragOffset.x), 0, canvas.width - current.width);
    current.y = clamp(snap(pos.y - dragOffset.y), 0, canvas.height - current.height);
    updateMeasureTooltip(current.width, current.height);
    drawScene();
  }
});

canvas.addEventListener('pointerup', (event) => {
  const pos = pointerPosition(event);

  if (mode === 'draw' && startPoint) {
    const endX = snap(pos.x);
    const endY = snap(pos.y);

    const x = Math.min(startPoint.x, endX);
    const y = Math.min(startPoint.y, endY);
    const width = Math.abs(endX - startPoint.x);
    const height = Math.abs(endY - startPoint.y);

    if (width > 20 && height > 20) {
      pushHistory();
      const bin = normalizeBin({
        id: crypto.randomUUID(),
        x,
        y,
        width,
        height,
        color: '#9bb7ff'
      });
      bins.push(bin);
      selectBin(bin);
      persistIfEnabled();
    } else {
      updateMeasureTooltip();
    }

    startPoint = null;
    drawScene();
  }

  dragOffset = null;
  canvas.releasePointerCapture(event.pointerId);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const current = bins.find((item) => item.id === selectedId);
  if (!current) return;

  pushHistory();
  current.name = fields.name.value;
  current.location = fields.location.value;
  current.section = fields.section.value;
  current.zone = fields.zone.value;
  current.notes = fields.notes.value;
  current.color = fields.color.value;
  current.locked = fields.locked.checked;

  drawScene();
  persistIfEnabled();
});

drawButton.addEventListener('click', () => setMode('draw'));
selectButton.addEventListener('click', () => setMode('select'));

duplicateButton.addEventListener('click', () => {
  const current = bins.find((item) => item.id === selectedId);
  if (!current) return;
  pushHistory();
  const clone = normalizeBin({
    ...current,
    id: crypto.randomUUID(),
    x: clamp(current.x + options.gridSize, 0, canvas.width - current.width),
    y: clamp(current.y + options.gridSize, 0, canvas.height - current.height),
    name: current.name ? `${current.name} (copie)` : ''
  });
  bins.push(clone);
  selectBin(clone);
  persistIfEnabled();
});

deleteButton.addEventListener('click', () => {
  if (!selectedId) return;
  pushHistory();
  bins = bins.filter((bin) => bin.id !== selectedId);
  selectBin(null);
  drawScene();
  persistIfEnabled();
});

clearButton.addEventListener('click', () => {
  if (!bins.length) return;
  pushHistory();
  bins = [];
  selectBin(null);
  drawScene();
  persistIfEnabled();
});

undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);

saveButton.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ bins, options }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'warehouse-plan.json';
  anchor.click();
  URL.revokeObjectURL(url);
});

loadButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    pushHistory();
    bins = Array.isArray(data.bins) ? data.bins.map(normalizeBin) : [];
    options = {
      ...options,
      ...(data.options || {})
    };
    if (!['ft-in', 'in'].includes(options.dimensionUnit)) options.dimensionUnit = 'ft-in';
    syncOptionsUI();
    selectBin(null);
    drawScene();
    persistIfEnabled();
  } catch (_) {
    alert('Fichier JSON invalide.');
  }

  fileInput.value = '';
});

exportButton.addEventListener('click', () => {
  const url = canvas.toDataURL('image/png');
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'warehouse-plan.png';
  anchor.click();
});

snapToggle.addEventListener('change', () => {
  options.snapToGrid = snapToggle.checked;
  persistIfEnabled();
});

gridToggle.addEventListener('change', () => {
  options.showGrid = gridToggle.checked;
  drawScene();
  persistIfEnabled();
});

labelsToggle.addEventListener('change', () => {
  options.showLabels = labelsToggle.checked;
  drawScene();
  persistIfEnabled();
});

autosaveToggle.addEventListener('change', () => {
  options.autoSave = autosaveToggle.checked;
  if (options.autoSave) persistIfEnabled();
});

gridSizeInput.addEventListener('change', () => {
  const next = clamp(Number(gridSizeInput.value) || 45, 10, 120);
  options.gridSize = next;
  gridSizeInput.value = String(next);
  drawScene();
  persistIfEnabled();
});

window.addEventListener('keydown', (event) => {
  const inInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
  if (inInput) return;

  if (event.key === 'Delete' || event.key === 'Backspace') {
    deleteButton.click();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    undo();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    redo();
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
    event.preventDefault();
    duplicateButton.click();
  }
});

measureHandle.addEventListener('pointerdown', (event) => {
  measureTooltip.setPointerCapture(event.pointerId);
  const rect = measureTooltip.getBoundingClientRect();
  tooltipDrag = {
    pointerId: event.pointerId,
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
  measureTooltip.classList.add('dragging');
});

measureHandle.addEventListener('pointermove', (event) => {
  if (!tooltipDrag || tooltipDrag.pointerId !== event.pointerId) {
    return;
  }

  setTooltipPosition(event.clientX - tooltipDrag.x, event.clientY - tooltipDrag.y);
});

measureHandle.addEventListener('pointerup', (event) => {
  if (tooltipDrag?.pointerId === event.pointerId) {
    measureTooltip.releasePointerCapture(event.pointerId);
    tooltipDrag = null;
    measureTooltip.classList.remove('dragging');
  }
});


measureUnitToggle.addEventListener('click', () => {
  options.dimensionUnit = options.dimensionUnit === 'ft-in' ? 'in' : 'ft-in';
  measureUnitToggle.textContent = options.dimensionUnit === 'in' ? '📏 po' : '📏 pi+po';
  const current = bins.find((item) => item.id === selectedId);
  if (current) {
    updateMeasureTooltip(current.width, current.height);
  }
  persistIfEnabled();
});

window.addEventListener('resize', () => {
  const rect = measureTooltip.getBoundingClientRect();
  setTooltipPosition(rect.left, rect.top);
});

restoreFromStorage();
syncOptionsUI();
updateMeasureTooltip();
drawScene();
