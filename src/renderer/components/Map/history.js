function updateHistory() {
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

// restoreHistory
function restoreHistory(step) {
  historyStage = step;
  redo.disabled = templateRedo.disabled = historyStage >= history.length;
  undo.disabled = templateUndo.disabled = historyStage <= 1;
  if (history[historyStage - 1] === undefined) {
    return;
  }
  heights = history[historyStage - 1].slice();
  updateHeightmap();
}

// restart history from 1st step
function restartHistory() {
  history = [];
  historyStage = 0;
  redo.disabled = templateRedo.disabled = true;
  undo.disabled = templateUndo.disabled = true;
  updateHistory();
}