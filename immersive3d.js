const STORAGE_KEY = 'dessin-warehouse-plan-v2';
const scene = document.getElementById('immersive-scene');
const summary = document.getElementById('immersive-summary');

function loadBins() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return Array.isArray(saved.bins) ? saved.bins : [];
  } catch (_) {
    return [];
  }
}

function resolveType(bin) {
  const raw = `${bin.type || ''} ${bin.name || ''} ${bin.zone || ''} ${bin.section || ''}`.toUpperCase();
  const match = raw.match(/0[1-9]|1[0-9]|2[0-9]/);
  return match ? match[0] : '01';
}

function renderImmersive() {
  const bins = loadBins();
  const byType = new Map();

  bins.forEach((bin) => {
    const type = resolveType(bin);
    byType.set(type, (byType.get(type) || 0) + 1);
  });

  const orderedTypes = Array.from(new Set(['01', '02', '03', '04', '05', '06', '07', ...byType.keys()])).sort();
  scene.innerHTML = '';

  orderedTypes.forEach((type, index) => {
    const rack = document.createElement('article');
    rack.className = 'immersive-rack';
    const count = byType.get(type) || (index < 7 ? 2 + index : 1);

    const title = document.createElement('h3');
    title.textContent = `Racking type ${type}`;
    rack.appendChild(title);

    const lane = document.createElement('div');
    lane.className = 'pallet-lane';

    for (let i = 0; i < count; i += 1) {
      const stack = document.createElement('div');
      stack.className = 'pallet-stack';
      stack.style.setProperty('--stack-height', String(1 + (i % 3)));
      stack.innerHTML = `<span>Palette ${type}-${String(i + 1).padStart(2, '0')}</span>`;
      lane.appendChild(stack);
    }

    rack.appendChild(lane);
    scene.appendChild(rack);
  });

  summary.textContent = `Vue immersive générée: murs + ${orderedTypes.length} lignes de racking, types ${orderedTypes.join(', ')}.`;
}

renderImmersive();
