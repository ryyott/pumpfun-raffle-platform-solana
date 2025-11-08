import { createRouter, createWebHistory } from 'vue-router'
import MainPage from '@/views/MainPage.view.vue'
import Documentation from '@/views/Documentation.view.vue'

const routes = [
  {
    path: '/',
    name: 'MainPage',
    component: MainPage
  },
  {
    path: '/rainpool',
    name: 'RainPool',
    component: MainPage
  },
  {
    path: '/about',
    name: 'About',
    component: MainPage
  },
  {
    path: '/tokenomics',
    name: 'Tokenomics',
    component: MainPage
  },
  {
    path: '/roadmap',
    name: 'Roadmap',
    component: MainPage
  },
  {
    path: '/contact',
    name: 'Contact',
    component: MainPage
  },
  {
    path: '/docs',
    name: 'Documentation',
    component: Documentation
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    // Return null to prevent default scroll behavior
    // We'll handle scrolling manually in the component
    return null
  }
})

export default router