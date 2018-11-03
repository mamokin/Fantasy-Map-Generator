import $ from 'jquery';
import * as d3 from 'd3';
import * as C from './Const';
import * as Toggle from './Toggles';

// TODO: STORE IN STATE
// apply default names data
function applyDefaultNamesData() {
  const nameBase = C.nameBase;
  const nameBases = C.nameBases;
  const defaultCultures = C.defaultCultures;
  return {nameBase, nameBases, defaultCultures};
}
// apply names data from localStorage if available
function applyNamesData() {
  applyDefaultNamesData();
}

// round value to d decimals
function rn(v, d) {
  d = d || 0;
  const m = Math.pow(10, d);
  return Math.round(v * m) / m;
}

// convert RGB color string to HEX without #
function toHEX(rgb) {
  if (rgb.charAt(0) === '#') {
    return rgb;
  }
  rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
  return (rgb && rgb.length === 4) ? `#${
    (`0${parseInt(rgb[1], 10).toString(16)}`).slice(-2)
  }${(`0${parseInt(rgb[2], 10).toString(16)}`).slice(-2)
  }${(`0${parseInt(rgb[3], 10).toString(16)}`).slice(-2)}` : '';
}

// random number in a range
function rand(min, max) {
  if (min === undefined && !max === undefined) {
    return Math.random();
  }
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// round string to d decimals
function round(s, d) {
  d = d || 1;
  return s.replace(/[\d\.-][\d\.e-]*/g, (n) => rn(n, d));
}

// corvent number to short string with SI postfix
function si(n) {
  if (n >= 1e9) {
    return `${rn(n / 1e9, 1)}B`;
  }
  if (n >= 1e8) {
    return `${rn(n / 1e6)}M`;
  }
  if (n >= 1e6) {
    return `${rn(n / 1e6, 1)}M`;
  }
  if (n >= 1e4) {
    return `${rn(n / 1e3)}K`;
  }
  if (n >= 1e3) {
    return `${rn(n / 1e3, 1)}K`;
  }
  return rn(n);
}

// getInteger number from user input data
function getInteger(value) {
  const metric = value.slice(-1);
  if (metric === 'K') {
    return parseInt(value.slice(0, -1) * 1e3);
  }
  if (metric === 'M') {
    return parseInt(value.slice(0, -1) * 1e6);
  }
  if (metric === 'B') {
    return parseInt(value.slice(0, -1) * 1e9);
  }
  return parseInt(value);
}

// downalod map as SVG or PNG file
function saveAsImage(type) {
  console.time('saveAsImage');
  const webSafe = [
    'Georgia', 'Times+New+Roman', 'Comic+Sans+MS', 'Lucida+Sans+Unicode', 'Courier+New', 'Verdana',
    'Arial', 'Impact'
  ];
  // get non-standard fonts used for labels to fetch them from web
  const fontsInUse = []; // to store fonts currently in use
  C.labels.selectAll('g').each(() => {
    const font = d3.select(this).attr('data-font');
    if (!font) {
      return;
    }
    if (webSafe.indexOf(font) !== -1) {
      return;
    } // do not fetch web-safe fonts
    if (fontsInUse.indexOf(font) === -1) {
      fontsInUse.push(font);
    }
  });
  const fontsToLoad = `https://fonts.googleapis.com/css?family=${fontsInUse.join('|')}`;

  // clone svg
  const cloneEl = document.getElementsByTagName('svg')[0].cloneNode(true);
  cloneEl.id = 'fantasyMap';
  document.getElementsByTagName('body')[0].appendChild(cloneEl);
  const clone = d3.select('#fantasyMap');

  // rteset transform for svg
  if (type === 'svg') {
    clone.attr('width', C.graphWidth).attr('height', C.graphHeight);
    clone.select('#viewbox').attr('transform', null);
    if (C.svgWidth !== C.graphWidth || C.svgHeight !== C.graphHeight) {
      // move scale bar to right bottom corner
      const el = clone.select('#scaleBar');
      if (!el.size()) {
        return;
      }
      const bbox = el.select('rect').node().getBBox();
      const tr = [C.graphWidth - bbox.width, C.graphHeight - (bbox.height - 10)];
      el.attr('transform', `translate(${rn(tr[0])},${rn(tr[1])})`);
    }

    // to fix use elements sizing
    clone.selectAll('use').each(function () {
      const size = this.parentNode.getAttribute('size') || 1;
      this.setAttribute('width', `${size}px`);
      this.setAttribute('height', `${size}px`);
    });

    // clean attributes
    // clone.selectAll("*").each(function() {
    //  const attributes = this.attributes;
    //  for (let i = 0; i < attributes.length; i++) {
    //    const attr = attributes[i];
    //    if (attr.value === "" || attr.name.includes("data")) {
    //      this.removeAttribute(attr.name);
    //    }
    //  }
    // });
  }

  // for each g element get inline style
  const emptyG = clone.append('g').node();
  const defaultStyles = window.getComputedStyle(emptyG);

  // show hidden labels but in reduced size
  clone.select('#labels').selectAll('.hidden').each(function (e) {
    const size = d3.select(this).attr('font-size');
    d3.select(this).classed('hidden', false).attr('font-size', rn(size * 0.4, 2));
  });

  // save group css to style attribute
  clone.selectAll('g, #ruler > g > *, #scaleBar > text').each(function (d) {
    const compStyle = window.getComputedStyle(this);
    let style = '';
    for (let i = 0; i < compStyle.length; i++) {
      const key = compStyle[i];
      const value = compStyle.getPropertyValue(key);
      // Firefox mask hack
      if (key === 'mask-image' && value !== defaultStyles.getPropertyValue(key)) {
        style += 'mask-image: url(\'#shape\');';
        continue;
      }
      if (key === 'cursor') {
        continue;
      } // cursor should be default
      if (this.hasAttribute(key)) {
        continue;
      } // don't add style if there is the same attribute
      if (value === defaultStyles.getPropertyValue(key)) {
        continue;
      }
      style += `${key}:${value};`;
    }
    if (style != '') {
      this.setAttribute('style', style);
    }
  });
  emptyG.remove();

  // load fonts as dataURI so they will be available in downloaded svg/png
  GFontToDataURI(fontsToLoad).then((cssRules) => {
    clone.select('defs').append('style').text(cssRules.join('\n'));
    const svg_xml = (new XMLSerializer()).serializeToString(clone.node());
    clone.remove();
    const blob = new Blob([svg_xml], {
      type: 'image/svg+xml;charset=utf-8'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.target = '_blank';
    if (type === 'png') {
      const ratio = svgHeight / svgWidth;
      canvas.width = svgWidth * pngResolutionInput.value;
      canvas.height = svgHeight * pngResolutionInput.value;
      const img = new Image();
      img.src = url;
      img.onload = function () {
        window.URL.revokeObjectURL(url);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        link.download = `fantasy_map_${Date.now()}.png`;
        canvas.toBlob((blob) => {
          link.href = window.URL.createObjectURL(blob);
          document.body.appendChild(link);
          link.click();
          window.setTimeout(() => {
            window.URL.revokeObjectURL(link.href);
          }, 5000);
        });
        canvas.style.opacity = 0;
        canvas.width = svgWidth;
        canvas.height = svgHeight;
      };
    } else {
      link.download = `fantasy_map_${Date.now()}.svg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
    }
    console.timeEnd('saveAsImage');
    window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 5000);
  });
}

// Code from Kaiido's answer:
// https://stackoverflow.com/questions/42402584/how-to-use-google-fonts-in-canvas-when-drawing-dom-objects-in-svg
function GFontToDataURI(url) {
  return fetch(url) // first fecth the embed stylesheet page
    .then((resp) => resp.text()) // we only need the text of it
    .then((text) => {
      const s = document.createElement('style');
      s.innerHTML = text;
      document.head.appendChild(s);
      const styleSheet = Array.prototype.filter.call(
        document.styleSheets,
        (sS) => sS.ownerNode === s
      )[0];
      const FontRule = (rule) => {
        const src = rule.style.getPropertyValue('src');
        const family = rule.style.getPropertyValue('font-family');
        const url = src.split('url(')[1].split(')')[0];
        return {
          rule,
          src,
          url: url.substring(url.length - 1, 1)
        };
      };
      let fontRules = [],
        fontProms = [];

      for (const r of styleSheet.cssRules) {
        const fR = FontRule(r);
        fontRules.push(fR);
        fontProms.push(fetch(fR.url) // fetch the actual font-file (.woff)
          .then((resp) => resp.blob())
          .then((blob) => new Promise((resolve) => {
            const f = new FileReader();
            f.onload = (e) => resolve(f.result);
            f.readAsDataURL(blob);
          }))
          .then((dataURL) => fR.rule.cssText.replace(fR.url, dataURL)));
      }
      document.head.removeChild(s); // clean up
      return Promise.all(fontProms); // wait for all this has been done
    });
}

// Save in .map format, based on FileSystem API
function saveMap() {
  console.time('saveMap');
  // data convention: 0 - params; 1 - all points; 2 - cells; 3 - manors; 4 - states;
  // 5 - svg; 6 - options (see below); 7 - cultures;
  // 8 - empty (former nameBase); 9 - empty (former nameBases); 10 - heights; 11 - notes;
  // size stats: points = 6%, cells = 36%, manors and states = 2%, svg = 56%;
  const date = new Date();
  const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const license = 'File can be loaded in azgaar.github.io/Fantasy-Map-Generator';
  const params = `${version}|${license}|${dateString}|${seed}`;
  const options = `${customization}|${
    distanceUnit.value}|${distanceScale.value}|${areaUnit.value}|${
    barSize.value}|${barLabel.value}|${barBackOpacity.value}|${barBackColor.value}|${
    populationRate.value}|${urbanization.value}`;

  // set zoom / transform values to default
  svg.attr('width', graphWidth).attr('height', graphHeight);
  const transform = d3.zoomTransform(svg.node());
  viewbox.attr('transform', null);
  const oceanBack = ocean.select('rect');
  const oceanShift = [oceanBack.attr('x'), oceanBack.attr('y'), oceanBack.attr('width'), oceanBack.attr('height')];
  oceanBack.attr('x', 0).attr('y', 0).attr('width', graphWidth).attr('height', graphHeight);

  const svg_xml = (new XMLSerializer()).serializeToString(svg.node());
  const line = '\r\n';
  let data = params + line + JSON.stringify(points) + line + JSON.stringify(cells) + line;
  data += JSON.stringify(manors) + line + JSON.stringify(states) + line + svg_xml + line + options + line;
  data += `${JSON.stringify(cultures) + line}${line}${line}${heights}${line}${JSON.stringify(notes)}${line}`;
  const dataBlob = new Blob([data], {
    type: 'text/plain'
  });
  const dataURL = window.URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.download = `fantasy_map_${Date.now()}.map`;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();

  // restore initial values
  svg.attr('width', svgWidth).attr('height', svgHeight);
  zoom.transform(svg, transform);
  oceanBack.attr('x', oceanShift[0]).attr('y', oceanShift[1]).attr('width', oceanShift[2]).attr('height', oceanShift[3]);

  console.timeEnd('saveMap');
  window.setTimeout(() => {
    window.URL.revokeObjectURL(dataURL);
  }, 4000);
}

// Image to Heightmap Converter dialog
function convertImage() {
  canvas.width = svgWidth;
  canvas.height = svgHeight;
  // turn off paint brushes drag and cursor
  $('.pressed').removeClass('pressed');
  restoreDefaultEvents();
  const div = d3.select('#colorScheme');
  if (div.selectAll('*').size() === 0) {
    for (let i = 0; i <= 100; i++) {
      let width = i < 20 || i > 70 ? '1px' : '3px';
      if (i === 0) {
        width = '4px';
      }
      const clr = color(1 - i / 100);
      const style = `background-color: ${clr}; width: ${width}`;
      div.append('div').attr('data-color', i).attr('style', style);
    }
    div.selectAll('*').on('touchmove mousemove', showHeight).on('click', assignHeight);
  }
  if ($('#imageConverter').is(':visible')) {
    return;
  }
  $('#imageConverter').dialog({
    title: 'Image to Heightmap Converter',
    minHeight: 30,
    width: 260,
    resizable: false,
    position: {
      my: 'right top',
      at: 'right-10 top+10',
      of: 'svg'
    }
  })
    .on('dialogclose', () => {
      completeConvertion();
    });
}

function normalize(val, min, max) {
  let normalized = (val - min) / (max - min);
  if (normalized < 0) {
    normalized = 0;
  }
  if (normalized > 1) {
    normalized = 1;
  }
  return normalized;
}

// Clear the map
function undraw() {
  viewbox.selectAll('path, circle, line, text, use, #ruler > g').remove();
  defs.selectAll('*').remove();
  landmass.select('rect').remove();
  cells = [], land = [], riversData = [], manors = [], states = [], features = [], queue = [];
}

function uploadFile(file, callback) {
  console.time('loadMap');
  const fileReader = new FileReader();
  fileReader.onload = function (fileLoadedEvent) {
    const dataLoaded = fileLoadedEvent.target.result;
    const data = dataLoaded.split('\r\n');
    // data convention: 0 - params; 1 - all points; 2 - cells; 3 - manors; 4 - states;
    // 5 - svg; 6 - options; 7 - cultures; 8 - none; 9 - none; 10 - heights; 11 - notes;
    const params = data[0].split('|');
    const mapVersion = params[0] || data[0];
    if (mapVersion !== version) {
      let message = 'The Map version ';
      // mapVersion reference was not added to downloaded map before v. 0.52b, so I cannot support really old files
      if (mapVersion.length <= 10) {
        message += `(${mapVersion}) does not match the Generator version (${version}). The map will be auto-updated.
                      In case of critical issues you may send the .map file
                      <a href="mailto:maxganiev@yandex.ru?Subject=Map%20update%20request" target="_blank">to me</a>
                      or just keep using
                      <a href="https://github.com/Azgaar/Fantasy-Map-Generator/wiki/Changelog" target="_blank">an appropriate version</a>
                      of the Generator`;
      } else if (!mapVersion || parseFloat(mapVersion) < 0.54) {
        message += `you are trying to load is too old and cannot be updated. Please re-create the map or just keep using
                      <a href="https://github.com/Azgaar/Fantasy-Map-Generator/wiki/Changelog" target="_blank">an archived version</a>
                      of the Generator. Please note the Generator is still on demo and a lot of changes are being made every month`;
      }
      alertMessage.innerHTML = message;
      $('#alert').dialog({
        title: 'Warning',
        buttons: {
          OK() {
            loadDataFromMap(data);
          }
        }
      });
    } else {
      loadDataFromMap(data);
    }
    if (mapVersion.length > 10) {
      console.error('Cannot load map');
    }
  };
  fileReader.readAsText(file, 'UTF-8');
  if (callback) {
    callback();
  }
}

function loadDataFromMap(data) {
  closeDialogs();
  // update seed
  const params = data[0].split('|');
  if (params[3]) {
    seed = params[3];
    optionsSeed.value = seed;
  }

  // get options
  if (data[0] === '0.52b' || data[0] === '0.53b') {
    customization = 0;
  } else if (data[6]) {
    const options = data[6].split('|');
    customization = +options[0] || 0;
    if (options[1]) {
      distanceUnit.value = options[1];
    }
    if (options[2]) {
      distanceScale.value = options[2];
    }
    if (options[3]) {
      areaUnit.value = options[3];
    }
    if (options[4]) {
      barSize.value = options[4];
    }
    if (options[5]) {
      barLabel.value = options[5];
    }
    if (options[6]) {
      barBackOpacity.value = options[6];
    }
    if (options[7]) {
      barBackColor.value = options[7];
    }
    if (options[8]) {
      populationRate.value = options[8];
    }
    if (options[9]) {
      urbanization.value = options[9];
    }
  }

  // replace old svg
  svg.remove();
  if (data[0] === '0.52b' || data[0] === '0.53b') {
    states = []; // no states data in old maps
    document.body.insertAdjacentHTML('afterbegin', data[4]);
  } else {
    states = JSON.parse(data[4]);
    document.body.insertAdjacentHTML('afterbegin', data[5]);
  }

  svg = d3.select('svg');

  // always change graph size to the size of loaded map
  const nWidth = +svg.attr('width'),
    nHeight = +svg.attr('height');
  graphWidth = nWidth;
  graphHeight = nHeight;
  voronoi = d3.voronoi().extent([
    [-1, -1],
    [graphWidth + 1, graphHeight + 1]
  ]);
  zoom.translateExtent([
    [0, 0],
    [graphWidth, graphHeight]
  ]).scaleExtent([1, 20]).scaleTo(svg, 1);
  viewbox.attr('transform', null);

  // temporary fit loaded svg element to current canvas size
  svg.attr('width', svgWidth).attr('height', svgHeight);
  if (nWidth !== svgWidth || nHeight !== svgHeight) {
    alertMessage.innerHTML = `The loaded map has size ${nWidth} x ${nHeight} pixels, while the current canvas size is ${svgWidth} x ${svgHeight} pixels.
                                Click "Rescale" to fit the map to the current canvas size. Click "OK" to browse the map without rescaling`;
    $('#alert').dialog({
      title: 'Map size conflict',
      buttons: {
        Rescale() {
          applyLoadedData(data);
          // rescale loaded map
          const xRatio = svgWidth / nWidth;
          const yRatio = svgHeight / nHeight;
          const scaleTo = rn(Math.min(xRatio, yRatio), 4);
          // calculate frames to scretch ocean background
          const extent = `${100 / scaleTo}%`;
          const xShift = (nWidth * scaleTo - svgWidth) / 2 / scaleTo;
          const yShift = (nHeight * scaleTo - svgHeight) / 2 / scaleTo;
          svg.select('#ocean').selectAll('rect').attr('x', xShift).attr('y', yShift)
            .attr('width', extent)
            .attr('height', extent);
          zoom.translateExtent([
            [0, 0],
            [nWidth, nHeight]
          ]).scaleExtent([scaleTo, 20]).scaleTo(svg, scaleTo);
          $(this).dialog('close');
        },
        OK() {
          changeMapSize();
          applyLoadedData(data);
          $(this).dialog('close');
        }
      }
    });
  } else {
    applyLoadedData(data);
  }
}

function applyLoadedData(data) {
  // redefine variables
  defs = svg.select('#deftemp');
  viewbox = svg.select('#viewbox');
  ocean = viewbox.select('#ocean');
  oceanLayers = ocean.select('#oceanLayers');
  oceanPattern = ocean.select('#oceanPattern');
  landmass = viewbox.select('#landmass');
  grid = viewbox.select('#grid');
  overlay = viewbox.select('#overlay');
  terrs = viewbox.select('#terrs');
  cults = viewbox.select('#cults');
  routes = viewbox.select('#routes');
  roads = routes.select('#roads');
  trails = routes.select('#trails');
  rivers = viewbox.select('#rivers');
  terrain = viewbox.select('#terrain');
  regions = viewbox.select('#regions');
  borders = viewbox.select('#borders');
  stateBorders = borders.select('#stateBorders');
  neutralBorders = borders.select('#neutralBorders');
  coastline = viewbox.select('#coastline');
  lakes = viewbox.select('#lakes');
  searoutes = routes.select('#searoutes');
  labels = viewbox.select('#labels');
  icons = viewbox.select('#icons');
  markers = viewbox.select('#markers');
  ruler = viewbox.select('#ruler');
  debug = viewbox.select('#debug');

  if (!d3.select('#defs-markers').size()) {
    const symbol = '<g id="defs-markers"><symbol id="marker0" viewBox="0 0 30 30"><path d="M6,19 l9,10 L24,19" fill="#000000" stroke="none"></path><circle cx="15" cy="15" r="10" stroke-width="1" stroke="#000000" fill="#ffffff"></circle><text x="50%" y="50%" fill="#000000" stroke-width="0" stroke="#000000" font-size="22px" dominant-baseline="central">?</text></symbol></g>';
    const cont = document.getElementsByTagName('defs');
    cont[0].insertAdjacentHTML('afterbegin', symbol);
    markers = viewbox.append('g').attr('id', 'markers');
  }

  // version control: ensure required groups are created with correct data
  if (!labels.select('#burgLabels').size()) {
    labels.append('g').attr('id', 'burgLabels');
    $('#labels #capitals, #labels #towns').detach().appendTo($('#burgLabels'));
  }

  if (!icons.select('#burgIcons').size()) {
    icons.append('g').attr('id', 'burgIcons');
    $('#icons #capitals, #icons #towns').detach().appendTo($('#burgIcons'));
    icons.select('#burgIcons').select('#capitals').attr('size', 1).attr('fill-opacity', 0.7)
      .attr('stroke-opacity', 1);
    icons.select('#burgIcons').select('#towns').attr('size', 0.5).attr('fill-opacity', 0.7)
      .attr('stroke-opacity', 1);
  }

  icons.selectAll('g').each(function () {
    const size = this.getAttribute('font-size');
    if (size === null || size === undefined) {
      return;
    }
    this.removeAttribute('font-size');
    this.setAttribute('size', size);
  });

  icons.select('#burgIcons').selectAll('circle').each(function () {
    this.setAttribute('r', this.parentNode.getAttribute('size'));
  });

  icons.selectAll('use').each(function () {
    const size = this.parentNode.getAttribute('size');
    if (size === null || size === undefined) {
      return;
    }
    this.setAttribute('width', size);
    this.setAttribute('height', size);
  });

  if (!labels.select('#countries').size()) {
    labels.append('g').attr('id', 'countries')
      .attr('fill', '#3e3e4b').attr('opacity', 1)
      .attr('font-family', 'Almendra SC')
      .attr('data-font', 'Almendra+SC')
      .attr('font-size', 14)
      .attr('data-size', 14);
  }

  burgLabels = labels.select('#burgLabels');
  burgIcons = icons.select('#burgIcons');

  // restore events
  svg.call(zoom);
  restoreDefaultEvents();
  viewbox.on('touchmove mousemove', moved);
  overlay.selectAll('*').call(d3.drag().on('start', elementDrag));
  terrain.selectAll('g').selectAll('g').on('click', editReliefIcon);
  labels.selectAll('text').on('click', editLabel);
  icons.selectAll('circle, path, use').on('click', editIcon);
  burgLabels.selectAll('text').on('click', editBurg);
  burgIcons.selectAll('circle, path, use').on('click', editBurg);
  rivers.selectAll('path').on('click', editRiver);
  routes.selectAll('path').on('click', editRoute);
  markers.selectAll('use').on('click', editMarker);
  svg.select('#scaleBar').call(d3.drag().on('start', elementDrag)).on('click', editScale);
  ruler.selectAll('g').call(d3.drag().on('start', elementDrag));
  ruler.selectAll('g').selectAll('text').on('click', removeParent);
  ruler.selectAll('.opisometer').selectAll('circle').call(d3.drag().on('start', opisometerEdgeDrag));
  ruler.selectAll('.linear').selectAll('circle:not(.center)').call(d3.drag().on('drag', rulerEdgeDrag));
  ruler.selectAll('.linear').selectAll('circle.center').call(d3.drag().on('drag', rulerCenterDrag));

  // update data
  const newPoints = [];
  riversData = [], queue = [], elSelected = '';
  points = JSON.parse(data[1]);
  cells = JSON.parse(data[2]);
  manors = JSON.parse(data[3]);
  if (data[7]) {
    cultures = JSON.parse(data[7]);
  }
  if (data[7] === undefined) {
    generateCultures();
  }
  if (data[11]) {
    notes = JSON.parse(data[11]);
  }

  // place random point
  function placePoint() {
    const x = Math.floor(Math.random() * graphWidth * 0.8 + graphWidth * 0.1);
    const y = Math.floor(Math.random() * graphHeight * 0.8 + graphHeight * 0.1);
    return [x, y];
  }

  // ensure each culure has a valid namesbase assigned, if not assign first base
  if (!nameBase[0]) {
    applyDefaultNamesData();
  }
  cultures.forEach((c) => {
    const b = c.base;
    if (b === undefined) {
      c.base = 0;
    }
    if (!nameBase[b] || !nameBases[b]) {
      c.base = 0;
    }
    if (c.center === undefined) {
      c.center = placePoint();
    }
  });
  const graphSizeAdj = 90 / Math.sqrt(cells.length, 2); // adjust to different graphSize

  // cells validations
  cells.forEach((c, d) => {
    // collect points
    newPoints.push(c.data);

    // update old 0-1 height range to a new 0-100 range
    if (c.height < 1) {
      c.height = Math.trunc(c.height * 100);
    }
    if (c.height === 1 && c.region !== undefined && c.flux !== undefined) {
      c.height = 100;
    }

    // check if there are any unavailable cultures
    if (c.culture > cultures.length - 1) {
      const center = [c.data[0], c.data[1]];
      const cult = {
        name: `AUTO_${c.culture}`,
        color: '#ff0000',
        base: 0,
        center
      };
      cultures.push(cult);
    }

    if (c.height >= 20) {
      if (!polygons[d] || !polygons[d].length) {
        return;
      }
      // calculate area
      if (c.area === undefined || isNaN(c.area)) {
        const area = d3.polygonArea(polygons[d]);
        c.area = rn(Math.abs(area), 2);
      }
      // calculate population
      if (c.pop === undefined || isNaN(c.pop)) {
        let population = 0;
        const elevationFactor = Math.pow((100 - c.height) / 100, 3);
        population = elevationFactor * c.area * graphSizeAdj;
        if (c.region === 'neutral') {
          population *= 0.5;
        }
        c.pop = rn(population, 1);
      }
      // if culture is undefined, set to 0
      if (c.culture === undefined || isNaN(c.culture)) {
        c.culture = 0;
      }
    }
  });

  land = $.grep(cells, (e) => (e.height >= 20));
  calculateVoronoi(newPoints);

  // get heights Uint8Array
  if (data[10]) {
    heights = new Uint8Array(data[10].split(','));
  } else {
    heights = new Uint8Array(points.length);
    for (let i = 0; i < points.length; i++) {
      const cell = diagram.find(points[i][0], points[i][1]).index;
      heights[i] = cells[cell].height;
    }
  }

  // restore Heightmap customization mode
  if (customization === 1) {
    optionsTrigger.click();
    $('#customizeHeightmap, #customizationMenu').slideDown();
    $('#openEditor').slideUp();
    updateHistory();
    customizeTab.click();
    paintBrushes.click();
    tip('The map is in Heightmap customization mode. Please finalize the Heightmap', true);
  }
  // restore Country Edition mode
  if (customization === 2 || customization === 3) {
    tip('The map is in Country Edition mode. Please complete the assignment', true);
  }

  // restore layers state
  d3.select('#toggleCultures').classed('buttonoff', !cults.selectAll('path').size());
  d3.select('#toggleHeight').classed('buttonoff', !terrs.selectAll('path').size());
  d3.select('#toggleCountries').classed('buttonoff', regions.style('display') === 'none');
  d3.select('#toggleRivers').classed('buttonoff', rivers.style('display') === 'none');
  d3.select('#toggleOcean').classed('buttonoff', oceanPattern.style('display') === 'none');
  d3.select('#toggleRelief').classed('buttonoff', terrain.style('display') === 'none');
  d3.select('#toggleBorders').classed('buttonoff', borders.style('display') === 'none');
  d3.select('#toggleIcons').classed('buttonoff', icons.style('display') === 'none');
  d3.select('#toggleLabels').classed('buttonoff', labels.style('display') === 'none');
  d3.select('#toggleRoutes').classed('buttonoff', routes.style('display') === 'none');
  d3.select('#toggleGrid').classed('buttonoff', grid.style('display') === 'none');

  // update map to support some old versions and fetch fonts
  labels.selectAll('g').each(function (d) {
    const el = d3.select(this);
    if (el.attr('id') === 'burgLabels') {
      return;
    }
    const font = el.attr('data-font');
    if (font && fonts.indexOf(font) === -1) {
      addFonts(`https://fonts.googleapis.com/css?family=${font}`);
    }
    if (!el.attr('data-size')) {
      el.attr('data-size', +el.attr('font-size'));
    }
    if (el.style('display') === 'none') {
      el.node().style.display = null;
    }
  });

  invokeActiveZooming();
  console.timeEnd('loadMap');
}

function fetchFonts(url) {
  return new Promise((resolve, reject) => {
    if (url === '') {
      tip('Use a direct link to any @font-face declaration or just font name to fetch from Google Fonts');
      return;
    }
    if (url.indexOf('http') === -1) {
      url = url.replace(url.charAt(0), url.charAt(0).toUpperCase()).split(' ').join('+');
      url = `https://fonts.googleapis.com/css?family=${url}`;
    }
    const fetched = addFonts(url).then((fetched) => {
      if (fetched === undefined) {
        tip('Cannot fetch font for this value!');
        return;
      }
      if (fetched === 0) {
        tip('Already in the fonts list!');
        return;
      }
      updateFontOptions();
      if (fetched === 1) {
        tip(`Font ${fonts[fonts.length - 1]} is fetched`);
      } else if (fetched > 1) {
        tip(`${fetched} fonts are added to the list`);
      }
      resolve(fetched);
    });
  });
}

// fetch default fonts if not done before
function loadDefaultFonts() {
  if (!$('link[href="fonts.css"]').length) {
    $('head').append('<link rel="stylesheet" type="text/css" href="fonts.css">');
    const fontsToAdd = ['Amatic+SC:700', 'IM+Fell+English', 'Great+Vibes', 'MedievalSharp', 'Metamorphous',
      'Nova+Script', 'Uncial+Antiqua', 'Underdog', 'Caesar+Dressing', 'Bitter', 'Yellowtail', 'Montez',
      'Shadows+Into+Light', 'Fredericka+the+Great', 'Orbitron', 'Dancing+Script:700',
      'Architects+Daughter', 'Kaushan+Script', 'Gloria+Hallelujah', 'Satisfy', 'Comfortaa:700', 'Cinzel'
    ];
    fontsToAdd.forEach((f) => {
      if (fonts.indexOf(f) === -1) {
        fonts.push(f);
      }
    });
    updateFontOptions();
  }
}

function addFonts(url) {
  $('head').append(`<link rel="stylesheet" type="text/css" href="${url}">`);
  return fetch(url)
    .then((resp) => resp.text())
    .then((text) => {
      const s = document.createElement('style');
      s.innerHTML = text;
      document.head.appendChild(s);
      const styleSheet = Array.prototype.filter.call(
        document.styleSheets,
        (sS) => sS.ownerNode === s
      )[0];
      const FontRule = (rule) => {
        const family = rule.style.getPropertyValue('font-family');
        let font = family.replace(/['"]+/g, '').replace(/ /g, '+');
        const weight = rule.style.getPropertyValue('font-weight');
        if (weight !== '400') {
          font += `:${weight}`;
        }
        if (fonts.indexOf(font) == -1) {
          fonts.push(font);
          fetched++;
        }
      };
      let fetched = 0;
      for (const r of styleSheet.cssRules) {
        FontRule(r);
      }
      document.head.removeChild(s);
      return fetched;
    })
    .catch(() => {});
}

// clean data to get rid of redundand info
function cleanData() {
  console.time('cleanData');
  cells.map((c) => {
    delete c.cost;
    delete c.used;
    delete c.coastX;
    delete c.coastY;
    if (c.ctype === undefined) {
      delete c.ctype;
    }
    if (c.lake === undefined) {
      delete c.lake;
    }
    c.height = Math.trunc(c.height);
    if (c.height >= 20) {
      c.flux = rn(c.flux, 2);
    }
  });
  // restore layers if they was turned on
  if (!$('#toggleHeight').hasClass('buttonoff') && !terrs.selectAll('path').size()) {
    Toggle.height();
  }
  if (!$('#toggleCultures').hasClass('buttonoff') && !cults.selectAll('path').size()) {
    Toggle.cultures();
  }
  closeDialogs();
  invokeActiveZooming();
  console.timeEnd('cleanData');
}

function calculateChains() {
  for (let c = 0; c < nameBase.length; c++) {
    chain[c] = calculateChain(c);
  }
}

// calculate Markov's chain from namesbase data
function calculateChain(c) {
  const chain = [];
  const d = nameBase[c].join(' ').toLowerCase();
  const method = nameBases[c].method;

  for (let i = -1, prev = ' ', str = ''; i < d.length - 2; prev = str, i += str.length, str = '') {
    let vowel = 0,
      f = ' ';
    if (method === 'let-to-let') {
      str = d[i + 1];
    } else {
      for (let c = i + 1; str.length < 5; c++) {
        if (d[c] === undefined) {
          break;
        }
        str += d[c];
        if (str === ' ') {
          break;
        }
        if (d[c] !== 'o' && d[c] !== 'e' && vowels.includes(d[c]) && d[c + 1] === d[c]) {
          break;
        }
        if (d[c + 2] === ' ') {
          str += d[c + 1];
          break;
        }
        if (vowels.includes(d[c])) {
          vowel++;
        }
        if (vowel && vowels.includes(d[c + 2])) {
          break;
        }
      }
    }
    if (i >= 0) {
      f = d[i];
      if (method === 'syl-to-syl') {
        f = prev;
      }
    }
    if (chain[f] === undefined) {
      chain[f] = [];
    }
    chain[f].push(str);
  }
  return chain;
}

// Calculate Voronoi Diagram
function calculateVoronoi(points) {
  console.time('calculateVoronoi');
  diagram = voronoi(points);
  // round edges to simplify future calculations
  diagram.edges.forEach((e) => {
    e[0][0] = rn(e[0][0], 2);
    e[0][1] = rn(e[0][1], 2);
    e[1][0] = rn(e[1][0], 2);
    e[1][1] = rn(e[1][1], 2);
  });
  polygons = diagram.polygons();
  console.log(` cells: ${points.length}`);
  console.timeEnd('calculateVoronoi');
}

// randomize options if randomization is allowed in option
function randomizeOptions() {
  const mod = rn((graphWidth + graphHeight) / 1500, 2); // add mod for big screens
  if (lockRegionsInput.getAttribute('data-locked') == 0) {
    regionsInput.value = regionsOutput.value = rand(7, 17);
  }
  if (lockManorsInput.getAttribute('data-locked') == 0) {
    const manors = regionsInput.value * 20 + rand(180 * mod);
    manorsInput.value = manorsOutput.innerHTML = manors;
  }
  if (lockPowerInput.getAttribute('data-locked') == 0) {
    powerInput.value = powerOutput.value = rand(2, 8);
  }
  if (lockNeutralInput.getAttribute('data-locked') == 0) {
    neutralInput.value = neutralOutput.value = rand(100, 300);
  }
  if (lockNamesInput.getAttribute('data-locked') == 0) {
    namesInput.value = rand(0, 1);
  }
  if (lockCulturesInput.getAttribute('data-locked') == 0) {
    culturesInput.value = culturesOutput.value = rand(5, 10);
  }
  if (lockPrecInput.getAttribute('data-locked') == 0) {
    precInput.value = precOutput.value = rand(3, 12);
  }
  if (lockSwampinessInput.getAttribute('data-locked') == 0) {
    swampinessInput.value = swampinessOutput.value = rand(100);
  }
}

// Locate points to calculate Voronoi diagram
function placePoints() {
  console.time('placePoints');
  points = [];
  points = getJitteredGrid();
  heights = new Uint8Array(points.length);
  console.timeEnd('placePoints');
}

// turn D3 polygons array into cell array, define neighbors for each cell
function detectNeighbors(withGrid) {
  console.time('detectNeighbors');
  let gridPath = ''; // store grid as huge single path string
  cells = [];
  polygons.map((i, d) => {
    const neighbors = [];
    let type; // define cell type
    if (withGrid) {
      gridPath += `M${i.join('L')}Z`;
    } // grid path
    diagram.cells[d].halfedges.forEach((e) => {
      const edge = diagram.edges[e];
      if (edge.left && edge.right) {
        const ea = edge.left.index === d ? edge.right.index : edge.left.index;
        neighbors.push(ea);
      } else {
        type = 'border'; // polygon is on border if it has edge without opposite side polygon
      }
    });
    cells.push({
      index: d,
      data: i.data,
      height: 0,
      type,
      neighbors
    });
  });
  if (withGrid) {
    grid.append('path').attr('d', round(gridPath, 1));
  }
  console.timeEnd('detectNeighbors');
}

// recalculate Voronoi Graph to pack cells
function reGraph() {
  console.time('reGraph');
  const tempCells = [],
    newPoints = []; // to store new data
  // get average precipitation based on graph size
  const avPrec = precInput.value / 5000;
  const smallLakesMax = 500;
  let smallLakes = 0;
  const evaporation = 2;
  cells.map((i, d) => {
    let height = i.height || heights[d];
    if (height > 100) {
      height = 100;
    }
    const pit = i.pit;
    const ctype = i.ctype;
    if (ctype !== -1 && ctype !== -2 && height < 20) {
      return;
    } // exclude all deep ocean points
    const x = rn(i.data[0], 1),
      y = rn(i.data[1], 1);
    const fn = i.fn;
    const harbor = i.harbor;
    let lake = i.lake;
    // mark potential cells for small lakes to add additional point there
    if (smallLakes < smallLakesMax && !lake && pit > evaporation && ctype !== 2) {
      lake = 2;
      smallLakes++;
    }
    const region = i.region; // handle value for edit heightmap mode only
    const culture = i.culture; // handle value for edit heightmap mode only
    let copy = $.grep(newPoints, (e) => (e[0] == x && e[1] == y));
    if (!copy.length) {
      newPoints.push([x, y]);
      tempCells.push({
        index: tempCells.length,
        data: [x, y],
        height,
        pit,
        ctype,
        fn,
        harbor,
        lake,
        region,
        culture
      });
    }
    // add additional points for cells along coast
    if (ctype === 2 || ctype === -1) {
      if (i.type === 'border') {
        return;
      }
      if (!features[fn].land && !features[fn].border) {
        return;
      }
      i.neighbors.forEach((e) => {
        if (cells[e].ctype === ctype) {
          let x1 = (x * 2 + cells[e].data[0]) / 3;
          let y1 = (y * 2 + cells[e].data[1]) / 3;
          x1 = rn(x1, 1), y1 = rn(y1, 1);
          copy = $.grep(newPoints, (e) => e[0] === x1 && e[1] === y1);
          if (copy.length) {
            return;
          }
          newPoints.push([x1, y1]);
          tempCells.push({
            index: tempCells.length,
            data: [x1, y1],
            height,
            pit,
            ctype,
            fn,
            harbor,
            lake,
            region,
            culture
          });
        }
      });
    }
    if (lake === 2) { // add potential small lakes
      polygons[i.index].forEach((e) => {
        if (Math.random() > 0.8) {
          return;
        }
        let rnd = Math.random() * 0.6 + 0.8;
        const x1 = rn((e[0] * rnd + i.data[0]) / (1 + rnd), 2);
        rnd = Math.random() * 0.6 + 0.8;
        const y1 = rn((e[1] * rnd + i.data[1]) / (1 + rnd), 2);
        copy = $.grep(newPoints, (c) => x1 === c[0] && y1 === c[1]);
        if (copy.length) {
          return;
        }
        newPoints.push([x1, y1]);
        tempCells.push({
          index: tempCells.length,
          data: [x1, y1],
          height,
          pit,
          ctype,
          fn,
          region,
          culture
        });
      });
    }
  });
  console.log(`small lakes candidates: ${smallLakes}`);
  cells = tempCells; // use tempCells as the only cells array
  calculateVoronoi(newPoints); // recalculate Voronoi diagram using new points
  let gridPath = ''; // store grid as huge single path string
  cells.map((i, d) => {
    if (i.height >= 20) {
      // calc cell area
      i.area = rn(Math.abs(d3.polygonArea(polygons[d])), 2);
      const prec = rn(avPrec * i.area, 2);
      i.flux = i.lake ? prec * 10 : prec;
    }
    const neighbors = []; // re-detect neighbors
    diagram.cells[d].halfedges.forEach((e) => {
      const edge = diagram.edges[e];
      if (edge.left === undefined || edge.right === undefined) {
        if (i.height >= 20) {
          i.ctype = 99;
        } // border cell
        return;
      }
      const ea = edge.left.index === d ? edge.right.index : edge.left.index;
      neighbors.push(ea);
      if (d < ea && i.height >= 20 && i.lake !== 1 && cells[ea].height >= 20 && cells[ea].lake !== 1) {
        gridPath += `M${edge[0][0]},${edge[0][1]}L${edge[1][0]},${edge[1][1]}`;
      }
    });
    i.neighbors = neighbors;
    if (i.region === undefined) {
      delete i.region;
    }
    if (i.culture === undefined) {
      delete i.culture;
    }
  });
  grid.append('path').attr('d', gridPath);
  console.timeEnd('reGraph');
}

// Randomize heights a bit
function disruptHeights() {
  for (let i = 0; i < heights.length; i++) {
    if (heights[i] < 18) {
      continue;
    }
    if (Math.random() < 0.5) {
      continue;
    }
    heights[i] += 2 - Math.random() * 4;
  }
}

// fit ScaleBar to map size
function fitScaleBar() {
  const el = d3.select('#scaleBar');
  if (!el.select('rect').size()) {
    return;
  }
  const bbox = el.select('rect').node().getBBox();
  let tr = [svgWidth - bbox.width, svgHeight - (bbox.height - 10)];
  if (sessionStorage.getItem('scaleBar')) {
    const scalePos = sessionStorage.getItem('scaleBar').split(',');
    tr = [+scalePos[0] - bbox.width, +scalePos[1] - bbox.height];
  }
  el.attr('transform', `translate(${rn(tr[0])},${rn(tr[1])})`);
}

// move layers on mapLayers dragging (jquery sortable)
function moveLayer(event, ui) {
  const el = getLayer(ui.item.attr('id'));
  if (el) {
    const prev = getLayer(ui.item.prev().attr('id'));
    const next = getLayer(ui.item.next().attr('id'));
    if (prev) {
      el.insertAfter(prev);
    } else if (next) {
      el.insertBefore(next);
    }
  }
}

// transform string to array [translateX,translateY,rotateDeg,rotateX,rotateY,scale]
function parseTransform(string) {
  if (!string) {
    return [0, 0, 0, 0, 0, 1];
  }
  const a = string.replace(/[a-z()]/g, '').replace(/[ ]/g, ',').split(',');
  return [a[0] || 0, a[1] || 0, a[2] || 0, a[3] || 0, a[4] || 0, a[5] || 1];
}

// define connection between option layer buttons and actual svg groups
function getLayer(id) {
  if (id === 'toggleGrid') {
    return $('#grid');
  }
  if (id === 'toggleOverlay') {
    return $('#overlay');
  }
  if (id === 'toggleHeight') {
    return $('#terrs');
  }
  if (id === 'toggleCultures') {
    return $('#cults');
  }
  if (id === 'toggleRoutes') {
    return $('#routes');
  }
  if (id === 'toggleRivers') {
    return $('#rivers');
  }
  if (id === 'toggleCountries') {
    return $('#regions');
  }
  if (id === 'toggleBorders') {
    return $('#borders');
  }
  if (id === 'toggleRelief') {
    return $('#terrain');
  }
  if (id === 'toggleLabels') {
    return $('#labels');
  }
  if (id === 'toggleIcons') {
    return $('#icons');
  }
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

// generate new map seed
function changeSeed() {
  seed = Math.floor(Math.random() * 1e9);
  console.log(` seed: ${seed}`);
  optionsSeed.value = seed;
  Math.seedrandom(seed);
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

export {
  toHEX,
  rand,
  round,
  si,
  getInteger,
  saveAsImage,
  GFontToDataURI,
  saveMap,
  convertImage,
  normalize,
  undraw,
  uploadFile,
  loadDataFromMap,
  applyLoadedData,
  fetchFonts,
  loadDefaultFonts,
  addFonts,
  cleanData,
  calculateChains,
  calculateVoronoi,
  calculateChain,
  randomizeOptions,
  placePoints,
  detectNeighbors,
  reGraph,
  disruptHeights,
  rn,
  fitScaleBar,
  moveLayer,
  getLayer,
  addDragToUpload,
  changeSeed,
  applyNamesData,
  parseTransform,
  opisometerEdgeDrag
};

