const ADVANCED_OPTIONS_KEY = 'dessin-advanced-options-v1';

const frameContainer = document.getElementById('frame-options');
const uiContainer = document.getElementById('ui-options');
const layoutContainer = document.getElementById('layout-options');

const state = {
  frame: {},
  ui: {},
  layout: {}
};

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

function createToggle(container, bucket, key, label) {
  const wrapper = document.createElement('label');
  wrapper.className = 'toggle';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = Boolean(state[bucket][key]);
  input.addEventListener('change', () => {
    state[bucket][key] = input.checked;
    saveState();
  });

  const span = document.createElement('span');
  span.textContent = label;

  wrapper.append(input, span);
  container.appendChild(wrapper);
}

loadState();

for (let i = 1; i <= 20; i += 1) {
  const key = `frame_${String(i).padStart(2, '0')}`;
  createToggle(frameContainer, 'frame', key, `Frame option ${i}`);
}

for (let i = 1; i <= 20; i += 1) {
  const key = `ui_${String(i).padStart(2, '0')}`;
  createToggle(uiContainer, 'ui', key, `UI option ${i}`);
}

for (let i = 1; i <= 40; i += 1) {
  const key = i === 1 ? 'boardOneKilometer' : `layout_${String(i).padStart(2, '0')}`;
  const label = i === 1 ? 'Layout option 1 (Tableau 1 km)' : `Layout option ${i}`;
  createToggle(layoutContainer, 'layout', key, label);
}
