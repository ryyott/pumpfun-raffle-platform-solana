<template>
  <div class="BurnLeaderboard" v-if="isOpen">
    <div class="BurnLeaderboard-overlay" @click="close"></div>
    <div class="BurnLeaderboard-modal">
      <button class="BurnLeaderboard-close" @click="close" aria-label="Close">✕</button>

      <!-- Header -->
      <div class="BurnLeaderboard-header">
        <h2 class="BurnLeaderboard-title">🔥 Burn Leaderboard</h2>
        <p class="BurnLeaderboard-subtitle">Top token burners ranked by total burned</p>
      </div>

      <!-- Tabs -->
      <div class="BurnLeaderboard-tabs">
        <button
          class="BurnLeaderboard-tab"
          :class="{ 'is-active': activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          All Time
        </button>
        <button
          class="BurnLeaderboard-tab"
          :class="{ 'is-active': activeTab === 'monthly' }"
          @click="activeTab = 'monthly'"
        >
          Monthly
        </button>
        <button
          class="BurnLeaderboard-tab"
          :class="{ 'is-active': activeTab === 'weekly' }"
          @click="activeTab = 'weekly'"
        >
          Weekly
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="BurnLeaderboard-loading">
        <div class="BurnLeaderboard-spinner"></div>
        <p>Loading leaderboard...</p>
      </div>

      <!-- Leaderboard List -->
      <div v-else-if="filteredLeaderboard.length > 0" class="BurnLeaderboard-list">
        <div
          v-for="(entry, index) in filteredLeaderboard"
          :key="entry.wallet_address"
          class="BurnLeaderboard-entry"
          :class="{ 'is-podium': index < 3 }"
        >
          <!-- Rank Badge -->
          <div class="BurnLeaderboard-rank" :class="`rank-${index + 1}`">
            <span v-if="index === 0">🥇</span>
            <span v-else-if="index === 1">🥈</span>
            <span v-else-if="index === 2">🥉</span>
            <span v-else>#{{ index + 1 }}</span>
          </div>

          <!-- Avatar -->
          <div class="BurnLeaderboard-avatar">
            <img
              v-if="entry.avatar"
              :src="getAvatarPath(entry.avatar)"
              :alt="entry.wallet_address"
            />
            <div v-else class="BurnLeaderboard-avatarPlaceholder">
              {{ entry.wallet_address.slice(0, 2).toUpperCase() }}
            </div>
          </div>

          <!-- User Info -->
          <div class="BurnLeaderboard-info">
            <a
              :href="getSolscanUrl(entry.wallet_address)"
              target="_blank"
              rel="noopener noreferrer"
              class="BurnLeaderboard-wallet"
              @click.stop
            >
              {{ truncateAddress(entry.wallet_address) }}
              <span class="BurnLeaderboard-externalIcon">🔗</span>
            </a>
            <div class="BurnLeaderboard-burns">
              {{ entry.total_burns }} burn{{ entry.total_burns !== 1 ? 's' : '' }}
            </div>
          </div>

          <!-- Amount Burned -->
          <div class="BurnLeaderboard-amount">
            <div class="BurnLeaderboard-tokens">
              {{ formatNumber(entry.total_tokens_burned) }} 🔥
            </div>
            <div class="BurnLeaderboard-usd">
              ${{ formatNumber(entry.total_usd_burned, 2) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="BurnLeaderboard-empty">
        <div class="BurnLeaderboard-emptyIcon">📊</div>
        <p>No burns recorded yet for this period</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BurnLeaderboard',

  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      isLoading: true,
      activeTab: 'all', // 'all', 'monthly', 'weekly'
      leaderboardData: []
    }
  },

  computed: {
    filteredLeaderboard() {
      let filtered = [...this.leaderboardData]

      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      if (this.activeTab === 'weekly') {
        filtered = filtered.filter(entry => {
          const lastBurn = new Date(entry.last_burn_at)
          return lastBurn >= oneWeekAgo
        })
      } else if (this.activeTab === 'monthly') {
        filtered = filtered.filter(entry => {
          const lastBurn = new Date(entry.last_burn_at)
          return lastBurn >= oneMonthAgo
        })
      }

      // Sort by total USD burned (descending) and take top 10
      return filtered
        .sort((a, b) => parseFloat(b.total_usd_burned) - parseFloat(a.total_usd_burned))
        .slice(0, 10)
    }
  },

  watch: {
    isOpen(newVal) {
      if (newVal) {
        this.loadLeaderboard()
      }
    }
  },

  methods: {
    close() {
      this.$emit('close')
    },

    async loadLeaderboard() {
      this.isLoading = true

      try {
        const SupabaseService = require('@/services/SupabaseService').default

        // Query burn_transactions grouped by wallet
        const { data, error } = await SupabaseService.supabase
          .from('burn_transactions')
          .select('wallet_address, burn_amount_tokens, burn_amount_usd, created_at')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading leaderboard:', error)
          this.isLoading = false
          return
        }

        // Group by wallet and calculate totals
        const walletStats = {}

        data.forEach(burn => {
          if (!walletStats[burn.wallet_address]) {
            walletStats[burn.wallet_address] = {
              wallet_address: burn.wallet_address,
              total_burns: 0,
              total_tokens_burned: 0,
              total_usd_burned: 0,
              last_burn_at: burn.created_at
            }
          }

          walletStats[burn.wallet_address].total_burns++
          walletStats[burn.wallet_address].total_tokens_burned += parseFloat(burn.burn_amount_tokens || 0)
          walletStats[burn.wallet_address].total_usd_burned += parseFloat(burn.burn_amount_usd || 0)

          // Keep track of most recent burn
          if (new Date(burn.created_at) > new Date(walletStats[burn.wallet_address].last_burn_at)) {
            walletStats[burn.wallet_address].last_burn_at = burn.created_at
          }
        })

        // Fetch user avatars
        const walletAddresses = Object.keys(walletStats)
        if (walletAddresses.length > 0) {
          const { data: users } = await SupabaseService.supabase
            .from('users')
            .select('wallet_address, avatar')
            .in('wallet_address', walletAddresses)

          // Add avatars to wallet stats
          users?.forEach(user => {
            if (walletStats[user.wallet_address]) {
              walletStats[user.wallet_address].avatar = user.avatar
            }
          })
        }

        this.leaderboardData = Object.values(walletStats)
        this.isLoading = false
      } catch (error) {
        console.error('Error loading leaderboard:', error)
        this.isLoading = false
      }
    },

    getAvatarPath(avatar) {
      if (!avatar) return null
      if (avatar.startsWith('/raindrops/')) return avatar
      return `/raindrops/${avatar}`
    },

    truncateAddress(address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    },

    getSolscanUrl(walletAddress) {
      return `https://solscan.io/account/${walletAddress}`
    },

    formatNumber(num, decimals = 0) {
      if (!num || isNaN(num)) return '0'

      // For large numbers, use compact notation
      if (num >= 1000000000) {
        return (num / 1000000000).toFixed(decimals) + 'B'
      } else if (num >= 1000000) {
        return (num / 1000000).toFixed(decimals) + 'M'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(decimals) + 'K'
      }

      return num.toFixed(decimals)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables';
@import '@/styles/breakpoints';

.BurnLeaderboard {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  &-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }

  &-modal {
    position: relative;
    background: linear-gradient(135deg, #4CAEE0 0%, #3a8fb8 100%);
    border-radius: 20px;
    padding: 32px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

    @include sm-down {
      padding: 24px;
      max-height: 85vh;
    }
  }

  &-close {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid $white;
    border-radius: 50%;
    width: 44px;
    height: 44px;
    font-size: 32px;
    font-weight: bold;
    color: $white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

    &:hover {
      background: #ff4444;
      border-color: $white;
      transform: rotate(90deg) scale(1.1);
      box-shadow: 0 4px 12px rgba(255, 0, 0, 0.5);
    }

    &:active {
      transform: rotate(90deg) scale(0.95);
    }
  }

  &-header {
    margin-bottom: 24px;
  }

  &-title {
    color: $white;
    font-size: 28px;
    font-weight: bold;
    margin: 0 0 8px 0;

    @include sm-down {
      font-size: 24px;
    }
  }

  &-subtitle {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    margin: 0;
  }

  &-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    background: rgba(0, 0, 0, 0.15);
    padding: 4px;
    border-radius: 12px;
  }

  &-tab {
    flex: 1;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    font-weight: 600;
    padding: 10px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      color: $white;
      background: rgba(255, 255, 255, 0.1);
    }

    &.is-active {
      background: rgba(255, 255, 255, 0.25);
      color: $white;
    }
  }

  &-loading {
    text-align: center;
    padding: 40px 20px;
    color: $white;
  }

  &-spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 16px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: $white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &-entry {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: border-color 0.2s ease;

    &:hover {
      border-color: rgba(255, 255, 255, 0.4);
    }

    &.is-podium {
      background: rgba(255, 215, 0, 0.15);
      border-color: rgba(255, 215, 0, 0.3);
    }

    @include sm-down {
      padding: 12px;
      gap: 12px;
    }
  }

  &-rank {
    font-size: 20px;
    font-weight: bold;
    color: $white;
    min-width: 40px;
    text-align: center;

    &.rank-1,
    &.rank-2,
    &.rank-3 {
      font-size: 24px;
    }

    @include sm-down {
      min-width: 32px;
      font-size: 16px;

      &.rank-1,
      &.rank-2,
      &.rank-3 {
        font-size: 20px;
      }
    }
  }

  &-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid rgba(255, 255, 255, 0.3);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    @include sm-down {
      width: 40px;
      height: 40px;
    }
  }

  &-avatarPlaceholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #00ff88, #00cc6a);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $white;
    font-weight: bold;
    font-size: 16px;
  }

  &-info {
    flex: 1;
    min-width: 0;
  }

  &-wallet {
    color: $white;
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 0.2s ease;

    &:hover {
      color: #00ff88;
    }

    @include sm-down {
      font-size: 14px;
    }
  }

  &-externalIcon {
    font-size: 12px;
    opacity: 0.7;
    transition: opacity 0.2s ease;

    .BurnLeaderboard-wallet:hover & {
      opacity: 1;
    }
  }

  &-burns {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
  }

  &-amount {
    text-align: right;
    flex-shrink: 0;
  }

  &-tokens {
    color: $white;
    font-size: 15px;
    font-weight: bold;
    margin-bottom: 4px;

    @include sm-down {
      font-size: 14px;
    }
  }

  &-usd {
    color: #00ff88;
    font-size: 13px;
    font-weight: 700;

    @include sm-down {
      font-size: 12px;
    }
  }

  &-empty {
    text-align: center;
    padding: 60px 20px;
    color: $white;
  }

  &-emptyIcon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
