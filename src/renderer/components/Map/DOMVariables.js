function getById(id) {
  return document.getElementById(id);
}

// canvas element for raster images
const canvas = getById('canvas');
const ctx = canvas.getContext('2d');

// other elements
const hideLabels = getById('hideLabels');
const styleElementSelect = getById('styleElementSelect');
const barSize = getById('barSize');
const tooltip = getById('tooltip');
const optionsSeed = getById('optionsSeed');
const distanceScale = getById('distanceScale');
const distanceUnit = getById('distanceUnit');
const barLabel = getById('barLabel');
const sizeInput = getById('sizeInput');
const sizeOutput = getById('sizeOutput');
const templateInput = getById('templateInput');
// const scaleBar = getById('scaleBar');
const barBackColor = getById('barBackColor');
const barBackOpacity = getById('barBackOpacity');
const mapWidthInput = getById('mapWidthInput');
const mapHeightInput = getById('mapHeightInput');
const lockTemplateInput = getById('lockTemplateInput');
const manorsInput = getById('manorsInput');
const lockManorsInput = getById('lockManorsInput');
const regionsInput = getById('regionsInput');
const lockRegionsInput = getById('lockRegionsInput');
const regionsOutput = getById('regionsOutput');
const neutralInput = getById('neutralInput');
const neutralOutput = getById('neutralOutput');
const powerInput = getById('powerInput');
const powerOutput = getById('powerOutput');
const lockPowerInput = getById('lockPowerInput');
const namesInput = getById('namesInput');
const lockNamesInput = getById('lockNamesInput');
const culturesInput = getById('culturesInput');
const culturesOutput = getById('culturesOutput');
const lockCulturesInput = getById('lockCulturesInput');
const precInput = getById('precInput');
const precOutput = getById('precOutput');
const lockPrecInput = getById('lockPrecInput');
const swampinessInput = getById('swampinessInput');
const swampinessOutput = getById('swampinessOutput');
const outlineLayersInput = getById('outlineLayersInput');
const pngResolutionInput = getById('pngResolutionInput');
const pngResolutionOutput = getById('pngResolutionOutput');
const transparencyInput = getById('transparencyInput');
const transparencyOutput = getById('transparencyOutput');
const manorsOutput = getById('manorsOutput');
const brushPower = getById('brushPower');
const renderOcean = getById('renderOcean');
const countriesManuallyBrush = getById('countriesManuallyBrush');
const culturesManuallyBrush = getById('culturesManuallyBrush');

export {
  canvas,
  ctx,
  hideLabels,
  styleElementSelect,
  barSize,
  tooltip,
  optionsSeed,
  distanceScale,
  distanceUnit,
  barLabel,
  sizeInput,
  sizeOutput,
  templateInput,
  barBackColor,
  barBackOpacity,
  mapWidthInput,
  mapHeightInput,
  lockTemplateInput,
  manorsInput,
  manorsOutput,
  lockManorsInput,
  regionsInput,
  lockRegionsInput,
  regionsOutput,
  neutralInput,
  neutralOutput,
  powerInput,
  powerOutput,
  lockPowerInput,
  namesInput,
  lockNamesInput,
  culturesInput,
  culturesOutput,
  lockCulturesInput,
  precInput,
  precOutput,
  lockPrecInput,
  swampinessInput,
  swampinessOutput,
  outlineLayersInput,
  pngResolutionInput,
  pngResolutionOutput,
  transparencyInput,
  transparencyOutput,
  brushPower,
  renderOcean,
  countriesManuallyBrush,
  culturesManuallyBrush
};
