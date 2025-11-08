<template>
  <div class="BurnHistory">
    <div class="BurnHistory-header">
      <h2 class="BurnHistory-title">🔥 Burn History</h2>
      <button @click="$emit('close')" class="BurnHistory-closeBtn" aria-label="Close">×</button>
    </div>

    <!-- Community Stats -->
    <div class="BurnHistory-stats">
      <h3 class="BurnHistory-statsTitle">Community Stats</h3>
      <div v-if="isLoadingCommunityStats" class="BurnHistory-loading">
        <div class="BurnHistory-spinner"></div>
        <p>Loading community stats...</p>
      </div>
      <div v-else-if="communityStats" class="BurnHistory-statsGrid">
        <div class="BurnHistory-statCard">
          <div class="BurnHistory-statLabel">Total Burns</div>
          <div class="BurnHistory-statValue">{{ formatNumber(communityStats.total_burns) }}</div>
        </div>
        <div class="BurnHistory-statCard">
          <div class="BurnHistory-statLabel">Tokens Burned</div>
          <div class="BurnHistory-statValue">{{ formatTokens(communityStats.total_tokens_burned) }}</div>
        </div>
        <div class="BurnHistory-statCard">
          <div class="BurnHistory-statLabel">USD Burned</div>
          <div class="BurnHistory-statValue">${{ formatNumber(communityStats.total_usd_burned) }}</div>
        </div>
        <div class="BurnHistory-statCard">
          <div class="BurnHistory-statLabel">Unique Burners</div>
          <div class="BurnHistory-statValue">{{ formatNumber(communityStats.unique_burners) }}</div>
        </div>
        <div class="BurnHistory-statCard">
          <div class="BurnHistory-statLabel">Last 24h Burns</div>
          <div class="BurnHistory-statValue">{{ formatNumber(communityStats.last_24h_burns) }}</div>
        </div>
        <div class="BurnHistory-statCard">
          <div class="BurnHistory-statLabel">Last 24h Tokens</div>
          <div class="BurnHistory-statValue">{{ formatTokens(communityStats.last_24h_tokens_burned) }}</div>
        </div>
      </div>
    </div>

    <!-- User History -->
    <div v-if="walletAddress" class="BurnHistory-userSection">
      <h3 class="BurnHistory-userTitle">Your Burn History</h3>
      <div v-if="isLoadingUserHistory" class="BurnHistory-loading">
        <div class="BurnHistory-spinner"></div>
        <p>Loading your history...</p>
      </div>
      <div v-else-if="userHistory && userHistory.length > 0" class="BurnHistory-list">
        <div v-for="burn in userHistory" :key="burn.transaction_signature" class="BurnHistory-item">
          <div class="BurnHistory-itemHeader">
            <span class="BurnHistory-itemDate">{{ formatDate(burn.created_at) }}</span>
            <span class="BurnHistory-itemAmount">${{{ burn.burn_amount_usd.toFixed(2) }}</span>
          </div>
          <div class="BurnHistory-itemDetails">
            <div class="BurnHistory-itemTokens">
              {{ formatTokens(burn.burn_amount_tokens) }} RAINDR0P
            </div>
            <div class="BurnHistory-itemTickets">
              +{{ burn.tickets_received }} ticket{{ burn.tickets_received !== 1 ? 's' : '' }}
            </div>
          </div>
          <div class="BurnHistory-itemTransaction">
            <a
              :href="`https://solscan.io/tx/${burn.transaction_signature}`"
              target="_blank"
              rel="noopener noreferrer"
              class="BurnHistory-itemLink"
            >
              View Transaction →
            </a>
          </div>
        </div>
      </div>
      <div v-else class="BurnHistory-empty">
        <p>No burn history yet. Burn tokens to boost your odds!</p>
      </div>
    </div>

    <!-- Not connected message -->
    <div v-else class="BurnHistory-notConnected">
      <p>Connect your wallet to view your burn history.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BurnHistory',

  props: {
    walletAddress: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      isLoadingCommunityStats: true,
      isLoadingUserHistory: true,
      communityStats: null,
      userHistory: []
    }
  },

  mounted() {
    this.loadCommunityStats()
    if (this.walletAddress) {
      this.loadUserHistory()
    }
  },

  watch: {
    walletAddress(newVal) {
      if (newVal) {
        this.loadUserHistory()
      } else {
        this.userHistory = []
        this.isLoadingUserHistory = false
      }
    }
  },

  methods: {
    async loadCommunityStats() {
      this.isLoadingCommunityStats = true
      try {
        const response = await fetch(`${process.env.VUE_APP_SUPABASE_URL}/rest/v1/rpc/get_community_burn_stats`, {
          headers: {
            'apikey': process.env.VUE_APP_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.VUE_APP_SUPABASE_ANON_KEY}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to load community stats')
        }

        const data = await response.json()
        if (data && data.length > 0) {
          this.communityStats = data[0]
        }
      } catch (error) {
        console.error('Failed to load community stats:', error)
      } finally {
        this.isLoadingCommunityStats = false
      }
    },

    async loadUserHistory() {
      this.isLoadingUserHistory = true
      try {
        const response = await fetch(
          `${process.env.VUE_APP_SUPABASE_URL}/rest/v1/rpc/get_user_burn_history?user_wallet=${encodeURIComponent(this.walletAddress)}`,
          {
            headers: {
              'apikey': process.env.VUE_APP_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${process.env.VUE_APP_SUPABASE_ANON_KEY}`
            }
          }
        )

        if (!response.ok) {
          throw new Error('Failed to load user history')
        }

        this.userHistory = await response.json()
      } catch (error) {
        console.error('Failed to load user history:', error)
      } finally {
        this.isLoadingUserHistory = false
      }
    },

    formatNumber(num) {
      if (!num) return '0'
      return new Intl.NumberFormat('en-US').format(num)
    },

    formatTokens(num) {
      if (!num) return '0'
      if (num >= 1000000) {
        return `${(num / 1000000).toFixed(2)}M`
      } else if (num >= 1000) {
        return `${(num / 1000).toFixed(2)}K`
      }
      return num.toFixed(2)
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`

      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }
}
</script>

<style scoped>
.BurnHistory {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 40, 0.98));
  border: 2px solid rgba(100, 200, 255, 0.3);
  border-radius: 16px;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.BurnHistory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.BurnHistory-title {
  font-size: 28px;
  font-weight: bold;
  color: #fff;
}

.BurnHistory-closeBtn {
  background: none;
  border: none;
  color: #fff;
  font-size: 32px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.BurnHistory-closeBtn:hover {
  opacity: 1;
}

.BurnHistory-stats {
  margin-bottom: 32px;
}

.BurnHistory-statsTitle {
  font-size: 20px;
  font-weight: bold;
  color: #64c8ff;
  margin-bottom: 16px;
}

.BurnHistory-loading {
  text-align: center;
  padding: 40px;
  color: #aaa;
}

.BurnHistory-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(100, 200, 255, 0.3);
  border-top-color: #64c8ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.BurnHistory-statsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.BurnHistory-statCard {
  background: rgba(100, 200, 255, 0.1);
  border: 1px solid rgba(100, 200, 255, 0.3);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.BurnHistory-statLabel {
  font-size: 12px;
  color: #aaa;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.BurnHistory-statValue {
  font-size: 24px;
  font-weight: bold;
  color: #64c8ff;
}

.BurnHistory-userSection {
  margin-top: 32px;
}

.BurnHistory-userTitle {
  font-size: 20px;
  font-weight: bold;
  color: #64ff96;
  margin-bottom: 16px;
}

.BurnHistory-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.BurnHistory-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
}

.BurnHistory-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(100, 200, 255, 0.4);
}

.BurnHistory-itemHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.BurnHistory-itemDate {
  font-size: 14px;
  color: #aaa;
}

.BurnHistory-itemAmount {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b6b;
}

.BurnHistory-itemDetails {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.BurnHistory-itemTokens {
  font-size: 14px;
  color: #fff;
}

.BurnHistory-itemTickets {
  font-size: 14px;
  font-weight: bold;
  color: #64ff96;
}

.BurnHistory-itemTransaction {
  margin-top: 8px;
}

.BurnHistory-itemLink {
  font-size: 12px;
  color: #64c8ff;
  text-decoration: none;
  transition: color 0.2s;
}

.BurnHistory-itemLink:hover {
  color: #50b4eb;
  text-decoration: underline;
}

.BurnHistory-empty {
  text-align: center;
  padding: 32px;
  color: #aaa;
}

.BurnHistory-notConnected {
  text-align: center;
  padding: 32px;
  color: #aaa;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .BurnHistory-statsGrid {
    grid-template-columns: repeat(2, 1fr);
  }

  .BurnHistory-title {
    font-size: 24px;
  }

  .BurnHistory-statValue {
    font-size: 20px;
  }
}
</style>
