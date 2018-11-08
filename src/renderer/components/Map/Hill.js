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


export {
  addHill,
  addRange,
  addReliefIcon
};
