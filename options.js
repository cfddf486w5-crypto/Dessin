const ADVANCED_OPTIONS_KEY = 'dessin-advanced-options-v1';

const frameContainer = document.getElementById('frame-options');
const uiContainer = document.getElementById('ui-options');
const layoutContainer = document.getElementById('layout-options');
const framePanel = document.getElementById('frame-panel');
const uiPanel = document.getElementById('ui-panel');
const layoutPanel = document.getElementById('layout-panel');

const state = {
  frame: {},
  ui: {},
  layout: {}
};

const frameLabels = [
  'Coins plus arrondis', 'Cadre épais', 'Halo bleu', 'Contour double', 'Fond vitré',
  'Lueur interne', 'Cadre pointillé', 'Accent haut', 'Accent bas', 'Accent gauche',
  'Accent droite', 'Zoom cadre', 'Inclinaison légère', 'Ombre profonde', 'Padding confortable',
  'Bordure cyan', 'Bordure magenta', 'Bordure verte', 'Rotation minime', 'Effet carte'
];

const uiLabels = [
  'Mode nuit (EXP)', 'Mode jour forcé', 'Police large', 'Police condensée', 'Contraste fort',
  'Contraste doux', 'Animations fluides', 'Animations réduites', 'Boutons arrondis XL', 'Boutons carrés',
  'Palette chaude', 'Palette froide', 'Verre renforcé', 'Texte accentué', 'Espacement compact',
  'Espacement confortable', 'Liens surlignés', 'Icônes accentuées', 'Bordures minimales', 'Bordures marquées'
];

const layoutLabels = Array.from({ length: 40 }, (_, index) => {
  if (index === 0) return 'Layout option 1 (Tableau 1 km)';
  return `Layout option ${index + 1}`;
});

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(ADVANCED_OPTIONS_KEY) || '{}');
    state.frame = saved.frame || {};
    state.ui = saved.ui || {};
    state.layout = saved.layout || {};
  } catch (_) {
    state.frame = {};
    state.ui = {};
    state.layout = {};
  }
}

function saveState() {
  localStorage.setItem(ADVANCED_OPTIONS_KEY, JSON.stringify(state));
}

function countEnabled(bucket) {
  return Object.values(bucket).filter(Boolean).length;
}

function createToggle(container, bucket, key, label) {
  const wrapper = document.createElement('label');
  wrapper.className = 'toggle';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = Boolean(state[bucket][key]);
  input.addEventListener('change', () => {
    state[bucket][key] = input.checked;
    saveState();
    applyPreview();
  });

  const span = document.createElement('span');
  span.textContent = label;

  wrapper.append(input, span);
  container.appendChild(wrapper);
}

function applyFramePreview() {
  const enabled = countEnabled(state.frame);
  const radius = 14 + enabled * 0.8;
  const border = 1 + (enabled % 5);
  const hue = 220 + enabled * 2;

  framePanel.style.borderRadius = `${radius}px`;
  framePanel.style.borderWidth = `${border}px`;
  framePanel.style.borderStyle = state.frame.frame_07 ? 'dashed' : 'solid';
  framePanel.style.borderColor = `hsl(${hue} 70% 78%)`;
  framePanel.style.boxShadow = state.frame.frame_14
    ? '0 16px 38px rgb(21 44 96 / 22%)'
    : `0 8px ${18 + enabled}px rgb(21 44 96 / 10%)`;

  framePanel.style.paddingTop = `${10 + (state.frame.frame_15 ? 10 : 0)}px`;
  framePanel.style.transform = state.frame.frame_19 ? 'rotate(-0.4deg)' : 'none';
  framePanel.style.backdropFilter = state.frame.frame_05 ? 'blur(12px)' : 'blur(8px)';
  framePanel.style.background = state.frame.frame_20
    ? 'linear-gradient(135deg, rgb(255 255 255 / 94%), rgb(231 240 255 / 92%))'
    : 'rgb(255 255 255 / 76%)';
}

function applyUiPreview() {
  const nightMode = Boolean(state.ui.ui_01) && !state.ui.ui_02;
  document.body.classList.toggle('theme-night', nightMode);

  const enabled = countEnabled(state.ui);
  document.body.style.fontSize = state.ui.ui_03 ? '17px' : state.ui.ui_04 ? '14px' : '16px';
  document.body.style.letterSpacing = state.ui.ui_14 ? '0.02em' : 'normal';
  document.body.style.setProperty('--toolbar-gap', state.ui.ui_15 ? '6px' : state.ui.ui_16 ? '12px' : '8px');

  uiPanel.style.filter = state.ui.ui_05
    ? 'contrast(1.15) saturate(1.08)'
    : state.ui.ui_06
      ? 'contrast(0.9) saturate(0.96)'
      : 'none';

  uiPanel.style.transition = state.ui.ui_07 ? 'all 280ms ease' : 'none';
  uiPanel.style.boxShadow = state.ui.ui_13
    ? '0 10px 28px rgb(26 51 109 / 22%)'
    : `0 8px ${24 + enabled}px rgb(21 44 96 / 8%)`;

  if (state.ui.ui_09) {
    document.documentElement.style.setProperty('--btn-radius', '18px');
  } else if (state.ui.ui_10) {
    document.documentElement.style.setProperty('--btn-radius', '4px');
  } else {
    document.documentElement.style.setProperty('--btn-radius', '10px');
  }
}

function applyLayoutPreview() {
  const enabled = countEnabled(state.layout);
  const columns = 1 + (enabled % 4);
  const gap = 10 + (enabled % 7);

  layoutPanel.style.setProperty('--layout-columns', String(columns));
  layoutPanel.style.setProperty('--layout-gap', `${gap}px`);
  layoutPanel.style.padding = `${10 + (enabled % 9)}px`;

  const scale = state.layout.layout_20 ? 1.02 : 1;
  layoutPanel.style.transform = state.layout.layout_19 ? `scale(${scale}) translateX(4px)` : `scale(${scale})`;

  layoutContainer.style.gridTemplateColumns = `repeat(${columns}, minmax(170px, 1fr))`;
  layoutContainer.style.gap = `${gap}px`;

  if (state.layout.layout_40) {
    layoutPanel.style.background = 'linear-gradient(160deg, rgb(255 255 255 / 84%), rgb(220 235 255 / 72%))';
  } else {
    layoutPanel.style.background = 'rgb(255 255 255 / 76%)';
  }
}

function applyPreview() {
  applyFramePreview();
  applyUiPreview();
  applyLayoutPreview();
}

loadState();

for (let i = 1; i <= 20; i += 1) {
  const key = `frame_${String(i).padStart(2, '0')}`;
  createToggle(frameContainer, 'frame', key, frameLabels[i - 1]);
}

for (let i = 1; i <= 20; i += 1) {
  const key = `ui_${String(i).padStart(2, '0')}`;
  createToggle(uiContainer, 'ui', key, uiLabels[i - 1]);
}

for (let i = 1; i <= 40; i += 1) {
  const key = i === 1 ? 'boardOneKilometer' : `layout_${String(i).padStart(2, '0')}`;
  createToggle(layoutContainer, 'layout', key, layoutLabels[i - 1]);
}

applyPreview();
