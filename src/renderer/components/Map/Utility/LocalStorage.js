// load options from LocalStorage is any
function applyStoredOptions() {
  if (localStorage.getItem('mapWidth') && localStorage.getItem('mapHeight')) {
    mapWidthInput.value = localStorage.getItem('mapWidth');
    mapHeightInput.value = localStorage.getItem('mapHeight');
  } else {
    mapWidthInput.value = window.innerWidth;
    mapHeightInput.value = window.innerHeight;
  }
  if (localStorage.getItem('graphSize')) {
    graphSize = localStorage.getItem('graphSize');
    sizeInput.value = sizeOutput.value = graphSize;
  } else {
    graphSize = +sizeInput.value;
  }
  if (localStorage.getItem('template')) {
    templateInput.value = localStorage.getItem('template');
    lockTemplateInput.setAttribute('data-locked', 1);
    lockTemplateInput.className = 'icon-lock';
  }
  if (localStorage.getItem('manors')) {
    manorsInput.value = manorsOutput.value = localStorage.getItem('manors');
    lockManorsInput.setAttribute('data-locked', 1);
    lockManorsInput.className = 'icon-lock';
  }
  if (localStorage.getItem('regions')) {
    regionsInput.value = regionsOutput.value = localStorage.getItem('regions');
    lockRegionsInput.setAttribute('data-locked', 1);
    lockRegionsInput.className = 'icon-lock';
  }
  if (localStorage.getItem('power')) {
    powerInput.value = powerOutput.value = localStorage.getItem('power');
    lockPowerInput.setAttribute('data-locked', 1);
    lockPowerInput.className = 'icon-lock';
  }
  if (localStorage.getItem('neutral')) {
    neutralInput.value = neutralOutput.value = localStorage.getItem('neutral');
  }
  if (localStorage.getItem('names')) {
    namesInput.value = localStorage.getItem('names');
    lockNamesInput.setAttribute('data-locked', 1);
    lockNamesInput.className = 'icon-lock';
  }
  if (localStorage.getItem('cultures')) {
    culturesInput.value = culturesOutput.value = localStorage.getItem('cultures');
    lockCulturesInput.setAttribute('data-locked', 1);
    lockCulturesInput.className = 'icon-lock';
  }
  if (localStorage.getItem('prec')) {
    precInput.value = precOutput.value = localStorage.getItem('prec');
    lockPrecInput.setAttribute('data-locked', 1);
    lockPrecInput.className = 'icon-lock';
  }
  if (localStorage.getItem('swampiness')) {
    swampinessInput.value = swampinessOutput.value = localStorage.getItem('swampiness');
  }
  if (localStorage.getItem('outlineLayers')) {
    outlineLayersInput.value = localStorage.getItem('outlineLayers');
  }
  if (localStorage.getItem('pngResolution')) {
    pngResolutionInput.value = localStorage.getItem('pngResolution');
    pngResolutionOutput.value = `${pngResolutionInput.value}x`;
  }
  if (localStorage.getItem('transparency')) {
    transparencyInput.value = transparencyOutput.value = localStorage.getItem('transparency');
    changeDialogsTransparency(transparencyInput.value);
  } else {
    changeDialogsTransparency(0);
  }
}

export default applyStoredOptions;
