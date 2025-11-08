<template>
  <Teleport to="body">
    <!-- History List Modal -->
    <div v-if="store.showHistory && !store.showPoolDetailsModal" class="PoolHistory-overlay" @click="store.showHistory = false">
      <div class="PoolHistory-modal" @click.stop>
        <div class="PoolHistory-header">
          <h2 class="PoolHistory-title">🏆 History</h2>
          <div class="PoolHistory-headerActions">
            <button
              class="PoolHistory-refreshBtn"
              @click="refreshHistory"
              :disabled="isRefreshing"
              title="Refresh history"
            >
              <svg
                class="PoolHistory-refreshIcon"
                :class="{ 'PoolHistory-refreshIcon--spinning': isRefreshing }"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C12.0711 2.5 13.9461 3.35714 15.3033 4.75M15.3033 4.75V1.25M15.3033 4.75H11.8033" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button class="PoolHistory-closeBtn" @click="store.showHistory = false">×</button>
          </div>
        </div>

        <!-- Tab Toggle -->
        <div class="PoolHistory-tabs">
          <button
            :class="['PoolHistory-tab', { 'PoolHistory-tab--active': activeTab === 'history' }]"
            @click="activeTab = 'history'"
          >
            Recent History
          </button>
          <button
            :class="['PoolHistory-tab', { 'PoolHistory-tab--active': activeTab === 'myWins' }]"
            @click="switchToMyWins"
          >
            My Wins
          </button>
        </div>

        <!-- History Tab Content -->
        <div v-if="activeTab === 'history'" class="PoolHistory-tabContent">
          <div v-if="displayedHistory.length === 0" class="PoolHistory-empty">
            <p>No pool history yet. Be the first winner! 🌧️</p>
          </div>

          <div v-else class="PoolHistory-list">
            <div
              v-for="pool in displayedHistory"
              :key="pool.id"
              class="PoolHistory-item"
              @click="viewPoolDetails(pool)"
            >
              <div class="PoolHistory-itemHeader">
                <div class="PoolHistory-itemDate">
                  {{ formatDate(pool.created_at || pool.completed_at) }}
                </div>
                <div class="PoolHistory-itemPrize">{{ pool.total_payout_sol?.toFixed(4) || '0.0000' }} SOL</div>
              </div>

              <!-- Winner Avatars Preview -->
              <div v-if="pool.winner_avatars && pool.winner_avatars.length > 0" class="PoolHistory-avatars">
                <img
                  v-for="(avatar, index) in pool.winner_avatars.slice(0, 5)"
                  :key="index"
                  :src="avatar"
                  class="PoolHistory-avatar"
                  :alt="`Winner ${index + 1}`"
                />
              </div>

              <div class="PoolHistory-itemStats">
                <span>{{ pool.winner_count || 0 }} winner{{ pool.winner_count !== 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- My Wins Tab Content -->
        <div v-else-if="activeTab === 'myWins'" class="PoolHistory-tabContent">
          <div v-if="!props.connectedWallet" class="PoolHistory-empty">
            <p>Connect your wallet to view your wins 💰</p>
          </div>
          <div v-else-if="loadingMyWins" class="PoolHistory-loading">
            <p>Loading your wins...</p>
          </div>
          <div v-else-if="myWins.length === 0" class="PoolHistory-empty">
            <p>You haven't won yet. Keep playing! 🎲</p>
          </div>
          <div v-else class="PoolHistory-list">
            <div
              v-for="win in myWins"
              :key="win.id"
              class="PoolHistory-item PoolHistory-item--myWin"
            >
              <div class="PoolHistory-itemHeader">
                <div class="PoolHistory-itemDate">
                  {{ formatDate(win.created_at) }}
                </div>
                <div class="PoolHistory-itemPrize">{{ win.reward_sol?.toFixed(4) || '0.0000' }} SOL</div>
              </div>

              <div class="PoolHistory-winInfo">
                <div class="PoolHistory-winDetails">
                  <div class="PoolHistory-winAvatar">
                    <img v-if="win.avatar_url" :src="win.avatar_url" alt="Your avatar" />
                    <div v-else class="PoolHistory-winAvatarPlaceholder">{{ props.connectedWallet.slice(0, 2) }}</div>
                  </div>
                  <div>
                    <div class="PoolHistory-winLabel">Pool ID</div>
                    <div class="PoolHistory-winValue">{{ win.pool_id.slice(0, 8) }}...</div>
                  </div>
                </div>
                <button
                  class="PoolHistory-shareBtn"
                  @click.stop="shareWin(win)"
                  :disabled="isGeneratingShare"
                  title="Share your win"
                >
                  <svg v-if="!isGeneratingShare" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37061L8.08259 9.20024C7.54305 8.46862 6.71956 8 5.8 8C4.14315 8 2.8 9.34315 2.8 11C2.8 12.6569 4.14315 14 5.8 14C6.71956 14 7.54305 13.5314 8.08259 12.7998L15.0227 16.6294C15.0077 16.7508 15 16.8745 15 17C15 18.6569 16.3431 20 18 20C19.6569 20 21 18.6569 21 17C21 15.3431 19.6569 14 18 14C17.0804 14 16.257 14.4686 15.7174 15.2002L8.77735 11.3706C8.79229 11.2492 8.8 11.1255 8.8 11C8.8 10.8745 8.79229 10.7508 8.77735 10.6294L15.7174 6.79976C16.257 7.53138 17.0804 8 18 8Z" fill="currentColor"/>
                  </svg>
                  <span v-if="isGeneratingShare">...</span>
                  <span v-else>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pool Details Modal -->
    <div v-if="store.showPoolDetailsModal" class="PoolHistory-overlay" @click="closePoolDetails">
      <div class="PoolHistory-detailsModal" @click.stop>
        <div class="PoolHistory-header">
          <button class="PoolHistory-backBtn" @click="closePoolDetails" title="Back to history">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h2 class="PoolHistory-title">Pool Winners</h2>
          <button class="PoolHistory-closeBtn" @click="closePoolDetails">×</button>
        </div>

        <!-- Pool Info Bar -->
        <div v-if="store.selectedPoolDetails" class="PoolHistory-poolInfo">
          <div class="PoolHistory-poolInfoItem PoolHistory-poolInfoItem--full">
            <span class="PoolHistory-poolInfoLabel">Pool ID</span>
            <span class="PoolHistory-poolInfoValue PoolHistory-poolId" :title="store.selectedPoolDetails.id">
              {{ store.selectedPoolDetails.id }}
              <button
                class="PoolHistory-copyBtn"
                @click="copyPoolId(store.selectedPoolDetails.id)"
                title="Copy Pool ID"
              >
                <img src="@/assets/images/icons/copy.svg" alt="Copy" class="PoolHistory-copyIcon" />
              </button>
            </span>
          </div>
          <div class="PoolHistory-poolInfoItem">
            <span class="PoolHistory-poolInfoLabel">Completed</span>
            <span class="PoolHistory-poolInfoValue">{{ formatFullDate(store.selectedPoolDetails.completed_at || store.selectedPoolDetails.created_at) }}</span>
          </div>
          <div class="PoolHistory-poolInfoItem">
            <span class="PoolHistory-poolInfoLabel">Total Prize</span>
            <span class="PoolHistory-poolInfoValue">{{ store.selectedPoolDetails.total_payout_sol?.toFixed(4) || '0.0000' }} SOL</span>
          </div>
          <div class="PoolHistory-poolInfoItem PoolHistory-poolInfoItem--full">
            <div class="PoolHistory-actionButtons">
              <button
                class="PoolHistory-replayBtn"
                @click="openReplay"
                title="Replay this pool's draw"
              >
                🎬 Replay Draw
              </button>
              <button
                class="PoolHistory-proofBtn"
                @click="viewProof"
                title="View provably fair proof data"
              >
                🔒 View Proof
              </button>
            </div>
          </div>
        </div>

        <div v-if="store.loadingPoolDetails" class="PoolHistory-loading">
          <p>Loading winners...</p>
        </div>

        <div v-else-if="store.poolDetailsWinners.length === 0" class="PoolHistory-empty">
          <p>No winners found</p>
        </div>

        <div v-else class="PoolHistory-winnersList">
          <div
            v-for="(winner, index) in store.poolDetailsWinners"
            :key="index"
            class="PoolHistory-winner"
          >
            <div class="PoolHistory-winnerLeft">
              <img
                v-if="winner.avatar_url"
                :src="winner.avatar_url"
                class="PoolHistory-winnerAvatar"
                :alt="`Winner ${index + 1}`"
                @error="handleImageError($event, winner)"
              />
              <div v-else class="PoolHistory-winnerAvatarPlaceholder">
                {{ winner.wallet_address.slice(0, 2).toUpperCase() }}
              </div>
              <div class="PoolHistory-winnerInfo">
                <a
                  :href="`https://solscan.io/account/${winner.wallet_address}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="PoolHistory-winnerAddress"
                  title="View wallet on Solscan"
                >
                  {{ winner.wallet_address.slice(0, 4) }}...{{ winner.wallet_address.slice(-4) }}
                </a>
                <div class="PoolHistory-winnerReward">{{ winner.reward_sol.toFixed(4) }} SOL</div>
                <a
                  v-if="winner.payout_tx_sig"
                  :href="`https://solscan.io/tx/${winner.payout_tx_sig}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="PoolHistory-txSignature"
                  title="View transaction on Solscan"
                >
                  TX: {{ winner.payout_tx_sig.slice(0, 8) }}...
                </a>
                <div v-else class="PoolHistory-pendingTx">Pending payout...</div>
              </div>
            </div>
            <a
              v-if="winner.payout_tx_sig"
              :href="`https://solscan.io/tx/${winner.payout_tx_sig}`"
              target="_blank"
              rel="noopener noreferrer"
              class="PoolHistory-txLink"
              title="View transaction on Solscan"
            >
              🔗
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Pool Replay Modal -->
    <PoolReplay />

    <!-- Proof Viewer Modal -->
    <ProofViewer />

    <!-- Share Image Preview Modal -->
    <ShareImagePreview
      :show="showSharePreview"
      :image-url="shareImageUrl"
      :tweet-text="shareTweetText"
      @close="closeSharePreview"
      @download="handleDownload"
      @share="handleShareToX"
    />
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRainPoolStore } from '@/stores/rainPool'
import { useSupabasePools } from '@/composables/rain-pool/useSupabasePools'
import { useWinnerShareImage } from '@/composables/rain-pool/useWinnerShareImage'
import PoolReplay from './PoolReplay.vue'
import ProofViewer from './ProofViewer.vue'
import ShareImagePreview from './ShareImagePreview.vue'

const props = defineProps({
  connectedWallet: String
})

const store = useRainPoolStore()
const pools = useSupabasePools()
const { generateWinnerImage, downloadImage } = useWinnerShareImage()

// Share image preview state
const showSharePreview = ref(false)
const shareImageUrl = ref(null)
const shareImageBlob = ref(null)
const shareTweetText = ref('')

// Tab state
const activeTab = ref('history')

// Refresh state
const isRefreshing = ref(false)

// My wins state
const myWins = ref([])
const loadingMyWins = ref(false)
const isGeneratingShare = ref(false)

// Limit history to 6 most recent
const displayedHistory = computed(() => {
  return store.poolHistory.slice(0, 6)
})

// Switch to My Wins tab
async function switchToMyWins() {
  activeTab.value = 'myWins'

  if (!props.connectedWallet) return

  // Load user's wins if not already loaded
  if (myWins.value.length === 0) {
    await loadMyWins()
  }
}

// Load user's wins
async function loadMyWins() {
  if (!props.connectedWallet) {
    console.warn('No wallet connected')
    return
  }

  console.log('Loading wins for wallet:', props.connectedWallet)
  loadingMyWins.value = true

  try {
    // Use SupabaseService directly to get client
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
    const supabaseKey = process.env.VUE_APP_SUPABASE_ANON_KEY

    console.log('Supabase URL:', supabaseUrl)
    console.log('Creating Supabase client...')

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Querying rain_pool_winners table...')
    const { data, error } = await supabase
      .from('rain_pool_winners')
      .select(`
        id,
        pool_id,
        wallet_address,
        reward_sol,
        payout_tx_sig,
        created_at,
        users!rain_pool_winners_user_id_fkey (
          avatar
        )
      `)
      .eq('wallet_address', props.connectedWallet)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('My wins loaded successfully:', data)

    // Map the data to include avatar_url
    const mappedWins = (data || []).map(win => ({
      id: win.id,
      pool_id: win.pool_id,
      wallet_address: win.wallet_address,
      reward_sol: win.reward_sol,
      payout_tx_sig: win.payout_tx_sig,
      created_at: win.created_at,
      avatar_url: win.users?.avatar ? `/raindrops/${win.users.avatar}` : null
    }))

    myWins.value = mappedWins

    if (mappedWins.length > 0) {
      store.addToast(`Found ${mappedWins.length} win(s)!`, 'success', 2000)
    }
  } catch (error) {
    console.error('Error loading my wins:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    store.addToast(`Failed to load your wins: ${error.message}`, 'error')
  } finally {
    loadingMyWins.value = false
  }
}

// Share a win - show preview modal
async function shareWin(win) {
  if (isGeneratingShare.value) return

  try {
    isGeneratingShare.value = true

    console.log('🔍 DEBUG: Full win object:', win)
    console.log('🔍 DEBUG: win.created_at value:', win.created_at)
    console.log('🔍 DEBUG: win.created_at type:', typeof win.created_at)

    // Prepare winner data for image generation
    const winnerData = {
      avatar: win.avatar_url,
      address: win.wallet_address,
      truncatedAddress: `${win.wallet_address.slice(0, 4)}...${win.wallet_address.slice(-4)}`,
      prize: win.reward_sol,
      created_at: win.created_at
    }

    console.log('🔍 DEBUG: winnerData prepared with created_at:', winnerData.created_at)

    console.log('Winner data prepared:', winnerData)

    // Generate the share image
    console.log('Generating share image...')
    const imageBlob = await generateWinnerImage(winnerData)
    console.log('Share image generated successfully')

    // Store the blob and create URL for preview
    shareImageBlob.value = imageBlob
    shareImageUrl.value = URL.createObjectURL(imageBlob)

    // Prepare tweet text
    shareTweetText.value = `I won ${win.reward_sol} SOL in @raindr0p_fun Rain Pool! 🔥💰\n\nJoin the community-driven rewards at raindr0p.fun\n\n#RainDr0p #Solana #Web3`

    // Show preview modal
    showSharePreview.value = true

  } catch (error) {
    console.error('Error generating share image:', error)
    console.error('Error stack:', error.stack)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    store.addToast(`Failed to generate share image: ${error.message}`, 'error')
  } finally {
    isGeneratingShare.value = false
  }
}

// Close share preview and cleanup
function closeSharePreview() {
  showSharePreview.value = false
  if (shareImageUrl.value) {
    URL.revokeObjectURL(shareImageUrl.value)
    shareImageUrl.value = null
  }
  shareImageBlob.value = null
}

// Handle download from preview modal
function handleDownload() {
  if (shareImageBlob.value) {
    downloadImage(shareImageBlob.value, `raindr0p-winner-${Date.now()}.png`)
    store.addToast('Image downloaded!', 'success', 2000)
  }
}

// Handle share to X from preview modal
function handleShareToX() {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTweetText.value)}`
  window.open(twitterUrl, '_blank', 'noopener,noreferrer')

  // Also download the image so user can attach it
  if (shareImageBlob.value) {
    downloadImage(shareImageBlob.value, `raindr0p-winner-${Date.now()}.png`)
  }

  store.addToast('Opening Twitter! Attach the downloaded image to your tweet.', 'info', 4000)
}

// Refresh history function
async function refreshHistory() {
  if (isRefreshing.value) return

  isRefreshing.value = true
  try {
    if (activeTab.value === 'history') {
      await pools.loadPoolHistory(10)
      store.addToast('History refreshed!', 'success', 2000)
    } else {
      await loadMyWins()
      store.addToast('Your wins refreshed!', 'success', 2000)
    }
  } catch (error) {
    console.error('Error refreshing history:', error)
    store.addToast('Failed to refresh', 'error', 2000)
  } finally {
    isRefreshing.value = false
  }
}

// Prevent body scroll when modal is open
function preventBodyScroll(prevent) {
  if (prevent) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// Watch for modal state changes
import { watch } from 'vue'
watch(() => store.showHistory, (newValue) => {
  preventBodyScroll(newValue)
})

watch(() => store.showPoolDetailsModal, (newValue) => {
  preventBodyScroll(newValue)
})

function formatDate(dateString) {
  if (!dateString) return 'Unknown date'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

function formatFullDate(dateString) {
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

async function viewPoolDetails(pool) {
  store.selectedPoolDetails = pool
  store.showPoolDetailsModal = true
  store.loadingPoolDetails = true
  store.poolDetailsWinners = []

  try {
    const winners = await pools.getPoolWinners(pool.id)
    console.log('Winners data from API:', winners)

    // The data is already properly formatted from SupabaseService
    store.poolDetailsWinners = winners
    console.log('Mapped winners:', store.poolDetailsWinners)
  } catch (error) {
    console.error('Error loading pool winners:', error)
  } finally {
    store.loadingPoolDetails = false
  }
}

function handleImageError(event, winner) {
  console.error('Failed to load avatar:', winner.avatar_url, 'for wallet:', winner.wallet_address)
  event.target.style.display = 'none'
  event.target.nextElementSibling?.classList.add('show')
}

function closePoolDetails() {
  store.showPoolDetailsModal = false
  store.selectedPoolDetails = null
  store.poolDetailsWinners = []
  preventBodyScroll(false)
}

async function copyPoolId(poolId) {
  try {
    await navigator.clipboard.writeText(poolId)
    store.addToast('Pool ID copied to clipboard!', 'success', 2000)
  } catch (error) {
    console.error('Failed to copy pool ID:', error)
    store.addToast('Failed to copy Pool ID', 'error', 2000)
  }
}

async function openReplay() {
  if (!store.selectedPoolDetails) return

  // Load replay data
  await pools.loadReplayData(store.selectedPoolDetails.id)

  // Open replay modal
  store.showReplayModal = true
}

function viewProof() {
  console.log('🔍 viewProof clicked')
  console.log('🔍 selectedPoolDetails FULL OBJECT:', JSON.stringify(store.selectedPoolDetails, null, 2))
  console.log('🔍 selectedPoolDetails keys:', Object.keys(store.selectedPoolDetails || {}))
  console.log('🔍 proof_data:', store.selectedPoolDetails?.proof_data)

  if (!store.selectedPoolDetails) {
    console.log('❌ No selectedPoolDetails')
    return
  }

  console.log('✅ Opening proof modal')
  store.showProofModal = true
}

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  preventBodyScroll(false)
})
</script>

<style scoped lang="scss">
.PoolHistory {
  &-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 1rem;
    overflow-y: auto;
  }

  &-modal,
  &-detailsModal {
    background: rgba(157, 196, 223, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid rgba(176, 216, 237, 0.5);
    border-radius: 16px;
    width: 100%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
    margin: auto;
    position: relative;
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 2px solid rgba(176, 216, 237, 0.4);
    position: relative;
  }

  &-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  &-headerActions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
  }

  &-refreshBtn {
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

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(176, 216, 237, 0.5);
      transform: rotate(90deg);
    }

    &:active:not(:disabled) {
      transform: rotate(90deg) scale(0.95);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &-refreshIcon {
    display: block;
    transition: transform 0.6s ease;

    &--spinning {
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  &-backBtn {
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(176, 216, 237, 0.3);
    color: white;
    cursor: pointer;
    line-height: 1;
    padding: 0.5rem;
    margin-right: 0.5rem;
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

    &--full {
      flex-basis: 100%;
      margin-bottom: 0.5rem;
    }
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

  &-poolId {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    border: 1px solid rgba(176, 216, 237, 0.3);
    word-break: break-all;
    max-width: 100%;

    @media (max-width: 768px) {
      font-size: 0.65rem;
    }
  }

  &-copyBtn {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(176, 216, 237, 0.3);
    border-radius: 4px;
    padding: 0.4rem;
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
    width: 16px;
    height: 16px;
    filter: brightness(0) invert(1);
    display: block;
  }

  &-actionButtons {
    display: flex;
    gap: 0.75rem;
    width: 100%;
    margin-top: 0.5rem;

    @media (max-width: 500px) {
      flex-direction: column;
    }
  }

  &-replayBtn,
  &-proofBtn {
    flex: 1;
    color: white;
    font-weight: 700;
    font-size: 0.875rem;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid;

    &:active {
      transform: translateY(0);
    }
  }

  &-replayBtn {
    background: linear-gradient(135deg, #9333EA 0%, #7C3AED 100%);
    border-color: rgba(147, 51, 234, 0.5);
    box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);

    &:hover {
      background: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(147, 51, 234, 0.4);
    }
  }

  &-proofBtn {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    border-color: rgba(5, 150, 105, 0.5);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);

    &:hover {
      background: linear-gradient(135deg, #047857 0%, #059669 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
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

  &-empty,
  &-loading {
    padding: 3rem 1.5rem;
    text-align: center;
    color: white;
    font-size: 1rem;
  }

  &-list,
  &-winnersList {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &-item {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 2px solid rgba(176, 216, 237, 0.3);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(176, 216, 237, 0.5);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
  }

  &-itemHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  &-itemDate {
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
  }

  &-itemPrize {
    font-size: 1rem;
    font-weight: 700;
    color: white;
  }

  &-avatars {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  &-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
    object-fit: cover;
  }

  &-itemStats {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.9);
  }

  &-winner {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 2px solid rgba(176, 216, 237, 0.3);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(176, 216, 237, 0.5);
    }
  }

  &-winnerLeft {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &-winnerAvatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
    object-fit: cover;
  }

  &-winnerAvatarPlaceholder {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 700;
    color: white;
  }

  &-winnerInfo {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &-winnerAddress {
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
    text-decoration: none;
    transition: all 0.2s ease;

    &:hover {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: underline;
    }
  }

  &-winnerReward {
    font-size: 1rem;
    font-weight: 700;
    color: white;
  }

  &-txSignature {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    transition: all 0.2s ease;

    &:hover {
      color: white;
      text-decoration: underline;
    }
  }

  &-pendingTx {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
  }

  &-txLink {
    font-size: 1.5rem;
    text-decoration: none;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.2);
    }
  }

  // Tabs
  &-tabs {
    display: flex;
    gap: 0;
    padding: 0 1.5rem;
    background: rgba(255, 255, 255, 0.1);
    border-bottom: 2px solid rgba(176, 216, 237, 0.4);
  }

  &-tab {
    flex: 1;
    padding: 1rem;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 3px solid transparent;
    position: relative;
    bottom: -2px;

    &:hover {
      color: white;
      background: rgba(255, 255, 255, 0.05);
    }

    &--active {
      color: white;
      border-bottom-color: white;
      background: rgba(255, 255, 255, 0.1);
    }
  }

  &-tabContent {
    overflow-y: auto;
    max-height: calc(80vh - 200px);
    min-height: 200px;
  }

  // My Wins specific styles
  &-item--myWin {
    cursor: default;

    &:hover {
      transform: none;
    }
  }

  &-winInfo {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  &-winDetails {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &-winAvatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.5);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &-winAvatarPlaceholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 700;
    color: white;
  }

  &-winLabel {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &-winValue {
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
    font-family: 'Courier New', monospace;
  }

  &-shareBtn {
    background: linear-gradient(135deg, #1DA1F2 0%, #0D8BD9 100%);
    border: 2px solid rgba(29, 161, 242, 0.5);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;

    svg {
      flex-shrink: 0;
    }

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #0D8BD9 0%, #1DA1F2 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(29, 161, 242, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
