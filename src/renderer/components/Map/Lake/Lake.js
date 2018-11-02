import * as Utils from './Utils';

class Lake {
  // add lakes on depressed points on river course
  addLakes() {
    console.time('addLakes');
    let smallLakes = 0;
    for (let i = 0; i < land.length; i++) {
      // elavate all big lakes
      if (land[i].lake === 1) {
        land[i].height = 19;
        land[i].ctype = -1;
      }
      // define eligible small lakes
      if (land[i].lake === 2 && smallLakes < 100) {
        if (land[i].river !== undefined) {
          land[i].height = 19;
          land[i].ctype = -1;
          land[i].fn = -1;
          smallLakes++;
        } else {
          land[i].lake = undefined;
          land[i].neighbors.forEach((n) => {
            if (cells[n].lake !== 1 && cells[n].river !== undefined) {
              cells[n].lake = 2;
              cells[n].height = 19;
              cells[n].ctype = -1;
              cells[n].fn = -1;
              smallLakes++;
            } else if (cells[n].lake === 2) {
              cells[n].lake = undefined;
            }
          });
        }
      }
    }
    console.log(`small lakes: ${smallLakes}`);

    // mark small lakes
    let unmarked = $.grep(land, (e) => e.fn === -1);
    while (unmarked.length) {
      let fn = -1,
        queue = [unmarked[0].index],
        lakeCells = [];
      unmarked[0].session = 'addLakes';
      while (queue.length) {
        const q = queue.pop();
        lakeCells.push(q);
        if (cells[q].fn !== -1) {
          fn = cells[q].fn;
        }
        cells[q].neighbors.forEach((e) => {
          if (cells[e].lake && cells[e].session !== 'addLakes') {
            cells[e].session = 'addLakes';
            queue.push(e);
          }
        });
      }
      if (fn === -1) {
        fn = features.length;
        features.push({
          i: fn,
          land: false,
          border: false
        });
      }
      lakeCells.forEach((c) => {
        cells[c].fn = fn;
      });
      unmarked = $.grep(land, (e) => e.fn === -1);
    }

    land = $.grep(cells, (e) => e.height >= 20);
    console.timeEnd('addLakes');
  }

  // temporary elevate lakes to min neighbors heights to correctly flux the water
  elevateLakes() {
    console.time('elevateLakes');
    const lakes = $.grep(cells, (e, d) => heights[d] < 20 && !features[e.fn].border);
    lakes.sort((a, b) => heights[b.index] - heights[a.index]);
    for (let i = 0; i < lakes.length; i++) {
      const hs = [],
        id = lakes[i].index;
      cells[id].height = heights[id]; // use height on object level
      lakes[i].neighbors.forEach((n) => {
        const nHeight = cells[n].height || heights[n];
        if (nHeight >= 20) {
          hs.push(nHeight);
        }
      });
      if (hs.length) {
        cells[id].height = d3.min(hs) - 1;
      }
      if (cells[id].height < 20) {
        cells[id].height = 20;
      }
      lakes[i].lake = 1;
    }
    console.timeEnd('elevateLakes');
  }

  // remove closed lakes near ocean
  reduceClosedLakes() {
    console.time('reduceClosedLakes');
    const fs = JSON.parse(JSON.stringify(features));
    const lakesInit = lakesNow = features.reduce((s, f) => (!f.land && !f.border ? s + 1 : s), 0);

    for (let c = 0; c < cells.length && lakesNow > 0; c++) {
      if (heights[c] < 20) {
        continue;
      } // not land
      if (cells[c].ctype !== 2) {
        continue;
      } // not near water
      let ocean = null,
        lake = null;
      // find land cells with lake and ocean nearby
      cells[c].neighbors.forEach((n) => {
        if (heights[n] >= 20) {
          return;
        }
        const fn = cells[n].fn;
        if (features[fn].border !== false) {
          ocean = fn;
        }
        if (fs[fn].border === false) {
          lake = fn;
        }
      });
      // if found, make it water and turn lake to ocean
      if (ocean !== null && lake !== null) {
        // debug.append("circle").attr("cx", cells[c].data[0]).attr("cy", cells[c].data[1]).attr("r", 2).attr("fill", "red");
        lakesNow--;
        fs[lake].border = ocean;
        heights[c] = 19;
        cells[c].fn = ocean;
        cells[c].ctype = -1;
        cells[c].neighbors.forEach((e) => {
          if (heights[e] >= 20) {
            cells[e].ctype = 2;
          }
        });
      }
    }

    if (lakesInit === lakesNow) {
      return;
    } // nothing was changed
    for (let i = 0; i < cells.length; i++) {
      if (heights[i] >= 20) {
        continue;
      } // not water
      const fn = cells[i].fn;
      if (fs[fn].border !== features[fn].border) {
        cells[i].fn = fs[fn].border;
        // debug.append("circle").attr("cx", cells[i].data[0]).attr("cy", cells[i].data[1]).attr("r", 1).attr("fill", "blue");
      }
    }
    console.timeEnd('reduceClosedLakes');
  }
}

export default Lake;
