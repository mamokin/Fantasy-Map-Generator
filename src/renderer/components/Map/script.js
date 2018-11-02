// eslint-disable

// Fantasy Map Generator main script
// Azgaar (maxganiev@yandex.com). Minsk, 2017-2018
// https://github.com/Azgaar/Fantasy-Map-Generator
// GNU General Public License v3.0

// To programmers:
// I don't mind of any help with programming
// I know the code is badly structurized and it's hard to read it as a single page
// Meanwhile a core part takes only 300-500 lines

// What should be done generally:
// Refactor the code
// Modernize the code (ES6)
// Optimize the code
// Modulize the code

// And particularry:
// Migrate from d3-voronoi to mapbox-delunator or d3-delaunay
// Use typed arrays instead of array of objects
// Get rid of jQuery as d3.js can almost all the same and more
// Re-build UI on reactive approach, vue.js

// 'use strict';
import * as d3 from 'd3';
import $ from 'jquery';
import * as C from './Const';
import * as U from './Utils';

function tip(tip, main, error) {
  const tooltip = d3.select('#tooltip');
  const reg = 'linear-gradient(0.1turn, #ffffff00, #5e5c5c4d, #ffffff00)';
  const red = 'linear-gradient(0.1turn, #ffffff00, #c71d1d66, #ffffff00)';
  tooltip.text(tip).style('background', error ? red : reg);
  if (main) {
    tooltip.attr('data-main', tip);
  }
}

function fantasyMap() {
  C.labels.append('g').attr('id', 'countries');
  C.burgIcons.append('g').attr('id', 'capitals');
  C.burgLabels.append('g').attr('id', 'capitals');
  C.burgIcons.append('g').attr('id', 'towns');
  C.burgLabels.append('g').attr('id', 'towns');
  C.icons.append('g').attr('id', 'capital-anchors');
  C.icons.append('g').attr('id', 'town-anchors');
  C.terrain.append('g').attr('id', 'hills');
  C.terrain.append('g').attr('id', 'mounts');
  C.terrain.append('g').attr('id', 'swamps');
  C.terrain.append('g').attr('id', 'forests');

  // append ocean pattern
  C.oceanPattern.append('rect').attr('fill', 'url(#oceanic)').attr('stroke', 'none');
  C.oceanLayers.append('rect').attr('id', 'oceanBase');

  // main data variables
  let seed;
  let params;
  let voronoi;
  let diagram;
  let polygons;
  let spacing;
  let points = [];
  let heights;
  // Common variables
  const modules = {};
  let customization = 0;
  let history = [];
  let historyStage = 0;
  let elSelected;
  let autoResize = true;
  let graphSize;
  let cells = [];
  let land = [];
  let riversData = [];
  let manors = [];
  let states = [];
  let features = [];
  let notes = [];
  let fonts = C.fonts;
  // let queue = [];

  // Cultures-related data
  const chain = {};
  const vowels = 'aeiouy';
  let defaultCultures = [];
  let cultures = [];
  let nameBases = [];
  let nameBase = [];
  let cultureTree;

  // Color schemes
  const color = d3.scaleSequential(d3.interpolateSpectral);
  const colors8 = d3.scaleOrdinal(d3.schemeSet2);
  const colors20 = d3.scaleOrdinal(d3.schemeCategory20);

  // D3 drag and zoom behavior
  let scale = 1;
  let viewX = 0;
  let viewY = 0;

  // change transparency for modal windowa
  function changeDialogsTransparency(v) {
    localStorage.setItem('transparency', v);
    const alpha = (100 - +v) / 100;
    const optionsColor = `rgba(164, 139, 149, ${alpha})`; // purple-red
    const dialogsColor = `rgba(255, 255, 255, ${alpha})`; // white
    document.getElementById('options').style.backgroundColor = optionsColor;
    document.getElementById('dialogs').style.backgroundColor = dialogsColor;
  }

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

  applyStoredOptions();
  let graphWidth = +mapWidthInput.value; // voronoi graph extention, should be stable for each map
  let graphHeight = +mapHeightInput.value;
  let svgWidth = graphWidth;
  let svgHeight = graphHeight; // svg canvas resolution, can vary for each map

  // Active zooming
  function invokeActiveZooming() {
    // toggle shade/blur filter on zoom
    let filter = scale > 2.6 ? 'url(#blurFilter)' : 'url(#dropShadow)';
    if (scale > 1.5 && scale <= 2.6) {
      filter = null;
    }
    coastline.attr('filter', filter);
    // rescale lables on zoom (active zooming)
    labels.selectAll('g').each(() => {
      const el = d3.select(this);
      if (el.attr('id') === 'burgLabels') {
        return;
      }
      const desired = +el.attr('data-size');
      const doubledD = desired + desired;
      let relative = rn((doubledD / scale) / 2, 2);
      if (relative < 2) {
        relative = 2;
      }
      el.attr('font-size', relative);
      if (hideLabels.checked) {
        el.classed('hidden', relative * scale < 6);
        updateLabelGroups();
      }
    });

    // rescale map markers
    markers.selectAll('use').each(() => {
      const el = d3.select(this);
      const x = +el.attr('data-x');
      const y = +el.attr('data-y');
      const desired = +el.attr('data-size');
      let size = (desired * 5) + (25 / scale);
      if (size < 1) {
        size = 1;
      }
      el
        .attr('x', x - (size / 2))
        .attr('y', y - size)
        .attr('width', size)
        .attr('height', size);
    });

    if (ruler.size()) {
      if (ruler.style('display') !== 'none') {
        if (ruler.selectAll('g').size() < 1) {
          return;
        }
        const factor = rn(1 / Math.pow(scale, 0.3), 1);
        ruler
          .selectAll('circle:not(.center)')
          .attr('r', 2 * factor)
          .attr('stroke-width', 0.5 * factor);
        ruler
          .selectAll('circle.center')
          .attr('r', 1.2 * factor)
          .attr('stroke-width', 0.3 * factor);
        ruler
          .selectAll('text')
          .attr('font-size', 10 * factor);
        ruler
          .selectAll('line, path')
          .attr('stroke-width', factor);
      }
    }
  }

  // transform string to array [translateX,translateY,rotateDeg,rotateX,rotateY,scale]
  function parseTransform(string) {
    if (!string) {
      return [0, 0, 0, 0, 0, 1];
    }
    const a = string.replace(/[a-z()]/g, '').replace(/[ ]/g, ',').split(',');
    return [a[0] || 0, a[1] || 0, a[2] || 0, a[3] || 0, a[4] || 0, a[5] || 1];
  }

  // drag any element changing transform
  function elementDrag() {
    const el = d3.select(this);
    const tr = parseTransform(el.attr('transform'));
    const dx = +tr[0] - d3.event.x;
    const dy = +tr[1] - d3.event.y;

    d3.event.on('drag', function () {
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

  // restore default drag (map panning) and cursor
  function restoreDefaultEvents() {
    viewbox.style('cursor', 'default').on('.drag', null).on('click', null);
  }

  function add(start, type, height) {
    const session = Math.ceil(Math.random() * 1e5);
    const radius = type === 'mountain' ? mRadius : hRadius;
    let hRadius;
    let mRadius;
    switch (+graphSize) {
      case 1:
        hRadius = 0.991;
        mRadius = 0.91;
        break;
      case 2:
        hRadius = 0.9967;
        mRadius = 0.951;
        break;
      case 3:
        hRadius = 0.999;
        mRadius = 0.975;
        break;
      case 4:
        hRadius = 0.9994;
        mRadius = 0.98;
        break;
    }
    const queue = [start];
    if (type === 'mountain') {
      heights[start] = height;
    }
    for (let i = 0; i < queue.length && height >= 1; i++) {
      if (type === 'mountain') {
        height = (heights[queue[i]] * radius) - (height / 100);
      } else {
        height *= radius;
      }
      cells[queue[i]].neighbors.forEach((e) => {
        if (cells[e].used === session) {
          return;
        }
        const mod = (Math.random() * 0.2) + 0.9; // 0.9-1.1 random factor
        heights[e] += height * mod;
        if (heights[e] > 100) {
          heights[e] = 100;
        }
        cells[e].used = session;
        queue.push(e);
      });
    }
  }

  function addPit(count, height, cell) {
    const session = Math.ceil(Math.random() * 1e5);
    for (let c = 0; c < count; c++) {
      let change = height ? height + 10 : (Math.random() * 10) + 20;
      let start = cell;
      if (!start) {
        const lowlands = $.grep(cells, (e) => (heights[e.index] >= 20));
        if (!lowlands.length) {
          return;
        }
        const rnd = Math.floor(Math.random() * lowlands.length);
        start = lowlands[rnd].index;
      }
      let query = [start];
      let newQuery = [];
      // depress pit center
      heights[start] -= change;
      if (heights[start] < 5 || heights[start] > 100) {
        heights[start] = 5;
      }
      cells[start].used = session;
      for (let i = 1; i < 10000; i++) {
        const rnd = (Math.random() * 0.4) + 0.8;
        change -= (i / 0.6) * rnd;
        if (change < 1) {
          break;
        }
        query.map((p) => {
          cells[p].neighbors.forEach((e) => {
            if (cells[e].used === session) {
              return;
            }
            cells[e].used = session;
            if (Math.random() > 0.8) {
              return;
            }
            newQuery.push(e);
            heights[e] -= change;
            if (heights[e] < 5 || heights[e] > 100) {
              heights[e] = 5;
            }
          });
        });
        query = newQuery.slice();
        newQuery = [];
      }
    }
  }

  // move brush radius circle
  function moveCircle(x, y, r, c) {
    let circle = debug.selectAll('.circle');
    if (!circle.size()) {
      circle = debug.insert('circle', ':first-child').attr('class', 'circle');
    }
    circle.attr('cx', x).attr('cy', y);
    if (r) {
      circle.attr('r', r);
    }
    if (c) {
      circle.attr('stroke', c);
    }
  }

  // update cells in radius if non-feature brush selected
  function updateCellsInRadius(cell, source) {
    const power = +brushPower.value;
    let radius = +brushRadius.value;
    const brush = $('#brushesButtons > .pressed').attr('id');
    if ($('#brushesButtons > .pressed').hasClass('feature')) {
      return;
    }
    // define selection besed on radius
    let selection = [cell];
    if (radius > 1) {
      selection = selection.concat(cells[cell].neighbors);
    }
    if (radius > 2) {
      let frontier = cells[cell].neighbors;
      while (radius > 2) {
        const cycle = frontier.slice();
        frontier = [];
        cycle.map((s) => {
          cells[s].neighbors.forEach((e) => {
            if (selection.indexOf(e) !== -1) {
              return;
            }
            selection.push(e);
            frontier.push(e);
          });
        });
        radius--; // eslint-disable-line
      }
    }
    // change each cell in the selection
    const sourceHeight = heights[source];
    selection.map((s) => {
      // calculate changes
      if (brush === 'brushElevate') {
        if (heights[s] < 20) {
          heights[s] = 20;
        } else {
          heights[s] += power;
        }
        if (heights[s] > 100) {
          heights[s] = 100;
        }
      }
      if (brush === 'brushDepress') {
        heights[s] -= power;
        if (heights[s] > 100) {
          heights[s] = 0;
        }
      }
      if (brush === 'brushAlign') {
        heights[s] = sourceHeight;
      }
      if (brush === 'brushSmooth') {
        const hs = [heights[s]];
        cells[s].neighbors.forEach((e) => {
          hs.push(heights[e]);
        });
        heights[s] = (heights[s] + d3.mean(hs)) / 2;
      }

      return heights;
    });
    updateHeightmapSelection(selection);
  }

  // define selection based on radius
  function defineBrushSelection(center, r) {
    let radius = r;
    let selection = [center];
    if (radius > 1) {
      selection = selection.concat(cells[center].neighbors);
    }
    selection = $.grep(selection, (e) => cells[e].height >= 20);
    if (radius === 2) {
      return selection;
    }
    let frontier = cells[center].neighbors;
    while (radius > 2) {
      const cycle = frontier.slice();
      frontier = [];
      cycle.map((s) => {
        cells[s].neighbors.forEach((e) => {
          if (selection.indexOf(e) !== -1) {
            return;
          }
          // if (cells[e].height < 20) return;
          selection.push(e);
          frontier.push(e);
        });
      });
      radius--;
    }
    selection = $.grep(selection, (e) => cells[e].height >= 20);
    return selection;
  }

  // change region within selection
  function changeStateForSelection(selection) {
    if (selection.length === 0) {
      return;
    }
    const temp = regions.select('#temp');
    const stateNew = +$('div.selected').attr('id').slice(5);
    const color = states[stateNew].color === 'neutral' ? 'white' : states[stateNew].color;
    selection.map((index) => {
      // keep stateOld and stateNew as integers!
      const exists = temp.select(`path[data-cell='${index }']`);
      const region = cells[index].region === 'neutral' ? states.length - 1 : cells[index].region;
      const stateOld = exists.size() ? +exists.attr('data-state') : region;
      if (stateNew === stateOld) {
        return;
      }
      if (states[stateOld].capital === cells[index].manor) {
        return;
      } // not allowed to re-draw calitals
      // change of append new element
      if (exists.size()) {
        exists.attr('data-state', stateNew).attr('fill', color).attr('stroke', color);
      } else {
        temp.append('path').attr('data-cell', index).attr('data-state', stateNew)
          .attr('d', `M${polygons[index].join('L') }Z`)
          .attr('fill', color)
          .attr('stroke', color);
      }
    });
  }

  // change culture within selection
  function changeCultureForSelection(selection) {
    if (selection.length === 0) {
      return;
    }
    const cultureNew = +$('div.selected').attr('id').slice(7);
    const clr = cultures[cultureNew].color;
    selection.map((index) => {
      const cult = cults.select(`#cult${index}`);
      const cultureOld = cult.attr('data-culture') !== null ?
        +cult.attr('data-culture') :
        cells[index].culture;
      if (cultureOld === cultureNew) {
        return;
      }
      cult.attr('data-culture', cultureNew).attr('fill', clr).attr('stroke', clr);
    });
  }

  // D3 Line generator variables
  const lineGen = d3.line().x((d) => d.scX).y((d) => d.scY).curve(d3.curveCatmullRom);

  // Drag actions
  function dragstarted() {
    const x0 = d3.event.x;
    const y0 = d3.event.y;
    const c0 = diagram.find(x0, y0).index;
    let points = '';
    let curve = '';
    let text = '';
    let curveGray = '';
    let c1 = c0;
    let x1;
    let y1;
    const opisometer = $('#addOpisometer').hasClass('pressed');
    const planimeter = $('#addPlanimeter').hasClass('pressed');
    const factor = rn(1 / Math.pow(scale, 0.3), 1);

    if (opisometer || planimeter) {
      $('#ruler').show();
      const type = opisometer ? 'opisometer' : 'planimeter';
      const rulerNew = ruler
        .append('g')
        .attr('class', type)
        .call(d3.drag().on('start', elementDrag));
      points = [{
        scX: rn(x0, 2),
        scY: rn(y0, 2)
      }];
      if (opisometer) {
        curve = rulerNew
          .append('path')
          .attr('class', 'opisometer white')
          .attr('stroke-width', factor);
        const dash = rn(30 / distanceScale.value, 2);
        curveGray = rulerNew
          .append('path')
          .attr('class', 'opisometer gray')
          .attr('stroke-dasharray', dash)
          .attr('stroke-width', factor);
      } else {
        curve = rulerNew
          .append('path')
          .attr('class', 'planimeter')
          .attr('stroke-width', factor);
      }
      text = rulerNew
        .append('text')
        .attr('dy', -1)
        .attr('font-size', 10 * factor);
    }

    d3.event.on('drag', () => {
      x1 = d3.event.x, y1 = d3.event.y; // eslint-disable-line
      const c2 = diagram.find(x1, y1).index;

      // Heightmap customization
      if (customization === 1) {
        if (c2 === c1 && x1 !== x0 && y1 !== y0) {
          return;
        }
        c1 = c2;
        const brush = $('#brushesButtons > .pressed');
        const id = brush.attr('id');
        const power = +brushPower.value;
        if (id === 'brushHill') {
          add(c2, 'hill', power);
          updateHeightmap();
        }
        if (id === 'brushPit') {
          addPit(1, power, c2);
          updateHeightmap();
        }
        if (id !== 'brushRange' || id !== 'brushTrough') {
          // move a circle to show approximate change radius
          moveCircle(x1, y1);
          updateCellsInRadius(c2, c0);
        }
      }

      // Countries / cultures manuall assignment
      if (customization === 2 || customization === 4) {
        if ($('div.selected').length === 0) {
          return;
        }
        if (c2 === c1) {
          return;
        }
        c1 = c2;
        const radius = customization === 2 ? +countriesManuallyBrush.value : +culturesManuallyBrush.value;
        const r = rn((6 / graphSize) * radius, 1);
        moveCircle(x1, y1, r);
        const selection = defineBrushSelection(c2, radius);
        if (selection) {
          if (customization === 2) {
            changeStateForSelection(selection);
          }
          if (customization === 4) {
            changeCultureForSelection(selection);
          }
        }
      }

      if (opisometer || planimeter) {
        const l = points[points.length - 1];
        const diff = Math.hypot(l.scX - x1, l.scY - y1);
        if (diff > 5) {
          points.push({
            scX: x1,
            scY: y1
          });
        }
        if (opisometer) {
          lineGen.curve(d3.curveBasis);
          curve.attr('d', d);
          curveGray.attr('d', d);
          const dist = rn(curve.node().getTotalLength());
          const label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
          text.attr('x', x1).attr('y', y1 - 10).text(label);
        } else {
          lineGen.curve(d3.curveBasisClosed);
          curve.attr('d', d);
        }
        let d = round(lineGen(points));
      }
    });

    d3.event.on('end', () => {
      if (customization === 1) {
        updateHistory();
      }
      if (opisometer || planimeter) {
        $('#addOpisometer, #addPlanimeter').removeClass('pressed');
        restoreDefaultEvents();
        if (opisometer) {
          const dist = rn(curve.node().getTotalLength());
          const c = curve.node().getPointAtLength(dist / 2);
          const p = curve.node().getPointAtLength((dist / 2) - 1);
          const label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
          const atan = p.x > c.x ?
            Math.atan2(p.y - c.y, p.x - c.x) :
            Math.atan2(c.y - p.y, c.x - p.x);
          const angle = rn(atan * 180 / Math.PI, 3);
          const tr = `rotate(${ angle } ${c.x } ${c.y })`;
          text.attr('data-points', JSON.stringify(points)).attr('data-dist', dist).attr('x', c.x).attr('y', c.y)
            .attr('transform', tr)
            .text(label)
            .on('click', removeParent);
          rulerNew.append('circle').attr('cx', points[0].scX).attr('cy', points[0].scY).attr('r', 2 * factor)
            .attr('stroke-width', 0.5 * factor)
            .attr('data-edge', 'start')
            .call(d3.drag().on('start', opisometerEdgeDrag));
          rulerNew.append('circle').attr('cx', points[points.length - 1].scX).attr('cy', points[points.length - 1].scY).attr('r', 2 * factor)
            .attr('stroke-width', 0.5 * factor)
            .attr('data-edge', 'end')
            .call(d3.drag().on('start', opisometerEdgeDrag));
        } else {
          const vertices = points.map((p) => [p.scX, p.scY]);
          const area = rn(Math.abs(d3.polygonArea(vertices))); // initial area as positive integer
          let areaConv = area * Math.pow(distanceScale.value, 2); // convert area to distanceScale
          areaConv = si(areaConv);
          if (areaUnit.value === 'square') {
            areaConv += ` ${distanceUnit.value }²`;
          } else {
            areaConv += ` ${ areaUnit.value}`;
          }
          const c = polylabel([vertices], 1.0); // pole of inaccessibility
          text.attr('x', rn(c[0], 2)).attr('y', rn(c[1], 2)).attr('data-area', area).text(areaConv)
            .on('click', removeParent);
        }
      }
    });
  }

  const drag = d3.drag()
    .container(function () {
      return this;
    })
    .subject(() => {
      const p = [d3.event.x, d3.event.y];
      return [p, p];
    })
    .on('start', dragstarted);


  U.addDragToUpload();

  // Changelog dialog window
  const storedVersion = localStorage.getItem('version'); // show message on load
  if (storedVersion != version) {
    alertMessage.innerHTML = `<b>2018-29-23</b>:
      The <i>Fantasy Map Generator</i> is updated up to version <b>${version}</b>.
      Main changes:<br><br>
      <li>Map Markers</li>
      <li>Legend Editor (text notes)</li>
      <li>Bug fixes</li>
      <br>See a <a href='https://www.reddit.com/r/FantasyMapGenerator/comments/9iarje/update_new_version_is_published_v060b' target='_blank'>dedicated post</a> for the details.
      <br><br>
      <i>Join our <a href='https://www.reddit.com/r/FantasyMapGenerator/' target='_blank'>Reddit community</a>
      to share created maps, discuss the Generator, report bugs, ask questions and propose new features.
      You may also report bugs <a href='https://github.com/Azgaar/Fantasy-Map-Generator/issues' target='_blank'>here</a>.</i>`;

    $('#alert').dialog({
      resizable: false,
      title: 'Fantasy Map Generator update',
      width: 320,
      buttons: {
        'Don\'t show again': function () {
          localStorage.setItem('version', version);
          $(this).dialog('close');
        },
        Close() {
          $(this).dialog('close');
        }
      },
      position: {
        my: 'center',
        at: 'center',
        of: 'svg'
      }
    });
  }

  // get or generate map seed
  function getSeed() {
    const url = new URL(window.location.href);
    params = url.searchParams;
    seed = params.get('seed') || Math.floor(Math.random() * 1e9);
    console.log(` seed: ${seed}`);
    optionsSeed.value = seed;
    Math.seedrandom(seed);
  }

  getSeed(); // get and set random generator seed
  applyNamesData(); // apply default namesbase on load
  generate(); // generate map on load
  applyDefaultStyle(); // apply style on load
  focusOn(); // based on searchParams focus on point, cell or burg from MFCG
  invokeActiveZooming(); // to hide what need to be hidden

  // function updateURL() {
  //   const url = new URL(window.location.href);
  //   url.searchParams.set('seed', seed);
  //   if (url.protocol !== 'file:') {
  //     window.history.pushState({
  //       seed
  //     }, "", "url.search");
  //   }
  // }

  function restoreDefaultOptions() {
    // remove ALL saved data from LocalStorage
    localStorage.clear();
    // set defaut values
    mapWidthInput.value = window.innerWidth;
    mapHeightInput.value = window.innerHeight;
    changeMapSize();
    graphSize = sizeInput.value = sizeOutput.value = 1;
    $('#options i[class^=\'icon-lock\']').each(function () {
      this.setAttribute('data-locked', 0);
      this.className = 'icon-lock-open';
      if (this.id === 'lockNeutralInput' || this.id === 'lockSwampinessInput') {
        this.setAttribute('data-locked', 1);
        this.className = 'icon-lock';
      }
    });
    neutralInput.value = neutralOutput.value = 200;
    swampinessInput.value = swampinessOutput.value = 10;
    outlineLayersInput.value = '-6,-3,-1';
    transparencyInput.value = transparencyOutput.value = 0;
    changeDialogsTransparency(0);
    pngResolutionInput.value = 5;
    pngResolutionOutput.value = '5x';
    randomizeOptions();
  }

  // apply names data from localStorage if available
  function applyNamesData() {
    applyDefaultNamesData();
    defaultCultures = [{
      name: 'Shwazen',
      color: '#b3b3b3',
      base: 0
    },
    {
      name: 'Angshire',
      color: '#fca463',
      base: 1
    },
    {
      name: 'Luari',
      color: '#99acfb',
      base: 2
    },
    {
      name: 'Tallian',
      color: '#a6d854',
      base: 3
    },
    {
      name: 'Toledi',
      color: '#ffd92f',
      base: 4
    },
    {
      name: 'Slovian',
      color: '#e5c494',
      base: 5
    },
    {
      name: 'Norse',
      color: '#dca3e4',
      base: 6
    },
    {
      name: 'Elladian',
      color: '#66c4a0',
      base: 7
    },
    {
      name: 'Latian',
      color: '#ff7174',
      base: 8
    },
    {
      name: 'Soomi',
      color: '#85c8fa',
      base: 9
    },
    {
      name: 'Koryo',
      color: '#578880',
      base: 10
    },
    {
      name: 'Hantzu',
      color: '#becb8d',
      base: 11
    },
    {
      name: 'Yamoto',
      color: '#ffd9da',
      base: 12
    }
    ];
  }

  // apply default names data
  function applyDefaultNamesData() {
    nameBases = [ // min; max; mean; common
      {
        name: 'German',
        method: 'let-to-syl',
        min: 4,
        max: 11,
        d: 'lt',
        m: 0.1
      }, // real: 3; 17; 8.6; 8
      {
        name: 'English',
        method: 'let-to-syl',
        min: 5,
        max: 10,
        d: '',
        m: 0.3
      }, // real: 4; 13; 7.9; 8
      {
        name: 'French',
        method: 'let-to-syl',
        min: 4,
        max: 10,
        d: 'lns',
        m: 0.3
      }, // real: 3; 15; 7.6; 6
      {
        name: 'Italian',
        method: 'let-to-syl',
        min: 4,
        max: 11,
        d: 'clrt',
        m: 0.2
      }, // real: 4; 14; 7.7; 7
      {
        name: 'Castillian',
        method: 'let-to-syl',
        min: 4,
        max: 10,
        d: 'lr',
        m: 0
      }, // real: 2; 13; 7.5; 8
      {
        name: 'Ruthenian',
        method: 'let-to-syl',
        min: 4,
        max: 9,
        d: '',
        m: 0
      }, // real: 3; 12; 7.1; 7
      {
        name: 'Nordic',
        method: 'let-to-syl',
        min: 5,
        max: 9,
        d: 'kln',
        m: 0.1
      }, // real: 3; 12; 7.5; 6
      {
        name: 'Greek',
        method: 'let-to-syl',
        min: 4,
        max: 10,
        d: 'ls',
        m: 0.2
      }, // real: 3; 14; 7.1; 6
      {
        name: 'Roman',
        method: 'let-to-syl',
        min: 5,
        max: 10,
        d: '',
        m: 1
      }, // real: 3; 15; 8.0; 7
      {
        name: 'Finnic',
        method: 'let-to-syl',
        min: 3,
        max: 10,
        d: 'aktu',
        m: 0
      }, // real: 3; 13; 7.5; 6
      {
        name: 'Korean',
        method: 'let-to-syl',
        min: 5,
        max: 10,
        d: '',
        m: 0
      }, // real: 3; 13; 6.8; 7
      {
        name: 'Chinese',
        method: 'let-to-syl',
        min: 5,
        max: 9,
        d: '',
        m: 0
      }, // real: 4; 11; 6.9; 6
      {
        name: 'Japanese',
        method: 'let-to-syl',
        min: 3,
        max: 9,
        d: '',
        m: 0
      } // real: 2; 15; 6.8; 6
    ];
    nameBase = [
      ['Achern', 'Aichhalden', 'Aitern', 'Albbruck', 'Alpirsbach', 'Altensteig', 'Althengstett', 'Appenweier', 'Auggen', 'Wildbad', 'Badenen', 'Badenweiler', 'Baiersbronn', 'Ballrechten', 'Bellingen', 'Berghaupten', 'Bernau', 'Biberach', 'Biederbach', 'Binzen', 'Birkendorf', 'Birkenfeld', 'Bischweier', 'Blumberg', 'Bollen', 'Bollschweil', 'Bonndorf', 'Bosingen', 'Braunlingen', 'Breisach', 'Breisgau', 'Breitnau', 'Brigachtal', 'Buchenbach', 'Buggingen', 'Buhl', 'Buhlertal', 'Calw', 'Dachsberg', 'Dobel', 'Donaueschingen', 'Dornhan', 'Dornstetten', 'Dottingen', 'Dunningen', 'Durbach', 'Durrheim', 'Ebhausen', 'Ebringen', 'Efringen', 'Egenhausen', 'Ehrenkirchen', 'Ehrsberg', 'Eimeldingen', 'Eisenbach', 'Elzach', 'Elztal', 'Emmendingen', 'Endingen', 'Engelsbrand', 'Enz', 'Enzklosterle', 'Eschbronn', 'Ettenheim', 'Ettlingen', 'Feldberg', 'Fischerbach', 'Fischingen', 'Fluorn', 'Forbach', 'Freiamt', 'Freiburg', 'Freudenstadt', 'Friedenweiler', 'Friesenheim', 'Frohnd', 'Furtwangen', 'Gaggenau', 'Geisingen', 'Gengenbach', 'Gernsbach', 'Glatt', 'Glatten', 'Glottertal', 'Gorwihl', 'Gottenheim', 'Grafenhausen', 'Grenzach', 'Griesbach', 'Gutach', 'Gutenbach', 'Hag', 'Haiterbach', 'Hardt', 'Harmersbach', 'Hasel', 'Haslach', 'Hausach', 'Hausen', 'Hausern', 'Heitersheim', 'Herbolzheim', 'Herrenalb', 'Herrischried', 'Hinterzarten', 'Hochenschwand', 'Hofen', 'Hofstetten', 'Hohberg', 'Horb', 'Horben', 'Hornberg', 'Hufingen', 'Ibach', 'Ihringen', 'Inzlingen', 'Kandern', 'Kappel', 'Kappelrodeck', 'Karlsbad', 'Karlsruhe', 'Kehl', 'Keltern', 'Kippenheim', 'Kirchzarten', 'Konigsfeld', 'Krozingen', 'Kuppenheim', 'Kussaberg', 'Lahr', 'Lauchringen', 'Lauf', 'Laufenburg', 'Lautenbach', 'Lauterbach', 'Lenzkirch', 'Liebenzell', 'Loffenau', 'Loffingen', 'Lorrach', 'Lossburg', 'Mahlberg', 'Malsburg', 'Malsch', 'March', 'Marxzell', 'Marzell', 'Maulburg', 'Monchweiler', 'Muhlenbach', 'Mullheim', 'Munstertal', 'Murg', 'Nagold', 'Neubulach', 'Neuenburg', 'Neuhausen', 'Neuried', 'Neuweiler', 'Niedereschach', 'Nordrach', 'Oberharmersbach', 'Oberkirch', 'Oberndorf', 'Oberbach', 'Oberried', 'Oberwolfach', 'Offenburg', 'Ohlsbach', 'Oppenau', 'Ortenberg', 'otigheim', 'Ottenhofen', 'Ottersweier', 'Peterstal', 'Pfaffenweiler', 'Pfalzgrafenweiler', 'Pforzheim', 'Rastatt', 'Renchen', 'Rheinau', 'Rheinfelden', 'Rheinmunster', 'Rickenbach', 'Rippoldsau', 'Rohrdorf', 'Rottweil', 'Rummingen', 'Rust', 'Sackingen', 'Sasbach', 'Sasbachwalden', 'Schallbach', 'Schallstadt', 'Schapbach', 'Schenkenzell', 'Schiltach', 'Schliengen', 'Schluchsee', 'Schomberg', 'Schonach', 'Schonau', 'Schonenberg', 'Schonwald', 'Schopfheim', 'Schopfloch', 'Schramberg', 'Schuttertal', 'Schwenningen', 'Schworstadt', 'Seebach', 'Seelbach', 'Seewald', 'Sexau', 'Simmersfeld', 'Simonswald', 'Sinzheim', 'Solden', 'Staufen', 'Stegen', 'Steinach', 'Steinen', 'Steinmauern', 'Straubenhardt', 'Stuhlingen', 'Sulz', 'Sulzburg', 'Teinach', 'Tiefenbronn', 'Tiengen', 'Titisee', 'Todtmoos', 'Todtnau', 'Todtnauberg', 'Triberg', 'Tunau', 'Tuningen', 'uhlingen', 'Unterkirnach', 'Reichenbach', 'Utzenfeld', 'Villingen', 'Villingendorf', 'Vogtsburg', 'Vohrenbach', 'Waldachtal', 'Waldbronn', 'Waldkirch', 'Waldshut', 'Wehr', 'Weil', 'Weilheim', 'Weisenbach', 'Wembach', 'Wieden', 'Wiesental', 'Wildberg', 'Winzeln', 'Wittlingen', 'Wittnau', 'Wolfach', 'Wutach', 'Wutoschingen', 'Wyhlen', 'Zavelstein'],
      ['Abingdon', 'Albrighton', 'Alcester', 'Almondbury', 'Altrincham', 'Amersham', 'Andover', 'Appleby', 'Ashboume', 'Atherstone', 'Aveton', 'Axbridge', 'Aylesbury', 'Baldock', 'Bamburgh', 'Barton', 'Basingstoke', 'Berden', 'Bere', 'Berkeley', 'Berwick', 'Betley', 'Bideford', 'Bingley', 'Birmingham', 'Blandford', 'Blechingley', 'Bodmin', 'Bolton', 'Bootham', 'Boroughbridge', 'Boscastle', 'Bossinney', 'Bramber', 'Brampton', 'Brasted', 'Bretford', 'Bridgetown', 'Bridlington', 'Bromyard', 'Bruton', 'Buckingham', 'Bungay', 'Burton', 'Calne', 'Cambridge', 'Canterbury', 'Carlisle', 'Castleton', 'Caus', 'Charmouth', 'Chawleigh', 'Chichester', 'Chillington', 'Chinnor', 'Chipping', 'Chisbury', 'Cleobury', 'Clifford', 'Clifton', 'Clitheroe', 'Cockermouth', 'Coleshill', 'Combe', 'Congleton', 'Crafthole', 'Crediton', 'Cuddenbeck', 'Dalton', 'Darlington', 'Dodbrooke', 'Drax', 'Dudley', 'Dunstable', 'Dunster', 'Dunwich', 'Durham', 'Dymock', 'Exeter', 'Exning', 'Faringdon', 'Felton', 'Fenny', 'Finedon', 'Flookburgh', 'Fowey', 'Frampton', 'Gateshead', 'Gatton', 'Godmanchester', 'Grampound', 'Grantham', 'Guildford', 'Halesowen', 'Halton', 'Harbottle', 'Harlow', 'Hatfield', 'Hatherleigh', 'Haydon', 'Helston', 'Henley', 'Hertford', 'Heytesbury', 'Hinckley', 'Hitchin', 'Holme', 'Hornby', 'Horsham', 'Kendal', 'Kenilworth', 'Kilkhampton', 'Kineton', 'Kington', 'Kinver', 'Kirby', 'Knaresborough', 'Knutsford', 'Launceston', 'Leighton', 'Lewes', 'Linton', 'Louth', 'Luton', 'Lyme', 'Lympstone', 'Macclesfield', 'Madeley', 'Malborough', 'Maldon', 'Manchester', 'Manningtree', 'Marazion', 'Marlborough', 'Marshfield', 'Mere', 'Merryfield', 'Middlewich', 'Midhurst', 'Milborne', 'Mitford', 'Modbury', 'Montacute', 'Mousehole', 'Newbiggin', 'Newborough', 'Newbury', 'Newenden', 'Newent', 'Norham', 'Northleach', 'Noss', 'Oakham', 'Olney', 'Orford', 'Ormskirk', 'Oswestry', 'Padstow', 'Paignton', 'Penkneth', 'Penrith', 'Penzance', 'Pershore', 'Petersfield', 'Pevensey', 'Pickering', 'Pilton', 'Pontefract', 'Portsmouth', 'Preston', 'Quatford', 'Reading', 'Redcliff', 'Retford', 'Rockingham', 'Romney', 'Rothbury', 'Rothwell', 'Salisbury', 'Saltash', 'Seaford', 'Seasalter', 'Sherston', 'Shifnal', 'Shoreham', 'Sidmouth', 'Skipsea', 'Skipton', 'Solihull', 'Somerton', 'Southam', 'Southwark', 'Standon', 'Stansted', 'Stapleton', 'Stottesdon', 'Sudbury', 'Swavesey', 'Tamerton', 'Tarporley', 'Tetbury', 'Thatcham', 'Thaxted', 'Thetford', 'Thornbury', 'Tintagel', 'Tiverton', 'Torksey', 'Totnes', 'Towcester', 'Tregoney', 'Trematon', 'Tutbury', 'Uxbridge', 'Wallingford', 'Wareham', 'Warenmouth', 'Wargrave', 'Warton', 'Watchet', 'Watford', 'Wendover', 'Westbury', 'Westcheap', 'Weymouth', 'Whitford', 'Wickwar', 'Wigan', 'Wigmore', 'Winchelsea', 'Winkleigh', 'Wiscombe', 'Witham', 'Witheridge', 'Wiveliscombe', 'Woodbury', 'Yeovil'],
      ['Adon', 'Aillant', 'Amilly', 'Andonville', 'Ardon', 'Artenay', 'Ascheres', 'Ascoux', 'Attray', 'Aubin', 'Audeville', 'Aulnay', 'Autruy', 'Auvilliers', 'Auxy', 'Aveyron', 'Baccon', 'Bardon', 'Barville', 'Batilly', 'Baule', 'Bazoches', 'Beauchamps', 'Beaugency', 'Beaulieu', 'Beaune', 'Bellegarde', 'Boesses', 'Boigny', 'Boiscommun', 'Boismorand', 'Boisseaux', 'Bondaroy', 'Bonnee', 'Bonny', 'Bordes', 'Bou', 'Bougy', 'Bouilly', 'Boulay', 'Bouzonville', 'Bouzy', 'Boynes', 'Bray', 'Breteau', 'Briare', 'Briarres', 'Bricy', 'Bromeilles', 'Bucy', 'Cepoy', 'Cercottes', 'Cerdon', 'Cernoy', 'Cesarville', 'Chailly', 'Chaingy', 'Chalette', 'Chambon', 'Champoulet', 'Chanteau', 'Chantecoq', 'Chapell', 'Charme', 'Charmont', 'Charsonville', 'Chateau', 'Chateauneuf', 'Chatel', 'Chatenoy', 'Chatillon', 'Chaussy', 'Checy', 'Chevannes', 'Chevillon', 'Chevilly', 'Chevry', 'Chilleurs', 'Choux', 'Chuelles', 'Clery', 'Coinces', 'Coligny', 'Combleux', 'Combreux', 'Conflans', 'Corbeilles', 'Corquilleroy', 'Cortrat', 'Coudroy', 'Coullons', 'Coulmiers', 'Courcelles', 'Courcy', 'Courtemaux', 'Courtempierre', 'Courtenay', 'Cravant', 'Crottes', 'Dadonville', 'Dammarie', 'Dampierre', 'Darvoy', 'Desmonts', 'Dimancheville', 'Donnery', 'Dordives', 'Dossainville', 'Douchy', 'Dry', 'Echilleuses', 'Egry', 'Engenville', 'Epieds', 'Erceville', 'Ervauville', 'Escrennes', 'Escrignelles', 'Estouy', 'Faverelles', 'Fay', 'Feins', 'Ferolles', 'Ferrieres', 'Fleury', 'Fontenay', 'Foret', 'Foucherolles', 'Freville', 'Gatinais', 'Gaubertin', 'Gemigny', 'Germigny', 'Gidy', 'Gien', 'Girolles', 'Givraines', 'Gondreville', 'Grangermont', 'Greneville', 'Griselles', 'Guigneville', 'Guilly', 'Gyleslonains', 'Huetre', 'Huisseau', 'Ingrannes', 'Ingre', 'Intville', 'Isdes', 'Jargeau', 'Jouy', 'Juranville', 'Bussiere', 'Laas', 'Ladon', 'Lailly', 'Langesse', 'Leouville', 'Ligny', 'Lombreuil', 'Lorcy', 'Lorris', 'Loury', 'Louzouer', 'Malesherbois', 'Marcilly', 'Mardie', 'Mareau', 'Marigny', 'Marsainvilliers', 'Melleroy', 'Menestreau', 'Merinville', 'Messas', 'Meung', 'Mezieres', 'Migneres', 'Mignerette', 'Mirabeau', 'Montargis', 'Montbarrois', 'Montbouy', 'Montcresson', 'Montereau', 'Montigny', 'Montliard', 'Mormant', 'Morville', 'Moulinet', 'Moulon', 'Nancray', 'Nargis', 'Nesploy', 'Neuville', 'Neuvy', 'Nevoy', 'Nibelle', 'Nogent', 'Noyers', 'Ocre', 'Oison', 'Olivet', 'Ondreville', 'Onzerain', 'Orleans', 'Ormes', 'Orville', 'Oussoy', 'Outarville', 'Ouzouer', 'Pannecieres', 'Pannes', 'Patay', 'Paucourt', 'Pers', 'Pierrefitte', 'Pithiverais', 'Pithiviers', 'Poilly', 'Potier', 'Prefontaines', 'Presnoy', 'Pressigny', 'Puiseaux', 'Quiers', 'Ramoulu', 'Rebrechien', 'Rouvray', 'Rozieres', 'Rozoy', 'Ruan', 'Sandillon', 'Santeau', 'Saran', 'Sceaux', 'Seichebrieres', 'Semoy', 'Sennely', 'Sermaises', 'Sigloy', 'Solterre', 'Sougy', 'Sully', 'Sury', 'Tavers', 'Thignonville', 'Thimory', 'Thorailles', 'Thou', 'Tigy', 'Tivernon', 'Tournoisis', 'Trainou', 'Treilles', 'Trigueres', 'Trinay', 'Vannes', 'Varennes', 'Vennecy', 'Vieilles', 'Vienne', 'Viglain', 'Vignes', 'Villamblain', 'Villemandeur', 'Villemoutiers', 'Villemurlin', 'Villeneuve', 'Villereau', 'Villevoques', 'Villorceau', 'Vimory', 'Vitry', 'Vrigny', 'Ivre'],
      ['Accumoli', 'Acquafondata', 'Acquapendente', 'Acuto', 'Affile', 'Agosta', 'Alatri', 'Albano', 'Allumiere', 'Alvito', 'Amaseno', 'Amatrice', 'Anagni', 'Anguillara', 'Anticoli', 'Antrodoco', 'Anzio', 'Aprilia', 'Aquino', 'Arce', 'Arcinazzo', 'Ardea', 'Ariccia', 'Arlena', 'Arnara', 'Arpino', 'Arsoli', 'Artena', 'Ascrea', 'Atina', 'Ausonia', 'Bagnoregio', 'Barbarano', 'Bassano', 'Bassiano', 'Bellegra', 'Belmonte', 'Blera', 'Bolsena', 'Bomarzo', 'Borbona', 'Borgo', 'Borgorose', 'Boville', 'Bracciano', 'Broccostella', 'Calcata', 'Camerata', 'Campagnano', 'Campodimele', 'Campoli', 'Canale', 'Canepina', 'Canino', 'Cantalice', 'Cantalupo', 'Canterano', 'Capena', 'Capodimonte', 'Capranica', 'Caprarola', 'Carbognano', 'Casalattico', 'Casalvieri', 'Casape', 'Casaprota', 'Casperia', 'Cassino', 'Castelforte', 'Castelliri', 'Castello', 'Castelnuovo', 'Castiglione', 'Castro', 'Castrocielo', 'Cave', 'Ceccano', 'Celleno', 'Cellere', 'Ceprano', 'Cerreto', 'Cervara', 'Cervaro', 'Cerveteri', 'Ciampino', 'Ciciliano', 'Cineto', 'Cisterna', 'Cittaducale', 'Cittareale', 'Civita', 'Civitavecchia', 'Civitella', 'Colfelice', 'Collalto', 'Colle', 'Colleferro', 'Collegiove', 'Collepardo', 'Collevecchio', 'Colli', 'Colonna', 'Concerviano', 'Configni', 'Contigliano', 'Corchiano', 'Coreno', 'Cori', 'Cottanello', 'Esperia', 'Fabrica', 'Faleria', 'Falvaterra', 'Fara', 'Farnese', 'Ferentino', 'Fiamignano', 'Fiano', 'Filacciano', 'Filettino', 'Fiuggi', 'Fiumicino', 'Fondi', 'Fontana', 'Fonte', 'Fontechiari', 'Forano', 'Formello', 'Formia', 'Frascati', 'Frasso', 'Frosinone', 'Fumone', 'Gaeta', 'Gallese', 'Gallicano', 'Gallinaro', 'Gavignano', 'Genazzano', 'Genzano', 'Gerano', 'Giuliano', 'Gorga', 'Gradoli', 'Graffignano', 'Greccio', 'Grottaferrata', 'Grotte', 'Guarcino', 'Guidonia', 'Ischia', 'Isola', 'Itri', 'Jenne', 'Labico', 'Labro', 'Ladispoli', 'Lanuvio', 'Lariano', 'Latera', 'Lenola', 'Leonessa', 'Licenza', 'Longone', 'Lubriano', 'Maenza', 'Magliano', 'Mandela', 'Manziana', 'Marano', 'Marcellina', 'Marcetelli', 'Marino', 'Marta', 'Mazzano', 'Mentana', 'Micigliano', 'Minturno', 'Mompeo', 'Montalto', 'Montasola', 'Monte', 'Montebuono', 'Montefiascone', 'Monteflavio', 'Montelanico', 'Monteleone', 'Montelibretti', 'Montenero', 'Monterosi', 'Monterotondo', 'Montopoli', 'Montorio', 'Moricone', 'Morlupo', 'Morolo', 'Morro', 'Nazzano', 'Nemi', 'Nepi', 'Nerola', 'Nespolo', 'Nettuno', 'Norma', 'Olevano', 'Onano', 'Oriolo', 'Orte', 'Orvinio', 'Paganico', 'Palestrina', 'Paliano', 'Palombara', 'Pastena', 'Patrica', 'Percile', 'Pescorocchiano', 'Pescosolido', 'Petrella', 'Piansano', 'Picinisco', 'Pico', 'Piedimonte', 'Piglio', 'Pignataro', 'Pisoniano', 'Pofi', 'Poggio', 'Poli', 'Pomezia', 'Pontecorvo', 'Pontinia', 'Ponza', 'Ponzano', 'Posta', 'Pozzaglia', 'Priverno', 'Proceno', 'Prossedi', 'Riano', 'Rieti', 'Rignano', 'Riofreddo', 'Ripi', 'Rivodutri', 'Rocca', 'Roccagiovine', 'Roccagorga', 'Roccantica', 'Roccasecca', 'Roiate', 'Ronciglione', 'Roviano', 'Sabaudia', 'Sacrofano', 'Salisano', 'Sambuci', 'Santa', 'Santi', 'Santopadre', 'Saracinesco', 'Scandriglia', 'Segni', 'Selci', 'Sermoneta', 'Serrone', 'Settefrati', 'Sezze', 'Sgurgola', 'Sonnino', 'Sora', 'Soriano', 'Sperlonga', 'Spigno', 'Stimigliano', 'Strangolagalli', 'Subiaco', 'Supino', 'Sutri', 'Tarano', 'Tarquinia', 'Terelle', 'Terracina', 'Tessennano', 'Tivoli', 'Toffia', 'Tolfa', 'Torre', 'Torri', 'Torrice', 'Torricella', 'Torrita', 'Trevi', 'Trevignano', 'Trivigliano', 'Turania', 'Tuscania', 'Vacone', 'Valentano', 'Vallecorsa', 'Vallemaio', 'Vallepietra', 'Vallerano', 'Vallerotonda', 'Vallinfreda', 'Valmontone', 'Varco', 'Vasanello', 'Vejano', 'Velletri', 'Ventotene', 'Veroli', 'Vetralla', 'Vicalvi', 'Vico', 'Vicovaro', 'Vignanello', 'Viterbo', 'Viticuso', 'Vitorchiano', 'Vivaro', 'Zagarolo'],
      ['Abanades', 'Ablanque', 'Adobes', 'Ajofrin', 'Alameda', 'Alaminos', 'Alarilla', 'Albalate', 'Albares', 'Albarreal', 'Albendiego', 'Alcabon', 'Alcanizo', 'Alcaudete', 'Alcocer', 'Alcolea', 'Alcoroches', 'Aldea', 'Aldeanueva', 'Algar', 'Algora', 'Alhondiga', 'Alique', 'Almadrones', 'Almendral', 'Almoguera', 'Almonacid', 'Almorox', 'Alocen', 'Alovera', 'Alustante', 'Angon', 'Anguita', 'Anover', 'Anquela', 'Arbancon', 'Arbeteta', 'Arcicollar', 'Argecilla', 'Arges', 'Armallones', 'Armuna', 'Arroyo', 'Atanzon', 'Atienza', 'Aunon', 'Azuqueca', 'Azutan', 'Baides', 'Banos', 'Banuelos', 'Barcience', 'Bargas', 'Barriopedro', 'Belvis', 'Berninches', 'Borox', 'Brihuega', 'Budia', 'Buenaventura', 'Bujalaro', 'Burguillos', 'Burujon', 'Bustares', 'Cabanas', 'Cabanillas', 'Calera', 'Caleruela', 'Calzada', 'Camarena', 'Campillo', 'Camunas', 'Canizar', 'Canredondo', 'Cantalojas', 'Cardiel', 'Carmena', 'Carranque', 'Carriches', 'Casa', 'Casarrubios', 'Casas', 'Casasbuenas', 'Caspuenas', 'Castejon', 'Castellar', 'Castilforte', 'Castillo', 'Castilnuevo', 'Cazalegas', 'Cebolla', 'Cedillo', 'Cendejas', 'Centenera', 'Cervera', 'Checa', 'Chequilla', 'Chillaron', 'Chiloeches', 'Chozas', 'Chueca', 'Cifuentes', 'Cincovillas', 'Ciruelas', 'Ciruelos', 'Cobeja', 'Cobeta', 'Cobisa', 'Cogollor', 'Cogolludo', 'Condemios', 'Congostrina', 'Consuegra', 'Copernal', 'Corduente', 'Corral', 'Cuerva', 'Domingo', 'Dosbarrios', 'Driebes', 'Duron', 'El', 'Embid', 'Erustes', 'Escalona', 'Escalonilla', 'Escamilla', 'Escariche', 'Escopete', 'Espinosa', 'Espinoso', 'Esplegares', 'Esquivias', 'Estables', 'Estriegana', 'Fontanar', 'Fuembellida', 'Fuensalida', 'Fuentelsaz', 'Gajanejos', 'Galve', 'Galvez', 'Garciotum', 'Gascuena', 'Gerindote', 'Guadamur', 'Henche', 'Heras', 'Herreria', 'Herreruela', 'Hijes', 'Hinojosa', 'Hita', 'Hombrados', 'Hontanar', 'Hontoba', 'Horche', 'Hormigos', 'Huecas', 'Huermeces', 'Huerta', 'Hueva', 'Humanes', 'Illan', 'Illana', 'Illescas', 'Iniestola', 'Irueste', 'Jadraque', 'Jirueque', 'Lagartera', 'Las', 'Layos', 'Ledanca', 'Lillo', 'Lominchar', 'Loranca', 'Los', 'Lucillos', 'Lupiana', 'Luzaga', 'Luzon', 'Madridejos', 'Magan', 'Majaelrayo', 'Malaga', 'Malaguilla', 'Malpica', 'Mandayona', 'Mantiel', 'Manzaneque', 'Maqueda', 'Maranchon', 'Marchamalo', 'Marjaliza', 'Marrupe', 'Mascaraque', 'Masegoso', 'Matarrubia', 'Matillas', 'Mazarete', 'Mazuecos', 'Medranda', 'Megina', 'Mejorada', 'Mentrida', 'Mesegar', 'Miedes', 'Miguel', 'Millana', 'Milmarcos', 'Mirabueno', 'Miralrio', 'Mocejon', 'Mochales', 'Mohedas', 'Molina', 'Monasterio', 'Mondejar', 'Montarron', 'Mora', 'Moratilla', 'Morenilla', 'Muduex', 'Nambroca', 'Navalcan', 'Negredo', 'Noblejas', 'Noez', 'Nombela', 'Noves', 'Numancia', 'Nuno', 'Ocana', 'Ocentejo', 'Olias', 'Olmeda', 'Ontigola', 'Orea', 'Orgaz', 'Oropesa', 'Otero', 'Palmaces', 'Palomeque', 'Pantoja', 'Pardos', 'Paredes', 'Pareja', 'Parrillas', 'Pastrana', 'Pelahustan', 'Penalen', 'Penalver', 'Pepino', 'Peralejos', 'Peralveche', 'Pinilla', 'Pioz', 'Piqueras', 'Polan', 'Portillo', 'Poveda', 'Pozo', 'Pradena', 'Prados', 'Puebla', 'Puerto', 'Pulgar', 'Quer', 'Quero', 'Quintanar', 'Quismondo', 'Rebollosa', 'Recas', 'Renera', 'Retamoso', 'Retiendas', 'Riba', 'Rielves', 'Rillo', 'Riofrio', 'Robledillo', 'Robledo', 'Romanillos', 'Romanones', 'Rueda', 'Sacecorbo', 'Sacedon', 'Saelices', 'Salmeron', 'San', 'Santa', 'Santiuste', 'Santo', 'Sartajada', 'Sauca', 'Sayaton', 'Segurilla', 'Selas', 'Semillas', 'Sesena', 'Setiles', 'Sevilleja', 'Sienes', 'Siguenza', 'Solanillos', 'Somolinos', 'Sonseca', 'Sotillo', 'Sotodosos', 'Talavera', 'Tamajon', 'Taragudo', 'Taravilla', 'Tartanedo', 'Tembleque', 'Tendilla', 'Terzaga', 'Tierzo', 'Tordellego', 'Tordelrabano', 'Tordesilos', 'Torija', 'Torralba', 'Torre', 'Torrecilla', 'Torrecuadrada', 'Torrejon', 'Torremocha', 'Torrico', 'Torrijos', 'Torrubia', 'Tortola', 'Tortuera', 'Tortuero', 'Totanes', 'Traid', 'Trijueque', 'Trillo', 'Turleque', 'Uceda', 'Ugena', 'Ujados', 'Urda', 'Utande', 'Valdarachas', 'Valdesotos', 'Valhermoso', 'Valtablado', 'Valverde', 'Velada', 'Viana', 'Vinuelas', 'Yebes', 'Yebra', 'Yelamos', 'Yeles', 'Yepes', 'Yuncler', 'Yunclillos', 'Yuncos', 'Yunquera', 'Zaorejas', 'Zarzuela', 'Zorita'],
      ['Belgorod', 'Beloberezhye', 'Belyi', 'Belz', 'Berestiy', 'Berezhets', 'Berezovets', 'Berezutsk', 'Bobruisk', 'Bolonets', 'Borisov', 'Borovsk', 'Bozhesk', 'Bratslav', 'Bryansk', 'Brynsk', 'Buryn', 'Byhov', 'Chechersk', 'Chemesov', 'Cheremosh', 'Cherlen', 'Chern', 'Chernigov', 'Chernitsa', 'Chernobyl', 'Chernogorod', 'Chertoryesk', 'Chetvertnia', 'Demyansk', 'Derevesk', 'Devyagoresk', 'Dichin', 'Dmitrov', 'Dorogobuch', 'Dorogobuzh', 'Drestvin', 'Drokov', 'Drutsk', 'Dubechin', 'Dubichi', 'Dubki', 'Dubkov', 'Dveren', 'Galich', 'Glebovo', 'Glinsk', 'Goloty', 'Gomiy', 'Gorodets', 'Gorodische', 'Gorodno', 'Gorohovets', 'Goroshin', 'Gorval', 'Goryshon', 'Holm', 'Horobor', 'Hoten', 'Hotin', 'Hotmyzhsk', 'Ilovech', 'Ivan', 'Izborsk', 'Izheslavl', 'Kamenets', 'Kanev', 'Karachev', 'Karna', 'Kavarna', 'Klechesk', 'Klyapech', 'Kolomyya', 'Kolyvan', 'Kopyl', 'Korec', 'Kornik', 'Korochunov', 'Korshev', 'Korsun', 'Koshkin', 'Kotelno', 'Kovyla', 'Kozelsk', 'Kozelsk', 'Kremenets', 'Krichev', 'Krylatsk', 'Ksniatin', 'Kulatsk', 'Kursk', 'Kursk', 'Lebedev', 'Lida', 'Logosko', 'Lomihvost', 'Loshesk', 'Loshichi', 'Lubech', 'Lubno', 'Lubutsk', 'Lutsk', 'Luchin', 'Luki', 'Lukoml', 'Luzha', 'Lvov', 'Mtsensk', 'Mdin', 'Medniki', 'Melecha', 'Merech', 'Meretsk', 'Mescherskoe', 'Meshkovsk', 'Metlitsk', 'Mezetsk', 'Mglin', 'Mihailov', 'Mikitin', 'Mikulino', 'Miloslavichi', 'Mogilev', 'Mologa', 'Moreva', 'Mosalsk', 'Moschiny', 'Mozyr', 'Mstislav', 'Mstislavets', 'Muravin', 'Nemech', 'Nemiza', 'Nerinsk', 'Nichan', 'Novgorod', 'Novogorodok', 'Obolichi', 'Obolensk', 'Obolensk', 'Oleshsk', 'Olgov', 'Omelnik', 'Opoka', 'Opoki', 'Oreshek', 'Orlets', 'Osechen', 'Oster', 'Ostrog', 'Ostrov', 'Perelai', 'Peremil', 'Peremyshl', 'Pererov', 'Peresechen', 'Perevitsk', 'Pereyaslav', 'Pinsk', 'Ples', 'Polotsk', 'Pronsk', 'Proposhesk', 'Punia', 'Putivl', 'Rechitsa', 'Rodno', 'Rogachev', 'Romanov', 'Romny', 'Roslavl', 'Rostislavl', 'Rostovets', 'Rsha', 'Ruza', 'Rybchesk', 'Rylsk', 'Rzhavesk', 'Rzhev', 'Rzhischev', 'Sambor', 'Serensk', 'Serensk', 'Serpeysk', 'Shilov', 'Shuya', 'Sinech', 'Sizhka', 'Skala', 'Slovensk', 'Slutsk', 'Smedin', 'Sneporod', 'Snitin', 'Snovsk', 'Sochevo', 'Sokolec', 'Starica', 'Starodub', 'Stepan', 'Sterzh', 'Streshin', 'Sutesk', 'Svinetsk', 'Svisloch', 'Terebovl', 'Ternov', 'Teshilov', 'Teterin', 'Tiversk', 'Torchevsk', 'Toropets', 'Torzhok', 'Tripolye', 'Trubchevsk', 'Tur', 'Turov', 'Usvyaty', 'Uteshkov', 'Vasilkov', 'Velil', 'Velye', 'Venev', 'Venicha', 'Verderev', 'Vereya', 'Veveresk', 'Viazma', 'Vidbesk', 'Vidychev', 'Voino', 'Volodimer', 'Volok', 'Volyn', 'Vorobesk', 'Voronich', 'Voronok', 'Vorotynsk', 'Vrev', 'Vruchiy', 'Vselug', 'Vyatichsk', 'Vyatka', 'Vyshegorod', 'Vyshgorod', 'Vysokoe', 'Yagniatin', 'Yaropolch', 'Yasenets', 'Yuryev', 'Yuryevets', 'Zaraysk', 'Zhitomel', 'Zholvazh', 'Zizhech', 'Zubkov', 'Zudechev', 'Zvenigorod'],
      ['Akureyri', 'Aldra', 'Alftanes', 'Andenes', 'Austbo', 'Auvog', 'Bakkafjordur', 'Ballangen', 'Bardal', 'Beisfjord', 'Bifrost', 'Bildudalur', 'Bjerka', 'Bjerkvik', 'Bjorkosen', 'Bliksvaer', 'Blokken', 'Blonduos', 'Bolga', 'Bolungarvik', 'Borg', 'Borgarnes', 'Bosmoen', 'Bostad', 'Bostrand', 'Botsvika', 'Brautarholt', 'Breiddalsvik', 'Bringsli', 'Brunahlid', 'Budardalur', 'Byggdakjarni', 'Dalvik', 'Djupivogur', 'Donnes', 'Drageid', 'Drangsnes', 'Egilsstadir', 'Eiteroga', 'Elvenes', 'Engavogen', 'Ertenvog', 'Eskifjordur', 'Evenes', 'Eyrarbakki', 'Fagernes', 'Fallmoen', 'Fellabaer', 'Fenes', 'Finnoya', 'Fjaer', 'Fjelldal', 'Flakstad', 'Flateyri', 'Flostrand', 'Fludir', 'Gardabær', 'Gardur', 'Gimstad', 'Givaer', 'Gjeroy', 'Gladstad', 'Godoya', 'Godoynes', 'Granmoen', 'Gravdal', 'Grenivik', 'Grimsey', 'Grindavik', 'Grytting', 'Hafnir', 'Halsa', 'Hauganes', 'Haugland', 'Hauknes', 'Hella', 'Helland', 'Hellissandur', 'Hestad', 'Higrav', 'Hnifsdalur', 'Hofn', 'Hofsos', 'Holand', 'Holar', 'Holen', 'Holkestad', 'Holmavik', 'Hopen', 'Hovden', 'Hrafnagil', 'Hrisey', 'Husavik', 'Husvik', 'Hvammstangi', 'Hvanneyri', 'Hveragerdi', 'Hvolsvollur', 'Igeroy', 'Indre', 'Inndyr', 'Innhavet', 'Innes', 'Isafjordur', 'Jarklaustur', 'Jarnsreykir', 'Junkerdal', 'Kaldvog', 'Kanstad', 'Karlsoy', 'Kavosen', 'Keflavik', 'Kjelde', 'Kjerstad', 'Klakk', 'Kopasker', 'Kopavogur', 'Korgen', 'Kristnes', 'Krutoga', 'Krystad', 'Kvina', 'Lande', 'Laugar', 'Laugaras', 'Laugarbakki', 'Laugarvatn', 'Laupstad', 'Leines', 'Leira', 'Leiren', 'Leland', 'Lenvika', 'Loding', 'Lodingen', 'Lonsbakki', 'Lopsmarka', 'Lovund', 'Luroy', 'Maela', 'Melahverfi', 'Meloy', 'Mevik', 'Misvaer', 'Mornes', 'Mosfellsbær', 'Moskenes', 'Myken', 'Naurstad', 'Nesberg', 'Nesjahverfi', 'Nesset', 'Nevernes', 'Obygda', 'Ofoten', 'Ogskardet', 'Okervika', 'Oknes', 'Olafsfjordur', 'Oldervika', 'Olstad', 'Onstad', 'Oppeid', 'Oresvika', 'Orsnes', 'Orsvog', 'Osmyra', 'Overdal', 'Prestoya', 'Raudalaekur', 'Raufarhofn', 'Reipo', 'Reykholar', 'Reykholt', 'Reykjahlid', 'Rif', 'Rinoya', 'Rodoy', 'Rognan', 'Rosvika', 'Rovika', 'Salhus', 'Sanden', 'Sandgerdi', 'Sandoker', 'Sandset', 'Sandvika', 'Saudarkrokur', 'Selfoss', 'Selsoya', 'Sennesvik', 'Setso', 'Siglufjordur', 'Silvalen', 'Skagastrond', 'Skjerstad', 'Skonland', 'Skorvogen', 'Skrova', 'Sleneset', 'Snubba', 'Softing', 'Solheim', 'Solheimar', 'Sorarnoy', 'Sorfugloy', 'Sorland', 'Sormela', 'Sorvaer', 'Sovika', 'Stamsund', 'Stamsvika', 'Stave', 'Stokka', 'Stokkseyri', 'Storjord', 'Storo', 'Storvika', 'Strand', 'Straumen', 'Strendene', 'Sudavik', 'Sudureyri', 'Sundoya', 'Sydalen', 'Thingeyri', 'Thorlakshofn', 'Thorshofn', 'Tjarnabyggd', 'Tjotta', 'Tosbotn', 'Traelnes', 'Trofors', 'Trones', 'Tverro', 'Ulvsvog', 'Unnstad', 'Utskor', 'Valla', 'Vandved', 'Varmahlid', 'Vassos', 'Vevelstad', 'Vidrek', 'Vik', 'Vikholmen', 'Vogar', 'Vogehamn', 'Vopnafjordur'],
      ['Abdera', 'Abila', 'Abydos', 'Acanthus', 'Acharnae', 'Actium', 'Adramyttium', 'Aegae', 'Aegina', 'Aegium', 'Aenus', 'Agrinion', 'Aigosthena', 'Akragas', 'Akrai', 'Akrillai', 'Akroinon', 'Akrotiri', 'Alalia', 'Alexandreia', 'Alexandretta', 'Alexandria', 'Alinda', 'Amarynthos', 'Amaseia', 'Ambracia', 'Amida', 'Amisos', 'Amnisos', 'Amphicaea', 'Amphigeneia', 'Amphipolis', 'Amphissa', 'Ankon', 'Antigona', 'Antipatrea', 'Antioch', 'Antioch', 'Antiochia', 'Andros', 'Apamea', 'Aphidnae', 'Apollonia', 'Argos', 'Arsuf', 'Artanes', 'Artemita', 'Argyroupoli', 'Asine', 'Asklepios', 'Aspendos', 'Assus', 'Astacus', 'Athenai', 'Athmonia', 'Aytos', 'Ancient', 'Baris', 'Bhrytos', 'Borysthenes', 'Berge', 'Boura', 'Bouthroton', 'Brauron', 'Byblos', 'Byllis', 'Byzantium', 'Bythinion', 'Callipolis', 'Cebrene', 'Chalcedon', 'Calydon', 'Carystus', 'Chamaizi', 'Chalcis', 'Chersonesos', 'Chios', 'Chytri', 'Clazomenae', 'Cleonae', 'Cnidus', 'Colosse', 'Corcyra', 'Croton', 'Cyme', 'Cyrene', 'Cythera', 'Decelea', 'Delos', 'Delphi', 'Demetrias', 'Dicaearchia', 'Dimale', 'Didyma', 'Dion', 'Dioscurias', 'Dodona', 'Dorylaion', 'Dyme', 'Edessa', 'Elateia', 'Eleusis', 'Eleutherna', 'Emporion', 'Ephesus', 'Ephyra', 'Epidamnos', 'Epidauros', 'Eresos', 'Eretria', 'Erythrae', 'Eubea', 'Gangra', 'Gaza', 'Gela', 'Golgi', 'Gonnos', 'Gorgippia', 'Gournia', 'Gortyn', 'Gythium', 'Hagios', 'Hagia', 'Halicarnassus', 'Halieis', 'Helike', 'Heliopolis', 'Hellespontos', 'Helorus', 'Hemeroskopeion', 'Heraclea', 'Hermione', 'Hermonassa', 'Hierapetra', 'Hierapolis', 'Himera', 'Histria', 'Hubla', 'Hyele', 'Ialysos', 'Iasus', 'Idalium', 'Imbros', 'Iolcus', 'Itanos', 'Ithaca', 'Juktas', 'Kallipolis', 'Kamares', 'Kameiros', 'Kannia', 'Kamarina', 'Kasmenai', 'Katane', 'Kerkinitida', 'Kepoi', 'Kimmerikon', 'Kios', 'Klazomenai', 'Knidos', 'Knossos', 'Korinthos', 'Kos', 'Kourion', 'Kume', 'Kydonia', 'Kynos', 'Kyrenia', 'Lamia', 'Lampsacus', 'Laodicea', 'Lapithos', 'Larissa', 'Lato', 'Laus', 'Lebena', 'Lefkada', 'Lekhaion', 'Leibethra', 'Leontinoi', 'Lepreum', 'Lessa', 'Lilaea', 'Lindus', 'Lissus', 'Epizephyrian', 'Madytos', 'Magnesia', 'Mallia', 'Mantineia', 'Marathon', 'Marmara', 'Maroneia', 'Masis', 'Massalia', 'Megalopolis', 'Megara', 'Mesembria', 'Messene', 'Metapontum', 'Methana', 'Methone', 'Methumna', 'Miletos', 'Misenum', 'Mochlos', 'Monastiraki', 'Morgantina', 'Mulai', 'Mukenai', 'Mylasa', 'Myndus', 'Myonia', 'Myra', 'Myrmekion', 'Mutilene', 'Myos', 'Nauplios', 'Naucratis', 'Naupactus', 'Naxos', 'Neapoli', 'Neapolis', 'Nemea', 'Nicaea', 'Nicopolis', 'Nirou', 'Nymphaion', 'Nysa', 'Oenoe', 'Oenus', 'Odessos', 'Olbia', 'Olous', 'Olympia', 'Olynthus', 'Opus', 'Orchomenus', 'Oricos', 'Orestias', 'Oreus', 'Oropus', 'Onchesmos', 'Pactye', 'Pagasae', 'Palaikastro', 'Pandosia', 'Panticapaeum', 'Paphos', 'Parium', 'Paros', 'Parthenope', 'Patrae', 'Pavlopetri', 'Pegai', 'Pelion', 'Peiraieús', 'Pella', 'Percote', 'Pergamum', 'Petsofa', 'Phaistos', 'Phaleron', 'Phanagoria', 'Pharae', 'Pharnacia', 'Pharos', 'Phaselis', 'Philippi', 'Pithekussa', 'Philippopolis', 'Platanos', 'Phlius', 'Pherae', 'Phocaea', 'Pinara', 'Pisa', 'Pitane', 'Pitiunt', 'Pixous', 'Plataea', 'Poseidonia', 'Potidaea', 'Priapus', 'Priene', 'Prousa', 'Pseira', 'Psychro', 'Pteleum', 'Pydna', 'Pylos', 'Pyrgos', 'Rhamnus', 'Rhegion', 'Rhithymna', 'Rhodes', 'Rhypes', 'Rizinia', 'Salamis', 'Same', 'Samos', 'Scyllaeum', 'Selinus', 'Seleucia', 'Semasus', 'Sestos', 'Scidrus', 'Sicyon', 'Side', 'Sidon', 'Siteia', 'Sinope', 'Siris', 'Sklavokampos', 'Smyrna', 'Soli', 'Sozopolis', 'Sparta', 'Stagirus', 'Stratos', 'Stymphalos', 'Sybaris', 'Surakousai', 'Taras', 'Tanagra', 'Tanais', 'Tauromenion', 'Tegea', 'Temnos', 'Tenedos', 'Tenea', 'Teos', 'Thapsos', 'Thassos', 'Thebai', 'Theodosia', 'Therma', 'Thespiae', 'Thronion', 'Thoricus', 'Thurii', 'Thyreum', 'Thyria', 'Tiruns', 'Tithoraea', 'Tomis', 'Tragurion', 'Trapeze', 'Trapezus', 'Tripolis', 'Troizen', 'Troliton', 'Troy', 'Tylissos', 'Tyras', 'Tyros', 'Tyritake', 'Vasiliki', 'Vathypetros', 'Zakynthos', 'Zakros', 'Zankle'],
      ['Abila', 'Adflexum', 'Adnicrem', 'Aelia', 'Aelius', 'Aeminium', 'Aequum', 'Agrippina', 'Agrippinae', 'Ala', 'Albanianis', 'Ambianum', 'Andautonia', 'Apulum', 'Aquae', 'Aquaegranni', 'Aquensis', 'Aquileia', 'Aquincum', 'Arae', 'Argentoratum', 'Ariminum', 'Ascrivium', 'Atrebatum', 'Atuatuca', 'Augusta', 'Aurelia', 'Aurelianorum', 'Batavar', 'Batavorum', 'Belum', 'Biriciana', 'Blestium', 'Bonames', 'Bonna', 'Bononia', 'Borbetomagus', 'Bovium', 'Bracara', 'Brigantium', 'Burgodunum', 'Caesaraugusta', 'Caesarea', 'Caesaromagus', 'Calleva', 'Camulodunum', 'Cannstatt', 'Cantiacorum', 'Capitolina', 'Castellum', 'Castra', 'Castrum', 'Cibalae', 'Clausentum', 'Colonia', 'Concangis', 'Condate', 'Confluentes', 'Conimbriga', 'Corduba', 'Coria', 'Corieltauvorum', 'Corinium', 'Coriovallum', 'Cornoviorum', 'Danum', 'Deva', 'Divodurum', 'Dobunnorum', 'Drusi', 'Dubris', 'Dumnoniorum', 'Durnovaria', 'Durocobrivis', 'Durocornovium', 'Duroliponte', 'Durovernum', 'Durovigutum', 'Eboracum', 'Edetanorum', 'Emerita', 'Emona', 'Euracini', 'Faventia', 'Flaviae', 'Florentia', 'Forum', 'Gerulata', 'Gerunda', 'Glevensium', 'Hadriani', 'Herculanea', 'Isca', 'Italica', 'Iulia', 'Iuliobrigensium', 'Iuvavum', 'Lactodurum', 'Lagentium', 'Lauri', 'Legionis', 'Lemanis', 'Lentia', 'Lepidi', 'Letocetum', 'Lindinis', 'Lindum', 'Londinium', 'Lopodunum', 'Lousonna', 'Lucus', 'Lugdunum', 'Luguvalium', 'Lutetia', 'Mancunium', 'Marsonia', 'Martius', 'Massa', 'Matilo', 'Mattiacorum', 'Mediolanum', 'Mod', 'Mogontiacum', 'Moridunum', 'Mursa', 'Naissus', 'Nervia', 'Nida', 'Nigrum', 'Novaesium', 'Noviomagus', 'Olicana', 'Ovilava', 'Parisiorum', 'Partiscum', 'Paterna', 'Pistoria', 'Placentia', 'Pollentia', 'Pomaria', 'Pons', 'Portus', 'Praetoria', 'Praetorium', 'Pullum', 'Ragusium', 'Ratae', 'Raurica', 'Regina', 'Regium', 'Regulbium', 'Rigomagus', 'Roma', 'Romula', 'Rutupiae', 'Salassorum', 'Salernum', 'Salona', 'Scalabis', 'Segovia', 'Silurum', 'Sirmium', 'Siscia', 'Sorviodurum', 'Sumelocenna', 'Tarraco', 'Taurinorum', 'Theranda', 'Traiectum', 'Treverorum', 'Tungrorum', 'Turicum', 'Ulpia', 'Valentia', 'Venetiae', 'Venta', 'Verulamium', 'Vesontio', 'Vetera', 'Victoriae', 'Victrix', 'Villa', 'Viminacium', 'Vindelicorum', 'Vindobona', 'Vinovia', 'Viroconium'],
      ['Aanekoski', 'Abjapaluoja', 'Ahlainen', 'Aholanvaara', 'Ahtari', 'Aijala', 'Aimala', 'Akaa', 'Alajarvi', 'Alatornio', 'Alavus', 'Antsla', 'Aspo', 'Bennas', 'Bjorkoby', 'Elva', 'Emasalo', 'Espoo', 'Esse', 'Evitskog', 'Forssa', 'Haapajarvi', 'Haapamaki', 'Haapavesi', 'Haapsalu', 'Haavisto', 'Hameenlinna', 'Hameenmaki', 'Hamina', 'Hanko', 'Harjavalta', 'Hattuvaara', 'Haukipudas', 'Hautajarvi', 'Havumaki', 'Heinola', 'Hetta', 'Hinkabole', 'Hirmula', 'Hossa', 'Huittinen', 'Husula', 'Hyryla', 'Hyvinkaa', 'Iisalmi', 'Ikaalinen', 'Ilmola', 'Imatra', 'Inari', 'Iskmo', 'Itakoski', 'Jamsa', 'Jarvenpaa', 'Jeppo', 'Jioesuu', 'Jiogeva', 'Joensuu', 'Jokela', 'Jokikyla', 'Jokisuu', 'Jormua', 'Juankoski', 'Jungsund', 'Jyvaskyla', 'Kaamasmukka', 'Kaarina', 'Kajaani', 'Kalajoki', 'Kallaste', 'Kankaanpaa', 'Kannus', 'Kardla', 'Karesuvanto', 'Karigasniemi', 'Karkkila', 'Karkku', 'Karksinuia', 'Karpankyla', 'Kaskinen', 'Kasnas', 'Kauhajoki', 'Kauhava', 'Kauniainen', 'Kauvatsa', 'Kehra', 'Keila', 'Kellokoski', 'Kelottijarvi', 'Kemi', 'Kemijarvi', 'Kerava', 'Keuruu', 'Kiikka', 'Kiipu', 'Kilinginiomme', 'Kiljava', 'Kilpisjarvi', 'Kitee', 'Kiuruvesi', 'Kivesjarvi', 'Kiviioli', 'Kivisuo', 'Klaukkala', 'Klovskog', 'Kohtlajarve', 'Kokemaki', 'Kokkola', 'Kolho', 'Koria', 'Koskue', 'Kotka', 'Kouva', 'Kouvola', 'Kristiina', 'Kaupunki', 'Kuhmo', 'Kunda', 'Kuopio', 'Kuressaare', 'Kurikka', 'Kusans', 'Kuusamo', 'Kylmalankyla', 'Lahti', 'Laitila', 'Lankipohja', 'Lansikyla', 'Lappeenranta', 'Lapua', 'Laurila', 'Lautiosaari', 'Lepsama', 'Liedakkala', 'Lieksa', 'Lihula', 'Littoinen', 'Lohja', 'Loimaa', 'Loksa', 'Loviisa', 'Luohuanylipaa', 'Lusi', 'Maardu', 'Maarianhamina', 'Malmi', 'Mantta', 'Masaby', 'Masala', 'Matasvaara', 'Maula', 'Miiluranta', 'Mikkeli', 'Mioisakula', 'Munapirtti', 'Mustvee', 'Muurahainen', 'Naantali', 'Nappa', 'Narpio', 'Nickby', 'Niinimaa', 'Niinisalo', 'Nikkila', 'Nilsia', 'Nivala', 'Nokia', 'Nummela', 'Nuorgam', 'Nurmes', 'Nuvvus', 'Obbnas', 'Oitti', 'Ojakkala', 'Ollola', 'onningeby', 'Orimattila', 'Orivesi', 'Otanmaki', 'Otava', 'Otepaa', 'Oulainen', 'Oulu', 'Outokumpu', 'Paavola', 'Paide', 'Paimio', 'Pakankyla', 'Paldiski', 'Parainen', 'Parkano', 'Parkumaki', 'Parola', 'Perttula', 'Pieksamaki', 'Pietarsaari', 'Pioltsamaa', 'Piolva', 'Pohjavaara', 'Porhola', 'Pori', 'Porrasa', 'Porvoo', 'Pudasjarvi', 'Purmo', 'Pussi', 'Pyhajarvi', 'Raahe', 'Raasepori', 'Raisio', 'Rajamaki', 'Rakvere', 'Rapina', 'Rapla', 'Rauma', 'Rautio', 'Reposaari', 'Riihimaki', 'Rovaniemi', 'Roykka', 'Ruonala', 'Ruottala', 'Rutalahti', 'Saarijarvi', 'Salo', 'Sastamala', 'Saue', 'Savonlinna', 'Seinajoki', 'Sillamae', 'Sindi', 'Siuntio', 'Somero', 'Sompujarvi', 'Suonenjoki', 'Suurejaani', 'Syrjantaka', 'Tampere', 'Tamsalu', 'Tapa', 'Temmes', 'Tiorva', 'Tormasenvaara', 'Tornio', 'Tottijarvi', 'Tulppio', 'Turenki', 'Turi', 'Tuukkala', 'Tuurala', 'Tuuri', 'Tuuski', 'Ulvila', 'Unari', 'Upinniemi', 'Utti', 'Uusikaarlepyy', 'Uusikaupunki', 'Vaaksy', 'Vaalimaa', 'Vaarinmaja', 'Vaasa', 'Vainikkala', 'Valga', 'Valkeakoski', 'Vantaa', 'Varkaus', 'Vehkapera', 'Vehmasmaki', 'Vieki', 'Vierumaki', 'Viitasaari', 'Viljandi', 'Vilppula', 'Viohma', 'Vioru', 'Virrat', 'Ylike', 'Ylivieska', 'Ylojarvi'],
      ['Sabi', 'Wiryeseong', 'Hwando', 'Gungnae', 'Ungjin', 'Wanggeomseong', 'Ganggyeong', 'Jochiwon', 'Cheorwon', 'Beolgyo', 'Gangjin', 'Gampo', 'Yecheon', 'Geochang', 'Janghang', 'Hadong', 'Goseong', 'Yeongdong', 'Yesan', 'Sintaein', 'Geumsan', 'Boseong', 'Jangheung', 'Uiseong', 'Jumunjin', 'Janghowon', 'Hongseong', 'Gimhwa', 'Gwangcheon', 'Guryongpo', 'Jinyeong', 'Buan', 'Damyang', 'Jangseong', 'Wando', 'Angang', 'Okcheon', 'Jeungpyeong', 'Waegwan', 'Cheongdo', 'Gwangyang', 'Gochang', 'Haenam', 'Yeonggwang', 'Hanam', 'Eumseong', 'Daejeong', 'Hanrim', 'Samrye', 'Yongjin', 'Hamyang', 'Buyeo', 'Changnyeong', 'Yeongwol', 'Yeonmu', 'Gurye', 'Hwasun', 'Hampyeong', 'Namji', 'Samnangjin', 'Dogye', 'Hongcheon', 'Munsan', 'Gapyeong', 'Ganghwa', 'Geojin', 'Sangdong', 'Jeongseon', 'Sabuk', 'Seonghwan', 'Heunghae', 'Hapdeok', 'Sapgyo', 'Taean', 'Boeun', 'Geumwang', 'Jincheon', 'Bongdong', 'Doyang', 'Geoncheon', 'Pungsan', 'Punggi', 'Geumho', 'Wonju', 'Gaun', 'Hayang', 'Yeoju', 'Paengseong', 'Yeoncheon', 'Yangpyeong', 'Ganseong', 'Yanggu', 'Yangyang', 'Inje', 'Galmal', 'Pyeongchang', 'Hwacheon', 'Hoengseong', 'Seocheon', 'Cheongyang', 'Goesan', 'Danyang', 'Hamyeol', 'Muju', 'Sunchang', 'Imsil', 'Jangsu', 'Jinan', 'Goheung', 'Gokseong', 'Muan', 'Yeongam', 'Jindo', 'Seonsan', 'Daegaya', 'Gunwi', 'Bonghwa', 'Seongju', 'Yeongdeok', 'Yeongyang', 'Ulleung', 'Uljin', 'Cheongsong', 'wayang', 'Namhae', 'Sancheong', 'Uiryeong', 'Gaya', 'Hapcheon', 'Wabu', 'Dongsong', 'Sindong', 'Wondeok', 'Maepo', 'Anmyeon', 'Okgu', 'Sariwon', 'Dolsan', 'Daedeok', 'Gwansan', 'Geumil', 'Nohwa', 'Baeksu', 'Illo', 'Jido', 'Oedong', 'Ocheon', 'Yeonil', 'Hamchang', 'Pyeonghae', 'Gijang', 'Jeonggwan', 'Aewor', 'Gujwa', 'Seongsan', 'Jeongok', 'Seonggeo', 'Seungju', 'Hongnong', 'Jangan', 'Jocheon', 'Gohan', 'Jinjeop', 'Bubal', 'Beobwon', 'Yeomchi', 'Hwado', 'Daesan', 'Hwawon', 'Apo', 'Nampyeong', 'Munsan', 'Sinbuk', 'Munmak', 'Judeok', 'Bongyang', 'Ungcheon', 'Yugu', 'Unbong', 'Mangyeong', 'Dong', 'Naeseo', 'Sanyang', 'Soheul', 'Onsan', 'Eonyang', 'Nongong', 'Dasa', 'Goa', 'Jillyang', 'Bongdam', 'Naesu', 'Beomseo', 'Opo', 'Gongdo', 'Jingeon', 'Onam', 'Baekseok', 'Jiksan', 'Mokcheon', 'Jori', 'Anjung', 'Samho', 'Ujeong', 'Buksam', 'Tongjin', 'Chowol', 'Gonjiam', 'Pogok', 'Seokjeok', 'Poseung', 'Ochang', 'Hyangnam', 'Baebang', 'Gochon', 'Songak', 'Samhyang', 'Yangchon', 'Osong', 'Aphae', 'Ganam', 'Namyang', 'Chirwon', 'Andong', 'Ansan', 'Anseong', 'Anyang', 'Asan', 'Boryeong', 'Bucheon', 'Busan', 'Changwon', 'Cheonan', 'Cheongju', 'Chuncheon', 'Chungju', 'Daegu', 'Daejeon', 'Dangjin', 'Dongducheon', 'Donghae', 'Gangneung', 'Geoje', 'Gimcheon', 'Gimhae', 'Gimje', 'Gimpo', 'Gongju', 'Goyang', 'Gumi', 'Gunpo', 'Gunsan', 'Guri', 'Gwacheon', 'Gwangju', 'Gwangju', 'Gwangmyeong', 'Gyeongju', 'Gyeongsan', 'Gyeryong', 'Hwaseong', 'Icheon', 'Iksan', 'Incheon', 'Jecheon', 'Jeongeup', 'Jeonju', 'Jeju', 'Jinju', 'Naju', 'Namyangju', 'Namwon', 'Nonsan', 'Miryang', 'Mokpo', 'Mungyeong', 'Osan', 'Paju', 'Pocheon', 'Pohang', 'Pyeongtaek', 'Sacheon', 'Sangju', 'Samcheok', 'Sejong', 'Seogwipo', 'Seongnam', 'Seosan', 'Seoul', 'Siheung', 'Sokcho', 'Suncheon', 'Suwon', 'Taebaek', 'Tongyeong', 'Uijeongbu', 'Uiwang', 'Ulsan', 'Yangju', 'Yangsan', 'Yeongcheon', 'Yeongju', 'Yeosu', 'Yongin', 'Chungmu', 'Daecheon', 'Donggwangyang', 'Geumseong', 'Gyeongseong', 'Iri', 'Jangseungpo', 'Jeomchon', 'Jeongju', 'Migeum', 'Onyang', 'Samcheonpo', 'Busan', 'Busan', 'Cheongju', 'Chuncheon', 'Daegu', 'Daegu', 'Daejeon', 'Daejeon', 'Gunsan', 'Gwangju', 'Gwangju', 'Gyeongseong', 'Incheon', 'Incheon', 'Iri', 'Jeonju', 'Jinhae', 'Jinju', 'Masan', 'Masan', 'Mokpo', 'Songjeong', 'Songtan', 'Ulsan', 'Yeocheon', 'Cheongjin', 'Gaeseong', 'Haeju', 'Hamheung', 'Heungnam', 'Jinnampo', 'Najin', 'Pyeongyang', 'Seongjin', 'Sineuiju', 'Songnim', 'Wonsan'],
      ['Anding', 'Anlu', 'Anqing', 'Anshun', 'Baan', 'Baixing', 'Banyang', 'Baoding', 'Baoqing', 'Binzhou', 'Caozhou', 'Changbai', 'Changchun', 'Changde', 'Changling', 'Changsha', 'Changtu', 'Changzhou', 'Chaozhou', 'Cheli', 'Chengde', 'Chengdu', 'Chenzhou', 'Chizhou', 'Chongqing', 'Chuxiong', 'Chuzhou', 'Dading', 'Dali', 'Daming', 'Datong', 'Daxing', 'Dean', 'Dengke', 'Dengzhou', 'Deqing', 'Dexing', 'Dihua', 'Dingli', 'Dongan', 'Dongchang', 'Dongchuan', 'Dongping', 'Duyun', 'Fengtian', 'Fengxiang', 'Fengyang', 'Fenzhou', 'Funing', 'Fuzhou', 'Ganzhou', 'Gaoyao', 'Gaozhou', 'Gongchang', 'Guangnan', 'Guangning', 'Guangping', 'Guangxin', 'Guangzhou', 'Guide', 'Guilin', 'Guiyang', 'Hailong', 'Hailun', 'Hangzhou', 'Hanyang', 'Hanzhong', 'Heihe', 'Hejian', 'Henan', 'Hengzhou', 'Hezhong', 'Huaian', 'Huaide', 'Huaiqing', 'Huanglong', 'Huangzhou', 'Huining', 'Huizhou', 'Hulan', 'Huzhou', 'Jiading', 'Jian', 'Jianchang', 'Jiande', 'Jiangning', 'Jiankang', 'Jianning', 'Jiaxing', 'Jiayang', 'Jilin', 'Jinan', 'Jingjiang', 'Jingzhao', 'Jingzhou', 'Jinhua', 'Jinzhou', 'Jiujiang', 'Kaifeng', 'Kaihua', 'Kangding', 'Kuizhou', 'Laizhou', 'Lanzhou', 'Leizhou', 'Liangzhou', 'Lianzhou', 'Liaoyang', 'Lijiang', 'Linan', 'Linhuang', 'Linjiang', 'Lintao', 'Liping', 'Liuzhou', 'Longan', 'Longjiang', 'Longqing', 'Longxing', 'Luan', 'Lubin', 'Lubin', 'Luzhou', 'Mishan', 'Nanan', 'Nanchang', 'Nandian', 'Nankang', 'Nanning', 'Nanyang', 'Nenjiang', 'Ningan', 'Ningbo', 'Ningguo', 'Ninguo', 'Ningwu', 'Ningxia', 'Ningyuan', 'Pingjiang', 'Pingle', 'Pingliang', 'Pingyang', 'Puer', 'Puzhou', 'Qianzhou', 'Qingyang', 'Qingyuan', 'Qingzhou', 'Qiongzhou', 'Qujing', 'Quzhou', 'Raozhou', 'Rende', 'Ruian', 'Ruizhou', 'Runing', 'Shafeng', 'Shajing', 'Shaoqing', 'Shaowu', 'Shaoxing', 'Shaozhou', 'Shinan', 'Shiqian', 'Shouchun', 'Shuangcheng', 'Shulei', 'Shunde', 'Shunqing', 'Shuntian', 'Shuoping', 'Sicheng', 'Sien', 'Sinan', 'Sizhou', 'Songjiang', 'Suiding', 'Suihua', 'Suining', 'Suzhou', 'Taian', 'Taibei', 'Tainan', 'Taiping', 'Taiwan', 'Taiyuan', 'Taizhou', 'Taonan', 'Tengchong', 'Tieli', 'Tingzhou', 'Tongchuan', 'Tongqing', 'Tongren', 'Tongzhou', 'Weihui', 'Wensu', 'Wenzhou', 'Wuchang', 'Wuding', 'Wuzhou', 'Xian', 'Xianchun', 'Xianping', 'Xijin', 'Xiliang', 'Xincheng', 'Xingan', 'Xingde', 'Xinghua', 'Xingjing', 'Xingqing', 'Xingyi', 'Xingyuan', 'Xingzhong', 'Xining', 'Xinmen', 'Xiping', 'Xuanhua', 'Xunzhou', 'Xuzhou', 'Yanan', 'Yangzhou', 'Yanji', 'Yanping', 'Yanqi', 'Yanzhou', 'Yazhou', 'Yichang', 'Yidu', 'Yilan', 'Yili', 'Yingchang', 'Yingde', 'Yingtian', 'Yingzhou', 'Yizhou', 'Yongchang', 'Yongping', 'Yongshun', 'Yongzhou', 'Yuanzhou', 'Yuezhou', 'Yulin', 'Yunnan', 'Yunyang', 'Zezhou', 'Zhangde', 'Zhangzhou', 'Zhaoqing', 'Zhaotong', 'Zhenan', 'Zhending', 'Zhengding', 'Zhenhai', 'Zhenjiang', 'Zhenxi', 'Zhenyun', 'Zhongshan', 'Zunyi'],
      ['Nanporo', 'Naie', 'Kamisunagawa', 'Yuni', 'Naganuma', 'Kuriyama', 'Tsukigata', 'Urausu', 'Shintotsukawa', 'Moseushi', 'Chippubetsu', 'Uryu', 'Hokuryu', 'Numata', 'Tobetsu', 'Suttsu', 'Kuromatsunai', 'Rankoshi', 'Niseko', 'Kimobetsu', 'Kyogoku', 'Kutchan', 'Kyowa', 'Iwanai', 'Shakotan', 'Furubira', 'Niki', 'Yoichi', 'Toyoura', 'Toyako', 'Sobetsu', 'Shiraoi', 'Atsuma', 'Abira', 'Mukawa', 'Hidaka', 'Biratori', 'Niikappu', 'Urakawa', 'Samani', 'Erimo', 'Shinhidaka', 'Matsumae', 'Fukushima', 'Shiriuchi', 'Kikonai', 'Nanae', 'Shikabe', 'Mori', 'Yakumo', 'Oshamambe', 'Esashi', 'Kaminokuni', 'Assabu', 'Otobe', 'Okushiri', 'Imakane', 'Setana', 'Takasu', 'Higashikagura', 'Toma', 'Pippu', 'Aibetsu', 'Kamikawa', 'Higashikawa', 'Biei', 'Kamifurano', 'Nakafurano', 'Minamifurano', 'Horokanai', 'Wassamu', 'Kenbuchi', 'Shimokawa', 'Bifuka', 'Nakagawa', 'Mashike', 'Obira', 'Tomamae', 'Haboro', 'Enbetsu', 'Teshio', 'Hamatonbetsu', 'Nakatonbetsu', 'Esashi', 'Toyotomi', 'Horonobe', 'Rebun', 'Rishiri', 'Rishirifuji', 'Bihoro', 'Tsubetsu', 'Ozora', 'Shari', 'Kiyosato', 'Koshimizu', 'Kunneppu', 'Oketo', 'Saroma', 'Engaru', 'Yubetsu', 'Takinoue', 'Okoppe', 'Omu', 'Otofuke', 'Shihoro', 'Kamishihoro', 'Shikaoi', 'Shintoku', 'Shimizu', 'Memuro', 'Taiki', 'Hiroo', 'Makubetsu', 'Ikeda', 'Toyokoro', 'Honbetsu', 'Ashoro', 'Rikubetsu', 'Urahoro', 'Kushiro', 'Akkeshi', 'Hamanaka', 'Shibecha', 'Teshikaga', 'Shiranuka', 'Betsukai', 'Nakashibetsu', 'Shibetsu', 'Rausu', 'Hiranai', 'Imabetsu', 'Sotogahama', 'Ajigasawa', 'Fukaura', 'Fujisaki', 'Owani', 'Itayanagi', 'Tsuruta', 'Nakadomari', 'Noheji', 'Shichinohe', 'Rokunohe', 'Yokohama', 'Tohoku', 'Oirase', 'Oma', 'Sannohe', 'Gonohe', 'Takko', 'Nanbu', 'Hashikami', 'Shizukuishi', 'Kuzumaki', 'Iwate', 'Shiwa', 'Yahaba', 'Nishiwaga', 'Kanegasaki', 'Hiraizumi', 'Sumita', 'Otsuchi', 'Yamada', 'Iwaizumi', 'Karumai', 'Hirono', 'Ichinohe', 'Zao', 'Shichikashuku', 'Ogawara', 'Murata', 'Shibata', 'Kawasaki', 'Marumori', 'Watari', 'Yamamoto', 'Matsushima', 'Shichigahama', 'Rifu', 'Taiwa', 'Osato', 'Shikama', 'Kami', 'Wakuya', 'Misato', 'Onagawa', 'Minamisanriku', 'Kosaka', 'Fujisato', 'Mitane', 'Happo', 'Gojome', 'Hachirogata', 'Ikawa', 'Misato', 'Ugo', 'Yamanobe', 'Nakayama', 'Kahoku', 'Nishikawa', 'Asahi', 'Oe', 'Oishida', 'Kaneyama', 'Mogami', 'Funagata', 'Mamurogawa', 'Takahata', 'Kawanishi', 'Oguni', 'Shirataka', 'Iide', 'Mikawa', 'Shonai', 'Yuza', 'Koori', 'Kunimi', 'Kawamata', 'Kagamiishi', 'Shimogo', 'Tadami', 'Minamiaizu', 'Nishiaizu', 'Bandai', 'Inawashiro', 'Aizubange', 'Yanaizu', 'Mishima', 'Kaneyama', 'Aizumisato', 'Yabuki', 'Tanagura', 'Yamatsuri', 'Hanawa', 'Ishikawa', 'Asakawa', 'Furudono', 'Miharu', 'Ono', 'Hirono', 'Naraha', 'Tomioka', 'Okuma', 'Futaba', 'Namie', 'Shinchi', 'Ibaraki', 'Oarai', 'Shirosato', 'Daigo', 'Ami', 'Kawachi', 'Yachiyo', 'Goka', 'Sakai', 'Tone', 'Kaminokawa', 'Mashiko', 'Motegi', 'Ichikai', 'Haga', 'Mibu', 'Nogi', 'Shioya', 'Takanezawa', 'Nasu', 'Nakagawa', 'Yoshioka', 'Kanna', 'Shimonita', 'Kanra', 'Nakanojo', 'Naganohara', 'Kusatsu', 'Higashiagatsuma', 'Minakami', 'Tamamura', 'Itakura', 'Meiwa', 'Chiyoda', 'Oizumi', 'Ora', 'Ina', 'Miyoshi', 'Moroyama', 'Ogose', 'Namegawa', 'Ranzan', 'Ogawa', 'Kawajima', 'Yoshimi', 'Hatoyama', 'Tokigawa', 'Yokoze', 'Minano', 'Nagatoro', 'Ogano', 'Misato', 'Kamikawa', 'Kamisato', 'Yorii', 'Miyashiro', 'Sugito', 'Matsubushi', 'Shisui', 'Sakae', 'Kozaki', 'Tako', 'Tonosho', 'Kujukuri', 'Shibayama', 'Yokoshibahikari', 'Ichinomiya', 'Mutsuzawa', 'Shirako', 'Nagara', 'Chonan', 'Otaki', 'Onjuku', 'Kyonan', 'Mizuho', 'Hinode', 'Okutama', 'Oshima', 'Hachijo', 'Aikawa', 'Hayama', 'Samukawa', 'Oiso', 'Ninomiya', 'Nakai', 'Oi', 'Matsuda', 'Yamakita', 'Kaisei', 'Hakone', 'Manazuru', 'Yugawara', 'Seiro', 'Tagami', 'Aga', 'Izumozaki', 'Yuzawa', 'Tsunan', 'Kamiichi', 'Tateyama', 'Nyuzen', 'Asahi', 'Kawakita', 'Tsubata', 'Uchinada', 'Shika', 'Hodatsushimizu', 'Nakanoto', 'Anamizu', 'Noto', 'Eiheiji', 'Ikeda', 'Minamiechizen', 'Echizen', 'Mihama', 'Takahama', 'Oi', 'Wakasa', 'Ichikawamisato', 'Hayakawa', 'Minobu', 'Nanbu', 'Fujikawa', 'Showa', 'Nishikatsura', 'Fujikawaguchiko', 'Koumi', 'Sakuho', 'Karuizawa', 'Miyota', 'Tateshina', 'Nagawa', 'Shimosuwa', 'Fujimi', 'Tatsuno', 'Minowa', 'Iijima', 'Matsukawa', 'Takamori', 'Anan', 'Agematsu', 'Nagiso', 'Kiso', 'Ikeda', 'Sakaki', 'Obuse', 'Yamanouchi', 'Shinano', 'Iizuna', 'Ginan', 'Kasamatsu', 'Yoro', 'Tarui', 'Sekigahara', 'Godo', 'Wanouchi', 'Anpachi', 'Ibigawa', 'Ono', 'Ikeda', 'Kitagata', 'Sakahogi', 'Tomika', 'Kawabe', 'Hichiso', 'Yaotsu', 'Shirakawa', 'Mitake', 'Higashiizu', 'Kawazu', 'Minamiizu', 'Matsuzaki', 'Nishiizu', 'Kannami', 'Shimizu', 'Nagaizumi', 'Oyama', 'Yoshida', 'Kawanehon', 'Mori', 'Togo', 'Toyoyama', 'Oguchi', 'Fuso', 'Oharu', 'Kanie', 'Agui', 'Higashiura', 'Minamichita', 'Mihama', 'Taketoyo', 'Mihama', 'Kota', 'Shitara', 'Toei', 'Kisosaki', 'Toin', 'Komono', 'Asahi', 'Kawagoe', 'Taki', 'Meiwa', 'Odai', 'Tamaki', 'Watarai', 'Taiki', 'Minamiise', 'Kihoku', 'Mihama', 'Kiho', 'Hino', 'Ryuo', 'Aisho', 'Toyosato', 'Kora', 'Taga', 'Oyamazaki', 'Kumiyama', 'Ide', 'Ujitawara', 'Kasagi', 'Wazuka', 'Seika', 'Kyotamba', 'Ine', 'Yosano', 'Shimamoto', 'Toyono', 'Nose', 'Tadaoka', 'Kumatori', 'Tajiri', 'Misaki', 'Taishi', 'Kanan', 'Inagawa', 'Taka', 'Inami', 'Harima', 'Ichikawa', 'Fukusaki', 'Kamikawa', 'Taishi', 'Kamigori', 'Sayo', 'Kami', 'Shinonsen', 'Heguri', 'Sango', 'Ikaruga', 'Ando', 'Kawanishi', 'Miyake', 'Tawaramoto', 'Takatori', 'Kanmaki', 'Oji', 'Koryo', 'Kawai', 'Yoshino', 'Oyodo', 'Shimoichi', 'Kushimoto', 'Kimino', 'Katsuragi', 'Kudoyama', 'Koya', 'Yuasa', 'Hirogawa', 'Aridagawa', 'Mihama', 'Hidaka', 'Yura', 'Inami', 'Minabe', 'Hidakagawa', 'Shirahama', 'Kamitonda', 'Susami', 'Nachikatsuura', 'Taiji', 'Kozagawa', 'Iwami', 'Wakasa', 'Chizu', 'Yazu', 'Misasa', 'Yurihama', 'Kotoura', 'Hokuei', 'Daisen', 'Nanbu', 'Hoki', 'Nichinan', 'Hino', 'Kofu', 'Okuizumo', 'Iinan', 'Kawamoto', 'Misato', 'Onan', 'Tsuwano', 'Yoshika', 'Ama', 'Nishinoshima', 'Okinoshima', 'Wake', 'Hayashima', 'Satosho', 'Yakage', 'Kagamino', 'Shoo', 'Nagi', 'Kumenan', 'Misaki', 'Kibichuo', 'Fuchu', 'Kaita', 'Kumano', 'Saka', 'Kitahiroshima', 'Akiota', 'Osakikamijima', 'Sera', 'Jinsekikogen', 'Suooshima', 'Waki', 'Kaminoseki', 'Tabuse', 'Hirao', 'Abu', 'Katsuura', 'Kamikatsu', 'Ishii', 'Kamiyama', 'Naka', 'Mugi', 'Minami', 'Kaiyo', 'Matsushige', 'Kitajima', 'Aizumi', 'Itano', 'Kamiita', 'Tsurugi', 'Higashimiyoshi', 'Tonosho', 'Shodoshima', 'Miki', 'Naoshima', 'Utazu', 'Ayagawa', 'Kotohira', 'Tadotsu', 'Manno', 'Kamijima', 'Kumakogen', 'Masaki', 'Tobe', 'Uchiko', 'Ikata', 'Kihoku', 'Matsuno', 'Ainan', 'Toyo', 'Nahari', 'Tano', 'Yasuda', 'Motoyama', 'Otoyo', 'Tosa', 'Ino', 'Niyodogawa', 'Nakatosa', 'Sakawa', 'Ochi', 'Yusuhara', 'Tsuno', 'Shimanto', 'Otsuki', 'Kuroshio', 'Nakagawa', 'Umi', 'Sasaguri', 'Shime', 'Sue', 'Shingu', 'Hisayama', 'Kasuya', 'Ashiya', 'Mizumaki', 'Okagaki', 'Onga', 'Kotake', 'Kurate', 'Keisen', 'Chikuzen', 'Tachiarai', 'Oki', 'Hirokawa', 'Kawara', 'Soeda', 'Itoda', 'Kawasaki', 'Oto', 'Fukuchi', 'Kanda', 'Miyako', 'Yoshitomi', 'Koge', 'Chikujo', 'Yoshinogari', 'Kiyama', 'Kamimine', 'Miyaki', 'Genkai', 'Arita', 'Omachi', 'Kohoku', 'Shiroishi', 'Tara', 'Nagayo', 'Togitsu', 'Higashisonogi', 'Kawatana', 'Hasami', 'Ojika', 'Saza', 'Shinkamigoto', 'Misato', 'Gyokuto', 'Nankan', 'Nagasu', 'Nagomi', 'Ozu', 'Kikuyo', 'Minamioguni', 'Oguni', 'Takamori', 'Mifune', 'Kashima', 'Mashiki', 'Kosa', 'Yamato', 'Hikawa', 'Ashikita', 'Tsunagi', 'Nishiki', 'Taragi', 'Yunomae', 'Asagiri', 'Reihoku', 'Hiji', 'Kusu', 'Kokonoe', 'Mimata', 'Takaharu', 'Kunitomi', 'Aya', 'Takanabe', 'Shintomi', 'Kijo', 'Kawaminami', 'Tsuno', 'Kadogawa', 'Misato', 'Takachiho', 'Hinokage', 'Gokase', 'Satsuma', 'Nagashima', 'Yusui', 'Osaki', 'Higashikushira', 'Kinko', 'Minamiosumi', 'Kimotsuki', 'Nakatane', 'Minamitane', 'Yakushima', 'Setouchi', 'Tatsugo', 'Kikai', 'Tokunoshima', 'Amagi', 'Isen', 'Wadomari', 'China', 'Yoron', 'Motobu', 'Kin', 'Kadena', 'Chatan', 'Nishihara', 'Yonabaru', 'Haebaru', 'Kumejima', 'Yaese', 'Taketomi', 'Yonaguni']
    ];
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
        id = `burg${ event.target.getAttribute('data-id')}`;
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

  // return value (v) if defined with specified number of decimals (d)
  // else return "no" or attribute (r)
  function ifDefined(v, r, d) {
    if (v === null || v === undefined) {
      return r || 'no';
    }
    if (d) {
      return v.toFixed(d);
    }
    return v;
  }

  // get user-friendly (real-world) height value from map data
  function getFriendlyHeight(h) {
    const exponent = +heightExponent.value;
    const unit = heightUnit.value;
    let unitRatio = 1; // default calculations are in meters
    if (unit === 'ft') {
      unitRatio = 3.28;
    } // if foot
    if (unit === 'f') {
      unitRatio = 0.5468;
    } // if fathom
    let height = -990;
    if (h >= 20) {
      height = Math.pow(h - 18, exponent);
    }
    if (h < 20 && h > 0) {
      height = ((h - 20) / h) * 50;
    }
    return `${h} (${rn(height * unitRatio)} ${unit})`;
  }

  // remove parent element (usually if child is clicked)
  function removeParent() {
    $(this.parentNode).remove();
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

  // Generate Heigtmap routine
  function defineHeightmap() {
    console.time('defineHeightmap');
    if (lockTemplateInput.getAttribute('data-locked') == 0) {
      const rnd = Math.random();
      if (rnd > 0.95) {
        templateInput.value = 'Volcano';
      } else if (rnd > 0.75) {
        templateInput.value = 'High Island';
      } else if (rnd > 0.55) {
        templateInput.value = 'Low Island';
      } else if (rnd > 0.35) {
        templateInput.value = 'Continents';
      } else if (rnd > 0.15) {
        templateInput.value = 'Archipelago';
      } else if (rnd > 0.10) {
        templateInput.value = 'Mainland';
      } else if (rnd > 0.01) {
        templateInput.value = 'Peninsulas';
      } else {
        templateInput.value = 'Atoll';
      }
    }
    const mapTemplate = templateInput.value;
    if (mapTemplate === 'Volcano') {
      templateVolcano();
    }
    if (mapTemplate === 'High Island') {
      templateHighIsland();
    }
    if (mapTemplate === 'Low Island') {
      templateLowIsland();
    }
    if (mapTemplate === 'Continents') {
      templateContinents();
    }
    if (mapTemplate === 'Archipelago') {
      templateArchipelago();
    }
    if (mapTemplate === 'Atoll') {
      templateAtoll();
    }
    if (mapTemplate === 'Mainland') {
      templateMainland();
    }
    if (mapTemplate === 'Peninsulas') {
      templatePeninsulas();
    }
    console.log(` template: ${mapTemplate}`);
    console.timeEnd('defineHeightmap');
  }

  

  // place with shift 0-0.5
  function addHill(count, shift) {
    for (let c = 0; c < count; c++) {
      let limit = 0,
        cell,
        height;
      do {
        height = Math.random() * 40 + 10; // 10-50
        const x = Math.floor(Math.random() * graphWidth * (1 - shift * 2) + graphWidth * shift);
        const y = Math.floor(Math.random() * graphHeight * (1 - shift * 2) + graphHeight * shift);
        cell = diagram.find(x, y).index;
        limit++;
      } while (heights[cell] + height > 90 && limit < 100);
      add(cell, 'hill', height);
    }
  }

  function addRange(mod, height, from, to) {
    const session = Math.ceil(Math.random() * 100000);
    const count = Math.abs(mod);
    let range = [];
    for (let c = 0; c < count; c++) {
      range = [];
      let diff = 0,
        start = from,
        end = to;
      if (!start || !end) {
        do {
          const xf = Math.floor(Math.random() * (graphWidth * 0.7)) + graphWidth * 0.15;
          const yf = Math.floor(Math.random() * (graphHeight * 0.6)) + graphHeight * 0.2;
          start = diagram.find(xf, yf).index;
          const xt = Math.floor(Math.random() * (graphWidth * 0.7)) + graphWidth * 0.15;
          const yt = Math.floor(Math.random() * (graphHeight * 0.6)) + graphHeight * 0.2;
          end = diagram.find(xt, yt).index;
          diff = Math.hypot(xt - xf, yt - yf);
        } while (diff < 150 / graphSize || diff > 300 / graphSize);
      }
      if (start && end) {
        for (let l = 0; start != end && l < 10000; l++) {
          let min = 10000;
          cells[start].neighbors.forEach((e) => {
            diff = Math.hypot(cells[end].data[0] - cells[e].data[0], cells[end].data[1] - cells[e].data[1]);
            if (Math.random() > 0.8) {
              diff = diff / 2;
            }
            if (diff < min) {
              min = diff, start = e;
            }
          });
          range.push(start);
        }
      }
      const change = height || Math.random() * 10 + 10;
      range.map((r) => {
        let rnd = Math.random() * 0.4 + 0.8;
        if (mod > 0) {
          heights[r] += change * rnd;
        } else if (heights[r] >= 10) {
          heights[r] -= change * rnd;
        }
        cells[r].neighbors.forEach((e) => {
          if (cells[e].used === session) {
            return;
          }
          cells[e].used = session;
          rnd = Math.random() * 0.4 + 0.8;
          const ch = change / 2 * rnd;
          if (mod > 0) {
            heights[e] += ch;
          } else if (heights[e] >= 10) {
            heights[e] -= ch;
          }
          if (heights[e] > 100) {
            heights[e] = mod > 0 ? 100 : 5;
          }
        });
        if (heights[r] > 100) {
          heights[r] = mod > 0 ? 100 : 5;
        }
      });
    }
    return range;
  }

  function addStrait(width) {
    const session = Math.ceil(Math.random() * 100000);
    const top = Math.floor(Math.random() * graphWidth * 0.35 + graphWidth * 0.3);
    const bottom = Math.floor((graphWidth - top) - (graphWidth * 0.1) + (Math.random() * graphWidth * 0.2));
    let start = diagram.find(top, graphHeight * 0.1).index;
    const end = diagram.find(bottom, graphHeight * 0.9).index;
    let range = [];
    for (let l = 0; start !== end && l < 1000; l++) {
      let min = 10000; // dummy value
      cells[start].neighbors.forEach((e) => {
        let diff = Math.hypot(cells[end].data[0] - cells[e].data[0], cells[end].data[1] - cells[e].data[1]);
        if (Math.random() > 0.8) {
          diff = diff / 2;
        }
        if (diff < min) {
          min = diff;
          start = e;
        }
      });
      range.push(start);
    }
    const query = [];
    for (; width > 0; width--) {
      range.map((r) => {
        cells[r].neighbors.forEach((e) => {
          if (cells[e].used === session) {
            return;
          }
          cells[e].used = session;
          query.push(e);
          heights[e] *= 0.23;
          if (heights[e] > 100 || heights[e] < 5) {
            heights[e] = 5;
          }
        });
        range = query.slice();
      });
    }
  }

  // Modify heights adding or multiplying by value
  function modifyHeights(range, add, mult) {
    function modify(v) {
      if (add) {
        v += add;
      }
      if (mult !== 1) {
        if (mult === '^2') {
          mult = (v - 20) / 100;
        }
        if (mult === '^3') {
          mult = ((v - 20) * (v - 20)) / 100;
        }
        if (range === 'land') {
          v = 20 + (v - 20) * mult;
        } else {
          v *= mult;
        }
      }
      if (v < 0) {
        v = 0;
      }
      if (v > 100) {
        v = 100;
      }
      return v;
    }
    const limMin = range === 'land' ? 20 : range === 'all' ? 0 : +range.split('-')[0];
    const limMax = range === 'land' || range === 'all' ? 100 : +range.split('-')[1];

    for (let i = 0; i < heights.length; i++) {
      if (heights[i] < limMin || heights[i] > limMax) {
        continue;
      }
      heights[i] = modify(heights[i]);
    }
  }

  // Smooth heights using mean of neighbors
  function smoothHeights(fraction) {
    const fr = fraction || 2;
    for (let i = 0; i < heights.length; i++) {
      const nHeights = [heights[i]];
      cells[i].neighbors.forEach((e) => {
        nHeights.push(heights[e]);
      });
      heights[i] = (heights[i] * (fr - 1) + d3.mean(nHeights)) / fr;
    }
  }

  // redraw all cells for Customization 1 mode
  function mockHeightmap() {
    const landCells = 0;
    $('#landmass').empty();
    const limit = renderOcean.checked ? 1 : 20;
    for (let i = 0; i < heights.length; i++) {
      if (heights[i] < limit) {
        continue;
      }
      if (heights[i] > 100) {
        heights[i] = 100;
      }
      const clr = color(1 - heights[i] / 100);
      landmass.append('path').attr('id', `cell${i}`)
        .attr('d', `M${polygons[i].join('L')}Z`)
        .attr('fill', clr)
        .attr('stroke', clr);
    }
  }

  $('#renderOcean').click(mockHeightmap);

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

  // draw ruler center point to split ruler into 2 parts
  function rulerCenterDrag() {
    let xc1,
      yc1,
      xc2,
      yc2;
    const group = d3.select(this.parentNode); // current ruler group
    let x = d3.event.x,
      y = d3.event.y; // current coords
    const line = group.selectAll('line'); // current lines
    const x1 = +line.attr('x1'),
      y1 = +line.attr('y1'),
      x2 = +line.attr('x2'),
      y2 = +line.attr('y2'); // initial line edge points
    const rulerNew = ruler.insert('g', ':first-child');
    rulerNew.attr('transform', group.attr('transform')).call(d3.drag().on('start', elementDrag));
    const factor = rn(1 / Math.pow(scale, 0.3), 1);
    rulerNew.append('line').attr('class', 'white').attr('stroke-width', factor);
    const dash = +group.select('.gray').attr('stroke-dasharray');
    rulerNew.append('line').attr('class', 'gray').attr('stroke-dasharray', dash).attr('stroke-width', factor);
    rulerNew.append('text').attr('dy', -1).on('click', removeParent).attr('font-size', 10 * factor)
      .attr('stroke-width', factor);

    d3.event.on('drag', function () {
      x = d3.event.x, y = d3.event.y;
      d3.select(this).attr('cx', x).attr('cy', y);
      // change first part
      line.attr('x1', x1).attr('y1', y1).attr('x2', x).attr('y2', y);
      let dist = rn(Math.hypot(x1 - x, y1 - y));
      let label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
      let atan = x1 > x ? Math.atan2(y1 - y, x1 - x) : Math.atan2(y - y1, x - x1);
      xc1 = rn((x + x1) / 2, 2), yc1 = rn((y + y1) / 2, 2);
      let tr = `rotate(${rn(atan * 180 / Math.PI, 3)} ${xc1} ${yc1})`;
      group.select('text').attr('x', xc1).attr('y', yc1).attr('transform', tr)
        .attr('data-dist', dist)
        .text(label);
      // change second (new) part
      dist = rn(Math.hypot(x2 - x, y2 - y));
      label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
      atan = x2 > x ? Math.atan2(y2 - y, x2 - x) : Math.atan2(y - y2, x - x2);
      xc2 = rn((x + x2) / 2, 2), yc2 = rn((y + y2) / 2, 2);
      tr = `rotate(${rn(atan * 180 / Math.PI, 3)} ${xc2} ${yc2})`;
      rulerNew.selectAll('line').attr('x1', x).attr('y1', y).attr('x2', x2)
        .attr('y2', y2);
      rulerNew.select('text').attr('x', xc2).attr('y', yc2).attr('transform', tr)
        .attr('data-dist', dist)
        .text(label);
    });

    d3.event.on('end', () => {
      // circles for 1st part
      group.selectAll('circle').remove();
      group.append('circle').attr('cx', x1).attr('cy', y1).attr('r', 2 * factor)
        .attr('stroke-width', 0.5 * factor)
        .attr('data-edge', 'left')
        .call(d3.drag().on('drag', rulerEdgeDrag));
      group.append('circle').attr('cx', x).attr('cy', y).attr('r', 2 * factor)
        .attr('stroke-width', 0.5 * factor)
        .attr('data-edge', 'rigth')
        .call(d3.drag().on('drag', rulerEdgeDrag));
      group.append('circle').attr('cx', xc1).attr('cy', yc1).attr('r', 1.2 * factor)
        .attr('stroke-width', 0.3 * factor)
        .attr('class', 'center')
        .call(d3.drag().on('start', rulerCenterDrag));
      // circles for 2nd part
      rulerNew.append('circle').attr('cx', x).attr('cy', y).attr('r', 2 * factor)
        .attr('stroke-width', 0.5 * factor)
        .attr('data-edge', 'left')
        .call(d3.drag().on('drag', rulerEdgeDrag));
      rulerNew.append('circle').attr('cx', x2).attr('cy', y2).attr('r', 2 * factor)
        .attr('stroke-width', 0.5 * factor)
        .attr('data-edge', 'rigth')
        .call(d3.drag().on('drag', rulerEdgeDrag));
      rulerNew.append('circle').attr('cx', xc2).attr('cy', yc2).attr('r', 1.2 * factor)
        .attr('stroke-width', 0.3 * factor)
        .attr('class', 'center')
        .call(d3.drag().on('start', rulerCenterDrag));
    });
  }

  function opisometerEdgeDrag() {
    const el = d3.select(this);
    const x0 = +el.attr('cx'),
      y0 = +el.attr('cy');
    const group = d3.select(this.parentNode);
    const curve = group.select('.white');
    const curveGray = group.select('.gray');
    const text = group.select('text');
    const points = JSON.parse(text.attr('data-points'));
    if (x0 === points[0].scX && y0 === points[0].scY) {
      points.reverse();
    }

    d3.event.on('drag', () => {
      const x = d3.event.x,
        y = d3.event.y;
      el.attr('cx', x).attr('cy', y);
      const l = points[points.length - 1];
      const diff = Math.hypot(l.scX - x, l.scY - y);
      if (diff > 5) {
        points.push({
          scX: x,
          scY: y
        });
      } else {
        return;
      }
      lineGen.curve(d3.curveBasis);
      const d = round(lineGen(points));
      curve.attr('d', d);
      curveGray.attr('d', d);
      const dist = rn(curve.node().getTotalLength());
      const label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
      text.attr('x', x).attr('y', y).text(label);
    });

    d3.event.on('end', () => {
      const dist = rn(curve.node().getTotalLength());
      const c = curve.node().getPointAtLength(dist / 2);
      const p = curve.node().getPointAtLength((dist / 2) - 1);
      const label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
      const atan = p.x > c.x ? Math.atan2(p.y - c.y, p.x - c.x) : Math.atan2(c.y - p.y, c.x - p.x);
      const angle = rn(atan * 180 / Math.PI, 3);
      const tr = `rotate(${angle } ${c.x } ${ c.y })`;
      text.attr('data-points', JSON.stringify(points)).attr('data-dist', dist).attr('x', c.x).attr('y', c.y)
        .attr('transform', tr)
        .text(label);
    });
  }

  function getContinuousLine(edges, indention, relax) {
    let line = '';
    if (edges.length < 3) {
      return '';
    }
    while (edges.length > 2) {
      const edgesOrdered = []; // to store points in a correct order
      const start = edges[0].start;
      let end = edges[0].end;
      edges.shift();
      let spl = start.split(' ');
      edgesOrdered.push({
        scX: +spl[0],
        scY: +spl[1]
      });
      spl = end.split(' ');
      edgesOrdered.push({
        scX: +spl[0],
        scY: +spl[1]
      });
      let x0 = +spl[0],
        y0 = +spl[1];
      for (let i = 0; end !== start && i < 100000; i++) {
        let next = null,
          index = null;
        for (let e = 0; e < edges.length; e++) {
          const edge = edges[e];
          if (edge.start == end || edge.end == end) {
            next = edge;
            end = next.start == end ? next.end : next.start;
            index = e;
            break;
          }
        }
        if (!next) {
          console.error('Next edge is not found');
          return '';
        }
        spl = end.split(' ');
        if (indention || relax) {
          const dist = Math.hypot(+spl[0] - x0, +spl[1] - y0);
          if (dist >= indention && Math.random() > relax) {
            edgesOrdered.push({
              scX: +spl[0],
              scY: +spl[1]
            });
            x0 = +spl[0], y0 = +spl[1];
          }
        } else {
          edgesOrdered.push({
            scX: +spl[0],
            scY: +spl[1]
          });
        }
        edges.splice(index, 1);
        if (i === 100000 - 1) {
          console.error('Line not ended, limit reached');
          break;
        }
      }
      line += lineGen(edgesOrdered);
    }
    return round(line, 1);
  }

  // Depression filling algorithm (for a correct water flux modeling; phase1)
  function resolveDepressionsPrimary() {
    console.time('resolveDepressionsPrimary');
    land = $.grep(cells, (e, d) => {
      if (!e.height) {
        e.height = heights[d];
      } // use height on object level
      return e.height >= 20;
    });
    land.sort((a, b) => b.height - a.height);
    const limit = 10;
    for (let l = 0, depression = 1; depression > 0 && l < limit; l++) {
      depression = 0;
      for (let i = 0; i < land.length; i++) {
        const id = land[i].index;
        if (land[i].type === 'border') {
          continue;
        }
        const hs = land[i].neighbors.map((n) => cells[n].height);
        const minHigh = d3.min(hs);
        if (cells[id].height <= minHigh) {
          depression++;
          land[i].pit = land[i].pit ? land[i].pit + 1 : 1;
          cells[id].height = minHigh + 2;
        }
      }
      if (l === 0) {
        console.log(` depressions init: ${depression}`);
      }
    }
    console.timeEnd('resolveDepressionsPrimary');
  }

  // Depression filling algorithm (for a correct water flux modeling; phase2)
  function resolveDepressionsSecondary() {
    console.time('resolveDepressionsSecondary');
    land = $.grep(cells, (e) => e.height >= 20);
    land.sort((a, b) => b.height - a.height);
    const limit = 100;
    for (let l = 0, depression = 1; depression > 0 && l < limit; l++) {
      depression = 0;
      for (let i = 0; i < land.length; i++) {
        if (land[i].ctype === 99) {
          continue;
        }
        const nHeights = land[i].neighbors.map((n) => cells[n].height);
        const minHigh = d3.min(nHeights);
        if (land[i].height <= minHigh) {
          depression++;
          land[i].pit = land[i].pit ? land[i].pit + 1 : 1;
          land[i].height = Math.trunc(minHigh + 2);
        }
      }
      if (l === 0) {
        console.log(` depressions reGraphed: ${ depression}`);
      }
      if (l === limit - 1) {
        console.error('Error: resolveDepressions iteration limit');
      }
    }
    console.timeEnd('resolveDepressionsSecondary');
  }

  // restore initial heights if user don't want system to change heightmap
  function restoreCustomHeights() {
    land.forEach((l) => {
      if (!l.pit) {
        return;
      }
      l.height = Math.trunc(l.height - l.pit * 2);
      if (l.height < 20) {
        l.height = 20;
      }
    });
  }

  function flux() {
    console.time('flux');
    riversData = [];
    let riverNext = 0;
    land.sort((a, b) => b.height - a.height);
    for (let i = 0; i < land.length; i++) {
      const id = land[i].index;
      const sx = land[i].data[0];
      const sy = land[i].data[1];
      let fn = land[i].fn;
      if (land[i].ctype === 99) {
        if (land[i].river !== undefined) {
          let x,
            y;
          const min = Math.min(sy, graphHeight - sy, sx, graphWidth - sx);
          if (min === sy) {
            x = sx;
            y = 0;
          }
          if (min === graphHeight - sy) {
            x = sx;
            y = graphHeight;
          }
          if (min === sx) {
            x = 0;
            y = sy;
          }
          if (min === graphWidth - sx) {
            x = graphWidth;
            y = sy;
          }
          riversData.push({
            river: land[i].river,
            cell: id,
            x,
            y
          });
        }
        continue;
      }
      if (features[fn].river !== undefined) {
        if (land[i].river !== features[fn].river) {
          land[i].river = undefined;
          land[i].flux = 0;
        }
      }
      let minHeight = 1000,
        min;
      land[i].neighbors.forEach((e) => {
        if (cells[e].height < minHeight) {
          minHeight = cells[e].height;
          min = e;
        }
      });
      // Define river number
      if (min !== undefined && land[i].flux > 1) {
        if (land[i].river === undefined) {
          // State new River
          land[i].river = riverNext;
          riversData.push({
            river: riverNext,
            cell: id,
            x: sx,
            y: sy
          });
          riverNext += 1;
        }
        // Assing existing River to the downhill cell
        if (cells[min].river == undefined) {
          cells[min].river = land[i].river;
        } else {
          const riverTo = cells[min].river;
          const iRiver = $.grep(riversData, (e) => (e.river == land[i].river));
          const minRiver = $.grep(riversData, (e) => (e.river == riverTo));
          let iRiverL = iRiver.length;
          let minRiverL = minRiver.length;
          // re-assing river nunber if new part is greater
          if (iRiverL >= minRiverL) {
            cells[min].river = land[i].river;
            iRiverL += 1;
            minRiverL -= 1;
          }
          // mark confluences
          if (cells[min].height >= 20 && iRiverL > 1 && minRiverL > 1) {
            if (!cells[min].confluence) {
              cells[min].confluence = minRiverL - 1;
            } else {
              cells[min].confluence += minRiverL - 1;
            }
          }
        }
      }
      if (cells[min].flux) {
        cells[min].flux += land[i].flux;
      }
      if (land[i].river !== undefined) {
        const px = cells[min].data[0];
        const py = cells[min].data[1];
        if (cells[min].height < 20) {
          // pour water to the sea
          const x = (px + sx) / 2 + (px - sx) / 10;
          const y = (py + sy) / 2 + (py - sy) / 10;
          riversData.push({
            river: land[i].river,
            cell: id,
            x,
            y
          });
        } else {
          if (cells[min].lake === 1) {
            fn = cells[min].fn;
            if (features[fn].river === undefined) {
              features[fn].river = land[i].river;
            }
          }
          // add next River segment
          riversData.push({
            river: land[i].river,
            cell: min,
            x: px,
            y: py
          });
        }
      }
    }
    console.timeEnd('flux');
    drawRiverLines(riverNext);
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

  // generic function to move any burg to any group
  function moveBurgToGroup(id, g) {
    $(`#burgLabels [data-id=${id}]`).detach().appendTo($(`#burgLabels > #${g}`));
    $(`#burgIcons [data-id=${id}]`).detach().appendTo($(`#burgIcons > #${g}`));
    const rSize = $(`#burgIcons > #${g}`).attr('size');
    $(`#burgIcons [data-id=${id}]`).attr('r', rSize);
    const el = $(`#icons g[id*='anchors'] [data-id=${id}]`);
    if (el.length) {
      const to = g === 'towns' ? $('#town-anchors') : $('#capital-anchors');
      el.detach().appendTo(to);
      const useSize = to.attr('size');
      const x = rn(manors[id].x - useSize * 0.47, 2);
      const y = rn(manors[id].y - useSize * 0.47, 2);
      el.attr('x', x).attr('y', y).attr('width', useSize).attr('height', useSize);
    }
    updateCountryEditors();
  }

  function manorsAndRegions() {
    console.group('manorsAndRegions');
    calculateChains();
    rankPlacesGeography();
    locateCapitals();
    generateMainRoads();
    rankPlacesEconomy();
    locateTowns();
    getNames();
    shiftSettlements();
    checkAccessibility();
    defineRegions('withCultures');
    generatePortRoads();
    generateSmallRoads();
    generateOceanRoutes();
    calculatePopulation();
    drawManors();
    drawRegions();
    console.groupEnd('manorsAndRegions');
  }

  // Assess cells geographycal suitability for settlement
  function rankPlacesGeography() {
    console.time('rankPlacesGeography');
    land.map((c) => {
      let score = 0;
      c.flux = rn(c.flux, 2);
      // get base score from height (will be biom)
      if (c.height <= 40) {
        score = 2;
      } else if (c.height <= 50) {
        score = 1.8;
      } else if (c.height <= 60) {
        score = 1.6;
      } else if (c.height <= 80) {
        score = 1.4;
      }
      score += (1 - c.height / 100) / 3;
      if (c.ctype && Math.random() < 0.8 && !c.river) {
        c.score = 0; // ignore 80% of extended cells
      } else {
        if (c.harbor) {
          if (c.harbor === 1) {
            score += 1;
          } else {
            score -= 0.3;
          } // good sea harbor is valued
        }
        if (c.river) {
          score += 1;
        } // coastline is valued
        if (c.river && c.ctype === 1) {
          score += 1;
        } // estuary is valued
        if (c.flux > 1) {
          score += Math.pow(c.flux, 0.3);
        } // riverbank is valued
        if (c.confluence) {
          score += Math.pow(c.confluence, 0.7);
        } // confluence is valued;
        const neighbEv = c.neighbors.map((n) => {
          if (cells[n].height >= 20) {
            return cells[n].height;
          }
        });
        const difEv = c.height - d3.mean(neighbEv);
        // if (!isNaN(difEv)) score += difEv * 10 * (1 - c.height / 100); // local height maximums are valued
      }
      c.score = rn(Math.random() * score + score, 3); // add random factor
    });
    land.sort((a, b) => b.score - a.score);
    console.timeEnd('rankPlacesGeography');
  }

  // Assess the cells economical suitability for settlement
  function rankPlacesEconomy() {
    console.time('rankPlacesEconomy');
    land.map((c) => {
      let score = c.score;
      let path = c.path || 0; // roads are valued
      if (path) {
        path = Math.pow(path, 0.2);
        const crossroad = c.crossroad || 0; // crossroads are valued
        score = score + path + crossroad;
      }
      c.score = rn(Math.random() * score + score, 2); // add random factor
    });
    land.sort((a, b) => b.score - a.score);
    console.timeEnd('rankPlacesEconomy');
  }

  // calculate population for manors, cells and states
  function calculatePopulation() {
    // neutral population factors < 1 as neutral lands are usually pretty wild
    const ruralFactor = 0.5,
      urbanFactor = 0.9;

    // calculate population for each burg (based on trade/people attractors)
    manors.map((m) => {
      const cell = cells[m.cell];
      let score = cell.score;
      if (score <= 0) {
        score = rn(Math.random(), 2);
      }
      if (cell.crossroad) {
        score += cell.crossroad;
      } // crossroads
      if (cell.confluence) {
        score += Math.pow(cell.confluence, 0.3);
      } // confluences
      if (m.i !== m.region && cell.port) {
        score *= 1.5;
      } // ports (not capital)
      if (m.i === m.region && !cell.port) {
        score *= 2;
      } // land-capitals
      if (m.i === m.region && cell.port) {
        score *= 3;
      } // port-capitals
      if (m.region === 'neutral') {
        score *= urbanFactor;
      }
      const rnd = 0.6 + Math.random() * 0.8; // random factor
      m.population = rn(score * rnd, 1);
    });

    // calculate rural population for each cell based on area + elevation (elevation to be changed to biome)
    const graphSizeAdj = 90 / Math.sqrt(cells.length, 2); // adjust to different graphSize
    land.map((l) => {
      let population = 0;
      const elevationFactor = Math.pow(1 - l.height / 100, 3);
      population = elevationFactor * l.area * graphSizeAdj;
      if (l.region === 'neutral') {
        population *= ruralFactor;
      }
      l.pop = rn(population, 1);
    });

    // calculate population for each region
    states.map((s, i) => {
      // define region burgs count
      const burgs = $.grep(manors, (e) => e.region === i);
      s.burgs = burgs.length;
      // define region total and burgs population
      let burgsPop = 0; // get summ of all burgs population
      burgs.map((b) => {
        burgsPop += b.population;
      });
      s.urbanPopulation = rn(burgsPop, 2);
      const regionCells = $.grep(cells, (e) => e.region === i);
      let cellsPop = 0;
      regionCells.map((c) => {
        cellsPop += c.pop;
      });
      s.cells = regionCells.length;
      s.ruralPopulation = rn(cellsPop, 1);
    });

    // collect data for neutrals
    const neutralCells = $.grep(cells, (e) => e.region === 'neutral');
    if (neutralCells.length) {
      let burgs = 0,
        urbanPopulation = 0,
        ruralPopulation = 0,
        area = 0;
      manors.forEach((m) => {
        if (m.region !== 'neutral') {
          return;
        }
        urbanPopulation += m.population;
        burgs++;
      });
      neutralCells.forEach((c) => {
        ruralPopulation += c.pop;
        area += cells[c.index].area;
      });
      states.push({
        i: states.length,
        color: 'neutral',
        name: 'Neutrals',
        capital: 'neutral',
        cells: neutralCells.length,
        burgs,
        urbanPopulation: rn(urbanPopulation, 2),
        ruralPopulation: rn(ruralPopulation, 2),
        area: rn(area)
      });
    }
  }

  function locateCapitals() {
    console.time('locateCapitals');
    // min distance detween capitals
    const count = +regionsInput.value;
    let spacing = (graphWidth + graphHeight) / 2 / count;
    console.log(` states: ${count}`);

    for (let l = 0; manors.length < count; l++) {
      const region = manors.length;
      const x = land[l].data[0],
        y = land[l].data[1];
      let minDist = 10000; // dummy value
      for (let c = 0; c < manors.length; c++) {
        const dist = Math.hypot(x - manors[c].x, y - manors[c].y);
        if (dist < minDist) {
          minDist = dist;
        }
        if (minDist < spacing) {
          break;
        }
      }
      if (minDist >= spacing) {
        const cell = land[l].index;
        const closest = cultureTree.find(x, y);
        const culture = getCultureId(closest);
        manors.push({
          i: region,
          cell,
          x,
          y,
          region,
          culture
        });
      }
      if (l === land.length - 1) {
        console.error('Cannot place capitals with current spacing. Trying again with reduced spacing');
        l = -1, manors = [], spacing /= 1.2;
      }
    }

    // For each capital create a country
    const scheme = count <= 8 ? colors8 : colors20;
    const mod = +powerInput.value;
    manors.forEach((m, i) => {
      const power = rn(Math.random() * mod / 2 + 1, 1);
      const color = scheme(i / count);
      states.push({
        i,
        color,
        power,
        capital: i
      });
      const p = cells[m.cell];
      p.manor = i;
      p.region = i;
      p.culture = m.culture;
    });
    console.timeEnd('locateCapitals');
  }

  function locateTowns() {
    console.time('locateTowns');
    const count = +manorsInput.value;
    const neutral = +neutralInput.value;
    const manorTree = d3.quadtree();
    manors.forEach((m) => {
      manorTree.add([m.x, m.y]);
    });

    for (let l = 0; manors.length < count && l < land.length; l++) {
      const x = land[l].data[0],
        y = land[l].data[1];
      const c = manorTree.find(x, y);
      const d = Math.hypot(x - c[0], y - c[1]);
      if (d < 6) {
        continue;
      }
      const cell = land[l].index;
      let region = 'neutral',
        culture = -1,
        closest = neutral;
      for (let c = 0; c < states.length; c++) {
        let dist = Math.hypot(manors[c].x - x, manors[c].y - y) / states[c].power;
        const cap = manors[c].cell;
        if (cells[cell].fn !== cells[cap].fn) {
          dist *= 3;
        }
        if (dist < closest) {
          region = c;
          closest = dist;
        }
      }
      if (closest > neutral / 5 || region === 'neutral') {
        const closestCulture = cultureTree.find(x, y);
        culture = getCultureId(closestCulture);
      } else {
        culture = manors[region].culture;
      }
      land[l].manor = manors.length;
      land[l].culture = culture;
      land[l].region = region;
      manors.push({
        i: manors.length,
        cell,
        x,
        y,
        region,
        culture
      });
      manorTree.add([x, y]);
    }
    if (manors.length < count) {
      const error = `Cannot place all burgs. Requested ${count}, placed ${manors.length}`;
      console.error(error);
    }
    console.timeEnd('locateTowns');
  }

  // shift settlements from cell point
  function shiftSettlements() {
    for (let i = 0; i < manors.length; i++) {
      const capital = i < regionsInput.value;
      const cell = cells[manors[i].cell];
      let x = manors[i].x,
        y = manors[i].y;
      if ((capital && cell.harbor) || cell.harbor === 1) {
        // port: capital with any harbor and towns with good harbors
        if (cell.haven === undefined) {
          cell.harbor = undefined;
        } else {
          cell.port = cells[cell.haven].fn;
          x = cell.coastX;
          y = cell.coastY;
        }
      }
      if (cell.river && cell.type !== 1) {
        let shift = 0.2 * cell.flux;
        if (shift < 0.2) {
          shift = 0.2;
        }
        if (shift > 1) {
          shift = 1;
        }
        shift = Math.random() > 0.5 ? shift : shift * -1;
        x = rn(x + shift, 2);
        shift = Math.random() > 0.5 ? shift : shift * -1;
        y = rn(y + shift, 2);
      }
      cell.data[0] = manors[i].x = x;
      cell.data[1] = manors[i].y = y;
    }
  }

  // Validate each island with manors has port
  function checkAccessibility() {
    console.time('checkAccessibility');
    for (let f = 0; f < features.length; f++) {
      if (!features[f].land) {
        continue;
      }
      const manorsOnIsland = $.grep(land, (e) => e.manor !== undefined && e.fn === f);
      if (!manorsOnIsland.length) {
        continue;
      }

      // if lake port is the only port on lake, remove port
      const lakePorts = $.grep(manorsOnIsland, (p) => p.port && !features[p.port].border);
      if (lakePorts.length) {
        const lakes = [];
        lakePorts.forEach((p) => {
          lakes[p.port] = lakes[p.port] ? lakes[p.port] + 1 : 1;
        });
        lakePorts.forEach((p) => {
          if (lakes[p.port] === 1) {
            p.port = undefined;
          }
        });
      }

      // check how many ocean ports are there on island
      const oceanPorts = $.grep(manorsOnIsland, (p) => p.port && features[p.port].border);
      if (oceanPorts.length) {
        continue;
      }
      const portCandidates = $.grep(manorsOnIsland, (c) => c.harbor && features[cells[c.harbor].fn].border && c.ctype === 1);
      if (portCandidates.length) {
        // No ports on island. Upgrading first burg to port
        const candidate = portCandidates[0];
        candidate.harbor = 1;
        candidate.port = cells[candidate.haven].fn;
        const manor = manors[portCandidates[0].manor];
        candidate.data[0] = manor.x = candidate.coastX;
        candidate.data[1] = manor.y = candidate.coastY;
        // add score for each burg on island (as it's the only port)
        candidate.score += Math.floor((portCandidates.length - 1) / 2);
      } else {
        // No ports on island. Reducing score for burgs
        manorsOnIsland.forEach((e) => {
          e.score -= 2;
        });
      }
    }
    console.timeEnd('checkAccessibility');
  }

  function getPathDist(start, end) {
    const queue = new PriorityQueue({
      comparator(a, b) {
        return a.p - b.p;
      }
    });
    let next,
      costNew;
    const cameFrom = [];
    const costTotal = [];
    cameFrom[start] = 'no';
    costTotal[start] = 0;
    queue.queue({
      e: start,
      p: 0
    });
    while (queue.length > 0 && next !== end) {
      next = queue.dequeue().e;
      const pol = cells[next];
      pol.neighbors.forEach((e) => {
        if (cells[e].path && (cells[e].ctype === -1 || cells[e].haven === next)) {
          const dist = Math.hypot(cells[e].data[0] - pol.data[0], cells[e].data[1] - pol.data[1]);
          costNew = costTotal[next] + dist;
          if (!cameFrom[e]) {
            costTotal[e] = costNew;
            cameFrom[e] = next;
            queue.queue({
              e,
              p: costNew
            });
          }
        }
      });
    }
    return costNew;
  }

  function restorePath(end, start, type, from) {
    let path = [],
      current = end;
    const limit = 1000;
    let prev = cells[end];
    if (type === 'ocean' || !prev.path) {
      path.push({
        scX: prev.data[0],
        scY: prev.data[1],
        i: end
      });
    }
    if (!prev.path) {
      prev.path = 1;
    }
    for (let i = 0; i < limit; i++) {
      current = from[current];
      const cur = cells[current];
      if (!cur) {
        break;
      }
      if (cur.path) {
        cur.path += 1;
        path.push({
          scX: cur.data[0],
          scY: cur.data[1],
          i: current
        });
        prev = cur;
        drawPath();
      } else {
        cur.path = 1;
        if (prev) {
          path.push({
            scX: prev.data[0],
            scY: prev.data[1],
            i: prev.index
          });
        }
        prev = undefined;
        path.push({
          scX: cur.data[0],
          scY: cur.data[1],
          i: current
        });
      }
      if (current === start || !from[current]) {
        break;
      }
    }
    drawPath();

    function drawPath() {
      if (path.length > 1) {
        // mark crossroades
        if (type === 'main' || type === 'small') {
          const plus = type === 'main' ? 4 : 2;
          const f = cells[path[0].i];
          if (f.path > 1) {
            if (!f.crossroad) {
              f.crossroad = 0;
            }
            f.crossroad += plus;
          }
          const t = cells[(path[path.length - 1].i)];
          if (t.path > 1) {
            if (!t.crossroad) {
              t.crossroad = 0;
            }
            t.crossroad += plus;
          }
        }
        // draw path segments
        let line = lineGen(path);
        line = round(line, 1);
        let id = 0; // to create unique route id
        if (type === 'main') {
          id = roads.selectAll('path').size();
          roads.append('path').attr('d', line).attr('id', `road${id}`).on('click', editRoute);
        } else if (type === 'small') {
          id = trails.selectAll('path').size();
          trails.append('path').attr('d', line).attr('id', `trail${id}`).on('click', editRoute);
        } else if (type === 'ocean') {
          id = searoutes.selectAll('path').size();
          searoutes.append('path').attr('d', line).attr('id', `searoute${id}`).on('click', editRoute);
        }
      }
      path = [];
    }
  }

  // get settlement and country names based on option selected
  function getNames() {
    console.time('getNames');
    // if names source is an external resource
    if (namesInput.value === '1') {
      const request = new XMLHttpRequest();
      const url = 'https://archivist.xalops.com/archivist-core/api/name/settlement?count=';
      request.open('GET', url + manors.length, true);
      request.onload = function () {
        const names = JSON.parse(request.responseText);
        for (let i = 0; i < manors.length; i++) {
          manors[i].name = names[i];
          burgLabels.select(`[data-id='${i}']`).text(names[i]);
          if (i < states.length) {
            states[i].name = generateStateName(i);
            labels.select('#countries').select(`#regionLabel${i}`).text(states[i].name);
          }
        }
        console.log(names);
      };
      request.send(null);
    }

    if (namesInput.value !== '0') {
      return;
    }
    for (let i = 0; i < manors.length; i++) {
      const culture = manors[i].culture;
      manors[i].name = generateName(culture);
      if (i < states.length) {
        states[i].name = generateStateName(i);
      }
    }
    console.timeEnd('getNames');
  }

  // Define areas based on the closest manor to a polygon
  function defineRegions(withCultures) {
    console.time('defineRegions');
    const manorTree = d3.quadtree();
    manors.forEach((m) => {
      if (m.region !== 'removed') {
        manorTree.add([m.x, m.y]);
      }
    });

    const neutral = +neutralInput.value;
    land.forEach((i) => {
      if (i.manor !== undefined && manors[i.manor].region !== 'removed') {
        i.region = manors[i.manor].region;
        if (withCultures && manors[i.manor].culture !== undefined) {
          i.culture = manors[i.manor].culture;
        }
        return;
      }
      const x = i.data[0],
        y = i.data[1];

      let dist = 100000,
        manor = null;
      if (manors.length) {
        const c = manorTree.find(x, y);
        dist = Math.hypot(c[0] - x, c[1] - y);
        manor = getManorId(c);
      }
      if (dist > neutral / 2 || manor === null) {
        i.region = 'neutral';
        if (withCultures) {
          const closestCulture = cultureTree.find(x, y);
          i.culture = getCultureId(closestCulture);
        }
      } else {
        const cell = manors[manor].cell;
        if (cells[cell].fn !== i.fn) {
          let minDist = dist * 3;
          land.forEach((l) => {
            if (l.fn === i.fn && l.manor !== undefined) {
              if (manors[l.manor].region === 'removed') {
                return;
              }
              const distN = Math.hypot(l.data[0] - x, l.data[1] - y);
              if (distN < minDist) {
                minDist = distN;
                manor = l.manor;
              }
            }
          });
        }
        i.region = manors[manor].region;
        if (withCultures) {
          i.culture = manors[manor].culture;
        }
      }
    });
    console.timeEnd('defineRegions');
  }

  // re-calculate cultures
  function recalculateCultures(fullRedraw) {
    console.time('recalculateCultures');
    // For each capital find closest culture and assign it to capital
    states.forEach((s) => {
      if (s.capital === 'neutral' || s.capital === 'select') {
        return;
      }
      const capital = manors[s.capital];
      const c = cultureTree.find(capital.x, capital.y);
      capital.culture = getCultureId(c);
    });

    // For each town if distance to its capital > neutral / 2,
    // assign closest culture to the town; else assign capital's culture
    const manorTree = d3.quadtree();
    const neutral = +neutralInput.value;
    manors.forEach((m) => {
      if (m.region === 'removed') {
        return;
      }
      manorTree.add([m.x, m.y]);
      if (m.region === 'neutral') {
        const culture = cultureTree.find(m.x, m.y);
        m.culture = getCultureId(culture);
        return;
      }
      const c = states[m.region].capital;
      if (c !== 'neutral' && c !== 'select') {
        const dist = Math.hypot(m.x - manors[c].x, m.y - manors[c].y);
        if (dist <= neutral / 5) {
          m.culture = manors[c].culture;
          return;
        }
      }
      const culture = cultureTree.find(m.x, m.y);
      m.culture = getCultureId(culture);
    });

    // For each land cell if distance to closest manor > neutral / 2,
    // assign closest culture to the cell; else assign manors's culture
    const changed = [];
    land.forEach((i) => {
      const x = i.data[0],
        y = i.data[1];
      const c = manorTree.find(x, y);
      const culture = i.culture;
      const dist = Math.hypot(c[0] - x, c[1] - y);
      let manor = getManorId(c);
      if (dist > neutral / 2 || manor === undefined) {
        const closestCulture = cultureTree.find(i.data[0], i.data[1]);
        i.culture = getCultureId(closestCulture);
      } else {
        const cell = manors[manor].cell;
        if (cells[cell].fn !== i.fn) {
          let minDist = dist * 3;
          land.forEach((l) => {
            if (l.fn === i.fn && l.manor !== undefined) {
              if (manors[l.manor].region === 'removed') {
                return;
              }
              const distN = Math.hypot(l.data[0] - x, l.data[1] - y);
              if (distN < minDist) {
                minDist = distN;
                manor = l.manor;
              }
            }
          });
        }
        i.culture = manors[manor].culture;
      }
      // re-color cells
      if (i.culture !== culture || fullRedraw) {
        const clr = cultures[i.culture].color;
        cults.select(`#cult${i.index}`).attr('fill', clr).attr('stroke', clr);
      }
    });
    console.timeEnd('recalculateCultures');
  }

  // get culture Id from center coordinates
  function getCultureId(c) {
    for (let i = 0; i < cultures.length; i++) {
      if (cultures[i].center[0] === c[0]) {
        if (cultures[i].center[1] === c[1]) {
          return i;
        }
      }
    }
  }

  // get manor Id from center coordinates
  function getManorId(c) {
    for (let i = 0; i < manors.length; i++) {
      if (manors[i].x === c[0]) {
        if (manors[i].y === c[1]) {
          return i;
        }
      }
    }
  }

  function getHex(radius, type) {
    let x0 = 0,
      y0 = 0;
    const s = type === 'pointyHex' ? 0 : Math.PI / -6;
    const thirdPi = Math.PI / 3;
    const angles = [s, s + thirdPi, s + 2 * thirdPi, s + 3 * thirdPi, s + 4 * thirdPi, s + 5 * thirdPi];
    return angles.map((angle) => {
      const x1 = Math.sin(angle) * radius,
        y1 = -Math.cos(angle) * radius,
        dx = x1 - x0,
        dy = y1 - y0;
      x0 = x1, y0 = y1;
      return [dx, dy];
    });
  }

  function getHexGridPoints(size, type) {
    const points = [];
    const rt3 = Math.sqrt(3);
    const off = type === 'pointyHex' ? rt3 * size / 2 : size * 3 / 2;
    const ySpace = type === 'pointyHex' ? size * 3 / 2 : rt3 * size / 2;
    const xSpace = type === 'pointyHex' ? rt3 * size : size * 3;
    for (let y = 0, l = 0; y < graphHeight; y += ySpace, l++) {
      for (let x = l % 2 ? 0 : off; x < graphWidth; x += xSpace) {
        points.push([x, y]);
      }
    }
    return points;
  }

  // close all dialogs except stated
  function closeDialogs(except) {
    except = except || '#except';
    $('.dialog:visible').not(except).each(function (e) {
      $(this).dialog('close');
    });
  }

  function addReliefIcon(height, type, cx, cy, cell) {
    const g = terrain.select(`#${type}`).append('g').attr('data-cell', cell);
    if (type === 'mounts') {
      const h = height >= 0.7 ? (height - 0.55) * 12 : 1.8;
      const rnd = Math.random() * 0.8 + 0.2;
      const mount = `M${cx},${cy} L${cx + h / 3 + rnd},${cy - h / 4 - rnd * 1.2} L${cx + h / 1.1},${cy - h} L${cx + h + rnd},${cy - h / 1.2 + rnd} L${cx + h * 2},${cy}`;
      const shade = `M${cx},${cy} L${cx + h / 3 + rnd},${cy - h / 4 - rnd * 1.2} L${cx + h / 1.1},${cy - h} L${cx + h / 1.5},${cy}`;
      let dash = `M${cx - 0.1},${cy + 0.3} L${cx + 2 * h + 0.1},${cy + 0.3}`;
      dash += `M${cx + 0.4},${cy + 0.6} L${cx + 2 * h - 0.3},${cy + 0.6}`;
      g.append('path').attr('d', round(mount, 1)).attr('stroke', '#5c5c70');
      g.append('path').attr('d', round(shade, 1)).attr('fill', '#999999');
      g.append('path').attr('d', round(dash, 1)).attr('class', 'strokes');
    }
    if (type === 'hills') {
      let h = height > 0.5 ? (height - 0.4) * 10 : 1.2;
      if (h > 1.8) {
        h = 1.8;
      }
      const hill = `M${cx},${cy} Q${cx + h},${cy - h} ${cx + 2 * h},${cy}`;
      const shade = `M${cx + 0.6 * h},${cy + 0.1} Q${cx + h * 0.95},${cy - h * 0.91} ${cx + 2 * h * 0.97},${cy}`;
      let dash = `M${cx - 0.1},${cy + 0.2} L${cx + 2 * h + 0.1},${cy + 0.2}`;
      dash += `M${cx + 0.4},${cy + 0.4} L${cx + 2 * h - 0.3},${cy + 0.4}`;
      g.append('path').attr('d', round(hill, 1)).attr('stroke', '#5c5c70');
      g.append('path').attr('d', round(shade, 1)).attr('fill', 'white');
      g.append('path').attr('d', round(dash, 1)).attr('class', 'strokes');
    }
    if (type === 'swamps') {
      const swamp = drawSwamp(cx, cy);
      g.append('path').attr('d', round(swamp, 1));
    }
    if (type === 'forests') {
      const rnd = Math.random();
      const h = rnd * 0.4 + 0.6;
      const forest = `M${cx},${cy} q-1,0.8 -0.05,1.25 v0.75 h0.1 v-0.75 q0.95,-0.47 -0.05,-1.25 z `;
      const light = `M${cx},${cy} q-1,0.8 -0.05,1.25 h0.1 q0.95,-0.47 -0.05,-1.25 z `;
      const shade = `M${cx},${cy} q-1,0.8 -0.05,1.25 q-0.2,-0.55 0,-1.1 z `;
      g.append('path').attr('d', forest);
      g.append('path').attr('d', light).attr('fill', 'white').attr('stroke', 'none');
      g.append('path').attr('d', shade).attr('fill', '#999999').attr('stroke', 'none');
    }
    g.on('click', editReliefIcon);
    return g;
  }

  function compareY(a, b) {
    if (a.data[1] > b.data[1]) {
      return 1;
    }
    if (a.data[1] < b.data[1]) {
      return -1;
    }
    return 0;
  }

  function dragged(e) {
    const el = d3.select(this);
    const x = d3.event.x;
    const y = d3.event.y;
    el.raise().classed('drag', true);
    if (el.attr('x')) {
      el.attr('x', x).attr('y', y + 0.8);
      const matrix = el.attr('transform');
      if (matrix) {
        const angle = matrix.split('(')[1].split(')')[0].split(' ')[0];
        const bbox = el.node().getBBox();
        const rotate = `rotate(${angle} ${bbox.x + bbox.width / 2} ${bbox.y + bbox.height / 2})`;
        el.attr('transform', rotate);
      }
    } else {
      el.attr('cx', x).attr('cy', y);
    }
  }

  function dragended(d) {
    d3.select(this).classed('drag', false);
  }

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

  // Add support "click to add" button events
  $('#customizeTab').click(clickToAdd);

  function clickToAdd() {
    if (modules.clickToAdd) {
      return;
    }
    modules.clickToAdd = true;

    // add label on click
    $('#addLabel').click(function () {
      if ($(this).hasClass('pressed')) {
        $('.pressed').removeClass('pressed');
        restoreDefaultEvents();
      } else {
        $('.pressed').removeClass('pressed');
        $(this).addClass('pressed');
        closeDialogs('.stable');
        viewbox.style('cursor', 'crosshair').on('click', addLabelOnClick);
      }
    });

    function addLabelOnClick() {
      const point = d3.mouse(this);
      const index = getIndex(point);
      const x = rn(point[0], 2),
        y = rn(point[1], 2);

      // get culture in clicked point to generate a name
      const closest = cultureTree.find(x, y);
      const culture = cultureTree.data().indexOf(closest) || 0;
      const name = generateName(culture);

      let group = labels.select('#addedLabels');
      if (!group.size()) {
        group = labels.append('g').attr('id', 'addedLabels')
          .attr('fill', '#3e3e4b').attr('opacity', 1)
          .attr('font-family', 'Almendra SC')
          .attr('data-font', 'Almendra+SC')
          .attr('font-size', 18)
          .attr('data-size', 18);
      }
      const id = `label${Date.now().toString().slice(7)}`;
      group.append('text').attr('id', id).attr('x', x).attr('y', y)
        .text(name)
        .on('click', editLabel);

      if (d3.event.shiftKey === false) {
        $('#addLabel').removeClass('pressed');
        restoreDefaultEvents();
      }
    }

    // add burg on click
    $('#addBurg').click(function () {
      if ($(this).hasClass('pressed')) {
        $('.pressed').removeClass('pressed');
        restoreDefaultEvents();
        tip('', true);
      } else {
        $('.pressed').removeClass('pressed');
        $(this).attr('data-state', -1).addClass('pressed');
        $('#burgAdd, #burgAddfromEditor').addClass('pressed');
        viewbox.style('cursor', 'crosshair').on('click', addBurgOnClick);
        tip('Click on map to place burg icon with a label. Hold Shift to place several', true);
      }
    });

    function addBurgOnClick() {
      const point = d3.mouse(this);
      const index = getIndex(point);
      const x = rn(point[0], 2),
        y = rn(point[1], 2);

      // get culture in clicked point to generate a name
      let culture = cells[index].culture;
      if (culture === undefined) {
        culture = 0;
      }
      const name = generateName(culture);

      if (cells[index].height < 20) {
        tip('Cannot place burg in the water! Select a land cell', null, 'error');
        return;
      }
      if (cells[index].manor !== undefined) {
        tip('There is already a burg in this cell. Please select a free cell', null, 'error');
        $('#grid').fadeIn();
        d3.select('#toggleGrid').classed('buttonoff', false);
        return;
      }
      const i = manors.length;
      const size = burgIcons.select('#towns').attr('size');
      burgIcons.select('#towns').append('circle').attr('id', `burg${i}`).attr('data-id', i)
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', size)
        .on('click', editBurg);
      burgLabels.select('#towns').append('text').attr('data-id', i).attr('x', x)
        .attr('y', y)
        .attr('dy', '-0.35em')
        .text(name)
        .on('click', editBurg);
      invokeActiveZooming();

      if (d3.event.shiftKey === false) {
        $('#addBurg, #burgAdd, #burgAddfromEditor').removeClass('pressed');
        restoreDefaultEvents();
      }

      let region,
        state = +$('#addBurg').attr('data-state');
      if (state !== -1) {
        region = states[state].capital === 'neutral' ? 'neutral' : state;
        const oldRegion = cells[index].region;
        if (region !== oldRegion) {
          cells[index].region = region;
          redrawRegions();
        }
      } else {
        region = cells[index].region;
        state = region === 'neutral' ? states.length - 1 : region;
      }
      cells[index].manor = i;
      let score = cells[index].score;
      if (score <= 0) {
        score = rn(Math.random(), 2);
      }
      if (cells[index].crossroad) {
        score += cells[index].crossroad;
      } // crossroads
      if (cells[index].confluence) {
        score += Math.pow(cells[index].confluence, 0.3);
      } // confluences
      if (cells[index].port !== undefined) {
        score *= 3;
      } // port-capital
      const population = rn(score, 1);
      manors.push({
        i,
        cell: index,
        x,
        y,
        region,
        culture,
        name,
        population
      });
      recalculateStateData(state);
      updateCountryEditors();
      tip('', true);
    }

    // add river on click
    $('#addRiver').click(function () {
      if ($(this).hasClass('pressed')) {
        $('.pressed').removeClass('pressed');
        unselect();
      } else {
        $('.pressed').removeClass('pressed');
        unselect();
        $(this).addClass('pressed');
        closeDialogs('.stable');
        viewbox.style('cursor', 'crosshair').on('click', addRiverOnClick);
        tip('Click on map to place new river or extend an existing one', true);
      }
    });

    function addRiverOnClick() {
      const point = d3.mouse(this);
      const index = diagram.find(point[0], point[1]).index;
      let cell = cells[index];
      if (cell.river || cell.height < 20) {
        return;
      }
      const dataRiver = []; // to store river points
      const last = $('#rivers > path').last();
      const river = last.length ? +last.attr('id').slice(5) + 1 : 0;
      cell.flux = 0.85;
      while (cell) {
        cell.river = river;
        const x = cell.data[0],
          y = cell.data[1];
        dataRiver.push({
          x,
          y,
          cell: index
        });
        const nHeights = [];
        cell.neighbors.forEach((e) => {
          nHeights.push(cells[e].height);
        });
        const minId = nHeights.indexOf(d3.min(nHeights));
        const min = cell.neighbors[minId];
        const tx = cells[min].data[0],
          ty = cells[min].data[1];
        if (cells[min].height < 20) {
          const px = (x + tx) / 2;
          const py = (y + ty) / 2;
          dataRiver.push({
            x: px,
            y: py,
            cell: index
          });
          cell = undefined;
        } else if (cells[min].river === undefined) {
          cells[min].flux += cell.flux;
          cell = cells[min];
        } else {
          const r = cells[min].river;
          const riverEl = $(`#river${r}`);
          const riverCells = $.grep(land, (e) => e.river === r);
          riverCells.sort((a, b) => b.height - a.height);
          const riverCellsUpper = $.grep(riverCells, (e) => e.height > cells[min].height);
          if (dataRiver.length > riverCellsUpper.length) {
            // new river is more perspective
            const avPrec = rn(precInput.value / Math.sqrt(cells.length), 2);
            const dataRiverMin = [];
            riverCells.map((c) => {
              if (c.height < cells[min].height) {
                cells[c.index].river = undefined;
                cells[c.index].flux = avPrec;
              } else {
                dataRiverMin.push({
                  x: c.data[0],
                  y: c.data[1],
                  cell: c.index
                });
              }
            });
            cells[min].flux += cell.flux;
            if (cells[min].confluence) {
              cells[min].confluence += riverCellsUpper.length;
            } else {
              cells[min].confluence = riverCellsUpper.length;
            }
            cell = cells[min];
            // redraw old river's upper part or remove if small
            if (dataRiverMin.length > 1) {
              var riverAmended = amendRiver(dataRiverMin, 1);
              var d = drawRiver(riverAmended, 1.3, 1);
              riverEl.attr('d', d).attr('data-width', 1.3).attr('data-increment', 1);
            } else {
              riverEl.remove();
              dataRiverMin.map((c) => {
                cells[c.cell].river = undefined;
              });
            }
          } else {
            if (cells[min].confluence) {
              cells[min].confluence += dataRiver.length;
            } else {
              cells[min].confluence = dataRiver.length;
            }
            cells[min].flux += cell.flux;
            dataRiver.push({
              x: tx,
              y: ty,
              cell: min
            });
            cell = undefined;
          }
        }
      }
      const rndFactor = 0.2 + Math.random() * 1.6; // random factor in range 0.2-1.8
      var riverAmended = amendRiver(dataRiver, rndFactor);
      var d = drawRiver(riverAmended, 1.3, 1);
      rivers.append('path').attr('d', d).attr('id', `river${river}`)
        .attr('data-width', 1.3)
        .attr('data-increment', 1)
        .on('click', editRiver);
    }

    // add relief icon on click
    $('#addRelief').click(function () {
      if ($(this).hasClass('pressed')) {
        $('.pressed').removeClass('pressed');
        restoreDefaultEvents();
      } else {
        $('.pressed').removeClass('pressed');
        $(this).addClass('pressed');
        closeDialogs('.stable');
        viewbox.style('cursor', 'crosshair').on('click', addReliefOnClick);
        tip('Click on map to place relief icon. Hold Shift to place several', true);
      }
    });

    function addReliefOnClick() {
      const point = d3.mouse(this);
      const index = getIndex(point);
      const height = cells[index].height;
      if (height < 20) {
        tip('Cannot place icon in the water! Select a land cell');
        return;
      }

      const x = rn(point[0], 2),
        y = rn(point[1], 2);
      const type = reliefGroup.value;
      addReliefIcon(height / 100, type, x, y, index);

      if (d3.event.shiftKey === false) {
        $('#addRelief').removeClass('pressed');
        restoreDefaultEvents();
      }
      tip('', true);
    }

    // add route on click
    $('#addRoute').click(() => {
      if (!modules.editRoute) {
        editRoute();
      }
      $('#routeNew').click();
    });

    // add marker on click
    $('#addMarker').click(function () {
      if ($(this).hasClass('pressed')) {
        $('.pressed').removeClass('pressed');
        restoreDefaultEvents();
      } else {
        $('.pressed').removeClass('pressed');
        $(this).addClass('pressed');
        $('#markerAdd').addClass('pressed');
        viewbox.style('cursor', 'crosshair').on('click', addMarkerOnClick);
      }
    });

    function addMarkerOnClick() {
      const point = d3.mouse(this);
      let x = rn(point[0], 2),
        y = rn(point[1], 2);
      const selected = markerSelectGroup.value;
      const valid = selected && d3.select('#defs-markers').select(`#${selected}`).size() === 1;
      const symbol = valid ? `#${selected}` : '#marker0';
      let desired = valid ? markers.select(`[data-id='${symbol}']`).attr('data-size') : 1;
      if (isNaN(desired)) {
        desired = 1;
      }
      const id = `marker${Date.now().toString().slice(7)}`; // unique id
      const size = desired * 5 + 25 / scale;

      markers.append('use').attr('id', id).attr('xlink:href', symbol).attr('data-id', symbol)
        .attr('data-x', x)
        .attr('data-y', y)
        .attr('x', x - size / 2)
        .attr('y', y - size)
        .attr('data-size', desired)
        .attr('width', size)
        .attr('height', size)
        .on('click', editMarker);

      if (d3.event.shiftKey === false) {
        $('#addMarker, #markerAdd').removeClass('pressed');
        restoreDefaultEvents();
      }
    }
  }

  // return cell / polly Index or error
  function getIndex(point) {
    const c = diagram.find(point[0], point[1]);
    if (!c) {
      console.error(`Cannot find closest cell for points${point[0]}, ${point[1]}`);
      return;
    }
    return c.index;
  }

  // re-calculate data for a particular state
  function recalculateStateData(state) {
    const s = states[state] || states[states.length - 1];
    if (s.capital === 'neutral') {
      state = 'neutral';
    }
    const burgs = $.grep(manors, (e) => e.region === state);
    s.burgs = burgs.length;
    let burgsPop = 0; // get summ of all burgs population
    burgs.map((b) => {
      burgsPop += b.population;
    });
    s.urbanPopulation = rn(burgsPop, 1);
    const regionCells = $.grep(cells, (e) => (e.region === state));
    let cellsPop = 0,
      area = 0;
    regionCells.map((c) => {
      cellsPop += c.pop;
      area += c.area;
    });
    s.cells = regionCells.length;
    s.area = rn(area);
    s.ruralPopulation = rn(cellsPop, 1);
  }

  function changeSelectedOnClick() {
    const point = d3.mouse(this);
    const index = diagram.find(point[0], point[1]).index;
    if (cells[index].height < 20) {
      return;
    }
    $('.selected').removeClass('selected');
    let color;

    // select state
    if (customization === 2) {
      const assigned = regions.select('#temp').select(`path[data-cell='${index}']`);
      let s = assigned.size() ? assigned.attr('data-state') : cells[index].region;
      if (s === 'neutral') {
        s = states.length - 1;
      }
      color = states[s].color;
      if (color === 'neutral') {
        color = 'white';
      }
      $(`#state${s}`).addClass('selected');
    }

    // select culture
    if (customization === 4) {
      const assigned = cults.select(`#cult${index}`);
      const c = assigned.attr('data-culture') !== null ?
        +assigned.attr('data-culture') :
        cells[index].culture;
      color = cultures[c].color;
      $(`#culture${c}`).addClass('selected');
    }

    debug.selectAll('.circle').attr('stroke', color);
  }

  // Map Loader based on FileSystem API
  $('#mapToLoad').change(function () {
    console.time('loadMap');
    closeDialogs();
    const fileToLoad = this.files[0];
    this.value = '';
    uploadFile(fileToLoad);
  });

  // get square grid with some jirrering
  function getJitteredGrid() {
    const sizeMod = rn((graphWidth + graphHeight) / 1500, 2); // screen size modifier
    spacing = rn(7.5 * sizeMod / graphSize, 2); // space between points before jirrering
    const radius = spacing / 2; // square radius
    const jittering = radius * 0.9; // max deviation
    const jitter = function () {
      return Math.random() * 2 * jittering - jittering;
    };
    const points = [];
    for (let y = radius; y < graphHeight; y += spacing) {
      for (let x = radius; x < graphWidth; x += spacing) {
        const xj = rn(x + jitter(), 2);
        const yj = rn(y + jitter(), 2);
        points.push([xj, yj]);
      }
    }
    return points;
  }

  // Hotkeys, see github.com/Azgaar/Fantasy-Map-Generator/wiki/Hotkeys
  d3.select('body').on('keydown', function () {
    const active = document.activeElement.tagName;
    if (active === 'INPUT' || active === 'SELECT' || active === 'TEXTAREA') {
      return;
    }
    const key = d3.event.keyCode;
    const ctrl = d3.event.ctrlKey;
    const p = d3.mouse(this);
    if (key === 117) {
      $('#randomMap').click();
    } // "F6" for new map
    else if (key === 27) {
      closeDialogs();
    } // Escape to close all dialogs
    else if (key === 79) {
      optionsTrigger.click();
    } // "O" to toggle options
    else if (key === 80) {
      saveAsImage('png');
    } // "P" to save as PNG
    else if (key === 83) {
      saveAsImage('svg');
    } // "S" to save as SVG
    else if (key === 77) {
      saveMap();
    } // "M" to save MAP file
    else if (key === 76) {
      mapToLoad.click();
    } // "L" to load MAP
    else if (key === 32) {
      console.table(cells[diagram.find(p[0], p[1]).index]);
    } // Space to log focused cell data
    else if (key === 192) {
      console.log(cells);
    } // "`" to log cells data
    else if (key === 66) {
      console.table(manors);
    } // "B" to log burgs data
    else if (key === 67) {
      console.table(states);
    } // "C" to log countries data
    else if (key === 70) {
      console.table(features);
    } // "F" to log features data
    else if (key === 37) {
      zoom.translateBy(svg, 10, 0);
    } // Left to scroll map left
    else if (key === 39) {
      zoom.translateBy(svg, -10, 0);
    } // Right to scroll map right
    else if (key === 38) {
      zoom.translateBy(svg, 0, 10);
    } // Up to scroll map up
    else if (key === 40) {
      zoom.translateBy(svg, 0, -10);
    } // Up to scroll map up
    else if (key === 107) {
      zoom.scaleBy(svg, 1.2);
    } // Plus to zoom map up
    else if (key === 109) {
      zoom.scaleBy(svg, 0.8);
    } // Minus to zoom map out
    else if (key === 48 || key === 96) {
      resetZoom();
    } // 0 to reset zoom
    else if (key === 49 || key === 97) {
      zoom.scaleTo(svg, 1);
    } // 1 to zoom to 1
    else if (key === 50 || key === 98) {
      zoom.scaleTo(svg, 2);
    } // 2 to zoom to 2
    else if (key === 51 || key === 99) {
      zoom.scaleTo(svg, 3);
    } // 3 to zoom to 3
    else if (key === 52 || key === 100) {
      zoom.scaleTo(svg, 4);
    } // 4 to zoom to 4
    else if (key === 53 || key === 101) {
      zoom.scaleTo(svg, 5);
    } // 5 to zoom to 5
    else if (key === 54 || key === 102) {
      zoom.scaleTo(svg, 6);
    } // 6 to zoom to 6
    else if (key === 55 || key === 103) {
      zoom.scaleTo(svg, 7);
    } // 7 to zoom to 7
    else if (key === 56 || key === 104) {
      zoom.scaleTo(svg, 8);
    } // 8 to zoom to 8
    else if (key === 57 || key === 105) {
      zoom.scaleTo(svg, 9);
    } // 9 to zoom to 9
    else if (key === 9) {
      $('#updateFullscreen').click();
    } // Tab to fit map to fullscreen
    else if (ctrl && key === 90) {
      undo.click();
    } // Ctrl + "Z" to toggle undo
    else if (ctrl && key === 89) {
      redo.click();
    } // Ctrl + "Y" to toggle undo
  });

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

  // get square grid cell index based on coords
  function getCellIndex(x, y) {
    const index = diagram.find(x, y).index;
    // let cellsX = Math.round(graphWidth / spacing);
    // let index = Math.ceil(y / spacing) * cellsX + Math.round(x / spacing);
    return index;
  }

  function transformPt(pt) {
    const width = 320,
      maxHeight = 0.2;
    const [x, y] = projectIsometric(pt[0], pt[1]);
    return [x + width / 2 + 10, y + 10 - pt[2] * maxHeight];
  }

  function projectIsometric(x, y) {
    const scale = 1,
      yProj = 4;
    return [(x - y) * scale, (x + y) / yProj * scale];
  }

  // interprete template function
  function addStep(feature, count, dist) {
    if (!feature) {
      return;
    }
    if (feature === 'Mountain') {
      templateMountain.click();
    }
    if (feature === 'Hill') {
      templateHill.click();
    }
    if (feature === 'Pit') {
      templatePit.click();
    }
    if (feature === 'Range') {
      templateRange.click();
    }
    if (feature === 'Trough') {
      templateTrough.click();
    }
    if (feature === 'Strait') {
      templateStrait.click();
    }
    if (feature === 'Add') {
      templateAdd.click();
    }
    if (feature === 'Multiply') {
      templateMultiply.click();
    }
    if (feature === 'Smooth') {
      templateSmooth.click();
    }
    if (count) {
      $('#templateBody div:last-child .templateElCount').val(count);
    }
    if (dist !== undefined) {
      if (dist !== 'land') {
        const option = `<option value="${dist}">${dist}</option>`;
        $('#templateBody div:last-child .templateElDist').append(option);
      }
      $('#templateBody div:last-child .templateElDist').val(dist);
    }
  }

  function heightsFromImage(count) {
    const imageData = ctx.getImageData(0, 0, svgWidth, svgHeight);
    const data = imageData.data;
    $('#landmass > path, .color-div').remove();
    $('#landmass, #colorsUnassigned').fadeIn();
    $('#colorsAssigned').fadeOut();
    const colors = [],
      palette = [];
    points.map((i) => {
      let x = rn(i[0]),
        y = rn(i[1]);
      if (y == svgHeight) {
        y--;
      }
      if (x == svgWidth) {
        x--;
      }
      const p = (x + y * svgWidth) * 4;
      const r = data[p],
        g = data[p + 1],
        b = data[p + 2];
      colors.push([r, g, b]);
    });
    const cmap = MMCQ.quantize(colors, count);
    heights = new Uint8Array(points.length);
    polygons.map((i, d) => {
      const nearest = cmap.nearest(colors[d]);
      const rgb = `rgb(${nearest[0] }, ${ nearest[1] }, ${ nearest[2] })`;
      const hex = toHEX(rgb);
      if (palette.indexOf(hex) === -1) {
        palette.push(hex);
      }
      landmass.append('path')
        .attr('d', `M${i.join('L')}Z`).attr('data-i', d)
        .attr('fill', hex)
        .attr('stroke', hex);
    });
    landmass.selectAll('path').on('click', landmassClicked);
    palette.sort((a, b) => d3.lab(a).b - d3.lab(b).b).map((i) => {
      $('#colorsUnassigned').append(`<div class="color-div" id="${i.substr(1)}" style="background-color: ${i};"/>`);
    });
    $('.color-div').click(selectColor);
  }

  function landmassClicked() {
    const color = d3.select(this).attr('fill');
    $(`#${color.slice(1)}`).click();
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

  function showHeight() {
    const el = d3.select(this);
    const height = el.attr('data-color');
    $('#colorsSelectValue').text(height);
    $('#colorScheme .hoveredColor').removeClass('hoveredColor');
    el.classed('hoveredColor', 1);
  }

  function assignHeight() {
    const sel = $('.selectedColor')[0];
    const height = +d3.select(this).attr('data-color');
    const rgb = color(1 - height / 100);
    const hex = toHEX(rgb);
    sel.style.backgroundColor = rgb;
    sel.setAttribute('data-height', height);
    const cur = `#${sel.id}`;
    sel.id = hex.substr(1);
    landmass.selectAll('.selectedCell').each(function () {
      d3.select(this).attr('fill', hex).attr('stroke', hex);
      const i = +d3.select(this).attr('data-i');
      heights[i] = height;
    });
    const parent = sel.parentNode;
    if (parent.id === 'colorsUnassigned') {
      colorsAssigned.appendChild(sel);
      $('#colorsAssigned').fadeIn();
      if ($('#colorsUnassigned .color-div').length < 1) {
        $('#colorsUnassigned').fadeOut();
      }
    }
    if ($('#colorsAssigned .color-div').length > 1) {
      sortAssignedColors();
    }
  }

  // sort colors based on assigned height
  function sortAssignedColors() {
    const data = [];
    const colors = d3.select('#colorsAssigned').selectAll('.color-div');
    colors.each(function (d) {
      const id = d3.select(this).attr('id');
      const height = +d3.select(this).attr('data-height');
      data.push({
        id,
        height
      });
    });
    data.sort((a, b) => a.height - b.height).map((i) => {
      $('#colorsAssigned').append($(`#${i.id}`));
    });
  }

  // auto assign color based on luminosity or hue
  function autoAssing(type) {
    const imageData = ctx.getImageData(0, 0, svgWidth, svgHeight);
    const data = imageData.data;
    $('#landmass > path, .color-div').remove();
    $('#colorsAssigned').fadeIn();
    $('#colorsUnassigned').fadeOut();
    polygons.forEach((i, d) => {
      let x = rn(i.data[0]),
        y = rn(i.data[1]);
      if (y == svgHeight) {
        y--;
      }
      if (x == svgWidth) {
        x--;
      }
      const p = (x + y * svgWidth) * 4;
      const r = data[p],
        g = data[p + 1],
        b = data[p + 2];
      const lab = d3.lab(`rgb(${r}, ${ g}, ${b })`);
      if (type === 'hue') {
        var normalized = rn(normalize(lab.b + lab.a / 2, -50, 200), 2);
      } else {
        var normalized = rn(normalize(lab.l, 0, 100), 2);
      }
      const rgb = color(1 - normalized);
      const hex = toHEX(rgb);
      heights[d] = normalized * 100;
      landmass.append('path').attr('d', `M${ i.join('L') }Z`).attr('data-i', d).attr('fill', hex)
        .attr('stroke', hex);
    });
    const unique = [...new Set(heights)].sort();
    unique.forEach((h) => {
      const rgb = color(1 - h / 100);
      const hex = toHEX(rgb);
      $('#colorsAssigned').append(`<div class="color-div" id="${hex.substr(1)}" data-height="${h}" style="background-color: ${hex};"/>`);
    });
    $('.color-div').click(selectColor);
  }

  function completeConvertion() {
    mockHeightmap();
    restartHistory();
    $('.color-div').remove();
    $('#colorsAssigned, #colorsUnassigned').fadeOut();
    grid.attr('stroke-width', 0.1);
    canvas.style.opacity = convertOverlay.value = convertOverlayValue.innerHTML = 0;
    // turn on paint brushes drag and cursor
    viewbox.style('cursor', 'crosshair').call(drag);
    $('#imageConverter').dialog('close');
  }

  // Enter Heightmap Customization mode
  function customizeHeightmap() {
    customization = 1;
    tip('Heightmap customization mode is active. Click on "Complete" to finalize the Heightmap', true);
    $('#getMap').removeClass('buttonoff').addClass('glow');
    resetZoom();
    landmassCounter.innerHTML = '0';
    $('#grid').fadeIn();
    $('#toggleGrid').removeClass('buttonoff');
    restartHistory();
    $('#customizationMenu').slideDown();
    $('#openEditor').slideUp();
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
      toggleHeight();
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

  // restore keeped region / burgs / cultures data on edit heightmap completion
  function restoreRegions() {
    borders.selectAll('path').remove();
    removeAllLabelsInGroup('countries');
    manors.map((m) => {
      const cell = diagram.find(m.x, m.y).index;
      if (cells[cell].height < 20) {
        // remove manor in ocean
        m.region = 'removed';
        m.cell = cell;
        d3.selectAll(`[data-id='${m.i}']`).remove();
      } else {
        m.cell = cell;
        cells[cell].manor = m.i;
      }
    });
    cells.map((c) => {
      if (c.height < 20) {
        // no longer a land cell
        delete c.region;
        delete c.culture;
        return;
      }
      if (c.region === undefined) {
        c.region = 'neutral';
        if (states[states.length - 1].capital !== 'neutral') {
          states.push({
            i: states.length,
            color: 'neutral',
            capital: 'neutral',
            name: 'Neutrals'
          });
        }
      }
      if (c.culture === undefined) {
        const closest = cultureTree.find(c.data[0], c.data[1]);
        c.culture = cultureTree.data().indexOf(closest);
      }
    });
    states.map((s) => {
      recalculateStateData(s.i);
    });
    drawRegions();
  }

  function regenerateCountries() {
    regions.selectAll('*').remove();
    const neutral = neutralInput.value = +countriesNeutral.value;
    manors.forEach((m) => {
      if (m.region === 'removed') {
        return;
      }
      let state = 'neutral',
        closest = neutral;
      states.map((s) => {
        if (s.capital === 'neutral' || s.capital === 'select') {
          return;
        }
        const c = manors[s.capital];
        let dist = Math.hypot(c.x - m.x, c.y - m.y) / s.power;
        if (cells[m.cell].fn !== cells[c.cell].fn) {
          dist *= 3;
        }
        if (dist < closest) {
          state = s.i;
          closest = dist;
        }
      });
      m.region = state;
      cells[m.cell].region = state;
    });

    defineRegions();
    const temp = regions.append('g').attr('id', 'temp');
    land.forEach((l) => {
      if (l.region === undefined) {
        return;
      }
      if (l.region === 'neutral') {
        return;
      }
      const color = states[l.region].color;
      temp.append('path')
        .attr('data-cell', l.index).attr('data-state', l.region)
        .attr('d', `M${ polygons[l.index].join('L') }Z`)
        .attr('fill', color)
        .attr('stroke', color);
    });
    const neutralCells = $.grep(cells, (e) => e.region === 'neutral');
    const last = states.length - 1;
    const type = states[last].color;
    if (type === 'neutral' && !neutralCells.length) {
      // remove neutral line
      $(`#state${last}`).remove();
      states.splice(-1);
    }
    // recalculate data for all countries
    states.map((s) => {
      recalculateStateData(s.i);
      $(`#state${s.i } > .stateCells`).text(s.cells);
      $(`#state${s.i } > .stateBurgs`).text(s.burgs);
      const area = rn(s.area * Math.pow(distanceScale.value, 2));
      const unit = areaUnit.value === 'square' ? ` ${ distanceUnit.value }²` : ` ${areaUnit.value}`;
      $(`#state${s.i} > .stateArea`).text(si(area) + unit);
      const urban = rn(s.urbanPopulation * urbanization.value * populationRate.value);
      const rural = rn(s.ruralPopulation * populationRate.value);
      const population = (urban + rural) * 1000;
      $(`#state${ s.i} > .statePopulation`).val(si(population));
      $(`#state${s.i}`).attr('data-cells', s.cells).attr('data-burgs', s.burgs)
        .attr('data-area', area)
        .attr('data-population', population);
    });
    if (type !== 'neutral' && neutralCells.length) {
      // add neutral line
      states.push({
        i: states.length,
        color: 'neutral',
        capital: 'neutral',
        name: 'Neutrals'
      });
      recalculateStateData(states.length - 1);
      editCountries();
    }
  }

  // enter state edit mode
  function mockRegions() {
    if (grid.style('display') !== 'inline') {
      toggleGrid.click();
    }
    if (labels.style('display') !== 'none') {
      toggleLabels.click();
    }
    stateBorders.selectAll('*').remove();
    neutralBorders.selectAll('*').remove();
  }

  // handle DOM elements sorting on header click
  $('.sortable').on('click', function () {
    const el = $(this);
    // remove sorting for all siglings except of clicked element
    el.siblings().removeClass('icon-sort-name-up icon-sort-name-down icon-sort-number-up icon-sort-number-down');
    const type = el.hasClass('alphabetically') ? 'name' : 'number';
    let state = 'no';
    if (el.is('[class*=\'down\']')) {
      state = 'asc';
    }
    if (el.is('[class*=\'up\']')) {
      state = 'desc';
    }
    const sortby = el.attr('data-sortby');
    const list = el.parent().next(); // get list container element (e.g. "countriesBody")
    const lines = list.children('div'); // get list elements
    if (state === 'no' || state === 'asc') { // sort desc
      el.removeClass(`icon-sort-${type}-down`);
      el.addClass(`icon-sort-${type}-up`);
      lines.sort((a, b) => {
        let an = a.getAttribute(`data-${sortby}`);
        if (an === 'bottom') {
          return 1;
        }
        let bn = b.getAttribute(`data-${sortby}`);
        if (bn === 'bottom') {
          return -1;
        }
        if (type === 'number') {
          an = +an;
          bn = +bn;
        }
        if (an > bn) {
          return 1;
        }
        if (an < bn) {
          return -1;
        }
        return 0;
      });
    }
    if (state === 'desc') { // sort asc
      el.removeClass(`icon-sort-${type}-up`);
      el.addClass(`icon-sort-${type}-down`);
      lines.sort((a, b) => {
        let an = a.getAttribute(`data-${sortby}`);
        if (an === 'bottom') {
          return 1;
        }
        let bn = b.getAttribute(`data-${sortby}`);
        if (bn === 'bottom') {
          return -1;
        }
        if (type === 'number') {
          an = +an;
          bn = +bn;
        }
        if (an < bn) {
          return 1;
        }
        if (an > bn) {
          return -1;
        }
        return 0;
      });
    }
    lines.detach().appendTo(list);
  });

  // load text file with new burg names
  $('#burgsListToLoad').change(function () {
    const fileToLoad = this.files[0];
    this.value = '';
    const fileReader = new FileReader();
    fileReader.onload = function (fileLoadedEvent) {
      const dataLoaded = fileLoadedEvent.target.result;
      const data = dataLoaded.split('\r\n');
      if (data.length === 0) {
        return;
      }
      const change = [];
      let message = 'Burgs will be renamed as below. Please confirm';
      message += '<div class="overflow-div"><table class="overflow-table"><tr><th>Id</th><th>Current name</th><th>New Name</th></tr>';
      for (let i = 0; i < data.length && i < manors.length; i++) {
        const v = data[i];
        if (v === '' || v === undefined) {
          continue;
        }
        if (v === manors[i].name) {
          continue;
        }
        change.push({
          i,
          name: v
        });
        message += `<tr><td style="width:20%">${i}</td><td style="width:40%">${manors[i].name}</td><td style="width:40%">${v}</td></tr>`;
      }
      message += '</tr></table></div>';
      alertMessage.innerHTML = message;
      $('#alert').dialog({
        title: 'Burgs bulk renaming',
        position: {
          my: 'center',
          at: 'center',
          of: 'svg'
        },
        buttons: {
          Cancel() {
            $(this).dialog('close');
          },
          Confirm() {
            for (let i = 0; i < change.length; i++) {
              const id = change[i].i;
              manors[id].name = change[i].name;
              labels.select(`[data-id='${id }']`).text(change[i].name);
            }
            $(this).dialog('close');
            updateCountryEditors();
          }
        }
      });
    };
    fileReader.readAsText(fileToLoad, 'UTF-8');
  });

  

  // fit full-screen map if window is resized
  $(window).resize((e) => {
    // trick to prevent resize on download bar opening
    if (autoResize === false) {
      return;
    }
    mapWidthInput.value = window.innerWidth;
    mapHeightInput.value = window.innerHeight;
    changeMapSize();
  });

  // restore initial style
  function applyDefaultStyle() {
    viewbox.on('touchmove mousemove', moved);
    landmass.attr('opacity', 1).attr('fill', '#eef6fb');
    coastline.attr('opacity', 0.5).attr('stroke', '#1f3846').attr('stroke-width', 0.7).attr('filter', 'url(#dropShadow)');
    regions.attr('opacity', 0.4);
    stateBorders.attr('opacity', 0.8).attr('stroke', '#56566d').attr('stroke-width', 0.7).attr('stroke-dasharray', '1.2 1.5')
      .attr('stroke-linecap', 'butt');
    neutralBorders.attr('opacity', 0.8).attr('stroke', '#56566d').attr('stroke-width', 0.5).attr('stroke-dasharray', '1 1.5')
      .attr('stroke-linecap', 'butt');
    cults.attr('opacity', 0.6);
    rivers.attr('opacity', 1).attr('fill', '#5d97bb');
    lakes.attr('opacity', 0.5).attr('fill', '#a6c1fd').attr('stroke', '#5f799d').attr('stroke-width', 0.7);
    icons.selectAll('g').attr('opacity', 1).attr('fill', '#ffffff').attr('stroke', '#3e3e4b');
    roads.attr('opacity', 0.9).attr('stroke', '#d06324').attr('stroke-width', 0.35).attr('stroke-dasharray', '1.5')
      .attr('stroke-linecap', 'butt');
    trails.attr('opacity', 0.9).attr('stroke', '#d06324').attr('stroke-width', 0.15).attr('stroke-dasharray', '.8 1.6')
      .attr('stroke-linecap', 'butt');
    searoutes.attr('opacity', 0.8).attr('stroke', '#ffffff').attr('stroke-width', 0.35).attr('stroke-dasharray', '1 2')
      .attr('stroke-linecap', 'round');
    grid.attr('opacity', 1).attr('stroke', '#808080').attr('stroke-width', 0.1);
    ruler.attr('opacity', 1).style('display', 'none').attr('filter', 'url(#dropShadow)');
    overlay.attr('opacity', 0.8).attr('stroke', '#808080').attr('stroke-width', 0.5);
    markers.attr('filter', 'url(#dropShadow01)');

    // ocean style
    svg.style('background-color', '#000000');
    ocean.attr('opacity', 1);
    oceanLayers.select('rect').attr('fill', '#53679f');
    oceanLayers.attr('filter', '');
    oceanPattern.attr('opacity', 1);
    oceanLayers.selectAll('path').attr('display', null);
    styleOceanPattern.checked = true;
    styleOceanLayers.checked = true;

    labels.attr('opacity', 1).attr('stroke', '#3a3a3a').attr('stroke-width', 0);
    let size = rn(8 - regionsInput.value / 20);
    if (size < 3) {
      size = 3;
    }
    burgLabels.select('#capitals').attr('fill', '#3e3e4b').attr('opacity', 1).attr('font-family', 'Almendra SC')
      .attr('data-font', 'Almendra+SC')
      .attr('font-size', size)
      .attr('data-size', size);
    burgLabels.select('#towns').attr('fill', '#3e3e4b').attr('opacity', 1).attr('font-family', 'Almendra SC')
      .attr('data-font', 'Almendra+SC')
      .attr('font-size', 3)
      .attr('data-size', 4);
    burgIcons.select('#capitals').attr('size', 1).attr('stroke-width', 0.24).attr('fill', '#ffffff')
      .attr('stroke', '#3e3e4b')
      .attr('fill-opacity', 0.7)
      .attr('stroke-opacity', 1)
      .attr('opacity', 1);
    burgIcons.select('#towns').attr('size', 0.5).attr('stroke-width', 0.12).attr('fill', '#ffffff')
      .attr('stroke', '#3e3e4b')
      .attr('fill-opacity', 0.7)
      .attr('stroke-opacity', 1)
      .attr('opacity', 1);
    size = rn(16 - regionsInput.value / 6);
    if (size < 6) {
      size = 6;
    }
    labels.select('#countries').attr('fill', '#3e3e4b').attr('opacity', 1).attr('font-family', 'Almendra SC')
      .attr('data-font', 'Almendra+SC')
      .attr('font-size', size)
      .attr('data-size', size);
    icons.select('#capital-anchors').attr('fill', '#ffffff').attr('stroke', '#3e3e4b').attr('stroke-width', 1.2)
      .attr('size', 2);
    icons.select('#town-anchors').attr('fill', '#ffffff').attr('stroke', '#3e3e4b').attr('stroke-width', 1.2)
      .attr('size', 1);
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

}

fantasyMap();

window.tip = tip;

$('#optionsContainer *').on('mouseout', () => {
  tooltip.innerHTML = tooltip.getAttribute('data-main');
});
