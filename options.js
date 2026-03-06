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

const layoutOptions = [
  { key: 'boardOneKilometer', label: 'Tableau 1 km' },
  { key: 'presetBinP1', label: 'Menu P1 · Bin 50" x 50"' },
  { key: 'presetBinP2', label: 'Menu P2 · Bin 50" x 100"' },
  { key: 'presetBinP3', label: 'Menu P3 · Bin 50" x 150"' },
  { key: 'presetBinP4', label: 'Menu P4 · Bin 50" x 200"' },
  { key: 'presetBinP5', label: 'Menu P5 · Bin 50" x 250"' },
  { key: 'presetBinP6', label: 'Menu P6 · Bin 50" x 300"' },
  { key: 'presetBinP7', label: 'Menu P7 · Bin 50" x 350"' },
  { key: 'layout_02', label: 'Deux colonnes fixes' },
  { key: 'layout_03', label: 'Trois colonnes fixes' },
  { key: 'layout_04', label: 'Quatre colonnes fixes' },
  { key: 'layout_05', label: 'Gap compact' },
  { key: 'layout_06', label: 'Gap confortable' },
  { key: 'layout_07', label: 'Marge interne dense' },
  { key: 'layout_08', label: 'Marge interne large' },
  { key: 'layout_09', label: 'Alignement haut' },
  { key: 'layout_10', label: 'Alignement centré' },
  { key: 'layout_11', label: 'Alignement étiré' },
  { key: 'layout_12', label: 'Cards horizontales' },
  { key: 'layout_13', label: 'Cards verticales' },
  { key: 'layout_14', label: 'Cartes mini' },
  { key: 'layout_15', label: 'Cartes XL' },
  { key: 'layout_16', label: 'Séparateurs visibles' },
  { key: 'layout_17', label: 'Séparateurs discrets' },
  { key: 'layout_18', label: 'Mosaïque alternée' },
  { key: 'layout_19', label: 'Décalage horizontal' },
  { key: 'layout_20', label: 'Scale léger' },
  { key: 'layout_21', label: 'Mode sticky options' },
  { key: 'layout_22', label: 'Scroll snapping' },
  { key: 'layout_23', label: 'Aération verticale' },
  { key: 'layout_24', label: 'Aération horizontale' },
  { key: 'layout_25', label: 'Bordures adoucies' },
  { key: 'layout_26', label: 'Bordures nettes' },
  { key: 'layout_27', label: 'Ombre cartes renforcée' },
  { key: 'layout_28', label: 'Ombre cartes minimale' },
  { key: 'layout_29', label: 'Fond section léger' },
  { key: 'layout_30', label: 'Fond section contrasté' },
  { key: 'layout_31', label: 'Accents bleus' },
  { key: 'layout_32', label: 'Accents violets' },
  { key: 'layout_33', label: 'Compteur activé' },
  { key: 'layout_34', label: 'Compteur compact' },
  { key: 'layout_35', label: 'Hover dynamique' },
  { key: 'layout_36', label: 'Désactiver hover' },
  { key: 'layout_37', label: 'Texte tassé' },
  { key: 'layout_38', label: 'Texte aéré' },
  { key: 'layout_39', label: 'Contour renforcé' },
  { key: 'layout_40', label: 'Fond premium' },
  { key: 'layout_41', label: 'Test layout 41 · Trame logistique' },
  { key: 'layout_42', label: 'Test layout 42 · Densité max' },
  { key: 'layout_43', label: 'Test layout 43 · Densité réduite' },
  { key: 'layout_44', label: 'Test layout 44 · Contrôle largeur' },
  { key: 'layout_45', label: 'Test layout 45 · Contrôle hauteur' },
  { key: 'layout_46', label: 'Test layout 46 · Colonnes automatiques' },
  { key: 'layout_47', label: 'Test layout 47 · Marqueurs visuels' },
  { key: 'layout_48', label: 'Test layout 48 · Parcours opérateur' },
  { key: 'layout_49', label: 'Test layout 49 · Focus audit' },
  { key: 'layout_50', label: 'Test layout 50 · Focus sécurité' },
  { key: 'layout_51', label: 'Test layout 51 · Focus maintenance' },
  { key: 'layout_52', label: 'Test layout 52 · Cadence pic' },
  { key: 'layout_53', label: 'Test layout 53 · Cadence creuse' },
  { key: 'layout_54', label: 'Test layout 54 · Compact mobile' },
  { key: 'layout_55', label: 'Test layout 55 · Mixte desktop' },
  { key: 'layout_56', label: 'Test layout 56 · Étiquettes longues' },
  { key: 'layout_57', label: 'Test layout 57 · Étiquettes courtes' },
  { key: 'layout_58', label: 'Test layout 58 · Visualisation lot' },
  { key: 'layout_59', label: 'Test layout 59 · Visualisation flux' },
  { key: 'layout_60', label: 'Test layout 60 · Validation finale' }
];

function isPresetBinOption(key) {
  return key.startsWith('presetBinP');
}

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
  input.dataset.optionKey = key;
  input.checked = Boolean(state[bucket][key]);
  input.addEventListener('change', () => {
    if (bucket === 'layout' && isPresetBinOption(key) && input.checked) {
      Object.keys(state.layout).forEach((layoutKey) => {
        if (layoutKey !== key && isPresetBinOption(layoutKey)) {
          state.layout[layoutKey] = false;
        }
      });
      layoutContainer.querySelectorAll('input').forEach((item) => {
        if (item !== input && isPresetBinOption(item.dataset.optionKey || '')) {
          item.checked = false;
        }
      });
    }
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

function getLayoutColumns() {
  if (state.layout.layout_04) return 4;
  if (state.layout.layout_03) return 3;
  if (state.layout.layout_02) return 2;
  return 1 + (countEnabled(state.layout) % 4);
}

function applyLayoutPreview() {
  const enabled = countEnabled(state.layout);
  const columns = getLayoutColumns();

  const gap = state.layout.layout_05
    ? 6
    : state.layout.layout_06
      ? 18
      : 10 + (enabled % 7);

  const panelPadding = state.layout.layout_07
    ? 8
    : state.layout.layout_08
      ? 20
      : 10 + (enabled % 9);

  const alignItems = state.layout.layout_09
    ? 'start'
    : state.layout.layout_10
      ? 'center'
      : state.layout.layout_11
        ? 'stretch'
        : 'normal';

  const gridAutoFlow = state.layout.layout_12
    ? 'column'
    : state.layout.layout_13
      ? 'row'
      : 'row dense';

  const cardMinWidth = state.layout.layout_14
    ? 130
    : state.layout.layout_15
      ? 220
      : 170;

  const separatorColor = state.layout.layout_16
    ? 'rgb(106 136 198 / 38%)'
    : state.layout.layout_17
      ? 'rgb(106 136 198 / 18%)'
      : 'rgb(106 136 198 / 26%)';

  const panelRadius = state.layout.layout_25
    ? 24
    : state.layout.layout_26
      ? 10
      : 16;

  const panelOutline = state.layout.layout_39
    ? '2px solid rgb(90 126 198 / 42%)'
    : '1px solid rgb(106 136 198 / 26%)';

  const panelBg = state.layout.layout_40
    ? 'linear-gradient(160deg, rgb(255 255 255 / 84%), rgb(220 235 255 / 72%))'
    : state.layout.layout_30
      ? 'rgb(241 247 255 / 88%)'
      : state.layout.layout_29
        ? 'rgb(255 255 255 / 72%)'
        : 'rgb(255 255 255 / 76%)';

  const accent = state.layout.layout_32
    ? 'rgb(129 90 255 / 36%)'
    : state.layout.layout_31
      ? 'rgb(63 130 255 / 36%)'
      : 'rgb(106 136 198 / 26%)';

  const boxShadow = state.layout.layout_27
    ? '0 14px 30px rgb(35 66 128 / 18%)'
    : state.layout.layout_28
      ? '0 3px 10px rgb(35 66 128 / 8%)'
      : '0 8px 22px rgb(35 66 128 / 12%)';

  const lineHeight = state.layout.layout_37
    ? '1.1'
    : state.layout.layout_38
      ? '1.45'
      : '1.25';

  const animation = state.layout.layout_36 ? 'none' : state.layout.layout_35 ? 'transform 220ms ease, box-shadow 220ms ease' : 'none';

  layoutPanel.style.padding = `${panelPadding}px`;
  layoutPanel.style.borderRadius = `${panelRadius}px`;
  layoutPanel.style.border = panelOutline;
  layoutPanel.style.background = panelBg;
  layoutPanel.style.boxShadow = boxShadow;

  const boardScale = state.layout.boardOneKilometer ? 0.92 : 1;
  const scale = state.layout.layout_20 ? boardScale * 1.02 : boardScale;
  const translateX = state.layout.layout_19 ? 'translateX(4px)' : 'translateX(0)';
  layoutPanel.style.transform = `${translateX} scale(${scale})`;
  layoutPanel.style.position = state.layout.layout_21 ? 'sticky' : 'relative';
  layoutPanel.style.top = state.layout.layout_21 ? '8px' : 'auto';
  layoutPanel.style.letterSpacing = state.layout.boardOneKilometer ? '0.01em' : 'normal';

  layoutContainer.style.gridTemplateColumns = `repeat(${columns}, minmax(${cardMinWidth}px, 1fr))`;
  layoutContainer.style.gap = `${gap}px`;
  layoutContainer.style.alignItems = alignItems;
  layoutContainer.style.gridAutoFlow = gridAutoFlow;
  layoutContainer.style.rowGap = state.layout.layout_23 ? `${gap + 8}px` : `${gap}px`;
  layoutContainer.style.columnGap = state.layout.layout_24 ? `${gap + 10}px` : `${gap}px`;
  layoutContainer.style.paddingBottom = state.layout.layout_22 ? '12px' : '0';
  layoutContainer.style.scrollSnapType = state.layout.layout_22 ? 'y mandatory' : 'none';

  const toggles = layoutContainer.querySelectorAll('.toggle');
  toggles.forEach((toggle, index) => {
    toggle.style.borderTop = `1px solid ${separatorColor}`;
    toggle.style.borderRadius = state.layout.layout_18 && index % 2 ? '14px 4px 14px 4px' : '10px';
    toggle.style.background = index % 2 ? `linear-gradient(180deg, ${accent}, transparent)` : 'transparent';
    toggle.style.minHeight = state.layout.layout_15 ? '58px' : state.layout.layout_14 ? '36px' : '44px';
    toggle.style.transition = animation;
    toggle.style.scrollSnapAlign = state.layout.layout_22 ? 'start' : 'none';
    toggle.style.lineHeight = lineHeight;
    if (state.layout.layout_35 && !state.layout.layout_36) {
      toggle.onmouseenter = () => {
        toggle.style.transform = 'translateY(-2px)';
      };
      toggle.onmouseleave = () => {
        toggle.style.transform = 'translateY(0)';
      };
    } else {
      toggle.onmouseenter = null;
      toggle.onmouseleave = null;
      toggle.style.transform = 'translateY(0)';
    }
  });

  layoutPanel.dataset.layoutCount = state.layout.layout_33
    ? `${enabled} options actives`
    : state.layout.layout_34
      ? `${enabled}`
      : '';
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

layoutOptions.forEach((option) => {
  createToggle(layoutContainer, 'layout', option.key, option.label);
});

applyPreview();
