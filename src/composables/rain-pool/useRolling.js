import { ref, onUnmounted } from 'vue'
import { useRainPoolStore } from '@/stores/rainPool'

export function useRolling() {
  const store = useRainPoolStore()
  const stripRef = ref(null)
  const animationFrameId = ref(null)
  const isAnimating = ref(false)

  function createProportionalSegments() {
    if (store.participants.length === 0) return []

    const totalTickets = store.participants.reduce((sum, p) => sum + (p.total_tickets || 1), 0)
    const baseStripWidth = 400 // Base width for proportional calculation
    const segments = []

    store.participants.forEach((participant, index) => {
      const tickets = participant.total_tickets || 1
      const sharePercentage = tickets / totalTickets
      const segmentWidth = Math.max(60, baseStripWidth * sharePercentage) // Minimum 60px

      segments.push({
        participant,
        width: segmentWidth,
        sharePercentage,
        tickets,
        index,
        id: `segment-${participant.id}-${index}`,
      })
    })

    return segments
  }

  function selectWinnerByProbability() {
    if (store.participants.length === 0) return null

    const totalTickets = store.participants.reduce((sum, p) => sum + (p.total_tickets || 1), 0)
    const random = Math.random()
    let cumulative = 0

    for (let i = 0; i < store.participants.length; i++) {
      const tickets = store.participants[i].total_tickets || 1
      cumulative += tickets / totalTickets

      if (random <= cumulative) {
        return {
          participant: store.participants[i],
          index: i,
          probability: tickets / totalTickets,
        }
      }
    }

    // Fallback to last participant
    const lastIndex = store.participants.length - 1
    return {
      participant: store.participants[lastIndex],
      index: lastIndex,
      probability: (store.participants[lastIndex].total_tickets || 1) / totalTickets,
    }
  }

  function rollToWinner(winnerIndex) {
    return new Promise((resolve) => {
      if (!stripRef.value || store.participants.length === 0) {
        resolve()
        return
      }

      isAnimating.value = true

      const containerWidth = stripRef.value.parentElement?.offsetWidth || 800
      const segments = createProportionalSegments()

      // Calculate winner segment position
      let winnerSegmentStart = 0
      let winnerSegmentWidth = segments[winnerIndex]?.width || 100

      for (let i = 0; i < winnerIndex; i++) {
        winnerSegmentStart += segments[i].width + 6 // 6px margin
      }

      const winnerSegmentCenter = winnerSegmentStart + winnerSegmentWidth / 2
      const containerCenter = containerWidth / 2
      const oneCycleWidth = segments.reduce((sum, seg) => sum + seg.width + 6, 0)

      // Spin multiple cycles before landing on winner
      const numCycles = 5
      const targetWinnerPosition = numCycles * oneCycleWidth + winnerSegmentCenter
      const finalPosition = containerCenter - targetWinnerPosition

      // Animation parameters
      const totalDuration = 6000 // 6 seconds total
      const startTime = Date.now()
      const startPosition = 0

      const animate = () => {
        if (!isAnimating.value) return

        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / totalDuration, 1)

        // Custom easing: fast at start, slow at end (ease-out exponential)
        // This creates the "spin fast then slow down" effect
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

        // Calculate current position with easing
        currentPosition = startPosition + (finalPosition - startPosition) * easeProgress

        stripRef.value.style.transform = `translateX(${currentPosition}px)`

        if (progress < 1) {
          animationFrameId.value = requestAnimationFrame(animate)
        } else {
          // Ensure we land exactly on the winner
          stripRef.value.style.transform = `translateX(${finalPosition}px)`
          isAnimating.value = false
          store.isRolling = false
          animationFrameId.value = null
          resolve()
        }
      }

      let currentPosition = startPosition
      animationFrameId.value = requestAnimationFrame(animate)
    })
  }

  function resetStripPosition() {
    if (stripRef.value) {
      stripRef.value.style.transform = 'translateX(0)'
    }
  }

  function stopAnimation() {
    isAnimating.value = false
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value)
      animationFrameId.value = null
    }
  }

  onUnmounted(() => {
    stopAnimation()
  })

  return {
    stripRef,
    isAnimating,
    createProportionalSegments,
    selectWinnerByProbability,
    rollToWinner,
    resetStripPosition,
    stopAnimation,
  }
}
