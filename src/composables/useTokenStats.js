import { ref, onMounted, onUnmounted } from 'vue'
import { useRainPoolStore } from '@/stores/rainPool'

const STATS_ROTATION_INTERVAL = 60000 // 60 seconds between each stat display
const STATS_FETCH_INTERVAL = 60000 // Fetch fresh data every 60 seconds

export function useTokenStats() {
  const store = useRainPoolStore()

  const stats = ref({
    marketCap: null,
    tokenPrice: null,
    volume24h: null,
    holders: null
  })

  const currentStatIndex = ref(0)
  const isEnabled = ref(true)

  let rotationTimer = null
  let fetchTimer = null

  // Load user preference from localStorage
  const loadPreference = () => {
    const pref = localStorage.getItem('raindr0p_stats_toasts')
    if (pref !== null) {
      isEnabled.value = pref === 'true'
    }
  }

  // Save user preference to localStorage
  const toggleStatsToasts = (enabled) => {
    isEnabled.value = enabled
    localStorage.setItem('raindr0p_stats_toasts', String(enabled))

    if (enabled) {
      startRotation()
    } else {
      stopRotation()
    }
  }

  // Fetch latest stats from current pool or database
  const fetchStats = async () => {
    try {
      // Get current pool data which has market cap and token price
      const pool = store.currentPool

      if (pool) {
        stats.value.marketCap = pool.market_cap || null
        stats.value.tokenPrice = pool.token_price_usd || null
      }

      // TODO: Add volume and holders when available
      // For now, these would need additional Helius API calls or database tables
      stats.value.volume24h = null // Not implemented yet
      stats.value.holders = null // Not implemented yet

    } catch (error) {
      console.error('Error fetching token stats:', error)
    }
  }

  // Format currency values
  const formatCurrency = (value, decimals = 2) => {
    if (value === null || value === undefined) return null

    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    } else {
      return `$${value.toFixed(decimals)}`
    }
  }

  // Format holder count
  const formatHolders = (count) => {
    if (count === null || count === undefined) return null

    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toLocaleString()
  }

  // Show the current stat in rotation
  const showCurrentStat = () => {
    if (!isEnabled.value) return

    // Skip if any modal is open
    if (store.showWinnerModal ||
        store.showHistory ||
        store.showUserModal ||
        store.showTicketCalculator ||
        store.showTwitterBonusModal ||
        store.showPayoutFailureModal ||
        store.showReplayModal) {
      return
    }

    // Skip if pool is rolling
    if (store.isRolling) {
      return
    }

    const statsList = [
      {
        key: 'marketCap',
        emoji: '💰',
        label: 'Market Cap',
        formatter: (val) => formatCurrency(val, 0)
      },
      {
        key: 'tokenPrice',
        emoji: '📈',
        label: 'Token Price',
        formatter: (val) => formatCurrency(val, 6)
      },
      {
        key: 'volume24h',
        emoji: '📊',
        label: '24h Volume',
        formatter: (val) => formatCurrency(val, 2)
      },
      {
        key: 'holders',
        emoji: '👥',
        label: 'Holders',
        formatter: formatHolders
      }
    ]

    // Find next stat that has data
    let attempts = 0
    let stat = null

    while (attempts < statsList.length) {
      const currentStat = statsList[currentStatIndex.value]
      const value = stats.value[currentStat.key]

      if (value !== null && value !== undefined) {
        stat = currentStat
        break
      }

      // Move to next stat
      currentStatIndex.value = (currentStatIndex.value + 1) % statsList.length
      attempts++
    }

    // Show toast if we found a stat with data
    if (stat) {
      const value = stats.value[stat.key]
      const formattedValue = stat.formatter(value)

      store.addToast(
        `${stat.emoji} ${stat.label}: ${formattedValue}`,
        'stats',
        4000 // Show for 4 seconds
      )
    }

    // Move to next stat for next rotation
    currentStatIndex.value = (currentStatIndex.value + 1) % statsList.length
  }

  // Start the rotation timer
  const startRotation = () => {
    if (!isEnabled.value) return

    stopRotation() // Clear any existing timer

    // Show first stat immediately
    showCurrentStat()

    // Then show subsequent stats on interval
    rotationTimer = setInterval(() => {
      showCurrentStat()
    }, STATS_ROTATION_INTERVAL)
  }

  // Stop the rotation timer
  const stopRotation = () => {
    if (rotationTimer) {
      clearInterval(rotationTimer)
      rotationTimer = null
    }
  }

  // Start fetching stats periodically
  const startFetching = () => {
    // Fetch immediately
    fetchStats()

    // Then fetch on interval
    fetchTimer = setInterval(() => {
      fetchStats()
    }, STATS_FETCH_INTERVAL)
  }

  // Stop fetching stats
  const stopFetching = () => {
    if (fetchTimer) {
      clearInterval(fetchTimer)
      fetchTimer = null
    }
  }

  // Initialize on mount
  onMounted(() => {
    loadPreference()
    startFetching()

    if (isEnabled.value) {
      startRotation()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopRotation()
    stopFetching()
  })

  return {
    stats,
    isEnabled,
    toggleStatsToasts,
    fetchStats
  }
}
