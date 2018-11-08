import * as d3 from 'd3';

function dragged(e) {
  const el = d3.select(this);
  const x = d3.event.x;
  const y = d3.event.y;
  el.raise().classed('drag', true);
  if (el.attr('x')) {
    el.attr('x', x).attr('y', y + 0.8);
    const matrix = el.attr('transform');
    if (matrix) {
      const angle = matrix.split('(')[1].split(')')[0].split(' ')[0];
      const bbox = el.node().getBBox();
      const rotate = `rotate(${angle} ${bbox.x + bbox.width / 2} ${bbox.y + bbox.height / 2})`;
      el.attr('transform', rotate);
    }
  } else {
    el.attr('cx', x).attr('cy', y);
  }
}

function dragended(d) {
  d3.select(this).classed('drag', false);
}

// Pull request from @evyatron
// https://github.com/Azgaar/Fantasy-Map-Generator/pull/49
function addDragToUpload() {
  document.addEventListener('dragover', (e) => {
    e.stopPropagation();
    e.preventDefault();
    $('#map-dragged').show();
  });

  document.addEventListener('dragleave', (e) => {
    $('#map-dragged').hide();
  });

  document.addEventListener('drop', (e) => {
    e.stopPropagation();
    e.preventDefault();
    $('#map-dragged').hide();
    // no files or more than one
    if (e.dataTransfer.items == null || e.dataTransfer.items.length != 1) {
      return;
    }
    const file = e.dataTransfer.items[0].getAsFile();
    // not a .map file
    if (file.name.indexOf('.map') == -1) {
      alertMessage.innerHTML = 'Please upload a <b>.map</b> file you have previously downloaded';
      $('#alert').dialog({
        resizable: false,
        title: 'Invalid file format',
        width: 400,
        buttons: {
          Close() {
            $(this).dialog('close');
          }
        },
        position: {
          my: 'center',
          at: 'center',
          of: 'svg'
        }
      });
      return;
    }
    // all good - show uploading text and load the map
    $('#map-dragged > p').text('Uploading<span>.</span><span>.</span><span>.</span>');
    uploadFile(file, () => {
      $('#map-dragged > p').text('Drop to upload');
    });
  });
}

function opisometerEdgeDrag() {
  const el = d3.select(this);
  const x0 = +el.attr('cx'),
    y0 = +el.attr('cy');
  const group = d3.select(this.parentNode);
  const curve = group.select('.white');
  const curveGray = group.select('.gray');
  const text = group.select('text');
  const points = JSON.parse(text.attr('data-points'));
  if (x0 === points[0].scX && y0 === points[0].scY) {
    points.reverse();
  }

  d3.event.on('drag', () => {
    const x = d3.event.x,
      y = d3.event.y;
    el.attr('cx', x).attr('cy', y);
    const l = points[points.length - 1];
    const diff = Math.hypot(l.scX - x, l.scY - y);
    if (diff > 5) {
      points.push({
        scX: x,
        scY: y
      });
    } else {
      return;
    }
    lineGen.curve(d3.curveBasis);
    const d = round(lineGen(points));
    curve.attr('d', d);
    curveGray.attr('d', d);
    const dist = rn(curve.node().getTotalLength());
    const label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
    text.attr('x', x).attr('y', y).text(label);
  });

  d3.event.on('end', () => {
    const dist = rn(curve.node().getTotalLength());
    const c = curve.node().getPointAtLength(dist / 2);
    const p = curve.node().getPointAtLength((dist / 2) - 1);
    const label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
    const atan = p.x > c.x ? Math.atan2(p.y - c.y, p.x - c.x) : Math.atan2(c.y - p.y, c.x - p.x);
    const angle = rn(atan * 180 / Math.PI, 3);
    const tr = `rotate(${angle} ${c.x} ${c.y})`;
    text.attr('data-points', JSON.stringify(points)).attr('data-dist', dist).attr('x', c.x).attr('y', c.y)
      .attr('transform', tr)
      .text(label);
  });
}

// Drag actions
function dragstarted() {
  const x0 = d3.event.x;
  const y0 = d3.event.y;
  const c0 = diagram.find(x0, y0).index;
  let points = '';
  let curve = '';
  let text = '';
  let curveGray = '';
  let c1 = c0;
  let x1;
  let y1;
  const opisometer = $('#addOpisometer').hasClass('pressed');
  const planimeter = $('#addPlanimeter').hasClass('pressed');
  const factor = rn(1 / Math.pow(scale, 0.3), 1);

  if (opisometer || planimeter) {
    $('#ruler').show();
    const type = opisometer ? 'opisometer' : 'planimeter';
    const rulerNew = ruler
      .append('g')
      .attr('class', type)
      .call(d3.drag().on('start', elementDrag));
    points = [{
      scX: rn(x0, 2),
      scY: rn(y0, 2)
    }];
    if (opisometer) {
      curve = rulerNew
        .append('path')
        .attr('class', 'opisometer white')
        .attr('stroke-width', factor);
      const dash = rn(30 / distanceScale.value, 2);
      curveGray = rulerNew
        .append('path')
        .attr('class', 'opisometer gray')
        .attr('stroke-dasharray', dash)
        .attr('stroke-width', factor);
    } else {
      curve = rulerNew
        .append('path')
        .attr('class', 'planimeter')
        .attr('stroke-width', factor);
    }
    text = rulerNew
      .append('text')
      .attr('dy', -1)
      .attr('font-size', 10 * factor);
  }

  d3.event.on('drag', () => {
    x1 = d3.event.x, y1 = d3.event.y; // eslint-disable-line
    const c2 = diagram.find(x1, y1).index;

    // Heightmap customization
    if (customization === 1) {
      if (c2 === c1 && x1 !== x0 && y1 !== y0) {
        return;
      }
      c1 = c2;
      const brush = $('#brushesButtons > .pressed');
      const id = brush.attr('id');
      const power = +brushPower.value;
      if (id === 'brushHill') {
        add(c2, 'hill', power);
        Update.heightmap();
      }
      if (id === 'brushPit') {
        addPit(1, power, c2);
        Update.heightmap();
      }
      if (id !== 'brushRange' || id !== 'brushTrough') {
        // move a circle to show approximate change radius
        moveCircle(x1, y1);
        Update.cellsInRadius(c2, c0);
      }
    }

    // Countries / cultures manuall assignment
    if (customization === 2 || customization === 4) {
      if ($('div.selected').length === 0) {
        return;
      }
      if (c2 === c1) {
        return;
      }
      c1 = c2;
      const radius = customization === 2 ?
        +countriesManuallyBrush.value :
        +culturesManuallyBrush.value;
      const r = rn((6 / graphSize) * radius, 1);
      moveCircle(x1, y1, r);
      const selection = defineBrushSelection(c2, radius);
      if (selection) {
        if (customization === 2) {
          changeStateForSelection(selection);
        }
        if (customization === 4) {
          changeCultureForSelection(selection);
        }
      }
    }

    if (opisometer || planimeter) {
      const l = points[points.length - 1];
      const diff = Math.hypot(l.scX - x1, l.scY - y1);
      const d = U.round(lineGen(points));
      if (diff > 5) {
        points.push({
          scX: x1,
          scY: y1
        });
      }
      if (opisometer) {
        lineGen.curve(d3.curveBasis);
        curve.attr('d', d);
        curveGray.attr('d', d);
        const dist = rn(curve.node().getTotalLength());
        const label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
        text.attr('x', x1).attr('y', y1 - 10).text(label);
      } else {
        lineGen.curve(d3.curveBasisClosed);
        curve.attr('d', d);
      }
    }
  });

  d3.event.on('end', () => {
    if (customization === 1) {
      Update.history();
    }
    if (opisometer || planimeter) {
      $('#addOpisometer, #addPlanimeter').removeClass('pressed');
      restoreDefaultEvents();
      if (opisometer) {
        const dist = rn(curve.node().getTotalLength());
        const c = curve.node().getPointAtLength(dist / 2);
        const p = curve.node().getPointAtLength((dist / 2) - 1);
        const label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
        const atan = p.x > c.x ?
          Math.atan2(p.y - c.y, p.x - c.x) :
          Math.atan2(c.y - p.y, c.x - p.x);
        const angle = rn(atan * (180 / Math.PI), 3);
        const tr = `rotate(${angle} ${c.x} ${c.y})`;
        text
          .attr('data-points', JSON.stringify(points))
          .attr('data-dist', dist).attr('x', c.x).attr('y', c.y)
          .attr('transform', tr)
          .text(label)
          .on('click', removeParent);
        rulerNew.append('circle')
          .attr('cx', points[0].scX).attr('cy', points[0].scY).attr('r', 2 * factor)
          .attr('stroke-width', 0.5 * factor)
          .attr('data-edge', 'start')
          .call(d3.drag().on('start', opisometerEdgeDrag));
        rulerNew.append('circle')
          .attr('cx', points[points.length - 1].scX)
          .attr('cy', points[points.length - 1].scY)
          .attr('r', 2 * factor)
          .attr('stroke-width', 0.5 * factor)
          .attr('data-edge', 'end')
          .call(d3.drag().on('start', opisometerEdgeDrag));
      } else {
        const vertices = points.map((p) => [p.scX, p.scY]);
        const area = rn(Math.abs(d3.polygonArea(vertices))); // initial area as positive integer
        let areaConv = area * Math.pow(distanceScale.value, 2); // convert area to distanceScale
        areaConv = U.si(areaConv);
        if (areaUnit.value === 'square') {
          areaConv += ` ${distanceUnit.value}²`;
        } else {
          areaConv += ` ${areaUnit.value}`;
        }
        const c = polylabel([vertices], 1.0); // pole of inaccessibility
        text.attr('x', rn(c[0], 2)).attr('y', rn(c[1], 2)).attr('data-area', area).text(areaConv)
          .on('click', removeParent);
      }
    }
  });
}

const drag = d3.drag()
  .container(() => this)
  .subject(() => {
    const p = [d3.event.x, d3.event.y];
    return [p, p];
  })
  .on('start', dragstarted);

// draw ruler center point to split ruler into 2 parts
function rulerCenterDrag() {
  let xc1,
    yc1,
    xc2,
    yc2;
  const group = d3.select(this.parentNode); // current ruler group
  let x = d3.event.x,
    y = d3.event.y; // current coords
  const line = group.selectAll('line'); // current lines
  const x1 = +line.attr('x1'),
    y1 = +line.attr('y1'),
    x2 = +line.attr('x2'),
    y2 = +line.attr('y2'); // initial line edge points
  const rulerNew = ruler.insert('g', ':first-child');
  rulerNew.attr('transform', group.attr('transform')).call(d3.drag().on('start', elementDrag));
  const factor = rn(1 / Math.pow(scale, 0.3), 1);
  rulerNew.append('line').attr('class', 'white').attr('stroke-width', factor);
  const dash = +group.select('.gray').attr('stroke-dasharray');
  rulerNew.append('line').attr('class', 'gray').attr('stroke-dasharray', dash).attr('stroke-width', factor);
  rulerNew.append('text').attr('dy', -1).on('click', removeParent).attr('font-size', 10 * factor)
    .attr('stroke-width', factor);

  d3.event.on('drag', function () {
    x = d3.event.x, y = d3.event.y;
    d3.select(this).attr('cx', x).attr('cy', y);
    // change first part
    line.attr('x1', x1).attr('y1', y1).attr('x2', x).attr('y2', y);
    let dist = rn(Math.hypot(x1 - x, y1 - y));
    let label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
    let atan = x1 > x ? Math.atan2(y1 - y, x1 - x) : Math.atan2(y - y1, x - x1);
    xc1 = rn((x + x1) / 2, 2), yc1 = rn((y + y1) / 2, 2);
    let tr = `rotate(${rn(atan * 180 / Math.PI, 3)} ${xc1} ${yc1})`;
    group.select('text').attr('x', xc1).attr('y', yc1).attr('transform', tr)
      .attr('data-dist', dist)
      .text(label);
    // change second (new) part
    dist = rn(Math.hypot(x2 - x, y2 - y));
    label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
    atan = x2 > x ? Math.atan2(y2 - y, x2 - x) : Math.atan2(y - y2, x - x2);
    xc2 = rn((x + x2) / 2, 2), yc2 = rn((y + y2) / 2, 2);
    tr = `rotate(${rn(atan * 180 / Math.PI, 3)} ${xc2} ${yc2})`;
    rulerNew.selectAll('line').attr('x1', x).attr('y1', y).attr('x2', x2)
      .attr('y2', y2);
    rulerNew.select('text').attr('x', xc2).attr('y', yc2).attr('transform', tr)
      .attr('data-dist', dist)
      .text(label);
  });

  d3.event.on('end', () => {
    // circles for 1st part
    group.selectAll('circle').remove();
    group.append('circle').attr('cx', x1).attr('cy', y1).attr('r', 2 * factor)
      .attr('stroke-width', 0.5 * factor)
      .attr('data-edge', 'left')
      .call(d3.drag().on('drag', rulerEdgeDrag));
    group.append('circle').attr('cx', x).attr('cy', y).attr('r', 2 * factor)
      .attr('stroke-width', 0.5 * factor)
      .attr('data-edge', 'rigth')
      .call(d3.drag().on('drag', rulerEdgeDrag));
    group.append('circle').attr('cx', xc1).attr('cy', yc1).attr('r', 1.2 * factor)
      .attr('stroke-width', 0.3 * factor)
      .attr('class', 'center')
      .call(d3.drag().on('start', rulerCenterDrag));
    // circles for 2nd part
    rulerNew.append('circle').attr('cx', x).attr('cy', y).attr('r', 2 * factor)
      .attr('stroke-width', 0.5 * factor)
      .attr('data-edge', 'left')
      .call(d3.drag().on('drag', rulerEdgeDrag));
    rulerNew.append('circle').attr('cx', x2).attr('cy', y2).attr('r', 2 * factor)
      .attr('stroke-width', 0.5 * factor)
      .attr('data-edge', 'rigth')
      .call(d3.drag().on('drag', rulerEdgeDrag));
    rulerNew.append('circle').attr('cx', xc2).attr('cy', yc2).attr('r', 1.2 * factor)
      .attr('stroke-width', 0.3 * factor)
      .attr('class', 'center')
      .call(d3.drag().on('start', rulerCenterDrag));
  });
}

export {
  dragged,
  dragended,
  addDragToUpload,
  opisometerEdgeDrag,
  dragstarted,
  drag,
  rulerCenterDrag
};
