import * as U from './Utils';

function editLabel() {
  if (customization) {
    return;
  }

  unselect();
  closeDialogs('#labelEditor, .stable');
  elSelected = d3.select(this).call(d3.drag().on('start', elementDrag)).classed('draggable', true);

  // update group parameters
  const group = d3.select(this.parentNode);
  updateGroupOptions();
  labelGroupSelect.value = group.attr('id');
  labelFontSelect.value = fonts.indexOf(group.attr('data-font'));
  labelSize.value = group.attr('data-size');
  labelColor.value = toHEX(group.attr('fill'));
  labelOpacity.value = group.attr('opacity');
  labelText.value = elSelected.text();
  const tr = parseTransform(elSelected.attr('transform'));
  labelAngle.value = tr[2];
  labelAngleValue.innerHTML = `${Math.abs(+tr[2])}°`;

  $('#labelEditor').dialog({
    title: `Edit Label: ${labelText.value}`,
    minHeight: 30,
    width: 'auto',
    maxWidth: 275,
    resizable: false,
    position: {
      my: 'center top+10',
      at: 'bottom',
      of: this
    },
    close: unselect
  });

  if (modules.editLabel) {
    return;
  }
  modules.editLabel = true;

  loadDefaultFonts();

  function updateGroupOptions() {
    labelGroupSelect.innerHTML = '';
    labels.selectAll('g:not(#burgLabels)').each(function (d) {
      if (this.parentNode.id === 'burgLabels') {
        return;
      }
      const id = d3.select(this).attr('id');
      const opt = document.createElement('option');
      opt.value = opt.innerHTML = id;
      labelGroupSelect.add(opt);
    });
  }


  // on group change
  document.getElementById('labelGroupSelect').addEventListener('change', function () {
    document.getElementById(this.value).appendChild(elSelected.remove().node());
  });


  // on new group creation
  document.getElementById('labelGroupInput').addEventListener('change', function () {
    if (!this.value) {
      tip('Please provide a valid group name');
      return;
    }
    let group = this.value.toLowerCase().replace(/ /g, '_').replace(/[^\w\s]/gi, '');
    if (Number.isFinite(+group.charAt(0))) {
      group = `g${group}`;
    }
    // if el with this id exists, add size to id
    while (labels.selectAll(`#${group}`).size()) {
      group += '_new';
    }
    createNewLabelGroup(group);
  });

  function createNewLabelGroup(g) {
    const group = elSelected.node().parentNode.cloneNode(false);
    const groupNew = labels.append((f) => group).attr('id', g);
    groupNew.append((f) => elSelected.remove().node());
    updateGroupOptions();
    $('#labelGroupSelect, #labelGroupInput').toggle();
    labelGroupInput.value = '';
    labelGroupSelect.value = g;
    updateLabelGroups();
  }

  // remove label group on click
  document.getElementById('labelGroupRemove').addEventListener('click', () => {
    const group = d3.select(elSelected.node().parentNode);
    const id = group.attr('id');
    const count = group.selectAll('text').size();
    // remove group with < 2 label without ask
    if (count < 2) {
      removeAllLabelsInGroup(id);
      $('#labelEditor').dialog('close');
      return;
    }
    alertMessage.innerHTML = `Are you sure you want to remove all labels (${count}) of that group?`;
    $('#alert').dialog({
      resizable: false,
      title: 'Remove label group',
      buttons: {
        Remove() {
          $(this).dialog('close');
          removeAllLabelsInGroup(id);
          $('#labelEditor').dialog('close');
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });

  $('#labelTextButton').click(function () {
    $('#labelEditor > button').not(this).toggle();
    $('#labelTextButtons').toggle();
  });

  // on label text change
  document.getElementById('labelText').addEventListener('input', function () {
    if (!this.value) {
      tip('Name should not be blank, set opacity to 0 to hide label or click remove button to delete');
      return;
    }
    // change Label text
    if (elSelected.select('textPath').size()) {
      elSelected.select('textPath').text(this.value);
    } else {
      elSelected.text(this.value);
    }
    $('div[aria-describedby=\'labelEditor\'] .ui-dialog-title').text(`Edit Label: ${this.value}`);
    // check if label is a country name
    const id = elSelected.attr('id') || '';
    if (id.includes('regionLabel')) {
      const state = +elSelected.attr('id').slice(11);
      states[state].name = this.value;
    }
  });

  // generate a random country name
  document.getElementById('labelTextRandom').addEventListener('click', () => {
    let name = elSelected.text();
    const id = elSelected.attr('id') || '';
    if (id.includes('regionLabel')) {
      // label is a country name
      const state = +elSelected.attr('id').slice(11);
      name = generateStateName(state.i);
      states[state].name = name;
    } else {
      // label is not a country name, use random culture
      const c = elSelected.node().getBBox();
      const closest = cultureTree.find((c.x + c.width / 2), (c.y + c.height / 2));
      const culture = Math.floor(Math.random() * cultures.length);
      name = generateName(culture);
    }
    labelText.value = name;
    $('div[aria-describedby=\'labelEditor\'] .ui-dialog-title').text(`Edit Label: ${name}`);
    // change Label text
    if (elSelected.select('textPath').size()) {
      elSelected.select('textPath').text(name);
    } else {
      elSelected.text(name);
    }
  });

  $('#labelFontButton').click(function () {
    $('#labelEditor > button').not(this).toggle();
    $('#labelFontButtons').toggle();
  });

  // on label font change
  document.getElementById('labelFontSelect').addEventListener('change', function () {
    const group = elSelected.node().parentNode;
    const font = fonts[this.value].split(':')[0].replace(/\+/g, ' ');
    group.setAttribute('font-family', font);
    group.setAttribute('data-font', fonts[this.value]);
  });

  // on adding custom font
  document.getElementById('labelFontInput').addEventListener('change', function () {
    fetchFonts(this.value).then((fetched) => {
      if (!fetched) {
        return;
      }
      labelExternalFont.click();
      labelFontInput.value = '';
      if (fetched === 1) {
        $('#labelFontSelect').val(fonts.length - 1).change();
      }
    });
  });

  // on label size input
  document.getElementById('labelSize').addEventListener('input', function () {
    const group = elSelected.node().parentNode;
    const size = +this.value;
    group.setAttribute('data-size', size);
    group.setAttribute('font-size', rn((size + (size / scale)) / 2, 2));
  });

  $('#labelStyleButton').click(function () {
    $('#labelEditor > button').not(this).toggle();
    $('#labelStyleButtons').toggle();
  });

  // on label fill color input
  document.getElementById('labelColor').addEventListener('input', function () {
    const group = elSelected.node().parentNode;
    group.setAttribute('fill', this.value);
  });

  // on label opacity input
  document.getElementById('labelOpacity').addEventListener('input', function () {
    const group = elSelected.node().parentNode;
    group.setAttribute('opacity', this.value);
  });

  $('#labelAngleButton').click(function () {
    $('#labelEditor > button').not(this).toggle();
    $('#labelAngleButtons').toggle();
  });

  // on label angle input
  document.getElementById('labelAngle').addEventListener('input', function () {
    const tr = parseTransform(elSelected.attr('transform'));
    labelAngleValue.innerHTML = `${Math.abs(+this.value)}°`;
    const c = elSelected.node().getBBox();
    const angle = +this.value;
    const transform = `translate(${tr[0]},${tr[1]}) rotate(${angle} ${(c.x + c.width / 2)} ${(c.y + c.height / 2)})`;
    elSelected.attr('transform', transform);
  });

  // display control points to curve label (place on path)
  document.getElementById('labelCurve').addEventListener('click', () => {
    const c = elSelected.node().getBBox();
    let cx = c.x + c.width / 2,
      cy = c.y + c.height / 2;

    if (!elSelected.select('textPath').size()) {
      const id = elSelected.attr('id');
      const pathId = `#textPath_${id}`;
      const path = `M${cx - c.width},${cy} q${c.width},0 ${c.width * 2},0`;
      let text = elSelected.text(),
        x = elSelected.attr('x'),
        y = elSelected.attr('y');
      elSelected.text(null).attr('data-x', x).attr('data-y', y).attr('x', null)
        .attr('y', null);
      defs.append('path').attr('id', `textPath_${id}`).attr('d', path);
      elSelected.append('textPath').attr('href', pathId).attr('startOffset', '50%').text(text);
    }

    if (!debug.select('circle').size()) {
      debug.append('circle').attr('id', 'textPathControl').attr('r', 1.6)
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('transform', elSelected.attr('transform') || null)
        .call(d3.drag().on('start', textPathControlDrag));
    }
  });

  // drag textPath controle point to curve the label
  function textPathControlDrag() {
    const textPath = defs.select(`#textPath_${elSelected.attr('id')}`);
    const path = textPath.attr('d').split(' ');
    const M = path[0].split(',');
    const q = path[1].split(','); // +q[1] to get qy - the only changeble value
    const y = d3.event.y;

    d3.event.on('drag', function () {
      const dy = d3.event.y - y;
      const total = +q[1] + dy * 8;
      d3.select(this).attr('cy', d3.event.y);
      textPath.attr('d', `${M[0]},${+M[1] - dy} ${q[0]},${total} ${path[2]}`);
    });
  }

  // cancel label curvature
  document.getElementById('labelCurveCancel').addEventListener('click', () => {
    if (!elSelected.select('textPath').size()) {
      return;
    }
    let text = elSelected.text(),
      x = elSelected.attr('data-x'),
      y = elSelected.attr('data-y');
    elSelected.text();
    elSelected.attr('x', x).attr('y', y).attr('data-x', null).attr('data-y', null)
      .text(text);
    defs.select(`#textPath_${elSelected.attr('id')}`).remove();
    debug.select('circle').remove();
  });

  // open legendsEditor
  document.getElementById('labelLegend').addEventListener('click', () => {
    const id = elSelected.attr('id');
    const name = elSelected.text();
    editLegends(id, name);
  });

  // copy label on click
  document.getElementById('labelCopy').addEventListener('click', () => {
    const group = d3.select(elSelected.node().parentNode);
    copy = group.append((f) => elSelected.node().cloneNode(true));
    const id = `label${Date.now().toString().slice(7)}`;
    copy.attr('id', id).attr('class', null).on('click', editLabel);
    const shift = +group.attr('font-size') + 1;
    if (copy.select('textPath').size()) {
      const path = defs.select(`#textPath_${elSelected.attr('id')}`).attr('d');
      const textPath = defs.append('path').attr('id', `textPath_${id}`);
      copy.select('textPath').attr('href', `#textPath_${id}`);
      const pathArray = path.split(' ');
      const x = +pathArray[0].split(',')[0].slice(1);
      const y = +pathArray[0].split(',')[1];
      textPath.attr('d', `M${x - shift},${y - shift} ${pathArray[1]} ${pathArray[2]}`);
      shift;
    } else {
      let x = +elSelected.attr('x') - shift;
      let y = +elSelected.attr('y') - shift;
      while (group.selectAll(`text[x='${x}']`).size()) {
        x -= shift;
        y -= shift;
      }
      copy.attr('x', x).attr('y', y);
    }
  });

  // remove label on click
  document.getElementById('labelRemoveSingle').addEventListener('click', () => {
    alertMessage.innerHTML = 'Are you sure you want to remove the label?';
    $('#alert').dialog({
      resizable: false,
      title: 'Remove label',
      buttons: {
        Remove() {
          $(this).dialog('close');
          elSelected.remove();
          defs.select(`#textPath_${elSelected.attr('id')}`).remove();
          $('#labelEditor').dialog('close');
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });
}

function editRiver() {
  if (customization) {
    return;
  }
  if (elSelected) {
    const self = d3.select(this).attr('id') === elSelected.attr('id');
    const point = d3.mouse(this);
    if (elSelected.attr('data-river') === 'new') {
      addRiverPoint([point[0], point[1]]);
      completeNewRiver();
      return;
    } else if (self) {
      riverAddControlPoint(point);
      return;
    }
  }

  unselect();
  closeDialogs('#riverEditor, .stable');
  elSelected = d3.select(this);
  elSelected.call(d3.drag().on('start', riverDrag));

  const tr = parseTransform(elSelected.attr('transform'));
  riverAngle.value = tr[2];
  riverAngleValue.innerHTML = `${Math.abs(+tr[2])}°`;
  riverScale.value = tr[5];
  riverWidthInput.value = +elSelected.attr('data-width');
  riverIncrement.value = +elSelected.attr('data-increment');

  $('#riverEditor').dialog({
    title: 'Edit River',
    minHeight: 30,
    width: 'auto',
    resizable: false,
    position: {
      my: 'center top+20',
      at: 'top',
      of: d3.event
    },
    close() {
      if ($('#riverNew').hasClass('pressed')) {
        completeNewRiver();
      }
      unselect();
    }
  });

  if (!debug.select('.controlPoints').size()) {
    debug.append('g').attr('class', 'controlPoints');
  }
  riverDrawPoints();

  if (modules.editRiver) {
    return;
  }
  modules.editRiver = true;

  function riverAddControlPoint(point) {
    const dists = [];
    debug.select('.controlPoints').selectAll('circle').each(function () {
      const x = +d3.select(this).attr('cx');
      const y = +d3.select(this).attr('cy');
      dists.push(Math.hypot(point[0] - x, point[1] - y));
    });
    let index = dists.length;
    if (dists.length > 1) {
      const sorted = dists.slice(0).sort((a, b) => a - b);
      const closest = dists.indexOf(sorted[0]);
      const next = dists.indexOf(sorted[1]);
      if (closest <= next) {
        index = closest + 1;
      } else {
        index = next + 1;
      }
    }
    const before = `:nth-child(${index + 1})`;
    debug.select('.controlPoints').insert('circle', before)
      .attr('cx', point[0]).attr('cy', point[1])
      .attr('r', 0.35)
      .call(d3.drag().on('drag', riverPointDrag))
      .on('click', function (d) {
        $(this).remove();
        redrawRiver();
      });
    redrawRiver();
  }

  function riverDrawPoints() {
    const node = elSelected.node();
    // river is a polygon, so divide length by 2 to get course length
    const l = node.getTotalLength() / 2;
    const parts = (l / 5) >> 0; // number of points
    let inc = l / parts; // increment
    if (inc === Infinity) {
      inc = l;
    } // 2 control points for short rivers
    // draw control points
    for (let i = l, c = l; i > 0; i -= inc, c += inc) {
      const p1 = node.getPointAtLength(i);
      const p2 = node.getPointAtLength(c);
      const p = [(p1.x + p2.x) / 2, (p1.y + p2.y) / 2];
      addRiverPoint(p);
    }
    // last point should be accurate
    const lp1 = node.getPointAtLength(0);
    const lp2 = node.getPointAtLength(l * 2);
    const p = [(lp1.x + lp2.x) / 2, (lp1.y + lp2.y) / 2];
    addRiverPoint(p);
  }

  function addRiverPoint(point) {
    debug.select('.controlPoints').append('circle')
      .attr('cx', point[0]).attr('cy', point[1])
      .attr('r', 0.35)
      .call(d3.drag().on('drag', riverPointDrag))
      .on('click', function (d) {
        $(this).remove();
        redrawRiver();
      });
  }

  function riverPointDrag() {
    d3.select(this).attr('cx', d3.event.x).attr('cy', d3.event.y);
    redrawRiver();
  }

  function riverDrag() {
    const x = d3.event.x,
      y = d3.event.y;
    const tr = parseTransform(elSelected.attr('transform'));
    d3.event.on('drag', () => {
      let xc = d3.event.x,
        yc = d3.event.y;
      const transform = `translate(${(+tr[0] + xc - x)},${(+tr[1] + yc - y)}) rotate(${tr[2]} ${tr[3]} ${tr[4]}) scale(${tr[5]})`;
      elSelected.attr('transform', transform);
      debug.select('.controlPoints').attr('transform', transform);
    });
  }

  function redrawRiver() {
    const points = [];
    debug.select('.controlPoints').selectAll('circle').each(function () {
      const el = d3.select(this);
      points.push([+el.attr('cx'), +el.attr('cy')]);
    });
    const width = +riverWidthInput.value;
    const increment = +riverIncrement.value;
    const d = drawRiverSlow(points, width, increment);
    elSelected.attr('d', d);
  }

  $('#riverWidthInput, #riverIncrement').change(() => {
    const width = +riverWidthInput.value;
    const increment = +riverIncrement.value;
    elSelected.attr('data-width', width).attr('data-increment', increment);
    redrawRiver();
  });

  $('#riverRegenerate').click(() => {
    let points = [],
      amended = [],
      x,
      y,
      p1,
      p2;
    const node = elSelected.node();
    const l = node.getTotalLength() / 2;
    const parts = (l / 8) >> 0; // number of points
    let inc = l / parts; // increment
    if (inc === Infinity) {
      inc = l;
    } // 2 control points for short rivers
    for (let i = l, e = l; i > 0; i -= inc, e += inc) {
      p1 = node.getPointAtLength(i);
      p2 = node.getPointAtLength(e);
      x = (p1.x + p2.x) / 2, y = (p1.y + p2.y) / 2;
      points.push([x, y]);
    }
    // last point should be accurate
    p1 = node.getPointAtLength(0);
    p2 = node.getPointAtLength(l * 2);
    x = (p1.x + p2.x) / 2, y = (p1.y + p2.y) / 2;
    points.push([x, y]);
    // amend points
    const rndFactor = 0.3 + Math.random() * 1.4; // random factor in range 0.2-1.8
    for (let i = 0; i < points.length; i++) {
      x = points[i][0], y = points[i][1];
      amended.push([x, y]);
      // add additional semi-random point
      if (i + 1 < points.length) {
        const x2 = points[i + 1][0],
          y2 = points[i + 1][1];
        const side = Math.random() > 0.5 ? 1 : -1;
        const angle = Math.atan2(y2 - y, x2 - x);
        const serpentine = 2 / (i + 1);
        const meandr = serpentine + 0.3 + Math.random() * rndFactor;
        x = (x + x2) / 2, y = (y + y2) / 2;
        x += -Math.sin(angle) * meandr * side;
        y += Math.cos(angle) * meandr * side;
        amended.push([x, y]);
      }
    }
    const width = +riverWidthInput.value * 0.6 + Math.random();
    const increment = +riverIncrement.value * 0.9 + Math.random() * 0.2;
    riverWidthInput.value = width;
    riverIncrement.value = increment;
    elSelected.attr('data-width', width).attr('data-increment', increment);
    const d = drawRiverSlow(amended, width, increment);
    elSelected.attr('d', d).attr('data-width', width).attr('data-increment', increment);
    debug.select('.controlPoints').selectAll('*').remove();
    amended.map((p) => {
      addRiverPoint(p);
    });
  });

  $('#riverAngle').on('input', function () {
    const tr = parseTransform(elSelected.attr('transform'));
    riverAngleValue.innerHTML = `${Math.abs(+this.value)}°`;
    const c = elSelected.node().getBBox();
    const angle = +this.value,
      scale = +tr[5];
    const transform = `translate(${tr[0]},${tr[1]}) rotate(${angle} ${(c.x + c.width / 2) * scale} ${(c.y + c.height / 2) * scale}) scale(${scale})`;
    elSelected.attr('transform', transform);
    debug.select('.controlPoints').attr('transform', transform);
  });

  $('#riverReset').click(() => {
    elSelected.attr('transform', '');
    debug.select('.controlPoints').attr('transform', '');
    riverAngle.value = 0;
    riverAngleValue.innerHTML = '0°';
    riverScale.value = 1;
  });

  $('#riverScale').change(function () {
    const tr = parseTransform(elSelected.attr('transform'));
    const scaleOld = +tr[5],
      scale = +this.value;
    const c = elSelected.node().getBBox();
    const cx = c.x + c.width / 2,
      cy = c.y + c.height / 2;
    const trX = +tr[0] + cx * (scaleOld - scale);
    const trY = +tr[1] + cy * (scaleOld - scale);
    const scX = +tr[3] * scale / scaleOld;
    const scY = +tr[4] * scale / scaleOld;
    const transform = `translate(${trX},${trY}) rotate(${tr[2]} ${scX} ${scY}) scale(${scale})`;
    elSelected.attr('transform', transform);
    debug.select('.controlPoints').attr('transform', transform);
  });

  $('#riverNew').click(function () {
    if ($(this).hasClass('pressed')) {
      completeNewRiver();
    } else {
      // enter creation mode
      $('.pressed').removeClass('pressed');
      $(this).addClass('pressed');
      if (elSelected) {
        elSelected.call(d3.drag().on('drag', null));
      }
      debug.select('.controlPoints').selectAll('*').remove();
      viewbox.style('cursor', 'crosshair').on('click', newRiverAddPoint);
    }
  });

  function newRiverAddPoint() {
    const point = d3.mouse(this);
    addRiverPoint([point[0], point[1]]);
    if (!elSelected || elSelected.attr('data-river') !== 'new') {
      const id = +$('#rivers > path').last().attr('id').slice(5) + 1;
      elSelected = rivers.append('path').attr('data-river', 'new').attr('id', `river${id}`)
        .attr('data-width', 2)
        .attr('data-increment', 1)
        .on('click', completeNewRiver);
    } else {
      redrawRiver();
      const cell = diagram.find(point[0], point[1]).index;
      const f = cells[cell].fn;
      const ocean = !features[f].land && features[f].border;
      if (ocean && debug.select('.controlPoints').selectAll('circle').size() > 5) {
        completeNewRiver();
      }
    }
  }

  function completeNewRiver() {
    $('#riverNew').removeClass('pressed');
    restoreDefaultEvents();
    if (!elSelected || elSelected.attr('data-river') !== 'new') {
      return;
    }
    redrawRiver();
    elSelected.attr('data-river', '');
    elSelected.call(d3.drag().on('start', riverDrag)).on('click', editRiver);
    const r = +elSelected.attr('id').slice(5);
    debug.select('.controlPoints').selectAll('circle').each(function () {
      const x = +d3.select(this).attr('cx');
      const y = +d3.select(this).attr('cy');
      const cell = diagram.find(x, y, 3);
      if (!cell) {
        return;
      }
      if (cells[cell.index].river === undefined) {
        cells[cell.index].river = r;
      }
    });
    unselect();
    debug.append('g').attr('class', 'controlPoints');
  }

  $('#riverCopy').click(() => {
    const tr = parseTransform(elSelected.attr('transform'));
    const d = elSelected.attr('d');
    let x = 2,
      y = 2;
    let transform = `translate(${tr[0] - x},${tr[1] - y}) rotate(${tr[2]} ${tr[3]} ${tr[4]}) scale(${tr[5]})`;
    while (rivers.selectAll(`[transform='${transform}'][d='${d}']`).size() > 0) {
      x += 2;
      y += 2;
      transform = `translate(${tr[0] - x},${tr[1] - y}) rotate(${tr[2]} ${tr[3]} ${tr[4]}) scale(${tr[5]})`;
    }
    const river = +$('#rivers > path').last().attr('id').slice(5) + 1;
    rivers.append('path').attr('d', d)
      .attr('transform', transform)
      .attr('id', `river${river}`)
      .on('click', editRiver)
      .attr('data-width', elSelected.attr('data-width'))
      .attr('data-increment', elSelected.attr('data-increment'));
    unselect();
  });

  // open legendsEditor
  document.getElementById('riverLegend').addEventListener('click', () => {
    const id = elSelected.attr('id');
    editLegends(id, id);
  });

  $('#riverRemove').click(() => {
    alertMessage.innerHTML = 'Are you sure you want to remove the river?';
    $('#alert').dialog({
      resizable: false,
      title: 'Remove river',
      buttons: {
        Remove() {
          $(this).dialog('close');
          const river = +elSelected.attr('id').slice(5);
          const avPrec = rn(precInput.value / Math.sqrt(cells.length), 2);
          land.map((l) => {
            if (l.river === river) {
              l.river = undefined;
              l.flux = avPrec;
            }
          });
          elSelected.remove();
          unselect();
          $('#riverEditor').dialog('close');
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });
}

function editRoute() {
  if (customization) {
    return;
  }
  if (elSelected) {
    const self = d3.select(this).attr('id') === elSelected.attr('id');
    const point = d3.mouse(this);
    if (elSelected.attr('data-route') === 'new') {
      addRoutePoint({
        x: point[0],
        y: point[1]
      });
      completeNewRoute();
      return;
    } else if (self) {
      routeAddControlPoint(point);
      return;
    }
  }

  unselect();
  closeDialogs('#routeEditor, .stable');

  if (this && this !== window) {
    elSelected = d3.select(this);
    if (!debug.select('.controlPoints').size()) {
      debug.append('g').attr('class', 'controlPoints');
    }
    routeDrawPoints();
    routeUpdateGroups();
    const routeType = d3.select(this.parentNode).attr('id');
    routeGroup.value = routeType;

    $('#routeEditor').dialog({
      title: 'Edit Route',
      minHeight: 30,
      width: 'auto',
      resizable: false,
      position: {
        my: 'center top+20',
        at: 'top',
        of: d3.event
      },
      close() {
        if ($('#addRoute').hasClass('pressed')) {
          completeNewRoute();
        }
        if ($('#routeSplit').hasClass('pressed')) {
          $('#routeSplit').removeClass('pressed');
        }
        unselect();
      }
    });
  } else {
    elSelected = null;
  }

  if (modules.editRoute) {
    return;
  }
  modules.editRoute = true;

  function routeAddControlPoint(point) {
    const dists = [];
    debug.select('.controlPoints').selectAll('circle').each(function () {
      const x = +d3.select(this).attr('cx');
      const y = +d3.select(this).attr('cy');
      dists.push(Math.hypot(point[0] - x, point[1] - y));
    });
    let index = dists.length;
    if (dists.length > 1) {
      const sorted = dists.slice(0).sort((a, b) => a - b);
      const closest = dists.indexOf(sorted[0]);
      const next = dists.indexOf(sorted[1]);
      if (closest <= next) {
        index = closest + 1;
      } else {
        index = next + 1;
      }
    }
    const before = `:nth-child(${index + 1})`;
    debug.select('.controlPoints').insert('circle', before)
      .attr('cx', point[0]).attr('cy', point[1])
      .attr('r', 0.35)
      .call(d3.drag().on('drag', routePointDrag))
      .on('click', function (d) {
        $(this).remove();
        routeRedraw();
      });
    routeRedraw();
  }

  function routeDrawPoints() {
    if (!elSelected.size()) {
      return;
    }
    const node = elSelected.node();
    const l = node.getTotalLength();
    const parts = (l / 5) >> 0; // number of points
    let inc = l / parts; // increment
    if (inc === Infinity) {
      inc = l;
    } // 2 control points for short routes
    // draw control points
    for (let i = 0; i <= l; i += inc) {
      const p = node.getPointAtLength(i);
      addRoutePoint(p);
    }
    // convert length to distance
    routeLength.innerHTML = `${rn(l * distanceScale.value)} ${distanceUnit.value}`;
  }

  function addRoutePoint(point) {
    const controlPoints = debug.select('.controlPoints').size() ?
      debug.select('.controlPoints') :
      debug.append('g').attr('class', 'controlPoints');
    controlPoints.append('circle')
      .attr('cx', point.x).attr('cy', point.y).attr('r', 0.35)
      .call(d3.drag().on('drag', routePointDrag))
      .on('click', function (d) {
        if ($('#routeSplit').hasClass('pressed')) {
          routeSplitInPoint(this);
        } else {
          $(this).remove();
          routeRedraw();
        }
      });
  }

  function routePointDrag() {
    d3.select(this).attr('cx', d3.event.x).attr('cy', d3.event.y);
    routeRedraw();
  }

  function routeRedraw() {
    const points = [];
    debug.select('.controlPoints').selectAll('circle').each(function () {
      const el = d3.select(this);
      points.push({
        scX: +el.attr('cx'),
        scY: +el.attr('cy')
      });
    });
    lineGen.curve(d3.curveCatmullRom.alpha(0.1));
    elSelected.attr('d', lineGen(points));
    // get route distance
    const l = elSelected.node().getTotalLength();
    routeLength.innerHTML = `${rn(l * distanceScale.value)} ${distanceUnit.value}`;
  }

  function addNewRoute() {
    const routeType = elSelected && elSelected.node() ? elSelected.node().parentNode.id : 'searoutes';
    const group = routes.select(`#${routeType}`);
    const id = `${routeType}${group.selectAll('*').size()}`;
    elSelected = group.append('path').attr('data-route', 'new').attr('id', id).on('click', editRoute);
    routeUpdateGroups();
    $('#routeEditor').dialog({
      title: 'Edit Route',
      minHeight: 30,
      width: 'auto',
      resizable: false,
      close() {
        if ($('#addRoute').hasClass('pressed')) {
          completeNewRoute();
        }
        if ($('#routeSplit').hasClass('pressed')) {
          $('#routeSplit').removeClass('pressed');
        }
        unselect();
      }
    });
  }

  function newRouteAddPoint() {
    const point = d3.mouse(this);
    const x = rn(point[0], 2),
      y = rn(point[1], 2);
    addRoutePoint({
      x,
      y
    });
    routeRedraw();
  }

  function completeNewRoute() {
    $('#routeNew, #addRoute').removeClass('pressed');
    restoreDefaultEvents();
    if (!elSelected.size()) {
      return;
    }
    if (elSelected.attr('data-route') === 'new') {
      routeRedraw();
      elSelected.attr('data-route', '');
      const node = elSelected.node();
      const l = node.getTotalLength();
      const pathCells = [];
      for (let i = 0; i <= l; i++) {
        const p = node.getPointAtLength(i);
        const cell = diagram.find(p.x, p.y);
        if (!cell) {
          return;
        }
        pathCells.push(cell.index);
      }
      const uniqueCells = [...new Set(pathCells)];
      uniqueCells.map((c) => {
        if (cells[c].path !== undefined) {
          cells[c].path += 1;
        } else {
          cells[c].path = 1;
        }
      });
    }
    tip('', true);
  }

  function routeUpdateGroups() {
    routeGroup.innerHTML = '';
    routes.selectAll('g').each(function () {
      const opt = document.createElement('option');
      opt.value = opt.innerHTML = this.id;
      routeGroup.add(opt);
    });
  }

  function routeSplitInPoint(clicked) {
    const group = d3.select(elSelected.node().parentNode);
    $('#routeSplit').removeClass('pressed');
    const points1 = [],
      points2 = [];
    let points = points1;
    debug.select('.controlPoints').selectAll('circle').each(function () {
      const el = d3.select(this);
      points.push({
        scX: +el.attr('cx'),
        scY: +el.attr('cy')
      });
      if (this === clicked) {
        points = points2;
        points.push({
          scX: +el.attr('cx'),
          scY: +el.attr('cy')
        });
      }
      el.remove();
    });
    lineGen.curve(d3.curveCatmullRom.alpha(0.1));
    elSelected.attr('d', lineGen(points1));
    const id = `${routeGroup.value}${group.selectAll('*').size()}`;
    group.append('path').attr('id', id).attr('d', lineGen(points2)).on('click', editRoute);
    routeDrawPoints();
  }

  $('#routeGroup').change(function () {
    $(elSelected.node()).detach().appendTo($(`#${this.value}`));
  });

  // open legendsEditor
  document.getElementById('routeLegend').addEventListener('click', () => {
    const id = elSelected.attr('id');
    editLegends(id, id);
  });

  $('#routeNew').click(function () {
    if ($(this).hasClass('pressed')) {
      completeNewRoute();
    } else {
      // enter creation mode
      $('.pressed').removeClass('pressed');
      $('#routeNew, #addRoute').addClass('pressed');
      debug.select('.controlPoints').selectAll('*').remove();
      addNewRoute();
      viewbox.style('cursor', 'crosshair').on('click', newRouteAddPoint);
      tip('Click on map to add route point', true);
    }
  });

  $('#routeRemove').click(() => {
    alertMessage.innerHTML = 'Are you sure you want to remove the route?';
    $('#alert').dialog({
      resizable: false,
      title: 'Remove route',
      buttons: {
        Remove() {
          $(this).dialog('close');
          elSelected.remove();
          $('#routeEditor').dialog('close');
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });
}

function editIcon() {
  if (customization) {
    return;
  }
  if (elSelected) {
    if (this.isSameNode(elSelected.node())) {
      return;
    }
  }

  unselect();
  closeDialogs('#iconEditor, .stable');
  elSelected = d3.select(this).call(d3.drag().on('start', elementDrag)).classed('draggable', true);

  // update group parameters
  const group = d3.select(this.parentNode);
  iconUpdateGroups();
  iconGroup.value = group.attr('id');
  iconFillColor.value = group.attr('fill');
  iconStrokeColor.value = group.attr('stroke');
  iconSize.value = group.attr('size');
  iconStrokeWidth.value = group.attr('stroke-width');

  $('#iconEditor').dialog({
    title: `Edit icon: ${group.attr('id')}`,
    minHeight: 30,
    width: 'auto',
    resizable: false,
    position: {
      my: 'center top+20',
      at: 'top',
      of: d3.event
    },
    close: unselect
  });

  if (modules.editIcon) {
    return;
  }
  modules.editIcon = true;

  $('#iconGroups').click(function () {
    $('#iconEditor > button').not(this).toggle();
    $('#iconGroupsSelection').toggle();
  });

  function iconUpdateGroups() {
    iconGroup.innerHTML = '';
    const anchor = group.attr('id').includes('anchor');
    icons.selectAll('g').each(function (d) {
      const id = d3.select(this).attr('id');
      if (id === 'burgs') {
        return;
      }
      if (!anchor && id.includes('anchor')) {
        return;
      }
      if (anchor && !id.includes('anchor')) {
        return;
      }
      const opt = document.createElement('option');
      opt.value = opt.innerHTML = id;
      iconGroup.add(opt);
    });
  }

  $('#iconGroup').change(function () {
    const newGroup = this.value;
    const to = $(`#icons > #${newGroup}`);
    $(elSelected.node()).detach().appendTo(to);
  });

  $('#iconCopy').click(() => {
    const group = d3.select(elSelected.node().parentNode);
    const copy = elSelected.node().cloneNode();
    copy.removeAttribute('data-id'); // remove assignment to burg if any
    const tr = parseTransform(copy.getAttribute('transform'));
    const shift = 10 / Math.sqrt(scale);
    let transform = `translate(${rn(tr[0] - shift, 1)},${rn(tr[1] - shift, 1)})`;
    for (let i = 2; group.selectAll(`[transform='${transform}']`).size() > 0; i++) {
      transform = `translate(${rn(tr[0] - shift * i, 1)},${rn(tr[1] - shift * i, 1)})`;
    }
    copy.setAttribute('transform', transform);
    group.node().insertBefore(copy, null);
    copy.addEventListener('click', editIcon);
  });

  $('#iconRemoveGroup').click(() => {
    const group = d3.select(elSelected.node().parentNode);
    const count = group.selectAll('*').size();
    if (count < 2) {
      group.remove();
      $('#labelEditor').dialog('close');
      return;
    }
    const message = `Are you sure you want to remove all '${iconGroup.value}' icons (${count})?`;
    alertMessage.innerHTML = message;
    $('#alert').dialog({
      resizable: false,
      title: 'Remove icon group',
      buttons: {
        Remove() {
          $(this).dialog('close');
          group.remove();
          $('#iconEditor').dialog('close');
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });

  $('#iconColors').click(function () {
    $('#iconEditor > button').not(this).toggle();
    $('#iconColorsSection').toggle();
  });

  $('#iconFillColor').change(function () {
    const group = d3.select(elSelected.node().parentNode);
    group.attr('fill', this.value);
  });

  $('#iconStrokeColor').change(function () {
    const group = d3.select(elSelected.node().parentNode);
    group.attr('stroke', this.value);
  });

  $('#iconSetSize').click(function () {
    $('#iconEditor > button').not(this).toggle();
    $('#iconSizeSection').toggle();
  });

  $('#iconSize').change(function () {
    const group = d3.select(elSelected.node().parentNode);
    const size = +this.value;
    group.attr('size', size);
    group.selectAll('*').each(function () {
      d3.select(this).attr('width', size).attr('height', size);
    });
  });

  $('#iconStrokeWidth').change(function () {
    const group = d3.select(elSelected.node().parentNode);
    group.attr('stroke-width', this.value);
  });

  $('#iconRemove').click(() => {
    alertMessage.innerHTML = 'Are you sure you want to remove the icon?';
    $('#alert').dialog({
      resizable: false,
      title: 'Remove icon',
      buttons: {
        Remove() {
          $(this).dialog('close');
          elSelected.remove();
          $('#iconEditor').dialog('close');
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });
}

function editReliefIcon() {
  if (customization) {
    return;
  }
  if (elSelected) {
    if (this.isSameNode(elSelected.node())) {
      return;
    }
  }

  unselect();
  closeDialogs('#reliefEditor, .stable');
  elSelected = d3.select(this).raise().call(d3.drag().on('start', elementDrag)).classed('draggable', true);
  const group = elSelected.node().parentNode.id;
  reliefGroup.value = group;

  const bulkRemoveSection = document.getElementById('reliefBulkRemoveSection');
  if (bulkRemoveSection.style.display != 'none') {
    reliefBulkRemove.click();
  }

  $('#reliefEditor').dialog({
    title: 'Edit relief icon',
    minHeight: 30,
    width: 'auto',
    resizable: false,
    position: {
      my: 'center top+40',
      at: 'top',
      of: d3.event
    },
    close: unselect
  });

  if (modules.editReliefIcon) {
    return;
  }
  modules.editReliefIcon = true;

  $('#reliefGroups').click(function () {
    $('#reliefEditor > button').not(this).toggle();
    $('#reliefGroupsSelection').toggle();
  });

  $('#reliefGroup').change(function () {
    const type = this.value;
    const bbox = elSelected.node().getBBox();
    const cx = bbox.x;
    const cy = bbox.y + bbox.height / 2;
    const cell = diagram.find(cx, cy).index;
    const height = cell !== undefined ? cells[cell].height : 50;
    elSelected.remove();
    elSelected = addReliefIcon(height / 100, type, cx, cy, cell);
    elSelected.call(d3.drag().on('start', elementDrag));
  });

  $('#reliefCopy').click(() => {
    const group = d3.select(elSelected.node().parentNode);
    const copy = elSelected.node().cloneNode(true);
    const tr = parseTransform(copy.getAttribute('transform'));
    const shift = 10 / Math.sqrt(scale);
    let transform = `translate(${rn(tr[0] - shift, 1)},${rn(tr[1] - shift, 1)})`;
    for (let i = 2; group.selectAll(`[transform='${transform}']`).size() > 0; i++) {
      transform = `translate(${rn(tr[0] - shift * i, 1)},${rn(tr[1] - shift * i, 1)})`;
    }
    copy.setAttribute('transform', transform);
    group.node().insertBefore(copy, null);
    copy.addEventListener('click', editReliefIcon);
  });

  $('#reliefAddfromEditor').click(() => {
    clickToAdd(); // to load on click event function
    $('#addRelief').click();
  });

  $('#reliefRemoveGroup').click(() => {
    const group = d3.select(elSelected.node().parentNode);
    const count = group.selectAll('*').size();
    if (count < 2) {
      group.selectAll('*').remove();
      $('#labelEditor').dialog('close');
      return;
    }
    const message = `Are you sure you want to remove all '${reliefGroup.value}' icons (${count})?`;
    alertMessage.innerHTML = message;
    $('#alert').dialog({
      resizable: false,
      title: 'Remove all icons within group',
      buttons: {
        Remove() {
          $(this).dialog('close');
          group.selectAll('*').remove();
          $('#reliefEditor').dialog('close');
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });

  $('#reliefBulkRemove').click(function () {
    $('#reliefEditor > button').not(this).toggle();
    const section = document.getElementById('reliefBulkRemoveSection');
    if (section.style.display === 'none') {
      section.style.display = 'inline-block';
      tip('Drag to remove relief icons in radius', true);
      viewbox.style('cursor', 'crosshair').call(d3.drag().on('drag', dragToRemoveReliefIcons));
      customization = 5;
    } else {
      section.style.display = 'none';
      restoreDefaultEvents();
      customization = 0;
    }
  });

  function dragToRemoveReliefIcons() {
    const point = d3.mouse(this);
    const cell = diagram.find(point[0], point[1]).index;
    const radius = +reliefBulkRemoveRadius.value;
    const r = rn(6 / graphSize * radius, 1);
    moveCircle(point[0], point[1], r);
    const selection = defineBrushSelection(cell, radius);
    if (selection) {
      removeReliefIcons(selection);
    }
  }

  function removeReliefIcons(selection) {
    if (selection.length === 0) {
      return;
    }
    selection.map((index) => {
      const selected = terrain.selectAll('g').selectAll(`g[data-cell='${index}']`);
      selected.remove();
    });
  }

  $('#reliefRemove').click(() => {
    alertMessage.innerHTML = 'Are you sure you want to remove the icon?';
    $('#alert').dialog({
      resizable: false,
      title: 'Remove relief icon',
      buttons: {
        Remove() {
          $(this).dialog('close');
          elSelected.remove();
          $('#reliefEditor').dialog('close');
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });
}

function editBurg() {
  if (customization) {
    return;
  }
  unselect();
  closeDialogs('#burgEditor, .stable');
  elSelected = d3.select(this);
  const id = +elSelected.attr('data-id');
  if (id === undefined) {
    return;
  }
  d3.selectAll(`[data-id='${id}']`).call(d3.drag().on('start', elementDrag)).classed('draggable', true);

  // update Burg details
  const type = elSelected.node().parentNode.id;
  const labelGroup = burgLabels.select(`#${type}`);
  const iconGroup = burgIcons.select(`#${type}`);
  burgNameInput.value = manors[id].name;
  updateBurgsGroupOptions();
  burgSelectGroup.value = labelGroup.attr('id');
  burgSelectDefaultFont.value = fonts.indexOf(labelGroup.attr('data-font'));
  burgSetLabelSize.value = labelGroup.attr('data-size');
  burgLabelColorInput.value = toHEX(labelGroup.attr('fill'));
  burgLabelOpacity.value = labelGroup.attr('opacity') === undefined ? 1 : +labelGroup.attr('opacity');
  const tr = parseTransform(elSelected.attr('transform'));
  burgLabelAngle.value = tr[2];
  burgLabelAngleOutput.innerHTML = `${Math.abs(+tr[2])}°`;
  burgIconSize.value = iconGroup.attr('size');
  burgIconFillOpacity.value = iconGroup.attr('fill-opacity') === undefined ? 1 : +iconGroup.attr('fill-opacity');
  burgIconFillColor.value = iconGroup.attr('fill');
  burgIconStrokeWidth.value = iconGroup.attr('stroke-width');
  burgIconStrokeOpacity.value = iconGroup.attr('stroke-opacity') === undefined ? 1 : +iconGroup.attr('stroke-opacity');
  burgIconStrokeColor.value = iconGroup.attr('stroke');
  const cell = cells[manors[id].cell];
  if (cell.region !== 'neutral' && cell.region !== undefined) {
    burgToggleCapital.disabled = false;
    const capital = states[manors[id].region] ? id === states[manors[id].region].capital ? 1 : 0 : 0;
    d3.select('#burgToggleCapital').classed('pressed', capital);
  } else {
    burgToggleCapital.disabled = true;
    d3.select('#burgToggleCapital').classed('pressed', false);
  }
  d3.select('#burgTogglePort').classed('pressed', cell.port !== undefined);
  burgPopulation.value = manors[id].population;
  burgPopulationFriendly.value = rn(manors[id].population * urbanization.value * populationRate.value * 1000);

  $('#burgEditor').dialog({
    title: `Edit Burg: ${manors[id].name}`,
    minHeight: 30,
    width: 'auto',
    resizable: false,
    position: {
      my: 'center top+40',
      at: 'top',
      of: d3.event
    },
    close() {
      d3.selectAll(`[data-id='${id}']`).call(d3.drag().on('drag', null)).classed('draggable', false);
      elSelected = null;
    }
  });

  if (modules.editBurg) {
    return;
  }
  modules.editBurg = true;

  loadDefaultFonts();

  function updateBurgsGroupOptions() {
    burgSelectGroup.innerHTML = '';
    burgIcons.selectAll('g').each(function (d) {
      const opt = document.createElement('option');
      opt.value = opt.innerHTML = d3.select(this).attr('id');
      burgSelectGroup.add(opt);
    });
  }

  $('#burgEditor > button').not('#burgAddfromEditor').not('#burgRelocate').not('#burgRemove')
    .click(function () {
      if ($(this).next().is(':visible')) {
        $('#burgEditor > button').show();
        $(this).next('div').hide();
      } else {
        $('#burgEditor > *').not(this).hide();
        $(this).next('div').show();
      }
    });

  $('#burgEditor > div > button').click(function () {
    if ($(this).next().is(':visible')) {
      $('#burgEditor > div > button').show();
      $(this).parent().prev().show();
      $(this).next('div').hide();
    } else {
      $('#burgEditor > div > button').not(this).hide();
      $(this).parent().prev().hide();
      $(this).next('div').show();
    }
  });

  $('#burgSelectGroup').change(function () {
    const id = +elSelected.attr('data-id');
    const g = this.value;
    moveBurgToGroup(id, g);
  });

  $('#burgInputGroup').change(function () {
    let newGroup = this.value.toLowerCase().replace(/ /g, '_').replace(/[^\w\s]/gi, '');
    if (Number.isFinite(+newGroup.charAt(0))) {
      newGroup = `g${newGroup}`;
    }
    if (burgLabels.select(`#${newGroup}`).size()) {
      tip(`The group "${newGroup}" is already exists`);
      return;
    }
    burgInputGroup.value = '';
    // clone old group assigning new id
    const id = elSelected.node().parentNode.id;
    const l = burgLabels.select(`#${id}`).node().cloneNode(false);
    l.id = newGroup;
    const i = burgIcons.select(`#${id}`).node().cloneNode(false);
    i.id = newGroup;
    burgLabels.node().insertBefore(l, null);
    burgIcons.node().insertBefore(i, null);
    // select new group
    const opt = document.createElement('option');
    opt.value = opt.innerHTML = newGroup;
    burgSelectGroup.add(opt);
    $('#burgSelectGroup').val(newGroup).change();
    $('#burgSelectGroup, #burgInputGroup').toggle();
    updateLabelGroups();
  });

  $('#burgAddGroup').click(() => {
    if ($('#burgInputGroup').css('display') === 'none') {
      $('#burgInputGroup').css('display', 'inline-block');
      $('#burgSelectGroup').css('display', 'none');
      burgInputGroup.focus();
    } else {
      $('#burgSelectGroup').css('display', 'inline-block');
      $('#burgInputGroup').css('display', 'none');
    }
  });

  $('#burgRemoveGroup').click(() => {
    const group = d3.select(elSelected.node().parentNode);
    const type = group.attr('id');
    const id = +elSelected.attr('data-id');
    const count = group.selectAll('*').size();
    const message = `Are you sure you want to remove all Burgs (${count}) of that group?`;
    alertMessage.innerHTML = message;
    $('#alert').dialog({
      resizable: false,
      title: 'Remove Burgs',
      buttons: {
        Remove() {
          $(this).dialog('close');
          group.selectAll('*').each(function (d) {
            const id = +d3.select(this).attr('data-id');
            if (id === undefined) {
              return;
            }
            const cell = manors[id].cell;
            const state = manors[id].region;
            if (states[state]) {
              if (states[state].capital === id) {
                states[state].capital = 'select';
              }
              states[state].burgs--;
            }
            manors[id].region = 'removed';
            cells[cell].manor = undefined;
          });
          burgLabels.select(`#${type}`).selectAll('*').remove();
          burgIcons.select(`#${type}`).selectAll('*').remove();
          $(`#icons g[id*='anchors'] [data-id=${id}]`).parent().children().remove();
          closeDialogs('.stable');
          updateCountryEditors();
          $('#burgEditor').dialog('close');
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });

  $('#burgNameInput').on('input', function () {
    if (this.value === '') {
      tip('Name should not be blank, set opacity to 0 to hide label or remove button to delete');
      return;
    }
    const id = +elSelected.attr('data-id');
    burgLabels.selectAll(`[data-id='${id}']`).text(this.value);
    manors[id].name = this.value;
    $('div[aria-describedby=\'burgEditor\'] .ui-dialog-title').text(`Edit Burg: ${this.value}`);
  });

  $('#burgNameReCulture, #burgNameReRandom').click(function () {
    const id = +elSelected.attr('data-id');
    const culture = this.id === 'burgNameReCulture' ? manors[id].culture : Math.floor(Math.random() * cultures.length);
    const name = generateName(culture);
    burgLabels.selectAll(`[data-id='${id}']`).text(name);
    manors[id].name = name;
    burgNameInput.value = name;
    $('div[aria-describedby=\'burgEditor\'] .ui-dialog-title').text(`Edit Burg: ${name}`);
  });

  $('#burgToggleExternalFont').click(() => {
    if ($('#burgInputExternalFont').css('display') === 'none') {
      $('#burgInputExternalFont').css('display', 'inline-block');
      $('#burgSelectDefaultFont').css('display', 'none');
      burgInputExternalFont.focus();
    } else {
      $('#burgSelectDefaultFont').css('display', 'inline-block');
      $('#burgInputExternalFont').css('display', 'none');
    }
  });

  $('#burgSelectDefaultFont').change(() => {
    const type = elSelected.node().parentNode.id;
    const group = burgLabels.select(`#${type}`);
    if (burgSelectDefaultFont.value === '') {
      return;
    }
    const font = fonts[burgSelectDefaultFont.value].split(':')[0].replace(/\+/g, ' ');
    group.attr('font-family', font).attr('data-font', fonts[burgSelectDefaultFont.value]);
  });

  $('#burgInputExternalFont').change(function () {
    fetchFonts(this.value).then((fetched) => {
      if (!fetched) {
        return;
      }
      burgToggleExternalFont.click();
      burgInputExternalFont.value = '';
      if (fetched === 1) {
        $('#burgSelectDefaultFont').val(fonts.length - 1).change();
      }
    });
  });

  $('#burgSetLabelSize').on('input', function () {
    const type = elSelected.node().parentNode.id;
    const group = burgLabels.select(`#${type}`);
    group.attr('data-size', +this.value);
    invokeActiveZooming();
  });

  $('#burgLabelColorInput').on('input', function () {
    const type = elSelected.node().parentNode.id;
    const group = burgLabels.select(`#${type}`);
    group.attr('fill', this.value);
  });

  $('#burgLabelOpacity').on('input', function () {
    const type = elSelected.node().parentNode.id;
    const group = burgLabels.select(`#${type}`);
    group.attr('opacity', +this.value);
  });

  $('#burgLabelAngle').on('input', function () {
    const id = +elSelected.attr('data-id');
    const el = burgLabels.select(`[data-id='${id}']`);
    const tr = parseTransform(el.attr('transform'));
    const c = el.node().getBBox();
    burgLabelAngleOutput.innerHTML = `${Math.abs(+this.value)}°`;
    const angle = +this.value;
    const transform = `translate(${tr[0]},${tr[1]}) rotate(${angle} ${(c.x + c.width / 2)} ${(c.y + c.height / 2)})`;
    el.attr('transform', transform);
  });

  $('#burgIconSize').on('input', function () {
    const type = elSelected.node().parentNode.id;
    const group = burgIcons.select(`#${type}`);
    const size = +this.value;
    group.attr('size', size);
    group.selectAll('*').each(function () {
      d3.select(this).attr('r', size);
    });
  });

  $('#burgIconFillOpacity').on('input', function () {
    const type = elSelected.node().parentNode.id;
    const group = burgIcons.select(`#${type}`);
    group.attr('fill-opacity', +this.value);
  });

  $('#burgIconFillColor').on('input', function () {
    const type = elSelected.node().parentNode.id;
    const group = burgIcons.select(`#${type}`);
    group.attr('fill', this.value);
  });

  $('#burgIconStrokeWidth').on('input', function () {
    const type = elSelected.node().parentNode.id;
    const group = burgIcons.select(`#${type}`);
    group.attr('stroke-width', +this.value);
  });

  $('#burgIconStrokeOpacity').on('input', function () {
    const type = elSelected.node().parentNode.id;
    const group = burgIcons.select(`#${type}`);
    group.attr('stroke-opacity', +this.value);
  });

  $('#burgIconStrokeColor').on('input', function () {
    const type = elSelected.node().parentNode.id;
    const group = burgIcons.select(`#${type}`);
    group.attr('stroke', this.value);
  });

  $('#burgToggleCapital').click(() => {
    const id = +elSelected.attr('data-id');
    const state = manors[id].region;
    if (states[state] === undefined) {
      return;
    }
    const capital = states[manors[id].region] ? id === states[manors[id].region].capital ? 0 : 1 : 1;
    if (capital && states[state].capital !== 'select') {
      // move oldCapital to a town group
      const oldCapital = states[state].capital;
      moveBurgToGroup(oldCapital, 'towns');
    }
    states[state].capital = capital ? id : 'select';
    d3.select('#burgToggleCapital').classed('pressed', capital);
    const g = capital ? 'capitals' : 'towns';
    moveBurgToGroup(id, g);
  });

  $('#burgTogglePort').click(() => {
    const id = +elSelected.attr('data-id');
    const cell = cells[manors[id].cell];
    const markAsPort = cell.port === undefined ? true : undefined;
    cell.port = markAsPort;
    d3.select('#burgTogglePort').classed('pressed', markAsPort);
    if (markAsPort) {
      const type = elSelected.node().parentNode.id;
      const ag = type === 'capitals' ? '#capital-anchors' : '#town-anchors';
      const group = icons.select(ag);
      const size = +group.attr('size');
      const x = rn(manors[id].x - size * 0.47, 2);
      const y = rn(manors[id].y - size * 0.47, 2);
      group.append('use').attr('xlink:href', '#icon-anchor').attr('data-id', id)
        .attr('x', x)
        .attr('y', y)
        .attr('width', size)
        .attr('height', size)
        .on('click', editIcon);
    } else {
      $(`#icons g[id*='anchors'] [data-id=${id}]`).remove();
    }
  });

  $('#burgPopulation').on('input', function () {
    const id = +elSelected.attr('data-id');
    burgPopulationFriendly.value = rn(this.value * urbanization.value * populationRate.value * 1000);
    manors[id].population = +this.value;
  });

  $('#burgRelocate').click(function () {
    if ($(this).hasClass('pressed')) {
      $('.pressed').removeClass('pressed');
      restoreDefaultEvents();
      tip('', true);
    } else {
      $('.pressed').removeClass('pressed');
      const id = elSelected.attr('data-id');
      $(this).addClass('pressed').attr('data-id', id);
      viewbox.style('cursor', 'crosshair').on('click', relocateBurgOnClick);
      tip('Click on map to relocate burg. Hold Shift for continuous move', true);
    }
  });

  // open legendsEditor
  document.getElementById('burglLegend').addEventListener('click', () => {
    const burg = +elSelected.attr('data-id');
    const id = `burg${burg}`;
    const name = manors[burg].name;
    editLegends(id, name);
  });

  // move burg to a different cell
  function relocateBurgOnClick() {
    const point = d3.mouse(this);
    const index = getIndex(point);
    const i = +$('#burgRelocate').attr('data-id');
    if (isNaN(i) || !manors[i]) {
      return;
    }

    if (cells[index].height < 20) {
      tip('Cannot place burg in the water! Select a land cell', null, 'error');
      return;
    }

    if (cells[index].manor !== undefined && cells[index].manor !== i) {
      tip('There is already a burg in this cell. Please select a free cell', null, 'error');
      $('#grid').fadeIn();
      d3.select('#toggleGrid').classed('buttonoff', false);
      return;
    }

    const region = cells[index].region;
    const oldRegion = manors[i].region;
    // relocating capital to other country you "conquer" target cell
    if (states[oldRegion] && states[oldRegion].capital === i) {
      if (region !== oldRegion) {
        tip('Capital cannot be moved to another country!', null, 'error');
        return;
      }
    }

    if (d3.event.shiftKey === false) {
      $('#burgRelocate').removeClass('pressed');
      restoreDefaultEvents();
      tip('', true);
      if (region !== oldRegion) {
        recalculateStateData(oldRegion);
        recalculateStateData(region);
        updateCountryEditors();
      }
    }

    const x = rn(point[0], 2),
      y = rn(point[1], 2);
    burgIcons.select(`circle[data-id='${i}']`).attr('transform', null).attr('cx', x).attr('cy', y);
    burgLabels.select(`text[data-id='${i}']`).attr('transform', null).attr('x', x).attr('y', y);
    const anchor = icons.select(`use[data-id='${i}']`);
    if (anchor.size()) {
      const size = anchor.attr('width');
      const xa = rn(x - size * 0.47, 2);
      const ya = rn(y - size * 0.47, 2);
      anchor.attr('transform', null).attr('x', xa).attr('y', ya);
    }
    cells[index].manor = i;
    cells[manors[i].cell].manor = undefined;
    manors[i].x = x, manors[i].y = y, manors[i].region = region, manors[i].cell = index;
  }

  // open in MFCG
  $('#burgSeeInMFCG').click(() => {
    const id = +elSelected.attr('data-id');
    const name = manors[id].name;
    const cell = manors[id].cell;
    const pop = rn(manors[id].population);
    const size = pop > 65 ? 65 : pop < 6 ? 6 : pop;
    const s = `${seed}${id}`;
    const hub = cells[cell].crossroad > 2 ? 1 : 0;
    const river = cells[cell].river ? 1 : 0;
    const coast = cells[cell].port !== undefined ? 1 : 0;
    const sec = pop > 40 ? 1 : Math.random() < pop / 100 ? 1 : 0;
    const thr = sec && Math.random() < 0.8 ? 1 : 0;
    const url = 'http://fantasycities.watabou.ru/';
    let params = `?name=${name}&size=${size}&seed=${s}&hub=${hub}&random=0&continuous=0`;
    params += `&river=${river}&coast=${coast}&citadel=${id & 1}&plaza=${sec}&temple=${thr}&walls=${sec}&shantytown=${sec}`;
    const win = window.open(url + params, '_blank');
    win.focus();
  });

  $('#burgAddfromEditor').click(() => {
    clickToAdd(); // to load on click event function
    $('#addBurg').click();
  });

  $('#burgRemove').click(() => {
    alertMessage.innerHTML = 'Are you sure you want to remove the Burg?';
    $('#alert').dialog({
      resizable: false,
      title: 'Remove Burg',
      buttons: {
        Remove() {
          $(this).dialog('close');
          const id = +elSelected.attr('data-id');
          d3.selectAll(`[data-id='${id}']`).remove();
          const cell = manors[id].cell;
          const state = manors[id].region;
          if (states[state]) {
            if (states[state].capital === id) {
              states[state].capital = 'select';
            }
            states[state].burgs--;
          }
          manors[id].region = 'removed';
          cells[cell].manor = undefined;
          closeDialogs('.stable');
          updateCountryEditors();
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });
}

function editMarker() {
  if (customization) {
    return;
  }

  unselect();
  closeDialogs('#markerEditor, .stable');
  elSelected = d3.select(this).call(d3.drag().on('start', elementDrag)).classed('draggable', true);

  $('#markerEditor').dialog({
    title: 'Edit Marker',
    minHeight: 30,
    width: 'auto',
    maxWidth: 275,
    resizable: false,
    position: {
      my: 'center top+30',
      at: 'bottom',
      of: d3.event
    },
    close: unselect
  });

  // update inputs
  const id = elSelected.attr('href');
  const symbol = d3.select('#defs-markers').select(id);
  const icon = symbol.select('text');
  markerSelectGroup.value = id.slice(1);
  markerIconSize.value = parseFloat(icon.attr('font-size'));
  markerIconShiftX.value = parseFloat(icon.attr('x'));
  markerIconShiftY.value = parseFloat(icon.attr('y'));
  markerIconFill.value = icon.attr('fill');
  markerIconStrokeWidth.value = icon.attr('stroke-width');
  markerIconStroke.value = icon.attr('stroke');
  markerSize.value = elSelected.attr('data-size');
  markerBase.value = symbol.select('path').attr('fill');
  markerFill.value = symbol.select('circle').attr('fill');
  const opacity = symbol.select('circle').attr('opacity');
  markerToggleBubble.className = opacity === '0' ? 'icon-info' : 'icon-info-circled';

  const table = document.getElementById('markerIconTable');
  let selected = table.getElementsByClassName('selected');
  if (selected.length) {
    selected[0].removeAttribute('class');
  }
  selected = document.querySelectorAll(`#markerIcon${icon.text().codePointAt()}`);
  if (selected.length) {
    selected[0].className = 'selected';
  }
  markerIconCustom.value = selected.length ? '' : icon.text();

  if (modules.editMarker) {
    return;
  }
  modules.editMarker = true;

  $('#markerGroup').click(function () {
    $('#markerEditor > button').not(this).toggle();
    $('#markerGroupSection').toggle();
    updateMarkerGroupOptions();
  });

  function updateMarkerGroupOptions() {
    markerSelectGroup.innerHTML = '';
    d3.select('#defs-markers').selectAll('symbol').each(function () {
      const opt = document.createElement('option');
      opt.value = opt.innerHTML = this.id;
      markerSelectGroup.add(opt);
    });
    const id = elSelected.attr('href').slice(1);
    markerSelectGroup.value = id;
  }

  // on add marker type click
  document.getElementById('markerAddGroup').addEventListener('click', () => {
    if ($('#markerInputGroup').css('display') === 'none') {
      $('#markerInputGroup').css('display', 'inline-block');
      $('#markerSelectGroup').css('display', 'none');
      markerInputGroup.focus();
    } else {
      $('#markerSelectGroup').css('display', 'inline-block');
      $('#markerInputGroup').css('display', 'none');
    }
  });

  // on marker type change
  document.getElementById('markerSelectGroup').addEventListener('change', function () {
    elSelected.attr('href', `#${this.value}`);
    elSelected.attr('data-id', `#${this.value}`);
  });

  // on new type input
  document.getElementById('markerInputGroup').addEventListener('change', function () {
    let newGroup = this.value.toLowerCase().replace(/ /g, '_').replace(/[^\w\s]/gi, '');
    if (Number.isFinite(+newGroup.charAt(0))) {
      newGroup = `m${newGroup}`;
    }
    if (d3.select('#defs-markers').select(`#${newGroup}`).size()) {
      tip(`The type "${newGroup}" is already exists`);
      return;
    }
    markerInputGroup.value = '';
    // clone old group assigning new id
    const id = elSelected.attr('href');
    const l = d3.select('#defs-markers').select(id).node().cloneNode(true);
    l.id = newGroup;
    elSelected.attr('href', `#${newGroup}`);
    elSelected.attr('data-id', `#${newGroup}`);
    document.getElementById('defs-markers').insertBefore(l, null);

    // select new group
    const opt = document.createElement('option');
    opt.value = opt.innerHTML = newGroup;
    markerSelectGroup.add(opt);
    $('#markerSelectGroup').val(newGroup).change();
    $('#markerSelectGroup, #markerInputGroup').toggle();
    updateMarkerGroupOptions();
  });

  $('#markerIconButton').click(function () {
    $('#markerEditor > button').not(this).toggle();
    $('#markerIconButtons').toggle();
    if (!$('#markerIconTable').text()) {
      drawIconsList(icons);
    }
  });

  $('#markerRemoveGroup').click(() => {
    const id = elSelected.attr('href');
    const used = document.querySelectorAll(`use[data-id='${id}']`);
    const count = used.length === 1 ? '1 element' : `${used.length} elements`;
    const message = `Are you sure you want to remove the marker (${count})?`;
    alertMessage.innerHTML = message;
    $('#alert').dialog({
      resizable: false,
      title: 'Remove marker',
      buttons: {
        Remove() {
          $(this).dialog('close');
          if (id !== '#marker0') {
            d3.select('#defs-markers').select(id).remove();
          }
          used.forEach((e) => {
            e.remove();
          });
          updateMarkerGroupOptions();
          $('#markerEditor').dialog('close');
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });

  function drawIconsList() {
    const icons = [
      // emoticons in FF:
      ['2693', '⚓', 'Anchor'],
      ['26EA', '⛪', 'Church'],
      ['1F3EF', '🏯', 'Japanese Castle'],
      ['1F3F0', '🏰', 'Castle'],
      ['1F5FC', '🗼', 'Tower'],
      ['1F3E0', '🏠', 'House'],
      ['1F3AA', '🎪', 'Tent'],
      ['1F3E8', '🏨', 'Hotel'],
      ['1F4B0', '💰', 'Money bag'],
      ['1F4A8', '💨', 'Dashing away'],
      ['1F334', '🌴', 'Palm'],
      ['1F335', '🌵', 'Cactus'],
      ['1F33E', '🌾', 'Sheaf'],
      ['1F5FB', '🗻', 'Mountain'],
      ['1F30B', '🌋', 'Volcano'],
      ['1F40E', '🐎', 'Horse'],
      ['1F434', '🐴', 'Horse Face'],
      ['1F42E', '🐮', 'Cow'],
      ['1F43A', '🐺', 'Wolf Face'],
      ['1F435', '🐵', 'Monkey face'],
      ['1F437', '🐷', 'Pig face'],
      ['1F414', '🐔', 'Chiken'],
      ['1F411', '🐑', 'Eve'],
      ['1F42B', '🐫', 'Camel'],
      ['1F418', '🐘', 'Elephant'],
      ['1F422', '🐢', 'Turtle'],
      ['1F40C', '🐌', 'Snail'],
      ['1F40D', '🐍', 'Snake'],
      ['1F433', '🐳', 'Whale'],
      ['1F42C', '🐬', 'Dolphin'],
      ['1F420', '🐟', 'Fish'],
      ['1F432', '🐲', 'Dragon Head'],
      ['1F479', '👹', 'Ogre'],
      ['1F47B', '👻', 'Ghost'],
      ['1F47E', '👾', 'Alien'],
      ['1F480', '💀', 'Skull'],
      ['1F374', '🍴', 'Fork and knife'],
      ['1F372', '🍲', 'Food'],
      ['1F35E', '🍞', 'Bread'],
      ['1F357', '🍗', 'Poultry leg'],
      ['1F347', '🍇', 'Grapes'],
      ['1F34F', '🍏', 'Apple'],
      ['1F352', '🍒', 'Cherries'],
      ['1F36F', '🍯', 'Honey pot'],
      ['1F37A', '🍺', 'Beer'],
      ['1F377', '🍷', 'Wine glass'],
      ['1F3BB', '🎻', 'Violin'],
      ['1F3B8', '🎸', 'Guitar'],
      ['26A1', '⚡', 'Electricity'],
      ['1F320', '🌠', 'Shooting star'],
      ['1F319', '🌙', 'Crescent moon'],
      ['1F525', '🔥', 'Fire'],
      ['1F4A7', '💧', 'Droplet'],
      ['1F30A', '🌊', 'Wave'],
      ['231B', '⌛', 'Hourglass'],
      ['1F3C6', '🏆', 'Goblet'],
      ['26F2', '⛲', 'Fountain'],
      ['26F5', '⛵', 'Sailboat'],
      ['26FA', '⛺', 'Tend'],
      ['1F489', '💉', 'Syringe'],
      ['1F4D6', '📚', 'Books'],
      ['1F3AF', '🎯', 'Archery'],
      ['1F52E', '🔮', 'Magic ball'],
      ['1F3AD', '🎭', 'Performing arts'],
      ['1F3A8', '🎨', 'Artist palette'],
      ['1F457', '👗', 'Dress'],
      ['1F451', '👑', 'Crown'],
      ['1F48D', '💍', 'Ring'],
      ['1F48E', '💎', 'Gem'],
      ['1F514', '🔔', 'Bell'],
      ['1F3B2', '🎲', 'Die'],
      // black and white icons in FF:
      ['26A0', '⚠', 'Alert'],
      ['2317', '⌗', 'Hash'],
      ['2318', '⌘', 'POI'],
      ['2307', '⌇', 'Wavy'],
      ['21E6', '⇦', 'Left arrow'],
      ['21E7', '⇧', 'Top arrow'],
      ['21E8', '⇨', 'Right arrow'],
      ['21E9', '⇩', 'Left arrow'],
      ['21F6', '⇶', 'Three arrows'],
      ['2699', '⚙', 'Gear'],
      ['269B', '⚛', 'Atom'],
      ['0024', '$', 'Dollar'],
      ['2680', '⚀', 'Die1'],
      ['2681', '⚁', 'Die2'],
      ['2682', '⚂', 'Die3'],
      ['2683', '⚃', 'Die4'],
      ['2684', '⚄', 'Die5'],
      ['2685', '⚅', 'Die6'],
      ['26B4', '⚴', 'Pallas'],
      ['26B5', '⚵', 'Juno'],
      ['26B6', '⚶', 'Vesta'],
      ['26B7', '⚷', 'Chiron'],
      ['26B8', '⚸', 'Lilith'],
      ['263F', '☿', 'Mercury'],
      ['2640', '♀', 'Venus'],
      ['2641', '♁', 'Earth'],
      ['2642', '♂', 'Mars'],
      ['2643', '♃', 'Jupiter'],
      ['2644', '♄', 'Saturn'],
      ['2645', '♅', 'Uranus'],
      ['2646', '♆', 'Neptune'],
      ['2647', '♇', 'Pluto'],
      ['26B3', '⚳', 'Ceres'],
      ['2654', '♔', 'Chess king'],
      ['2655', '♕', 'Chess queen'],
      ['2656', '♖', 'Chess rook'],
      ['2657', '♗', 'Chess bishop'],
      ['2658', '♘', 'Chess knight'],
      ['2659', '♙', 'Chess pawn'],
      ['2660', '♠', 'Spade'],
      ['2663', '♣', 'Club'],
      ['2665', '♥', 'Heart'],
      ['2666', '♦', 'Diamond'],
      ['2698', '⚘', 'Flower'],
      ['2625', '☥', 'Ankh'],
      ['2626', '☦', 'Orthodox'],
      ['2627', '☧', 'Chi Rho'],
      ['2628', '☨', 'Lorraine'],
      ['2629', '☩', 'Jerusalem'],
      ['2670', '♰', 'Syriac cross'],
      ['2020', '†', 'Dagger'],
      ['262A', '☪', 'Muslim'],
      ['262D', '☭', 'Soviet'],
      ['262E', '☮', 'Peace'],
      ['262F', '☯', 'Yin yang'],
      ['26A4', '⚤', 'Heterosexuality'],
      ['26A2', '⚢', 'Female homosexuality'],
      ['26A3', '⚣', 'Male homosexuality'],
      ['26A5', '⚥', 'Male and female'],
      ['26AD', '⚭', 'Rings'],
      ['2690', '⚐', 'White flag'],
      ['2691', '⚑', 'Black flag'],
      ['263C', '☼', 'Sun'],
      ['263E', '☾', 'Moon'],
      ['2668', '♨', 'Hot springs'],
      ['2600', '☀', 'Black sun'],
      ['2601', '☁', 'Cloud'],
      ['2602', '☂', 'Umbrella'],
      ['2603', '☃', 'Snowman'],
      ['2604', '☄', 'Comet'],
      ['2605', '★', 'Black star'],
      ['2606', '☆', 'White star'],
      ['269D', '⚝', 'Outlined star'],
      ['2618', '☘', 'Shamrock'],
      ['21AF', '↯', 'Lightning'],
      ['269C', '⚜', 'FleurDeLis'],
      ['2622', '☢', 'Radiation'],
      ['2623', '☣', 'Biohazard'],
      ['2620', '☠', 'Skull'],
      ['2638', '☸', 'Dharma'],
      ['2624', '☤', 'Caduceus'],
      ['2695', '⚕', 'Aeculapius staff'],
      ['269A', '⚚', 'Hermes staff'],
      ['2697', '⚗', 'Alembic'],
      ['266B', '♫', 'Music'],
      ['2702', '✂', 'Scissors'],
      ['2696', '⚖', 'Scales'],
      ['2692', '⚒', 'Hammer and pick'],
      ['2694', '⚔', 'Swords']
    ];

    let table = document.getElementById('markerIconTable'),
      row = '';
    table.addEventListener('click', clickMarkerIconTable, false);
    table.addEventListener('mouseover', hoverMarkerIconTable, false);

    for (let i = 0; i < icons.length; i++) {
      if (i % 20 === 0) {
        row = table.insertRow(0);
      }
      const cell = row.insertCell(0);
      const icon = String.fromCodePoint(parseInt(icons[i][0], 16));
      cell.innerHTML = icon;
      cell.id = `markerIcon${icon.codePointAt()}`;
      cell.setAttribute('data-desc', icons[i][2]);
    }
  }

  function clickMarkerIconTable(e) {
    if (e.target !== e.currentTarget) {
      const table = document.getElementById('markerIconTable');
      const selected = table.getElementsByClassName('selected');
      if (selected.length) {
        selected[0].removeAttribute('class');
      }
      e.target.className = 'selected';
      const id = elSelected.attr('href');
      const icon = e.target.innerHTML;
      d3.select('#defs-markers').select(id).select('text').text(icon);
    }
    e.stopPropagation();
  }

  function hoverMarkerIconTable(e) {
    if (e.target !== e.currentTarget) {
      const desc = e.target.getAttribute('data-desc');
      tip(`${e.target.innerHTML} ${desc}`);
    }
    e.stopPropagation();
  }

  // change marker icon size
  document.getElementById('markerIconSize').addEventListener('input', function () {
    const id = elSelected.attr('href');
    d3.select('#defs-markers').select(id).select('text').attr('font-size', `${this.value}px`);
  });

  // change marker icon x shift
  document.getElementById('markerIconShiftX').addEventListener('input', function () {
    const id = elSelected.attr('href');
    d3.select('#defs-markers').select(id).select('text').attr('x', `${this.value}%`);
  });

  // change marker icon y shift
  document.getElementById('markerIconShiftY').addEventListener('input', function () {
    const id = elSelected.attr('href');
    d3.select('#defs-markers').select(id).select('text').attr('y', `${this.value}%`);
  });

  // apply custom unicode icon on input
  document.getElementById('markerIconCustom').addEventListener('input', function () {
    if (!this.value) {
      return;
    }
    const id = elSelected.attr('href');
    d3.select('#defs-markers').select(id).select('text').text(this.value);
  });

  $('#markerStyleButton').click(function () {
    $('#markerEditor > button').not(this).toggle();
    $('#markerStyleButtons').toggle();
  });

  // change marker size
  document.getElementById('markerSize').addEventListener('input', function () {
    const id = elSelected.attr('data-id');
    const used = document.querySelectorAll(`use[data-id='${id}']`);
    const size = this.value;
    used.forEach((e) => {
      e.setAttribute('data-size', size);
    });
    invokeActiveZooming();
  });

  // change marker base color
  document.getElementById('markerBase').addEventListener('input', function () {
    const id = elSelected.attr('href');
    d3.select(id).select('path').attr('fill', this.value);
    d3.select(id).select('circle').attr('stroke', this.value);
  });

  // change marker fill color
  document.getElementById('markerFill').addEventListener('input', function () {
    const id = elSelected.attr('href');
    d3.select(id).select('circle').attr('fill', this.value);
  });

  // change marker icon y shift
  document.getElementById('markerIconFill').addEventListener('input', function () {
    const id = elSelected.attr('href');
    d3.select('#defs-markers').select(id).select('text').attr('fill', this.value);
  });

  // change marker icon y shift
  document.getElementById('markerIconStrokeWidth').addEventListener('input', function () {
    const id = elSelected.attr('href');
    d3.select('#defs-markers').select(id).select('text').attr('stroke-width', this.value);
  });

  // change marker icon y shift
  document.getElementById('markerIconStroke').addEventListener('input', function () {
    const id = elSelected.attr('href');
    d3.select('#defs-markers').select(id).select('text').attr('stroke', this.value);
  });

  // toggle marker bubble display
  document.getElementById('markerToggleBubble').addEventListener('click', function () {
    const id = elSelected.attr('href');
    let show = 1;
    if (this.className === 'icon-info-circled') {
      this.className = 'icon-info';
      show = 0;
    } else {
      this.className = 'icon-info-circled';
    }
    d3.select(id).select('circle').attr('opacity', show);
    d3.select(id).select('path').attr('opacity', show);
  });

  // open legendsEditor
  document.getElementById('markerLegendButton').addEventListener('click', () => {
    const id = elSelected.attr('id');
    const symbol = elSelected.attr('href');
    const icon = d3.select('#defs-markers').select(symbol).select('text').text();
    const name = `Marker ${icon}`;
    editLegends(id, name);
  });

  // click on master button to add new markers on click
  document.getElementById('markerAdd').addEventListener('click', () => {
    document.getElementById('addMarker').click();
  });

  // remove marker on click
  document.getElementById('markerRemove').addEventListener('click', () => {
    alertMessage.innerHTML = 'Are you sure you want to remove the marker?';
    $('#alert').dialog({
      resizable: false,
      title: 'Remove marker',
      buttons: {
        Remove() {
          $(this).dialog('close');
          elSelected.remove();
          $('#markerEditor').dialog('close');
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });
}

function editHeightmap(type) {
  closeDialogs();
  const regionData = [],
    cultureData = [];
  if (type !== 'clean') {
    for (let i = 0; i < points.length; i++) {
      let cell = diagram.find(points[i][0], points[i][1]).index;
      // if closest cell is a small lake, try to find a land neighbor
      if (cells[cell].lake === 2) {
        cells[cell].neighbors.forEach((n) => {
          if (cells[n].height >= 20) {
            cell = n;
          }
        });
      }
      let region = cells[cell].region;
      if (region === undefined) {
        region = -1;
      }
      regionData.push(region);
      let culture = cells[cell].culture;
      if (culture === undefined) {
        culture = -1;
      }
      cultureData.push(culture);
    }
  } else {
    U.undraw();
  }
  U.calculateVoronoi(points);
  detectNeighbors('grid');
  drawScaleBar();
  if (type === 'keep') {
    svg.selectAll('#lakes, #coastline, #terrain, #rivers, #grid, #terrs, #landmass, #ocean, #regions')
      .selectAll('path, circle, line').remove();
    svg.select('#shape').remove();
    for (let i = 0; i < points.length; i++) {
      if (regionData[i] !== -1) {
        cells[i].region = regionData[i];
      }
      if (cultureData[i] !== -1) {
        cells[i].culture = cultureData[i];
      }
    }
  }
  mockHeightmap();
  customizeHeightmap();
  openBrushesPanel();
}

// open editCountries dialog
function editCountries() {
  if (cults.selectAll('path').size()) {
    $('#toggleCultures').click();
  }
  if (regions.style('display') === 'none') {
    $('#toggleCountries').click();
  }
  layoutPreset.value = 'layoutPolitical';
  $('#countriesBody').empty();
  $('#countriesHeader').children().removeClass('icon-sort-name-up icon-sort-name-down icon-sort-number-up icon-sort-number-down');
  let totalArea = 0,
    totalBurgs = 0,
    unit,
    areaConv;
  if (areaUnit.value === 'square') {
    unit = ` ${distanceUnit.value}²`;
  } else {
    unit = ` ${areaUnit.value}`;
  }
  let totalPopulation = 0;
  for (let s = 0; s < states.length; s++) {
    $('#countriesBody').append(`<div class="states" id="state${s}"></div>`);
    const el = $('#countriesBody div:last-child');
    const burgsCount = states[s].burgs;
    totalBurgs += burgsCount;
    // calculate user-friendly area and population
    const area = rn(states[s].area * Math.pow(distanceScale.value, 2));
    totalArea += area;
    areaConv = si(area) + unit;
    const urban = rn(states[s].urbanPopulation * urbanization.value * populationRate.value);
    const rural = rn(states[s].ruralPopulation * populationRate.value);
    const population = (urban + rural) * 1000;
    totalPopulation += population;
    const populationConv = si(population);
    const title = `'Total population: ${populationConv}; Rural population: ${rural}K; Urban population: ${urban}K'`;
    const neutral = states[s].color === 'neutral' || states[s].capital === 'neutral';
    // append elements to countriesBody
    if (!neutral) {
      el.append(`<input onmouseover="tip('Country color. Click to change')" class="stateColor" type="color" value="${states[s].color}"/>`);
      el.append(`<input onmouseover="tip('Country name. Click and type to change')" class="stateName" value="${states[s].name}" autocorrect="off" spellcheck="false"/>`);
      var capital = states[s].capital !== 'select' ? manors[states[s].capital].name : 'select';
      if (capital === 'select') {
        el.append(`<button onmouseover="tip('Click on map to select a capital or to create a new capital')" class="selectCapital" id="selectCapital${s}">★ select</button>`);
      } else {
        el.append('<span onmouseover="tip(\'Country capital. Click to enlange\')" class="icon-star-empty enlange"></span>');
        el.append(`<input onmouseover="tip('Capital name. Click and type to rename')" class="stateCapital" value="${capital}" autocorrect="off" spellcheck="false"/>`);
      }
      el.append('<span onmouseover="tip(\'Country expansionism (defines competitive size)\')" class="icon-resize-full hidden"></span>');
      el.append(`<input onmouseover="tip('Capital expansionism (defines competitive size)')" class="statePower hidden" type="number" min="0" max="99" step="0.1" value="${states[s].power}"/>`);
    } else {
      el.append('<input class="stateColor placeholder" disabled type="color"/>');
      el.append(`<input onmouseover="tip('Neutral burgs are united into this group. Click to change the group name')" class="stateName italic" id="stateName${s}" value="${states[s].name}" autocorrect="off" spellcheck="false"/>`);
      el.append('<span class="icon-star-empty placeholder"></span>');
      el.append('<input class="stateCapital placeholder"/>');
      el.append('<span class="icon-resize-full hidden placeholder"></span>');
      el.append('<input class="statePower hidden placeholder" value="0.0"/>');
    }
    el.append('<span onmouseover="tip(\'Cells count\')" class="icon-check-empty"></span>');
    el.append(`<div onmouseover="tip('Cells count')" class="stateCells">${states[s].cells}</div>`);
    el.append('<span onmouseover="tip(\'Burgs count. Click to see a full list\')" style="padding-right: 1px" class="stateBIcon icon-dot-circled"></span>');
    el.append(`<div onmouseover="tip('Burgs count. Click to see a full list')" class="stateBurgs">${burgsCount}</div>`);
    el.append(`<span onmouseover="tip('Country area: ${area + unit}')" style="padding-right: 4px" class="icon-map-o"></span>`);
    el.append(`<div onmouseover="tip('Country area: ${area + unit}')" class="stateArea">${areaConv}</div>`);
    el.append(`<span onmouseover="tip(${title})" class="icon-male"></span>`);
    el.append(`<input onmouseover="tip(${title})" class="statePopulation" value="${populationConv}">`);
    if (!neutral) {
      el.append('<span onmouseover="tip(\'Remove country, all assigned cells will become Neutral\')" class="icon-trash-empty"></span>');
      el.attr('data-country', states[s].name).attr('data-capital', capital).attr('data-expansion', states[s].power).attr('data-cells', states[s].cells)
        .attr('data-burgs', states[s].burgs)
        .attr('data-area', area)
        .attr('data-population', population);
    } else {
      el.attr('data-country', 'bottom').attr('data-capital', 'bottom').attr('data-expansion', 'bottom').attr('data-cells', states[s].cells)
        .attr('data-burgs', states[s].burgs)
        .attr('data-area', area)
        .attr('data-population', population);
    }
  }
  // initialize jQuery dialog
  if (!$('#countriesEditor').is(':visible')) {
    $('#countriesEditor').dialog({
      title: 'Countries Editor',
      minHeight: 'auto',
      minWidth: Math.min(svgWidth, 390),
      position: {
        my: 'right top',
        at: 'right-10 top+10',
        of: 'svg'
      }
    }).on('dialogclose', () => {
      if (customization === 2 || customization === 3) {
        $('#countriesManuallyCancel').click();
      }
    });
  }
  // restore customization Editor version
  if (customization === 3) {
    $('div[data-sortby=\'expansion\'],.statePower, .icon-resize-full').removeClass('hidden');
    $('div[data-sortby=\'cells\'],.stateCells, .icon-check-empty').addClass('hidden');
  } else {
    $('div[data-sortby=\'expansion\'],.statePower, .icon-resize-full').addClass('hidden');
    $('div[data-sortby=\'cells\'],.stateCells, .icon-check-empty').removeClass('hidden');
  }
  // populate total line on footer
  countriesFooterCountries.innerHTML = states.length;
  if (states[states.length - 1].capital === 'neutral') {
    countriesFooterCountries.innerHTML = states.length - 1;
  }
  countriesFooterBurgs.innerHTML = totalBurgs;
  countriesFooterArea.innerHTML = si(totalArea) + unit;
  countriesFooterPopulation.innerHTML = si(totalPopulation);
  // handle events
  $('#countriesBody .states').hover(focusOnState, unfocusState);
  $('.enlange').click(function () {
    const s = +(this.parentNode.id).slice(5);
    const capital = states[s].capital;
    const l = labels.select(`[data-id='${capital}']`);
    const x = +l.attr('x'),
      y = +l.attr('y');
    zoomTo(x, y, 8, 1600);
  });
  $('.stateName').on('input', function () {
    const s = +(this.parentNode.id).slice(5);
    states[s].name = this.value;
    labels.select(`#regionLabel${s}`).text(this.value);
    if ($('#burgsEditor').is(':visible')) {
      if ($('#burgsEditor').attr('data-state') == s) {
        const color = `<input title="Country color. Click to change" type="color" class="stateColor" value="${states[s].color}"/>`;
        $('div[aria-describedby=\'burgsEditor\'] .ui-dialog-title').text(`Burgs of ${this.value}`).prepend(color);
      }
    }
  });
  $('.states > .stateColor').on('change', function () {
    const s = +(this.parentNode.id).slice(5);
    states[s].color = this.value;
    regions.selectAll(`.region${s}`).attr('fill', this.value).attr('stroke', this.value);
    if ($('#burgsEditor').is(':visible')) {
      if ($('#burgsEditor').attr('data-state') == s) {
        $('.ui-dialog-title > .stateColor').val(this.value);
      }
    }
  });
  $('.stateCapital').on('input', function () {
    const s = +(this.parentNode.id).slice(5);
    const capital = states[s].capital;
    manors[capital].name = this.value;
    labels.select(`[data-id='${capital}']`).text(this.value);
    if ($('#burgsEditor').is(':visible')) {
      if ($('#burgsEditor').attr('data-state') == s) {
        $(`#burgs${capital} > .burgName`).val(this.value);
      }
    }
  }).hover(focusCapital, unfocus);
  $('.stateBurgs, .stateBIcon').on('click', editBurgs).hover(focusBurgs, unfocus);

  $('#countriesBody > .states').on('click', function () {
    if (customization === 2) {
      $('.selected').removeClass('selected');
      $(this).addClass('selected');
      const state = +$(this).attr('id').slice(5);
      let color = states[state].color;
      if (color === 'neutral') {
        color = 'white';
      }
      if (debug.selectAll('.circle').size()) {
        debug.selectAll('.circle').attr('stroke', color);
      }
    }
  });

  $('.selectCapital').on('click', function () {
    if ($(this).hasClass('pressed')) {
      $(this).removeClass('pressed');
      tooltip.setAttribute('data-main', '');
      restoreDefaultEvents();
    } else {
      $(this).addClass('pressed');
      viewbox.style('cursor', 'crosshair').on('click', selectCapital);
      tip('Click on the map to select or create a new capital', true);
    }
  });

  function selectCapital() {
    const point = d3.mouse(this);
    const index = getIndex(point);
    const x = rn(point[0], 2),
      y = rn(point[1], 2);

    if (cells[index].height < 20) {
      tip('Cannot place capital on the water! Select a land cell');
      return;
    }
    const state = +$('.selectCapital.pressed').attr('id').replace('selectCapital', '');
    let oldState = cells[index].region;
    if (oldState === 'neutral') {
      oldState = states.length - 1;
    }
    if (cells[index].manor !== undefined) {
      // cell has burg
      const burg = cells[index].manor;
      if (states[oldState].capital === burg) {
        tip('Existing capital cannot be selected as a new state capital! Select other cell');
        return;
      }
      // make this burg a new capital
      const urbanFactor = 0.9; // for old neutrals
      manors[burg].region = state;
      if (oldState === 'neutral') {
        manors[burg].population *= (1 / urbanFactor);
      }
      manors[burg].population *= 2; // give capital x2 population bonus
      states[state].capital = burg;
      moveBurgToGroup(burg, 'capitals');
    } else {
      // free cell -> create new burg for a capital
      const closest = cultureTree.find(x, y);
      const culture = cultureTree.data().indexOf(closest) || 0;
      const name = generateName(culture);
      const i = manors.length;
      cells[index].manor = i;
      states[state].capital = i;
      let score = cells[index].score;
      if (score <= 0) {
        score = rn(Math.random(), 2);
      }
      if (cells[index].crossroad) {
        score += cells[index].crossroad;
      } // crossroads
      if (cells[index].confluence) {
        score += Math.pow(cells[index].confluence, 0.3);
      } // confluences
      if (cells[index].port !== undefined) {
        score *= 3;
      } // port-capital
      const population = rn(score, 1);
      manors.push({
        i,
        cell: index,
        x,
        y,
        region: state,
        culture,
        name,
        population
      });
      burgIcons.select('#capitals').append('circle').attr('id', `burg${i}`).attr('data-id', i)
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 1)
        .on('click', editBurg);
      burgLabels.select('#capitals').append('text').attr('data-id', i).attr('x', x)
        .attr('y', y)
        .attr('dy', '-0.35em')
        .text(name)
        .on('click', editBurg);
    }
    cells[index].region = state;
    cells[index].neighbors.map((n) => {
      if (cells[n].height < 20) {
        return;
      }
      if (cells[n].manor !== undefined) {
        return;
      }
      cells[n].region = state;
    });
    redrawRegions();
    recalculateStateData(oldState); // re-calc old state data
    recalculateStateData(state); // calc new state data
    editCountries();
    restoreDefaultEvents();
  }

  $('.statePower').on('input', function () {
    const s = +(this.parentNode.id).slice(5);
    states[s].power = +this.value;
    regenerateCountries();
  });
  $('.statePopulation').on('change', function () {
    let s = +(this.parentNode.id).slice(5);
    const popOr = +$(this).parent().attr('data-population');
    const popNew = getInteger(this.value);
    if (!Number.isInteger(popNew) || popNew < 1000) {
      this.value = si(popOr);
      return;
    }
    const change = popNew / popOr;
    states[s].urbanPopulation = rn(states[s].urbanPopulation * change, 2);
    states[s].ruralPopulation = rn(states[s].ruralPopulation * change, 2);
    const urban = rn(states[s].urbanPopulation * urbanization.value * populationRate.value);
    const rural = rn(states[s].ruralPopulation * populationRate.value);
    const population = (urban + rural) * 1000;
    $(this).parent().attr('data-population', population);
    this.value = si(population);
    let total = 0;
    $('#countriesBody > div').each(function (e, i) {
      total += +$(this).attr('data-population');
    });
    countriesFooterPopulation.innerHTML = si(total);
    if (states[s].capital === 'neutral') {
      s = 'neutral';
    }
    manors.map((m) => {
      if (m.region !== s) {
        return;
      }
      m.population = rn(m.population * change, 2);
    });
  });
  // fully remove country
  $('#countriesBody .icon-trash-empty').on('click', function () {
    const s = +(this.parentNode.id).slice(5);
    alertMessage.innerHTML = 'Are you sure you want to remove the country? All lands and burgs will become neutral';
    $('#alert').dialog({
      resizable: false,
      title: 'Remove country',
      buttons: {
        Remove() {
          removeCountry(s);
          $(this).dialog('close');
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });

  function removeCountry(s) {
    const cellsCount = states[s].cells;
    const capital = +states[s].capital;
    if (!isNaN(capital)) {
      moveBurgToGroup(capital, 'towns');
    }
    states.splice(s, 1);
    states.map((s, i) => {
      s.i = i;
    });
    land.map((c) => {
      if (c.region === s) {
        c.region = 'neutral';
      } else if (c.region > s) {
        c.region -= 1;
      }
    });
    // do only if removed state had cells
    if (cellsCount) {
      manors.map((b) => {
        if (b.region === s) {
          b.region = 'neutral';
        }
      });
      // re-calculate neutral data
      const i = states.length;
      if (states[i - 1].capital !== 'neutral') {
        states.push({
          i,
          color: 'neutral',
          name: 'Neutrals',
          capital: 'neutral'
        });
      }
      recalculateStateData(i - 1); // re-calc data for neutrals
      redrawRegions();
    }
    editCountries();
  }

  $('#countriesNeutral, #countriesNeutralNumber').on('change', regenerateCountries);
}

// burgs list + editor
function editBurgs(context, s) {
  if (s === undefined) {
    s = +(this.parentNode.id).slice(5);
  }
  $('#burgsEditor').attr('data-state', s);
  $('#burgsBody').empty();
  $('#burgsHeader').children().removeClass('icon-sort-name-up icon-sort-name-down icon-sort-number-up icon-sort-number-down');
  const region = states[s].capital === 'neutral' ? 'neutral' : s;
  const burgs = $.grep(manors, (e) => (e.region === region));
  const populationArray = [];
  burgs.map((b) => {
    $('#burgsBody').append(`<div class="states" id="burgs${b.i}"></div>`);
    const el = $('#burgsBody div:last-child');
    el.append('<span title="Click to enlarge the burg" style="padding-right: 2px" class="enlarge icon-globe"></span>');
    el.append(`<input title="Burg name. Click and type to change" class="burgName" value="${b.name}" autocorrect="off" spellcheck="false"/>`);
    el.append('<span title="Burg culture" class="icon-book" style="padding-right: 2px"></span>');
    el.append(`<div title="Burg culture" class="burgCulture">${cultures[b.culture].name}</div>`);
    let population = b.population * urbanization.value * populationRate.value * 1000;
    populationArray.push(population);
    population = population > 1e4 ? si(population) : rn(population, -1);
    el.append('<span title="Population" class="icon-male"></span>');
    el.append(`<input title="Population. Input to change" class="burgPopulation" value="${population}"/>`);
    const capital = states[s].capital;
    let type = 'z-burg'; // usual burg by default
    if (b.i === capital) {
      el.append('<span title="Capital" class="icon-star-empty"></span>');
      type = 'c-capital';
    } else {
      el.append('<span class="icon-star-empty placeholder"></span>');
    }
    if (cells[b.cell].port !== undefined) {
      el.append('<span title="Port" class="icon-anchor small"></span>');
      if (type === 'c-capital') {
        type = 'a-capital-port';
      } else {
        type = 'p-port';
      }
    } else {
      el.append('<span class="icon-anchor placeholder"></span>');
    }
    if (b.i !== capital) {
      el.append('<span title="Remove burg" class="icon-trash-empty"></span>');
    }
    el.attr('data-burg', b.name).attr('data-culture', cultures[b.culture].name).attr('data-population', b.population).attr('data-type', type);
  });
  if (!$('#burgsEditor').is(':visible')) {
    $('#burgsEditor').dialog({
      title: `Burgs of ${states[s].name}`,
      minHeight: 'auto',
      width: 'auto',
      position: {
        my: 'right bottom',
        at: 'right-10 bottom-10',
        of: 'svg'
      }
    });
    const color = `<input title="Country color. Click to change" type="color" class="stateColor" value="${states[s].color}"/>`;
    if (region !== 'neutral') {
      $('div[aria-describedby=\'burgsEditor\'] .ui-dialog-title').prepend(color);
    }
  }
  // populate total line on footer
  burgsFooterBurgs.innerHTML = burgs.length;
  burgsFooterCulture.innerHTML = $('#burgsBody div:first-child .burgCulture').text();
  const avPop = rn(d3.mean(populationArray), -1);
  burgsFooterPopulation.value = avPop;
  $('.enlarge').click(function () {
    const b = +(this.parentNode.id).slice(5);
    const l = labels.select(`[data-id='${b}']`);
    const x = +l.attr('x'),
      y = +l.attr('y');
    zoomTo(x, y, 8, 1600);
  });

  $('#burgsBody > div').hover(focusBurg, unfocus);

  $('#burgsBody > div').click(function () {
    if (!$('#changeCapital').hasClass('pressed')) {
      return;
    }
    const s = +$('#burgsEditor').attr('data-state');
    const newCap = +$(this).attr('id').slice(5);
    const oldCap = +states[s].capital;
    if (newCap === oldCap) {
      tip('This burg is already a capital! Please select a different burg', null, 'error');
      return;
    }
    $('#changeCapital').removeClass('pressed');
    states[s].capital = newCap;
    if (!isNaN(oldCap)) {
      moveBurgToGroup(oldCap, 'towns');
    }
    recalculateStateData(s);
    moveBurgToGroup(newCap, 'capitals');
  });

  $('.burgName').on('input', function () {
    const b = +(this.parentNode.id).slice(5);
    manors[b].name = this.value;
    labels.select(`[data-id='${b}']`).text(this.value);
    if (b === s && $('#countriesEditor').is(':visible')) {
      $(`#state${s} > .stateCapital`).val(this.value);
    }
  });
  $('.ui-dialog-title > .stateColor').on('change', function () {
    states[s].color = this.value;
    regions.selectAll(`.region${s}`).attr('fill', this.value).attr('stroke', this.value);
    if ($('#countriesEditor').is(':visible')) {
      $(`#state${s} > .stateColor`).val(this.value);
    }
  });
  $('.burgPopulation').on('change', function () {
    const b = +(this.parentNode.id).slice(5);
    const pop = getInteger(this.value);
    if (!Number.isInteger(pop) || pop < 10) {
      const orig = rn(manors[b].population * urbanization.value * populationRate.value * 1000, 2);
      this.value = si(orig);
      return;
    }
    populationRaw = rn(pop / urbanization.value / populationRate.value / 1000, 2);
    const change = populationRaw - manors[b].population;
    manors[b].population = populationRaw;
    $(this).parent().attr('data-population', populationRaw);
    this.value = si(pop);
    let state = manors[b].region;
    if (state === 'neutral') {
      state = states.length - 1;
    }
    states[state].urbanPopulation += change;
    updateCountryPopulationUI(state);
    const average = states[state].urbanPopulation / states[state].burgs * urbanization.value * populationRate.value * 1000;
    burgsFooterPopulation.value = rn(average, -1);
  });
  $('#burgsFooterPopulation').on('change', function () {
    const state = +$('#burgsEditor').attr('data-state');
    const newPop = +this.value;
    const avPop = states[state].urbanPopulation / states[state].burgs * urbanization.value * populationRate.value * 1000;
    if (!Number.isInteger(newPop) || newPop < 10) {
      this.value = rn(avPop, -1);
      return;
    }
    const change = +this.value / avPop;
    $('#burgsBody > div').each(function (e, i) {
      const b = +(this.id).slice(5);
      const pop = rn(manors[b].population * change, 2);
      manors[b].population = pop;
      $(this).attr('data-population', pop);
      let popUI = pop * urbanization.value * populationRate.value * 1000;
      popUI = popUI > 1e4 ? si(popUI) : rn(popUI, -1);
      $(this).children().filter('.burgPopulation').val(popUI);
    });
    states[state].urbanPopulation = rn(states[state].urbanPopulation * change, 2);
    updateCountryPopulationUI(state);
  });
  $('#burgsBody .icon-trash-empty').on('click', function () {
    alertMessage.innerHTML = 'Are you sure you want to remove the burg?';
    const b = +(this.parentNode.id).slice(5);
    $('#alert').dialog({
      resizable: false,
      title: 'Remove burg',
      buttons: {
        Remove() {
          $(this).dialog('close');
          const state = +$('#burgsEditor').attr('data-state');
          $(`#burgs${b}`).remove();
          const cell = manors[b].cell;
          manors[b].region = 'removed';
          cells[cell].manor = undefined;
          states[state].burgs = states[state].burgs - 1;
          burgsFooterBurgs.innerHTML = states[state].burgs;
          countriesFooterBurgs.innerHTML = +countriesFooterBurgs.innerHTML - 1;
          states[state].urbanPopulation = states[state].urbanPopulation - manors[b].population;
          const avPop = states[state].urbanPopulation / states[state].burgs * urbanization.value * populationRate.value * 1000;
          burgsFooterPopulation.value = rn(avPop, -1);
          if ($('#countriesEditor').is(':visible')) {
            $(`#state${state} > .stateBurgs`).text(states[state].burgs);
          }
          labels.select(`[data-id='${b}']`).remove();
          icons.select(`[data-id='${b}']`).remove();
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });
}

// open editCultures dialog
function editCultures() {
  if (!cults.selectAll('path').size()) {
    $('#toggleCultures').click();
  }
  if (regions.style('display') !== 'none') {
    $('#toggleCountries').click();
  }
  layoutPreset.value = 'layoutCultural';
  $('#culturesBody').empty();
  $('#culturesHeader').children().removeClass('icon-sort-name-up icon-sort-name-down icon-sort-number-up icon-sort-number-down');

  // collect data
  const cellsC = [],
    areas = [],
    rurPops = [],
    urbPops = [];
  const unit = areaUnit.value === 'square' ? ` ${distanceUnit.value}²` : ` ${areaUnit.value}`;
  land.map((l) => {
    const c = l.culture;
    if (c === undefined) {
      return;
    }
    cellsC[c] = cellsC[c] ? cellsC[c] + 1 : 1;
    areas[c] = areas[c] ? areas[c] + l.area : l.area;
    rurPops[c] = rurPops[c] ? rurPops[c] + l.pop : l.pop;
  });

  manors.map((m) => {
    const c = m.culture;
    if (isNaN(c)) {
      return;
    }
    urbPops[c] = urbPops[c] ? urbPops[c] + m.population : m.population;
  });

  if (!nameBases[0]) {
    applyDefaultNamesData();
  }
  for (let c = 0; c < cultures.length; c++) {
    $('#culturesBody').append(`<div class="states cultures" id="culture${c}"></div>`);
    if (cellsC[c] === undefined) {
      cellsC[c] = 0;
      areas[c] = 0;
      rurPops[c] = 0;
    }
    if (urbPops[c] === undefined) {
      urbPops[c] = 0;
    }
    const area = rn(areas[c] * Math.pow(distanceScale.value, 2));
    const areaConv = si(area) + unit;
    const urban = rn(urbPops[c] * +urbanization.value * populationRate.value);
    const rural = rn(rurPops[c] * populationRate.value);
    const population = (urban + rural) * 1000;
    const populationConv = si(population);
    const title = `'Total population: ${populationConv}; Rural population: ${rural}K; Urban population: ${urban}K'`;
    let b = cultures[c].base;
    if (b >= nameBases.length) {
      b = 0;
    }
    const base = nameBases[b].name;
    const el = $('#culturesBody div:last-child');
    el.append(`<input onmouseover="tip('Culture color. Click to change')" class="stateColor" type="color" value="${cultures[c].color}"/>`);
    el.append(`<input onmouseover="tip('Culture name. Click and type to change')" class="cultureName" value="${cultures[c].name}" autocorrect="off" spellcheck="false"/>`);
    el.append('<span onmouseover="tip(\'Culture cells count\')" class="icon-check-empty"></span>');
    el.append(`<div onmouseover="tip('Culture cells count')" class="stateCells">${cellsC[c]}</div>`);
    el.append(`<span onmouseover="tip('Culture area: ${areaConv}')" style="padding-right: 4px" class="icon-map-o"></span>`);
    el.append(`<div onmouseover="tip('Culture area: ${areaConv}')" class="stateArea">${areaConv}</div>`);
    el.append(`<span onmouseover="tip(${title})" class="icon-male"></span>`);
    el.append(`<div onmouseover="tip(${title})" class="culturePopulation">${populationConv}</div>`);
    el.append('<span onmouseover="tip(\'Click to re-generate names for burgs with this culture assigned\')" class="icon-arrows-cw"></span>');
    el.append('<select onmouseover="tip(\'Culture namesbase. Click to change\')" class="cultureBase"></select>');
    if (cultures.length > 1) {
      el.append('<span onmouseover="tip(\'Remove culture. Remaining cultures will be recalculated\')" class="icon-trash-empty"></span>');
    }
    el.attr('data-color', cultures[c].color).attr('data-culture', cultures[c].name)
      .attr('data-cells', cellsC[c]).attr('data-area', area)
      .attr('data-population', population)
      .attr('data-base', base);
  }

  addCultureBaseOptions();
  drawCultureCenters();

  const activeCultures = cellsC.reduce((s, v) => {
    if (v) {
      return s + 1;
    }
    return s;
  }, 0);
  culturesFooterCultures.innerHTML = `${activeCultures}/${cultures.length}`;
  culturesFooterCells.innerHTML = land.length;
  let totalArea = areas.reduce((s, v) => s + v);
  totalArea = rn(totalArea * Math.pow(distanceScale.value, 2));
  culturesFooterArea.innerHTML = si(totalArea) + unit;
  let totalPopulation = rurPops.reduce((s, v) => s + v) * urbanization.value;
  totalPopulation += urbPops.reduce((s, v) => s + v);
  culturesFooterPopulation.innerHTML = si(totalPopulation * 1000 * populationRate.value);

  // initialize jQuery dialog
  if (!$('#culturesEditor').is(':visible')) {
    $('#culturesEditor').dialog({
      title: 'Cultures Editor',
      minHeight: 'auto',
      minWidth: Math.min(svgWidth, 336),
      position: {
        my: 'right top',
        at: 'right-10 top+10',
        of: 'svg'
      },
      close() {
        debug.select('#cultureCenters').selectAll('*').remove();
        exitCulturesManualAssignment();
      }
    });
  }

  $('.cultures').hover(function () {
    const c = +(this.id).slice(7);
    debug.select(`#cultureCenter${c}`).attr('stroke', '#000000e6');
  }, function () {
    const c = +(this.id).slice(7);
    debug.select(`#cultureCenter${c}`).attr('stroke', '#00000080');
  });

  $('.cultures').on('click', function () {
    if (customization !== 4) {
      return;
    }
    const c = +(this.id).slice(7);
    $('.selected').removeClass('selected');
    $(this).addClass('selected');
    const color = cultures[c].color;
    debug.selectAll('.circle').attr('stroke', color);
  });

  $('.cultures .stateColor').on('input', function () {
    const c = +(this.parentNode.id).slice(7);
    const old = cultures[c].color;
    cultures[c].color = this.value;
    debug.select(`#cultureCenter${c}`).attr('fill', this.value);
    cults.selectAll(`[fill="${old}"]`).attr('fill', this.value).attr('stroke', this.value);
  });

  $('.cultures .cultureName').on('input', function () {
    const c = +(this.parentNode.id).slice(7);
    cultures[c].name = this.value;
  });

  $('.cultures .icon-arrows-cw').on('click', function () {
    const c = +(this.parentNode.id).slice(7);
    manors.forEach((m) => {
      if (m.region === 'removed') {
        return;
      }
      if (m.culture !== c) {
        return;
      }
      m.name = generateName(c);
      labels.select(`[data-id='${m.i}']`).text(m.name);
    });
  });

  $('#culturesBody .icon-trash-empty').on('click', function () {
    const c = +(this.parentNode.id).slice(7);
    cultures.splice(c, 1);
    const centers = cultures.map((c) => c.center);
    cultureTree = d3.quadtree(centers);
    recalculateCultures('fullRedraw');
    editCultures();
  });

  if (modules.editCultures) {
    return;
  }
  modules.editCultures = true;

  function addCultureBaseOptions() {
    $('.cultureBase').each(function () {
      const c = +(this.parentNode.id).slice(7);
      for (let i = 0; i < nameBases.length; i++) {
        this.options.add(new Option(nameBases[i].name, i));
      }
      this.value = cultures[c].base;
      this.addEventListener('change', function () {
        cultures[c].base = +this.value;
      });
    });
  }

  function drawCultureCenters() {
    let cultureCenters = debug.select('#cultureCenters');
    if (cultureCenters.size()) {
      cultureCenters.selectAll('*').remove();
    } else {
      cultureCenters = debug.append('g').attr('id', 'cultureCenters');
    }
    for (let c = 0; c < cultures.length; c++) {
      cultureCenters.append('circle').attr('id', `cultureCenter${c}`)
        .attr('cx', cultures[c].center[0]).attr('cy', cultures[c].center[1])
        .attr('r', 6)
        .attr('stroke-width', 2)
        .attr('stroke', '#00000080')
        .attr('fill', cultures[c].color)
        .on('mousemove', cultureCenterTip)
        .on('mouseleave', () => {
          tip('', true);
        })
        .call(d3.drag().on('start', cultureCenterDrag));
    }
  }

  function cultureCenterTip() {
    tip('Drag to move culture center and re-calculate cultures', true);
  }

  function cultureCenterDrag() {
    const el = d3.select(this);
    const c = +this.id.slice(13);

    d3.event.on('drag', () => {
      const x = d3.event.x,
        y = d3.event.y;
      el.attr('cx', x).attr('cy', y);
      cultures[c].center = [x, y];
      const centers = cultures.map((c) => c.center);
      cultureTree = d3.quadtree(centers);
      recalculateCultures();
    });
  }

  $('#culturesPercentage').on('click', () => {
    const el = $('#culturesEditor');
    if (el.attr('data-type') === 'absolute') {
      el.attr('data-type', 'percentage');
      const totalCells = land.length;
      let totalArea = culturesFooterArea.innerHTML;
      totalArea = getInteger(totalArea.split(' ')[0]);
      const totalPopulation = getInteger(culturesFooterPopulation.innerHTML);
      $('#culturesBody > .cultures').each(function () {
        const cells = rn($(this).attr('data-cells') / totalCells * 100);
        const area = rn($(this).attr('data-area') / totalArea * 100);
        const population = rn($(this).attr('data-population') / totalPopulation * 100);
        $(this).children().filter('.stateCells').text(`${cells}%`);
        $(this).children().filter('.stateArea').text(`${area}%`);
        $(this).children().filter('.culturePopulation').text(`${population}%`);
      });
    } else {
      el.attr('data-type', 'absolute');
      editCultures();
    }
  });

  $('#culturesManually').on('click', () => {
    customization = 4;
    tip('Click to select a culture, drag the circle to re-assign', true);
    $('#culturesBottom').children().hide();
    $('#culturesManuallyButtons').show();
    viewbox.style('cursor', 'crosshair').call(drag).on('click', changeSelectedOnClick);
    debug.select('#cultureCenters').selectAll('*').remove();
  });

  $('#culturesManuallyComplete').on('click', () => {
    const changed = cults.selectAll('[data-culture]');
    changed.each(function () {
      const i = +(this.id).slice(4);
      const c = +this.getAttribute('data-culture');
      this.removeAttribute('data-culture');
      cells[i].culture = c;
      const manor = cells[i].manor;
      if (manor !== undefined) {
        manors[manor].culture = c;
      }
    });
    exitCulturesManualAssignment();
    if (changed.size()) {
      editCultures();
    }
  });

  $('#culturesManuallyCancel').on('click', () => {
    cults.selectAll('[data-culture]').each(function () {
      const i = +(this.id).slice(4);
      const c = cells[i].culture;
      this.removeAttribute('data-culture');
      const color = cultures[c].color;
      this.setAttribute('fill', color);
      this.setAttribute('stroke', color);
    });
    exitCulturesManualAssignment();
    drawCultureCenters();
  });

  function exitCulturesManualAssignment() {
    debug.selectAll('.circle').remove();
    $('#culturesBottom').children().show();
    $('#culturesManuallyButtons').hide();
    $('.selected').removeClass('selected');
    customization = 0;
    restoreDefaultEvents();
  }

  $('#culturesRandomize').on('click', () => {
    const centers = cultures.map((c) => {
      const x = Math.floor(Math.random() * graphWidth * 0.8 + graphWidth * 0.1);
      const y = Math.floor(Math.random() * graphHeight * 0.8 + graphHeight * 0.1);
      const center = [x, y];
      c.center = center;
      return center;
    });
    cultureTree = d3.quadtree(centers);
    recalculateCultures();
    drawCultureCenters();
    editCultures();
  });

  $('#culturesExport').on('click', () => {
    const unit = areaUnit.value === 'square' ? `${distanceUnit.value}2` : areaUnit.value;
    let data = `Culture,Cells,Area (${unit}),Population,Namesbase\n`; // headers
    $('#culturesBody > .cultures').each(function () {
      data += `${$(this).attr('data-culture')},`;
      data += `${$(this).attr('data-cells')},`;
      data += `${$(this).attr('data-area')},`;
      data += `${$(this).attr('data-population')},`;
      data += `${$(this).attr('data-base')}\n`;
    });

    const dataBlob = new Blob([data], {
      type: 'text/plain'
    });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    document.body.appendChild(link);
    link.download = `cultures_data${Date.now()}.csv`;
    link.href = url;
    link.click();
    window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 2000);
  });

  $('#culturesRegenerateNames').on('click', () => {
    manors.forEach((m) => {
      if (m.region === 'removed') {
        return;
      }
      const culture = m.culture;
      m.name = generateName(culture);
      labels.select(`[data-id='${m.i}']`).text(m.name);
    });
  });

  $('#culturesEditNamesBase').on('click', editNamesbase);

  $('#culturesAdd').on('click', () => {
    const x = Math.floor(Math.random() * graphWidth * 0.8 + graphWidth * 0.1);
    const y = Math.floor(Math.random() * graphHeight * 0.8 + graphHeight * 0.1);
    const center = [x, y];

    let culture,
      base,
      name,
      color;
    if (cultures.length < defaultCultures.length) {
      // add one of the default cultures
      culture = cultures.length;
      base = defaultCultures[culture].base;
      color = defaultCultures[culture].color;
      name = defaultCultures[culture].name;
    } else {
      // add random culture besed on one of the current ones
      culture = rand(cultures.length - 1);
      name = generateName(culture);
      color = colors20(cultures.length % 20);
      base = cultures[culture].base;
    }
    cultures.push({
      name,
      color,
      base,
      center
    });
    const centers = cultures.map((c) => c.center);
    cultureTree = d3.quadtree(centers);
    recalculateCultures();
    editCultures();
  });
}

// open editNamesbase dialog
function editNamesbase() {
  // update list of bases
  const select = document.getElementById('namesbaseSelect');
  for (let i = select.options.length; i < nameBases.length; i++) {
    const option = new Option(nameBases[i].name, i);
    select.options.add(option);
  }

  // restore previous state
  const textarea = document.getElementById('namesbaseTextarea');
  let selected = +textarea.getAttribute('data-base');
  if (selected >= nameBases.length) {
    selected = 0;
  }
  select.value = selected;
  if (textarea.value === '') {
    namesbaseUpdateInputs(selected);
  }
  const examples = document.getElementById('namesbaseExamples');
  if (examples.innerHTML === '') {
    namesbaseUpdateExamples(selected);
  }

  // open a dialog
  $('#namesbaseEditor').dialog({
    title: 'Namesbase Editor',
    minHeight: 'auto',
    minWidth: Math.min(svgWidth, 400),
    position: {
      my: 'center',
      at: 'center',
      of: 'svg'
    }
  });

  if (modules.editNamesbase) {
    return;
  }
  modules.editNamesbase = true;

  function namesbaseUpdateInputs(selected) {
    const textarea = document.getElementById('namesbaseTextarea');
    textarea.value = nameBase[selected].join(', ');
    textarea.setAttribute('data-base', selected);
    const name = document.getElementById('namesbaseName');
    const method = document.getElementById('namesbaseMethod');
    const min = document.getElementById('namesbaseMin');
    const max = document.getElementById('namesbaseMax');
    const dublication = document.getElementById('namesbaseDouble');
    name.value = nameBases[selected].name;
    method.value = nameBases[selected].method;
    min.value = nameBases[selected].min;
    max.value = nameBases[selected].max;
    dublication.value = nameBases[selected].d;
  }

  function namesbaseUpdateExamples(selected) {
    const examples = document.getElementById('namesbaseExamples');
    let text = '';
    for (let i = 0; i < 10; i++) {
      const name = generateName(false, selected);
      if (name === undefined) {
        text = 'Cannot generate examples. Please verify the data';
        break;
      }
      if (i !== 0) {
        text += ', ';
      }
      text += name;
    }
    examples.innerHTML = text;
  }

  $('#namesbaseSelect').on('change', function () {
    const selected = +this.value;
    namesbaseUpdateInputs(selected);
    namesbaseUpdateExamples(selected);
  });

  $('#namesbaseName').on('input', function () {
    const base = +textarea.getAttribute('data-base');
    const select = document.getElementById('namesbaseSelect');
    select.options[base].innerHTML = this.value;
    nameBases[base].name = this.value;
  });

  $('#namesbaseTextarea').on('input', function () {
    const base = +this.getAttribute('data-base');
    const data = textarea.value.replace(/ /g, '').split(',');
    nameBase[base] = data;
    if (data.length < 3) {
      chain[base] = [];
      const examples = document.getElementById('namesbaseExamples');
      examples.innerHTML = 'Please provide a correct source data';
      return;
    }
    const method = document.getElementById('namesbaseMethod').value;
    if (method !== 'selection') {
      chain[base] = calculateChain(base);
    }
  });

  $('#namesbaseMethod').on('change', function () {
    const base = +textarea.getAttribute('data-base');
    nameBases[base].method = this.value;
    if (this.value !== 'selection') {
      chain[base] = calculateChain(base);
    }
  });

  $('#namesbaseMin').on('change', function () {
    const base = +textarea.getAttribute('data-base');
    if (+this.value > nameBases[base].max) {
      tip('Minimal length cannot be greated that maximal');
    } else {
      nameBases[base].min = +this.value;
    }
  });

  $('#namesbaseMax').on('change', function () {
    const base = +textarea.getAttribute('data-base');
    if (+this.value < nameBases[base].min) {
      tip('Maximal length cannot be less than minimal');
    } else {
      nameBases[base].max = +this.value;
    }
  });

  $('#namesbaseDouble').on('change', function () {
    const base = +textarea.getAttribute('data-base');
    nameBases[base].d = this.value;
  });

  $('#namesbaseDefault').on('click', () => {
    alertMessage.innerHTML = `Are you sure you want to restore the default namesbase?
        All custom bases will be removed and default ones will be assigned to existing cultures.
        Meanwhile existing names will not be changed.`;
    $('#alert').dialog({
      resizable: false,
      title: 'Restore default data',
      buttons: {
        Restore() {
          $(this).dialog('close');
          $('#namesbaseEditor').dialog('close');
          const select = document.getElementById('namesbaseSelect');
          select.options.length = 0;
          document.getElementById('namesbaseTextarea').value = '';
          document.getElementById('namesbaseTextarea').setAttribute('data-base', 0);
          document.getElementById('namesbaseExamples').innerHTML === '';
          applyDefaultNamesData();
          const baseMax = nameBases.length - 1;
          cultures.forEach((c) => {
            if (c.base > baseMax) {
              c.base = baseMax;
            }
          });
          chains = {};
          calculateChains();
          editCultures();
          editNamesbase();
        },
        Cancel() {
          $(this).dialog('close');
        }
      }
    });
  });

  $('#namesbaseAdd').on('click', () => {
    const base = nameBases.length;
    const name = `Base${base}`;
    const method = document.getElementById('namesbaseMethod').value;
    const select = document.getElementById('namesbaseSelect');
    select.options.add(new Option(name, base));
    select.value = base;
    nameBases.push({
      name,
      method,
      min: 4,
      max: 10,
      d: '',
      m: 1
    });
    nameBase.push([]);
    document.getElementById('namesbaseName').value = name;
    const textarea = document.getElementById('namesbaseTextarea');
    textarea.value = '';
    textarea.setAttribute('data-base', base);
    document.getElementById('namesbaseExamples').innerHTML = '';
    chain[base] = [];
    editCultures();
  });

  $('#namesbaseExamples, #namesbaseUpdateExamples').on('click', () => {
    const select = document.getElementById('namesbaseSelect');
    namesbaseUpdateExamples(+select.value);
  });

  $('#namesbaseDownload').on('click', () => {
    const nameBaseString = `${JSON.stringify(nameBase)}\r\n`;
    const nameBasesString = JSON.stringify(nameBases);
    const dataBlob = new Blob([nameBaseString + nameBasesString], {
      type: 'text/plain'
    });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `namebase${Date.now()}.txt`;
    link.href = url;
    link.click();
  });

  $('#namesbaseUpload').on('click', () => {
    namesbaseToLoad.click();
  });
  $('#namesbaseToLoad').change(function () {
    const fileToLoad = this.files[0];
    this.value = '';
    const fileReader = new FileReader();
    fileReader.onload = function (fileLoadedEvent) {
      const dataLoaded = fileLoadedEvent.target.result;
      const data = dataLoaded.split('\r\n');
      if (data[0] && data[1]) {
        nameBase = JSON.parse(data[0]);
        nameBases = JSON.parse(data[1]);
        const select = document.getElementById('namesbaseSelect');
        select.options.length = 0;
        document.getElementById('namesbaseTextarea').value = '';
        document.getElementById('namesbaseTextarea').setAttribute('data-base', 0);
        document.getElementById('namesbaseExamples').innerHTML === '';
        const baseMax = nameBases.length - 1;
        cultures.forEach((c) => {
          if (c.base > baseMax) {
            c.base = baseMax;
          }
        });
        chains = {};
        calculateChains();
        editCultures();
        editNamesbase();
      } else {
        tip('Cannot load a namesbase. Please check the data format');
      }
    };
    fileReader.readAsText(fileToLoad, 'UTF-8');
  });
}

// open editLegends dialog
function editLegends(id, name) {
  // update list of objects
  const select = document.getElementById('legendSelect');
  for (let i = select.options.length; i < notes.length; i++) {
    const option = new Option(notes[i].id, notes[i].id);
    select.options.add(option);
  }

  // select an object
  if (id) {
    let note = notes.find((note) => note.id === id);
    if (note === undefined) {
      if (!name) {
        name = id;
      }
      note = {
        id,
        name,
        legend: ''
      };
      notes.push(note);
      const option = new Option(id, id);
      select.options.add(option);
    }
    select.value = id;
    legendName.value = note.name;
    legendText.value = note.legend;
  }

  // open a dialog
  $('#legendEditor').dialog({
    title: 'Legends Editor',
    minHeight: 'auto',
    minWidth: Math.min(svgWidth, 400),
    position: {
      my: 'center',
      at: 'center',
      of: 'svg'
    }
  });

  if (modules.editLegends) {
    return;
  }
  modules.editLegends = true;

  // select another object
  document.getElementById('legendSelect').addEventListener('change', function () {
    const note = notes.find((note) => note.id === this.value);
    legendName.value = note.name;
    legendText.value = note.legend;
  });

  // change note name on input
  document.getElementById('legendName').addEventListener('input', function () {
    const select = document.getElementById('legendSelect');
    const id = select.value;
    const note = notes.find((note) => note.id === id);
    note.name = this.value;
  });

  // change note text on input
  document.getElementById('legendText').addEventListener('input', function () {
    const select = document.getElementById('legendSelect');
    const id = select.value;
    const note = notes.find((note) => note.id === id);
    note.legend = this.value;
  });

  // hightlight DOM element
  document.getElementById('legendFocus').addEventListener('click', () => {
    const select = document.getElementById('legendSelect');
    const element = document.getElementById(select.value);

    // if element is not found
    if (element === null) {
      const message = 'Related element is not found. Would you like to remove the note (legend item)?';
      alertMessage.innerHTML = message;
      $('#alert').dialog({
        resizable: false,
        title: 'Element not found',
        buttons: {
          Remove() {
            $(this).dialog('close');
            removeLegend();
          },
          Keep() {
            $(this).dialog('close');
          }
        }
      });
      return;
    }

    // if element is found
    highlightElement(element);
  });

  function highlightElement(element) {
    if (debug.select('.highlighted').size()) {
      return;
    } // allow only 1 highlight element simultaniosly
    const box = element.getBBox();
    const transform = element.getAttribute('transform') || null;
    const t = d3.transition().duration(1000).ease(d3.easeBounceOut);
    const r = d3.transition().duration(500).ease(d3.easeLinear);
    const highlight = debug.append('rect').attr('x', box.x).attr('y', box.y).attr('width', box.width)
      .attr('height', box.height)
      .attr('transform', transform);
    highlight.classed('highlighted', 1)
      .transition(t).style('outline-offset', '0px')
      .transition(r)
      .style('outline-color', 'transparent')
      .remove();
    const tr = parseTransform(transform);
    let x = box.x + box.width / 2;
    if (tr[0]) {
      x += tr[0];
    }
    let y = box.y + box.height / 2;
    if (tr[1]) {
      y += tr[1];
    }
    if (scale >= 2) {
      zoomTo(x, y, scale, 1600);
    }
  }

  // download legends object as text file
  document.getElementById('legendDownload').addEventListener('click', () => {
    const legendString = JSON.stringify(notes);
    const dataBlob = new Blob([legendString], {
      type: 'text/plain'
    });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `legends${Date.now()}.txt`;
    link.href = url;
    link.click();
  });

  // upload legends object as text file and parse to json
  document.getElementById('legendUpload').addEventListener('click', () => {
    document.getElementById('lagendsToLoad').click();
  });
  document.getElementById('lagendsToLoad').addEventListener('change', function () {
    const fileToLoad = this.files[0];
    this.value = '';
    const fileReader = new FileReader();
    fileReader.onload = function (fileLoadedEvent) {
      const dataLoaded = fileLoadedEvent.target.result;
      if (dataLoaded) {
        notes = JSON.parse(dataLoaded);
        const select = document.getElementById('legendSelect');
        select.options.length = 0;
        editLegends(notes[0].id, notes[0].name);
      } else {
        tip('Cannot load a file. Please check the data format');
      }
    };
    fileReader.readAsText(fileToLoad, 'UTF-8');
  });

  // remove the legend item
  document.getElementById('legendRemove').addEventListener('click', () => {
    alertMessage.innerHTML = 'Are you sure you want to remove the selected legend?';
    $('#alert').dialog({
      resizable: false,
      title: 'Remove legend element',
      buttons: {
        Remove() {
          $(this).dialog('close');
          removeLegend();
        },
        Keep() {
          $(this).dialog('close');
        }
      }
    });
  });

  function removeLegend() {
    const select = document.getElementById('legendSelect');
    const index = notes.findIndex((n) => n.id === select.value);
    notes.splice(index, 1);
    select.options.length = 0;
    if (notes.length === 0) {
      $('#legendEditor').dialog('close');
      return;
    }
    editLegends(notes[0].id, notes[0].name);
  }
}

// change svg size on manual size change or window resize, do not change graph size
function changeMapSize() {
  fitScaleBar();
  svgWidth = +mapWidthInput.value;
  svgHeight = +mapHeightInput.value;
  svg.attr('width', svgWidth).attr('height', svgHeight);
  const width = Math.max(svgWidth, graphWidth);
  const height = Math.max(svgHeight, graphHeight);
  zoom.translateExtent([
    [0, 0],
    [width, height]
  ]);
  svg.select('#ocean').selectAll('rect').attr('x', 0)
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height);
}

// Map scale and measurements editor
function editScale() {
  $('#ruler').fadeIn();
  $('#scaleEditor').dialog({
    title: 'Scale Editor',
    minHeight: 'auto',
    width: 'auto',
    resizable: false,
    position: {
      my: 'center bottom',
      at: 'center bottom-10',
      of: 'svg'
    }
  });
}

export {
  changeMapSize,
  editBurg,
  editBurgs,
  editCountries,
  editCultures,
  editHeightmap,
  editIcon,
  editLabel,
  editLegends,
  editMarker,
  editNamesbase,
  editRiver,
  editRoute,
  editScale
};
