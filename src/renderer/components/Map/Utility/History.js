import * as Update from './Update';

const history = Update.history();

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

export {
  history,
  restoreHistory,
  restartHistory
};
