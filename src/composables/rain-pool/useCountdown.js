import { ref, computed, onUnmounted } from 'vue'
import { useRainPoolStore } from '@/stores/rainPool'

export function useCountdown() {
  const store = useRainPoolStore()
  const countdownInterval = ref(null)
  const hasCompleted = ref(false)

  const formattedTimeRemaining = computed(() => {
    const totalSeconds = Math.max(0, Math.floor(store.remainingSeconds))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  function startCountdown(onComplete) {
    clearCountdown()
    hasCompleted.value = false // Reset completion flag

    const tick = () => {
      if (store.isAdminPaused) {
        return
      }

      if (store.currentPool?.ends_at) {
        const endTime = new Date(store.currentPool.ends_at).getTime()
        const currentTime = Date.now()
        const remainingMs = Math.max(0, endTime - currentTime)
        store.remainingSeconds = remainingMs / 1000

        // Progress bar starts at 100% and goes down to 0%
        store.progressPercentage = Math.max(
          0,
          (store.remainingSeconds / store.totalTimeSeconds) * 100
        )

        // Prevent multiple completion triggers
        if (store.remainingSeconds <= 0 && onComplete && !hasCompleted.value) {
          hasCompleted.value = true
          clearCountdown()
          onComplete()
        }
      }
    }

    // Use setInterval instead of RAF for countdown (more precise)
    countdownInterval.value = window.setInterval(tick, 100)
  }

  function clearCountdown() {
    if (countdownInterval.value !== null) {
      clearInterval(countdownInterval.value)
      countdownInterval.value = null
    }
  }

  function syncTimer() {
    if (store.currentPool?.ends_at) {
      const endTime = new Date(store.currentPool.ends_at).getTime()
      const currentTime = Date.now()
      const remainingMs = Math.max(0, endTime - currentTime)
      store.remainingSeconds = remainingMs / 1000
      store.progressPercentage = Math.max(
        0,
        (store.remainingSeconds / store.totalTimeSeconds) * 100
      )
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    clearCountdown()
  })

  return {
    formattedTimeRemaining,
    startCountdown,
    clearCountdown,
    syncTimer,
  }
}
