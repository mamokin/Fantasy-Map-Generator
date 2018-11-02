// update only UI and sorting value in countryEditor screen
function updateCountryPopulationUI(s) {
  if ($('#countriesEditor').is(':visible')) {
    const urban = rn(states[s].urbanPopulation * +urbanization.value * populationRate.value);
    const rural = rn(states[s].ruralPopulation * populationRate.value);
    const population = (urban + rural) * 1000;
    $(`#state${s}`).attr('data-population', population);
    $(`#state${s}`).children().filter('.statePopulation').val(si(population));
  }
}

// update dialogs if measurements are changed
function updateCountryEditors() {
  if ($('#countriesEditor').is(':visible')) {
    editCountries();
  }
  if ($('#burgsEditor').is(':visible')) {
    const s = +$('#burgsEditor').attr('data-state');
    editBurgs(this, s);
  }
}

// Update font list for Label and Burg Editors
function updateFontOptions() {
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
function updateHeightmap() {
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
function updateHeightmapSelection(selection) {
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
function updateLabelGroups() {
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

export {
  updateCountryEditors,
  updateCountryPopulationUI,
  updateFontOptions,
  updateHeightmap,
  updateHeightmapSelection,
  updateLabelGroups
}