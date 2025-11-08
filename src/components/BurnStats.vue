<template>
  <div>
    <div class="BurnStats" @click="showLeaderboard = true">
      <div class="BurnStats-header">
        <div class="BurnStats-title">
          <span class="BurnStats-icon">🔥</span>
          <span>Token Burn Progress</span>
        </div>
        <div v-if="!isLoading" class="BurnStats-amount">
          <span class="BurnStats-pulse"></span>
          ${{ formattedUsdBurned }} burned
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="BurnStats-progressContainer">
        <div class="BurnStats-progressBar">
          <div
            class="BurnStats-progressFill"
            :style="{ width: burnPercentage + '%' }"
          >
            <span v-if="parseFloat(burnPercentage) > 5" class="BurnStats-progressText">{{ burnPercentage }}%</span>
            <div class="BurnStats-shimmer"></div>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="BurnStats-stats">
        <div class="BurnStats-stat">
          <span class="BurnStats-statLabel">Burned:</span>
          <span class="BurnStats-statValue">{{ formattedTokensBurned }}</span>
        </div>
        <div class="BurnStats-stat">
          <span class="BurnStats-statLabel">Supply:</span>
          <span class="BurnStats-statValue">{{ formattedSupply }}</span>
        </div>
      </div>

      <!-- Click indicator -->
      <div class="BurnStats-clickHint">
        Click to view leaderboard 📊
      </div>
    </div>

    <!-- Leaderboard Modal -->
    <BurnLeaderboard
      :is-open="showLeaderboard"
      @close="showLeaderboard = false"
    />
  </div>
</template>

<script>
import BurnLeaderboard from './BurnLeaderboard.vue'

export default {
  name: 'BurnStats',

  components: {
    BurnLeaderboard
  },

  data() {
    return {
      isLoading: true,
      totalTokensBurned: 0,
      totalUsdBurned: 0,
      totalSupply: 1000000000, // 1 billion total supply (adjust if different)
      refreshInterval: null,
      showLeaderboard: false
    }
  },

  computed: {
    formattedTokensBurned() {
      return this.formatNumber(this.totalTokensBurned)
    },

    formattedUsdBurned() {
      return this.formatNumber(this.totalUsdBurned, 2)
    },

    formattedSupply() {
      return this.formatNumber(this.totalSupply)
    },

    burnPercentage() {
      if (this.totalSupply === 0) return '0.00'
      const percentage = (this.totalTokensBurned / this.totalSupply) * 100
      return percentage.toFixed(2)
    }
  },

  mounted() {
    this.loadBurnStats()
    // Refresh every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadBurnStats()
    }, 30000)
  },

  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  },

  methods: {
    async loadBurnStats() {
      try {
        const SupabaseService = require('@/services/SupabaseService').default

        // Call the get_community_burn_stats function
        const { data, error } = await SupabaseService.supabase
          .rpc('get_community_burn_stats')

        if (error) {
          console.error('Error loading burn stats:', error)
          return
        }

        if (data && data.length > 0) {
          const stats = data[0]
          this.totalTokensBurned = parseFloat(stats.total_tokens_burned || 0)
          this.totalUsdBurned = parseFloat(stats.total_usd_burned || 0)
        }

        this.isLoading = false
      } catch (error) {
        console.error('Error loading burn stats:', error)
        this.isLoading = false
      }
    },

    formatNumber(num, decimals = 0) {
      if (!num || isNaN(num)) return '0'

      // For large numbers, use compact notation (K, M, B)
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

.BurnStats {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 12px;
  margin: 12px 0 0 0;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @include sm-down {
    padding: 10px;
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: $white;
    font-size: 14px;
    font-weight: 600;

    @include sm-down {
      font-size: 13px;
    }
  }

  &-icon {
    font-size: 18px;
  }

  &-amount {
    color: #00ff88;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 6px;

    @include sm-down {
      font-size: 12px;
    }
  }

  &-pulse {
    width: 8px;
    height: 8px;
    background: #00ff88;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  &-progressContainer {
    margin-bottom: 6px;
  }

  &-progressBar {
    width: 100%;
    height: 20px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    overflow: hidden;
    position: relative;
  }

  &-progressFill {
    height: 100%;
    background: linear-gradient(90deg, #00ff88 0%, #00cc6a 100%);
    border-radius: 12px;
    transition: width 0.5s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  &-shimmer {
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }

  &-progressText {
    color: $white;
    font-size: 12px;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    position: relative;
    z-index: 1;
  }

  &-stats {
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }

  &-stat {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &-statLabel {
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    font-weight: 500;
  }

  &-statValue {
    color: $white;
    font-size: 13px;
    font-weight: 700;
  }

  &-clickHint {
    text-align: center;
    color: rgba(255, 255, 255, 0.6);
    font-size: 10px;
    font-weight: 500;
    margin-top: 6px;
    opacity: 0.7;
    transition: opacity 0.2s ease;

    .BurnStats:hover & {
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }

  @keyframes shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }
}
</style>
