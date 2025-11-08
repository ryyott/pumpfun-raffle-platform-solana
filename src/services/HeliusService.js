// Simplified Helius service for demo purposes - no Solana dependencies required

class HeliusService {
  constructor() {
    this.apiKey = process.env.VUE_APP_HELIUS_API_KEY
    this.baseUrl = 'https://api.helius.xyz/v0'
    this.rpcUrl = `https://rpc.helius.xyz/?api-key=${this.apiKey}`
    this.tokenMint = process.env.VUE_APP_RAINDR0P_TOKEN_MINT
    
    if (!this.apiKey) {
      throw new Error('Helius API key is missing. Please check your VUE_APP_HELIUS_API_KEY environment variable.')
    }
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}?api-key=${this.apiKey}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })

      if (!response.ok) {
        throw new Error(`Helius API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Helius API request failed:', error)
      throw error
    }
  }

  async makeRpcRequest(method, params = []) {
    const requestBody = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    }

    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('RPC response error:', errorText)
        throw new Error(`RPC request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        console.error('RPC error details:', data.error)
        throw new Error(`RPC error: ${data.error.message} (Code: ${data.error.code})`)
      }

      return data.result
    } catch (error) {
      console.error('RPC request failed:', error)
      throw error
    }
  }

  async getBalance(walletAddress) {
    if (!this.validateWalletAddress(walletAddress)) {
      throw new Error('Invalid wallet address')
    }

    if (!this.apiKey) {
      throw new Error('Helius API key not configured. Please set VUE_APP_HELIUS_API_KEY in your .env file')
    }

    try {
      // Get SOL balance via RPC call
      const balanceResponse = await this.makeRpcRequest('getBalance', [walletAddress])

      // Extract the actual balance from the response
      // The response format is: { context: {...}, value: 21165685 }
      const balance = balanceResponse?.value

      // Validate the response
      if (balance === null || balance === undefined) {
        throw new Error('Received null/undefined balance from RPC')
      }

      if (typeof balance !== 'number') {
        throw new Error(`Invalid balance type: ${typeof balance}, value: ${balance}`)
      }

      // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
      const solBalance = balance / 1000000000

      if (isNaN(solBalance)) {
        throw new Error(`Balance conversion resulted in NaN. Original balance: ${balance}`)
      }

      return solBalance
    } catch (error) {
      console.error('Error fetching SOL balance:', error)
      throw error
    }
  }

  async getTokenBalance(walletAddress) {
    try {
      if (!this.validateWalletAddress(walletAddress)) {
        throw new Error('Invalid wallet address')
      }
      
      if (!this.apiKey) {
        console.warn('Helius API key not configured, using mock token balance')
        return Math.floor(Math.random() * 9900 + 100)
      }
      
      if (!this.tokenMint) {
        console.warn('No token mint configured, returning 0 balance')
        return 0
      }
      
      // Get token accounts for this wallet
      const tokenAccounts = await this.makeRpcRequest('getTokenAccountsByOwner', [
        walletAddress,
        {
          mint: this.tokenMint
        },
        {
          encoding: 'jsonParsed'
        }
      ])
      
      if (!tokenAccounts?.value || tokenAccounts.value.length === 0) {
        return 0
      }
      
      // Sum up all token balances for this mint
      let totalBalance = 0
      for (const account of tokenAccounts.value) {
        try {
          const accountInfo = account.account.data.parsed.info
          const amount = parseInt(accountInfo.tokenAmount.amount)
          if (!isNaN(amount)) {
            totalBalance += amount
          }
        } catch (accountError) {
          console.warn('Error parsing token account:', accountError)
        }
      }
      
      // Get token decimals
      const tokenInfo = await this.getTokenInfo()
      const decimals = tokenInfo?.decimals || 9
      
      // Convert to human-readable format
      const humanBalance = totalBalance / Math.pow(10, decimals)
      
      // Ensure it's a valid number
      return isNaN(humanBalance) ? 0 : humanBalance
    } catch (error) {
      console.error('Error fetching token balance:', error)
      // Fallback to mock data if API fails
      return Math.floor(Math.random() * 9900 + 100)
    }
  }

  async getWalletBalances(walletAddress) {
    try {
      const [solBalance, tokenBalance] = await Promise.all([
        this.getBalance(walletAddress),
        this.getTokenBalance(walletAddress)
      ])

      return {
        sol: solBalance,
        token: tokenBalance,
        walletAddress
      }
    } catch (error) {
      console.error('Error fetching wallet balances:', error)
      throw new Error('Failed to fetch wallet balances')
    }
  }

  async getTokenInfo(tokenMint = this.tokenMint) {
    try {
      const response = await this.makeRpcRequest('getAccountInfo', [
        tokenMint,
        {
          encoding: 'jsonParsed'
        }
      ])

      if (!response.value) {
        throw new Error('Token mint not found')
      }

      const mintInfo = response.value.data.parsed.info
      
      return {
        mint: tokenMint,
        decimals: mintInfo.decimals,
        supply: mintInfo.supply,
        isInitialized: mintInfo.isInitialized
      }
    } catch (error) {
      console.error('Error fetching token info:', error)
      throw new Error('Failed to fetch token info')
    }
  }

  async getTokenHolders(tokenMint = this.tokenMint) {
    try {
      const response = await this.makeRequest(`/tokens/${tokenMint}/holders`, {
        method: 'GET'
      })

      return response.holders || []
    } catch (error) {
      console.error('Error fetching token holders:', error)
      throw new Error('Failed to fetch token holders')
    }
  }

  async isTokenHolder(walletAddress, minimumBalance = 0) {
    try {
      const tokenBalance = await this.getTokenBalance(walletAddress)
      return tokenBalance >= minimumBalance
    } catch (error) {
      console.error('Error checking token holder status:', error)
      return false
    }
  }

  async getTransactionHistory(walletAddress, limit = 10) {
    try {
      const response = await this.makeRequest(`/addresses/${walletAddress}/transactions`, {
        method: 'GET'
      })

      return response.slice(0, limit)
    } catch (error) {
      console.error('Error fetching transaction history:', error)
      throw new Error('Failed to fetch transaction history')
    }
  }

  async validateWalletAddress(address) {
    try {
      // Simple validation for Solana address format (base58, 32-44 characters)
      if (!address || typeof address !== 'string') return false
      if (address.length < 32 || address.length > 44) return false
      
      // Check if it's base58 format (simplified check)
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
      return base58Regex.test(address)
    } catch (error) {
      return false
    }
  }

  getTokenMint() {
    return this.tokenMint
  }

  async getTokenMetadata() {
    try {
      const response = await this.makeRequest(`/tokens/${this.tokenMint}/metadata`)
      return response
    } catch (error) {
      console.error('Error fetching token metadata:', error)
      throw new Error('Failed to fetch token metadata')
    }
  }

  async refreshBalance(walletAddress) {
    return this.getWalletBalances(walletAddress)
  }


  calculateWinnerCount(marketCap) {
    // Your specified tier system:
    // At $5k market cap, 1 winner
    // At $100k, 2 winners
    // At $500k, 5 winners
    // At $1M, 10 winners
    // For every million beyond, another 10 winners
    
    if (marketCap < 5000) {
      return 1 // Still 1 winner below $5k
    } else if (marketCap < 100000) {
      return 1
    } else if (marketCap < 500000) {
      return 2
    } else if (marketCap < 1000000) {
      return 5
    } else {
      // $1M+ = 10 winners + 10 for each additional million
      const millionsAbove1M = Math.floor((marketCap - 1000000) / 1000000)
      return 10 + (millionsAbove1M * 10)
    }
  }
}

export default new HeliusService()