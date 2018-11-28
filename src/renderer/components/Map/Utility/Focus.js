// onhover style functions
function focusOnState() {
  const s = +(this.id).slice(5);
  labels.select(`#regionLabel${s}`).classed('drag', true);
  document.getElementsByClassName(`region${s}`)[0].style.stroke = 'red';
  document.getElementsByClassName(`region${s}`)[0].setAttribute('filter', 'url(#blur1)');
}

function unfocusState() {
  const s = +(this.id).slice(5);
  labels.select(`#regionLabel${s}`).classed('drag', false);
  document.getElementsByClassName(`region${s}`)[0].style.stroke = 'none';
  document.getElementsByClassName(`region${s}`)[0].setAttribute('filter', null);
}

function focusCapital() {
  const s = +(this.parentNode.id).slice(5);
  const capital = states[s].capital;
  labels.select(`[data-id='${capital}']`).classed('drag', true);
  icons.select(`[data-id='${capital}']`).classed('drag', true);
}

function focusBurgs() {
  const s = +(this.parentNode.id).slice(5);
  const stateManors = $.grep(manors, (e) => (e.region === s));
  stateManors.map((m) => {
    labels.select(`[data-id='${m.i}']`).classed('drag', true);
    icons.select(`[data-id='${m.i}']`).classed('drag', true);
  });
}

function focusBurg() {
  const b = +(this.id).slice(5);
  const l = labels.select(`[data-id='${b}']`);
  l.classed('drag', true);
}

function unfocus() {
  $('.drag').removeClass('drag');
}

// focus on coorditanes, cell or burg provided in searchParams
function focusOn() {
  if (params.get('from') === 'MFCG') {
    // focus on burg from MFCG
    findBurgForMFCG();
    return;
  }
  const s = params.get('scale') || 8;
  let x = params.get('x');
  let y = params.get('y');
  const c = params.get('cell');
  if (c !== null) {
    x = cells[+c].data[0];
    y = cells[+c].data[1];
  }
  const b = params.get('burg');
  if (b !== null) {
    x = manors[+b].x;
    y = manors[+b].y;
  }
  if (x !== null && y !== null) {
    zoomTo(x, y, s, 1600);
  }
}
