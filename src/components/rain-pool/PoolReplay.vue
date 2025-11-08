<template>
  <Teleport to="body">
    <div v-if="store.showReplayModal" class="PoolReplay-overlay" @click="closeReplay">
      <div class="PoolReplay-modal" @click.stop>
        <!-- Header -->
        <div class="PoolReplay-header">
          <div class="PoolReplay-headerLeft">
            <button class="PoolReplay-backBtn" @click="closeReplay" title="Close replay">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <h2 class="PoolReplay-title">🎬 Pool Replay</h2>
          </div>
          <button class="PoolReplay-closeBtn" @click="closeReplay">×</button>
        </div>

        <!-- Pool Info Bar -->
        <div v-if="store.replayPool" class="PoolReplay-poolInfo">
          <div class="PoolReplay-poolInfoItem">
            <span class="PoolReplay-poolInfoLabel">Date</span>
            <span class="PoolReplay-poolInfoValue">{{ formatDate(store.replayPool.completed_at || store.replayPool.created_at) }}</span>
          </div>
          <div class="PoolReplay-poolInfoItem">
            <span class="PoolReplay-poolInfoLabel">Participants</span>
            <span class="PoolReplay-poolInfoValue">{{ store.replayParticipants.length }}</span>
          </div>
          <div class="PoolReplay-poolInfoItem">
            <span class="PoolReplay-poolInfoLabel">Prize</span>
            <span class="PoolReplay-poolInfoValue">{{ store.replayPool.total_payout_sol?.toFixed(4) || '0.0000' }} SOL</span>
          </div>
          <div class="PoolReplay-poolInfoItem">
            <span class="PoolReplay-poolInfoLabel">Winners</span>
            <span class="PoolReplay-poolInfoValue">{{ store.replayWinners.length }}</span>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="store.loadingReplay" class="PoolReplay-loading">
          <p>Loading replay data...</p>
        </div>

        <!-- Replay Content -->
        <div v-else-if="store.replayParticipants.length > 0" class="PoolReplay-content">
          <!-- Rolling Strip -->
          <div class="PoolReplay-stripContainer">
            <div ref="stripRef" class="PoolReplay-strip">
              <ParticipantSegment
                v-for="segment in displaySegments"
                :key="segment.id"
                :segment="segment"
              />
            </div>
            <!-- Winner Indicator -->
            <div class="PoolReplay-indicator"></div>
          </div>

          <!-- Controls -->
          <div class="PoolReplay-controls">
            <button
              v-if="!store.isReplaying && currentWinnerIndex === 0"
              class="PoolReplay-startBtn"
              @click="startReplay"
            >
              ▶ Start Replay
            </button>
            <div v-else-if="store.isReplaying" class="PoolReplay-status">
              Drawing winner {{ currentWinnerIndex }} of {{ store.replayWinners.length }}...
            </div>
            <button
              v-else-if="currentWinnerIndex >= store.replayWinners.length"
              class="PoolReplay-resetBtn"
              @click="resetReplay"
            >
              🔄 Replay Again
            </button>
          </div>

          <!-- Proof of Fairness -->
          <div v-if="store.replayPool?.verifiable_proof" class="PoolReplay-proofSection">
            <div class="PoolReplay-proofHeader">
              <h3 class="PoolReplay-proofTitle">🔐 Proof of Fairness</h3>
            </div>
            <div class="PoolReplay-proofGrid">
              <div class="PoolReplay-proofItem">
                <span class="PoolReplay-proofLabel">Random Seed</span>
                <span class="PoolReplay-proofValue">{{ store.replayPool.random_seed || 'N/A' }}</span>
              </div>
              <div class="PoolReplay-proofItem">
                <span class="PoolReplay-proofLabel">Blockhash</span>
                <span class="PoolReplay-proofValue">{{ formatHash(store.replayPool.blockhash) }}</span>
              </div>
              <div class="PoolReplay-proofItem">
                <span class="PoolReplay-proofLabel">Draw Timestamp</span>
                <span class="PoolReplay-proofValue">{{ formatDate(store.replayPool.draw_timestamp || store.replayPool.completed_at) }}</span>
              </div>
              <div class="PoolReplay-proofItem">
                <span class="PoolReplay-proofLabel">Total Participants</span>
                <span class="PoolReplay-proofValue">{{ store.replayParticipants.length }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="PoolReplay-empty">
          <p>No participants found for this pool</p>
        </div>
      </div>

      <!-- WinnerModal Component -->
      <WinnerModal />
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRainPoolStore } from '@/stores/rainPool'
import { useSounds } from '@/composables/rain-pool/useSounds'
import ParticipantSegment from './ParticipantSegment.vue'
import WinnerModal from './WinnerModal.vue'

const store = useRainPoolStore()
const { playRollStart, playWinnerSound } = useSounds()

// Refs
const stripRef = ref(null)
const currentWinnerIndex = ref(0)
const currentWinnerData = ref(null)
const animationFrameId = ref(null)

// Create weighted display segments based on ticket counts
const displaySegments = computed(() => {
  if (store.replayParticipants.length === 0) return []

  const totalTickets = store.replayParticipants.reduce((sum, p) => sum + (p.total_tickets || 1), 0)
  const baseStripWidth = 400
  const segments = []

  store.replayParticipants.forEach((participant) => {
    const tickets = participant.total_tickets || 1
    const sharePercentage = tickets / totalTickets
    const segmentWidth = Math.max(60, baseStripWidth * sharePercentage)

    segments.push({
      participant: {
        id: participant.wallet_address,
        address: participant.wallet_address,
        truncatedAddress: `${participant.wallet_address.slice(0, 4)}...${participant.wallet_address.slice(-4)}`,
        avatar: participant.avatar_url,
        icon: participant.avatar_url ? null : '🌧️',
        total_tickets: participant.total_tickets || 1,
        burn_amount_usd: participant.burn_amount_usd || 0,
        tier: participant.tier || 1,
      },
      width: segmentWidth,
      sharePercentage,
      tickets,
      id: `segment-${participant.wallet_address}`,
    })
  })

  // Create multiple copies for infinite scroll effect
  const copies = []
  const numberOfCopies = 20

  for (let i = 0; i < numberOfCopies; i++) {
    segments.forEach((segment) => {
      copies.push({
        ...segment,
        id: `${segment.id}-copy${i}`,
        copyIndex: i,
      })
    })
  }

  return copies
})

// Format date
function formatDate(dateString) {
  if (!dateString) return 'Unknown date'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format hash for display
function formatHash(hash) {
  if (!hash) return 'N/A'
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`
}

// Start replay animation sequence
async function startReplay() {
  if (store.replayWinners.length === 0) return

  currentWinnerIndex.value = 0
  currentWinnerData.value = null

  // Animate through all winners
  for (let i = 0; i < store.replayWinners.length; i++) {
    currentWinnerIndex.value = i + 1
    const winner = store.replayWinners[i]

    // Find winner participant index in original participants
    const winnerParticipantIndex = store.replayParticipants.findIndex(
      p => p.wallet_address === winner.wallet_address
    )

    if (winnerParticipantIndex === -1) continue

    // Play roll start sound
    playRollStart()

    // Start rolling animation
    store.isReplaying = true
    await rollToWinner(winnerParticipantIndex)

    // Play winner sound
    playWinnerSound()

    // Show winner in modal (confetti is triggered by WinnerModal)
    store.isReplaying = false
    currentWinnerData.value = winner

    // Show winner modal
    store.setWinnerModal(true, {
      address: winner.wallet_address,
      truncatedAddress: `${winner.wallet_address.slice(0, 4)}...${winner.wallet_address.slice(-4)}`,
      avatar: winner.avatar_url,
      icon: winner.avatar_url ? null : '🌧️',
      prize: winner.reward_sol.toFixed(4),
      txSig: winner.transaction_signature,
      position: i + 1,
      totalWinners: store.replayWinners.length
    })

    // Wait for user to close modal or auto-close after 5 seconds
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!store.showWinnerModal) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      // Auto-close after 5 seconds if user doesn't interact
      setTimeout(() => {
        if (store.showWinnerModal) {
          store.setWinnerModal(false)
        }
        clearInterval(checkInterval)
        resolve()
      }, 5000)
    })

    // Additional wait before next winner (skip on last winner)
    if (i < store.replayWinners.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

// Weighted rolling animation (matching live pool behavior)
function rollToWinner(winnerIndex) {
  return new Promise((resolve) => {
    const strip = stripRef.value
    if (!strip || store.replayParticipants.length === 0) {
      resolve()
      return
    }

    const containerWidth = strip.parentElement?.offsetWidth || 800

    // Calculate segment positions based on weighted widths
    const segments = []
    let currentPosition = 0

    store.replayParticipants.forEach((participant) => {
      const tickets = participant.total_tickets || 1
      const totalTickets = store.replayParticipants.reduce((sum, p) => sum + (p.total_tickets || 1), 0)
      const sharePercentage = tickets / totalTickets
      const segmentWidth = Math.max(60, 400 * sharePercentage)

      segments.push({
        start: currentPosition,
        width: segmentWidth,
        center: currentPosition + segmentWidth / 2
      })

      currentPosition += segmentWidth + 6 // 6px gap
    })

    const winnerSegment = segments[winnerIndex]
    const winnerSegmentCenter = winnerSegment.center
    const containerCenter = containerWidth / 2
    const oneCycleWidth = currentPosition

    // Spin 5 complete cycles before landing on winner
    const numCycles = 5
    const targetWinnerPosition = numCycles * oneCycleWidth + winnerSegmentCenter
    const finalPosition = containerCenter - targetWinnerPosition

    // Animation parameters
    const totalDuration = 6000 // 6 seconds
    const startTime = Date.now()
    const startPosition = 0

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / totalDuration, 1)

      // Exponential ease-out (fast start, slow end)
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

      const currentOffset = startPosition + (finalPosition - startPosition) * easeProgress
      strip.style.transform = `translateX(${currentOffset}px)`

      if (progress < 1) {
        animationFrameId.value = requestAnimationFrame(animate)
      } else {
        // Ensure we land exactly on the winner
        strip.style.transform = `translateX(${finalPosition}px)`
        animationFrameId.value = null
        resolve()
      }
    }

    animationFrameId.value = requestAnimationFrame(animate)
  })
}

// Reset replay
function resetReplay() {
  currentWinnerIndex.value = 0
  currentWinnerData.value = null
  store.isReplaying = false

  // Cancel any ongoing animation
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
  }

  // Reset strip position
  if (stripRef.value) {
    stripRef.value.style.transform = 'translateX(0)'
  }
}

// Close replay
function closeReplay() {
  store.showReplayModal = false
  resetReplay()

  // Reset replay data
  setTimeout(() => {
    store.replayPool = null
    store.replayParticipants = []
    store.replayWinners = []
  }, 300)
}

// Prevent body scroll when modal is open
function preventBodyScroll(prevent) {
  if (prevent) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

watch(() => store.showReplayModal, (newValue) => {
  preventBodyScroll(newValue)
})

onUnmounted(() => {
  preventBodyScroll(false)
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }
})
</script>

<style scoped lang="scss">
.PoolReplay {
  &-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    padding: 1rem;
    overflow-y: auto;
  }

  &-modal {
    background: rgba(157, 196, 223, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid rgba(176, 216, 237, 0.5);
    border-radius: 16px;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    margin: auto;
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 2px solid rgba(176, 216, 237, 0.4);
  }

  &-headerLeft {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0;
  }

  &-backBtn {
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(176, 216, 237, 0.3);
    color: white;
    cursor: pointer;
    line-height: 1;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      display: block;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(176, 216, 237, 0.5);
      transform: translateX(-2px);
    }
  }

  &-closeBtn {
    background: none;
    border: none;
    font-size: 2rem;
    color: white;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &-poolInfo {
    display: flex;
    justify-content: space-around;
    padding: 1rem 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 2px solid rgba(176, 216, 237, 0.4);
    gap: 1rem;
    flex-wrap: wrap;
  }

  &-poolInfoItem {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  &-poolInfoLabel {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &-poolInfoValue {
    font-size: 0.875rem;
    font-weight: 700;
    color: white;
  }

  &-loading,
  &-empty {
    padding: 3rem 1.5rem;
    text-align: center;
    color: white;
    font-size: 1rem;
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2rem;
    overflow-y: auto;
  }

  &-stripContainer {
    position: relative;
    width: 100%;
    height: 64px;
    overflow: hidden;
    background: rgba(157, 196, 223, 0.3);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border-radius: 12px;
    border: 2px solid rgba(176, 216, 237, 0.4);
  }

  &-strip {
    display: flex;
    align-items: center;
    height: 100%;
    gap: 6px;
    padding: 0 10px;
    will-change: transform;
    transition: none;
  }

  &-indicator {
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
    transform: translateX(-50%);
    z-index: 10;
    pointer-events: none;

    &::before,
    &::after {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
    }

    &::before {
      top: -10px;
      border-bottom: 10px solid #FFD700;
    }

    &::after {
      bottom: -10px;
      border-top: 10px solid #FFA500;
    }
  }

  &-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
  }

  &-startBtn,
  &-resetBtn {
    padding: 1rem 2rem;
    font-size: 1rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    border: 2px solid rgba(76, 175, 80, 0.5);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);

    &:hover {
      background: linear-gradient(135deg, #45a049 0%, #4CAF50 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &-status {
    font-size: 1rem;
    font-weight: 700;
    color: white;
    padding: 1rem 2rem;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    border: 2px solid rgba(176, 216, 237, 0.4);
  }

  &-winnerDisplay {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 2px solid rgba(176, 216, 237, 0.4);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &-winnerHeader {
    text-align: center;
  }

  &-winnerLabel {
    font-size: 1rem;
    font-weight: 700;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &-winnerInfo {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
  }

  &-winnerAvatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 3px solid rgba(255, 215, 0, 0.8);
    object-fit: cover;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }

  &-winnerAvatarPlaceholder {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 3px solid rgba(255, 215, 0, 0.8);
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
  }

  &-winnerDetails {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &-winnerAddress {
    font-size: 1rem;
    font-weight: 600;
    color: white;
  }

  &-winnerPrize {
    font-size: 1.25rem;
    font-weight: 700;
    color: #FFD700;
    text-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  }

  &-proofSection {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 2px solid rgba(176, 216, 237, 0.4);
    border-radius: 12px;
    padding: 1.5rem;
    margin-top: 1rem;
  }

  &-proofHeader {
    margin-bottom: 1rem;
  }

  &-proofTitle {
    font-size: 1.125rem;
    font-weight: 700;
    color: white;
    margin: 0;
    text-align: center;
  }

  &-proofGrid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }

  &-proofItem {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(176, 216, 237, 0.3);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &-proofLabel {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &-proofValue {
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
    word-break: break-all;
    font-family: 'Courier New', monospace;
  }
}

@media (max-width: 768px) {
  .PoolReplay {
    &-modal {
      max-width: 100%;
      max-height: 100vh;
      border-radius: 0;
    }

    &-title {
      font-size: 1.25rem;
    }

    &-content {
      padding: 1rem;
    }

    &-proofGrid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
