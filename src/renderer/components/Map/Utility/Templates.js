// Heighmap Template: Volcano
function templateVolcano(mod) {
  addMountain();
  modifyHeights('all', 10, 1);
  addHill(5, 0.35);
  addRange(3);
  addRange(-4);
}

// Heighmap Template: High Island
function templateHighIsland(mod) {
  addMountain();
  modifyHeights('all', 10, 1);
  addRange(6);
  addHill(12, 0.25);
  addRange(-3);
  modifyHeights('land', 0, 0.75);
  addPit(1);
  addHill(3, 0.15);
}

// Heighmap Template: Low Island
function templateLowIsland(mod) {
  addMountain();
  modifyHeights('all', 10, 1);
  smoothHeights(2);
  addRange(2);
  addHill(4, 0.4);
  addHill(12, 0.2);
  addRange(-8);
  modifyHeights('land', 0, 0.35);
}

// Heighmap Template: Continents
function templateContinents(mod) {
  addMountain();
  modifyHeights('all', 10, 1);
  addHill(30, 0.25);
  const count = Math.ceil(Math.random() * 4 + 4);
  addStrait(count);
  addPit(10);
  addRange(-10);
  modifyHeights('land', 0, 0.6);
  smoothHeights(2);
  addRange(3);
}

// Heighmap Template: Archipelago
function templateArchipelago(mod) {
  addMountain();
  modifyHeights('all', 10, 1);
  addHill(12, 0.15);
  addRange(8);
  const count = Math.ceil(Math.random() * 2 + 2);
  addStrait(count);
  addRange(-15);
  addPit(10);
  modifyHeights('land', -5, 0.7);
  smoothHeights(3);
}

// Heighmap Template: Atoll
function templateAtoll(mod) {
  addMountain();
  modifyHeights('all', 10, 1);
  addHill(2, 0.35);
  addRange(2);
  smoothHeights(1);
  modifyHeights('27-100', 0, 0.1);
}

// Heighmap Template: Mainland
function templateMainland(mod) {
  addMountain();
  modifyHeights('all', 10, 1);
  addHill(30, 0.2);
  addRange(10);
  addPit(20);
  addHill(10, 0.15);
  addRange(-10);
  modifyHeights('land', 0, 0.4);
  addRange(10);
  smoothHeights(3);
}

// Heighmap Template: Peninsulas
function templatePeninsulas(mod) {
  addMountain();
  modifyHeights('all', 15, 1);
  addHill(30, 0);
  addRange(5);
  addPit(15);
  const count = Math.ceil(Math.random() * 5 + 15);
  addStrait(count);
}

function changeTemplate(template) {
  $('#templateBody').empty();
  $('#templateSelect').attr('data-prev', template);
  if (template === 'templateVolcano') {
    addStep('Mountain');
    addStep('Add', 10);
    addStep('Hill', 5, 0.35);
    addStep('Range', 3);
    addStep('Trough', -4);
  }
  if (template === 'templateHighIsland') {
    addStep('Mountain');
    addStep('Add', 10);
    addStep('Range', 6);
    addStep('Hill', 12, 0.25);
    addStep('Trough', 3);
    addStep('Multiply', 0.75, 'land');
    addStep('Pit', 1);
    addStep('Hill', 3, 0.15);
  }
  if (template === 'templateLowIsland') {
    addStep('Mountain');
    addStep('Add', 10);
    addStep('Smooth', 2);
    addStep('Range', 2);
    addStep('Hill', 4, 0.4);
    addStep('Hill', 12, 0.2);
    addStep('Trough', 8);
    addStep('Multiply', 0.35, 'land');
  }
  if (template === 'templateContinents') {
    addStep('Mountain');
    addStep('Add', 10);
    addStep('Hill', 30, 0.25);
    addStep('Strait', '4-7');
    addStep('Pit', 10);
    addStep('Trough', 10);
    addStep('Multiply', 0.6, 'land');
    addStep('Smooth', 2);
    addStep('Range', 3);
  }
  if (template === 'templateArchipelago') {
    addStep('Mountain');
    addStep('Add', 10);
    addStep('Hill', 12, 0.15);
    addStep('Range', 8);
    addStep('Strait', '2-3');
    addStep('Trough', 15);
    addStep('Pit', 10);
    addStep('Add', -5, 'land');
    addStep('Multiply', 0.7, 'land');
    addStep('Smooth', 3);
  }

  if (template === 'templateAtoll') {
    addStep('Mountain');
    addStep('Add', 10, 'all');
    addStep('Hill', 2, 0.35);
    addStep('Range', 2);
    addStep('Smooth', 1);
    addStep('Multiply', 0.1, '27-100');
  }
  if (template === 'templateMainland') {
    addStep('Mountain');
    addStep('Add', 10, 'all');
    addStep('Hill', 30, 0.2);
    addStep('Range', 10);
    addStep('Pit', 20);
    addStep('Hill', 10, 0.15);
    addStep('Trough', 10);
    addStep('Multiply', 0.4, 'land');
    addStep('Range', 10);
    addStep('Smooth', 3);
  }
  if (template === 'templatePeninsulas') {
    addStep('Add', 15);
    addStep('Hill', 30, 0);
    addStep('Range', 5);
    addStep('Pit', 15);
    addStep('Strait', '15-20');
  }
  $('#templateBody').attr('data-changed', 0);
}

export {
  templateVolcano,
  templateHighIsland,
  templateLowIsland,
  templateContinents,
  templateArchipelago,
  templateAtoll,
  templateMainland,
  templatePeninsulas,
  changeTemplate
};
