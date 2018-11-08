// Define areas cells
function drawRegions() {
  console.time('drawRegions');
  labels.select('#countries').selectAll('*').remove();

  // arrays to store edge data
  const edges = [],
    coastalEdges = [],
    borderEdges = [],
    neutralEdges = [];
  for (let a = 0; a < states.length; a++) {
    edges[a] = [];
    coastalEdges[a] = [];
  }
  const e = diagram.edges;
  for (let i = 0; i < e.length; i++) {
    if (e[i] === undefined) {
      continue;
    }
    const start = e[i][0].join(' ');
    const end = e[i][1].join(' ');
    const p = {
      start,
      end
    };
    if (e[i].left === undefined) {
      const r = e[i].right.index;
      const rr = cells[r].region;
      if (Number.isInteger(rr)) {
        edges[rr].push(p);
      }
      continue;
    }
    if (e[i].right === undefined) {
      const l = e[i].left.index;
      const lr = cells[l].region;
      if (Number.isInteger(lr)) {
        edges[lr].push(p);
      }
      continue;
    }
    const l = e[i].left.index;
    const r = e[i].right.index;
    const lr = cells[l].region;
    const rr = cells[r].region;
    if (lr === rr) {
      continue;
    }
    if (Number.isInteger(lr)) {
      edges[lr].push(p);
      if (rr === undefined) {
        coastalEdges[lr].push(p);
      } else if (rr === 'neutral') {
        neutralEdges.push(p);
      }
    }
    if (Number.isInteger(rr)) {
      edges[rr].push(p);
      if (lr === undefined) {
        coastalEdges[rr].push(p);
      } else if (lr === 'neutral') {
        neutralEdges.push(p);
      } else if (Number.isInteger(lr)) {
        borderEdges.push(p);
      }
    }
  }
  edges.map((e, i) => {
    if (e.length) {
      drawRegion(e, i);
      drawRegionCoast(coastalEdges[i], i);
    }
  });
  drawBorders(borderEdges, 'state');
  drawBorders(neutralEdges, 'neutral');
  console.timeEnd('drawRegions');
}

function drawRegion(edges, region) {
  let path = '';
  const array = [];
  lineGen.curve(d3.curveLinear);
  while (edges.length > 2) {
    const edgesOrdered = []; // to store points in a correct order
    const start = edges[0].start;
    let end = edges[0].end;
    edges.shift();
    let spl = start.split(' ');
    edgesOrdered.push({
      scX: spl[0],
      scY: spl[1]
    });
    spl = end.split(' ');
    edgesOrdered.push({
      scX: spl[0],
      scY: spl[1]
    });
    for (let i = 0; end !== start && i < 2000; i++) {
      const next = $.grep(edges, (e) => (e.start == end || e.end == end));
      if (next.length > 0) {
        if (next[0].start == end) {
          end = next[0].end;
        } else if (next[0].end == end) {
          end = next[0].start;
        }
        spl = end.split(' ');
        edgesOrdered.push({
          scX: spl[0],
          scY: spl[1]
        });
      }
      const rem = edges.indexOf(next[0]);
      edges.splice(rem, 1);
    }
    path += `${lineGen(edgesOrdered)}Z `;
    array[array.length] = edgesOrdered.map((e) => [+e.scX, +e.scY]);
  }
  const color = states[region].color;
  regions.append('path').attr('d', round(path, 1)).attr('fill', color).attr('class', `region${region}`);
  array.sort((a, b) => b.length - a.length);
  const capital = states[region].capital;
  // add capital cell as a hole
  if (!isNaN(capital)) {
    const capitalCell = manors[capital].cell;
    array.push(polygons[capitalCell]);
  }
  const name = states[region].name;
  const c = polylabel(array, 1.0); // pole of inaccessibility
  labels.select('#countries').append('text').attr('id', `regionLabel${region}`).attr('x', rn(c[0]))
    .attr('y', rn(c[1]))
    .text(name)
    .on('click', editLabel);
  states[region].area = rn(Math.abs(d3.polygonArea(array[0]))); // define region area
}

function drawRegionCoast(edges, region) {
  let path = '';
  while (edges.length > 0) {
    const edgesOrdered = []; // to store points in a correct order
    const start = edges[0].start;
    let end = edges[0].end;
    edges.shift();
    let spl = start.split(' ');
    edgesOrdered.push({
      scX: spl[0],
      scY: spl[1]
    });
    spl = end.split(' ');
    edgesOrdered.push({
      scX: spl[0],
      scY: spl[1]
    });
    let next = $.grep(edges, (e) => (e.start == end || e.end == end));
    while (next.length > 0) {
      if (next[0].start == end) {
        end = next[0].end;
      } else if (next[0].end == end) {
        end = next[0].start;
      }
      spl = end.split(' ');
      edgesOrdered.push({
        scX: spl[0],
        scY: spl[1]
      });
      const rem = edges.indexOf(next[0]);
      edges.splice(rem, 1);
      next = $.grep(edges, (e) => (e.start == end || e.end == end));
    }
    path += lineGen(edgesOrdered);
  }
  const color = states[region].color;
  regions.append('path').attr('d', round(path, 1)).attr('fill', 'none').attr('stroke', color)
    .attr('stroke-width', 5)
    .attr('class', `region${region}`);
}

function drawBorders(edges, type) {
  let path = '';
  if (edges.length < 1) {
    return;
  }
  while (edges.length > 0) {
    const edgesOrdered = []; // to store points in a correct order
    const start = edges[0].start;
    let end = edges[0].end;
    edges.shift();
    let spl = start.split(' ');
    edgesOrdered.push({
      scX: spl[0],
      scY: spl[1]
    });
    spl = end.split(' ');
    edgesOrdered.push({
      scX: spl[0],
      scY: spl[1]
    });
    let next = $.grep(edges, (e) => (e.start == end || e.end == end));
    while (next.length > 0) {
      if (next[0].start == end) {
        end = next[0].end;
      } else if (next[0].end == end) {
        end = next[0].start;
      }
      spl = end.split(' ');
      edgesOrdered.push({
        scX: spl[0],
        scY: spl[1]
      });
      const rem = edges.indexOf(next[0]);
      edges.splice(rem, 1);
      next = $.grep(edges, (e) => (e.start == end || e.end == end));
    }
    path += lineGen(edgesOrdered);
  }
  if (type === 'state') {
    stateBorders.append('path').attr('d', round(path, 1));
  }
  if (type === 'neutral') {
    neutralBorders.append('path').attr('d', round(path, 1));
  }
}

// Draw the Relief (need to create more beautiness)
function drawRelief() {
  console.time('drawRelief');
  let h,
    count,
    rnd,
    cx,
    cy,
    swampCount = 0;
  const hills = terrain.select('#hills');
  const mounts = terrain.select('#mounts');
  const swamps = terrain.select('#swamps');
  const forests = terrain.select('#forests');
  terrain.selectAll('g').selectAll('g').remove();
  // sort the land to Draw the top element first (reduce the elements overlapping)
  land.sort(compareY);
  for (let i = 0; i < land.length; i++) {
    if (land[i].river) {
      continue;
    } // no icons on rivers
    const cell = land[i].index;
    const p = d3.polygonCentroid(polygons[cell]); // polygon centroid point
    if (p === undefined) {
      continue;
    } // something is wrong with data
    const height = land[i].height;
    const area = land[i].area;
    if (height >= 70) {
      // mount icon
      h = (height - 55) * 0.12;
      for (let c = 0, a = area; Math.random() < a / 50; c++, a -= 50) {
        if (polygons[cell][c] === undefined) {
          break;
        }
        const g = mounts.append('g').attr('data-cell', cell);
        if (c < 2) {
          cx = p[0] - h / 100 * (1 - c / 10) - c * 2;
          cy = p[1] + h / 400 + c;
        } else {
          const p2 = polygons[cell][c];
          cx = (p[0] * 1.2 + p2[0] * 0.8) / 2;
          cy = (p[1] * 1.2 + p2[1] * 0.8) / 2;
        }
        rnd = Math.random() * 0.8 + 0.2;
        const mount = `M${cx},${cy} L${cx + h / 3 + rnd},${cy - h / 4 - rnd * 1.2} L${cx + h / 1.1},${cy - h} L${cx + h + rnd},${cy - h / 1.2 + rnd} L${cx + h * 2},${cy}`;
        const shade = `M${cx},${cy} L${cx + h / 3 + rnd},${cy - h / 4 - rnd * 1.2} L${cx + h / 1.1},${cy - h} L${cx + h / 1.5},${cy}`;
        let dash = `M${cx - 0.1},${cy + 0.3} L${cx + 2 * h + 0.1},${cy + 0.3}`;
        dash += `M${cx + 0.4},${cy + 0.6} L${cx + 2 * h - 0.3},${cy + 0.6}`;
        g.append('path').attr('d', round(mount, 1)).attr('stroke', '#5c5c70');
        g.append('path').attr('d', round(shade, 1)).attr('fill', '#999999');
        g.append('path').attr('d', round(dash, 1)).attr('class', 'strokes');
      }
    } else if (height > 50) {
      // hill icon
      h = (height - 40) / 10;
      if (h > 1.7) {
        h = 1.7;
      }
      for (let c = 0, a = area; Math.random() < a / 30; c++, a -= 30) {
        if (land[i].ctype === 1 && c > 0) {
          break;
        }
        if (polygons[cell][c] === undefined) {
          break;
        }
        const g = hills.append('g').attr('data-cell', cell);
        if (c < 2) {
          cx = p[0] - h - c * 1.2;
          cy = p[1] + h / 4 + c / 1.6;
        } else {
          const p2 = polygons[cell][c];
          cx = (p[0] * 1.2 + p2[0] * 0.8) / 2;
          cy = (p[1] * 1.2 + p2[1] * 0.8) / 2;
        }
        const hill = `M${cx},${cy} Q${cx + h},${cy - h} ${cx + 2 * h},${cy}`;
        const shade = `M${cx + 0.6 * h},${cy + 0.1} Q${cx + h * 0.95},${cy - h * 0.91} ${cx + 2 * h * 0.97},${cy}`;
        let dash = `M${cx - 0.1},${cy + 0.2} L${cx + 2 * h + 0.1},${cy + 0.2}`;
        dash += `M${cx + 0.4},${cy + 0.4} L${cx + 2 * h - 0.3},${cy + 0.4}`;
        g.append('path').attr('d', round(hill, 1)).attr('stroke', '#5c5c70');
        g.append('path').attr('d', round(shade, 1)).attr('fill', 'white');
        g.append('path').attr('d', round(dash, 1)).attr('class', 'strokes');
      }
    }

    // swamp icons
    if (height >= 21 && height < 22 && swampCount < +swampinessInput.value && land[i].used != 1) {
      const g = swamps.append('g').attr('data-cell', cell);
      swampCount++;
      land[i].used = 1;
      let swamp = drawSwamp(p[0], p[1]);
      land[i].neighbors.forEach((e) => {
        if (cells[e].height >= 20 && cells[e].height < 30 && !cells[e].river && cells[e].used != 1) {
          cells[e].used = 1;
          swamp += drawSwamp(cells[e].data[0], cells[e].data[1]);
        }
      });
      g.append('path').attr('d', round(swamp, 1));
    }

    // forest icons
    if (Math.random() < height / 100 && height >= 22 && height < 48) {
      for (let c = 0, a = area; Math.random() < a / 15; c++, a -= 15) {
        if (land[i].ctype === 1 && c > 0) {
          break;
        }
        if (polygons[cell][c] === undefined) {
          break;
        }
        const g = forests.append('g').attr('data-cell', cell);
        if (c === 0) {
          cx = rn(p[0] - 1 - Math.random(), 1);
          cy = p[1] - 2;
        } else {
          const p2 = polygons[cell][c];
          if (c > 1) {
            const dist = Math.hypot(p2[0] - polygons[cell][c - 1][0], p2[1] - polygons[cell][c - 1][1]);
            if (dist < 2) {
              continue;
            }
          }
          cx = (p[0] * 0.5 + p2[0] * 1.5) / 2;
          cy = (p[1] * 0.5 + p2[1] * 1.5) / 2 - 1;
        }
        const forest = `M${cx},${cy} q-1,0.8 -0.05,1.25 v0.75 h0.1 v-0.75 q0.95,-0.47 -0.05,-1.25 z `;
        const light = `M${cx},${cy} q-1,0.8 -0.05,1.25 h0.1 q0.95,-0.47 -0.05,-1.25 z `;
        const shade = `M${cx},${cy} q-1,0.8 -0.05,1.25 q-0.2,-0.55 0,-1.1 z `;
        g.append('path').attr('d', forest);
        g.append('path').attr('d', light).attr('fill', 'white').attr('stroke', 'none');
        g.append('path').attr('d', shade).attr('fill', '#999999').attr('stroke', 'none');
      }
    }
  }
  terrain.selectAll('g').selectAll('g').on('click', editReliefIcon);
  console.timeEnd('drawRelief');
}

function drawSwamp(x, y) {
  const h = 0.6;
  let line = '';
  for (let c = 0; c < 3; c++) {
    let cx;
    let cy;
    if (c == 0) {
      cx = x;
      cy = y - 0.5 - Math.random();
    }
    if (c == 1) {
      cx = x + h + Math.random();
      cy = y + h + Math.random();
    }
    if (c == 2) {
      cx = x - h - Math.random();
      cy = y + 2 * h + Math.random();
    }
    line += `M${cx},${cy} H${cx - h / 6} M${cx},${cy} H${cx + h / 6} M${cx},${cy} L${cx - h / 3},${cy - h / 2} M${cx},${cy} V${cy - h / 1.5} M${cx},${cy} L${cx + h / 3},${cy - h / 2}`;
    line += `M${cx - h},${cy} H${cx - h / 2} M${cx + h / 2},${cy} H${cx + h}`;
  }
  return line;
}

function drawPerspective() {
  console.time('drawPerspective');
  const width = 320,
    height = 180;
  const wRatio = graphWidth / width,
    hRatio = graphHeight / height;
  const lineCount = 320,
    lineGranularity = 90;
  const perspective = document.getElementById('perspective');
  const pContext = perspective.getContext('2d');
  const lines = [];
  let i = lineCount;
  while (i--) {
    const x = i / lineCount * width | 0;
    const canvasPoints = [];
    lines.push(canvasPoints);
    let j = Math.floor(lineGranularity);
    while (j--) {
      const y = j / lineGranularity * height | 0;
      const index = getCellIndex(x * wRatio, y * hRatio);
      let h = heights[index] - 20;
      if (h < 1) {
        h = 0;
      }
      canvasPoints.push([x, y, h]);
    }
  }
  pContext.clearRect(0, 0, perspective.width, perspective.height);
  for (const canvasPoints of lines) {
    for (let i = 0; i < canvasPoints.length - 1; i++) {
      const pt1 = canvasPoints[i];
      const pt2 = canvasPoints[i + 1];
      const avHeight = (pt1[2] + pt2[2]) / 200;
      pContext.beginPath();
      pContext.moveTo(...transformPt(pt1));
      pContext.lineTo(...transformPt(pt2));
      let clr = 'rgb(81, 103, 169)'; // water
      if (avHeight !== 0) {
        clr = color(1 - avHeight - 0.2);
      }
      pContext.strokeStyle = clr;
      pContext.stroke();
    }
    for (let i = 0; i < canvasPoints.length - 1; i++) {

    }
  }
  console.timeEnd('drawPerspective');
}

// Append burg elements
function drawManors() {
  console.time('drawManors');
  const capitalIcons = burgIcons.select('#capitals');
  const capitalLabels = burgLabels.select('#capitals');
  const townIcons = burgIcons.select('#towns');
  const townLabels = burgLabels.select('#towns');
  const capitalSize = capitalIcons.attr('size') || 1;
  const townSize = townIcons.attr('size') || 0.5;
  capitalIcons.selectAll('*').remove();
  capitalLabels.selectAll('*').remove();
  townIcons.selectAll('*').remove();
  townLabels.selectAll('*').remove();

  for (let i = 0; i < manors.length; i++) {
    const x = manors[i].x,
      y = manors[i].y;
    const cell = manors[i].cell;
    const name = manors[i].name;
    const ic = i < states.length ? capitalIcons : townIcons;
    const lb = i < states.length ? capitalLabels : townLabels;
    const size = i < states.length ? capitalSize : townSize;
    ic.append('circle').attr('id', `burg${i}`).attr('data-id', i).attr('cx', x)
      .attr('cy', y)
      .attr('r', size)
      .on('click', editBurg);
    lb.append('text').attr('data-id', i).attr('x', x).attr('y', y)
      .attr('dy', '-0.35em')
      .text(name)
      .on('click', editBurg);
  }
  console.timeEnd('drawManors');
}

// draw default scale bar
function drawScaleBar() {
  if ($('#scaleBar').hasClass('hidden')) {
    return;
  } // no need to re-draw hidden element
  svg.select('#scaleBar').remove(); // fully redraw every time
  // get size
  const size = +barSize.value;
  const dScale = distanceScale.value;
  const unit = distanceUnit.value;
  const scaleBar = svg.append('g').attr('id', 'scaleBar')
    .on('click', editScale)
    .on('mousemove', () => {
      tip('Click to open Scale Editor, drag to move');
    })
    .call(d3.drag().on('start', elementDrag));
  const init = 100; // actual length in pixels if scale, dScale and size = 1;
  let val = init * size * (dScale / scale); // bar length in distance unit
  if (val > 900) {
    val = rn(val, -3);
  } else if (val > 90) {
    // round to 1000
    val = rn(val, -2);
  } else if (val > 9) {
    // round to 100
    val = rn(val, -1);
  } else {
    // round to 10
    val = rn(val);
  } // round to 1
  const l = val * (scale / dScale); // actual length in pixels on this scale
  const x = 0;
  const y = 0; // initial position
  scaleBar.append('line').attr('x1', x + 0.5).attr('y1', y).attr('x2', (x + l + size) - 0.5)
    .attr('y2', y)
    .attr('stroke-width', size)
    .attr('stroke', 'white');
  scaleBar.append('line').attr('x1', x).attr('y1', y + size).attr('x2', x + l + size)
    .attr('y2', y + size)
    .attr('stroke-width', size)
    .attr('stroke', '#3d3d3d');
  const dash = `${size} ${rn((l / 5) - size, 2)}`;
  scaleBar.append('line').attr('x1', x).attr('y1', y).attr('x2', x + l + size)
    .attr('y2', y)
    .attr('stroke-width', rn(size * 3, 2))
    .attr('stroke-dasharray', dash)
    .attr('stroke', '#3d3d3d');
  // big scale
  for (let b = 0; b < 6; b++) {
    const value = rn(b * (l / 5), 2);
    const label = rn(value * (dScale / scale));
    if (b === 5) {
      scaleBar
        .append('text')
        .attr('x', x + value)
        .attr('y', y - (2 * size))
        .attr('font-size', rn(5 * size, 1))
        .text(`${label} ${unit}`);
    } else {
      scaleBar
        .append('text')
        .attr('x', x + value)
        .attr('y', y - (2 * size))
        .attr('font-size', rn(5 * size, 1))
        .text(label);
    }
  }
  if (barLabel.value !== '') {
    scaleBar.append('text').attr('x', x + l + (1 / 2)).attr('y', y + (2 * size))
      .attr('dominant-baseline', 'text-before-edge')
      .attr('font-size', rn(5 * size, 1))
      .text(barLabel.value);
  }
  const bbox = scaleBar.node().getBBox();
  // append backbround rectangle
  scaleBar
    .insert('rect', ':first-child')
    .attr('x', -10)
    .attr('y', -20)
    .attr('width', bbox.width + 10)
    .attr('height', bbox.height + 15)
    .attr('stroke-width', size)
    .attr('stroke', 'none')
    .attr('filter', 'url(#blur5)')
    .attr('fill', barBackColor.value)
    .attr('opacity', +barBackOpacity.value);
  fitScaleBar();
}

// remove drawn regions and draw all regions again
function redrawRegions() {
  regions.selectAll('*').remove();
  borders.selectAll('path').remove();
  removeAllLabelsInGroup('countries');
  drawRegions();
}

export {
  drawRegions,
  drawRegion,
  drawRegionCoast,
  drawBorders,
  drawRelief,
  drawSwamp,
  drawPerspective,
  redrawRegions,
  drawManors,
  drawScaleBar
}