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
    const rgb = `rgb(${nearest[0]}, ${nearest[1]}, ${nearest[2]})`;
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

export {
  defineHeightmap,
  modifyHeights,
  smoothHeights,
  mockHeightmap,
  restoreCustomHeights,
  heightsFromImage,
  showHeight,
  assignHeight,
  customizeHeightmap
};
