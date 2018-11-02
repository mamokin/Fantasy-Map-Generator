import * as d3 from 'd3';

// Version control
const version = '0.60b';
// document.title += ' v. ' + version;

// Declare variables
const svg = d3.select('svg');
const defs = svg.select('#deftemp');
const viewbox = svg.append('g').attr('id', 'viewbox');
const ocean = viewbox.append('g').attr('id', 'ocean');
const oceanLayers = ocean.append('g').attr('id', 'oceanLayers');
const oceanPattern = ocean.append('g').attr('id', 'oceanPattern');
const landmass = viewbox.append('g').attr('id', 'landmass');
const terrs = viewbox.append('g').attr('id', 'terrs');
const grid = viewbox.append('g').attr('id', 'grid');
const overlay = viewbox.append('g').attr('id', 'overlay');
const rivers = viewbox.append('g').attr('id', 'rivers');
const terrain = viewbox.append('g').attr('id', 'terrain');
const cults = viewbox.append('g').attr('id', 'cults');
const regions = viewbox.append('g').attr('id', 'regions');
const borders = viewbox.append('g').attr('id', 'borders');
const stateBorders = borders.append('g').attr('id', 'stateBorders');
const neutralBorders = borders.append('g').attr('id', 'neutralBorders');
const lakes = viewbox.append('g').attr('id', 'lakes');
const routes = viewbox.append('g').attr('id', 'routes');
const roads = routes.append('g').attr('id', 'roads').attr('data-type', 'land');
const trails = routes.append('g').attr('id', 'trails').attr('data-type', 'land');
const searoutes = routes.append('g').attr('id', 'searoutes').attr('data-type', 'sea');
const coastline = viewbox.append('g').attr('id', 'coastline');
const labels = viewbox.append('g').attr('id', 'labels');
const burgLabels = labels.append('g').attr('id', 'burgLabels');
const icons = viewbox.append('g').attr('id', 'icons');
const burgIcons = icons.append('g').attr('id', 'burgIcons');
const markers = viewbox.append('g').attr('id', 'markers');
const ruler = viewbox.append('g').attr('id', 'ruler');
const debug = viewbox.append('g').attr('id', 'debug');
const fonts = [
  'Almendra+SC',
  'Georgia',
  'Times+New+Roman',
  'Comic+Sans+MS',
  'Lucida+Sans+Unicode',
  'Courier+New'
];

export {
  version,
  svg,
  defs,
  viewbox,
  ocean,
  oceanLayers,
  oceanPattern,
  landmass,
  terrs,
  grid,
  overlay,
  rivers,
  terrain,
  cults,
  regions,
  borders,
  stateBorders,
  neutralBorders,
  lakes,
  routes,
  roads,
  trails,
  searoutes,
  coastline,
  labels,
  burgLabels,
  icons,
  burgIcons,
  markers,
  ruler,
  debug,
  fonts
};
