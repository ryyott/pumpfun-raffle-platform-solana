import { reactive } from 'vue'

class WalletStore {
  constructor() {
    this.state = reactive({
      isConnected: false,
      isConnecting: false,
      walletAddress: null,
      balances: {
        sol: 0,
        token: 0
      },
      user: null,
      error: null,
      isLoadingBalances: false,
      isLoadingUserData: false,
      isInitialLoad: true,
      lastBalanceUpdate: null,
      isEligible: false,
      participationHistory: [],
      poolStats: {
        totalParticipations: 0,
        uniqueParticipants: 0,
        totalRewards: 0,
        winnerCount: 0
      }
    })

    // Lazy load services to prevent immediate initialization errors
    this._walletService = null
    this._heliusService = null
    this._supabaseService = null

    // Load wallet from storage on initialization
    this.loadFromStorage()
  }

  getWalletService() {
    if (!this._walletService) {
      const WalletService = require('@/services/WalletService').default
      this._walletService = WalletService
      this.initializeWalletListeners()
    }
    return this._walletService
  }

  getHeliusService() {
    if (!this._heliusService) {
      const HeliusService = require('@/services/HeliusService').default
      this._heliusService = HeliusService
    }
    return this._heliusService
  }

  getSupabaseService() {
    if (!this._supabaseService) {
      const SupabaseService = require('@/services/SupabaseService').default
      this._supabaseService = SupabaseService
    }
    return this._supabaseService
  }

  initializeWalletListeners() {
    const walletService = this.getWalletService()
    walletService.addEventListener('connect', this.handleWalletConnect.bind(this))
    walletService.addEventListener('disconnect', this.handleWalletDisconnect.bind(this))
    walletService.addEventListener('accountChanged', this.handleAccountChanged.bind(this))
  }

  async handleWalletConnect({ publicKey }) {
    this.state.walletAddress = publicKey.toString()
    this.state.isConnected = true
    this.state.error = null
    this.state.isInitialLoad = true
    
    this.saveToStorage()
    
    await this.refreshUserData()
  }

  async handleWalletDisconnect() {
    this.state.isConnected = false
    this.state.walletAddress = null
    this.state.balances = { sol: 0, token: 0 }
    this.state.user = null
    this.state.isEligible = false
    this.state.participationHistory = []
    this.state.error = null
    
    this.clearStorage()
    await this.getSupabaseService().signOut()
  }

  async handleAccountChanged({ publicKey }) {
    if (publicKey) {
      this.state.walletAddress = publicKey.toString()
      this.saveToStorage()
      await this.refreshUserData()
    } else {
      await this.handleWalletDisconnect()
    }
  }

  async connect() {
    if (this.state.isConnecting) {
      return { success: false, error: 'Connection already in progress' }
    }

    this.state.isConnecting = true
    this.state.error = null

    try {
      // First check if already connected to avoid unnecessary popup
      if (window.solana && window.solana.isConnected) {
        const address = window.solana.publicKey?.toString()
        if (address) {
          this.state.walletAddress = address
          this.state.isConnected = true
          this.saveToStorage()
          await this.refreshUserData()
          return { success: true, publicKey: address, message: 'Wallet already connected' }
        }
      }

      const result = await this.getWalletService().connect()

      if (!result.success) {
        this.state.error = result.error
        return result
      }

      return result
    } catch (error) {
      this.state.error = error.message || 'Failed to connect wallet'
      return { success: false, error: this.state.error }
    } finally {
      this.state.isConnecting = false
    }
  }

  async disconnect() {
    try {
      const result = await this.getWalletService().disconnect()
      return result
    } catch (error) {
      this.state.error = error.message || 'Failed to disconnect wallet'
      return { success: false, error: this.state.error }
    }
  }

  async refreshBalances() {
    if (!this.state.walletAddress || this.state.isLoadingBalances) return

    this.state.isLoadingBalances = true
    this.state.error = null

    try {
      const balances = await this.getHeliusService().getWalletBalances(this.state.walletAddress)

      this.state.balances = {
        sol: balances.sol,
        token: balances.token
      }

      // Calculate eligibility based on $10 USD minimum
      // Import rainPool store to get current token price
      const { useRainPoolStore } = await import('@/stores/rainPool')
      const rainPoolStore = useRainPoolStore()
      const tokenPriceUsd = rainPoolStore.tokenPriceUsd || 0
      const tokenValueUsd = balances.token * tokenPriceUsd
      this.state.isEligible = tokenValueUsd >= 10

      this.state.lastBalanceUpdate = new Date().toISOString()

      if (this.state.user) {
        await this.getSupabaseService().updateUserBalances(this.state.walletAddress, balances)
      }

      return { success: true, balances: this.state.balances }
    } catch (error) {
      this.state.error = error.message || 'Failed to refresh balances'
      return { success: false, error: this.state.error }
    } finally {
      this.state.isLoadingBalances = false
    }
  }

  async refreshUserData() {
    if (!this.state.walletAddress) return

    this.state.isLoadingUserData = true

    try {
      await this.refreshBalances()

      const userResult = await this.getSupabaseService().createOrUpdateUser(
        this.state.walletAddress,
        this.state.balances
      )

      if (userResult.success) {
        this.state.user = userResult.user
        // isEligible is already set by refreshBalances() with correct USD calculation
        // Don't override it with the potentially stale database value
      }

      await this.loadParticipationHistory()
      await this.loadPoolStats()

      this.state.isInitialLoad = false

      return { success: true }
    } catch (error) {
      this.state.error = error.message || 'Failed to refresh user data'
      return { success: false, error: this.state.error }
    } finally {
      this.state.isLoadingUserData = false
    }
  }

  async loadParticipationHistory() {
    if (!this.state.walletAddress) return

    try {
      const result = await this.getSupabaseService().getUserParticipations(this.state.walletAddress)
      
      if (result.success) {
        this.state.participationHistory = result.participations
      }

      return result
    } catch (error) {
      console.error('Failed to load participation history:', error)
      return { success: false, error: error.message }
    }
  }

  async loadPoolStats() {
    try {
      const result = await this.getSupabaseService().getPoolStats()
      
      if (result.success) {
        this.state.poolStats = result.stats
      }

      return result
    } catch (error) {
      console.error('Failed to load pool stats:', error)
      return { success: false, error: error.message }
    }
  }

  async joinPool(poolRound = 1) {
    if (!this.state.isEligible || !this.state.walletAddress) {
      const error = 'Not eligible to join pool. You need to hold DROP tokens.'
      this.state.error = error
      return { success: false, error }
    }

    try {
      const result = await this.getSupabaseService().addPoolParticipation(
        this.state.walletAddress,
        poolRound,
        this.state.balances.token
      )

      if (result.success) {
        await this.loadParticipationHistory()
        await this.loadPoolStats()
      }

      return result
    } catch (error) {
      this.state.error = error.message || 'Failed to join pool'
      return { success: false, error: this.state.error }
    }
  }

  saveToStorage() {
    if (typeof localStorage !== 'undefined' && this.state.walletAddress) {
      const walletData = {
        walletAddress: this.state.walletAddress,
        timestamp: Date.now()
      }
      localStorage.setItem('raindr0p_wallet', JSON.stringify(walletData))
    }
  }

  loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('raindr0p_wallet')
        
        if (stored) {
          const walletData = JSON.parse(stored)
          const weekInMs = 7 * 24 * 60 * 60 * 1000 // Cache for 1 week
          
          if (Date.now() - walletData.timestamp < weekInMs) {
            // Set the wallet address and try to reconnect
            this.state.walletAddress = walletData.walletAddress
            
            // Attempt to reconnect to the wallet
            setTimeout(() => {
              this.attemptReconnection()
            }, 500) // Small delay to ensure Phantom is ready
          } else {
            this.clearStorage()
          }
        }
      } catch (error) {
        console.error('Error loading wallet from storage:', error)
        this.clearStorage()
      }
    }
  }

  async attemptReconnection() {
    try {
      const walletService = this.getWalletService()
      
      // Check if wallet is available
      if (!walletService.isPhantomAvailable()) {
        this.clearStorage()
        return
      }

      // First check if wallet is already connected without triggering any popups
      if (window.solana && window.solana.isConnected) {
        const currentAddress = window.solana.publicKey?.toString()
        
        if (currentAddress && currentAddress === this.state.walletAddress) {
          // Wallet is connected and matches stored address
          this.state.isConnected = true
          walletService.publicKey = window.solana.publicKey
          walletService.isConnected = true
          
          // Initialize listeners and refresh data
          walletService.setupEventListeners()
          this.refreshUserData()
          return
        }
      }
      
      // Try silent connection with onlyIfTrusted
      try {
        const response = await window.solana.connect({ onlyIfTrusted: true })
        
        if (response && response.publicKey) {
          const currentAddress = response.publicKey.toString()
          
          if (currentAddress === this.state.walletAddress) {
            this.state.isConnected = true
            walletService.publicKey = response.publicKey
            walletService.isConnected = true
            walletService.setupEventListeners()
            this.refreshUserData()
            return
          } else {
            this.clearStorage()
          }
        }
      } catch (error) {
        // Silent connection failed, user needs to connect manually
      }
      
      // Fallback: try the old method
      try {
        await walletService.checkIfAlreadyConnected()
        
        if (walletService.isWalletConnected()) {
          const currentAddress = walletService.getPublicKey()
          
          if (currentAddress === this.state.walletAddress) {
            this.state.isConnected = true
            this.refreshUserData()
          } else {
            this.clearStorage()
          }
        }
      } catch (error) {
        // Silent connection failed, user needs to connect manually
      }
    } catch (error) {
      console.error('Error during wallet reconnection:', error)
      // Don't clear storage on error, let user try to connect manually
    }
  }

  clearStorage() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('raindr0p_wallet')
    }
  }

  clearError() {
    this.state.error = null
  }

  getState() {
    return this.state
  }

  isConnected() {
    return this.state.isConnected
  }

  getWalletAddress() {
    return this.state.walletAddress
  }

  getBalances() {
    return this.state.balances
  }

  getUser() {
    return this.state.user
  }

  getUserAvatar() {
    return this.state.user?.avatar || null
  }

  getUserAvatarPath() {
    const avatar = this.getUserAvatar()
    if (!avatar) return null
    
    const AvatarService = require('@/services/AvatarService').default
    return AvatarService.getFullAvatarPath(avatar)
  }

  isEligible() {
    return this.state.isEligible
  }

  getError() {
    return this.state.error
  }

  isLoading() {
    return this.state.isConnecting || this.state.isLoadingBalances
  }

  getParticipationHistory() {
    return this.state.participationHistory
  }

  getPoolStats() {
    return this.state.poolStats
  }

  getFormattedBalance(type = 'token') {
    const balance = this.state.balances[type] || 0
    if (type === 'sol') {
      return balance.toFixed(4)
    }
    return balance.toLocaleString()
  }

  getLastBalanceUpdate() {
    return this.state.lastBalanceUpdate
  }

  // Manual method to check and restore wallet connection
  async checkWalletConnection() {
    try {
      if (window.solana && window.solana.isConnected && window.solana.publicKey) {
        const address = window.solana.publicKey.toString()
        
        if (!this.state.isConnected) {
          // Restore connection state
          this.state.walletAddress = address
          this.state.isConnected = true
          this.saveToStorage()
          await this.refreshUserData()
          console.log('Wallet connection restored manually')
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error checking wallet connection:', error)
      return false
    }
  }
}

export default new WalletStore()