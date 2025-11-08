<template>
  <div class="RainPoolHeader">
    <!-- Market Cap (Left) -->
    <div class="RainPoolHeader-marketCap">
      <span class="RainPoolHeader-label">MARKET CAP</span>
      <div v-if="store.isLoadingMarketCap" class="RainPoolHeader-skeleton"></div>
      <span v-else class="RainPoolHeader-value">${{ store.formattedMarketCap }}</span>
    </div>

    <!-- User Avatar (Center) -->
    <div class="RainPoolHeader-userSection">
      <div
        v-if="userAddress"
        class="RainPoolHeader-avatarContainer"
        :class="{ 'RainPoolHeader-avatarContainer--pinned': isPopoverPinned }"
        @mouseenter="handleAvatarHover(true)"
        @mouseleave="handleAvatarHover(false)"
        @click="handleAvatarClick"
      >
        <div v-if="store.isLoadingUserData" class="RainPoolHeader-skeletonAvatar"></div>
        <img
          v-else-if="userAvatar"
          :src="userAvatar"
          :alt="'User Avatar'"
          class="RainPoolHeader-avatar"
        />
        <div v-else class="RainPoolHeader-avatarPlaceholder">
          <span>{{ userAddress.slice(0, 2).toUpperCase() }}</span>
        </div>

        <!-- Wallet Info Popover -->
        <div
          v-if="showPopover"
          class="RainPoolHeader-popover"
          @mouseenter="handlePopoverHover(true)"
          @mouseleave="handlePopoverHover(false)"
          @click.stop
        >
            <div class="RainPoolHeader-popoverHeader">
              <span class="RainPoolHeader-popoverTitle">Wallet Info</span>
              <div class="RainPoolHeader-popoverAddress">
                <span>{{ truncatedAddress }}</span>
                <button
                  class="RainPoolHeader-copyBtn"
                  @click="handleCopy"
                  :title="'Copy address'"
                >
                  <img src="@/assets/images/icons/copy.svg" alt="Copy" />
                  <div v-if="isCopied" class="RainPoolHeader-copyTooltip">Copied!</div>
                </button>
              </div>
            </div>

            <div class="RainPoolHeader-popoverBalances">
              <div class="RainPoolHeader-popoverBalance">
                <span class="RainPoolHeader-popoverBalanceLabel">SOL Balance</span>
                <div v-if="isLoadingBalances" class="RainPoolHeader-skeleton"></div>
                <span v-else>{{ formattedSolBalance }}</span>
              </div>
              <div class="RainPoolHeader-popoverBalance">
                <span class="RainPoolHeader-popoverBalanceLabel">RAINDR0P Balance</span>
                <div v-if="isLoadingBalances" class="RainPoolHeader-skeleton"></div>
                <span v-else>{{ formattedTokenBalance }}</span>
              </div>
              <div class="RainPoolHeader-popoverBalance">
                <span class="RainPoolHeader-popoverBalanceLabel">Token Value</span>
                <div v-if="isLoadingBalances" class="RainPoolHeader-skeleton"></div>
                <span v-else>{{ formattedTokenValue }}</span>
              </div>
            </div>

            <div class="RainPoolHeader-popoverEligibility">
              <div v-if="eligibility.isEligible.value" class="RainPoolHeader-eligible">
                ✅ Eligible for Rain Pool
              </div>
              <div v-else class="RainPoolHeader-ineligible">
                ❌ {{ eligibility.ineligibilityMessage.value }}
              </div>
            </div>

            <div class="RainPoolHeader-popoverSettings">
              <div class="RainPoolHeader-settingLabel">Stats Notifications</div>
              <button
                class="RainPoolHeader-notificationToggle"
                :class="{ 'RainPoolHeader-notificationToggle--active': statsToastsEnabled }"
                @click="handleToggleStatsToasts"
                :title="statsToastsEnabled ? 'Disable stats notifications' : 'Enable stats notifications'"
              >
                <svg
                  v-if="statsToastsEnabled"
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M6.3 5.3a4.9 4.9 0 0 1 11.4 2.7c0 3.5 1.5 5.5 2.3 6.5H3c.8-1 2.3-3 2.3-6.5 0-.3 0-.6.1-.9"></path>
                  <path d="M10.3 21a2 2 0 0 0 3.4 0"></path>
                  <line x1="2" y1="2" x2="22" y2="22"></line>
                </svg>
              </button>
            </div>

            <div class="RainPoolHeader-popoverActions">
              <button
                class="RainPoolHeader-refreshBtn"
                @click="handleRefresh"
                :disabled="isLoadingBalances"
              >
                <span
                  class="RainPoolHeader-refreshIcon"
                  :class="{ 'RainPoolHeader-refreshIcon--spinning': isLoadingBalances }"
                >
                  ↻
                </span>
                {{ isLoadingBalances ? 'Refreshing...' : 'Refresh Balances' }}
              </button>
              <button class="RainPoolHeader-disconnectBtn" @click="handleDisconnect">
                Disconnect Wallet
              </button>
            </div>
          </div>
      </div>

      <ActionButton
        v-else
        size="sm"
        variant="primary"
        class="RainPoolHeader-connectBtn"
        @click="$emit('connect-wallet')"
      >
        <img
          src="@/assets/images/icons/phantom.wallet.png"
          alt="Phantom Wallet"
          class="RainPoolHeader-connectIcon"
        />
        Connect Wallet
      </ActionButton>
    </div>

    <!-- Pool Giveaway (Right) -->
    <div class="RainPoolHeader-poolGiveaway">
      <span class="RainPoolHeader-label">POOL GIVEAWAY</span>
      <div v-if="store.isLoadingMarketCap" class="RainPoolHeader-skeleton"></div>
      <div v-else class="RainPoolHeader-giveawayContent">
        <span class="RainPoolHeader-value">
          {{ store.formattedPoolGiveaway }} SOL
        </span>
        <span v-if="store.currentPool?.creator_rewards_updated_at" class="RainPoolHeader-lastUpdate">
          Updated {{ formatTimeAgo(store.currentPool.creator_rewards_updated_at) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRainPoolStore } from '@/stores/rainPool'
import { useEligibility } from '@/composables/rain-pool/useEligibility'
import { useClipboard } from '@/composables/rain-pool/useClipboard'
import ActionButton from '@/components/ActionButton.vue'

const props = defineProps({
  userAddress: String,
  userAvatar: String,
  solBalance: Number,
  tokenBalance: Number,
  isLoadingBalances: Boolean,
  statsToastsEnabled: {
    type: Boolean,
    default: true
  }
})

// eslint-disable-next-line no-unused-vars
const emit = defineEmits([
  'connect-wallet',
  'disconnect-wallet',
  'refresh-balances',
  'toggle-stats-toasts'
])

const store = useRainPoolStore()
const { isCopied, copyToClipboard } = useClipboard()
const eligibility = useEligibility(
  computed(() => props.userAddress),
  computed(() => props.tokenBalance)
)

const showPopover = ref(false)
const isPopoverPinned = ref(false)
const isHoveringPopover = ref(false)

const truncatedAddress = computed(() => {
  if (!props.userAddress) return ''
  return `${props.userAddress.slice(0, 4)}...${props.userAddress.slice(-4)}`
})

const formattedSolBalance = computed(() => props.solBalance.toFixed(4) + ' SOL')
const formattedTokenBalance = computed(() => props.tokenBalance.toLocaleString() + ' RAINDR0P')
const formattedTokenValue = computed(() => {
  console.log('💰 Computing token value:', {
    tokenPriceUsd: store.tokenPriceUsd,
    tokenBalance: props.tokenBalance,
    calculatedValue: eligibility.tokenValueUsd.value
  })

  if (!store.tokenPriceUsd) {
    console.warn('⚠️ No token price USD in store')
    return '$0.00 USD'
  }
  return `$${eligibility.tokenValueUsd.value.toFixed(2)} USD`
})

function handleAvatarHover(isHovering) {
  if (!isPopoverPinned.value) {
    if (isHovering) {
      showPopover.value = true
    } else {
      // Delay hiding to allow moving to popover
      setTimeout(() => {
        if (!isHoveringPopover.value && !isPopoverPinned.value) {
          showPopover.value = false
        }
      }, 100)
    }
  }
}

function handlePopoverHover(isHovering) {
  isHoveringPopover.value = isHovering
  if (!isHovering && !isPopoverPinned.value) {
    showPopover.value = false
  }
}

// Format timestamp to "X mins ago" or "X hours ago"
function formatTimeAgo(timestamp) {
  if (!timestamp) return ''

  const now = new Date()
  const past = new Date(timestamp)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins === 1) return '1 min ago'
  if (diffMins < 60) return `${diffMins} mins ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours === 1) return '1 hour ago'
  if (diffHours < 24) return `${diffHours} hours ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

function handleAvatarClick(event) {
  event.stopPropagation()
  isPopoverPinned.value = !isPopoverPinned.value
  showPopover.value = isPopoverPinned.value || showPopover.value
}

function handleClickOutside(event) {
  if (isPopoverPinned.value) {
    const avatarContainer = event.target.closest('.RainPoolHeader-avatarContainer')
    const popover = event.target.closest('.RainPoolHeader-popover')

    if (!avatarContainer && !popover) {
      showPopover.value = false
      isPopoverPinned.value = false
    }
  }
}

async function handleCopy() {
  await copyToClipboard(props.userAddress)
}

function handleRefresh() {
  emit('refresh-balances')
}

function handleDisconnect() {
  showPopover.value = false
  isPopoverPinned.value = false
  emit('disconnect-wallet')
}

function handleToggleStatsToasts() {
  emit('toggle-stats-toasts', !props.statsToastsEnabled)
}

// Add click outside listener
if (typeof document !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}
</script>

<style scoped lang="scss">
.RainPoolHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(157, 196, 223, 0.3);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-radius: 10px;
  border: 2px solid rgba(176, 216, 237, 0.4);
  margin-bottom: 1rem;

  &-marketCap,
  &-poolGiveaway {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    flex: 1;
  }

  &-marketCap {
    align-items: flex-start;
  }

  &-poolGiveaway {
    align-items: flex-end;
  }

  &-giveawayContent {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.125rem;
  }

  &-lastUpdate {
    font-size: 0.5rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
  }

  &-label {
    font-size: 0.625rem;
    font-weight: 700;
    color: white;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  &-value {
    font-size: 1rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 8px rgba(255, 255, 255, 0.3);
  }

  &-skeleton {
    width: 80px;
    height: 16px;
    background: linear-gradient(90deg, rgba(76, 174, 224, 0.1) 0%, rgba(76, 174, 224, 0.2) 50%, rgba(76, 174, 224, 0.1) 100%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
    border-radius: 4px;
  }

  &-skeletonAvatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(90deg, rgba(76, 174, 224, 0.1) 0%, rgba(76, 174, 224, 0.2) 50%, rgba(76, 174, 224, 0.1) 100%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }

  &-userSection {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }

  &-avatarContainer {
    position: relative;
    cursor: pointer;
    transition: transform 0.2s ease;
    z-index: 1;

    &:hover {
      transform: scale(1.05);
    }

    &--pinned {
      // Remove the blue glow ring when pinned
    }
  }

  &-avatar,
  &-avatarPlaceholder {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid rgba(176, 216, 237, 0.5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &-avatar {
    object-fit: cover;
  }

  &-avatarPlaceholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(157, 196, 223, 0.3);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
  }

  &-popover {
    position: absolute;
    bottom: calc(100% + 0.5rem);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(157, 196, 223, 0.98);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 2px solid rgba(176, 216, 237, 0.5);
    border-radius: 8px;
    padding: 0.5rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    z-index: 100000;
    min-width: 180px;

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid rgba(157, 196, 223, 0.98);
    }
  }

  &-popoverHeader {
    margin-bottom: 0.375rem;
    padding-bottom: 0.375rem;
    border-bottom: 1px solid rgba(176, 216, 237, 0.4);
  }

  &-popoverTitle {
    font-size: 0.5625rem;
    font-weight: 700;
    color: white;
    display: block;
    margin-bottom: 0.2rem;
  }

  &-popoverAddress {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
    font-family: 'Courier New', monospace;
    font-size: 0.5rem;
    color: white;
  }

  &-copyBtn {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(176, 216, 237, 0.3);
    border-radius: 3px;
    padding: 0.2rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    img {
      width: 12px;
      height: 12px;
      filter: brightness(0) invert(1);
    }

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(176, 216, 237, 0.5);
    }
  }

  &-copyTooltip {
    position: absolute;
    bottom: -22px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-size: 0.625rem;
    white-space: nowrap;
  }

  &-popoverBalances {
    margin-bottom: 0.375rem;
  }

  &-popoverBalance {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.2rem 0;
    color: white;
    font-size: 0.5rem;
  }

  &-popoverBalanceLabel {
    font-size: 0.5rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
  }

  &-popoverEligibility {
    margin-bottom: 0.375rem;
    padding: 0.3rem;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.1);
  }

  &-eligible,
  &-ineligible {
    font-size: 0.5rem;
    font-weight: 600;
    text-align: center;
    color: white;
  }

  &-popoverSettings {
    margin-bottom: 0.375rem;
    padding: 0.4rem 0.5rem;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(176, 216, 237, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  &-settingLabel {
    font-size: 0.5625rem;
    color: white;
    font-weight: 600;
    letter-spacing: 0.02em;
    flex: 1;
  }

  &-notificationToggle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 2px solid rgba(176, 216, 237, 0.3);
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.5);
    padding: 0;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(176, 216, 237, 0.5);
      transform: scale(1.05);
    }

    &--active {
      background: rgba(76, 174, 224, 0.3);
      border-color: rgba(76, 174, 224, 0.6);
      color: white;

      &:hover {
        background: rgba(76, 174, 224, 0.4);
        border-color: rgba(76, 174, 224, 0.8);
      }
    }

    svg {
      flex-shrink: 0;
    }
  }

  &-popoverActions {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    button {
      padding: 0.3rem 0.4rem;
      border-radius: 5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      font-size: 0.5rem;
    }
  }

  &-refreshBtn {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 2px solid rgba(176, 216, 237, 0.4) !important;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(176, 216, 237, 0.6) !important;
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &-refreshIcon {
    display: inline-block;
    transition: transform 0.3s ease;

    &--spinning {
      animation: spin 1s linear infinite;
    }
  }

  &-disconnectBtn {
    background: rgba(224, 76, 76, 0.6);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 2px solid rgba(224, 76, 76, 0.8) !important;
    color: white;

    &:hover {
      background: rgba(224, 76, 76, 0.8);
      border-color: rgba(224, 76, 76, 1) !important;
      transform: translateY(-2px);
    }
  }

  &-connectBtn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #9381DD !important;
    border: 2px solid rgba(147, 129, 221, 0.6) !important;

    &:hover {
      background: #a594e8 !important;
      border-color: rgba(147, 129, 221, 0.8) !important;
      transform: translateY(-2px);

      .RainPoolHeader-connectIcon {
        animation: shake 0.5s ease-in-out;
      }
    }
  }

  &-connectIcon {
    width: 20px;
    height: 20px;
  }

  @keyframes shake {
    0%, 100% {
      transform: rotate(0deg);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: rotate(-10deg);
    }
    20%, 40%, 60%, 80% {
      transform: rotate(10deg);
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
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
