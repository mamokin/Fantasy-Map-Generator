function generateMainRoads() {
  console.time('generateMainRoads');
  lineGen.curve(d3.curveBasis);
  if (states.length < 2 || manors.length < 2) {
    return;
  }
  for (let f = 0; f < features.length; f++) {
    if (!features[f].land) {
      continue;
    }
    const manorsOnIsland = $.grep(land, (e) => e.manor !== undefined && e.fn === f);
    if (manorsOnIsland.length > 1) {
      for (let d = 1; d < manorsOnIsland.length; d++) {
        for (let m = 0; m < d; m++) {
          const path = findLandPath(manorsOnIsland[d].index, manorsOnIsland[m].index, 'main');
          restorePath(manorsOnIsland[m].index, manorsOnIsland[d].index, 'main', path);
        }
      }
    }
  }
  console.timeEnd('generateMainRoads');
}

// add roads from port to capital if capital is not a port
function generatePortRoads() {
  console.time('generatePortRoads');
  if (!states.length || manors.length < 2) {
    return;
  }
  const portless = [];
  for (let s = 0; s < states.length; s++) {
    const cell = manors[s].cell;
    if (cells[cell].port === undefined) {
      portless.push(s);
    }
  }
  for (let l = 0; l < portless.length; l++) {
    const ports = $.grep(land, (l) => l.port !== undefined && l.region === portless[l]);
    if (!ports.length) {
      continue;
    }
    let minDist = 1000,
      end = -1;
    ports.map((p) => {
      const dist = Math.hypot(e.data[0] - p.data[0], e.data[1] - p.data[1]);
      if (dist < minDist && dist > 1) {
        minDist = dist;
        end = p.index;
      }
    });
    if (end !== -1) {
      const start = manors[portless[l]].cell;
      const path = findLandPath(start, end, 'direct');
      restorePath(end, start, 'main', path);
    }
  }
  console.timeEnd('generatePortRoads');
}

function generateSmallRoads() {
  console.time('generateSmallRoads');
  if (manors.length < 2) {
    return;
  }
  for (let f = 0; f < features.length; f++) {
    const manorsOnIsland = $.grep(land, (e) => e.manor !== undefined && e.fn === f);
    const l = manorsOnIsland.length;
    if (l > 1) {
      const secondary = rn((l + 8) / 10);
      for (let s = 0; s < secondary; s++) {
        const start = manorsOnIsland[Math.floor(Math.random() * l)].index;
        const end = manorsOnIsland[Math.floor(Math.random() * l)].index;
        const dist = Math.hypot(cells[start].data[0] - cells[end].data[0], cells[start].data[1] - cells[end].data[1]);
        if (dist > 10) {
          const path = findLandPath(start, end, 'direct');
          restorePath(end, start, 'small', path);
        }
      }
      manorsOnIsland.map((e, d) => {
        if (!e.path && d > 0) {
          const start = e.index;
          let end = -1;
          const road = $.grep(land, (e) => e.path && e.fn === f);
          if (road.length > 0) {
            let minDist = 10000;
            road.map((i) => {
              const dist = Math.hypot(e.data[0] - i.data[0], e.data[1] - i.data[1]);
              if (dist < minDist) {
                minDist = dist;
                end = i.index;
              }
            });
          } else {
            end = manorsOnIsland[0].index;
          }
          const path = findLandPath(start, end, 'main');
          restorePath(end, start, 'small', path);
        }
      });
    }
  }
  console.timeEnd('generateSmallRoads');
}

function generateOceanRoutes() {
  console.time('generateOceanRoutes');
  lineGen.curve(d3.curveBasis);
  const cAnchors = icons.selectAll('#capital-anchors');
  const tAnchors = icons.selectAll('#town-anchors');
  const cSize = cAnchors.attr('size') || 2;
  const tSize = tAnchors.attr('size') || 1;

  const ports = [];
  // groups all ports on water feature
  for (let m = 0; m < manors.length; m++) {
    const cell = manors[m].cell;
    const port = cells[cell].port;
    if (port === undefined) {
      continue;
    }
    if (ports[port] === undefined) {
      ports[port] = [];
    }
    ports[port].push(cell);

    // draw anchor icon
    const group = m < states.length ? cAnchors : tAnchors;
    const size = m < states.length ? cSize : tSize;
    const x = rn(cells[cell].data[0] - size * 0.47, 2);
    const y = rn(cells[cell].data[1] - size * 0.47, 2);
    group.append('use').attr('xlink:href', '#icon-anchor').attr('data-id', m)
      .attr('x', x)
      .attr('y', y)
      .attr('width', size)
      .attr('height', size);
    icons.selectAll('use').on('click', editIcon);
  }

  for (let w = 0; w < ports.length; w++) {
    if (!ports[w]) {
      continue;
    }
    if (ports[w].length < 2) {
      continue;
    }
    const onIsland = [];
    for (let i = 0; i < ports[w].length; i++) {
      const cell = ports[w][i];
      const fn = cells[cell].fn;
      if (onIsland[fn] === undefined) {
        onIsland[fn] = [];
      }
      onIsland[fn].push(cell);
    }

    for (let fn = 0; fn < onIsland.length; fn++) {
      if (!onIsland[fn]) {
        continue;
      }
      if (onIsland[fn].length < 2) {
        continue;
      }
      const start = onIsland[fn][0];
      const paths = findOceanPaths(start, -1);

      for (let h = 1; h < onIsland[fn].length; h++) {
        // routes from all ports on island to 1st port on island
        restorePath(onIsland[fn][h], start, 'ocean', paths);
      }

      // inter-island routes
      for (let c = fn + 1; c < onIsland.length; c++) {
        if (!onIsland[c]) {
          continue;
        }
        if (!onIsland[c].length) {
          continue;
        }
        if (onIsland[fn].length > 3) {
          const end = onIsland[c][0];
          restorePath(end, start, 'ocean', paths);
        }
      }

      if (features[w].border && !features[fn].border && onIsland[fn].length > 5) {
        // encircle the island
        onIsland[fn].sort((a, b) => cells[b].cost - cells[a].cost);
        for (let a = 2; a < onIsland[fn].length && a < 10; a++) {
          const from = onIsland[fn][1],
            to = onIsland[fn][a];
          const dist = Math.hypot(cells[from].data[0] - cells[to].data[0], cells[from].data[1] - cells[to].data[1]);
          const distPath = getPathDist(from, to);
          if (distPath > dist * 4 + 10) {
            const totalCost = cells[from].cost + cells[to].cost;
            const pathsAdd = findOceanPaths(from, to);
            if (cells[to].cost < totalCost) {
              restorePath(to, from, 'ocean', pathsAdd);
              break;
            }
          }
        }
      }
    }
  }
  console.timeEnd('generateOceanRoutes');
}

// generate region name
function generateStateName(state) {
  let culture = null;
  if (states[state]) {
    if (manors[states[state].capital]) {
      culture = manors[states[state].capital].culture;
    }
  }
  let name = 'NameIdontWant';
  if (Math.random() < 0.85 || culture === null) {
    // culture is random if capital is not yet defined
    if (culture === null) {
      culture = rand(cultures.length - 1);
    }
    // try to avoid too long words as a basename
    for (let i = 0; i < 20 && name.length > 7; i++) {
      name = generateName(culture);
    }
  } else {
    name = manors[state].name;
  }
  const base = cultures[culture].base;

  let addSuffix = false;
  // handle special cases
  const e = name.slice(-2);
  if (base === 5 && (e === 'sk' || e === 'ev' || e === 'ov')) {
    // remove -sk and -ev/-ov for Ruthenian
    name = name.slice(0, -2);
    addSuffix = true;
  } else if (name.length > 5 && base === 1 && name.slice(-3) === 'ton') {
    // remove -ton ending for English
    name = name.slice(0, -3);
    addSuffix = true;
  } else if (name.length > 6 && name.slice(-4) === 'berg') {
    // remove -berg ending for any
    name = name.slice(0, -4);
    addSuffix = true;
  } else if (base === 12) {
    // Japanese ends on vowels
    if (vowels.includes(name.slice(-1))) {
      return name;
    }
    return `${name}u`;
  } else if (base === 10) {
    // Korean has "guk" suffix
    if (name.slice(-3) === 'guk') {
      return name;
    }
    if (name.slice(-1) === 'g') {
      name = name.slice(0, -1);
    }
    if (Math.random() < 0.2 && name.length < 7) {
      name = `${name}guk`;
    } // 20% for "guk"
    return name;
  } else if (base === 11) {
    // Chinese has "guo" suffix
    if (name.slice(-3) === 'guo') {
      return name;
    }
    if (name.slice(-1) === 'g') {
      name = name.slice(0, -1);
    }
    if (Math.random() < 0.3 && name.length < 7) {
      name = `${name} Guo`;
    } // 30% for "guo"
    return name;
  }

  // define if suffix should be used
  const vowel = vowels.includes(name.slice(-1)); // last char is vowel
  if (vowel && name.length > 3) {
    if (Math.random() < 0.85) {
      if (vowels.includes(name.slice(-2, -1))) {
        name = name.slice(0, -2);
        addSuffix = true; // 85% for vv
      } else if (Math.random() < 0.7) {
        name = name.slice(0, -1);
        addSuffix = true; // ~60% for cv
      }
    }
  } else if (Math.random() < 0.6) {
    addSuffix = true; // 60% for cc and vc
  }

  if (addSuffix === false) {
    return name;
  }
  let suffix = 'ia'; // common latin suffix
  const rnd = Math.random();
  if (rnd < 0.05 && base === 3) {
    suffix = 'terra';
  } // 5% "terra" for Italian
  else if (rnd < 0.05 && base === 4) {
    suffix = 'terra';
  } // 5% "terra" for Spanish
  else if (rnd < 0.05 && base == 2) {
    suffix = 'terre';
  } // 5% "terre" for French
  else if (rnd < 0.5 && base == 0) {
    suffix = 'land';
  } // 50% "land" for German
  else if (rnd < 0.4 && base == 1) {
    suffix = 'land';
  } // 40% "land" for English
  else if (rnd < 0.3 && base == 6) {
    suffix = 'land';
  } // 30% "land" for Nordic
  else if (rnd < 0.1 && base == 7) {
    suffix = 'eia';
  } // 10% "eia" for Greek ("ia" is also Greek)
  else if (rnd < 0.4 && base == 9) {
    suffix = 'maa';
  } // 40% "maa" for Finnic
  if (name.slice(-1 * suffix.length) === suffix) {
    return name;
  } // no suffix if name already ends with it
  if (name.slice(-1) === suffix.charAt(0)) {
    name = name.slice(0, -1);
  } // remove name last letter if it's a suffix first letter
  return name + suffix;
}

// generate random name using Markov's chain
function generateName(culture, base) {
  if (base === undefined) {
    if (!cultures[culture]) {
      console.error(`culture ${culture} is not defined. Will load default cultures and set first culture`);
      generateCultures();
      culture = 0;
    }
    base = cultures[culture].base;
  }
  if (!nameBases[base]) {
    console.error(`nameBase ${base} is not defined. Will load default names data and first base`);
    if (!nameBases[0]) {
      applyDefaultNamesData();
    }
    base = 0;
  }
  const method = nameBases[base].method;
  const error = function (base) {
    tip(`Names data for base ${nameBases[base].name} is incorrect. Please fix in Namesbase Editor`);
    editNamesbase();
  };

  if (method === 'selection') {
    if (nameBase[base].length < 1) {
      error(base);
      return;
    }
    const rnd = rand(nameBase[base].length - 1);
    const name = nameBase[base][rnd];
    return name;
  }

  const data = chain[base];
  if (data === undefined || data[' '] === undefined) {
    error(base);
    return;
  }
  const max = nameBases[base].max;
  const min = nameBases[base].min;
  const d = nameBases[base].d;
  let word = '',
    variants = data[' '];
  if (variants === undefined) {
    error(base);
    return;
  }
  let cur = variants[rand(variants.length - 1)];
  for (let i = 0; i < 21; i++) {
    if (cur === ' ' && Math.random() < 0.8) {
      // space means word end, but we don't want to end if word is too short
      if (word.length < min) {
        word = '';
        variants = data[' '];
      } else {
        break;
      }
    } else {
      const l = method === 'let-to-syl' && cur.length > 1 ? cur[cur.length - 1] : cur;
      variants = data[l];
      // word is getting too long, restart
      word += cur; // add current el to word
      if (word.length > max) {
        word = '';
      }
    }
    if (variants === undefined) {
      error(base);
      return;
    }
    cur = variants[rand(variants.length - 1)];
  }
  // very rare case, let's just select a random name
  if (word.length < 2) {
    word = nameBase[base][rand(nameBase[base].length - 1)];
  }

  // do not allow multi-word name if word is foo short or not allowed for culture
  if (word.includes(' ')) {
    let words = word.split(' '),
      parsed;
    if (Math.random() > nameBases[base].m) {
      word = words.join('');
    } else {
      for (let i = 0; i < words.length; i++) {
        if (words[i].length < 2) {
          if (!i) {
            words[1] = words[0] + words[1];
          }
          if (i) {
            words[i - 1] = words[i - 1] + words[i];
          }
          words.splice(i, 1);
          i--;
        }
      }
      word = words.join(' ');
    }
  }

  // parse word to get a final name
  const name = [...word].reduce((r, c, i, data) => {
    if (c === ' ') {
      if (!r.length) {
        return '';
      }
      if (i + 1 === data.length) {
        return r;
      }
    }
    if (!r.length) {
      return c.toUpperCase();
    }
    if (r.slice(-1) === ' ') {
      return r + c.toUpperCase();
    }
    if (c === data[i - 1]) {
      if (!d.includes(c)) {
        return r;
      }
      if (c === data[i - 2]) {
        return r;
      }
    }
    return r + c;
  }, '');
  return name;
}

// generate cultures for a new map based on options and namesbase
function generateCultures() {
  const count = +culturesInput.value;
  cultures = d3.shuffle(defaultCultures).slice(0, count);
  const centers = d3.range(cultures.length).map((d, i) => {
    const x = Math.floor(Math.random() * graphWidth * 0.8 + graphWidth * 0.1);
    const y = Math.floor(Math.random() * graphHeight * 0.8 + graphHeight * 0.1);
    const center = [x, y];
    cultures[i].center = center;
    return center;
  });
  cultureTree = d3.quadtree(centers);
}

// draw river polygon using arrpoximation
function drawRiver(points, width, increment) {
  lineGen.curve(d3.curveCatmullRom.alpha(0.1));
  let extraOffset = 0.03; // start offset to make river source visible
  width = width || 1; // river width modifier
  increment = increment || 1; // river bed widening modifier
  let riverLength = 0;
  points.map((p, i) => {
    if (i === 0) {
      return 0;
    }
    riverLength += Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]);
  });
  const widening = rn((1000 + (riverLength * 30)) * increment);
  const riverPointsLeft = [],
    riverPointsRight = [];
  const last = points.length - 1;
  const factor = riverLength / points.length;

  // first point
  let x = points[0][0],
    y = points[0][1],
    c;
  let angle = Math.atan2(y - points[1][1], x - points[1][0]);
  let xLeft = x + -Math.sin(angle) * extraOffset,
    yLeft = y + Math.cos(angle) * extraOffset;
  riverPointsLeft.push({
    scX: xLeft,
    scY: yLeft
  });
  let xRight = x + Math.sin(angle) * extraOffset,
    yRight = y + -Math.cos(angle) * extraOffset;
  riverPointsRight.unshift({
    scX: xRight,
    scY: yRight
  });

  // middle points
  for (let p = 1; p < last; p++) {
    x = points[p][0], y = points[p][1], c = points[p][2];
    if (c) {
      extraOffset += Math.atan(c * 10 / widening);
    } // confluence
    const xPrev = points[p - 1][0],
      yPrev = points[p - 1][1];
    const xNext = points[p + 1][0],
      yNext = points[p + 1][1];
    angle = Math.atan2(yPrev - yNext, xPrev - xNext);
    var offset = (Math.atan(Math.pow(p * factor, 2) / widening) / 2 * width) + extraOffset;
    xLeft = x + -Math.sin(angle) * offset, yLeft = y + Math.cos(angle) * offset;
    riverPointsLeft.push({
      scX: xLeft,
      scY: yLeft
    });
    xRight = x + Math.sin(angle) * offset, yRight = y + -Math.cos(angle) * offset;
    riverPointsRight.unshift({
      scX: xRight,
      scY: yRight
    });
  }

  // end point
  x = points[last][0], y = points[last][1], c = points[last][2];
  if (c) {
    extraOffset += Math.atan(c * 10 / widening);
  } // confluence
  angle = Math.atan2(points[last - 1][1] - y, points[last - 1][0] - x);
  xLeft = x + -Math.sin(angle) * offset, yLeft = y + Math.cos(angle) * offset;
  riverPointsLeft.push({
    scX: xLeft,
    scY: yLeft
  });
  xRight = x + Math.sin(angle) * offset, yRight = y + -Math.cos(angle) * offset;
  riverPointsRight.unshift({
    scX: xRight,
    scY: yRight
  });

  // generate path and return
  const right = lineGen(riverPointsRight);
  let left = lineGen(riverPointsLeft);
  left = left.substring(left.indexOf('C'));
  return round(right + left, 2);
}

// draw river polygon with best quality
function drawRiverSlow(points, width, increment) {
  lineGen.curve(d3.curveCatmullRom.alpha(0.1));
  width = width || 1;
  const extraOffset = 0.02 * width;
  increment = increment || 1;
  const riverPoints = points.map((p) => ({
    scX: p[0],
    scY: p[1]
  }));
  const river = defs.append('path').attr('d', lineGen(riverPoints));
  const riverLength = river.node().getTotalLength();
  const widening = rn((1000 + (riverLength * 30)) * increment);
  const riverPointsLeft = [],
    riverPointsRight = [];

  for (let l = 0; l < riverLength; l++) {
    var point = river.node().getPointAtLength(l);
    var from = river.node().getPointAtLength(l - 0.1);
    const to = river.node().getPointAtLength(l + 0.1);
    var angle = Math.atan2(from.y - to.y, from.x - to.x);
    var offset = (Math.atan(Math.pow(l, 2) / widening) / 2 * width) + extraOffset;
    var xLeft = point.x + -Math.sin(angle) * offset;
    var yLeft = point.y + Math.cos(angle) * offset;
    riverPointsLeft.push({
      scX: xLeft,
      scY: yLeft
    });
    var xRight = point.x + Math.sin(angle) * offset;
    var yRight = point.y + -Math.cos(angle) * offset;
    riverPointsRight.unshift({
      scX: xRight,
      scY: yRight
    });
  }

  var point = river.node().getPointAtLength(riverLength);
  var from = river.node().getPointAtLength(riverLength - 0.1);
  var angle = Math.atan2(from.y - point.y, from.x - point.x);
  var offset = (Math.atan(Math.pow(riverLength, 2) / widening) / 2 * width) + extraOffset;
  var xLeft = point.x + -Math.sin(angle) * offset;
  var yLeft = point.y + Math.cos(angle) * offset;
  riverPointsLeft.push({
    scX: xLeft,
    scY: yLeft
  });
  var xRight = point.x + Math.sin(angle) * offset;
  var yRight = point.y + -Math.cos(angle) * offset;
  riverPointsRight.unshift({
    scX: xRight,
    scY: yRight
  });

  river.remove();
  // generate path and return
  const right = lineGen(riverPointsRight);
  let left = lineGen(riverPointsLeft);
  left = left.substring(left.indexOf('C'));
  return round(right + left, 2);
}

function drawRiverLines(riverNext) {
  console.time('drawRiverLines');
  for (let i = 0; i < riverNext; i++) {
    const dataRiver = $.grep(riversData, (e) => e.river === i);
    if (dataRiver.length > 1) {
      const riverAmended = amendRiver(dataRiver, 1);
      const width = rn(0.8 + Math.random() * 0.4, 1);
      const increment = rn(0.8 + Math.random() * 0.4, 1);
      const d = drawRiver(riverAmended, width, increment);
      rivers.append('path').attr('d', d).attr('id', `river${i}`).attr('data-width', width)
        .attr('data-increment', increment);
    }
  }
  rivers.selectAll('path').on('click', editRiver);
  console.timeEnd('drawRiverLines');
}

// Detect and draw the coasline
function drawCoastline() {
  console.time('drawCoastline');
  Math.seedrandom(seed); // reset seed to get the same result on heightmap edit
  const shape = defs.append('mask').attr('id', 'shape').attr('fill', 'black').attr('x', 0)
    .attr('y', 0)
    .attr('width', '100%')
    .attr('height', '100%');
  $('#landmass').empty();
  let minX = graphWidth,
    maxX = 0; // extreme points
  let minXedge,
    maxXedge; // extreme edges
  const oceanEdges = [],
    lakeEdges = [];
  for (let i = 0; i < land.length; i++) {
    const id = land[i].index,
      cell = diagram.cells[id];
    const f = land[i].fn;
    land[i].height = Math.trunc(land[i].height);
    if (!oceanEdges[f]) {
      oceanEdges[f] = [];
      lakeEdges[f] = [];
    }
    cell.halfedges.forEach((e) => {
      const edge = diagram.edges[e];
      const start = edge[0].join(' ');
      const end = edge[1].join(' ');
      if (edge.left && edge.right) {
        const ea = edge.left.index === id ? edge.right.index : edge.left.index;
        cells[ea].height = Math.trunc(cells[ea].height);
        if (cells[ea].height < 20) {
          cells[ea].ctype = -1;
          if (land[i].ctype !== 1) {
            land[i].ctype = 1; // mark coastal land cells
            // move cell point closer to coast
            const x = (land[i].data[0] + cells[ea].data[0]) / 2;
            const y = (land[i].data[1] + cells[ea].data[1]) / 2;
            land[i].haven = ea; // harbor haven (oposite water cell)
            land[i].coastX = rn(x + (land[i].data[0] - x) * 0.1, 1);
            land[i].coastY = rn(y + (land[i].data[1] - y) * 0.1, 1);
            land[i].data[0] = rn(x + (land[i].data[0] - x) * 0.5, 1);
            land[i].data[1] = rn(y + (land[i].data[1] - y) * 0.5, 1);
          }
          if (features[cells[ea].fn].border) {
            oceanEdges[f].push({
              start,
              end
            });
            // island extreme points
            if (edge[0][0] < minX) {
              minX = edge[0][0];
              minXedge = edge[0];
            }
            if (edge[1][0] < minX) {
              minX = edge[1][0];
              minXedge = edge[1];
            }
            if (edge[0][0] > maxX) {
              maxX = edge[0][0];
              maxXedge = edge[0];
            }
            if (edge[1][0] > maxX) {
              maxX = edge[1][0];
              maxXedge = edge[1];
            }
          } else {
            const l = cells[ea].fn;
            if (!lakeEdges[f][l]) {
              lakeEdges[f][l] = [];
            }
            lakeEdges[f][l].push({
              start,
              end
            });
          }
        }
      } else {
        oceanEdges[f].push({
          start,
          end
        });
      }
    });
  }

  for (let f = 0; f < features.length; f++) {
    if (!oceanEdges[f]) {
      continue;
    }
    if (!oceanEdges[f].length && lakeEdges[f].length) {
      const m = lakeEdges[f].indexOf(d3.max(lakeEdges[f]));
      oceanEdges[f] = lakeEdges[f][m];
      lakeEdges[f][m] = [];
    }
    lineGen.curve(d3.curveCatmullRomClosed.alpha(0.1));
    const oceanCoastline = getContinuousLine(oceanEdges[f], 3, 0);
    if (oceanCoastline) {
      shape.append('path').attr('d', oceanCoastline).attr('fill', 'white'); // draw the mask
      coastline.append('path').attr('d', oceanCoastline); // draw the coastline
    }
    lineGen.curve(d3.curveBasisClosed);
    lakeEdges[f].forEach((l) => {
      const lakeCoastline = getContinuousLine(l, 3, 0);
      if (lakeCoastline) {
        shape.append('path').attr('d', lakeCoastline).attr('fill', 'black'); // draw the mask
        lakes.append('path').attr('d', lakeCoastline); // draw the lakes
      }
    });
  }
  landmass.append('rect').attr('x', 0).attr('y', 0).attr('width', graphWidth)
    .attr('height', graphHeight); // draw the landmass
  drawDefaultRuler(minXedge, maxXedge);
  console.timeEnd('drawCoastline');
}

// draw default ruler measiring land x-axis edges
function drawDefaultRuler(minXedge, maxXedge) {
  const rulerNew = ruler.append('g').attr('class', 'linear').call(d3.drag().on('start', elementDrag));
  if (!minXedge) {
    minXedge = [0, 0];
  }
  if (!maxXedge) {
    maxXedge = [svgWidth, svgHeight];
  }
  const x1 = rn(minXedge[0], 2),
    y1 = rn(minXedge[1], 2),
    x2 = rn(maxXedge[0], 2),
    y2 = rn(maxXedge[1], 2);
  rulerNew.append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2)
    .attr('y2', y2)
    .attr('class', 'white');
  rulerNew.append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2)
    .attr('y2', y2)
    .attr('class', 'gray')
    .attr('stroke-dasharray', 10);
  rulerNew.append('circle').attr('r', 2).attr('cx', x1).attr('cy', y1)
    .attr('stroke-width', 0.5)
    .attr('data-edge', 'left')
    .call(d3.drag().on('drag', rulerEdgeDrag));
  rulerNew.append('circle').attr('r', 2).attr('cx', x2).attr('cy', y2)
    .attr('stroke-width', 0.5)
    .attr('data-edge', 'rigth')
    .call(d3.drag().on('drag', rulerEdgeDrag));
  const x0 = rn((x1 + x2) / 2, 2),
    y0 = rn((y1 + y2) / 2, 2);
  rulerNew.append('circle').attr('r', 1.2).attr('cx', x0).attr('cy', y0)
    .attr('stroke-width', 0.3)
    .attr('class', 'center')
    .call(d3.drag().on('start', rulerCenterDrag));
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
  const tr = `rotate(${angle} ${x0} ${y0})`;
  const dist = rn(Math.hypot(x1 - x2, y1 - y2));
  const label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
  rulerNew.append('text').attr('x', x0).attr('y', y0).attr('dy', -1)
    .attr('transform', tr)
    .attr('data-dist', dist)
    .text(label)
    .on('click', removeParent)
    .attr('font-size', 10);
}

function drawOcean() {
  console.time('drawOcean');
  let limits = [];
  let odd = 0.8; // initial odd for ocean layer is 80%
  // Define type of ocean cells based on cell distance form land
  let frontier = $.grep(cells, (e) => e.ctype === -1);
  if (Math.random() < odd) {
    limits.push(-1);
    odd = 0.2;
  }
  for (let c = -2; frontier.length > 0 && c > -10; c--) {
    if (Math.random() < odd) {
      limits.unshift(c);
      odd = 0.2;
    } else {
      odd += 0.2;
    }
    frontier.map((i) => {
      i.neighbors.forEach((e) => {
        if (!cells[e].ctype) {
          cells[e].ctype = c;
        }
      });
    });
    frontier = $.grep(cells, (e) => e.ctype === c);
  }
  if (outlineLayersInput.value === 'none') {
    return;
  }
  if (outlineLayersInput.value !== 'random') {
    limits = outlineLayersInput.value.split(',');
  }
  // Define area edges
  const opacity = rn(0.4 / limits.length, 2);
  for (let l = 0; l < limits.length; l++) {
    const edges = [];
    const lim = +limits[l];
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].ctype < lim || cells[i].ctype === undefined) {
        continue;
      }
      if (cells[i].ctype > lim && cells[i].type !== 'border') {
        continue;
      }
      const cell = diagram.cells[i];
      cell.halfedges.forEach((e) => {
        const edge = diagram.edges[e];
        const start = edge[0].join(' ');
        const end = edge[1].join(' ');
        if (edge.left && edge.right) {
          const ea = edge.left.index === i ? edge.right.index : edge.left.index;
          if (cells[ea].ctype < lim) {
            edges.push({
              start,
              end
            });
          }
        } else {
          edges.push({
            start,
            end
          });
        }
      });
    }
    lineGen.curve(d3.curveBasis);
    let relax = 0.8 - l / 10;
    if (relax < 0.2) {
      relax = 0.2;
    }
    const line = getContinuousLine(edges, 0, relax);
    oceanLayers.append('path').attr('d', line).attr('fill', '#ecf2f9').style('opacity', opacity);
  }
  console.timeEnd('drawOcean');
}

// just apply map size that was already set, apply graph size!
function applyMapSize() {
  svgWidth = graphWidth = +mapWidthInput.value;
  svgHeight = graphHeight = +mapHeightInput.value;
  svg.attr('width', svgWidth).attr('height', svgHeight);
  // set extent to map borders + 100px to get infinity world reception
  voronoi = d3.voronoi().extent([
    [-1, -1],
    [graphWidth + 1, graphHeight + 1]
  ]);
  zoom.translateExtent([
    [0, 0],
    [graphWidth, graphHeight]
  ]).scaleExtent([1, 20]).scaleTo(svg, 1);
  viewbox.attr('transform', null);
  ocean.selectAll('rect').attr('x', 0).attr('y', 0).attr('width', graphWidth)
    .attr('height', graphHeight);
}

// Mark features (ocean, lakes, islands)
function markFeatures() {
  console.time('markFeatures');
  Math.seedrandom(seed); // reset seed to get the same result on heightmap edit
  for (let i = 0, queue = [0]; queue.length > 0; i++) {
    const cell = cells[queue[0]];
    cell.fn = i; // feature number
    const land = heights[queue[0]] >= 20;
    let border = cell.type === 'border';
    if (border && land) {
      cell.ctype = 2;
    }

    while (queue.length) {
      const q = queue.pop();
      if (cells[q].type === 'border') {
        border = true;
        if (land) {
          cells[q].ctype = 2;
        }
      }

      cells[q].neighbors.forEach((e) => {
        const eLand = heights[e] >= 20;
        if (land === eLand && cells[e].fn === undefined) {
          cells[e].fn = i;
          queue.push(e);
        }
        if (land && !eLand) {
          cells[q].ctype = 2;
          cells[e].ctype = -1;
          cells[q].harbor = cells[q].harbor ? cells[q].harbor + 1 : 1;
        }
      });
    }
    features.push({
      i,
      land,
      border
    });

    // find unmarked cell
    for (let c = 0; c < cells.length; c++) {
      if (cells[c].fn === undefined) {
        queue[0] = c;
        break;
      }
    }
  }
  console.timeEnd('markFeatures');
}

function generate() {
  console.group('Random map');
  console.time('TOTAL');
  applyMapSize();
  randomizeOptions();
  placePoints();
  calculateVoronoi(points);
  detectNeighbors();
  drawScaleBar();
  defineHeightmap();
  markFeatures();
  drawOcean();
  elevateLakes();
  resolveDepressionsPrimary();
  reGraph();
  resolveDepressionsSecondary();
  flux();
  addLakes();
  drawCoastline();
  drawRelief();
  generateCultures();
  manorsAndRegions();
  cleanData();
  console.timeEnd('TOTAL');
  console.groupEnd('Random map');
}

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

export {
  generateMainRoads,
  generatePortRoads,
  generateSmallRoads,
  generateOceanRoutes,
  generateStateName,
  drawRiverSlow,
  drawRiverLines,
  generate,
  getJitteredGrid,
  getCellIndex,
  transformPt
}