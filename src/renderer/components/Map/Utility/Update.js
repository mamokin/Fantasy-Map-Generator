// update only UI and sorting value in countryEditor screen
function countryPopulationUI(s) {
  if ($('#countriesEditor').is(':visible')) {
    const urban = rn(states[s].urbanPopulation * +urbanization.value * populationRate.value);
    const rural = rn(states[s].ruralPopulation * populationRate.value);
    const population = (urban + rural) * 1000;
    $(`#state${s}`).attr('data-population', population);
    $(`#state${s}`).children().filter('.statePopulation').val(si(population));
  }
}

// update dialogs if measurements are changed
function countryEditors() {
  if ($('#countriesEditor').is(':visible')) {
    editCountries();
  }
  if ($('#burgsEditor').is(':visible')) {
    const s = +$('#burgsEditor').attr('data-state');
    editBurgs(this, s);
  }
}

// Update font list for Label and Burg Editors
function fontOptions() {
  labelFontSelect.innerHTML = '';
  for (let i = 0; i < fonts.length; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    const font = fonts[i].split(':')[0].replace(/\+/g, ' ');
    opt.style.fontFamily = opt.innerHTML = font;
    labelFontSelect.add(opt);
  }
  burgSelectDefaultFont.innerHTML = labelFontSelect.innerHTML;
}

// draw or update all cells
function heightmap() {
  const limit = renderOcean.checked ? 1 : 20;
  for (let i = 0; i < heights.length; i++) {
    if (heights[i] > 100) {
      heights[i] = 100;
    }
    let cell = landmass.select(`#cell${i}`);
    const clr = color(1 - (heights[i] / 100));
    if (cell.size()) {
      if (heights[i] < limit) {
        cell.remove();
      } else {
        cell.attr('fill', clr).attr('stroke', clr);
      }
    } else if (heights[i] >= limit) {
      cell = landmass.append('path').attr('id', `cell${i}`)
        .attr('d', `M${polygons[i].join('L')}Z`)
        .attr('fill', clr)
        .attr('stroke', clr);
    }
  }
}

// draw or update cells from the selection
function heightmapSelection(selection) {
  if (selection === undefined) {
    return;
  }
  const limit = renderOcean.checked ? 1 : 20;
  selection.map((s) => {
    if (heights[s] > 100) {
      heights[s] = 100;
    }
    let cell = landmass.select(`#cell${s}`);
    const clr = color(1 - (heights[s] / 100));
    if (cell.size()) {
      if (heights[s] < limit) {
        cell.remove();
      } else {
        cell.attr('fill', clr).attr('stroke', clr);
      }
    } else if (heights[s] >= limit) {
      cell = landmass.append('path').attr('id', `cell${s}`)
        .attr('d', `M${polygons[s].join('L')}Z`)
        .attr('fill', clr)
        .attr('stroke', clr);
    }
  });
}

// update Label Groups displayed on Style tab
function labelGroups() {
  if (styleElementSelect.value !== 'labels') {
    return;
  }
  const cont = d3.select('#styleLabelGroupItems');
  cont.selectAll('button').remove();
  labels.selectAll('g').each(function () {
    const el = d3.select(this);
    const id = el.attr('id');
    const name = id.charAt(0).toUpperCase() + id.substr(1);
    const state = el.classed('hidden');
    if (id === 'burgLabels') {
      return;
    }
    cont.append('button').attr('id', id).text(name).classed('buttonoff', state)
      .on('click', function () {
        // toggle label group on click
        if (hideLabels.checked) {
          hideLabels.click();
        }
        const el = d3.select(`#${this.id}`);
        const state = !el.classed('hidden');
        el.classed('hidden', state);
        d3.select(this).classed('buttonoff', state);
      });
  });
}

// update cells in radius if non-feature brush selected
function cellsInRadius(cell, source) {
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

        return null;
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
  Update.heightmapSelection(selection);
}

function history() {
  let landCells = 0; // count number of land cells
  if (renderOcean.checked) {
    landCells = heights.reduce((s, v) => {
      if (v >= 20) {
        return s + 1;
      }
      return s;
    }, 0);
  } else {
    landCells = landmass.selectAll('*').size();
  }
  history = history.slice(0, historyStage);
  history[historyStage] = heights.slice();
  historyStage++; // eslint-disable-line
  undo.disabled = templateUndo.disabled = historyStage <= 1;
  redo.disabled = templateRedo.disabled = true;
  const landMean = Math.trunc(d3.mean(heights));
  const landRatio = rn(landCells / heights.length * 100);
  landmassCounter.innerHTML = landCells;
  landmassRatio.innerHTML = landRatio;
  landmassAverage.innerHTML = landMean;
  // if perspective view dialog is opened, update it
  if ($('#perspectivePanel').is(':visible')) {
    drawPerspective();
  }
}

export {
  countryEditors,
  countryPopulationUI,
  fontOptions,
  heightmap,
  heightmapSelection,
  labelGroups,
  cellsInRadius,
  history
};
