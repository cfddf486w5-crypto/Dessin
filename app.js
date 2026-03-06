const canvas = document.getElementById('warehouse-canvas');
const ctx = canvas.getContext('2d');

const drawButton = document.getElementById('draw-mode');
const selectButton = document.getElementById('select-mode');
const loadReferenceMapButton = document.getElementById('load-reference-map');
const importReferenceImageButton = document.getElementById('import-reference-image');
const duplicateButton = document.getElementById('duplicate-bin');
const deleteButton = document.getElementById('delete-bin');
const clearButton = document.getElementById('clear-all');
const undoButton = document.getElementById('undo-action');
const redoButton = document.getElementById('redo-action');
const saveButton = document.getElementById('save-plan');
const loadButton = document.getElementById('load-plan');
const exportButton = document.getElementById('export-image');
const fileInput = document.getElementById('file-input');
const referenceImageInput = document.getElementById('reference-image-input');

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
const overlayOpacityInput = document.getElementById('overlay-opacity');
const overlayCellPixelsInput = document.getElementById('overlay-cell-pixels');
const overlayOpacityMinusButton = document.getElementById('overlay-opacity-minus');
const overlayOpacityPlusButton = document.getElementById('overlay-opacity-plus');
const overlayToggle = document.getElementById('overlay-toggle');
const syncOverlayGridButton = document.getElementById('sync-overlay-grid');
const overlayLeftButton = document.getElementById('overlay-left');
const overlayRightButton = document.getElementById('overlay-right');
const overlayUpButton = document.getElementById('overlay-up');
const overlayDownButton = document.getElementById('overlay-down');
const clearReferenceImageButton = document.getElementById('clear-reference-image');

const boardWrap = document.querySelector('.board-wrap');
const panHorizontalHandle = document.getElementById('pan-horizontal-handle');
const panVerticalHandle = document.getElementById('pan-vertical-handle');

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
const view3dLink = document.querySelector('a[href="view3d.html"]');
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
const SMALL_GRID_CELL_INCHES = 1;
const BIG_GRID_CELL_INCHES = 50;
const MASTER_GRID_DIVISIONS = BIG_GRID_CELL_INCHES / SMALL_GRID_CELL_INCHES;
const MASTER_SQUARE_INCHES = BIG_GRID_CELL_INCHES;
const MASTER_SQUARE_PIXELS = MASTER_SQUARE_INCHES * PIXELS_PER_INCH;
const STORAGE_KEY = 'dessin-warehouse-plan-v2';
const ADVANCED_OPTIONS_KEY = 'dessin-advanced-options-v1';
const VIEW3D_CONTEXT_KEY = 'dessin-view3d-context-v1';

const PRESET_BIN_OPTIONS = {
  presetBinP1: { width: BIG_GRID_CELL_INCHES * PIXELS_PER_INCH, height: BIG_GRID_CELL_INCHES * PIXELS_PER_INCH },
  presetBinP2: { width: BIG_GRID_CELL_INCHES * PIXELS_PER_INCH, height: 100 * PIXELS_PER_INCH },
  presetBinP3: { width: BIG_GRID_CELL_INCHES * PIXELS_PER_INCH, height: 150 * PIXELS_PER_INCH },
  presetBinP4: { width: BIG_GRID_CELL_INCHES * PIXELS_PER_INCH, height: 200 * PIXELS_PER_INCH },
  presetBinP5: { width: BIG_GRID_CELL_INCHES * PIXELS_PER_INCH, height: 250 * PIXELS_PER_INCH },
  presetBinP6: { width: BIG_GRID_CELL_INCHES * PIXELS_PER_INCH, height: 300 * PIXELS_PER_INCH },
  presetBinP7: { width: BIG_GRID_CELL_INCHES * PIXELS_PER_INCH, height: 350 * PIXELS_PER_INCH }
};

let mode = 'draw';
let bins = [];
let selectedId = null;
let startPoint = null;
let dragOffset = null;
let tooltipDrag = null;
let planPanDrag = null;
let activePresetBin = null;

let options = {
  snapToGrid: true,
  showGrid: true,
  showLabels: true,
  autoSave: true,
  gridSize: MASTER_SQUARE_PIXELS,
  zoom: 1,
  dimensionUnit: 'ft-in',
  overlayOpacity: 40,
  showOverlay: true,
  overlayCellPixels: 50
};

let referenceImageState = {
  src: null,
  element: null,
  width: 0,
  height: 0,
  baseRatio: 1,
  offsetX: 0,
  offsetY: 0
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
  const divisionSize = Math.max(1, options.gridSize / MASTER_GRID_DIVISIONS);
  return Math.round(value / divisionSize) * divisionSize;
}

function drawGrid() {
  if (!options.showGrid) return;

  ctx.save();
  const masterSize = Math.max(1, options.gridSize);
  const divisionSize = Math.max(1, masterSize / MASTER_GRID_DIVISIONS);
  const crispOffset = 0.5;
  const axisLimit = {
    x: canvas.width,
    y: canvas.height
  };

  const drawAxisLines = (axis, step, color, lineWidth, skipMajor) => {
    const limit = axisLimit[axis];
    for (let position = 0; position <= limit; position += step) {
      if (skipMajor) {
        const majorRatio = position / masterSize;
        if (Math.abs(Math.round(majorRatio) - majorRatio) < 1e-6) {
          continue;
        }
      }

      const p = position + crispOffset;
      ctx.beginPath();
      if (axis === 'x') {
        ctx.moveTo(p, 0);
        ctx.lineTo(p, canvas.height);
      } else {
        ctx.moveTo(0, p);
        ctx.lineTo(canvas.width, p);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  };

  drawAxisLines('x', divisionSize, '#ecf1ff', 1, true);
  drawAxisLines('y', divisionSize, '#ecf1ff', 1, true);
  drawAxisLines('x', masterSize, '#d5dff7', 1.2, false);
  drawAxisLines('y', masterSize, '#d5dff7', 1.2, false);

  ctx.restore();
}

function drawRoundedRectPath(context, x, y, width, height, radius) {
  const safeRadius = Math.max(0, Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2));
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function drawReferenceImage() {
  if (!options.showOverlay || !referenceImageState.element) return;

  const cellPixels = Math.max(1, Number(options.overlayCellPixels) || 50);
  const gridSyncRatio = options.gridSize / cellPixels;
  const ratio = referenceImageState.baseRatio * gridSyncRatio;
  const drawWidth = referenceImageState.width * ratio;
  const drawHeight = referenceImageState.height * ratio;
  const offsetX = referenceImageState.offsetX;
  const offsetY = referenceImageState.offsetY;

  ctx.save();
  ctx.globalAlpha = clamp((options.overlayOpacity || 40) / 100, 0.05, 1);
  ctx.drawImage(referenceImageState.element, offsetX, offsetY, drawWidth, drawHeight);
  ctx.restore();
}

function restoreReferenceImage(source, transform = null) {
  if (!source) {
    referenceImageState = { src: null, element: null, width: 0, height: 0, baseRatio: 1, offsetX: 0, offsetY: 0 };
    return;
  }

  const image = new Image();
  image.addEventListener('load', () => {
    const fitRatio = Math.min(
      canvas.width / Math.max(image.naturalWidth, 1),
      canvas.height / Math.max(image.naturalHeight, 1)
    );
    const fittedWidth = image.naturalWidth * fitRatio;
    const fittedHeight = image.naturalHeight * fitRatio;

    referenceImageState = {
      src: source,
      element: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      baseRatio: Number.isFinite(Number(transform?.baseRatio)) ? Number(transform.baseRatio) : fitRatio,
      offsetX: Number.isFinite(Number(transform?.offsetX)) ? Number(transform.offsetX) : ((canvas.width - fittedWidth) / 2),
      offsetY: Number.isFinite(Number(transform?.offsetY)) ? Number(transform.offsetY) : ((canvas.height - fittedHeight) / 2)
    };
    drawScene();
    persistIfEnabled();
  });
  image.src = source;
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
  const cornerRadius = Math.max(6, Math.min(bin.width, bin.height) * 0.08);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  ctx.fillStyle = colorWithAlpha(binColor, alphaByType[type]);
  drawRoundedRectPath(ctx, -bin.width / 2, -bin.height / 2, bin.width, bin.height, cornerRadius);
  ctx.fill();

  ctx.strokeStyle = selected ? '#1f4ecf' : '#4a6ad3';
  ctx.lineWidth = selected ? 3 : 1.6;
  drawRoundedRectPath(ctx, -bin.width / 2, -bin.height / 2, bin.width, bin.height, cornerRadius);
  ctx.stroke();

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

function createTemplateBin({ x, y, width, height, name, zone, section, location, type = 'bin', rotation = 0, color = '#b4bf87' }) {
  return normalizeBin({
    id: crypto.randomUUID(),
    x,
    y,
    width,
    height,
    name,
    zone,
    section,
    location,
    type,
    rotation,
    color,
    notes: 'Map de référence importée'
  });
}

function createRackColumns({
  startX,
  startY,
  columns,
  rows,
  cellWidth,
  cellHeight,
  gapX,
  gapY,
  prefix,
  zone,
  section,
  angle = 0,
  startIndex = 1
}) {
  const generated = [];
  let index = startIndex;

  for (let col = 0; col < columns; col += 1) {
    for (let row = 0; row < rows; row += 1) {
      generated.push(createTemplateBin({
        x: startX + col * (cellWidth + gapX),
        y: startY + row * (cellHeight + gapY),
        width: cellWidth,
        height: cellHeight,
        name: `${prefix}${String(index).padStart(2, '0')}`,
        zone,
        section,
        location: `${section} / R${col + 1} / C${row + 1}`,
        rotation: angle
      }));
      index += 1;
    }
  }

  return generated;
}

function buildReferenceMapTemplate() {
  const templateBins = [];

  templateBins.push(createTemplateBin({
    x: 420,
    y: 80,
    width: 1100,
    height: 220,
    name: 'L2A',
    zone: 'Picking',
    section: 'L2A',
    location: 'Bandeau haut',
    type: 'section',
    color: '#98b58a'
  }));

  templateBins.push(...createRackColumns({
    startX: 450,
    startY: 340,
    columns: 8,
    rows: 12,
    cellWidth: 36,
    cellHeight: 34,
    gapX: 9,
    gapY: 8,
    prefix: 'L3A-',
    zone: 'L3',
    section: 'L3A'
  }));

  templateBins.push(...createRackColumns({
    startX: 920,
    startY: 340,
    columns: 8,
    rows: 10,
    cellWidth: 36,
    cellHeight: 34,
    gapX: 9,
    gapY: 8,
    prefix: 'L3B-',
    zone: 'L3',
    section: 'L3B'
  }));

  templateBins.push(...createRackColumns({
    startX: 1330,
    startY: 340,
    columns: 8,
    rows: 9,
    cellWidth: 36,
    cellHeight: 34,
    gapX: 9,
    gapY: 8,
    prefix: 'L3C-',
    zone: 'L3',
    section: 'L3C'
  }));

  templateBins.push(...createRackColumns({
    startX: 980,
    startY: 2060,
    columns: 4,
    rows: 12,
    cellWidth: 44,
    cellHeight: 34,
    gapX: 10,
    gapY: 8,
    prefix: 'L5A-',
    zone: 'L5',
    section: 'L5A',
    angle: -20
  }));

  templateBins.push(...createRackColumns({
    startX: 1360,
    startY: 1980,
    columns: 4,
    rows: 12,
    cellWidth: 44,
    cellHeight: 34,
    gapX: 10,
    gapY: 8,
    prefix: 'L5B-',
    zone: 'L5',
    section: 'L5B',
    angle: -20
  }));

  templateBins.push(...createRackColumns({
    startX: 1690,
    startY: 1840,
    columns: 4,
    rows: 8,
    cellWidth: 44,
    cellHeight: 34,
    gapX: 10,
    gapY: 8,
    prefix: 'L5C-',
    zone: 'L5',
    section: 'L5C',
    angle: -20
  }));

  templateBins.push(createTemplateBin({
    x: 760,
    y: 1950,
    width: 180,
    height: 130,
    name: 'Cafétéria',
    zone: 'Services',
    section: 'Common',
    location: 'Bas gauche',
    type: 'zone',
    color: '#c6d5ac'
  }));

  templateBins.push(createTemplateBin({
    x: 730,
    y: 420,
    width: 140,
    height: 76,
    name: 'Toilettes',
    zone: 'Services',
    section: 'L3A',
    location: 'Entre L2A et L3A',
    type: 'zone',
    color: '#c6d5ac'
  }));

  return templateBins;
}


function drawScene() {
  document.body.classList.toggle('hide-grid', !options.showGrid);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawReferenceImage();
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

  persist3dContext();
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

function persist3dContext() {
  const selectedBin = bins.find((item) => item.id === selectedId) || null;
  const fallbackZone = bins.find((item) => item.type === 'zone') || null;
  const focusBin = selectedBin || fallbackZone;
  localStorage.setItem(VIEW3D_CONTEXT_KEY, JSON.stringify({
    selectedId: focusBin?.id || null,
    savedAt: Date.now()
  }));
}

function persistIfEnabled() {
  if (!options.autoSave) return;
  const payload = {
    bins,
    options,
    referenceImage: referenceImageState.src,
    referenceImageTransform: {
      baseRatio: referenceImageState.baseRatio,
      offsetX: referenceImageState.offsetX,
      offsetY: referenceImageState.offsetY
    }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  persist3dContext();
}

function enforceGridScale() {
  options.gridSize = MASTER_SQUARE_PIXELS;
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
    const transform = parsed.referenceImageTransform || null;
    restoreReferenceImage(parsed.referenceImage || null, transform);
    if (!['ft-in', 'in'].includes(options.dimensionUnit)) options.dimensionUnit = 'ft-in';
    options.overlayOpacity = clamp(Number(options.overlayOpacity) || 40, 5, 100);
    options.overlayCellPixels = clamp(Number(options.overlayCellPixels) || 50, 5, 500);
    options.showOverlay = options.showOverlay !== false;
    enforceGridScale();
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
  gridSizeInput.disabled = true;
  gridSizeMinusButton.disabled = true;
  gridSizePlusButton.disabled = true;
  zoomLevelInput.value = String(Math.round((options.zoom || 1) * 100));
  overlayOpacityInput.value = String(clamp(Number(options.overlayOpacity) || 40, 5, 100));
  overlayCellPixelsInput.value = String(clamp(Number(options.overlayCellPixels) || 50, 5, 500));
  overlayToggle.checked = options.showOverlay !== false;
  measureUnitToggle.textContent = options.dimensionUnit === 'in' ? '📏 po' : '📏 pi+po';
}

function adjustOverlayOpacity(delta) {
  const next = clamp((Number(overlayOpacityInput.value) || options.overlayOpacity || 40) + delta, 5, 100);
  options.overlayOpacity = next;
  overlayOpacityInput.value = String(next);
  drawScene();
  persistIfEnabled();
}

function syncOverlayToGrid() {
  if (!referenceImageState.element) return;
  const cellPixels = clamp(Number(overlayCellPixelsInput.value) || 50, 5, 500);
  options.overlayCellPixels = cellPixels;
  overlayCellPixelsInput.value = String(cellPixels);
  referenceImageState.offsetX = snap(referenceImageState.offsetX);
  referenceImageState.offsetY = snap(referenceImageState.offsetY);
  drawScene();
  persistIfEnabled();
}

function moveOverlayByGrid(deltaX, deltaY) {
  if (!referenceImageState.element) return;
  referenceImageState.offsetX = snap(referenceImageState.offsetX + (deltaX * options.gridSize));
  referenceImageState.offsetY = snap(referenceImageState.offsetY + (deltaY * options.gridSize));
  drawScene();
  persistIfEnabled();
}

function applyZoom() {
  const scale = clamp(options.zoom || 1, 0.5, 2);
  options.zoom = scale;
  canvas.style.width = `${scale * 100}%`;
  updatePlanPanHandles();
}

function updatePlanPanHandles() {
  if (!boardWrap || !panHorizontalHandle || !panVerticalHandle) return;

  const horizontalRange = Math.max(0, boardWrap.clientWidth - panHorizontalHandle.offsetWidth - 20);
  const verticalRange = Math.max(0, boardWrap.clientHeight - panVerticalHandle.offsetHeight - 20);

  const maxScrollLeft = Math.max(1, boardWrap.scrollWidth - boardWrap.clientWidth);
  const maxScrollTop = Math.max(1, boardWrap.scrollHeight - boardWrap.clientHeight);

  const xRatio = boardWrap.scrollLeft / maxScrollLeft;
  const yRatio = boardWrap.scrollTop / maxScrollTop;

  panHorizontalHandle.style.left = `${10 + (horizontalRange * xRatio)}px`;
  panHorizontalHandle.style.transform = 'none';

  panVerticalHandle.style.top = `${10 + (verticalRange * yRatio)}px`;
  panVerticalHandle.style.transform = 'none';
}

function attachPlanPanHandle(handle, axis) {
  if (!handle || !boardWrap) return;

  handle.addEventListener('pointerdown', (event) => {
    handle.setPointerCapture(event.pointerId);
    planPanDrag = {
      pointerId: event.pointerId,
      axis,
      startCoord: axis === 'x' ? event.clientX : event.clientY,
      startScroll: axis === 'x' ? boardWrap.scrollLeft : boardWrap.scrollTop,
      handle
    };
    handle.classList.add('dragging');
  });

  handle.addEventListener('pointermove', (event) => {
    if (!planPanDrag || planPanDrag.pointerId !== event.pointerId || planPanDrag.axis !== axis) return;

    const currentCoord = axis === 'x' ? event.clientX : event.clientY;
    const delta = currentCoord - planPanDrag.startCoord;
    if (axis === 'x') {
      boardWrap.scrollLeft = planPanDrag.startScroll + (delta * 2);
    } else {
      boardWrap.scrollTop = planPanDrag.startScroll + (delta * 2);
    }
    updatePlanPanHandles();
  });

  const stopDrag = (event) => {
    if (!planPanDrag || planPanDrag.pointerId !== event.pointerId) return;
    handle.releasePointerCapture(event.pointerId);
    handle.classList.remove('dragging');
    planPanDrag = null;
    updatePlanPanHandles();
  };

  handle.addEventListener('pointerup', stopDrag);
  handle.addEventListener('pointercancel', stopDrag);
}

function adjustGridSize() {
  options.gridSize = MASTER_SQUARE_PIXELS;
  gridSizeInput.value = String(options.gridSize);
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

function adjustSelectedDimension(dimension, deltaInches) {
  const current = bins.find((item) => item.id === selectedId);
  if (!current || current.locked) return;

  pushHistory();
  const delta = PIXELS_PER_INCH * deltaInches;
  const key = dimension === 'width' ? 'width' : 'height';
  const limit = key === 'width' ? canvas.width : canvas.height;
  const position = key === 'width' ? current.x : current.y;
  current[key] = clamp(current[key] + delta, PIXELS_PER_INCH, limit - position);
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
    drawRoundedRectPath(ctx, startPoint.x, startPoint.y, width, height, 10);
    ctx.stroke();
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

loadReferenceMapButton?.addEventListener('click', () => {
  const shouldReplace = confirm('Remplacer le plan actuel par la map modèle ? (Annuler = ajouter au plan existant)');
  pushHistory();
  const template = buildReferenceMapTemplate();
  bins = shouldReplace ? template : [...bins, ...template];
  options.showLabels = true;
  options.snapToGrid = true;
  syncOptionsUI();
  selectBin(null);
  drawScene();
  persistIfEnabled();
});

importReferenceImageButton?.addEventListener('click', () => referenceImageInput?.click());

clearReferenceImageButton?.addEventListener('click', () => {
  if (!referenceImageState.src) return;
  restoreReferenceImage(null);
  drawScene();
  persistIfEnabled();
});

undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);

saveButton.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({
    bins,
    options,
    referenceImage: referenceImageState.src,
    referenceImageTransform: {
      baseRatio: referenceImageState.baseRatio,
      offsetX: referenceImageState.offsetX,
      offsetY: referenceImageState.offsetY
    }
  }, null, 2)], { type: 'application/json' });
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
    const transform = data.referenceImageTransform || null;
    restoreReferenceImage(data.referenceImage || null, transform);
    if (!['ft-in', 'in'].includes(options.dimensionUnit)) options.dimensionUnit = 'ft-in';
    options.overlayOpacity = clamp(Number(options.overlayOpacity) || 40, 5, 100);
    options.overlayCellPixels = clamp(Number(options.overlayCellPixels) || 50, 5, 500);
    options.showOverlay = data.options?.showOverlay !== false;
    enforceGridScale();
    syncOptionsUI();
    selectBin(null);
    drawScene();
    persistIfEnabled();
  } catch (_) {
    alert('Fichier JSON invalide.');
  }

  fileInput.value = '';
});

referenceImageInput?.addEventListener('change', () => {
  const file = referenceImageInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener('load', () => {
    if (typeof reader.result !== 'string') return;
    restoreReferenceImage(reader.result);
  });
  reader.readAsDataURL(file);

  referenceImageInput.value = '';
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

gridSizeInput.addEventListener('change', adjustGridSize);

gridSizeMinusButton.addEventListener('click', adjustGridSize);
gridSizePlusButton.addEventListener('click', adjustGridSize);

zoomLevelInput.addEventListener('change', () => {
  const next = clamp(Number(zoomLevelInput.value) || 100, 50, 200);
  options.zoom = next / 100;
  zoomLevelInput.value = String(next);
  applyZoom();
  persistIfEnabled();
});

zoomMinusButton.addEventListener('click', () => adjustZoom(-10));
zoomPlusButton.addEventListener('click', () => adjustZoom(10));
overlayOpacityMinusButton?.addEventListener('click', () => adjustOverlayOpacity(-5));
overlayOpacityPlusButton?.addEventListener('click', () => adjustOverlayOpacity(5));
overlayOpacityInput?.addEventListener('change', () => {
  options.overlayOpacity = clamp(Number(overlayOpacityInput.value) || 40, 5, 100);
  overlayOpacityInput.value = String(options.overlayOpacity);
  drawScene();
  persistIfEnabled();
});
overlayToggle?.addEventListener('change', () => {
  options.showOverlay = overlayToggle.checked;
  drawScene();
  persistIfEnabled();
});
overlayCellPixelsInput?.addEventListener('change', syncOverlayToGrid);
syncOverlayGridButton?.addEventListener('click', syncOverlayToGrid);
overlayLeftButton?.addEventListener('click', () => moveOverlayByGrid(-1, 0));
overlayRightButton?.addEventListener('click', () => moveOverlayByGrid(1, 0));
overlayUpButton?.addEventListener('click', () => moveOverlayByGrid(0, -1));
overlayDownButton?.addEventListener('click', () => moveOverlayByGrid(0, 1));

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
fields.color?.addEventListener('change', () => {
  const current = bins.find((item) => item.id === selectedId);
  if (!current || current.locked) return;
  if (current.color === fields.color.value) return;
  pushHistory();
  current.color = fields.color.value;
  drawScene();
  persistIfEnabled();
});
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

  if (event.key === '=' || event.key === '+' || event.code === 'NumpadEqual' || event.code === 'NumpadAdd') {
    event.preventDefault();
    binSearchInput?.focus();
    binSearchInput?.select();
    searchFeedback.textContent = 'Identification manuelle: entrez un nom, zone, section ou location.';
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
  updatePlanPanHandles();
});

attachPlanPanHandle(panHorizontalHandle, 'x');
attachPlanPanHandle(panVerticalHandle, 'y');
boardWrap?.addEventListener('scroll', updatePlanPanHandles);


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
enforceGridScale();
syncOptionsUI();
applyZoom();
updateMeasureTooltip();
drawScene();
updatePlanPanHandles();

if (view3dLink) {
  view3dLink.addEventListener('click', () => {
    persist3dContext();
    persistIfEnabled();
  });
}
