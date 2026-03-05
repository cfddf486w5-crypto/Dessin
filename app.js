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
const gridSizeMinusButton = document.getElementById('grid-size-minus');
const gridSizePlusButton = document.getElementById('grid-size-plus');
const zoomLevelInput = document.getElementById('zoom-level');
const zoomMinusButton = document.getElementById('zoom-minus');
const zoomPlusButton = document.getElementById('zoom-plus');
const rotateLeftButton = document.getElementById('rotate-left');
const rotateRightButton = document.getElementById('rotate-right');

const measureTooltip = document.getElementById('measure-tooltip');
const measureHandle = measureTooltip.querySelector('.tooltip-handle');
const lengthLabel = document.getElementById('measure-length');
const widthLabel = document.getElementById('measure-width');
const measureUnitToggle = document.getElementById('measure-unit-toggle');
const lengthMinusButton = document.getElementById('length-minus');
const lengthPlusButton = document.getElementById('length-plus');
const widthMinusButton = document.getElementById('width-minus');
const widthPlusButton = document.getElementById('width-plus');

const form = document.getElementById('bin-form');
const emptyState = document.getElementById('empty-state');
const qualityBadge = document.getElementById('quality-badge');
const totalBinsMetric = document.getElementById('metric-total-bins');
const usedAreaMetric = document.getElementById('metric-used-area');
const lockedBinsMetric = document.getElementById('metric-locked-bins');
const missingFieldsMetric = document.getElementById('metric-missing-fields');
const binSearchInput = document.getElementById('bin-search');
const focusMissingDataButton = document.getElementById('focus-missing-data');
const exportCsvButton = document.getElementById('export-csv');
const searchFeedback = document.getElementById('search-feedback');
const fields = {
  name: document.getElementById('bin-name'),
  location: document.getElementById('bin-location'),
  section: document.getElementById('bin-section'),
  zone: document.getElementById('bin-zone'),
  type: document.getElementById('bin-type'),
  notes: document.getElementById('bin-notes'),
  color: document.getElementById('bin-color'),
  rotation: document.getElementById('bin-rotation'),
  locked: document.getElementById('bin-locked')
};

const PIXELS_PER_INCH = 4;
const STORAGE_KEY = 'dessin-warehouse-plan-v2';
const ADVANCED_OPTIONS_KEY = 'dessin-advanced-options-v1';

const PRESET_BIN_OPTIONS = {
  presetBinP1: { width: 50 * PIXELS_PER_INCH, height: 50 * PIXELS_PER_INCH },
  presetBinP2: { width: 50 * PIXELS_PER_INCH, height: 100 * PIXELS_PER_INCH },
  presetBinP3: { width: 50 * PIXELS_PER_INCH, height: 150 * PIXELS_PER_INCH },
  presetBinP4: { width: 50 * PIXELS_PER_INCH, height: 200 * PIXELS_PER_INCH },
  presetBinP5: { width: 50 * PIXELS_PER_INCH, height: 250 * PIXELS_PER_INCH },
  presetBinP6: { width: 50 * PIXELS_PER_INCH, height: 300 * PIXELS_PER_INCH },
  presetBinP7: { width: 50 * PIXELS_PER_INCH, height: 350 * PIXELS_PER_INCH }
};

let mode = 'draw';
let bins = [];
let selectedId = null;
let startPoint = null;
let dragOffset = null;
let tooltipDrag = null;
let activePresetBin = null;

let options = {
  snapToGrid: true,
  showGrid: true,
  showLabels: true,
  autoSave: true,
  gridSize: 45,
  zoom: 1,
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
    type: ['zone', 'section', 'bin'].includes(raw.type) ? raw.type : 'bin',
    color: raw.color || '#9bb7ff',
    rotation: ((Number(raw.rotation) || 0) % 360 + 360) % 360,
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


function pointInsideRotatedBin(x, y, bin) {
  const angle = (bin.rotation || 0) * Math.PI / 180;
  const cx = bin.x + bin.width / 2;
  const cy = bin.y + bin.height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const rx = dx * cos - dy * sin + cx;
  const ry = dx * sin + dy * cos + cy;

  return rx >= bin.x && rx <= bin.x + bin.width && ry >= bin.y && ry <= bin.y + bin.height;
}

function drawRotatedBin(bin, selected) {
  const angle = (bin.rotation || 0) * Math.PI / 180;
  const cx = bin.x + bin.width / 2;
  const cy = bin.y + bin.height / 2;
  const binColor = bin.color || '#9bb7ff';
  const type = ['zone', 'section', 'bin'].includes(bin.type) ? bin.type : 'bin';
  const alphaByType = { zone: 0.12, section: 0.22, bin: 0.34 };

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = colorWithAlpha(binColor, alphaByType[type]);
  ctx.fillRect(-bin.width / 2, -bin.height / 2, bin.width, bin.height);

  ctx.strokeStyle = selected ? '#1f4ecf' : '#4a6ad3';
  ctx.lineWidth = selected ? 3 : 1.6;
  ctx.strokeRect(-bin.width / 2, -bin.height / 2, bin.width, bin.height);

  if (bin.locked) {
    ctx.fillStyle = '#0f1f43';
    ctx.font = '20px -apple-system, sans-serif';
    ctx.fillText('🔒', bin.width / 2 - 26, -bin.height / 2 + 24);
  }

  if (options.showLabels) {
    ctx.fillStyle = '#0f1f43';
    ctx.font = '24px -apple-system, sans-serif';
    const title = bin.name?.trim() || 'Bin sans nom';
    ctx.fillText(title, -bin.width / 2 + 10, -bin.height / 2 + 30);

    ctx.fillStyle = '#233f8a';
    ctx.font = '18px -apple-system, sans-serif';
    ctx.fillText(`Type: ${type}`, -bin.width / 2 + 10, -bin.height / 2 + 56);
    ctx.fillText(`Zone: ${bin.zone || 'N/A'}`, -bin.width / 2 + 10, -bin.height / 2 + 78);
    ctx.fillText(`Section: ${bin.section || 'N/A'}`, -bin.width / 2 + 10, -bin.height / 2 + 100);
  }

  ctx.restore();
}

function getMissingDataCount(bin) {
  const required = [bin.name, bin.location, bin.section, bin.zone];
  return required.filter((value) => !String(value || '').trim()).length;
}

function updateAnalytics() {
  const total = bins.length;
  const usedArea = bins.reduce((sum, bin) => sum + (bin.width * bin.height), 0);
  const boardArea = Math.max(canvas.width * canvas.height, 1);
  const usedPercent = Math.min(100, (usedArea / boardArea) * 100);
  const locked = bins.filter((bin) => bin.locked).length;
  const missing = bins.filter((bin) => getMissingDataCount(bin) > 0).length;

  const metadataScore = total === 0 ? 100 : Math.max(0, Math.round(((total - missing) / total) * 100));
  const occupancyScore = Math.max(0, Math.round(100 - Math.abs(usedPercent - 55) * 1.2));
  const mobilityScore = total === 0 ? 100 : Math.round(((total - locked) / total) * 100);
  const quality = Math.round((metadataScore * 0.5) + (occupancyScore * 0.3) + (mobilityScore * 0.2));

  totalBinsMetric.textContent = String(total);
  usedAreaMetric.textContent = `${usedPercent.toFixed(1)}%`;
  lockedBinsMetric.textContent = String(locked);
  missingFieldsMetric.textContent = String(missing);
  qualityBadge.textContent = `Score qualité: ${quality}/100`;
  qualityBadge.classList.toggle('quality-strong', quality >= 85);
  qualityBadge.classList.toggle('quality-medium', quality >= 60 && quality < 85);
  qualityBadge.classList.toggle('quality-risk', quality < 60);
}

function filterBins(term) {
  const query = term.trim().toLowerCase();
  if (!query) {
    searchFeedback.textContent = 'Prêt pour audit opérationnel.';
    return [];
  }

  const matches = bins.filter((bin) => [bin.name, bin.location, bin.section, bin.zone, bin.notes]
    .some((value) => String(value || '').toLowerCase().includes(query)));

  searchFeedback.textContent = matches.length
    ? `${matches.length} résultat(s) trouvé(s).`
    : 'Aucun résultat. Vérifie le nom, la zone ou la section.';

  return matches;
}

function exportOperationalCsv() {
  if (!bins.length) {
    alert('Aucun bin à exporter.');
    return;
  }

  const header = ['name', 'location', 'section', 'zone', 'type', 'width_in', 'height_in', 'rotation_deg', 'locked', 'notes'];
  const rows = bins.map((bin) => {
    const values = [
      bin.name,
      bin.location,
      bin.section,
      bin.zone,
      bin.type,
      Math.round(bin.width / PIXELS_PER_INCH),
      Math.round(bin.height / PIXELS_PER_INCH),
      Math.round(bin.rotation || 0),
      bin.locked ? 'yes' : 'no',
      (bin.notes || '').replaceAll('\n', ' ')
    ];
    return values.map((value) => `"${String(value || '').replaceAll('"', '""')}"`).join(',');
  });

  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'warehouse-operational-export.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}


function drawScene() {
  document.body.classList.toggle('hide-grid', !options.showGrid);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  bins.forEach((bin) => {
    const selected = bin.id === selectedId;
    drawRotatedBin(bin, selected);
  });
  updateAnalytics();
}

function setMode(nextMode) {
  mode = nextMode;
  drawButton.classList.toggle('active', mode === 'draw');
  selectButton.classList.toggle('active', mode === 'select');
}

function hitTest(x, y) {
  for (let i = bins.length - 1; i >= 0; i -= 1) {
    const bin = bins[i];
    if (pointInsideRotatedBin(x, y, bin)) {
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
  fields.type.value = ['zone', 'section', 'bin'].includes(bin.type) ? bin.type : 'bin';
  fields.notes.value = bin.notes || '';
  fields.color.value = bin.color || '#9bb7ff';
  fields.rotation.value = String(Math.round(bin.rotation || 0));
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


function inferTypeFromFields() {
  const typeText = [fields.type.value, fields.zone.value, fields.section.value, fields.name.value]
    .join(' ')
    .toLowerCase();
  if (typeText.includes('zone')) return 'zone';
  if (typeText.includes('section')) return 'section';
  if (typeText.includes('bin')) return 'bin';
  return fields.type.value || 'bin';
}

function syncOptionsUI() {
  snapToggle.checked = options.snapToGrid;
  gridToggle.checked = options.showGrid;
  labelsToggle.checked = options.showLabels;
  autosaveToggle.checked = options.autoSave;
  gridSizeInput.value = String(options.gridSize);
  zoomLevelInput.value = String(Math.round((options.zoom || 1) * 100));
  measureUnitToggle.textContent = options.dimensionUnit === 'in' ? '📏 po' : '📏 pi+po';
}

function applyZoom() {
  const scale = clamp(options.zoom || 1, 0.5, 2);
  options.zoom = scale;
  canvas.style.width = `${scale * 100}%`;
}

function adjustGridSize(delta) {
  const next = clamp((Number(gridSizeInput.value) || options.gridSize) + delta, 10, 120);
  options.gridSize = next;
  gridSizeInput.value = String(next);
  drawScene();
  persistIfEnabled();
}

function adjustZoom(deltaPercent) {
  const currentPercent = Number(zoomLevelInput.value) || Math.round((options.zoom || 1) * 100);
  const nextPercent = clamp(currentPercent + deltaPercent, 50, 200);
  options.zoom = nextPercent / 100;
  zoomLevelInput.value = String(nextPercent);
  applyZoom();
  persistIfEnabled();
}

function adjustSelectedDimension(dimension, deltaCells) {
  const current = bins.find((item) => item.id === selectedId);
  if (!current || current.locked) return;

  pushHistory();
  const delta = Math.max(5, options.gridSize / 2) * deltaCells;
  const key = dimension === 'width' ? 'width' : 'height';
  const limit = key === 'width' ? canvas.width : canvas.height;
  const position = key === 'width' ? current.x : current.y;
  current[key] = clamp(current[key] + delta, 20, limit - position);
  updateMeasureTooltip(current.width, current.height);
  drawScene();
  persistIfEnabled();
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

    const shouldCreateCustom = width > 20 && height > 20;
    const shouldCreatePreset = Boolean(activePresetBin);

    if (shouldCreateCustom || shouldCreatePreset) {
      pushHistory();
      const binWidth = shouldCreatePreset ? activePresetBin.width : width;
      const binHeight = shouldCreatePreset ? activePresetBin.height : height;
      const bin = normalizeBin({
        id: crypto.randomUUID(),
        x: clamp(x, 0, canvas.width - binWidth),
        y: clamp(y, 0, canvas.height - binHeight),
        width: binWidth,
        height: binHeight,
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
  current.type = inferTypeFromFields();
  fields.type.value = current.type;
  current.color = fields.color.value;
  current.rotation = ((Number(fields.rotation.value) || 0) % 360 + 360) % 360;
  fields.rotation.value = String(Math.round(current.rotation));
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


binSearchInput?.addEventListener('input', () => {
  const matches = filterBins(binSearchInput.value);
  if (matches.length) {
    selectBin(matches[0]);
  }
});

focusMissingDataButton?.addEventListener('click', () => {
  const firstMissing = bins.find((bin) => getMissingDataCount(bin) > 0);
  if (!firstMissing) {
    searchFeedback.textContent = 'Excellence: tous les bins ont des données complètes.';
    return;
  }

  selectBin(firstMissing);
  searchFeedback.textContent = `Bin à compléter sélectionné: ${firstMissing.name || firstMissing.id.slice(0, 8)}.`;
});

exportCsvButton?.addEventListener('click', exportOperationalCsv);

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

gridSizeMinusButton.addEventListener('click', () => adjustGridSize(-5));
gridSizePlusButton.addEventListener('click', () => adjustGridSize(5));

zoomLevelInput.addEventListener('change', () => {
  const next = clamp(Number(zoomLevelInput.value) || 100, 50, 200);
  options.zoom = next / 100;
  zoomLevelInput.value = String(next);
  applyZoom();
  persistIfEnabled();
});

zoomMinusButton.addEventListener('click', () => adjustZoom(-10));
zoomPlusButton.addEventListener('click', () => adjustZoom(10));

function rotateSelected(delta) {
  const current = bins.find((item) => item.id === selectedId);
  if (!current || current.locked) return;
  pushHistory();
  current.rotation = ((current.rotation || 0) + delta + 360) % 360;
  fields.rotation.value = String(Math.round(current.rotation));
  drawScene();
  persistIfEnabled();
}

rotateLeftButton?.addEventListener('click', () => rotateSelected(-15));
rotateRightButton?.addEventListener('click', () => rotateSelected(15));
fields.rotation?.addEventListener('change', () => {
  const current = bins.find((item) => item.id === selectedId);
  if (!current || current.locked) return;
  pushHistory();
  current.rotation = ((Number(fields.rotation.value) || 0) % 360 + 360) % 360;
  fields.rotation.value = String(Math.round(current.rotation));
  drawScene();
  persistIfEnabled();
});

lengthMinusButton.addEventListener('click', () => adjustSelectedDimension('height', -1));
lengthPlusButton.addEventListener('click', () => adjustSelectedDimension('height', 1));
widthMinusButton.addEventListener('click', () => adjustSelectedDimension('width', -1));
widthPlusButton.addEventListener('click', () => adjustSelectedDimension('width', 1));

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


function getActivePresetBin(layout = {}) {
  for (const [key, size] of Object.entries(PRESET_BIN_OPTIONS)) {
    if (layout?.[key] === true) return size;
  }
  return null;
}

function restoreAdvancedOptions() {
  try {
    const saved = localStorage.getItem(ADVANCED_OPTIONS_KEY);
    if (!saved) return;
    const parsed = JSON.parse(saved);

    const nightMode = parsed.ui?.ui_01 === true && parsed.ui?.ui_02 !== true;
    document.body.classList.toggle('theme-night', nightMode);

    if (parsed.ui?.ui_09 === true) {
      document.documentElement.style.setProperty('--btn-radius', '18px');
    } else if (parsed.ui?.ui_10 === true) {
      document.documentElement.style.setProperty('--btn-radius', '4px');
    }

    if (parsed.ui?.ui_15 === true) {
      document.documentElement.style.setProperty('--toolbar-gap', '6px');
    } else if (parsed.ui?.ui_16 === true) {
      document.documentElement.style.setProperty('--toolbar-gap', '12px');
    }

    if (parsed.layout?.boardOneKilometer === true) {
      canvas.width = 3000;
      canvas.height = 3000;
    } else {
      canvas.width = 2200;
      canvas.height = 2200;
    }

    activePresetBin = getActivePresetBin(parsed.layout);
  } catch (_) {
    // ignore
  }
}

restoreAdvancedOptions();
restoreFromStorage();
syncOptionsUI();
applyZoom();
updateMeasureTooltip();
drawScene();
