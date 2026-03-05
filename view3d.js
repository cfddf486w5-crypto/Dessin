const widthInput = document.getElementById('rack-width');
const depthInput = document.getElementById('rack-depth');
const heightInput = document.getElementById('rack-height');
const sectionsInput = document.getElementById('rack-sections');
const beamHeightsInput = document.getElementById('beam-heights');
const renderButton = document.getElementById('render-rack');
const scene = document.getElementById('rack-scene');
const tableBody = document.getElementById('alveole-table-body');
const focusLabel = document.getElementById('focus-zone-label');
const barHeightPopup = document.getElementById('bar-height-popup');
const barHeightMinusButton = document.getElementById('bar-height-minus');
const barHeightPlusButton = document.getElementById('bar-height-plus');
const barHeightConfirmButton = document.getElementById('bar-height-confirm');

const PIXELS_PER_INCH = 4;
const STORAGE_KEY = 'dessin-warehouse-plan-v2';
const VIEW3D_CONTEXT_KEY = 'dessin-view3d-context-v1';

const state = {
  unit: 'ft-in',
  levelConfigs: [],
  pendingNewBeam: null
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function inchesToMeters(inches) {
  return inches * 0.0254;
}

function metersToInches(meters) {
  return meters / 0.0254;
}

function formatImperialFromMeters(valueMeters) {
  const inches = Math.max(0, Math.round(metersToInches(valueMeters)));
  if (state.unit === 'in') {
    return `${inches}"`;
  }

  const feet = Math.floor(inches / 12);
  const remInches = inches % 12;
  return `${feet}' ${remInches}"`;
}

function formatDimension(valueMeters) {
  return formatImperialFromMeters(valueMeters);
}

function parseBeamHeights() {
  return beamHeightsInput.value
    .split(',')
    .map((value) => Number.parseFloat(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0.05);
}

function levelLetter(index) {
  return String.fromCharCode(65 + index);
}

function createSupport(className) {
  const support = document.createElement('div');
  support.className = `rack-support ${className}`;
  return support;
}

function hideBarHeightPopup() {
  if (!barHeightPopup) return;
  barHeightPopup.hidden = true;
  state.pendingNewBeam = null;
}

function setBarPopupPosition(x, y) {
  if (!barHeightPopup) return;
  const maxX = window.innerWidth - barHeightPopup.offsetWidth - 8;
  const maxY = window.innerHeight - barHeightPopup.offsetHeight - 8;
  barHeightPopup.style.left = `${clamp(x, 8, maxX)}px`;
  barHeightPopup.style.top = `${clamp(y, 8, maxY)}px`;
}

function openBarHeightPopup(event, rackHeightMax) {
  if (!barHeightPopup) return;
  state.pendingNewBeam = {
    height: clamp(rackHeightMax / 2, 0.2, Math.max(0.2, rackHeightMax - 0.2)),
    rackHeightMax
  };
  barHeightPopup.hidden = false;
  setBarPopupPosition(event.clientX - (barHeightPopup.offsetWidth / 2), event.clientY - barHeightPopup.offsetHeight - 10);
}

function hydrateFromPlanSelection() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const ctx = JSON.parse(localStorage.getItem(VIEW3D_CONTEXT_KEY) || '{}');
    const bins = Array.isArray(saved.bins) ? saved.bins : [];
    state.unit = ['ft-in', 'in'].includes(saved?.options?.dimensionUnit) ? saved.options.dimensionUnit : 'ft-in';

    const fallbackBin = bins.find((bin) => bin.type === 'zone') || bins[0];
    const selected = bins.find((bin) => bin.id === ctx.selectedId) || fallbackBin;

    if (selected) {
      const lengthIn = Math.max(selected.width, selected.height) / PIXELS_PER_INCH;
      const widthIn = Math.min(selected.width, selected.height) / PIXELS_PER_INCH;
      const lengthM = inchesToMeters(lengthIn);
      const widthM = inchesToMeters(widthIn);

      widthInput.value = Math.max(0.5, lengthM).toFixed(2);
      depthInput.value = Math.max(0.3, widthM).toFixed(2);
      heightInput.value = Math.max(1, (widthM * 2.8)).toFixed(2);
      focusLabel.textContent = `Zone sélectionnée: ${selected.name || selected.zone || selected.section || selected.id}`;
    } else {
      focusLabel.textContent = 'Aucune zone sélectionnée sur le plan (valeurs par défaut).';
    }
  } catch (_) {
    focusLabel.textContent = 'Impossible de lire la zone sélectionnée (valeurs par défaut).';
  }
}

function ensureLevelConfigs(levelCount, sectionDefault) {
  while (state.levelConfigs.length < levelCount) {
    state.levelConfigs.push({ sections: sectionDefault });
  }

  state.levelConfigs = state.levelConfigs.slice(0, levelCount);
  state.levelConfigs = state.levelConfigs.map((config) => ({
    sections: Math.min(30, Math.max(1, Math.floor(Number(config.sections) || sectionDefault)))
  }));
}

function buildBeamLevels(rackHeightMax) {
  const beamIntervals = parseBeamHeights();
  let cumulative = 0;
  const beamLevels = [0];

  beamIntervals.forEach((interval) => {
    const next = cumulative + interval;
    if (next < rackHeightMax) {
      cumulative = next;
      beamLevels.push(cumulative);
    }
  });

  if (beamLevels.length === 1) {
    beamLevels.push(Math.min(1.2, rackHeightMax));
  }

  return beamLevels;
}

function renderRack() {
  const rackWidth = Math.max(0.5, Number.parseFloat(widthInput.value) || 0.5);
  const rackDepth = Math.max(0.3, Number.parseFloat(depthInput.value) || 0.3);
  const rackHeightMax = Math.max(1, Number.parseFloat(heightInput.value) || 1);
  const sectionCount = Math.max(1, Math.floor(Number.parseInt(sectionsInput.value, 10) || 1));
  const beamLevels = buildBeamLevels(rackHeightMax);

  ensureLevelConfigs(beamLevels.length - 1, sectionCount);

  scene.innerHTML = '';
  tableBody.innerHTML = '';

  const rackFrame = document.createElement('div');
  rackFrame.className = 'rack-frame';
  const leftSupport = createSupport('left');
  const rightSupport = createSupport('right');
  rackFrame.appendChild(leftSupport);
  rackFrame.appendChild(rightSupport);

  const silhouette = document.createElement('div');
  silhouette.className = 'human-scale';
  silhouette.innerHTML = '<span>Vue humaine ~1.75m</span>';
  rackFrame.appendChild(silhouette);

  const pxPerMeter = 120;
  const rackHeightPx = rackHeightMax * pxPerMeter;

  for (let i = 0; i < beamLevels.length; i += 1) {
    const yPx = rackHeightPx - beamLevels[i] * pxPerMeter;
    const beam = document.createElement('div');
    beam.className = 'rack-beam';
    beam.style.top = `${clamp(yPx, 0, rackHeightPx)}px`;

    if (i > 0) {
      const beamAdjuster = document.createElement('div');
      beamAdjuster.className = 'beam-adjust';
      beamAdjuster.innerHTML = `<button type="button" data-beam="${i - 1}" data-action="dec">−</button><button type="button" data-beam="${i - 1}" data-action="inc">+</button>`;
      beam.appendChild(beamAdjuster);
    }

    const label = document.createElement('span');
    label.className = 'beam-label';
    label.textContent = `Niveau ${levelLetter(i)} · ${formatDimension(beamLevels[i])}`;
    beam.appendChild(label);

    rackFrame.appendChild(beam);
  }

  for (let i = 0; i < beamLevels.length - 1; i += 1) {
    const bottom = beamLevels[i];
    const top = beamLevels[i + 1];
    const alveoleHeight = Math.max(0.05, top - bottom);
    const topPx = rackHeightPx - top * pxPerMeter;
    const heightPx = alveoleHeight * pxPerMeter;

    const controls = document.createElement('div');
    controls.className = 'level-controls';
    controls.style.top = `${topPx + 2}px`;
    controls.innerHTML = `<button type="button" data-level="${i}" data-action="remove">−</button><span>${levelLetter(i)}</span><button type="button" data-level="${i}" data-action="add">+</button>`;
    rackFrame.appendChild(controls);

    const levelSections = state.levelConfigs[i].sections;
    for (let section = 1; section <= levelSections; section += 1) {
      const sectionWidth = rackWidth / levelSections;
      const volume = sectionWidth * rackDepth * alveoleHeight;
      const volumeFt3 = volume * 35.3147;
      const litres = volume * 1000;
      const code = `${levelLetter(i)}${String(section).padStart(2, '0')}`;

      const cell = document.createElement('div');
      cell.className = 'alveole-cell';
      cell.style.top = `${topPx}px`;
      cell.style.height = `${heightPx}px`;
      cell.style.width = `${90 / levelSections}%`;
      cell.style.left = `${5 + ((section - 1) * 90) / levelSections}%`;
      cell.style.borderColor = i % 2 === 0 ? '#93aadf' : '#b4a3df';
      cell.innerHTML = `<strong>${code}</strong><small>L ${formatDimension(sectionWidth)} · l ${formatDimension(rackDepth)} · h ${formatDimension(alveoleHeight)}</small><small>${volumeFt3.toFixed(1)} pi³ / ${litres.toFixed(0)} L</small>`;
      rackFrame.appendChild(cell);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${code}</td>
        <td>${levelLetter(i)} (${formatDimension(bottom)} → ${formatDimension(top)})</td>
        <td>${formatDimension(alveoleHeight)} / ${formatDimension(sectionWidth)} / ${formatDimension(rackDepth)}</td>
        <td>${volumeFt3.toFixed(2)} pi³</td>
        <td>${litres.toFixed(1)} L</td>
        <td>${alveoleHeight.toFixed(2)} / ${sectionWidth.toFixed(2)} / ${rackDepth.toFixed(2)} m</td>
      `;
      tableBody.appendChild(row);
    }
  }

  scene.appendChild(rackFrame);

  [leftSupport, rightSupport].forEach((support) => {
    support.addEventListener('click', (event) => openBarHeightPopup(event, rackHeightMax));
  });

  rackFrame.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const levelIndex = Number(target.dataset.level);
    const beamIndex = Number(target.dataset.beam);

    if (Number.isInteger(levelIndex)) {
      const cfg = state.levelConfigs[levelIndex];
      if (!cfg) return;
      cfg.sections += target.dataset.action === 'add' ? 1 : -1;
      cfg.sections = Math.min(30, Math.max(1, cfg.sections));
      renderRack();
      return;
    }

    if (Number.isInteger(beamIndex)) {
      const heights = parseBeamHeights();
      if (!heights[beamIndex]) return;
      const delta = target.dataset.action === 'inc' ? 0.1 : -0.1;
      heights[beamIndex] = Math.min(2.5, Math.max(0.3, heights[beamIndex] + delta));
      const total = heights.reduce((sum, value) => sum + value, 0);
      if (total >= rackHeightMax - 0.05) {
        heights[beamIndex] = Math.max(0.3, heights[beamIndex] - delta);
      }
      beamHeightsInput.value = heights.map((v) => v.toFixed(2)).join(',');
      renderRack();
    }
  });
}

barHeightMinusButton?.addEventListener('click', () => {
  if (!state.pendingNewBeam) return;
  state.pendingNewBeam.height = clamp(state.pendingNewBeam.height - 0.1, 0.2, state.pendingNewBeam.rackHeightMax - 0.1);
});

barHeightPlusButton?.addEventListener('click', () => {
  if (!state.pendingNewBeam) return;
  state.pendingNewBeam.height = clamp(state.pendingNewBeam.height + 0.1, 0.2, state.pendingNewBeam.rackHeightMax - 0.1);
});

barHeightConfirmButton?.addEventListener('click', () => {
  if (!state.pendingNewBeam) return;
  const target = state.pendingNewBeam.height;
  const rackHeightMax = state.pendingNewBeam.rackHeightMax;
  const levels = buildBeamLevels(rackHeightMax).slice(1);
  levels.push(target);
  levels.sort((a, b) => a - b);

  const intervals = [];
  let previous = 0;
  levels.forEach((level) => {
    const safeLevel = clamp(level, 0.1, rackHeightMax - 0.05);
    if (safeLevel > previous + 0.05) {
      intervals.push(Number((safeLevel - previous).toFixed(2)));
      previous = safeLevel;
    }
  });

  beamHeightsInput.value = intervals.join(',');
  hideBarHeightPopup();
  renderRack();
});

window.addEventListener('resize', () => {
  if (!barHeightPopup || barHeightPopup.hidden) return;
  const rect = barHeightPopup.getBoundingClientRect();
  setBarPopupPosition(rect.left, rect.top);
});

document.addEventListener('click', (event) => {
  if (!barHeightPopup || barHeightPopup.hidden) return;
  if (barHeightPopup.contains(event.target)) return;
  if (event.target.closest('.rack-support')) return;
  hideBarHeightPopup();
});

hydrateFromPlanSelection();
renderButton.addEventListener('click', renderRack);
renderRack();
