import $ from 'jquery';
import * as d3 from 'd3';
import * as C from './Utility/Const';
import * as U from './Utility/Utils';
import * as DOM from './Utility/DOMVariables';
import * as Toggle from './Utility/Toggles';
import * as UI from './Utility/UI';
import * as Gen from './Utility/Generate';
import * as Focus from './Utility/Focus';
import * as Zoom from './Utility/Zoom';
import * as Height from './Height';
import * as LS from './Utility/LocalStorage';

function fantasyMap() {
  C.labels.append('g').attr('id', 'countries');
  C.burgIcons.append('g').attr('id', 'capitals');
  C.burgLabels.append('g').attr('id', 'capitals');
  C.burgIcons.append('g').attr('id', 'towns');
  C.burgLabels.append('g').attr('id', 'towns');
  C.icons.append('g').attr('id', 'capital-anchors');
  C.icons.append('g').attr('id', 'town-anchors');
  C.terrain.append('g').attr('id', 'hills');
  C.terrain.append('g').attr('id', 'mounts');
  C.terrain.append('g').attr('id', 'swamps');
  C.terrain.append('g').attr('id', 'forests');

  // append ocean pattern
  C.oceanPattern.append('rect').attr('fill', 'url(#oceanic)').attr('stroke', 'none');
  C.oceanLayers.append('rect').attr('id', 'oceanBase');

  // input/output DOM variable "imports"
  const [
    mapWidthInput,
    mapHeightInput
  ] = [
    DOM.mapWidthInput,
    DOM.mapHeightInput
  ];

  // Other DOM variable "imports"
  const [
    labels,
    distanceScale,
    distanceUnit,
    areaUnit,
    alertMessage
  ] = [
    DOM.labels,
    DOM.distanceScale,
    DOM.distanceUnit,
    DOM.areaUnit,
    DOM.alertMessage
  ];

  // Constant variable "imports"
  const [
    ruler,
    debug,
    viewbox,
    regions,
    version
  ] = [
    C.ruler,
    C.debug,
    C.viewbox,
    C.regions,
    C.version
  ];

  // Utility imports
  const rn = U.rn();
  // const opisometerEdgeDrag = U.opisometerEdgeDrag();
  const applyNamesData = U.applyNamesData();
  const applyDefaultStyle = U.applyDefaultStyle();
  const getSeed = U.getSeed();

  // UI imports
  const elementDrag = UI.elementDrag();

  // Generate imports
  const generate = Gen.generate();

  // Focus imports
  const focusOn = Focus.focusOn();

  // Zoom imports
  const invokeActiveZooming = Zoom.invokeActiveZooming();

  // Height imports
  const mockHeightmap = Height.mockHeightmap();

  // main data variables
  // let seed;
  // let params;
  // let voronoi;
  let diagram;
  let polygons;
  // let spacing;
  const points = [];
  let heights;
  // Common variables
  // const modules = {};
  let customization = 0;
  // let history = [];
  // let historyStage = 0;
  // let elSelected;
  const autoResize = true;
  // let graphSize;
  const cells = [];
  // let land = [];
  // let riversData = [];
  // let manors = [];
  const states = [];
  const features = [];
  // const notes = [];
  // const fonts = C.fonts;
  // let queue = [];

  // Cultures-related data
  // const chain = {};
  // const vowels = 'aeiouy';
  // const defaultCultures = [];
  const cultures = [];
  // const nameBases = [];
  // const nameBase = [];
  // let cultureTree;

  // Color schemes
  // const color = d3.scaleSequential(d3.interpolateSpectral);
  // const colors8 = d3.scaleOrdinal(d3.schemeSet2);
  const colors20 = d3.scaleOrdinal(d3.schemeCategory20);

  // D3 drag and zoom behavior
  const scale = DOM.scale;
  // const viewX = DOM.viewX;
  // const viewY = DOM.viewY;

  LS.applyStoredOptions();
  const graphWidth = DOM.graphWidth; // voronoi graph extention, should be stable for each map
  const graphHeight = DOM.graphHeight;
  const svgWidth = DOM.svgWidth;
  const svgHeight = DOM.svgHeight; // svg canvas resolution, can vary for each map

  // D3 Line generator variables
  // const lineGen = d3.line().x((d) => d.scX).y((d) => d.scY).curve(d3.curveCatmullRom);

  U.addDragToUpload();

  // Changelog dialog window
  const storedVersion = localStorage.getItem('version'); // show message on load
  if (storedVersion !== version) {
    alertMessage.innerHTML = `<b>2018-29-23</b>:
      The <i>Fantasy Map Generator</i> is updated up to version <b>${version}</b>.
      Main changes:<br><br>
      <li>Map Markers</li>
      <li>Legend Editor (text notes)</li>
      <li>Bug fixes</li>
      <br>See a 
      <a href='https://www.reddit.com/r/FantasyMapGenerator/comments/9iarje/update_new_version_` +
      `is_published_v060b' target='_blank'>dedicated post</a> for the details.
      <br><br>
      <i>Join our <a href='https://www.reddit.com/r/FantasyMapGenerator/' target='_blank'>
      Reddit community</a>
      to share created maps, discuss the Generator, report bugs, ask questions and propose 
      new features.
      You may also report bugs <a href='https://github.com/Azgaar/Fantasy-Map-Generator/issues' 
      target='_blank'>here</a>.</i>`;

    $('#alert').dialog({
      resizable: false,
      title: 'Fantasy Map Generator update',
      width: 320,
      buttons: {
        'Don\'t show again': () => {
          localStorage.setItem('version', version);
          $(this).dialog('close');
        },
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
  }

  getSeed(); // get and set random generator seed
  applyNamesData(); // apply default namesbase on load
  generate(); // generate map on load
  applyDefaultStyle(); // apply style on load
  focusOn(); // based on searchParams focus on point, cell or burg from MFCG
  invokeActiveZooming(); // to hide what need to be hidden

  // function updateURL() {
  //   const url = new URL(window.location.href);
  //   url.searchParams.set('seed', seed);
  //   if (url.protocol !== 'file:') {
  //     window.history.pushState({
  //       seed
  //     }, "", "url.search");
  //   }
  // }

  $('#renderOcean').click(mockHeightmap);

  // Add support "click to add" button events
  $('#customizeTab').click(clickToAdd);

  // Map Loader based on FileSystem API
  $('#mapToLoad').change(function () {
    console.time('loadMap');
    closeDialogs();
    const fileToLoad = this.files[0];
    this.value = '';
    uploadFile(fileToLoad);
  });

  // Hotkeys, see github.com/Azgaar/Fantasy-Map-Generator/wiki/Hotkeys
  d3.select('body').on('keydown', function () {
    const active = document.activeElement.tagName;
    if (active === 'INPUT' || active === 'SELECT' || active === 'TEXTAREA') {
      return;
    }
    const key = d3.event.keyCode;
    const ctrl = d3.event.ctrlKey;
    const p = d3.mouse(this);
    if (key === 117) {
      $('#randomMap').click();
    } // "F6" for new map
    else if (key === 27) {
      closeDialogs();
    } // Escape to close all dialogs
    else if (key === 79) {
      optionsTrigger.click();
    } // "O" to toggle options
    else if (key === 80) {
      saveAsImage('png');
    } // "P" to save as PNG
    else if (key === 83) {
      saveAsImage('svg');
    } // "S" to save as SVG
    else if (key === 77) {
      saveMap();
    } // "M" to save MAP file
    else if (key === 76) {
      mapToLoad.click();
    } // "L" to load MAP
    else if (key === 32) {
      console.table(cells[diagram.find(p[0], p[1]).index]);
    } // Space to log focused cell data
    else if (key === 192) {
      console.log(cells);
    } // "`" to log cells data
    else if (key === 66) {
      console.table(manors);
    } // "B" to log burgs data
    else if (key === 67) {
      console.table(states);
    } // "C" to log countries data
    else if (key === 70) {
      console.table(features);
    } // "F" to log features data
    else if (key === 37) {
      zoom.translateBy(svg, 10, 0);
    } // Left to scroll map left
    else if (key === 39) {
      zoom.translateBy(svg, -10, 0);
    } // Right to scroll map right
    else if (key === 38) {
      zoom.translateBy(svg, 0, 10);
    } // Up to scroll map up
    else if (key === 40) {
      zoom.translateBy(svg, 0, -10);
    } // Up to scroll map up
    else if (key === 107) {
      zoom.scaleBy(svg, 1.2);
    } // Plus to zoom map up
    else if (key === 109) {
      zoom.scaleBy(svg, 0.8);
    } // Minus to zoom map out
    else if (key === 48 || key === 96) {
      resetZoom();
    } // 0 to reset zoom
    else if (key === 49 || key === 97) {
      zoom.scaleTo(svg, 1);
    } // 1 to zoom to 1
    else if (key === 50 || key === 98) {
      zoom.scaleTo(svg, 2);
    } // 2 to zoom to 2
    else if (key === 51 || key === 99) {
      zoom.scaleTo(svg, 3);
    } // 3 to zoom to 3
    else if (key === 52 || key === 100) {
      zoom.scaleTo(svg, 4);
    } // 4 to zoom to 4
    else if (key === 53 || key === 101) {
      zoom.scaleTo(svg, 5);
    } // 5 to zoom to 5
    else if (key === 54 || key === 102) {
      zoom.scaleTo(svg, 6);
    } // 6 to zoom to 6
    else if (key === 55 || key === 103) {
      zoom.scaleTo(svg, 7);
    } // 7 to zoom to 7
    else if (key === 56 || key === 104) {
      zoom.scaleTo(svg, 8);
    } // 8 to zoom to 8
    else if (key === 57 || key === 105) {
      zoom.scaleTo(svg, 9);
    } // 9 to zoom to 9
    else if (key === 9) {
      $('#updateFullscreen').click();
    } // Tab to fit map to fullscreen
    else if (ctrl && key === 90) {
      undo.click();
    } // Ctrl + "Z" to toggle undo
    else if (ctrl && key === 89) {
      redo.click();
    } // Ctrl + "Y" to toggle undo
  });

  // Toggle Options pane
  $('#optionsTrigger').on('click', () => {
    if (tooltip.getAttribute('data-main') === 'Сlick the arrow button to open options') {
      tooltip.setAttribute('data-main', '');
      tooltip.innerHTML = '';
      localStorage.setItem('disable_click_arrow_tooltip', true);
    }
    if ($('#options').css('display') === 'none') {
      $('#regenerate').hide();
      $('#options').fadeIn();
      $('#layoutTab').click();
      $('#optionsTrigger').removeClass('icon-right-open glow').addClass('icon-left-open');
    } else {
      $('#options').fadeOut();
      $('#optionsTrigger').removeClass('icon-left-open').addClass('icon-right-open');
    }
  });
  $('#collapsible').hover(() => {
    if ($('#optionsTrigger').hasClass('glow')) {
      return;
    }
    if ($('#options').css('display') === 'none') {
      $('#regenerate').show();
      $('#optionsTrigger').removeClass('glow');
    }
  }, () => {
    $('#regenerate').hide();
  });

  // UI Button handlers
  $('button, a, li, i').on('click', () => {
    const id = this.id;
    const parent = this.parentNode.id;
    if (debug.selectAll('.tag').size()) {
      debug.selectAll('.tag, .line').remove();
    }
    if (id === 'toggleHeight') {
      toggleHeight();
    }
    if (id === 'toggleCountries') {
      $('#regions').fadeToggle();
    }
    if (id === 'toggleCultures') {
      toggleCultures();
    }
    if (id === 'toggleOverlay') {
      toggleOverlay();
    }
    if (id === 'toggleFlux') {
      toggleFlux();
    }
    if (parent === 'mapLayers' || parent === 'styleContent') {
      $(this).toggleClass('buttonoff');
    }
    if (id === 'randomMap' || id === 'regenerate') {
      U.changeSeed();
      exitCustomization();
      undraw();
      resetZoom(1000);
      generate();
      return;
    }
    if (id === 'editCountries') {
      editCountries();
    }
    if (id === 'editCultures') {
      editCultures();
    }
    if (id === 'editScale' || id === 'editScaleCountries' || id === 'editScaleBurgs') {
      editScale();
    }
    if (id === 'countriesManually') {
      customization = 2;
      tip('Click to select a country, drag the circle to re-assign', true);
      mockRegions();
      const temp = regions.append('g').attr('id', 'temp');
      $('#countriesBottom').children().hide();
      $('#countriesManuallyButtons').show();
      // highlight capital cells as it's not allowed to change capital's state that way
      states.map((s) => {
        if (s.capital === 'neutral' || s.capital === 'select') {
          return;
        }
        const capital = s.capital;
        const index = manors[capital].cell;
        temp.append('path')
          .attr('data-cell', index).attr('data-state', s.i)
          .attr('d', `M${polygons[index].join('L')}Z`)
          .attr('fill', s.color)
          .attr('stroke', 'red')
          .attr('stroke-width', 0.7);
      });
      viewbox.style('cursor', 'crosshair').call(drag).on('click', changeSelectedOnClick);
    }
    if (id === 'countriesRegenerate') {
      customization = 3;
      tip('Manually change "Expansion" value for a country or click on "Randomize" button', true);
      mockRegions();
      regions.append('g').attr('id', 'temp');
      $('#countriesBottom').children().hide();
      $('#countriesRegenerateButtons').show();
      $('.statePower, .icon-resize-full, .stateCells, .icon-check-empty').toggleClass('hidden');
      $('div[data-sortby=\'expansion\'],div[data-sortby=\'cells\']').toggleClass('hidden');
    }
    if (id === 'countriesManuallyComplete') {
      debug.selectAll('.circle').remove();
      const changedCells = regions.select('#temp').selectAll('path');
      let changedStates = [];
      changedCells.each(function () {
        const el = d3.select(this);
        const cell = +el.attr('data-cell');
        let stateOld = cells[cell].region;
        if (stateOld === 'neutral') {
          stateOld = states.length - 1;
        }
        const stateNew = +el.attr('data-state');
        const region = states[stateNew].color === 'neutral' ? 'neutral' : stateNew;
        cells[cell].region = region;
        if (cells[cell].manor !== undefined) {
          manors[cells[cell].manor].region = region;
        }
        changedStates.push(stateNew, stateOld);
      });
      changedStates = [...new Set(changedStates)];
      changedStates.map((s) => {
        recalculateStateData(s);
      });
      const last = states.length - 1;
      if (states[last].capital === 'neutral' && states[last].cells === 0) {
        $(`#state${last}`).remove();
        states.splice(-1);
      }
      $('#countriesManuallyCancel').click();
      if (changedStates.length) {
        editCountries();
      }
    }
    if (id === 'countriesManuallyCancel') {
      redrawRegions();
      debug.selectAll('.circle').remove();
      if (grid.style('display') === 'inline') {
        toggleGrid.click();
      }
      if (labels.style('display') === 'none') {
        toggleLabels.click();
      }
      $('#countriesBottom').children().show();
      $('#countriesManuallyButtons, #countriesRegenerateButtons').hide();
      $('.selected').removeClass('selected');
      $('div[data-sortby=\'expansion\'],.statePower, .icon-resize-full').addClass('hidden');
      $('div[data-sortby=\'cells\'],.stateCells, .icon-check-empty').removeClass('hidden');
      customization = 0;
      restoreDefaultEvents();
    }
    if (id === 'countriesApply') {
      $('#countriesManuallyCancel').click();
    }
    if (id === 'countriesRandomize') {
      const mod = +powerInput.value * 2;
      $('.statePower').each(function (e, i) {
        const state = +(this.parentNode.id).slice(5);
        if (states[state].capital === 'neutral') {
          return;
        }
        const power = rn(Math.random() * mod / 2 + 1, 1);
        $(this).val(power);
        $(this).parent().attr('data-expansion', power);
        states[state].power = power;
      });
      regenerateCountries();
    }
    if (id === 'countriesAddM' || id === 'countriesAddR' || id === 'countriesAddG') {
      let i = states.length;
      // move neutrals to the last line
      if (states[i - 1].capital === 'neutral') {
        states[i - 1].i = i;
        i -= 1;
      }
      const name = generateStateName(0);
      const color = colors20(i);
      states.push({
        i,
        color,
        name,
        capital: 'select',
        cells: 0,
        burgs: 0,
        urbanPopulation: 0,
        ruralPopulation: 0,
        area: 0,
        power: 1
      });
      states.sort((a, b) => a.i - b.i);
      editCountries();
    }
    if (id === 'countriesRegenerateNames') {
      const editor = d3.select('#countriesBody');
      states.forEach((s) => {
        if (s.capital === 'neutral') {
          return;
        }
        s.name = generateStateName(s.i);
        labels.select(`#regionLabel${s.i}`).text(s.name);
        editor.select(`#state${s.i}`).select('.stateName').attr('value', s.name);
      });
    }
    if (id === 'countriesPercentage') {
      var el = $('#countriesEditor');
      if (el.attr('data-type') === 'absolute') {
        el.attr('data-type', 'percentage');
        const totalCells = land.length;
        const totalBurgs = +countriesFooterBurgs.innerHTML;
        let totalArea = countriesFooterArea.innerHTML;
        totalArea = getInteger(totalArea.split(' ')[0]);
        const totalPopulation = getInteger(countriesFooterPopulation.innerHTML);
        $('#countriesBody > .states').each(function () {
          const cells = rn($(this).attr('data-cells') / totalCells * 100);
          const burgs = rn($(this).attr('data-burgs') / totalBurgs * 100);
          const area = rn($(this).attr('data-area') / totalArea * 100);
          const population = rn($(this).attr('data-population') / totalPopulation * 100);
          $(this).children().filter('.stateCells').text(`${cells}%`);
          $(this).children().filter('.stateBurgs').text(`${burgs}%`);
          $(this).children().filter('.stateArea').text(`${area}%`);
          $(this).children().filter('.statePopulation').val(`${population}%`);
        });
      } else {
        el.attr('data-type', 'absolute');
        editCountries();
      }
    }
    if (id === 'countriesExport') {
      if ($('.statePower').length === 0) {
        return;
      }
      const unit = areaUnit.value === 'square' ? `${distanceUnit.value}2` : areaUnit.value;
      let data = `Country,Capital,Cells,Burgs,Area (${unit}),Population\n`; // countries headers
      $('#countriesBody > .states').each(function () {
        const country = $(this).attr('data-country');
        if (country === 'bottom') {
          data += 'neutral,';
        } else {
          data += `${country},`;
        }
        const capital = $(this).attr('data-capital');
        if (capital === 'bottom' || capital === 'select') {
          data += ',';
        } else {
          data += `${capital},`;
        }
        data += `${$(this).attr('data-cells')},`;
        data += `${$(this).attr('data-burgs')},`;
        data += `${$(this).attr('data-area')},`;
        const population = +$(this).attr('data-population');
        data += `${population}\n`;
      });
      data += '\nBurg,Country,Culture,Population\n'; // burgs headers
      manors.map((m) => {
        if (m.region === 'removed') {
          return;
        } // skip removed burgs
        data += `${m.name},`;
        const country = m.region === 'neutral' ? 'neutral' : states[m.region].name;
        data += `${country},`;
        data += `${cultures[m.culture].name},`;
        const population = m.population * urbanization.value * populationRate.value * 1000;
        data += `${population}\n`;
      });
      const dataBlob = new Blob([data], {
        type: 'text/plain'
      });
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      document.body.appendChild(link);
      link.download = `countries_data${Date.now()}.csv`;
      link.href = url;
      link.click();
      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 2000);
    }

    if (id === 'burgNamesImport') {
      burgsListToLoad.click();
    }

    if (id === 'removeCountries') {
      alertMessage.innerHTML = 'Are you sure you want remove all countries?';
      $('#alert').dialog({
        resizable: false,
        title: 'Remove countries',
        buttons: {
          Cancel() {
            $(this).dialog('close');
          },
          Remove() {
            $(this).dialog('close');
            $('#countriesBody').empty();
            manors.map((m) => {
              m.region = 'neutral';
            });
            land.map((l) => {
              l.region = 'neutral';
            });
            states.map((s) => {
              const c = +s.capital;
              if (isNaN(c)) {
                return;
              }
              moveBurgToGroup(c, 'towns');
            });
            removeAllLabelsInGroup('countries');
            regions.selectAll('path').remove();
            states = [];
            states.push({
              i: 0,
              color: 'neutral',
              capital: 'neutral',
              name: 'Neutrals'
            });
            recalculateStateData(0);
            if ($('#burgsEditor').is(':visible')) {
              $('#burgsEditor').dialog('close');
            }
            editCountries();
          }
        }
      });
    }
    if (id === 'removeBurgs') {
      alertMessage.innerHTML = 'Are you sure you want to remove all burgs associated with the country?';
      $('#alert').dialog({
        resizable: false,
        title: 'Remove associated burgs',
        buttons: {
          Cancel() {
            $(this).dialog('close');
          },
          Remove() {
            $(this).dialog('close');
            const state = +$('#burgsEditor').attr('data-state');
            const region = states[state].capital === 'neutral' ? 'neutral' : state;
            $('#burgsBody').empty();
            manors.map((m) => {
              if (m.region !== region) {
                return;
              }
              m.region = 'removed';
              cells[m.cell].manor = undefined;
              labels.select(`[data-id='${m.i}']`).remove();
              icons.selectAll(`[data-id='${m.i}']`).remove();
            });
            states[state].urbanPopulation = 0;
            states[state].burgs = 0;
            states[state].capital = 'select';
            if ($('#countriesEditor').is(':visible')) {
              editCountries();
              $('#burgsEditor').dialog('moveToTop');
            }
            burgsFooterBurgs.innerHTML = 0;
            burgsFooterPopulation.value = 0;
          }
        }
      });
    }
    if (id === 'changeCapital') {
      if ($(this).hasClass('pressed')) {
        $(this).removeClass('pressed');
      } else {
        $('.pressed').removeClass('pressed');
        $(this).addClass('pressed');
      }
    }
    if (id === 'regenerateBurgNames') {
      const s = +$('#burgsEditor').attr('data-state');
      $('.burgName').each(function (e, i) {
        const b = +(this.parentNode.id).slice(5);
        const name = generateName(manors[b].culture);
        $(this).val(name);
        $(this).parent().attr('data-burg', name);
        manors[b].name = name;
        labels.select(`[data-id='${b}']`).text(name);
      });
      if ($('#countriesEditor').is(':visible')) {
        if (states[s].capital === 'neutral') {
          return;
        }
        const c = states[s].capital;
        $(`#state${s}`).attr('data-capital', manors[c].name);
        $(`#state${s} > .stateCapital`).val(manors[c].name);
      }
    }
    if (id === 'burgAdd') {
      const state = +$('#burgsEditor').attr('data-state');
      clickToAdd(); // to load on click event function
      $('#addBurg').click().attr('data-state', state);
    }
    if (id === 'toggleScaleBar') {
      $('#scaleBar').toggleClass('hidden');
    }
    if (id === 'addRuler') {
      $('#ruler').show();
      const rulerNew = ruler.append('g').attr('class', 'linear').call(d3.drag().on('start', elementDrag));
      const factor = rn(1 / Math.pow(scale, 0.3), 1);
      const y = Math.floor(Math.random() * graphHeight * 0.5 + graphHeight * 0.25);
      const x1 = graphWidth * 0.2,
        x2 = graphWidth * 0.8;
      const dash = rn(30 / distanceScale.value, 2);
      rulerNew.append('line').attr('x1', x1).attr('y1', y).attr('x2', x2)
        .attr('y2', y)
        .attr('class', 'white')
        .attr('stroke-width', factor);
      rulerNew.append('line').attr('x1', x1).attr('y1', y).attr('x2', x2)
        .attr('y2', y)
        .attr('class', 'gray')
        .attr('stroke-width', factor)
        .attr('stroke-dasharray', dash);
      rulerNew.append('circle').attr('r', 2 * factor).attr('stroke-width', 0.5 * factor).attr('cx', x1)
        .attr('cy', y)
        .attr('data-edge', 'left')
        .call(d3.drag().on('drag', rulerEdgeDrag));
      rulerNew.append('circle').attr('r', 2 * factor).attr('stroke-width', 0.5 * factor).attr('cx', x2)
        .attr('cy', y)
        .attr('data-edge', 'rigth')
        .call(d3.drag().on('drag', rulerEdgeDrag));
      rulerNew.append('circle').attr('r', 1.2 * factor).attr('stroke-width', 0.3 * factor).attr('cx', graphWidth / 2)
        .attr('cy', y)
        .attr('class', 'center')
        .call(d3.drag().on('start', rulerCenterDrag));
      const dist = rn(x2 - x1);
      const label = `${rn(dist * distanceScale.value)} ${distanceUnit.value}`;
      rulerNew.append('text').attr('x', graphWidth / 2).attr('y', y).attr('dy', -1)
        .attr('data-dist', dist)
        .text(label)
        .text(label)
        .on('click', removeParent)
        .attr('font-size', 10 * factor);
      return;
    }
    if (id === 'addOpisometer' || id === 'addPlanimeter') {
      if ($(this).hasClass('pressed')) {
        restoreDefaultEvents();
        $(this).removeClass('pressed');
      } else {
        $(this).addClass('pressed');
        viewbox.style('cursor', 'crosshair').call(drag);
      }
      return;
    }
    if (id === 'removeAllRulers') {
      if ($('#ruler > g').length < 1) {
        return;
      }
      alertMessage.innerHTML = 'Are you sure you want to remove all placed rulers?';
      $('#alert').dialog({
        resizable: false,
        title: 'Remove all rulers',
        buttons: {
          Remove() {
            $(this).dialog('close');
            $('#ruler > g').remove();
          },
          Cancel() {
            $(this).dialog('close');
          }
        }
      });
      return;
    }
    if (id === 'editHeightmap') {
      $('#customizeHeightmap').slideToggle();
    }
    if (id === 'fromScratch') {
      alertMessage.innerHTML = 'Are you sure you want to clear the map? All progress will be lost';
      $('#alert').dialog({
        resizable: false,
        title: 'Clear map',
        buttons: {
          Clear() {
            closeDialogs();
            undraw();
            placePoints();
            calculateVoronoi(points);
            detectNeighbors('grid');
            drawScaleBar();
            customizeHeightmap();
            openBrushesPanel();
            $(this).dialog('close');
          },
          Cancel() {
            $(this).dialog('close');
          }
        }
      });
    }
    if (id === 'fromHeightmap') {
      const message = `Hightmap is a basic element on which secondary data (rivers, burgs, countries etc) is based.
    If you want to significantly change the hightmap, it may be better to clean up all the secondary data
    and let the system to re-generate it based on the updated hightmap. In case of minor changes, you can keep the data.
    Newly added lands will be considered as neutral. Burgs located on a removed land cells will be deleted.
    Rivers and small lakes will be re-gerenated based on updated heightmap. Routes won't be regenerated.`;
      alertMessage.innerHTML = message;
      $('#alert').dialog({
        resizable: false,
        title: 'Edit Heightmap',
        buttons: {
          'Clean up': function () {
            editHeightmap('clean');
            $(this).dialog('close');
          },
          Keep() {
            $(this).dialog('close');
            editHeightmap('keep');
          },
          Cancel() {
            $(this).dialog('close');
          }
        }
      });
      return;
    }
    // heightmap customization buttons
    if (customization === 1) {
      if (id === 'paintBrushes') {
        openBrushesPanel();
      }
      if (id === 'rescaleExecute') {
        const subject = `${rescaleLower.value}-${rescaleHigher.value}`;
        const sign = conditionSign.value;
        const modifier = rescaleModifier.value;
        if (sign === '×') {
          modifyHeights(subject, 0, +modifier);
        }
        if (sign === '÷') {
          modifyHeights(subject, 0, (1 / modifier));
        }
        if (sign === '+') {
          modifyHeights(subject, +modifier, 1);
        }
        if (sign === '-') {
          modifyHeights(subject, (-1 * modifier), 1);
        }
        if (sign === '^') {
          modifyHeights(subject, 0, `^${modifier}`);
        }
        updateHeightmap();
        updateHistory();
      }
      if (id === 'rescaleButton') {
        $('#modifyButtons').children().not('#rescaleButton, .condition').toggle();
      }
      if (id === 'rescaleCondButton') {
        $('#modifyButtons').children().not('#rescaleCondButton, #rescaler').toggle();
      }
      if (id === 'undo' || id === 'templateUndo') {
        restoreHistory(historyStage - 1);
      }
      if (id === 'redo' || id === 'templateRedo') {
        restoreHistory(historyStage + 1);
      }
      if (id === 'smoothHeights') {
        smoothHeights(4);
        updateHeightmap();
        updateHistory();
      }
      if (id === 'disruptHeights') {
        disruptHeights();
        updateHeightmap();
        updateHistory();
      }
      if (id === 'getMap') {
        getMap();
      }
      if (id === 'applyTemplate') {
        if ($('#templateEditor').is(':visible')) {
          return;
        }
        $('#templateEditor').dialog({
          title: 'Template Editor',
          minHeight: 'auto',
          width: 'auto',
          resizable: false,
          position: {
            my: 'right top',
            at: 'right-10 top+10',
            of: 'svg'
          }
        });
      }
      if (id === 'convertImage') {
        convertImage();
      }
      if (id === 'convertImageGrid') {
        $('#grid').fadeToggle();
      }
      if (id === 'convertImageHeights') {
        $('#landmass').fadeToggle();
      }
      if (id === 'perspectiveView') {
        if ($('#perspectivePanel').is(':visible')) {
          return;
        }
        $('#perspectivePanel').dialog({
          title: 'Perspective View',
          width: 520,
          height: 190,
          position: {
            my: 'center center',
            at: 'center center',
            of: 'svg'
          }
        });
        drawPerspective();
        return;
      }
    }
    if (id === 'restoreStyle') {
      alertMessage.innerHTML = 'Are you sure you want to restore default style?';
      $('#alert').dialog({
        resizable: false,
        title: 'Restore style',
        buttons: {
          Restore() {
            applyDefaultStyle();
            $(this).dialog('close');
          },
          Cancel() {
            $(this).dialog('close');
          }
        }
      });
    }
    if (parent === 'mapFilters') {
      $('svg').attr('filter', '');
      if ($(this).hasClass('pressed')) {
        $('#mapFilters .pressed').removeClass('pressed');
      } else {
        $('#mapFilters .pressed').removeClass('pressed');
        $(this).addClass('pressed');
        $('svg').attr('filter', `url(#filter-${id})`);
      }
      return;
    }
    if (id === 'updateFullscreen') {
      mapWidthInput.value = window.innerWidth;
      mapHeightInput.value = window.innerHeight;
      localStorage.removeItem('mapHeight');
      localStorage.removeItem('mapWidth');
      changeMapSize();
    }
    if (id === 'zoomExtentDefault') {
      zoomExtentMin.value = 1;
      zoomExtentMax.value = 20;
      zoom.scaleExtent([1, 20]).scaleTo(svg, 1);
    }
    if (id === 'saveButton') {
      $('#saveDropdown').slideToggle();
    }
    if (id === 'loadMap') {
      mapToLoad.click();
    }
    if (id === 'zoomReset') {
      resetZoom(1000);
    }
    if (id === 'zoomPlus') {
      scale += 1;
      if (scale > 40) {
        scale = 40;
      }
      invokeActiveZooming();
    }
    if (id === 'zoomMinus') {
      scale -= 1;
      if (scale <= 1) {
        scale = 1;
        viewX = 0;
        viewY = 0;
      }
      invokeActiveZooming();
    }
    if (id === 'styleFontPlus' || id === 'styleFontMinus') {
      var el = viewbox.select(`#${styleElementSelect.value}`);
      const mod = id === 'styleFontPlus' ? 1.1 : 0.9;
      el.selectAll('g').each(function () {
        const el = d3.select(this);
        let size = rn(el.attr('data-size') * mod, 2);
        if (size < 2) {
          size = 2;
        }
        el.attr('data-size', size).attr('font-size', rn((size + (size / scale)) / 2, 2));
      });
      invokeActiveZooming();
      return;
    }
    if (id === 'brushClear') {
      if (customization === 1) {
        const message = 'Are you sure you want to clear the map?';
        alertMessage.innerHTML = message;
        $('#alert').dialog({
          resizable: false,
          title: 'Clear map',
          buttons: {
            Clear() {
              $(this).dialog('close');
              viewbox.style('cursor', 'crosshair').call(drag);
              landmassCounter.innerHTML = '0';
              $('#landmass').empty();
              heights = new Uint8Array(heights.length);
              // clear history
              history = [];
              historyStage = 0;
              updateHistory();
              redo.disabled = templateRedo.disabled = true;
              undo.disabled = templateUndo.disabled = true;
            },
            Cancel() {
              $(this).dialog('close');
            }
          }
        });
      } else {
        start.click();
      }
    }
    if (id === 'templateComplete') {
      getMap();
    }
    if (id === 'convertColorsMinus') {
      var current = +convertColors.value - 1;
      if (current < 4) {
        current = 3;
      }
      convertColors.value = current;
      heightsFromImage(current);
    }
    if (id === 'convertColorsPlus') {
      var current = +convertColors.value + 1;
      if (current > 255) {
        current = 256;
      }
      convertColors.value = current;
      heightsFromImage(current);
    }
    if (id === 'convertOverlayButton') {
      $('#convertImageButtons').children().not(this).not('#convertColors')
        .toggle();
    }
    if (id === 'convertAutoLum') {
      autoAssing('lum');
    }
    if (id === 'convertAutoHue') {
      autoAssing('hue');
    }
    if (id === 'convertComplete') {
      completeConvertion();
    }
  });

  // support save options
  $('#saveDropdown > div').click(() => {
    const id = this.id;
    const dns_allow_popup_message = localStorage.getItem('dns_allow_popup_message');
    if (!dns_allow_popup_message) {
      localStorage.clear();
      let message = 'Generator uses pop-up window to download files. ';
      message += 'Please ensure your browser does not block popups. ';
      message += 'Please check browser settings and turn off adBlocker if it is enabled';
      alertMessage.innerHTML = message;
      $('#alert').dialog({
        title: 'File saver. Please enable popups!',
        buttons: {
          'Don\'t show again': function () {
            localStorage.setItem('dns_allow_popup_message', true);
            $(this).dialog('close');
          },
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
    }
    if (id === 'saveMap') {
      saveMap();
    }
    if (id === 'saveSVG') {
      saveAsImage('svg');
    }
    if (id === 'savePNG') {
      saveAsImage('png');
    }
    $('#saveDropdown').slideUp('fast');
  });

  // lock / unlock option randomization
  $('#options i[class^=\'icon-lock\']').click(() => {
    $(this).toggleClass('icon-lock icon-lock-open');
    const locked = +$(this).hasClass('icon-lock');
    $(this).attr('data-locked', locked);
    const option = (this.id).slice(4, -5).toLowerCase();
    const value = $(`#${option}Input`).val();
    if (locked) {
      localStorage.setItem(option, value);
    } else {
      localStorage.removeItem(option);
    }
  });

  // toggle off loading screen and on menus
  $('#loading, #initial').remove();
  svg.style('background-color', '#000000');
  $('#optionsContainer, #tooltip').show();
  if (localStorage.getItem('disable_click_arrow_tooltip')) {
    tooltip.innerHTML = '';
    tooltip.setAttribute('data-main', '');
    $('#optionsTrigger').removeClass('glow');
  }

  $('#optionsContainer').draggable({
    handle: '.drag-trigger',
    snap: 'svg',
    snapMode: 'both'
  });
  $('#mapLayers').sortable({
    items: 'li:not(.solid)',
    cancel: '.solid',
    update: moveLayer
  });
  $('#templateBody').sortable({
    items: 'div:not(div[data-type=\'Mountain\'])'
  });
  $('#mapLayers, #templateBody').disableSelection();

  $('#labelGroupButton').click(() => {
    $('#labelEditor > button').not(this).toggle();
    $('#labelGroupButtons').toggle();
  });

  // UI Button handlers
  $('.tab > button').on('click', () => {
    $('.tabcontent').hide();
    $('.tab > button').removeClass('active');
    $(this).addClass('active');
    const id = this.id;
    if (id === 'layoutTab') {
      $('#layoutContent').show();
    }
    if (id === 'styleTab') {
      $('#styleContent').show();
    }
    if (id === 'optionsTab') {
      $('#optionsContent').show();
    }
    if (id === 'customizeTab') {
      $('#customizeContent').show();
    }
    if (id === 'aboutTab') {
      $('#aboutContent').show();
    }
  });

  // re-load page with provided seed
  $('#optionsSeedGenerate').on('click', () => {
    if (optionsSeed.value == seed) {
      return;
    }
    seed = optionsSeed.value;
    const url = new URL(window.location.href);
    window.location.href = `${url.pathname}?seed=${seed}`;
  });

  // save dialog position if "stable" dialog window is dragged
  $('.stable').on('dialogdragstop', (event, ui) => {
    sessionStorage.setItem(this.id, [ui.offset.left, ui.offset.top]);
  });

  // restore saved dialog position on "stable" dialog window open
  $('.stable').on('dialogopen', (event, ui) => {
    let pos = sessionStorage.getItem(this.id);
    if (!pos) {
      return;
    }
    pos = pos.split(',');
    if (pos[0] > $(window).width() - 100 || pos[1] > $(window).width() - 40) {
      return;
    } // prevent showing out of screen
    const at = `left+${pos[0]} top+${pos[1]}`;
    $(this).dialog('option', 'position', {
      my: 'left top',
      at,
      of: 'svg'
    });
  });

  // Execute custom template
  $('#templateRun').on('click', () => {
    if (customization !== 1) {
      return;
    }
    const steps = $('#templateBody > div').length;
    if (!steps) {
      return;
    }
    heights = new Uint8Array(heights.length); // clean all heights
    for (let step = 1; step <= steps; step++) {
      const type = $(`#templateBody div:nth-child(${step})`).attr('data-type');
      if (type === 'Mountain') {
        addMountain();
        continue;
      }
      let count = $(`#templateBody div:nth-child(${step}) .templateElCount`).val();
      const dist = $(`#templateBody div:nth-child(${step}) .templateElDist`).val();
      if (count) {
        if (count[0] !== '-' && count.includes('-')) {
          const lim = count.split('-');
          count = Math.floor(Math.random() * (+lim[1] - +lim[0] + 1) + +lim[0]);
        } else {
          count = +count; // parse string
        }
      }
      if (type === 'Hill') {
        addHill(count, +dist);
      }
      if (type === 'Pit') {
        addPit(count);
      }
      if (type === 'Range') {
        addRange(count);
      }
      if (type === 'Trough') {
        addRange(-1 * count);
      }
      if (type === 'Strait') {
        addStrait(count);
      }
      if (type === 'Add') {
        modifyHeights(dist, count, 1);
      }
      if (type === 'Multiply') {
        modifyHeights(dist, 0, count);
      }
      if (type === 'Smooth') {
        smoothHeights(count);
      }
    }
    mockHeightmap();
    updateHistory();
  });

  // Save custom template as text file
  $('#templateSave').on('click', () => {
    const steps = $('#templateBody > div').length;
    let stepsData = '';
    for (let step = 1; step <= steps; step++) {
      const element = $(`#templateBody div:nth-child(${step})`);
      const type = element.attr('data-type');
      let count = $(`#templateBody div:nth-child(${step}) .templateElCount`).val();
      let dist = $(`#templateBody div:nth-child(${step}) .templateElDist`).val();
      if (!count) {
        count = '0';
      }
      if (!dist) {
        dist = '0';
      }
      stepsData += `${type} ${count} ${dist}\r\n`;
    }
    const dataBlob = new Blob([stepsData], {
      type: 'text/plain'
    });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `template_${Date.now()}.txt`;
    link.href = url;
    link.click();
    $('#templateBody').attr('data-changed', 0);
  });

  // Load custom template as text file
  $('#templateLoad').on('click', () => {
    templateToLoad.click();
  });
  $('#templateToLoad').change(() => {
    const fileToLoad = this.files[0];
    this.value = '';
    const fileReader = new FileReader();
    fileReader.onload = function (fileLoadedEvent) {
      const dataLoaded = fileLoadedEvent.target.result;
      const data = dataLoaded.split('\r\n');
      $('#templateBody').empty();
      if (data.length > 0) {
        $('#templateBody').attr('data-changed', 1);
        $('#templateSelect').attr('data-prev', 'templateCustom').val('templateCustom');
      }
      for (let i = 0; i < data.length; i++) {
        const line = data[i].split(' ');
        addStep(line[0], line[1], line[2]);
      }
    };
    fileReader.readAsText(fileToLoad, 'UTF-8');
  });

  // Load image to convert
  $('#convertImageLoad').on('click', () => {
    imageToLoad.click();
  });
  $('#imageToLoad').change(() => {
    console.time('loadImage');
    // set style
    resetZoom();
    grid.attr('stroke-width', 0.2);
    // load image
    const file = this.files[0];
    this.value = ''; // reset input value to get triggered if the same file is uploaded
    const reader = new FileReader();
    const img = new Image();
    // draw image
    img.onload = function () {
      ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
      heightsFromImage(+convertColors.value);
      console.timeEnd('loadImage');
    };
    reader.onloadend = function () {
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  // templateSelect on change listener
  $('#templateSelect').on('input', () => {
    const steps = $('#templateBody > div').length;
    const changed = +$('#templateBody').attr('data-changed');
    const template = this.value;
    if (steps && changed === 1) {
      alertMessage.innerHTML = 'Are you sure you want to change the base template? All the changes will be lost.';
      $('#alert').dialog({
        resizable: false,
        title: 'Change Template',
        buttons: {
          Change() {
            changeTemplate(template);
            $(this).dialog('close');
          },
          Cancel() {
            const prev = $('#templateSelect').attr('data-prev');
            $('#templateSelect').val(prev);
            $(this).dialog('close');
          }
        }
      });
    }
    if (steps === 0 || changed === 0) {
      changeTemplate(template);
    }
  });

  // templateEditor Button handlers
  $('#templateTools > button').on('click', () => {
    let id = this.id;
    id = id.replace('template', '');
    if (id === 'Mountain') {
      const steps = $('#templateBody > div').length;
      if (steps > 0) {
        return;
      }
    }
    $('#templateBody').attr('data-changed', 1);
    $('#templateBody').append(`<div data-type="${id}">${id}</div>`);
    const el = $('#templateBody div:last-child');
    if (id === 'Hill' || id === 'Pit' || id === 'Range' || id === 'Trough') {
      var count = '<label>count:<input class="templateElCount" onmouseover="tip(\'Blobs to add\')" type="number" value="1" min="1" max="99"></label>';
    }
    if (id === 'Hill') {
      var dist = '<label>distribution:<input class="templateElDist" onmouseover="tip(\'Set blobs distribution. 0.5 - map center; 0 - any place\')" type="number" value="0.25" min="0" max="0.5" step="0.01"></label>';
    }
    if (id === 'Add' || id === 'Multiply') {
      var dist = '<label>to:<select class="templateElDist" onmouseover="tip(\'Change only land or all cells\')"><option value="all" selected>all cells</option><option value="land">land only</option><option value="interval">interval</option></select></label>';
    }
    if (id === 'Add') {
      var count = '<label>value:<input class="templateElCount" onmouseover="tip(\'Add value to height of all cells (negative values are allowed)\')" type="number" value="-10" min="-100" max="100" step="1"></label>';
    }
    if (id === 'Multiply') {
      var count = '<label>by value:<input class="templateElCount" onmouseover="tip(\'Multiply all cells Height by the value\')" type="number" value="1.1" min="0" max="10" step="0.1"></label>';
    }
    if (id === 'Smooth') {
      var count = '<label>fraction:<input class="templateElCount" onmouseover="tip(\'Set smooth fraction. 1 - full smooth, 2 - half-smooth, etc.\')" type="number" min="1" max="10" value="2"></label>';
    }
    if (id === 'Strait') {
      var count = '<label>width:<input class="templateElCount" onmouseover="tip(\'Set strait width\')" value="1-7"></label>';
    }
    el.append('<span onmouseover="tip(\'Remove step\')" class="icon-trash-empty"></span>');
    $('#templateBody .icon-trash-empty').on('click', function () {
      $(this).parent().remove();
    });
    if (dist) {
      el.append(dist);
    }
    if (count) {
      el.append(count);
    }
    el.find('select.templateElDist').on('input', fireTemplateElDist);
    $('#templateBody').attr('data-changed', 1);
  });

  // handle DOM elements sorting on header click
  $('.sortable').on('click', () => {
    const el = $(this);
    // remove sorting for all siglings except of clicked element
    el.siblings().removeClass('icon-sort-name-up icon-sort-name-down icon-sort-number-up icon-sort-number-down');
    const type = el.hasClass('alphabetically') ? 'name' : 'number';
    let state = 'no';
    if (el.is('[class*=\'down\']')) {
      state = 'asc';
    }
    if (el.is('[class*=\'up\']')) {
      state = 'desc';
    }
    const sortby = el.attr('data-sortby');
    const list = el.parent().next(); // get list container element (e.g. "countriesBody")
    const lines = list.children('div'); // get list elements
    if (state === 'no' || state === 'asc') { // sort desc
      el.removeClass(`icon-sort-${type}-down`);
      el.addClass(`icon-sort-${type}-up`);
      lines.sort((a, b) => {
        let an = a.getAttribute(`data-${sortby}`);
        if (an === 'bottom') {
          return 1;
        }
        let bn = b.getAttribute(`data-${sortby}`);
        if (bn === 'bottom') {
          return -1;
        }
        if (type === 'number') {
          an = +an;
          bn = +bn;
        }
        if (an > bn) {
          return 1;
        }
        if (an < bn) {
          return -1;
        }
        return 0;
      });
    }
    if (state === 'desc') { // sort asc
      el.removeClass(`icon-sort-${type}-up`);
      el.addClass(`icon-sort-${type}-down`);
      lines.sort((a, b) => {
        let an = a.getAttribute(`data-${sortby}`);
        if (an === 'bottom') {
          return 1;
        }
        let bn = b.getAttribute(`data-${sortby}`);
        if (bn === 'bottom') {
          return -1;
        }
        if (type === 'number') {
          an = +an;
          bn = +bn;
        }
        if (an < bn) {
          return 1;
        }
        if (an > bn) {
          return -1;
        }
        return 0;
      });
    }
    lines.detach().appendTo(list);
  });

  // load text file with new burg names
  $('#burgsListToLoad').change(() => {
    const fileToLoad = this.files[0];
    this.value = '';
    const fileReader = new FileReader();
    fileReader.onload = function (fileLoadedEvent) {
      const dataLoaded = fileLoadedEvent.target.result;
      const data = dataLoaded.split('\r\n');
      if (data.length === 0) {
        return;
      }
      const change = [];
      let message = 'Burgs will be renamed as below. Please confirm';
      message += '<div class="overflow-div"><table class="overflow-table"><tr><th>Id</th><th>Current name</th><th>New Name</th></tr>';
      for (let i = 0; i < data.length && i < manors.length; i++) {
        const v = data[i];
        if (v === '' || v === undefined) {
          continue;
        }
        if (v === manors[i].name) {
          continue;
        }
        change.push({
          i,
          name: v
        });
        message += `<tr><td style="width:20%">${i}</td><td style="width:40%">${manors[i].name}</td><td style="width:40%">${v}</td></tr>`;
      }
      message += '</tr></table></div>';
      alertMessage.innerHTML = message;
      $('#alert').dialog({
        title: 'Burgs bulk renaming',
        position: {
          my: 'center',
          at: 'center',
          of: 'svg'
        },
        buttons: {
          Cancel() {
            $(this).dialog('close');
          },
          Confirm() {
            for (let i = 0; i < change.length; i++) {
              const id = change[i].i;
              manors[id].name = change[i].name;
              labels.select(`[data-id='${id}']`).text(change[i].name);
            }
            $(this).dialog('close');
            updateCountryEditors();
          }
        }
      });
    };
    fileReader.readAsText(fileToLoad, 'UTF-8');
  });

  // fit full-screen map if window is resized
  $(window).resize((e) => {
    // trick to prevent resize on download bar opening
    if (autoResize === false) {
      return;
    }
    mapWidthInput.value = window.innerWidth;
    mapHeightInput.value = window.innerHeight;
    changeMapSize();
  });
}

export default fantasyMap;
