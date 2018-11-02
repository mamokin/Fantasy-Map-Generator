// toggle inputs to declare a new group
document.getElementById('labelGroupNew').addEventListener('click', () => {
  if ($('#labelGroupInput').css('display') === 'none') {
    $('#labelGroupInput').css('display', 'inline-block');
    $('#labelGroupSelect').css('display', 'none');
    labelGroupInput.focus();
  } else {
    $('#labelGroupSelect').css('display', 'inline-block');
    $('#labelGroupInput').css('display', 'none');
  }
});

// toggle inputs to select a group
document.getElementById('labelExternalFont').addEventListener('click', () => {
  if ($('#labelFontInput').css('display') === 'none') {
    $('#labelFontInput').css('display', 'inline-block');
    $('#labelFontSelect').css('display', 'none');
    labelFontInput.focus();
  } else {
    $('#labelFontSelect').css('display', 'inline-block');
    $('#labelFontInput').css('display', 'none');
  }
});

// draw the Heightmap
function toggleHeight() {
  const scheme = styleSchemeInput.value;
  let hColor = color;
  if (scheme === 'light') {
    hColor = d3.scaleSequential(d3.interpolateRdYlGn);
  }
  if (scheme === 'green') {
    hColor = d3.scaleSequential(d3.interpolateGreens);
  }
  if (scheme === 'monochrome') {
    hColor = d3.scaleSequential(d3.interpolateGreys);
  }
  if (!terrs.selectAll('path').size()) {
    cells.map((i, d) => {
      let height = i.height;
      if (height < 20 && !i.lake) {
        return;
      }
      if (i.lake) {
        const nHeights = i.neighbors.map((e) => {
          if (cells[e].height >= 20) {
            return cells[e].height;
          }
        });
        const mean = d3.mean(nHeights);
        if (!mean) {
          return;
        }
        height = Math.trunc(mean);
        if (height < 20 || isNaN(height)) {
          height = 20;
        }
      }
      const clr = hColor((100 - height) / 100);
      terrs.append('path')
        .attr('d', `M${ polygons[d].join('L')}Z`)
        .attr('fill', clr).attr('stroke', clr);
    });
  } else {
    terrs.selectAll('path').remove();
  }
}

// draw Cultures
function toggleCultures() {
  if (cults.selectAll('path').size() == 0) {
    land.map((i) => {
      const color = cultures[i.culture].color;
      cults.append('path')
        .attr('d', `M${polygons[i.index].join('L') }Z`)
        .attr('id', `cult${i.index}`)
        .attr('fill', color)
        .attr('stroke', color);
    });
  } else {
    cults.selectAll('path').remove();
  }
}

// draw Overlay
function toggleOverlay() {
  if (overlay.selectAll('*').size() === 0) {
    const type = styleOverlayType.value;
    const size = +styleOverlaySize.value;
    if (type === 'pointyHex' || type === 'flatHex') {
      const points = getHexGridPoints(size, type);
      const hex = `m${getHex(size, type).slice(0, 4).join('l')}`;
      const d = points.map((p) => `M${  p  }${hex}`).join('');
      overlay.append('path').attr('d', d);
    } else if (type === 'square') {
      const x = d3.range(size, svgWidth, size);
      const y = d3.range(size, svgHeight, size);
      overlay.append('g').selectAll('line').data(x).enter()
        .append('line')
        .attr('x1', (d) => d)
        .attr('x2', (d) => d)
        .attr('y1', 0)
        .attr('y2', svgHeight);
      overlay.append('g').selectAll('line').data(y).enter()
        .append('line')
        .attr('y1', (d) => d)
        .attr('y2', (d) => d)
        .attr('x1', 0)
        .attr('x2', svgWidth);
    } else {
      const tr = `translate(80 80) scale(${size / 20})`;
      d3.select('#rose').attr('transform', tr);
      overlay.append('use').attr('xlink:href', '#rose');
    }
    overlay.call(d3.drag().on('start', elementDrag));
    calculateFriendlyOverlaySize();
  } else {
    overlay.selectAll('*').remove();
  }
}

// Draw the water flux system (for dubugging)
function toggleFlux() {
  const colorFlux = d3.scaleSequential(d3.interpolateBlues);
  if (terrs.selectAll('path').size() == 0) {
    land.map((i) => {
      terrs.append('path')
        .attr('d', `M${polygons[i.index].join('L') }Z`)
        .attr('fill', colorFlux(0.1 + i.flux))
        .attr('stroke', colorFlux(0.1 + i.flux));
    });
  } else {
    terrs.selectAll('path').remove();
  }
}