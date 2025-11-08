<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="UserStatsModal-overlay" @click.self="$emit('close')">
        <div class="UserStatsModal">
          <button class="UserStatsModal-close" @click="$emit('close')" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="UserStatsModal-closeIcon">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div class="UserStatsModal-content">
            <!-- Avatar -->
            <div class="UserStatsModal-avatarContainer">
              <img
                v-if="participant?.avatar"
                :src="participant.avatar"
                :alt="participant.address"
                class="UserStatsModal-avatar"
              />
              <div v-else-if="participant?.icon" class="UserStatsModal-icon">
                {{ participant.icon }}
              </div>
            </div>

            <!-- Wallet Address -->
            <div class="UserStatsModal-section">
              <div class="UserStatsModal-label">Wallet Address</div>
              <div class="UserStatsModal-addressRow">
                <a
                  :href="solscanUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="UserStatsModal-address"
                  title="View on Solscan"
                >
                  {{ truncatedAddress }}
                </a>
                <button
                  class="UserStatsModal-copyBtn"
                  @click="copyAddress"
                  :title="copied ? 'Copied!' : 'Copy address'"
                >
                  <svg v-if="!copied" class="UserStatsModal-copyIcon" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <path d="M53.9791489,9.1429005H50.010849c-0.0826988,0-0.1562004,0.0283995-0.2331009,0.0469999V5.0228 C49.7777481,2.253,47.4731483,0,44.6398468,0h-34.422596C7.3839517,0,5.0793519,2.253,5.0793519,5.0228v46.8432999 c0,2.7697983,2.3045998,5.0228004,5.1378999,5.0228004h6.0367002v2.2678986C16.253952,61.8274002,18.4702511,64,21.1954517,64 h32.783699c2.7252007,0,4.9414978-2.1725998,4.9414978-4.8432007V13.9861002 C58.9206467,11.3155003,56.7043495,9.1429005,53.9791489,9.1429005z M7.1110516,51.8661003V5.0228 c0-1.6487999,1.3938999-2.9909999,3.1062002-2.9909999h34.422596c1.7123032,0,3.1062012,1.3422,3.1062012,2.9909999v46.8432999 c0,1.6487999-1.393898,2.9911003-3.1062012,2.9911003h-34.422596C8.5049515,54.8572006,7.1110516,53.5149002,7.1110516,51.8661003z M56.8888474,59.1567993c0,1.550602-1.3055,2.8115005-2.9096985,2.8115005h-32.783699 c-1.6042004,0-2.9097996-1.2608986-2.9097996-2.8115005v-2.2678986h26.3541946 c2.8333015,0,5.1379013-2.2530022,5.1379013-5.0228004V11.1275997c0.0769005,0.0186005,0.1504021,0.0469999,0.2331009,0.0469999 h3.9682999c1.6041985,0,2.9096985,1.2609005,2.9096985,2.8115005V59.1567993z"/>
                  </svg>
                  <span v-else class="UserStatsModal-checkmark">✓</span>
                </button>
              </div>
            </div>

            <!-- Token Holdings -->
            <div class="UserStatsModal-section">
              <div class="UserStatsModal-label">RainDr0p Holdings</div>
              <div class="UserStatsModal-value">
                {{ formattedTokenBalance }}
              </div>
            </div>

            <!-- Tickets -->
            <div class="UserStatsModal-section">
              <div class="UserStatsModal-label">Tickets in Pool</div>
              <div class="UserStatsModal-value">
                {{ participant?.total_tickets || 0 }}
              </div>
            </div>

            <!-- Win Chance -->
            <div class="UserStatsModal-section">
              <div class="UserStatsModal-label">Win Chance</div>
              <div class="UserStatsModal-value UserStatsModal-value--highlight">
                {{ winChance }}
              </div>
            </div>

            <!-- First Joined -->
            <div v-if="firstJoined" class="UserStatsModal-section">
              <div class="UserStatsModal-label">First Joined</div>
              <div class="UserStatsModal-value">
                {{ firstJoined }}
              </div>
            </div>

            <!-- Total Wins -->
            <div v-if="totalWins !== null" class="UserStatsModal-section">
              <div class="UserStatsModal-label">Total Rain Pool Wins</div>
              <div class="UserStatsModal-value UserStatsModal-value--highlight">
                {{ totalWins }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRainPoolStore } from '@/stores/rainPool'
import SupabaseService from '@/services/SupabaseService'

const props = defineProps({
  show: Boolean,
  participant: Object,
})

defineEmits(['close'])

const store = useRainPoolStore()
const copied = ref(false)
const totalWins = ref(null)
const firstJoined = ref(null)
const tokenBalance = ref(null)

const truncatedAddress = computed(() => {
  if (!props.participant?.address) return ''
  const addr = props.participant.address
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
})

const solscanUrl = computed(() => {
  if (!props.participant?.address) return ''
  return `https://solscan.io/account/${props.participant.address}`
})

const formattedTokenBalance = computed(() => {
  if (!tokenBalance.value) return '0'
  const balance = parseFloat(tokenBalance.value)
  return balance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
})

const winChance = computed(() => {
  if (!props.participant || store.participants.length === 0) return '0%'

  const totalTickets = store.participants.reduce((sum, p) => sum + (p.total_tickets || 1), 0)
  const userTickets = props.participant.total_tickets || 1
  const percentage = (userTickets / totalTickets) * 100

  return `${percentage.toFixed(2)}%`
})

function copyAddress() {
  if (!props.participant?.address) return

  navigator.clipboard.writeText(props.participant.address).then(() => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }).catch(err => {
    console.error('Failed to copy:', err)
  })
}

async function loadUserStats() {
  if (!props.participant?.address) return

  try {
    // Get total wins from rain_pool_winners table
    const { data: wins, error: winsError } = await SupabaseService.supabase
      .from('rain_pool_winners')
      .select('id')
      .eq('wallet_address', props.participant.address)

    if (!winsError && wins) {
      totalWins.value = wins.length
    }

    // Get user data from users table (token_balance and created_at)
    const { data: userData, error: userError } = await SupabaseService.supabase
      .from('users')
      .select('created_at, token_balance')
      .eq('wallet_address', props.participant.address)
      .single()

    if (!userError && userData) {
      // Set token balance
      if (userData.token_balance) {
        tokenBalance.value = userData.token_balance
      }

      // Set first joined date
      if (userData.created_at) {
        const date = new Date(userData.created_at)
        firstJoined.value = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }
    }
  } catch (err) {
    console.error('Error loading user stats:', err)
  }
}

// Load stats when participant changes
watch(() => props.participant?.address, (newAddress) => {
  if (newAddress && props.show) {
    loadUserStats()
  }
}, { immediate: true })

// Load stats when modal opens
watch(() => props.show, (isShown) => {
  if (isShown && props.participant?.address) {
    loadUserStats()
  }
})

onMounted(() => {
  if (props.show && props.participant?.address) {
    loadUserStats()
  }
})
</script>

<style scoped lang="scss">
.UserStatsModal {
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
    z-index: 9999;
    padding: 1rem;
  }

  position: relative;
  max-width: 400px;
  width: 100%;
  background: linear-gradient(135deg, rgba(135, 206, 235, 0.95) 0%, rgba(94, 182, 227, 0.95) 50%, rgba(76, 174, 224, 0.95) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 2px solid rgba(176, 216, 237, 0.6);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 2rem;

  &-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }
  }

  &-closeIcon {
    width: 18px;
    height: 18px;
    stroke: white;
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &-avatarContainer {
    display: flex;
    justify-content: center;
    margin-bottom: 0.5rem;
  }

  &-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  &-icon {
    font-size: 64px;
    line-height: 1;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &-section {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    padding: 1rem;
  }

  &-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  &-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

    &--highlight {
      font-size: 1.5rem;
      color: #FFD700;
      text-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
    }
  }

  &-addressRow {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &-address {
    font-size: 1rem;
    font-weight: 600;
    color: white;
    font-family: monospace;
    text-decoration: none;
    transition: all 0.2s ease;
    flex: 1;

    &:hover {
      color: #FFD700;
      text-shadow: 0 0 8px rgba(255, 215, 0, 0.6);
    }
  }

  &-copyBtn {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    padding: 0.4rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &-copyIcon {
    width: 16px;
    height: 16px;
    fill: white;
  }

  &-checkmark {
    color: #4cae60;
    font-size: 1.25rem;
    font-weight: 700;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;

  .UserStatsModal {
    transition: transform 0.2s ease;
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .UserStatsModal {
    transform: scale(0.9);
  }
}
</style>
