<div align="center">
</div>

<p align="center" color="#6a737d">
The boilerplate for making electron applications built with vue (pretty much what it sounds like).
</p>

<div align="center">

[![forthebadge](http://forthebadge.com/images/badges/built-with-love.svg)](http://forthebadge.com) [![forthebadge](http://forthebadge.com/images/badges/uses-js.svg)](http://forthebadge.com) [![forthebadge](http://forthebadge.com/images/badges/makes-people-smile.svg)](http://forthebadge.com)
</div>

<div align="center">

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

</div>

<details>
  <summary>
    Powered with Vuex + Electron (Open for more info)
  </summary>
  
  ## Boilerplate Overview
  The aim of this project is to remove the need of manually setting up electron apps using vue. electron-vue takes advantage of `vue-cli` for scaffolding, `webpack` with `vue-loader`, `electron-packager` or `electron-builder`, and some of the most used plugins like `vue-router`, `vuex`, and so much more.

  #### Check out the detailed documentation [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).

  Things you'll find in this boilerplate...

  * Basic project structure with a **single** `package.json` setup
  * Detailed [documentation](https://simulatedgreg.gitbooks.io/electron-vue/content/)
  * Project scaffolding using [vue-cli](https://github.com/vuejs/vue-cli)
  * Ready to use Vue plugins \([axios](https://github.com/mzabriskie/axios), [vue-electron](https://github.com/SimulatedGREG/vue-electron), [vue-router](https://github.com/vuejs/vue-router), [vuex](https://github.com/vuejs/vuex)\)\*
  * Installed [vue-devtools](https://github.com/vuejs/vue-devtools) and [devtron](https://github.com/electron/devtron) tools for development
  * Ability to easily package your electron app using [electron-packager](https://github.com/electron-userland/electron-packager) or [electron-builder](https://github.com/electron-userland/electron-builder)\*
  * `appveyor.yml` and `.travis.yml` configurations for automated deployments with [electron-builder](https://github.com/electron-userland/electron-builder)\*
  * Ability to produce web output for browsers
  * Handy [NPM scripts](https://simulatedgreg.gitbooks.io/electron-vue/content/en/npm_scripts.html)
  * Use of [webpack](https://github.com/webpack/webpack) and [vue-loader](https://github.com/vuejs/vue-loader) with Hot Module Replacement
  * Process restarting when working in main process
  * HTML/CSS/JS pre-processor support with [vue-loader](https://github.com/vuejs/vue-loader/)
  * ES6 with [`stage-0`](https://babeljs.io/docs/plugins/preset-stage-0/) by default
  * Use of [`babili`](https://github.com/babel/babili) to remove the need of transpiling completely down to ES5
  * ESLint \(with support for [`standard`](https://github.com/feross/standard) and [`airbnb-base`](https://github.com/airbnb/javascript)\)\*
  * Unit Testing \(with Karma + Mocha\)\*
  * End-to-end Testing \(with Spectron + Mocha\)\*

  \*Customizable during vue-cli scaffolding

  ### Getting Started

  This boilerplate was built as a template for [vue-cli](https://github.com/vuejs/vue-cli) and includes options to customize your final scaffolded app. The use of `node@^7` or higher required. electron-vue also officially recommends the [`yarn`](https://yarnpkg.org) package manager as it handles dependencies much better and can help reduce final build size with `yarn clean`.

  ```bash
  # Install vue-cli and scaffold boilerplate
  npm install -g vue-cli
  vue init simulatedgreg/electron-vue my-project

  # Install dependencies and run your app
  cd my-project
  yarn # or npm install
  yarn run dev # or npm run dev
  ```

  ##### Are you a Windows User?

  Make sure to check out [**A Note for Windows Users**](https://simulatedgreg.gitbooks.io/electron-vue/content/en/getting_started.html#a-note-for-windows-users) to make sure you have all the necessary build tools needed for electron and other dependencies.

  ##### Wanting to use Vue 1?

  Just point to the `1.0` branch. Please note that electron-vue has officially deprecated the usage of `vue@^1`, so project structure, features, and documentation will reflect those changes ([**legacy documentation**](https://github.com/SimulatedGREG/electron-vue/tree/1.0/docs)).

  ```bash
  vue init simulatedgreg/electron-vue#1.0 my-project
  ```

  ### Next Steps

  Make sure to take a look at the [documentation](https://simulatedgreg.gitbooks.io/electron-vue/content/). Here you will find useful information about configuration, project structure, and building your app. There's also a handy [FAQs](https://simulatedgreg.gitbooks.io/electron-vue/content/en/faqs.html) section.

</details>

# Fantasy Map Generator

Azgaar's _Fantasy Map Generator_. Online tool generating interactive svg maps based on [D3](https://d3js.org) voronoi diagram.

Project is under active development, check out the work in progress version [here](https://azgaar.github.io/Fantasy-Map-Generator). Refer to the [project wiki](https://github.com/Azgaar/Fantasy-Map-Generator/wiki) for a guidance. Some details are covered in my blog [_Fantasy Maps for fun and glory_](https://azgaar.wordpress.com), you may also keep an eye on my [Trello devboard](https://trello.com/b/7x832DG4/fantasy-map-generator).

[![alt tag](https://i0.wp.com/azgaar.files.wordpress.com/2017/03/80k-part.png)](https://azgaar.wordpress.com)

Join our [Reddit community](https://www.reddit.com/r/FantasyMapGenerator) to share the created maps, discuss the Generator, suggest ideas and get a most recent updates. You may also contact me directly via [email](mailto:maxganiev@yandex.com). For bug reports please use the project [issues page](https://github.com/Azgaar/Fantasy-Map-Generator/issues). If you face performance issues, please try to open the page in a small window and use the default graph size only. In Firefox fast map zooming may cause browser crush.

The desktop application (Electron) is [under development](https://github.com/mamokin/Fantasy-Map-Generator/tree/code-cleanup-from-boilerplate).

_Inspiration:_

* Martin O'Leary's [_Generating fantasy maps_](https://mewo2.com/notes/terrain)

* Amit Patel's [_Polygonal Map Generation for Games_](http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation)

* Scott Turner's [_Here Dragons Abound_](https://heredragonsabound.blogspot.com)
