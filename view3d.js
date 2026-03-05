const widthInput = document.getElementById('rack-width');
const depthInput = document.getElementById('rack-depth');
const heightInput = document.getElementById('rack-height');
const sectionsInput = document.getElementById('rack-sections');
const beamHeightsInput = document.getElementById('beam-heights');
const renderButton = document.getElementById('render-rack');
const scene = document.getElementById('rack-scene');
const tableBody = document.getElementById('alveole-table-body');

function parseBeamHeights() {
  return beamHeightsInput.value
    .split(',')
    .map((value) => Number.parseFloat(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0.05);
}

function levelLetter(index) {
  return String.fromCharCode(65 + index);
}

function formatDimension(value) {
  return `${value.toFixed(2)} m`;
}

function createSupport(className) {
  const support = document.createElement('div');
  support.className = `rack-support ${className}`;
  return support;
}

function renderRack() {
  const rackWidth = Math.max(0.5, Number.parseFloat(widthInput.value) || 0.5);
  const rackDepth = Math.max(0.3, Number.parseFloat(depthInput.value) || 0.3);
  const rackHeightMax = Math.max(1, Number.parseFloat(heightInput.value) || 1);
  const sectionCount = Math.max(1, Math.floor(Number.parseInt(sectionsInput.value, 10) || 1));
  const beamIntervals = parseBeamHeights();

  let cumulative = 0;
  const beamLevels = [0];
  beamIntervals.forEach((interval) => {
    const next = cumulative + interval;
    if (next <= rackHeightMax) {
      cumulative = next;
      beamLevels.push(cumulative);
    }
  });

  if (beamLevels.length === 1) {
    beamLevels.push(Math.min(1.2, rackHeightMax));
  }

  scene.innerHTML = '';
  tableBody.innerHTML = '';

  const rackFrame = document.createElement('div');
  rackFrame.className = 'rack-frame';
  rackFrame.appendChild(createSupport('left'));
  rackFrame.appendChild(createSupport('right'));

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
    beam.style.top = `${yPx}px`;

    const label = document.createElement('span');
    label.className = 'beam-label';
    label.textContent = `Niveau ${levelLetter(i)} · ${beamLevels[i].toFixed(2)} m`;
    beam.appendChild(label);

    rackFrame.appendChild(beam);
  }

  for (let i = 0; i < beamLevels.length - 1; i += 1) {
    const bottom = beamLevels[i];
    const top = beamLevels[i + 1];
    const alveoleHeight = top - bottom;
    const topPx = rackHeightPx - top * pxPerMeter;
    const heightPx = alveoleHeight * pxPerMeter;

    for (let section = 1; section <= sectionCount; section += 1) {
      const sectionWidth = rackWidth / sectionCount;
      const volume = sectionWidth * rackDepth * alveoleHeight;
      const litres = volume * 1000;
      const code = `${levelLetter(i)}${String(section).padStart(2, '0')}`;

      const cell = document.createElement('div');
      cell.className = 'alveole-cell';
      cell.style.top = `${topPx}px`;
      cell.style.height = `${heightPx}px`;
      cell.style.width = `${90 / sectionCount}%`;
      cell.style.left = `${5 + ((section - 1) * 90) / sectionCount}%`;
      cell.innerHTML = `<strong>${code}</strong><small>${formatDimension(alveoleHeight)} × ${formatDimension(sectionWidth)} × ${formatDimension(rackDepth)}</small>`;
      rackFrame.appendChild(cell);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${code}</td>
        <td>${levelLetter(i)} (${bottom.toFixed(2)}m → ${top.toFixed(2)}m)</td>
        <td>${formatDimension(alveoleHeight)} / ${formatDimension(sectionWidth)} / ${formatDimension(rackDepth)}</td>
        <td>${volume.toFixed(3)} m³</td>
        <td>${litres.toFixed(1)} L</td>
      `;
      tableBody.appendChild(row);
    }
  }

  scene.appendChild(rackFrame);
}

renderButton.addEventListener('click', renderRack);
renderRack();
