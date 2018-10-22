import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/map',
      name: 'map',
      component: require('@/components/Map/map').default
    },
    {
      path: '/',
      name: 'landing-page',
      component: require('@/components/LandingPage').default,
    },
    {
      path: '*',
      redirect: '/',
    },
    // {
    //   path: '/polygons',
    //   name: 'polygons',
    //   component: require('@/components/polygons').default
    // }
  ],
});
