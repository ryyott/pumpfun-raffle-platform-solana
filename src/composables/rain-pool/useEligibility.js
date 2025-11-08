import { computed, toValue } from 'vue'
import { useRainPoolStore } from '@/stores/rainPool'

export function useEligibility(
  userAddress,
  tokenBalance
) {
  const store = useRainPoolStore()

  const tokenValueUsd = computed(() => {
    const balance = toValue(tokenBalance)
    const priceUsd = store.tokenPriceUsd

    return (balance && priceUsd) ? balance * priceUsd : 0
  })

  const isEligible = computed(() => {
    const address = toValue(userAddress)

    if (!address) return false
    if (!store.tokenPriceUsd) return false

    return tokenValueUsd.value >= 10
  })

  const canJoin = computed(() => {
    if (!isEligible.value) return false

    const address = toValue(userAddress)

    // Check if user is already in the pool
    const alreadyJoined = store.participants.some(p => p.address === address)
    if (alreadyJoined) return false

    // Check if there's more than 30 seconds remaining
    return store.remainingSeconds > 30
  })

  const canJoinReason = computed(() => {
    const address = toValue(userAddress)
    const alreadyJoined = store.participants.some(p => p.address === address)
    const hasTimeToJoin = store.remainingSeconds > 30

    if (alreadyJoined) return 'already_joined'
    if (!hasTimeToJoin) return 'too_late'
    if (!isEligible.value) return 'not_eligible'
    return 'can_join'
  })

  const ineligibilityMessage = computed(() => {
    if (!store.tokenPriceUsd) return 'Need DROP tokens to join'

    const currentValue = tokenValueUsd.value
    const requiredValue = 10
    const shortfall = requiredValue - currentValue

    if (shortfall <= 0) return 'Need RAINDR0P tokens to join'

    return `Need $${shortfall.toFixed(2)} more to join (min $10)`
  })

  const userWinChance = computed(() => {
    const address = toValue(userAddress)
    if (!address || store.participants.length === 0) return null

    const userParticipant = store.participants.find(p => p.address === address)
    if (!userParticipant) return null

    const totalTickets = store.participants.reduce((sum, p) => sum + (p.total_tickets || 1), 0)
    const userTickets = userParticipant.total_tickets || 1

    const percentage = (userTickets / totalTickets) * 100
    return percentage.toFixed(2)
  })

  return {
    isEligible,
    canJoin,
    canJoinReason,
    tokenValueUsd,
    ineligibilityMessage,
    userWinChance,
  }
}
