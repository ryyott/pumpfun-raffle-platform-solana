import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useRainPoolStore = defineStore('rainPool', () => {
  // Core pool state
  const currentPool = ref(null)
  const participants = ref([])
  const poolHistory = ref([])

  // Rolling state
  const isRolling = ref(false)
  const isJoining = ref(false)
  const selectedWinnerIndex = ref(null)
  const selectedWinner = ref(null)

  // Timer state
  const remainingSeconds = ref(0)
  const totalTimeSeconds = ref(1800) // 30 minutes default (matches edge function)
  const progressPercentage = ref(0)

  // Admin controls
  const isAdminPaused = ref(false)
  const adminPauseReason = ref(null)

  // Loading states
  const isLoadingMarketCap = ref(true)
  const isLoadingParticipants = ref(false)
  const isLoadingBalances = ref(false)
  const isLoadingUserData = ref(false)
  const isCreatingPool = ref(false)

  // Modals
  const showWinnerModal = ref(false)
  const winnerModalData = ref(null)
  const showHistory = ref(false)
  const showPoolDetailsModal = ref(false)
  const selectedPoolDetails = ref(null)
  const poolDetailsWinners = ref([])
  const loadingPoolDetails = ref(false)
  const showUserModal = ref(false)
  const showTicketCalculator = ref(false)
  const showTwitterBonusModal = ref(false)

  // Twitter bonus state
  const twitterBonusEligible = ref(false)
  const twitterBonusClaimed = ref(false)

  // Payout failure state
  const showPayoutFailureModal = ref(false)
  const payoutFailureData = ref(null)

  // Replay state
  const showReplayModal = ref(false)
  const replayPool = ref(null)
  const replayParticipants = ref([])
  const replayWinners = ref([])
  const isReplaying = ref(false)
  const loadingReplay = ref(false)

  // Proof modal state
  const showProofModal = ref(false)

  // Toast notifications
  const toasts = ref([])

  // User cache
  const userInfoCache = ref(new Map())

  // Token price
  const tokenPriceUsd = ref(null)

  // Computed
  const winnerCount = computed(() => {
    const marketCap = currentPool.value?.market_cap || 0
    if (marketCap < 5000) return 1
    if (marketCap < 100000) return 1
    if (marketCap < 500000) return 2
    if (marketCap < 1000000) return 5
    const additionalMillions = Math.floor((marketCap - 1000000) / 1000000)
    return 10 + (additionalMillions * 10)
  })

  const formattedMarketCap = computed(() => {
    const marketCap = currentPool.value?.market_cap || 0
    if (marketCap > 0) {
      return marketCap.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    }
    return '0'
  })

  const formattedPoolGiveaway = computed(() => {
    const prize = currentPool.value?.total_prize_sol || currentPool.value?.total_payout_sol || 0
    return prize.toFixed(4)
  })

  const totalBurnedUsd = computed(() => {
    return participants.value.reduce((sum, p) => sum + (p.burn_amount_usd || 0), 0)
  })

  // Actions
  function addToast(message, type = 'info', duration = 3000) {
    const id = `toast-${Date.now()}-${Math.random()}`
    toasts.value.push({ id, message, type, duration })

    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  function removeToast(id) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  function setCurrentPool(pool) {
    currentPool.value = pool

    // Set token price from pool data
    if (pool?.token_price_usd) {
      tokenPriceUsd.value = pool.token_price_usd
    } else {
      console.warn('⚠️ No token_price_usd in pool data')
    }

    isLoadingMarketCap.value = false
  }

  function setParticipants(newParticipants) {
    participants.value = newParticipants
  }

  function addParticipant(participant) {
    const exists = participants.value.some(p => p.address === participant.address)
    if (!exists) {
      participants.value.push(participant)
    }
  }

  function updateParticipant(address, updates) {
    const index = participants.value.findIndex(p => p.address === address)
    if (index !== -1) {
      participants.value[index] = { ...participants.value[index], ...updates }
    }
  }

  function resetPool() {
    currentPool.value = null
    participants.value = []
    isRolling.value = false
    selectedWinnerIndex.value = null
    selectedWinner.value = null
    remainingSeconds.value = 0
    progressPercentage.value = 0
  }

  function setWinnerModal(show, data = null) {
    showWinnerModal.value = show
    winnerModalData.value = data
  }

  return {
    // State
    currentPool,
    participants,
    poolHistory,
    isRolling,
    isJoining,
    selectedWinnerIndex,
    selectedWinner,
    remainingSeconds,
    totalTimeSeconds,
    progressPercentage,
    isAdminPaused,
    adminPauseReason,
    isLoadingMarketCap,
    isLoadingParticipants,
    isLoadingBalances,
    isLoadingUserData,
    isCreatingPool,
    showWinnerModal,
    winnerModalData,
    showHistory,
    showPoolDetailsModal,
    selectedPoolDetails,
    poolDetailsWinners,
    loadingPoolDetails,
    showUserModal,
    showTicketCalculator,
    showTwitterBonusModal,
    twitterBonusEligible,
    twitterBonusClaimed,
    showPayoutFailureModal,
    payoutFailureData,
    showReplayModal,
    replayPool,
    replayParticipants,
    replayWinners,
    isReplaying,
    loadingReplay,
    showProofModal,
    toasts,
    userInfoCache,
    tokenPriceUsd,

    // Computed
    winnerCount,
    formattedMarketCap,
    formattedPoolGiveaway,
    totalBurnedUsd,

    // Actions
    addToast,
    removeToast,
    setCurrentPool,
    setParticipants,
    addParticipant,
    updateParticipant,
    resetPool,
    setWinnerModal,
  }
})
