import $ from 'jquery';
import * as DOM from './DOMVariables';
import * as C from './Const';
import * as Toggle from './Toggles';

const tooltip = C.tooltip;
const debug = C.debug;

// Complete the map for the "customize" mode
function getMap() {
  if (customization !== 1) {
    tip('Nothing to complete! Click on "Edit" or "Clear all" to enter a heightmap customization mode', null, 'error');
    return;
  }
  if (+landmassCounter.innerHTML < 150) {
    tip('Insufficient land area! Please add more land cells to complete the map', null, 'error');
    return;
  }
  exitCustomization();
  console.time('TOTAL');
  markFeatures();
  drawOcean();
  elevateLakes();
  resolveDepressionsPrimary();
  reGraph();
  resolveDepressionsSecondary();
  flux();
  addLakes();
  if (!changeHeights.checked) {
    restoreCustomHeights();
  }
  drawCoastline();
  drawRelief();
  const keepData = states.length && manors.length;
  if (keepData) {
    restoreRegions();
  } else {
    generateCultures();
    manorsAndRegions();
  }
  cleanData();
  console.timeEnd('TOTAL');
}

// fireTemplateElDist selector handlers
function fireTemplateElDist() {
  if (this.value === 'interval') {
    const interval = prompt('Populate a height interval (e.g. from 17 to 20), without space, but with hyphen', '17-20');
    if (interval) {
      const option = `<option value="${interval}">${interval}</option>`;
      $(this).append(option).val(interval);
    }
  }
}

// drag any element changing transform
function elementDrag() {
  const el = d3.select(this);
  const tr = parseTransform(el.attr('transform'));
  const dx = +tr[0] - d3.event.x;
  const dy = +tr[1] - d3.event.y;

  d3.event.on('drag', () => {
    const x = d3.event.x;
    const y = d3.event.y;
    const transform = `translate(${(dx + x)},${(dy + y)}) rotate(${tr[2]} ${tr[3]} ${tr[4]})`;
    el.attr('transform', transform);
    const pp = this.parentNode.parentNode.id;
    if (pp === 'burgIcons' || pp === 'burgLabels') {
      tip('Use dragging for fine-tuning only, to move burg to a different cell use "Relocate" button'); // eslint-disable-line
    }

    if (pp === 'labels') {
      // also transform curve control circle
      debug.select('circle').attr('transform', transform);
    }
  });

  d3.event.on('end', () => {
    // remember scaleBar bottom-right position
    if (el.attr('id') === 'scaleBar') {
      const xEnd = d3.event.x;
      const yEnd = d3.event.y;
      const diff = Math.abs(dx - xEnd) + Math.abs(dy - yEnd);
      if (diff > 5) {
        const bbox = el.node().getBoundingClientRect();
        sessionStorage.setItem('scaleBar', [bbox.right, bbox.bottom]);
      }
    }
  });
}

// Get cell info on mouse move (useful for debugging)
function moved() {
  const point = d3.mouse(this);
  const i = diagram.find(point[0], point[1]).index;

  // update cellInfo
  if (i) {
    const p = cells[i]; // get cell
    infoX.innerHTML = rn(point[0]);
    infoY.innerHTML = rn(point[1]);
    infoCell.innerHTML = i;
    infoArea.innerHTML = ifDefined(p.area, 'n/a', 2);
    if (customization === 1) {
      infoHeight.innerHTML = getFriendlyHeight(heights[i]);
    } else {
      infoHeight.innerHTML = getFriendlyHeight(p.height);
    }
    infoFlux.innerHTML = ifDefined(p.flux, 'n/a', 2);
    const country = p.region === undefined ? 'n/a' : p.region === 'neutral' ? 'neutral' : `${states[p.region].name} (${p.region})`;
    infoCountry.innerHTML = country;
    const culture = ifDefined(p.culture) !== 'no' ? `${cultures[p.culture].name} (${p.culture})` : 'n/a';
    infoCulture.innerHTML = culture;
    infoPopulation.innerHTML = ifDefined(p.pop, 'n/a', 2);
    infoBurg.innerHTML = ifDefined(p.manor) !== 'no' ? `${manors[p.manor].name} (${p.manor})` : 'no';
    const feature = features[p.fn];
    if (feature !== undefined) {
      const fType = feature.land ? 'Island' : feature.border ? 'Ocean' : 'Lake';
      infoFeature.innerHTML = `${fType} (${p.fn})`;
    } else {
      infoFeature.innerHTML = 'n/a';
    }
  }

  // update tooltip
  if (toggleTooltips.checked) {
    tooltip.innerHTML = tooltip.getAttribute('data-main');
    const tag = event.target.tagName;
    const path = event.composedPath();
    const group = path[path.length - 7].id;
    const subgroup = path[path.length - 8].id;
    if (group === 'rivers') {
      tip('Click to open River Editor');
    }
    if (group === 'routes') {
      tip('Click to open Route Editor');
    }
    if (group === 'terrain') {
      tip('Click to open Relief Icon Editor');
    }
    if (group === 'labels') {
      tip('Click to open Label Editor');
    }
    if (group === 'icons') {
      tip('Click to open Icon Editor');
    }
    if (group === 'markers') {
      tip('Click to open Marker Editor');
    }
    if (group === 'ruler') {
      if (tag === 'path' || tag === 'line') {
        tip('Drag to move the measurer');
      }
      if (tag === 'text') {
        tip('Click to remove the measurer');
      }
      if (tag === 'circle') {
        tip('Drag to adjust the measurer');
      }
    }
    if (subgroup === 'burgIcons') {
      tip('Click to open Burg Editor');
    }
    if (subgroup === 'burgLabels') {
      tip('Click to open Burg Editor');
    }

    // show legend on hover (if any)
    let id = event.target.id;
    if (id === '') {
      id = event.target.parentNode.id;
    }
    if (subgroup === 'burgLabels') {
      id = `burg${event.target.getAttribute('data-id')}`;
    }

    const note = notes.find((note) => note.id === id);
    const legend = document.getElementById('legend');
    const legendHeader = document.getElementById('legendHeader');
    const legendBody = document.getElementById('legendBody');
    if (note !== undefined && note.legend !== '') {
      legend.style.display = 'block';
      legendHeader.innerHTML = note.name;
      legendBody.innerHTML = note.legend;
    } else {
      legend.style.display = 'none';
      legendHeader.innerHTML = '';
      legendBody.innerHTML = '';
    }
  }

  // draw line for ranges placing for heightmap Customization
  if (customization === 1) {
    const line = debug.selectAll('.line');
    if (debug.selectAll('.tag').size() === 1) {
      const x = +debug.select('.tag').attr('cx');
      const y = +debug.select('.tag').attr('cy');
      if (line.size()) {
        line.attr('x1', x).attr('y1', y).attr('x2', point[0]).attr('y2', point[1]);
      } else {
        debug.insert('line', ':first-child').attr('class', 'line')
          .attr('x1', x).attr('y1', y)
          .attr('x2', point[0])
          .attr('y2', point[1]);
      }
    } else {
      line.remove();
    }
  }

  // change radius circle for Customization
  if (customization > 0) {
    const brush = $('#brushesButtons > .pressed');
    const brushId = brush.attr('id');
    if (brushId === 'brushRange' || brushId === 'brushTrough') {
      return;
    }
    if (customization !== 5 && !brush.length && !$('div.selected').length) {
      return;
    }
    let radius = 0;
    if (customization === 1) {
      radius = brushRadius.value;
      if (brushId === 'brushHill' || brushId === 'brushPit') {
        radius = Math.pow(brushPower.value * 4, 0.5);
      }
    } else if (customization === 2) {
      radius = countriesManuallyBrush.value;
    } else if (customization === 4) {
      radius = culturesManuallyBrush.value;
    } else if (customization === 5) {
      radius = reliefBulkRemoveRadius.value;
    }

    const r = rn(6 / graphSize * radius, 1);
    let clr = '#373737';
    if (customization === 2) {
      const state = +$('div.selected').attr('id').slice(5);
      clr = states[state].color === 'neutral' ? 'white' : states[state].color;
    }
    if (customization === 4) {
      const culture = +$('div.selected').attr('id').slice(7);
      clr = cultures[culture].color;
    }
    moveCircle(point[0], point[1], r, clr);
  }
}

// Mouseclick events
function placeLinearFeature() {
  const point = d3.mouse(this);
  const index = getIndex(point);
  let tag = debug.selectAll('.tag');
  if (!tag.size()) {
    tag = debug.append('circle').attr('data-cell', index).attr('class', 'tag')
      .attr('r', 3)
      .attr('cx', point[0])
      .attr('cy', point[1]);
  } else {
    const from = +tag.attr('data-cell');
    debug.selectAll('.tag, .line').remove();
    const power = +brushPower.value;
    const mod = $('#brushesButtons > .pressed').attr('id') === 'brushRange' ? 1 : -1;
    const selection = addRange(mod, power, from, index);
    updateHeightmapSelection(selection);
  }
}

// restore default drag (map panning) and cursor
function restoreDefaultEvents() {
  viewbox.style('cursor', 'default').on('.drag', null).on('click', null);
}

// remove parent element (usually if child is clicked)
function removeParent() {
  $(this.parentNode).remove();
}

// change transparency for modal windowa
function changeDialogsTransparency(v) {
  localStorage.setItem('transparency', v);
  const alpha = (100 - +v) / 100;
  const optionsColor = `rgba(164, 139, 149, ${alpha})`; // purple-red
  const dialogsColor = `rgba(255, 255, 255, ${alpha})`; // white
  document.getElementById('options').style.backgroundColor = optionsColor;
  document.getElementById('dialogs').style.backgroundColor = dialogsColor;
}

// draw ruler circles and update label
function rulerEdgeDrag() {
  const group = d3.select(this.parentNode);
  const edge = d3.select(this).attr('data-edge');
  const x = d3.event.x,
    y = d3.event.y;
  let x0,
    y0;
  d3.select(this).attr('cx', x).attr('cy', y);
  const line = group.selectAll('line');
  if (edge === 'left') {
    line.attr('x1', x).attr('y1', y);
    x0 = +line.attr('x2'), y0 = +line.attr('y2');
  } else {
    line.attr('x2', x).attr('y2', y);
    x0 = +line.attr('x1'), y0 = +line.attr('y1');
  }
  const xc = rn((x + x0) / 2, 2),
    yc = rn((y + y0) / 2, 2);
  group.select('.center').attr('cx', xc).attr('cy', yc);
  const dist = rn(Math.hypot(x0 - x, y0 - y));
  const label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
  const atan = x0 > x ? Math.atan2(y0 - y, x0 - x) : Math.atan2(y - y0, x - x0);
  const angle = rn(atan * 180 / Math.PI, 3);
  const tr = `rotate(${angle} ${xc} ${yc})`;
  group.select('text').attr('x', xc).attr('y', yc).attr('transform', tr)
    .attr('data-dist', dist)
    .text(label);
}

// clear elSelected variable
function unselect() {
  tip('', true);
  restoreDefaultEvents();
  if (customization === 5) {
    customization = 0;
  }
  if (!elSelected) {
    return;
  }
  elSelected.call(d3.drag().on('drag', null)).attr('class', null);
  debug.selectAll('*').remove();
  viewbox.style('cursor', 'default');
  elSelected = null;
}

// Show help
function showHelp() {
  $('#help').dialog({
    title: 'About Fantasy Map Generator',
    minHeight: 30,
    width: 'auto',
    maxWidth: 275,
    resizable: false,
    position: {
      my: 'center top+10',
      at: 'bottom',
      of: this
    },
    close: unselect
  });
}

function openBrushesPanel() {
  if ($('#brushesPanel').is(':visible')) {
    return;
  }
  $('#brushesPanel').dialog({
    title: 'Paint Brushes',
    minHeight: 40,
    width: 'auto',
    maxWidth: 200,
    resizable: false,
    position: {
      my: 'right top',
      at: 'right-10 top+10',
      of: 'svg'
    }
  }).on('dialogclose', () => {
    restoreDefaultEvents();
    $('#brushesButtons > .pressed').removeClass('pressed');
  });

  if (modules.openBrushesPanel) {
    return;
  }
  modules.openBrushesPanel = true;

  $('#brushesButtons > button').on('click', function () {
    const rSlider = $('#brushRadiusLabel, #brushRadius');
    debug.selectAll('.circle, .tag, .line').remove();
    if ($(this).hasClass('pressed')) {
      $(this).removeClass('pressed');
      restoreDefaultEvents();
      rSlider.attr('disabled', true).addClass('disabled');
    } else {
      $('#brushesButtons > .pressed').removeClass('pressed');
      $(this).addClass('pressed');
      viewbox.style('cursor', 'crosshair');
      const id = this.id;
      if (id === 'brushRange' || id === 'brushTrough') {
        viewbox.on('click', placeLinearFeature);
      } // on click brushes
      else {
        viewbox.call(drag).on('click', null);
      } // on drag brushes
      if ($(this).hasClass('feature')) {
        rSlider.attr('disabled', true).addClass('disabled');
      } else {
        rSlider.attr('disabled', false).removeClass('disabled');
      }
    }
  });
}

function projectIsometric(x, y) {
  const scale = 1,
    yProj = 4;
  return [(x - y) * scale, (x + y) / yProj * scale];
}

function selectColor() {
  landmass.selectAll('.selectedCell').classed('selectedCell', 0);
  const el = d3.select(this);
  if (el.classed('selectedColor')) {
    el.classed('selectedColor', 0);
  } else {
    $('.selectedColor').removeClass('selectedColor');
    el.classed('selectedColor', 1);
    $('#colorScheme .hoveredColor').removeClass('hoveredColor');
    $('#colorsSelectValue').text(0);
    if (el.attr('data-height')) {
      const height = el.attr('data-height');
      $(`#colorScheme div[data-color='${height}']`).addClass('hoveredColor');
      $('#colorsSelectValue').text(height);
    }
    const color = `#${d3.select(this).attr('id')}`;
    landmass.selectAll('path').classed('selectedCell', 0);
    landmass.selectAll(`path[fill='${color}']`).classed('selectedCell', 1);
  }
}

// Remove all customization related styles, reset values
function exitCustomization() {
  customization = 0;
  tip('', true);
  canvas.style.opacity = 0;
  $('#customizationMenu').slideUp();
  $('#getMap').addClass('buttonoff').removeClass('glow');
  $('#landmass').empty();
  $('#grid').empty().fadeOut();
  $('#toggleGrid').addClass('buttonoff');
  restoreDefaultEvents();
  if (!$('#toggleHeight').hasClass('buttonoff')) {
    Toggle.height();
  }
  closeDialogs();
  history = [];
  historyStage = 0;
  $('#customizeHeightmap').slideUp();
  $('#openEditor').slideDown();
  debug.selectAll('.circle, .tag, .line').remove();
}

// remove all labels in group including textPaths
function removeAllLabelsInGroup(group) {
  labels.select(`#${group}`).selectAll('text').each(function () {
    defs.select(`#textPath_${this.id}`).remove();
    this.remove();
  });
  if (group !== 'countries') {
    labels.select(`#${group}`).remove();
    updateLabelGroups();
  }
}

function calculateFriendlyOverlaySize() {
  let size = styleOverlaySize.value;
  if (styleOverlayType.value === 'windrose') {
    styleOverlaySizeFriendly.innerHTML = '';
    return;
  }
  if (styleOverlayType.value === 'pointyHex' || styleOverlayType.value === 'flatHex') {
    size *= Math.cos(30 * Math.PI / 180) * 2;
  }
  const friendly = `(${rn(size * distanceScale.value)} ${distanceUnit.value})`;
  styleOverlaySizeFriendly.value = friendly;
}

export {
  fireTemplateElDist,
  elementDrag,
  moved,
  placeLinearFeature,
  restoreDefaultEvents,
  removeParent,
  changeDialogsTransparency,
  rulerEdgeDrag,
  unselect,
  getMap,
  showHelp,
  openBrushesPanel,
  projectIsometric,
  selectColor,
  exitCustomization,
  removeAllLabelsInGroup,
  calculateFriendlyOverlaySize
};
