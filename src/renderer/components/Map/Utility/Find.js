function findLandPath(start, end, type) {
  // A* algorithm
  const queue = new PriorityQueue({
    comparator(a, b) {
      return a.p - b.p;
    }
  });
  const cameFrom = [];
  const costTotal = [];
  costTotal[start] = 0;
  queue.queue({
    e: start,
    p: 0
  });
  while (queue.length > 0) {
    const next = queue.dequeue().e;
    if (next === end) {
      break;
    }
    const pol = cells[next];
    pol.neighbors.forEach((e) => {
      if (cells[e].height >= 20) {
        let cost = cells[e].height / 100 * 2;
        if (cells[e].path && type === 'main') {
          cost = 0.15;
        } else {
          if (typeof e.manor === 'undefined') {
            cost += 0.1;
          }
          if (typeof e.river !== 'undefined') {
            cost -= 0.1;
          }
          if (cells[e].harbor) {
            cost *= 0.3;
          }
          if (cells[e].path) {
            cost *= 0.5;
          }
          cost += Math.hypot(cells[e].data[0] - pol.data[0], cells[e].data[1] - pol.data[1]) / 30;
        }
        const costNew = costTotal[next] + cost;
        if (!cameFrom[e] || costNew < costTotal[e]) { //
          costTotal[e] = costNew;
          cameFrom[e] = next;
          const dist = Math.hypot(cells[e].data[0] - cells[end].data[0], cells[e].data[1] - cells[end].data[1]) / 15;
          const priority = costNew + dist;
          queue.queue({
            e,
            p: priority
          });
        }
      }
    });
  }
  return cameFrom;
}

function findLandPaths(start, type) {
  // Dijkstra algorithm (not used now)
  const queue = new PriorityQueue({
    comparator(a, b) {
      return a.p - b.p;
    }
  });
  const cameFrom = [],
    costTotal = [];
  cameFrom[start] = 'no', costTotal[start] = 0;
  queue.queue({
    e: start,
    p: 0
  });
  while (queue.length > 0) {
    const next = queue.dequeue().e;
    const pol = cells[next];
    pol.neighbors.forEach((e) => {
      if (cells[e].height < 20) {
        return;
      }
      let cost = cells[e].height / 100 * 2;
      if (e.river !== undefined) {
        cost -= 0.2;
      }
      if (pol.region !== cells[e].region) {
        cost += 1;
      }
      if (cells[e].region === 'neutral') {
        cost += 1;
      }
      if (e.manor !== undefined) {
        cost = 0.1;
      }
      const costNew = costTotal[next] + cost;
      if (!cameFrom[e]) {
        costTotal[e] = costNew;
        cameFrom[e] = next;
        queue.queue({
          e,
          p: costNew
        });
      }
    });
  }
  return cameFrom;
}

function findOceanPaths(start, end) {
  const queue = new PriorityQueue({
    comparator(a, b) {
      return a.p - b.p;
    }
  });
  let next;
  const cameFrom = [],
    costTotal = [];
  cameFrom[start] = 'no', costTotal[start] = 0;
  queue.queue({
    e: start,
    p: 0
  });
  while (queue.length > 0 && next !== end) {
    next = queue.dequeue().e;
    const pol = cells[next];
    pol.neighbors.forEach((e) => {
      if (cells[e].ctype < 0 || cells[e].haven === next) {
        let cost = 1;
        if (cells[e].ctype > 0) {
          cost += 100;
        }
        if (cells[e].ctype < -1) {
          const dist = Math.hypot(cells[e].data[0] - pol.data[0], cells[e].data[1] - pol.data[1]);
          cost += 50 + dist * 2;
        }
        if (cells[e].path && cells[e].ctype < 0) {
          cost *= 0.8;
        }
        const costNew = costTotal[next] + cost;
        if (!cameFrom[e]) {
          costTotal[e] = costNew;
          cells[e].cost = costNew;
          cameFrom[e] = next;
          queue.queue({
            e,
            p: costNew
          });
        }
      }
    });
  }
  return cameFrom;
}

// find burg from MFCG and focus on it
function findBurgForMFCG() {
  if (!manors.length) {
    console.error('No burgs generated. Cannot select a burg for MFCG');
    return;
  }
  const size = +params.get('size');
  const coast = +params.get('coast');
  const port = +params.get('port');
  const river = +params.get('river');
  let selection = defineSelection(coast, port, river);
  if (!selection.length) {
    selection = defineSelection(coast, !port, !river);
  }
  if (!selection.length) {
    selection = defineSelection(!coast, 0, !river);
  }
  if (!selection.length) {
    selection = manors[0];
  } // select first if nothing is found
  if (!selection.length) {
    console.error('Cannot find a burg for MFCG');
    return;
  }

  function defineSelection(coast, port, river) {
    let selection = [];
    if (port && river) {
      selection = $.grep(manors, (e) => cells[e.cell].port !== undefined && cells[e.cell].river !== undefined);
    } else if (!port && coast && river) {
      selection = $.grep(manors, (e) => cells[e.cell].port === undefined && cells[e.cell].ctype === 1 && cells[e.cell].river !== undefined);
    } else if (!coast && !river) {
      selection = $.grep(manors, (e) => cells[e.cell].ctype !== 1 && cells[e.cell].river === undefined);
    } else if (!coast && river) {
      selection = $.grep(manors, (e) => cells[e.cell].ctype !== 1 && cells[e.cell].river !== undefined);
    } else if (coast && !river) {
      selection = $.grep(manors, (e) => cells[e.cell].ctype === 1 && cells[e.cell].river === undefined);
    }
    return selection;
  }

  // select a burg with closes population from selection
  const selected = d3.scan(selection, (a, b) => Math.abs(a.population - size) - Math.abs(b.population - size));
  const burg = selection[selected].i;
  if (size && burg !== undefined) {
    manors[burg].population = size;
  } else {
    return;
  }

  // focus on found burg
  const label = burgLabels.select(`[data-id='${burg}']`);
  if (!label.size()) {
    console.error(`Cannot find a label for MFCG burg ${burg}`);
    return;
  }
  tip(`Here stands the glorious city of ${manors[burg].name}`, true);
  label.classed('drag', true).on('mouseover', function () {
    d3.select(this).classed('drag', false);
    tip('', true);
  });
  const x = +label.attr('x'),
    y = +label.attr('y');
  zoomTo(x, y, 8, 1600);
}