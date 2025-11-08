<template>
  <Teleport to="body">
    <div v-if="store.showProofModal" class="ProofViewer-overlay" @click="closeModal">
      <div class="ProofViewer-modal" @click.stop>
        <div class="ProofViewer-header">
          <div class="ProofViewer-headerLeft">
            <button class="ProofViewer-backBtn" @click="closeModal" title="Go back">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <h2 class="ProofViewer-title">🔒 Provably Fair Proof</h2>
          </div>
          <button class="ProofViewer-closeBtn" @click="closeModal">×</button>
        </div>

        <div v-if="!proofData" class="ProofViewer-empty">
          <p>No proof data available for this pool</p>
        </div>

        <div v-else class="ProofViewer-content">
          <!-- Seed Section -->
          <div class="ProofViewer-section">
            <h3 class="ProofViewer-sectionTitle">Cryptographic Seed</h3>
            <div class="ProofViewer-codeBlock">
              <code class="ProofViewer-seed">{{ proofData.seed }}</code>
              <button
                class="ProofViewer-copyBtn"
                @click="copySeed"
                title="Copy seed"
              >
                <img src="@/assets/images/icons/copy.svg" alt="Copy" class="ProofViewer-copyIcon" />
              </button>
            </div>
            <p class="ProofViewer-description">
              256-bit random seed generated using <code>crypto.getRandomValues()</code>
            </p>
          </div>

          <!-- Pool Info Section -->
          <div class="ProofViewer-section">
            <h3 class="ProofViewer-sectionTitle">Pool Information</h3>
            <div class="ProofViewer-infoGrid">
              <div class="ProofViewer-infoItem">
                <span class="ProofViewer-label">Pool ID:</span>
                <span class="ProofViewer-value">{{ proofData.poolId.slice(0, 8) }}...</span>
              </div>
              <div class="ProofViewer-infoItem">
                <span class="ProofViewer-label">Timestamp:</span>
                <span class="ProofViewer-value">{{ formatTimestamp(proofData.timestamp) }}</span>
              </div>
              <div class="ProofViewer-infoItem">
                <span class="ProofViewer-label">Total Participants:</span>
                <span class="ProofViewer-value">{{ proofData.totalParticipants }}</span>
              </div>
              <div class="ProofViewer-infoItem">
                <span class="ProofViewer-label">Total Tickets:</span>
                <span class="ProofViewer-value">{{ proofData.totalTickets }}</span>
              </div>
              <div class="ProofViewer-infoItem">
                <span class="ProofViewer-label">Winners Drawn:</span>
                <span class="ProofViewer-value">{{ proofData.winnerCount }}</span>
              </div>
            </div>
          </div>

          <!-- Participants Snapshot -->
          <div class="ProofViewer-section">
            <h3 class="ProofViewer-sectionTitle">Participants Snapshot</h3>
            <p class="ProofViewer-description">
              Participant list locked at draw time ({{ proofData.participantsSnapshot.length }} total)
            </p>
            <div class="ProofViewer-participantsList">
              <div
                v-for="(participant, index) in proofData.participantsSnapshot"
                :key="index"
                class="ProofViewer-participant"
              >
                <span class="ProofViewer-participantWallet">{{ participant.wallet }}</span>
                <span class="ProofViewer-participantTickets">{{ participant.tickets }} ticket{{ participant.tickets !== 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>

          <!-- Winners Section -->
          <div class="ProofViewer-section">
            <h3 class="ProofViewer-sectionTitle">Selected Winners</h3>
            <div class="ProofViewer-winnersList">
              <div
                v-for="(winner, index) in proofData.winners"
                :key="index"
                class="ProofViewer-winner"
              >
                <span class="ProofViewer-winnerRank">Winner {{ index + 1 }}</span>
                <span class="ProofViewer-winnerWallet">{{ winner.wallet }}</span>
                <span class="ProofViewer-winnerIndex">Index: {{ winner.index }}</span>
              </div>
            </div>
          </div>

          <!-- Verification Info -->
          <div class="ProofViewer-section ProofViewer-section--info">
            <h3 class="ProofViewer-sectionTitle">How to Verify</h3>
            <ol class="ProofViewer-verificationSteps">
              <li>The seed is cryptographically secure (256 bits of entropy)</li>
              <li>The participants snapshot was locked before randomization</li>
              <li>Winners were selected using weighted cumulative distribution</li>
              <li>All data is publicly verifiable and cannot be manipulated</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRainPoolStore } from '@/stores/rainPool'

const store = useRainPoolStore()

const proofData = computed(() => {
  const rawProofData = store.selectedPoolDetails?.proof_data

  console.log('🔍 ProofViewer - selectedPoolDetails:', store.selectedPoolDetails)
  console.log('🔍 ProofViewer - rawProofData:', rawProofData)
  console.log('🔍 ProofViewer - rawProofData type:', typeof rawProofData)

  if (!rawProofData) {
    console.log('❌ ProofViewer - No proof data found')
    return null
  }

  // If proof_data is a string, parse it as JSON
  if (typeof rawProofData === 'string') {
    try {
      const parsed = JSON.parse(rawProofData)
      console.log('✅ ProofViewer - Parsed proof data:', parsed)
      return parsed
    } catch (error) {
      console.error('❌ Failed to parse proof_data JSON string:', error)
      return null
    }
  }

  // If it's already an object, return as-is
  console.log('✅ ProofViewer - Proof data is already an object:', rawProofData)
  return rawProofData
})

function closeModal() {
  store.showProofModal = false
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown'
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

async function copySeed() {
  if (!proofData.value?.seed) return

  try {
    await navigator.clipboard.writeText(proofData.value.seed)
    store.addToast('Seed copied to clipboard!', 'success', 2000)
  } catch (error) {
    console.error('Failed to copy seed:', error)
    store.addToast('Failed to copy seed', 'error', 2000)
  }
}

// Prevent body scroll when modal is open
watch(() => store.showProofModal, (newValue) => {
  console.log('🔍 ProofViewer - showProofModal changed to:', newValue)

  if (newValue) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped lang="scss">
.ProofViewer {
  &-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100001;
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
    max-width: 700px;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
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
    flex: 1;
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

  &-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0;
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

  &-content {
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &-empty {
    padding: 3rem 1.5rem;
    text-align: center;
    color: white;
    font-size: 1rem;
  }

  &-section {
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(176, 216, 237, 0.3);
    border-radius: 12px;
    padding: 1.25rem;

    &--info {
      background: rgba(5, 150, 105, 0.15);
      border-color: rgba(5, 150, 105, 0.4);
    }
  }

  &-sectionTitle {
    font-size: 1.125rem;
    font-weight: 700;
    color: white;
    margin: 0 0 1rem 0;
  }

  &-description {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0.5rem 0 0 0;

    code {
      background: rgba(0, 0, 0, 0.2);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
    }
  }

  &-codeBlock {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(176, 216, 237, 0.3);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    position: relative;
  }

  &-seed {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: white;
    word-break: break-all;
    flex: 1;
    line-height: 1.5;

    @media (max-width: 768px) {
      font-size: 0.65rem;
    }
  }

  &-copyBtn {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(176, 216, 237, 0.3);
    border-radius: 6px;
    padding: 0.5rem;
    cursor: pointer;
    line-height: 1;
    transition: all 0.2s ease;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(176, 216, 237, 0.5);
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &-copyIcon {
    width: 18px;
    height: 18px;
    filter: brightness(0) invert(1);
    display: block;
  }

  &-infoGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
  }

  &-infoItem {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &-value {
    font-size: 0.875rem;
    font-weight: 700;
    color: white;
  }

  &-participantsList,
  &-winnersList {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
  }

  &-participant,
  &-winner {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(176, 216, 237, 0.2);
    border-radius: 6px;
    padding: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }

  &-participantWallet,
  &-winnerWallet {
    font-family: 'Courier New', monospace;
    color: white;
    font-weight: 600;
  }

  &-participantTickets {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.8rem;
  }

  &-winner {
    gap: 0.75rem;
  }

  &-winnerRank {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 700;
    min-width: 80px;
  }

  &-winnerIndex {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
  }

  &-verificationSteps {
    margin: 0;
    padding-left: 1.5rem;
    color: white;

    li {
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      line-height: 1.5;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
