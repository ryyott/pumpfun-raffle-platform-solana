// Simplified wallet service for demo purposes - no Solana dependencies required

class WalletService {
  constructor() {
    this.wallet = null
    this.connection = null
    this.isConnected = false
    this.publicKey = null
    this.listeners = []
    
    this.initializeConnection()
    this.checkWalletAvailability()
  }

  initializeConnection() {
    // For demo purposes, we don't need actual connection
    this.connection = null
  }

  checkWalletAvailability() {
    if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
      this.wallet = window.solana
      this.setupEventListeners()
      this.checkIfAlreadyConnected()
    }
  }

  setupEventListeners() {
    if (this.wallet) {
      this.wallet.on('connect', this.handleConnect.bind(this))
      this.wallet.on('disconnect', this.handleDisconnect.bind(this))
      this.wallet.on('accountChanged', this.handleAccountChanged.bind(this))
    }
  }

  async checkIfAlreadyConnected() {
    try {
      if (this.wallet && this.wallet.isConnected) {
        this.publicKey = this.wallet.publicKey
        this.isConnected = true
        this.notifyListeners('connect', { publicKey: this.publicKey })
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }

  async connect() {
    try {
      if (!this.wallet) {
        throw new Error('Phantom wallet not found. Please install Phantom wallet.')
      }

      const response = await this.wallet.connect()
      this.publicKey = response.publicKey
      this.isConnected = true
      
      this.notifyListeners('connect', { publicKey: this.publicKey })
      
      return {
        success: true,
        publicKey: this.publicKey.toString(),
        message: 'Wallet connected successfully'
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to connect wallet'
      }
    }
  }

  async disconnect() {
    try {
      if (this.wallet && this.isConnected) {
        await this.wallet.disconnect()
      }
      
      this.handleDisconnect()
      
      return {
        success: true,
        message: 'Wallet disconnected successfully'
      }
    } catch (error) {
      console.error('Wallet disconnection failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to disconnect wallet'
      }
    }
  }

  handleConnect(publicKey) {
    this.publicKey = publicKey || this.wallet.publicKey
    this.isConnected = true
    this.notifyListeners('connect', { publicKey: this.publicKey })
  }

  handleDisconnect() {
    this.publicKey = null
    this.isConnected = false
    this.notifyListeners('disconnect')
  }

  handleAccountChanged(publicKey) {
    if (publicKey) {
      this.publicKey = publicKey
      this.notifyListeners('accountChanged', { publicKey: this.publicKey })
    } else {
      this.handleDisconnect()
    }
  }

  getPublicKey() {
    return this.publicKey ? this.publicKey.toString() : null
  }

  getConnection() {
    return this.connection
  }

  isWalletConnected() {
    return this.isConnected && this.publicKey !== null
  }

  isPhantomAvailable() {
    return typeof window !== 'undefined' && window.solana && window.solana.isPhantom
  }

  addEventListener(event, callback) {
    this.listeners.push({ event, callback })
  }

  removeEventListener(event, callback) {
    this.listeners = this.listeners.filter(
      listener => !(listener.event === event && listener.callback === callback)
    )
  }

  notifyListeners(event, data = {}) {
    this.listeners
      .filter(listener => listener.event === event)
      .forEach(listener => listener.callback(data))
  }

  async getBalance() {
    if (!this.isConnected || !this.publicKey) {
      throw new Error('Wallet not connected')
    }

    try {
      console.log('WalletService: Getting balance for wallet:', this.publicKey.toString())
      
      // Import HeliusService dynamically to avoid circular dependency
      const { default: HeliusService } = await import('./HeliusService.js')
      const balance = await HeliusService.getBalance(this.publicKey.toString())
      
      console.log('WalletService: Retrieved balance:', balance)
      return balance
    } catch (error) {
      console.error('WalletService: Error fetching balance:', error)
      throw error // Re-throw the original error instead of wrapping it
    }
  }

  destroy() {
    if (this.wallet) {
      this.wallet.removeAllListeners()
    }
    this.listeners = []
    this.publicKey = null
    this.isConnected = false
  }
}

export default new WalletService()