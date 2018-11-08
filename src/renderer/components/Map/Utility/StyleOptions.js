// Style options
$('#styleElementSelect').on('change', function () {
  const sel = this.value;
  let el = viewbox.select(`#${sel}`);
  if (sel == 'ocean') {
    el = oceanLayers.select('rect');
  }
  $('#styleInputs > div').hide();

  // opacity
  $('#styleOpacity, #styleFilter').css('display', 'block');
  const opacity = el.attr('opacity') || 1;
  styleOpacityInput.value = styleOpacityOutput.value = opacity;

  // filter
  if (sel == 'ocean') {
    el = oceanLayers;
  }
  styleFilterInput.value = el.attr('filter') || '';
  if (sel === 'rivers' || sel === 'lakes' || sel === 'landmass') {
    $('#styleFill').css('display', 'inline-block');
    styleFillInput.value = styleFillOutput.value = el.attr('fill');
  }

  if (sel === 'roads' || sel === 'trails' || sel === 'searoutes' || sel === 'lakes' || sel === 'stateBorders' || sel === 'neutralBorders' || sel === 'grid' || sel === 'overlay' || sel === 'coastline') {
    $('#styleStroke').css('display', 'inline-block');
    styleStrokeInput.value = styleStrokeOutput.value = el.attr('stroke');
    $('#styleStrokeWidth').css('display', 'block');
    const width = el.attr('stroke-width') || '';
    styleStrokeWidthInput.value = styleStrokeWidthOutput.value = width;
  }

  if (sel === 'roads' || sel === 'trails' || sel === 'searoutes' || sel === 'stateBorders' || sel === 'neutralBorders' || sel === 'overlay') {
    $('#styleStrokeDasharray, #styleStrokeLinecap').css('display', 'block');
    styleStrokeDasharrayInput.value = el.attr('stroke-dasharray') || '';
    styleStrokeLinecapInput.value = el.attr('stroke-linecap') || 'inherit';
  }

  if (sel === 'terrs') {
    $('#styleScheme').css('display', 'block');
  }
  if (sel === 'heightmap') {
    $('#styleScheme').css('display', 'block');
  }
  if (sel === 'overlay') {
    $('#styleOverlay').css('display', 'block');
  }

  if (sel === 'labels') {
    $('#styleFill, #styleStroke, #styleStrokeWidth, #styleFontSize').css('display', 'inline-block');
    styleFillInput.value = styleFillOutput.value = el.select('g').attr('fill') || '#3e3e4b';
    styleStrokeInput.value = styleStrokeOutput.value = el.select('g').attr('stroke') || '#3a3a3a';
    styleStrokeWidthInput.value = styleStrokeWidthOutput.value = el.attr('stroke-width') || 0;
    $('#styleLabelGroups').css('display', 'inline-block');
    updateLabelGroups();
  }

  if (sel === 'ocean') {
    $('#styleOcean').css('display', 'block');
    styleOceanBack.value = styleOceanBackOutput.value = svg.style('background-color');
    styleOceanFore.value = styleOceanForeOutput.value = oceanLayers.select('rect').attr('fill');
  }
});

$('#styleFillInput').on('input', function () {
  styleFillOutput.value = this.value;
  const el = svg.select(`#${styleElementSelect.value}`);
  if (styleElementSelect.value !== 'labels') {
    el.attr('fill', this.value);
  } else {
    el.selectAll('g').attr('fill', this.value);
  }
});

$('#styleStrokeInput').on('input', function () {
  styleStrokeOutput.value = this.value;
  const el = svg.select(`#${styleElementSelect.value}`);
  el.attr('stroke', this.value);
});

$('#styleStrokeWidthInput').on('input', function () {
  styleStrokeWidthOutput.value = this.value;
  const el = svg.select(`#${styleElementSelect.value}`);
  el.attr('stroke-width', +this.value);
});

$('#styleStrokeDasharrayInput').on('input', function () {
  const sel = styleElementSelect.value;
  svg.select(`#${sel}`).attr('stroke-dasharray', this.value);
});

$('#styleStrokeLinecapInput').on('change', function () {
  const sel = styleElementSelect.value;
  svg.select(`#${sel}`).attr('stroke-linecap', this.value);
});

$('#styleOpacityInput').on('input', function () {
  styleOpacityOutput.value = this.value;
  const sel = styleElementSelect.value;
  svg.select(`#${sel}`).attr('opacity', this.value);
});

$('#styleFilterInput').on('change', function () {
  let sel = styleElementSelect.value;
  if (sel == 'ocean') {
    sel = 'oceanLayers';
  }
  const el = svg.select(`#${sel}`);
  el.attr('filter', this.value);
  zoom.scaleBy(svg, 1.00001); // enforce browser re-draw
});

$('#styleSchemeInput').on('change', () => {
  terrs.selectAll('path').remove();
  toggleHeight();
});

$('#styleOverlayType').on('change', () => {
  overlay.selectAll('*').remove();
  if (!$('#toggleOverlay').hasClass('buttonoff')) {
    toggleOverlay();
  }
});

$('#styleOverlaySize').on('change', function () {
  overlay.selectAll('*').remove();
  if (!$('#toggleOverlay').hasClass('buttonoff')) {
    toggleOverlay();
  }
  styleOverlaySizeOutput.value = this.value;
});

$('#styleOceanBack').on('input', function () {
  svg.style('background-color', this.value);
  styleOceanBackOutput.value = this.value;
});

$('#styleOceanFore').on('input', function () {
  oceanLayers.select('rect').attr('fill', this.value);
  styleOceanForeOutput.value = this.value;
});

$('#styleOceanPattern').on('click', function () {
  oceanPattern.attr('opacity', +this.checked);
});

$('#styleOceanLayers').on('click', function () {
  const display = this.checked ? 'block' : 'none';
  oceanLayers.selectAll('path').attr('display', display);
});

// Other Options handlers
$('input, select').on('input change', function () {
  const id = this.id;
  if (id === 'hideLabels') {
    invokeActiveZooming();
  }
  if (id === 'mapWidthInput' || id === 'mapHeightInput') {
    changeMapSize();
    autoResize = false;
    localStorage.setItem('mapWidth', mapWidthInput.value);
    localStorage.setItem('mapHeight', mapHeightInput.value);
  }
  if (id === 'sizeInput') {
    graphSize = sizeOutput.value = +this.value;
    if (graphSize === 3) {
      sizeOutput.style.color = 'red';
    }
    if (graphSize === 2) {
      sizeOutput.style.color = 'yellow';
    }
    if (graphSize === 1) {
      sizeOutput.style.color = 'green';
    }
    // localStorage.setItem("graphSize", this.value); - temp off to always start with size 1
  }
  if (id === 'templateInput') {
    localStorage.setItem('template', this.value);
  }
  if (id === 'manorsInput') {
    manorsOutput.value = this.value;
    localStorage.setItem('manors', this.value);
  }
  if (id === 'regionsInput') {
    regionsOutput.value = this.value;
    let size = rn(6 - this.value / 20);
    if (size < 3) {
      size = 3;
    }
    burgLabels.select('#capitals').attr('data-size', size);
    size = rn(18 - this.value / 6);
    if (size < 4) {
      size = 4;
    }
    labels.select('#countries').attr('data-size', size);
    localStorage.setItem('regions', this.value);
  }
  if (id === 'powerInput') {
    powerOutput.value = this.value;
    localStorage.setItem('power', this.value);
  }
  if (id === 'neutralInput') {
    neutralOutput.value = countriesNeutral.value = this.value;
    localStorage.setItem('neutal', this.value);
  }
  if (id === 'culturesInput') {
    culturesOutput.value = this.value;
    localStorage.setItem('cultures', this.value);
  }
  if (id === 'precInput') {
    precOutput.value = +precInput.value;
    localStorage.setItem('prec', this.value);
  }
  if (id === 'swampinessInput') {
    swampinessOutput.value = this.value;
    localStorage.setItem('swampiness', this.value);
  }
  if (id === 'outlineLayersInput') {
    localStorage.setItem('outlineLayers', this.value);
  }
  if (id === 'transparencyInput') {
    changeDialogsTransparency(this.value);
  }
  if (id === 'pngResolutionInput') {
    localStorage.setItem('pngResolution', this.value);
  }
  if (id === 'zoomExtentMin' || id === 'zoomExtentMax') {
    zoom.scaleExtent([+zoomExtentMin.value, +zoomExtentMax.value]);
    zoom.scaleTo(svg, +this.value);
  }

  if (id === 'convertOverlay') {
    canvas.style.opacity = convertOverlayValue.innerHTML = +this.value;
  }
  if (id === 'populationRate') {
    populationRateOutput.value = si(+populationRate.value * 1000);
    updateCountryEditors();
  }
  if (id === 'urbanization') {
    urbanizationOutput.value = this.value;
    updateCountryEditors();
  }
  if (id === 'distanceUnit' || id === 'distanceScale' || id === 'areaUnit') {
    const dUnit = distanceUnit.value;
    if (id === 'distanceUnit' && dUnit === 'custom_name') {
      const custom = prompt('Provide a custom name for distance unit');
      if (custom) {
        const opt = document.createElement('option');
        opt.value = opt.innerHTML = custom;
        distanceUnit.add(opt);
        distanceUnit.value = custom;
      } else {
        this.value = 'km';
        return;
      }
    }
    const scale = distanceScale.value;
    scaleOutput.value = `${scale} ${dUnit}`;
    ruler.selectAll('g').each(function () {
      let label;
      const g = d3.select(this);
      const area = +g.select('text').attr('data-area');
      if (area) {
        const areaConv = area * Math.pow(scale, 2); // convert area to distanceScale
        let unit = areaUnit.value;
        if (unit === 'square') {
          unit = `${dUnit}²`;
        } else {
          unit = areaUnit.value;
        }
        label = `${si(areaConv)} ${unit}`;
      } else {
        const dist = +g.select('text').attr('data-dist');
        label = `${rn(dist * scale)} ${dUnit}`;
      }
      g.select('text').text(label);
    });
    ruler.selectAll('.gray').attr('stroke-dasharray', rn(30 / scale, 2));
    drawScaleBar();
    updateCountryEditors();
  }
  if (id === 'barSize') {
    barSizeOutput.innerHTML = this.value;
    $('#scaleBar').removeClass('hidden');
    drawScaleBar();
  }
  if (id === 'barLabel') {
    $('#scaleBar').removeClass('hidden');
    drawScaleBar();
  }
  if (id === 'barBackOpacity' || id === 'barBackColor') {
    d3.select('#scaleBar > rect')
      .attr('opacity', +barBackOpacity.value)
      .attr('fill', barBackColor.value);
    $('#scaleBar').removeClass('hidden');
  }
});

$('#scaleOutput').change(function () {
  if (this.value === '' || isNaN(+this.value) || this.value < 0.01 || this.value > 10) {
    tip('Manually entered distance scale should be a number in a [0.01; 10] range');
    this.value = `${distanceScale.value} ${distanceUnit.value}`;
    return;
  }
  distanceScale.value = +this.value;
  scaleOutput.value = `${this.value} ${distanceUnit.value}`;
  updateCountryEditors();
});

$('#populationRateOutput').change(function () {
  if (this.value === '' || isNaN(+this.value) || this.value < 0.001 || this.value > 10) {
    tip('Manually entered population rate should be a number in a [0.001; 10] range');
    this.value = si(populationRate.value * 1000);
    return;
  }
  populationRate.value = +this.value;
  populationRateOutput.value = si(this.value * 1000);
  updateCountryEditors();
});

$('#urbanizationOutput').change(function () {
  if (this.value === '' || isNaN(+this.value) || this.value < 0 || this.value > 10) {
    tip('Manually entered urbanization rate should be a number in a [0; 10] range');
    this.value = urbanization.value;
    return;
  }
  const val = parseFloat(+this.value);
  if (val > 2) {
    urbanization.setAttribute('max', val);
  }
  urbanization.value = urbanizationOutput.value = val;
  updateCountryEditors();
});


// lock manually changed option to restrict it randomization
$('#optionsContent input, #optionsContent select').change(function () {
  const icon = `lock${this.id.charAt(0).toUpperCase()}${this.id.slice(1)}`;
  const el = document.getElementById(icon);
  if (!el) {
    return;
  }
  el.setAttribute('data-locked', 1);
  el.className = 'icon-lock';
});

$('#optionsReset').click(restoreDefaultOptions);

$('#rescaler').change(function () {
  const change = rn((+this.value - 5), 2);
  modifyHeights('all', change, 1);
  updateHeightmap();
  updateHistory();
  rescaler.value = 5;
});

$('#layoutPreset').on('change', function () {
  const preset = this.value;
  $('#mapLayers li').not('#toggleOcean').addClass('buttonoff');
  $('#toggleOcean').removeClass('buttonoff');
  $('#oceanPattern').fadeIn();
  $('#rivers, #terrain, #borders, #regions, #icons, #labels, #routes, #grid, #markers').fadeOut();
  cults.selectAll('path').remove();
  terrs.selectAll('path').remove();
  if (preset === 'layoutPolitical') {
    toggleRivers.click();
    toggleRelief.click();
    toggleBorders.click();
    toggleCountries.click();
    toggleIcons.click();
    toggleLabels.click();
    toggleRoutes.click();
    toggleMarkers.click();
  }
  if (preset === 'layoutCultural') {
    toggleRivers.click();
    toggleRelief.click();
    toggleBorders.click();
    $('#toggleCultures').click();
    toggleIcons.click();
    toggleLabels.click();
    toggleMarkers.click();
  }
  if (preset === 'layoutHeightmap') {
    $('#toggleHeight').click();
    toggleRivers.click();
  }
});