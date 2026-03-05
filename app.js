const canvas = document.getElementById('warehouse-canvas');
const ctx = canvas.getContext('2d');

const drawButton = document.getElementById('draw-mode');
const selectButton = document.getElementById('select-mode');
const deleteButton = document.getElementById('delete-bin');
const clearButton = document.getElementById('clear-all');
const saveButton = document.getElementById('save-plan');
const loadButton = document.getElementById('load-plan');
const exportButton = document.getElementById('export-image');
const fileInput = document.getElementById('file-input');

const form = document.getElementById('bin-form');
const emptyState = document.getElementById('empty-state');
const fields = {
  name: document.getElementById('bin-name'),
  location: document.getElementById('bin-location'),
  section: document.getElementById('bin-section'),
  zone: document.getElementById('bin-zone'),
  notes: document.getElementById('bin-notes')
};

let mode = 'draw';
let bins = [];
let selectedId = null;
let startPoint = null;
let dragOffset = null;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  bins.forEach((bin) => {
    const selected = bin.id === selectedId;
    ctx.fillStyle = selected ? '#5f8dff' : '#9bb7ff';
    ctx.strokeStyle = selected ? '#1f4ecf' : '#4a6ad3';
    ctx.lineWidth = selected ? 4 : 2;
    ctx.fillRect(bin.x, bin.y, bin.width, bin.height);
    ctx.strokeRect(bin.x, bin.y, bin.width, bin.height);

    ctx.fillStyle = '#0f1f43';
    ctx.font = '24px -apple-system, sans-serif';
    const title = bin.name?.trim() || 'Bin sans nom';
    ctx.fillText(title, bin.x + 10, bin.y + 30);

    ctx.fillStyle = '#233f8a';
    ctx.font = '18px -apple-system, sans-serif';
    ctx.fillText(`Zone: ${bin.zone || 'N/A'}`, bin.x + 10, bin.y + 56);
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
}

function selectBin(bin) {
  selectedId = bin ? bin.id : null;
  showForm(bin);
  drawScene();
}

canvas.addEventListener('pointerdown', (event) => {
  canvas.setPointerCapture(event.pointerId);
  const pos = pointerPosition(event);

  if (mode === 'draw') {
    startPoint = pos;
    return;
  }

  const hit = hitTest(pos.x, pos.y);
  selectBin(hit);

  if (hit) {
    dragOffset = {
      x: pos.x - hit.x,
      y: pos.y - hit.y
    };
  }
});

canvas.addEventListener('pointermove', (event) => {
  const pos = pointerPosition(event);

  if (mode === 'draw' && startPoint) {
    drawScene();
    const width = pos.x - startPoint.x;
    const height = pos.y - startPoint.y;

    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#244bc5';
    ctx.lineWidth = 3;
    ctx.strokeRect(startPoint.x, startPoint.y, width, height);
    ctx.setLineDash([]);
    return;
  }

  if (mode === 'select' && dragOffset && selectedId) {
    const current = bins.find((item) => item.id === selectedId);
    if (!current) return;

    current.x = clamp(pos.x - dragOffset.x, 0, canvas.width - current.width);
    current.y = clamp(pos.y - dragOffset.y, 0, canvas.height - current.height);
    drawScene();
  }
});

canvas.addEventListener('pointerup', (event) => {
  const pos = pointerPosition(event);

  if (mode === 'draw' && startPoint) {
    const x = Math.min(startPoint.x, pos.x);
    const y = Math.min(startPoint.y, pos.y);
    const width = Math.abs(pos.x - startPoint.x);
    const height = Math.abs(pos.y - startPoint.y);

    if (width > 20 && height > 20) {
      const bin = {
        id: crypto.randomUUID(),
        x,
        y,
        width,
        height,
        name: '',
        location: '',
        section: '',
        zone: '',
        notes: ''
      };
      bins.push(bin);
      selectBin(bin);
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

  current.name = fields.name.value;
  current.location = fields.location.value;
  current.section = fields.section.value;
  current.zone = fields.zone.value;
  current.notes = fields.notes.value;

  drawScene();
});

drawButton.addEventListener('click', () => setMode('draw'));
selectButton.addEventListener('click', () => setMode('select'));

deleteButton.addEventListener('click', () => {
  if (!selectedId) return;
  bins = bins.filter((bin) => bin.id !== selectedId);
  selectBin(null);
  drawScene();
});

clearButton.addEventListener('click', () => {
  bins = [];
  selectBin(null);
  drawScene();
});

saveButton.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ bins }, null, 2)], { type: 'application/json' });
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

  const text = await file.text();
  const data = JSON.parse(text);
  bins = Array.isArray(data.bins) ? data.bins : [];
  selectBin(null);
  drawScene();
  fileInput.value = '';
});

exportButton.addEventListener('click', () => {
  const url = canvas.toDataURL('image/png');
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'warehouse-plan.png';
  anchor.click();
});

drawScene();
