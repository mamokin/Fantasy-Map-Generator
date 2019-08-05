// eslint-disable

// Fantasy Map Generator main script
// Azgaar (maxganiev@yandex.com). Minsk, 2017-2018
// https://github.com/Azgaar/Fantasy-Map-Generator
// GNU General Public License v3.0

// To programmers:
// I don't mind of any help with programming
// I know the code is badly structurized and it's hard to read it as a single page
// Meanwhile a core part takes only 300-500 lines

// What should be done generally:
// Refactor the code
// Modernize the code (ES6)
// Optimize the code
// Modulize the code

// And particularry:
// Migrate from d3-voronoi to mapbox-delunator or d3-delaunay
// Use typed arrays instead of array of objects
// Get rid of jQuery as d3.js can almost all the same and more
// Re-build UI on reactive approach, vue.js

// 'use strict';
import * as d3 from 'd3';
import $ from 'jquery';
import {fantasyMap} from './FantasyMap';
import {tooltip} from './Utility/DOMVariables';

export default function tip(tip, main, error) {
  const tooltip = d3.select('#tooltip');
  const reg = 'linear-gradient(0.1turn, #ffffff00, #5e5c5c4d, #ffffff00)';
  const red = 'linear-gradient(0.1turn, #ffffff00, #c71d1d66, #ffffff00)';
  tooltip.text(tip).style('background', error ? red : reg);
  if (main) {
    tooltip.attr('data-main', tip);
  }
}

fantasyMap();

window.tip = tip;

$('#optionsContainer *').on('mouseout', () => {
  tooltip.innerHTML = tooltip.getAttribute('data-main');
});
