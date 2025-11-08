<template>
  <section class="RainPoolView Section" id="rainpool">
    <div class="RainPoolView-inner View">
      <div class="RainPoolView-content">
        <h1 class="RainPoolView-title">Rain Pool</h1>
        <p class="RainPoolView-description text-lg">
          Join the Rain Pool and experience the excitement of community-driven rewards. 
          Watch as raindrops accumulate and distribute among participants in real-time.
        </p>

        <!-- Rain Pool Roller Component (Always Visible) -->
        <div class="RainPoolView-roller">
          <RainPoolRoller
            ref="rainPoolRoller"
            :is-eligible="isConnected && isEligible"
            :user-address="walletAddress || ''"
            :user-avatar="userAvatarPath || ''"
            :sol-balance="balances.sol"
            :token-balance="balances.token"
            :is-loading-balances="isLoadingBalances"
            :is-loading-user-data="isLoadingUserData"
            :stats-toasts-enabled="tokenStats.isEnabled.value"
            @joined="handlePoolJoined"
            @join-error="handleJoinError"
            @winners-selected="handleWinnersSelected"
            @connect-wallet="connectWallet"
            @disconnect-wallet="disconnectWallet"
            @refresh-balances="refreshBalances"
            @toggle-stats-toasts="handleToggleStatsToasts"
          />
        </div>



        <!-- Error Display -->
        <div v-if="error" class="RainPoolView-error">
          <p>{{ error }}</p>
          <button @click="clearError" class="RainPoolView-errorClose">×</button>
        </div>
      </div>
    </div>

    <!-- Animated raindrops -->
    <div class="RainPoolView-raindrops">
      <div class="RainPoolView-raindrop RainPoolView-raindrop--1"></div>
      <div class="RainPoolView-raindrop RainPoolView-raindrop--2"></div>
      <div class="RainPoolView-raindrop RainPoolView-raindrop--3"></div>
      <div class="RainPoolView-raindrop RainPoolView-raindrop--4"></div>
      <div class="RainPoolView-raindrop RainPoolView-raindrop--5"></div>
    </div>

    <!-- Cloud SVGs -->
    <svg class="RainPoolView-cloud RainPoolView-cloud--1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 300" role="img" aria-label="Rain cloud">
      <defs>
        <radialGradient id="rainSheen1" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#E6F7FF" stop-opacity="1"/>
          <stop offset="80%" stop-color="#B8E6FF" stop-opacity="1"/>
          <stop offset="100%" stop-color="#87CEEB" stop-opacity=".9"/>
        </radialGradient>
        <filter id="rainDrop1" x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur"/>
          <feOffset dx="0" dy="6" in="blur" result="off"/>
          <feColorMatrix in="off" type="matrix" 
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 .25 0" result="shadow"/>
          <feBlend in="SourceGraphic" in2="shadow" mode="normal"/>
        </filter>
      </defs>
      <g filter="url(#rainDrop1)">
        <path fill="url(#rainSheen1)" stroke="#4CAEE0" stroke-width="10" stroke-linejoin="round"
          d="M147 206c-36 0-66-26-66-59 0-28 20-52 48-58 7-39 45-70 90-70 34 0 64 16 79 40 9-4 20-6 31-6 43 0 78 30 78 68 0 2 0 4-.2 6 34 6 60 32 60 63 0 36-32 65-72 65H147z"/>
      </g>
    </svg>

    <svg class="RainPoolView-cloud RainPoolView-cloud--2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" aria-label="Rain cloud">
      <path fill="#B8E6FF" stroke="#4CAEE0" stroke-width="8" stroke-linejoin="round"
        d="M58 112c-22 0-40-16-40-35 0-17 12-31 29-34 4-23 26-39 52-39 20 0 38 9 47 22 5-2 12-3 18-3 26 0 46 18 46 40 0 1 0 2-.1 3 20 4 34 19 34 36 0 21-19 38-42 38H58z"/>
    </svg>
  </section>
</template>

<script>
import RainPoolRoller from '@/components/RainPoolRoller.vue'
import ScrollAnimation from '@/mixins/ScrollAnimation.mixin'
import WalletStore from '@/store/WalletStore'
import { useTokenStats } from '@/composables/useTokenStats'

export default {
  name: 'RainPoolView',

  mixins: [ScrollAnimation],

  components: {
    RainPoolRoller
  },

  setup() {
    // Initialize token stats rotation
    const tokenStats = useTokenStats()

    return {
      tokenStats
    }
  },

  data() {
    return {
      showHistory: false,
      showTooltip: false
    }
  },

  computed: {
    walletState() {
      return WalletStore.getState()
    },

    isConnected() {
      return this.walletState.isConnected
    },

    walletAddress() {
      return this.walletState.walletAddress
    },

    truncatedAddress() {
      if (!this.walletAddress) return ''
      return `${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}`
    },

    balances() {
      return this.walletState.balances
    },

    formattedSolBalance() {
      return WalletStore.getFormattedBalance('sol')
    },

    formattedTokenBalance() {
      return WalletStore.getFormattedBalance('token')
    },

    isEligible() {
      return this.walletState.isEligible
    },

    isLoading() {
      return this.walletState.isConnecting
    },

    isLoadingBalances() {
      return this.walletState.isLoadingBalances
    },

    isLoadingUserData() {
      return this.walletState.isLoadingUserData
    },

    isInitialLoad() {
      return this.walletState.isInitialLoad
    },

    isLoadingAnyData() {
      return this.isLoadingBalances || this.isLoadingUserData || this.isInitialLoad
    },

    error() {
      return this.walletState.error
    },

    participationHistory() {
      return this.walletState.participationHistory
    },

    isPhantomAvailable() {
      try {
        return WalletStore.getWalletService().isPhantomAvailable()
      } catch (error) {
        console.error('Error checking Phantom availability:', error)
        return false
      }
    },

    userAvatarPath() {
      return WalletStore.getUserAvatarPath()
    }
  },
  
  async mounted() {
    this.animateRaindrops()
    
    // Check if wallet is connected
    if (this.isConnected) {
      WalletStore.refreshUserData()
    } else {
      // Try to restore wallet connection if it exists
      setTimeout(async () => {
        await WalletStore.checkWalletConnection()
      }, 1000) // Give wallet time to initialize
    }
  },

  beforeUnmount() {
    WalletStore.clearError()
  },
  
  methods: {
    animateRaindrops() {
      const TARGET_SEL = '.RainPoolView-raindrop'
      const TRIGGER_ELEMENT_SEL = "#rainpool"
      
      const animationOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: TRIGGER_ELEMENT_SEL,
            scrub: true,
            start: "top bottom",
            end: "bottom top",
          },
          y: '30vh',
          stagger: 0.2,
        },
      }

      this.timeline.to(TARGET_SEL, animationOptions)
    },

    async connectWallet() {
      const result = await WalletStore.connect()

      if (result.success) {
        this.$refs.rainPoolRoller.showSuccessToast('✅ Your wallet has successfully connected to RainDr0p.fun')
      } else {
        console.error('Failed to connect wallet:', result.error)
      }
    },

    async disconnectWallet() {
      const result = await WalletStore.disconnect()
      
      if (!result.success) {
        console.error('Failed to disconnect wallet:', result.error)
      }
    },

    async refreshBalances() {
      const result = await WalletStore.refreshBalances()
      
      if (!result.success) {
        console.error('Failed to refresh balances:', result.error)
      }
    },

    async joinPool() {
      if (!this.isEligible) {
        return
      }

      const result = await WalletStore.joinPool()
      
      if (result.success) {
        alert('Successfully joined the Rain Pool! 🌧️')
      } else {
        console.error('Failed to join pool:', result.error)
      }
    },

    async copyAddress() {
      if (this.walletAddress && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(this.walletAddress)
          this.showTooltip = true
          setTimeout(() => {
            this.showTooltip = false
          }, 2000)
        } catch (error) {
          console.error('Failed to copy address:', error)
        }
      }
    },

    clearError() {
      WalletStore.clearError()
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },

    handlePoolJoined(event) {
      console.log('User joined pool:', event)
      // Refresh user data to update participation history
      WalletStore.refreshUserData()
    },

    handleJoinError(error) {
      console.error('Failed to join pool:', error)
      WalletStore.state.error = 'Failed to join Rain Pool. Please try again.'
    },

    handleWinnersSelected(winners) {
      console.log('Winners selected:', winners)
      // Refresh user data to update participation history
      WalletStore.refreshUserData()

      // Winner celebration is now handled by the RainPoolRoller component's modal
      // No need for ugly browser alert anymore
    },

    handleToggleStatsToasts(enabled) {
      this.tokenStats.toggleStatsToasts(enabled)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables';
@import '@/styles/breakpoints';

.RainPoolView {
  background-image: url('@/assets/images/asfalt-light.png');
  background-color: #4CAEE0;
  background-repeat: repeat;
  position: relative;
  overflow: hidden;

  &-inner {
    display: flex;
    position: relative;
    z-index: 2;
  }

  &-content {
    text-align: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 60px 20px;

    @include sm-down {
      padding: 40px 15px;
      max-width: 100%;
    }
  }

  &-title {
    color: $white;
    margin: 0 0 24px 0;
    font-size: 48px;
    
    @include sm-down {
      font-size: 36px;
      margin: 0 0 20px 0;
    }
  }

  &-description {
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 40px 0;
    line-height: 1.6;
    
    @include sm-down {
      font-size: 16px;
      margin: 0 0 30px 0;
    }
  }



  &-roller {
    margin: 0 0 30px 0;
    position: relative;
    z-index: 10000;
    
    @include sm-down {
      margin: 0 0 20px 0;
    }
  }


  &-error {
    position: relative;
    background: rgba(220, 53, 69, 0.2);
    border: 1px solid rgba(220, 53, 69, 0.4);
    color: #f8d7da;
    padding: 15px 40px 15px 15px;
    border-radius: 8px;
    margin: 20px 0;
    font-size: 14px;

    p {
      margin: 0;
    }
  }

  &-errorClose {
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    color: #f8d7da;
    font-size: 18px;
    cursor: pointer;
    line-height: 1;
    
    &:hover {
      opacity: 0.7;
    }
  }

  &-raindrops {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }

  &-raindrop {
    position: absolute;
    width: 4px;
    height: 20px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(76, 174, 224, 0.6) 100%);
    border-radius: 50% 50% 0 0;
    animation: fall 3s linear infinite;

    &--1 {
      left: 15%;
      animation-delay: 0s;
      animation-duration: 2.5s;
    }

    &--2 {
      left: 35%;
      animation-delay: 0.5s;
      animation-duration: 3s;
    }

    &--3 {
      left: 55%;
      animation-delay: 1s;
      animation-duration: 2.8s;
    }

    &--4 {
      left: 75%;
      animation-delay: 1.5s;
      animation-duration: 3.2s;
    }

    &--5 {
      left: 85%;
      animation-delay: 2s;
      animation-duration: 2.7s;
    }
  }

  &-cloud {
    position: absolute;
    pointer-events: none;
    opacity: 0.4;
    z-index: 0;

    @include sm-down {
      opacity: 0.2;
    }

    &--1 {
      top: 10vh;
      left: -10vw;
      width: 25vw;
      height: auto;
      animation: float 12s ease-in-out infinite;
    }

    &--2 {
      top: 30vh;
      right: -8vw;
      width: 15vw;
      height: auto;
      animation: float 15s ease-in-out infinite reverse;
      animation-delay: -3s;
    }
  }

  @keyframes fall {
    0% {
      transform: translateY(-20px);
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    100% {
      transform: translateY(100vh);
      opacity: 0;
    }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    25% { transform: translateY(-15px) translateX(8px); }
    50% { transform: translateY(-8px) translateX(-8px); }
    75% { transform: translateY(-12px) translateX(5px); }
  }
}
</style>