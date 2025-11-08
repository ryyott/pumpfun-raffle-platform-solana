<template>
  <div id="app">
    <!-- Maintenance screen overlay -->
    <MaintenanceScreen
      v-if="showMaintenanceScreen"
      @authenticated="handleMaintenanceAuth"
    />

    <!-- Normal app content -->
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import MaintenanceScreen from '@/components/MaintenanceScreen.vue'
import { inject } from '@vercel/analytics'

// Initialize Vercel Analytics
inject()

export default {
  name: 'App',
  components: {
    MaintenanceScreen
  },
  setup() {
    const showMaintenanceScreen = ref(false)
    let checkInterval = null

    // Check if maintenance mode is active
    const checkMaintenanceMode = async () => {
      try {
        // Check if user has valid session
        const hasValidSession = sessionStorage.getItem('maintenance_auth')
        if (hasValidSession) {
          showMaintenanceScreen.value = false
          return
        }

        // Import SupabaseService dynamically
        const SupabaseService = await import('@/services/SupabaseService')
        const supabase = SupabaseService.default.getSupabaseClient()

        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to check maintenance mode:', error)
          return
        }

        showMaintenanceScreen.value = data?.value === 'true'
      } catch (error) {
        console.error('Error checking maintenance mode:', error)
      }
    }

    // Handle successful authentication
    const handleMaintenanceAuth = () => {
      showMaintenanceScreen.value = false
    }

    onMounted(() => {
      // Initial check
      checkMaintenanceMode()

      // Poll every 30 seconds to check if maintenance mode is toggled off
      checkInterval = setInterval(checkMaintenanceMode, 30000)
    })

    onUnmounted(() => {
      if (checkInterval) {
        clearInterval(checkInterval)
      }
    })

    return {
      showMaintenanceScreen,
      handleMaintenanceAuth
    }
  }
}
</script>
<style lang="scss">
#app {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  line-height: 1;
  background: #4CAEE0;
  min-height: 100vh;
}

.content {
  margin: 0;
  padding: 0;
  line-height: 0;
  background: #4CAEE0;
  
  > section {
    margin: 0 !important;
    padding: 0 !important;
    display: block;
    line-height: normal;
    width: 100vw;
    box-sizing: border-box;
  }
}
</style>