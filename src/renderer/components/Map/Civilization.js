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
      .attr('d', `M${polygons[l.index].join('L')}Z`)
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
    $(`#state${s.i} > .stateCells`).text(s.cells);
    $(`#state${s.i} > .stateBurgs`).text(s.burgs);
    const area = rn(s.area * Math.pow(distanceScale.value, 2));
    const unit = areaUnit.value === 'square' ? ` ${distanceUnit.value}²` : ` ${areaUnit.value}`;
    $(`#state${s.i} > .stateArea`).text(si(area) + unit);
    const urban = rn(s.urbanPopulation * urbanization.value * populationRate.value);
    const rural = rn(s.ruralPopulation * populationRate.value);
    const population = (urban + rural) * 1000;
    $(`#state${s.i} > .statePopulation`).val(si(population));
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

export {
  moveBurgToGroup,
  manorsAndRegions,
  rankPlacesGeography,
  rankPlacesEconomy,
  calculatePopulation,
  locateCapitals,
  locateTowns,
  shiftSettlements,
  checkAccessibility,
  recalculateCultures,
  getCultureId,
  getManorId,
  getNames,
  defineRegions,
  restoreRegions,
  regenerateCountries,
  mockRegions
};
