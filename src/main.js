import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import en from '@/locale/en'
import '@/styles/index.scss'

// Services removed - simplified implementation

const messages = {
  en
}

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: 'en', // set locale
  messages, // set locale messages
})

const pinia = createPinia()

const app = createApp(App)

app.use(router)
app.use(i18n)
app.use(pinia)

console.log('🚀 Starting DROP website...')

app.mount('#app')
