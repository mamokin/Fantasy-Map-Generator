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

export default addStrait;
