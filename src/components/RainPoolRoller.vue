<template>
  <div class="RainPoolRoller">
    <!-- Header Section -->
    <RainPoolHeader
      :user-address="userAddress"
      :user-avatar="userAvatar"
      :sol-balance="solBalance"
      :token-balance="tokenBalance"
      :is-loading-balances="isLoadingBalances"
      :stats-toasts-enabled="statsToastsEnabled"
      @connect-wallet="$emit('connect-wallet')"
      @disconnect-wallet="$emit('disconnect-wallet')"
      @refresh-balances="handleRefreshBalances"
      @toggle-stats-toasts="handleToggleStatsToasts"
    />

    <!-- Winner Count Info Bar -->
    <div class="RainPoolRoller-winnerCountBar">
      <div class="RainPoolRoller-winnerCountInfo">
        <span class="RainPoolRoller-winnerCountLabel">CURRENT WINNERS:</span>
        <span class="RainPoolRoller-winnerCountValue">{{ store.winnerCount }}</span>
        <span class="RainPoolRoller-winnerCountExplainer">
          {{ store.winnerCount === 1 ? 'winner' : 'winners' }} will split the pool
        </span>
      </div>
    </div>

    <!-- Rolling Strip -->
    <RollingStrip ref="rollingStripRef" />

    <!-- Progress Bar -->
    <ProgressBar v-if="!store.isRolling" />

    <!-- Stats Section -->
    <div v-if="!store.isRolling" class="RainPoolRoller-statsSection">
      <!-- Already Joined Status (Center) -->
      <div v-if="userAddress && eligibility.canJoinReason.value === 'already_joined'" class="RainPoolRoller-alreadyJoined">
        You're in this pool!
      </div>

      <div class="RainPoolRoller-statsContainer">
        <div class="RainPoolRoller-participants">
          {{ store.participants.length }} participants joined
        </div>

        <!-- User Win Chance -->
        <div v-if="eligibility.userWinChance.value !== null" class="RainPoolRoller-winChance">
          <span class="RainPoolRoller-winChanceLabel">Your Win Chance:</span>
          <span class="RainPoolRoller-winChanceValue">{{ eligibility.userWinChance.value }}%</span>
        </div>

        <!-- Total Burned This Round -->
        <div v-if="store.totalBurnedUsd > 0" class="RainPoolRoller-burnStats">
          <span class="RainPoolRoller-burnStatsLabel">🔥 Total Burned:</span>
          <span class="RainPoolRoller-burnStatsValue">${{ store.totalBurnedUsd.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- Action Buttons Row -->
    <div v-if="!store.isRolling" class="RainPoolRoller-actionButtonsRow">
      <!-- Join/Boost Button (Left) -->
      <div class="RainPoolRoller-leftAction">
        <!-- Not connected -->
        <ActionButton
          v-if="!userAddress"
          size="md"
          variant="success"
          class="RainPoolRoller-joinBtn"
          @click="$emit('connect-wallet')"
        >
          Connect Wallet to Join
        </ActionButton>
        <!-- Already joined - show boost -->
        <ActionButton
          v-else-if="eligibility.canJoinReason.value === 'already_joined'"
          size="md"
          variant="secondary"
          class="RainPoolRoller-boostBtn"
          @click="joinPool"
        >
          🔥 Boost My Odds
        </ActionButton>
        <!-- Can join -->
        <ActionButton
          v-else
          size="md"
          variant="success"
          class="RainPoolRoller-joinBtn"
          :disabled="!eligibility.isEligible.value || store.isJoining || eligibility.canJoinReason.value === 'too_late'"
          @click="joinPool"
          :title="!eligibility.isEligible.value ? eligibility.ineligibilityMessage.value : ''"
        >
          <span v-if="store.isJoining">Joining...</span>
          <span v-else-if="!eligibility.isEligible.value">{{ eligibility.ineligibilityMessage.value }}</span>
          <span v-else>Join Rain Pool</span>
        </ActionButton>
      </div>

      <!-- History Button (Right) -->
      <button
        class="RainPoolRoller-historyBtn"
        @click="store.showHistory = !store.showHistory"
        :title="store.showHistory ? 'Hide History' : 'View Winners History'"
      >
        <History :size="20" :stroke-width="2.5" class="RainPoolRoller-historyIcon" />
        {{ store.showHistory ? 'Hide' : 'History' }}
      </button>
    </div>

    <!-- Winner Modal -->
    <WinnerModal />

    <!-- Pool History Modal -->
    <PoolHistory :connected-wallet="props.userAddress" />

    <!-- Toast Notifications -->
    <Toast />

    <!-- Ticket Calculator Modal (if needed) -->
    <TicketCalculator
      v-if="store.showTicketCalculator"
      :is-open="store.showTicketCalculator"
      :wallet-address="userAddress"
      :mint-address="mintAddress"
      :user-avatar="userAvatar"
      :time-remaining="countdown.formattedTimeRemaining.value"
      :remaining-seconds="store.remainingSeconds"
      :is-upgrade="!eligibility.canJoin.value"
      @close="store.showTicketCalculator = false"
      @join="handleTicketCalculatorJoin"
      @show-toast="showToast"
    />

    <!-- Twitter Bonus Modal -->
    <TwitterBonusModal
      v-if="store.showTwitterBonusModal"
      :is-open="store.showTwitterBonusModal"
      :wallet-address="userAddress"
      :pool-id="store.currentPool?.id"
      :current-tickets="userCurrentTickets"
      @close="handleTwitterBonusClose"
      @success="handleTwitterBonusSuccess"
      @show-toast="showToast"
    />

    <!-- Payout Failure Modal -->
    <PayoutFailureModal
      v-if="store.showPayoutFailureModal"
      :is-open="store.showPayoutFailureModal"
      :pool-id="store.payoutFailureData?.poolId"
      :winner-address="store.payoutFailureData?.winnerAddress"
      :prize-amount="store.payoutFailureData?.prizeAmount"
      :error-message="store.payoutFailureData?.errorMessage"
      @close="handlePayoutFailureClose"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, toRef } from 'vue'
import { useRainPoolStore } from '@/stores/rainPool'
import { useCountdown } from '@/composables/rain-pool/useCountdown'
import { useSupabasePools } from '@/composables/rain-pool/useSupabasePools'
import { useEligibility } from '@/composables/rain-pool/useEligibility'
import { useSounds } from '@/composables/rain-pool/useSounds'
import SupabaseService from '@/services/SupabaseService'
import RainPoolHeader from '@/components/rain-pool/RainPoolHeader.vue'
import RollingStrip from '@/components/rain-pool/RollingStrip.vue'
import ProgressBar from '@/components/rain-pool/ProgressBar.vue'
import WinnerModal from '@/components/rain-pool/WinnerModal.vue'
import PoolHistory from '@/components/rain-pool/PoolHistory.vue'
import Toast from '@/components/rain-pool/Toast.vue'
import ActionButton from '@/components/ActionButton.vue'
import TicketCalculator from '@/components/TicketCalculator.vue'
import TwitterBonusModal from '@/components/rain-pool/TwitterBonusModal.vue'
import PayoutFailureModal from '@/components/rain-pool/PayoutFailureModal.vue'
import { History } from 'lucide-vue-next'

// Props
const props = defineProps({
  isEligible: Boolean,
  userAddress: String,
  userAvatar: String,
  solBalance: Number,
  tokenBalance: Number,
  isLoadingBalances: Boolean,
  isLoadingUserData: Boolean,
  statsToastsEnabled: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits([
  'connect-wallet',
  'disconnect-wallet',
  'refresh-balances',
  'joined',
  'join-error',
  'winners-selected',
  'toggle-stats-toasts'
])

// Store and composables
const store = useRainPoolStore()
const countdown = useCountdown()
const pools = useSupabasePools()
const { playRollStart, playWinnerSound } = useSounds()
// Make props reactive using toRef
const userAddressRef = toRef(props, 'userAddress')
const tokenBalanceRef = toRef(props, 'tokenBalance')
const eligibility = useEligibility(userAddressRef, tokenBalanceRef)

// Refs
const rollingStripRef = ref(null)

// Local state
const participantRefreshInterval = ref(null)
const adminCheckInterval = ref(null)

// Computed
const mintAddress = computed(() => {
  return process.env.VUE_APP_RAINDR0P_TOKEN_MINT
})

const userCurrentTickets = computed(() => {
  if (!props.userAddress || !store.participants.length) return 0
  const participant = store.participants.find(p => p.wallet_address === props.userAddress)
  return participant?.total_tickets || 0
})

// Lifecycle
onMounted(async () => {
  await initializeRainPool()
  setupVisibilityHandler()
})

onUnmounted(() => {
  cleanup()
})

// Initialization
async function initializeRainPool() {
  try {
    await checkAdminPauseStatus()
    await pools.loadCurrentPool()

    // If no pool, start one
    if (!store.currentPool) {
      await pools.startNewPool()
    }

    // Check if token price is loaded
    if (!store.tokenPriceUsd && store.currentPool) {
      console.log('⚠️ Token price not loaded, reloading pool...')
      setTimeout(async () => {
        await pools.loadCurrentPool()
      }, 2000)
    }

    await pools.loadPoolParticipants()
    await pools.loadPoolHistory()

    // Start countdown
    countdown.startCountdown(handleCountdownComplete)

    // Start periodic refreshes
    startPeriodicRefresh()
    startAdminCheck()
  } catch (error) {
    console.error('Error initializing rain pool:', error)
  }
}

// Countdown completion handler
async function handleCountdownComplete() {
  // CRITICAL: Stop all refresh intervals during rolling to prevent pool creation interference
  if (participantRefreshInterval.value !== null) {
    clearInterval(participantRefreshInterval.value)
    participantRefreshInterval.value = null
  }

  await startRolling()
}

// Rolling animation and winner selection
async function startRolling() {
  // CRITICAL: Reload participants to ensure we have the latest data
  console.log('🔄 Reloading participants before checking pool status...')
  await pools.loadPoolParticipants()
  console.log(`📊 Participant count after reload: ${store.participants.length}`)

  if (store.participants.length === 0) {
    console.log('⏭️ No participants, closing empty pool and starting new one')

    // Store pool ID before resetting
    const poolIdToClose = store.currentPool?.id

    // Close the empty pool FIRST
    if (poolIdToClose) {
      console.log('🔒 Closing pool:', poolIdToClose)
      const closeResult = await SupabaseService.closeEmptyPool(poolIdToClose)
      if (!closeResult.success) {
        console.error('❌ Failed to close empty pool:', closeResult.error)
        return
      }
      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Now reset and create new pool
    await resetPoolCycle()
    return
  }

  store.isRolling = true
  store.progressPercentage = 100

  // Save pool ID BEFORE closing (it will be null after)
  const poolIdForPayouts = store.currentPool?.id
  console.log('💰 Pool ID for payouts:', poolIdForPayouts)

  // Close pool and draw winners
  const winners = await pools.closeAndDrawWinners()

  if (winners.length === 0) {
    console.log('No winners drawn, resetting pool')
    await resetPoolCycle()
    return
  }

  // Display each winner sequentially
  await displayMultipleWinners(winners)

  // Emit winners
  emit('winners-selected', winners)

  // Trigger payouts and WAIT for them to complete
  if (poolIdForPayouts) {
    console.log('🔄 Triggering payouts for pool:', poolIdForPayouts)
    const payoutResult = await pools.triggerPayouts(poolIdForPayouts)
    if (payoutResult?.success) {
      console.log('✅ Payouts completed successfully')

      // Reset after successful payouts (with delay for user to see final state)
      setTimeout(async () => {
        await resetPoolCycle()
      }, 5000)
    } else {
      console.error('❌ Payouts failed:', payoutResult?.error)

      // CRITICAL: Stop the rolling cycle and show error modal
      handlePayoutFailure(poolIdForPayouts, winners, payoutResult?.error)

      // DO NOT reset the pool - admin must manually resolve
      store.isRolling = false
      store.isAdminPaused = true // Pause the system to prevent new pools

      return // Exit without resetting
    }
  } else {
    console.error('❌ No pool ID available for payouts')

    // Reset after error (with delay)
    setTimeout(async () => {
      await resetPoolCycle()
    }, 5000)
  }
}

async function displayMultipleWinners(winners) {
  for (let i = 0; i < winners.length; i++) {
    const winnerData = winners[i]
    const participant = store.participants.find(p => p.address === winnerData.wallet_address)

    console.log(`🎰 Rolling for winner ${i + 1}/${winners.length}`)

    const winnerIndex = store.participants.findIndex(p => p.address === winnerData.wallet_address)
    if (winnerIndex !== -1) {
      store.selectedWinnerIndex = winnerIndex
      store.selectedWinner = store.participants[winnerIndex]
      store.isRolling = true

      // Play roll start sound
      playRollStart()

      // Animate roll
      if (rollingStripRef.value) {
        await rollingStripRef.value.rollToWinner(winnerIndex)
      }
    }

    // Play winner sound
    playWinnerSound()

    // Show winner modal
    store.setWinnerModal(true, {
      address: winnerData.wallet_address,
      truncatedAddress: `${winnerData.wallet_address.slice(0, 4)}...${winnerData.wallet_address.slice(-4)}`,
      prize: winnerData.reward_sol,
      avatar: participant?.avatar || null,
      icon: participant?.icon || null,
      position: i + 1,
      totalWinners: winners.length,
      txSig: winnerData.payout_tx_sig || null,
    })

    // Wait 6 seconds to let user see the winner and confetti
    await new Promise(resolve => setTimeout(resolve, 6000))

    store.setWinnerModal(false)

    // Pause between winners
    if (i < winners.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  // After all winners shown, add extra delay before resetting pool
  console.log('🎉 All winners displayed, waiting before pool reset...')
  await new Promise(resolve => setTimeout(resolve, 3000))
}

// Join pool
async function joinPool() {
  console.log('🎫 Join pool clicked:', {
    isEligible: eligibility.isEligible.value,
    canJoin: eligibility.canJoin.value,
    canJoinReason: eligibility.canJoinReason.value,
    isJoining: store.isJoining,
    userAddress: props.userAddress,
    remainingSeconds: store.remainingSeconds
  })

  if (!props.userAddress) {
    console.log('❌ No user address')
    return
  }

  if (!eligibility.isEligible.value) {
    showToast('You need at least $10 worth of RAINDR0P to join', 'warning')
    return
  }

  if (store.isJoining) {
    console.log('❌ Already joining')
    return
  }

  if (!eligibility.canJoin.value && eligibility.canJoinReason.value === 'too_late') {
    showToast('⏱️ Unfortunately you cannot join - Pool closes in less than 30 seconds', 'warning')
    return
  }

  console.log('✅ Opening ticket calculator')
  console.log('Before setting showTicketCalculator:', store.showTicketCalculator)
  store.showTicketCalculator = true
  console.log('After setting showTicketCalculator:', store.showTicketCalculator)

  // Force Vue to update by using nextTick
  setTimeout(() => {
    console.log('In setTimeout - showTicketCalculator:', store.showTicketCalculator)
  }, 100)
}

async function handleTicketCalculatorJoin(joinData) {
  if (store.remainingSeconds <= 30) {
    store.showTicketCalculator = false
    showToast('⏱️ Unfortunately you cannot join - Pool closes in less than 30 seconds', 'warning')
    return
  }

  store.isJoining = true

  try {
    const result = await pools.joinPool(props.userAddress, props.userAvatar, {
      mintAddress: mintAddress.value,
      burnAmountUsd: joinData.burnAmountUsd || 0,
      burnTransactionSignature: joinData.burnTransactionSignature || null,
    })

    if (result.success) {
      // Refresh participants
      setTimeout(async () => {
        await pools.loadPoolParticipants()
      }, 1500)

      showToast('🎉 Successfully joined Rain Pool!', 'success')

      emit('joined', {
        success: true,
        participantCount: store.participants.length,
        poolId: result.poolId || store.currentPool?.id,
        tickets: result.tickets,
      })

      // Check if user is eligible for Twitter bonus (only if this is a new join, not an upgrade)
      const isUpgrade = result.upgrade !== undefined
      const alreadyClaimed = result.participant?.twitter_bonus_claimed || false

      if (!isUpgrade && !alreadyClaimed) {
        // Show Twitter bonus modal after a brief delay
        setTimeout(() => {
          store.showTwitterBonusModal = true
          store.twitterBonusEligible = true
        }, 1000)
      }
    } else {
      emit('join-error', new Error(result.error || 'Failed to join pool'))
    }
  } catch (error) {
    console.error('Error joining pool:', error)
    emit('join-error', error)
  } finally {
    store.isJoining = false
  }
}

// Admin pause check
async function checkAdminPauseStatus() {
  try {
    const SupabaseService = require('@/services/SupabaseService').default
    const { data: systemSettings } = await SupabaseService.supabase
      .from('system_settings')
      .select('key, value')
      .eq('key', 'rain_pool_paused')
      .single()

    const wasPaused = store.isAdminPaused

    if (systemSettings) {
      store.isAdminPaused = systemSettings.value === 'true'
    } else {
      store.isAdminPaused = false
    }

    if (wasPaused !== store.isAdminPaused) {
      if (store.isAdminPaused) {
        console.log('🛑 Admin paused Rain Pool')
        countdown.clearCountdown()
      } else {
        console.log('▶️ Admin resumed Rain Pool')
        countdown.startCountdown(handleCountdownComplete)
      }
    }
  } catch (error) {
    console.error('Error checking admin pause status:', error)
  }
}

// Periodic refresh
function startPeriodicRefresh() {
  participantRefreshInterval.value = window.setInterval(async () => {
    await pools.loadPoolParticipants()
    // Also refresh pool data to get updated market cap
    await pools.loadCurrentPool()
  }, 5000)
}

function startAdminCheck() {
  adminCheckInterval.value = window.setInterval(async () => {
    await checkAdminPauseStatus()
  }, 5000)
}

// Reset pool cycle
async function resetPoolCycle() {
  store.resetPool()
  if (rollingStripRef.value) {
    rollingStripRef.value.resetStripPosition()
  }

  setTimeout(async () => {
    if (!store.isAdminPaused) {
      await pools.startNewPool()
      countdown.startCountdown(handleCountdownComplete)
      startPeriodicRefresh()
    }
  }, 2000)
}

// Visibility handler (prevent tab throttling issues)
function setupVisibilityHandler() {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      countdown.syncTimer()
    }
  })
}

// Toast helper
function showToast(message, type = 'info') {
  store.addToast(message, type)
}

// Expose toast method for parent components
function showSuccessToast(message) {
  store.addToast(message, 'success')
}

// Refresh balances
function handleRefreshBalances() {
  emit('refresh-balances')
}

// Stats toasts toggle
function handleToggleStatsToasts(enabled) {
  emit('toggle-stats-toasts', enabled)
}

// Twitter bonus handlers
function handleTwitterBonusClose() {
  store.showTwitterBonusModal = false
  store.twitterBonusEligible = false
}

async function handleTwitterBonusSuccess(data) {
  console.log('Twitter bonus success:', data)

  // Update participant data with new ticket count
  store.updateParticipant(props.userAddress, {
    total_tickets: data.tickets.total,
    twitter_bonus_tickets: data.tickets.twitter,
    twitter_bonus_claimed: true
  })

  // Refresh participants to get latest data
  await pools.loadPoolParticipants()

  // Mark as claimed
  store.twitterBonusClaimed = true
}

// Payout failure handler
function handlePayoutFailure(poolId, winners, errorMessage) {
  console.error('🚨 CRITICAL: Payout failure detected, pausing system')

  // Find if current user is a winner
  const userWinner = winners.find(w => w.wallet_address === props.userAddress)

  // Set payout failure data
  store.payoutFailureData = {
    poolId,
    winners,
    errorMessage,
    winnerAddress: userWinner?.wallet_address || null,
    prizeAmount: userWinner?.reward_sol || null
  }

  // Show the error modal
  store.showPayoutFailureModal = true

  // Show toast notification
  showToast('⚠️ Payout failed - deployer wallet needs funds. Contact @raindr0p_fun on X.', 'error', 10000)
}

function handlePayoutFailureClose() {
  store.showPayoutFailureModal = false
  store.payoutFailureData = null
}

// Expose methods to parent
defineExpose({
  showSuccessToast
})

// Cleanup
function cleanup() {
  countdown.clearCountdown()
  if (participantRefreshInterval.value !== null) {
    clearInterval(participantRefreshInterval.value)
  }
  if (adminCheckInterval.value !== null) {
    clearInterval(adminCheckInterval.value)
  }
}
</script>

<style scoped lang="scss">
.RainPoolRoller {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.25rem;
  background: rgba(157, 196, 223, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 2px solid rgba(176, 216, 237, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 1rem;
    border-radius: 16px;
  }

  &-winnerCountBar {
    background: rgba(157, 196, 223, 0.3);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border-radius: 10px;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 2px solid rgba(176, 216, 237, 0.4);
  }

  &-winnerCountInfo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &-winnerCountLabel {
    font-size: 0.75rem;
    font-weight: 700;
    color: white;
    letter-spacing: 0.1em;
  }

  &-winnerCountValue {
    font-size: 1.25rem;
    font-weight: 900;
    color: #FFD700;
    text-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  }

  &-winnerCountExplainer {
    font-size: 0.75rem;
    color: white;
  }

  &-statsSection {
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  &-joinBtn {
    font-size: 0.875rem;
    font-weight: 700;
    padding: 0.625rem 1.25rem;
  }

  &-alreadyJoined {
    font-size: 0.875rem;
    font-weight: 700;
    color: white;
    text-align: center;
    padding: 0.625rem 1.25rem;
    background: rgba(135, 206, 235, 0.3);
    border: 2px solid rgba(176, 216, 237, 0.5);
    border-radius: 8px;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    box-shadow: 0 4px 12px rgba(135, 206, 235, 0.2);
  }

  &-boostBtn {
    background: linear-gradient(135deg, #ff4500 0%, #ff6347 50%, #ff8c00 100%) !important;
    border: 2px solid rgba(255, 69, 0, 0.8) !important;
    color: white !important;
    font-weight: 700 !important;
    box-shadow: 0 4px 20px rgba(255, 69, 0, 0.5), 0 0 30px rgba(255, 140, 0, 0.3) !important;
    animation: fireGlow 2s ease-in-out infinite !important;
    position: relative !important;
    overflow: hidden !important;

    &::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      transform: rotate(45deg);
      animation: shimmer 3s linear infinite;
    }

    &:hover {
      background: linear-gradient(135deg, #ff6347 0%, #ff8c00 50%, #ffa500 100%) !important;
      box-shadow: 0 6px 30px rgba(255, 69, 0, 0.7), 0 0 40px rgba(255, 140, 0, 0.5) !important;
      transform: scale(1.05) !important;
    }

    &:active {
      transform: scale(0.98) !important;
    }
  }

  &-statsContainer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  &-participants,
  &-winChance,
  &-burnStats {
    font-size: 0.875rem;
    color: white;
  }

  &-winChanceValue,
  &-burnStatsValue {
    font-weight: 700;
    color: white;
    margin-left: 0.5rem;
  }

  &-actionButtonsRow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2rem;
    gap: 1rem;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 1rem;
    }
  }

  &-leftAction {
    flex: 0 0 auto;
  }

  &-historyBtn {
    padding: 0.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 2px solid rgba(176, 216, 237, 0.4);
    border-radius: 12px;
    color: white;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(176, 216, 237, 0.3);
      border-color: rgba(176, 216, 237, 0.6);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &-historyIcon {
    color: white;
    flex-shrink: 0;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

@keyframes fireGlow {
  0%, 100% {
    box-shadow: 0 4px 20px rgba(255, 69, 0, 0.5), 0 0 30px rgba(255, 140, 0, 0.3);
  }
  50% {
    box-shadow: 0 4px 25px rgba(255, 69, 0, 0.7), 0 0 40px rgba(255, 140, 0, 0.5);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}
</style>
