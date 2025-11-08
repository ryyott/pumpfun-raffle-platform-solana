<template>
  <Teleport to="body">
    <div class="TicketCalculator" v-if="isOpen">
      <div class="TicketCalculator-overlay" @click="close"></div>
      <div class="TicketCalculator-modal">
      <!-- Avatar in top-left -->
      <div class="TicketCalculator-avatarSection">
        <img
          v-if="userAvatar"
          :src="userAvatar"
          alt="User Avatar"
          class="TicketCalculator-avatar"
        />
        <div
          v-else
          class="TicketCalculator-avatarPlaceholder"
        >
          {{ walletAddress.slice(0, 2).toUpperCase() }}
        </div>
      </div>

      <button class="TicketCalculator-close" @click="close" aria-label="Close">×</button>

      <!-- Title and Timer -->
      <div class="TicketCalculator-header">
        <h2 class="TicketCalculator-title">Join Rain Pool</h2>
        <div v-if="timeRemaining" class="TicketCalculator-timer">
          ⏱️ {{ timeRemaining }} remaining
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="TicketCalculator-loading">
        <div class="TicketCalculator-spinner"></div>
        <p>Calculating your tickets...</p>
      </div>

      <!-- Transaction Confirmation State -->
      <div v-else-if="isConfirmingTransaction" class="TicketCalculator-loading">
        <div class="TicketCalculator-spinner"></div>
        <p>Confirming your transaction...</p>
        <p class="TicketCalculator-loadingSubtext">Please wait while we verify your burn on the blockchain</p>
      </div>

      <!-- Success State -->
      <div v-else-if="showSuccess" class="TicketCalculator-success">
        <div class="TicketCalculator-successIcon">
          <svg class="TicketCalculator-checkmark" viewBox="0 0 52 52">
            <circle class="TicketCalculator-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path class="TicketCalculator-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>
        <h3 class="TicketCalculator-successTitle">Success!</h3>
        <p class="TicketCalculator-successText">You've been added to the Rain Pool</p>
      </div>

      <!-- Holdings Display -->
      <div v-else-if="ticketData" class="TicketCalculator-holdings">
        <div class="TicketCalculator-holdingsCard">
          <div class="TicketCalculator-holdingsValue">
            ${{ ticketData.holdingsUsd.toFixed(2) }} USD
          </div>
          <div class="TicketCalculator-holdingsTier">
            Tier {{ ticketData.tier }} • {{ ticketData.freeTickets }} Ticket{{ ticketData.freeTickets !== 1 ? 's' : '' }} 🎫
          </div>
        </div>

        <!-- Current Tickets Info -->
        <div class="TicketCalculator-currentTickets">
          <p>{{ isUpgrade ? 'Current tickets: ' : 'You\'ll receive ' }}{{ ticketData.freeTickets }} ticket{{ ticketData.freeTickets !== 1 ? 's' : '' }}{{ !isUpgrade ? ' based on your holdings!' : '' }}</p>
        </div>

        <!-- Boost Section -->
        <div class="TicketCalculator-boostSection">
          <h3 class="TicketCalculator-boostTitle">🔥 Boost Your Odds</h3>
          <p class="TicketCalculator-boostDescription">Burn RAINDR0P tokens to get bonus tickets!</p>

          <div class="TicketCalculator-options">
            <!-- No Boost Option (only for initial join) -->
            <label
              v-if="!isUpgrade"
              class="TicketCalculator-option"
              :class="{ 'is-selected': selectedBurnAmount === 0 }"
            >
              <input
                type="radio"
                name="burn-option"
                :value="0"
                v-model.number="selectedBurnAmount"
                class="TicketCalculator-radio"
                @change="handleOptionChange(0)"
              />
              <div class="TicketCalculator-optionContent">
                <div class="TicketCalculator-optionHeader">
                  <span class="TicketCalculator-optionTitle">No Boost</span>
                  <span class="TicketCalculator-optionPrice">Free</span>
                </div>
                <div class="TicketCalculator-optionTickets">
                  {{ ticketData.freeTickets }} ticket{{ ticketData.freeTickets !== 1 ? 's' : '' }}
                </div>
              </div>
            </label>

            <!-- $5 Burn Option -->
            <label
              class="TicketCalculator-option"
              :class="{
                'is-selected': selectedBurnAmount === 5,
                'is-disabled': !canAffordBurn(5)
              }"
              :title="!canAffordBurn(5) ? 'Cannot burn this amount - would drop below $10 minimum holding requirement' : ''"
            >
              <input
                type="radio"
                name="burn-option"
                :value="5"
                v-model.number="selectedBurnAmount"
                :disabled="!canAffordBurn(5)"
                class="TicketCalculator-radio"
                @change="handleOptionChange(5)"
              />
              <div class="TicketCalculator-optionContent">
                <div class="TicketCalculator-optionHeader">
                  <span class="TicketCalculator-optionTitle">Small Boost</span>
                  <span class="TicketCalculator-optionPrice">$5</span>
                </div>
                <div class="TicketCalculator-optionTickets">
                  +{{ calculateBoostTickets(5) }} bonus tickets
                </div>
                <div v-if="!canAffordBurn(5)" class="TicketCalculator-optionWarning">
                  ⚠️ Would drop below $10 minimum (you'd have ${{ (ticketData.holdingsUsd - 5).toFixed(2) }} left)
                </div>
              </div>
            </label>

            <!-- $10 Burn Option -->
            <label
              class="TicketCalculator-option"
              :class="{
                'is-selected': selectedBurnAmount === 10,
                'is-disabled': !canAffordBurn(10)
              }"
              :title="!canAffordBurn(10) ? 'Cannot burn this amount - would drop below $10 minimum holding requirement' : ''"
            >
              <input
                type="radio"
                name="burn-option"
                :value="10"
                v-model.number="selectedBurnAmount"
                :disabled="!canAffordBurn(10)"
                class="TicketCalculator-radio"
                @change="handleOptionChange(10)"
              />
              <div class="TicketCalculator-optionContent">
                <div class="TicketCalculator-optionHeader">
                  <span class="TicketCalculator-optionTitle">Big Boost ⭐</span>
                  <span class="TicketCalculator-optionPrice">$10</span>
                </div>
                <div class="TicketCalculator-optionTickets">
                  +{{ calculateBoostTickets(10) }} bonus tickets
                </div>
                <div v-if="!canAffordBurn(10)" class="TicketCalculator-optionWarning">
                  ⚠️ Would drop below $10 minimum (you'd have ${{ (ticketData.holdingsUsd - 10).toFixed(2) }} left)
                </div>
              </div>
            </label>

            <!-- Custom Amount Option -->
            <label
              class="TicketCalculator-option"
              :class="{
                'is-selected': showCustomInput && customBurnAmount > 0,
                'is-disabled': showCustomInput && customBurnAmount > 0 && !canAffordBurn(customBurnAmount)
              }"
            >
              <input
                type="radio"
                name="burn-option"
                :value="-1"
                v-model.number="selectedBurnAmount"
                @click="showCustomInput = true"
                class="TicketCalculator-radio"
              />
              <div class="TicketCalculator-optionContent">
                <div class="TicketCalculator-optionHeader">
                  <span class="TicketCalculator-optionTitle">Custom Amount</span>
                </div>
                <div v-if="showCustomInput" class="TicketCalculator-customInput">
                  <div class="TicketCalculator-inputWrapper">
                    <span class="TicketCalculator-dollarSign">$</span>
                    <input
                      type="number"
                      v-model.number="customBurnAmount"
                      @input="handleCustomInput"
                      placeholder="Enter amount"
                      min="1"
                      step="1"
                      class="TicketCalculator-input"
                    />
                  </div>
                  <div v-if="customBurnAmount > 0" class="TicketCalculator-customPreview">
                    <div v-if="canAffordBurn(customBurnAmount)" class="TicketCalculator-customPreviewSuccess">
                      +{{ calculateBoostTickets(customBurnAmount) }} bonus tickets
                    </div>
                    <div v-else class="TicketCalculator-optionWarning">
                      ⚠️ Would drop below $10 minimum (you'd have ${{ (ticketData.holdingsUsd - customBurnAmount).toFixed(2) }} left)
                    </div>
                  </div>
                </div>
              </div>
            </label>
          </div>

          <div v-if="selectedBurnAmount > 0" class="TicketCalculator-info">
            ℹ️ Burned tokens are permanently removed from circulation.
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="TicketCalculator-actions">
          <button
            @click="close"
            class="TicketCalculator-button TicketCalculator-button--secondary"
            type="button"
          >
            Cancel
          </button>
          <button
            @click="handleJoin"
            :disabled="isJoinDisabled || (isUpgrade && (selectedBurnAmount === 0 || selectedBurnAmount === -1)) || (selectedBurnAmount === -1 && (!customBurnAmount || !canAffordBurn(customBurnAmount)))"
            class="TicketCalculator-button TicketCalculator-button--primary"
            :class="{ 'TicketCalculator-button--disabled': remainingSeconds <= 30 || (isUpgrade && (selectedBurnAmount === 0 || selectedBurnAmount === -1)) }"
            type="button"
          >
            <span v-if="isJoining">{{ isUpgrade ? 'Boosting...' : (getTotalBurnAmount() > 0 ? 'Burning & Joining...' : 'Joining...') }}</span>
            <span v-else-if="isUpgrade && getTotalBurnAmount() > 0">Burn & Boost (+{{ calculateBoostTickets(getTotalBurnAmount()) }} tickets)</span>
            <span v-else-if="isUpgrade">Select Boost Amount</span>
            <span v-else-if="getTotalBurnAmount() > 0">Burn & Join (+{{ calculateBoostTickets(getTotalBurnAmount()) }} bonus tickets)</span>
            <span v-else>Join Pool ({{ ticketData.freeTickets}} ticket{{ ticketData.freeTickets !== 1 ? 's' : ''}})</span>
          </button>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="TicketCalculator-error">
        <p>{{ error }}</p>
        <button @click="close" class="TicketCalculator-button TicketCalculator-button--secondary">
          Close
        </button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script>
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token'

export default {
  name: 'TicketCalculator',

  emits: ['close', 'join', 'show-toast'],

  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    walletAddress: {
      type: String,
      required: true
    },
    mintAddress: {
      type: String,
      required: true
    },
    userAvatar: {
      type: String,
      default: null
    },
    timeRemaining: {
      type: String,
      default: null
    },
    remainingSeconds: {
      type: Number,
      default: 0
    },
    isUpgrade: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      isLoading: true,
      isJoining: false,
      isConfirmingTransaction: false,
      showSuccess: false,
      error: null,
      ticketData: null,
      selectedBurnAmount: 0,
      customBurnAmount: 0,
      showCustomInput: false
    }
  },

  computed: {
    formattedCustomAmount() {
      if (!this.customBurnAmount) return ''
      return this.customBurnAmount.toLocaleString('en-US')
    },

    isJoinDisabled() {
      // Disable if already joining or if less than 30 seconds remaining
      return this.isJoining || this.remainingSeconds <= 30
    }
  },

  mounted() {
    console.log('🎫 TicketCalculator MOUNTED', {
      isOpen: this.isOpen,
      walletAddress: this.walletAddress,
      mintAddress: this.mintAddress
    })

    // If already open on mount, load ticket data immediately
    if (this.isOpen) {
      this.selectedBurnAmount = this.isUpgrade ? 5 : 0
      this.loadTicketData()
    }
  },

  watch: {
    isOpen(newVal) {
      console.log('🎫 TicketCalculator isOpen changed:', newVal)
      if (newVal) {
        // If upgrading, default to $5 burn; otherwise allow free entry
        this.selectedBurnAmount = this.isUpgrade ? 5 : 0
        this.loadTicketData()
      }
    }
  },

  methods: {
    async loadTicketData() {
      console.log('🎫 loadTicketData called')
      this.isLoading = true
      this.error = null

      try {
        console.log('🎫 Fetching ticket data for:', this.walletAddress)
        console.log('🎫 Mint address:', this.mintAddress)

        const url = `${process.env.VUE_APP_SUPABASE_URL}/functions/v1/calculate-tickets`
        console.log('📍 URL:', url)

        console.log('📤 Sending request...')
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.VUE_APP_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            walletAddress: this.walletAddress,
            mintAddress: this.mintAddress,
            burnAmountUsd: 0
          })
        })

        console.log('📥 Response received - status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Calculate tickets error response:', errorText)

          // Try to parse JSON error
          try {
            const errorJson = JSON.parse(errorText)
            throw new Error(errorJson.error || `Failed to calculate tickets (${response.status})`)
          } catch {
            throw new Error(`Failed to calculate tickets: ${response.status} - ${errorText}`)
          }
        }

        const responseText = await response.text()
        console.log('Raw response:', responseText)

        this.ticketData = JSON.parse(responseText)
        console.log('✅ Ticket data received:', this.ticketData)

        if (!this.ticketData.eligible) {
          this.error = 'You need at least $10 worth of RAINDR0P to join the pool.'
        }
      } catch (err) {
        console.error('❌ Failed to load ticket data:', err)
        this.error = err.message || 'Failed to calculate tickets. Please try again.'
      } finally {
        this.isLoading = false
      }
    },

    calculateBoostTickets(burnUsd) {
      if (burnUsd <= 0) return 0
      const baseTickets = burnUsd / 2
      const multiplier = 1 + Math.log10(burnUsd)
      return Math.max(1, Math.floor(baseTickets * multiplier))
    },

    calculateTotalTickets(burnUsd) {
      if (!this.ticketData) return 0
      return this.ticketData.freeTickets + this.calculateBoostTickets(burnUsd)
    },

    canAffordBurn(burnUsd) {
      if (!this.ticketData) return false
      const remainingHoldings = this.ticketData.holdingsUsd - burnUsd
      return remainingHoldings >= 10 // Must maintain at least $10 after burn
    },

    getTotalTickets() {
      const burnAmount = this.showCustomInput && this.customBurnAmount > 0
        ? this.customBurnAmount
        : this.selectedBurnAmount
      return this.calculateTotalTickets(burnAmount)
    },

    getTotalBurnAmount() {
      if (this.selectedBurnAmount === -1) {
        return this.customBurnAmount || 0
      }
      return this.selectedBurnAmount || 0
    },

    handleOptionChange(value) {
      // When a preset option is selected, reset custom input
      if (value !== -1) {
        this.showCustomInput = false
        this.customBurnAmount = 0
      }
    },

    handleCustomInput(event) {
      // Remove all non-digit characters
      const value = event.target.value.replace(/[^0-9]/g, '')

      // Parse the number
      let numValue = parseInt(value) || 0

      // Enforce max limit of 999,999
      if (numValue > 999999) {
        numValue = 999999
      }

      // Check if this amount would drop user below $10
      const maxAffordable = this.ticketData ? Math.floor(this.ticketData.holdingsUsd - 10) : 0
      if (numValue > maxAffordable) {
        numValue = maxAffordable
      }

      // Update the custom burn amount
      this.customBurnAmount = numValue

      // Update selected burn amount if valid
      if (numValue >= 2) {
        this.selectedBurnAmount = numValue
      }
    },

    async handleJoin() {
      // Check if time remaining is less than 30 seconds
      if (this.remainingSeconds <= 30) {
        this.$emit('show-toast', '⏱️ Unfortunately you cannot join - Pool closes in less than 30 seconds')
        return
      }

      this.isJoining = true
      this.error = null

      try {
        const burnAmount = this.showCustomInput && this.customBurnAmount > 0
          ? this.customBurnAmount
          : this.selectedBurnAmount

        const totalTickets = this.getTotalTickets()
        const freeTickets = this.ticketData.freeTickets
        const burnBoostTickets = this.calculateBoostTickets(burnAmount)

        console.log('🎫 Ticket Breakdown:', {
          freeTickets,
          burnAmount,
          burnBoostTickets,
          totalTickets,
          winChanceIncrease: burnBoostTickets > 0 ? `+${((burnBoostTickets / totalTickets) * 100).toFixed(1)}%` : 'None'
        })

        let burnSignature = null

        // Execute burn transaction if burn amount > 0
        if (burnAmount > 0) {
          // Final safety check: ensure user will still have $10 after burn
          const remainingAfterBurn = this.ticketData.holdingsUsd - burnAmount
          if (remainingAfterBurn < 10) {
            throw new Error(`Cannot burn $${burnAmount}. You would have $${remainingAfterBurn.toFixed(2)} remaining, but need at least $10 to join the pool.`)
          }

          console.log('🔥 Executing burn transaction for $' + burnAmount + ' USD...')
          burnSignature = await this.executeBurnTransaction(burnAmount)
          console.log('✅ Burn transaction successful:', burnSignature)

          // Wait 5 seconds for transaction to be confirmed on-chain before joining
          console.log('⏳ Waiting for transaction confirmation...')
          this.isConfirmingTransaction = true
          await new Promise(resolve => setTimeout(resolve, 5000))
          this.isConfirmingTransaction = false
        }

        // Emit join event with burn info
        this.$emit('join', {
          burnAmountUsd: burnAmount,
          burnTransactionSignature: burnSignature,
          totalTickets: totalTickets
        })

        // Show success animation
        this.showSuccess = true

        // Close modal after showing success for 2 seconds
        setTimeout(() => {
          this.close()
        }, 2000)
      } catch (err) {
        console.error('❌ Failed to join pool:', err)
        this.error = err.message || 'Failed to join pool. Please try again.'
      } finally {
        this.isJoining = false
      }
    },

    async executeBurnTransaction(burnUsd) {
      try {
        // Calculate token amount to burn
        const tokenPrice = this.ticketData.tokenPriceUsd
        const tokensNeeded = burnUsd / tokenPrice

        // Get the actual token decimals (RAINDR0P uses 6 decimals, not 9!)
        const tokenAmount = Math.floor(tokensNeeded * 1e6) // RAINDR0P has 6 decimals

        console.log('💰 Burn Calculation:', {
          burnUsd,
          tokenPrice,
          tokensNeeded,
          tokenAmountRaw: tokenAmount,
          userBalance: this.ticketData.tokenBalance,
          hasEnoughTokens: this.ticketData.tokenBalance >= tokensNeeded
        })

        // Check if user has enough tokens
        if (this.ticketData.tokenBalance < (burnUsd / tokenPrice)) {
          throw new Error(`Insufficient RAINDR0P balance. You need ${(burnUsd / tokenPrice).toFixed(0)} tokens but only have ${this.ticketData.tokenBalance.toFixed(0)}`)
        }

        // Get Solana connection with Helius RPC
        const heliusApiKey = process.env.VUE_APP_HELIUS_API_KEY
        const rpcUrl = heliusApiKey
          ? `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`
          : 'https://api.mainnet-beta.solana.com'
        const connection = new Connection(rpcUrl)

        // Check SOL balance
        const solBalance = await connection.getBalance(new PublicKey(this.walletAddress))
        const solBalanceInSol = solBalance / 1e9
        console.log('💎 SOL Balance:', solBalanceInSol, 'SOL')

        // Minimum SOL required: network fee only (burn wallet already exists)
        const minSolRequired = 0.0001
        if (solBalanceInSol < minSolRequired) {
          throw new Error(`Insufficient SOL for transaction. You need at least ${minSolRequired} SOL but have ${solBalanceInSol.toFixed(6)} SOL`)
        }

        // Get wallet
        const wallet = window.solana
        if (!wallet) {
          throw new Error('Phantom wallet not found')
        }

        // Get user's token account (sender)
        const fromTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(this.mintAddress),
          new PublicKey(this.walletAddress)
        )

        // Double-check the actual token account balance on-chain
        const fromAccountInfo = await connection.getTokenAccountBalance(fromTokenAccount)
        const actualBalance = fromAccountInfo.value.uiAmount
        console.log('🔍 On-chain token balance:', actualBalance)
        console.log('🔍 Tokens to send:', burnUsd / tokenPrice)

        if (actualBalance < (burnUsd / tokenPrice)) {
          throw new Error(`Insufficient RAINDR0P balance. On-chain balance: ${actualBalance.toFixed(0)}, needed: ${(burnUsd / tokenPrice).toFixed(0)}`)
        }

        // Burn wallet address (tokens will be sent here and manually burned via pump.fun)
        const BURN_WALLET = new PublicKey(process.env.VUE_APP_BURN_WALLET)
        const toTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(this.mintAddress),
          BURN_WALLET
        )

        // Build transaction with transfer instruction only
        // Note: If token account doesn't exist, this will fail and we'll handle it
        const transaction = new Transaction()

        transaction.add(
          createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            new PublicKey(this.walletAddress),
            tokenAmount,
            [],
            TOKEN_PROGRAM_ID
          )
        )

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = new PublicKey(this.walletAddress)

        // Sign and send transaction
        const signed = await wallet.signTransaction(transaction)
        const signature = await connection.sendRawTransaction(signed.serialize())

        // Wait for confirmation
        await connection.confirmTransaction(signature)

        return signature
      } catch (err) {
        console.error('Burn transaction failed:', err)
        throw new Error('Failed to execute burn transaction. Please try again.')
      }
    },

    close() {
      this.selectedBurnAmount = 0
      this.customBurnAmount = 0
      this.showCustomInput = false
      this.error = null
      this.showSuccess = false
      this.isConfirmingTransaction = false
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.TicketCalculator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.TicketCalculator-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.TicketCalculator-modal {
  position: relative;
  background: linear-gradient(135deg, #87CEEB 0%, #5EB6E3 50%, #4CAEE0 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  padding: 20px;
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* Custom scrollbar for the modal */
.TicketCalculator-modal::-webkit-scrollbar {
  width: 8px;
}

.TicketCalculator-modal::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.TicketCalculator-modal::-webkit-scrollbar-thumb {
  background: rgba(100, 200, 255, 0.3);
  border-radius: 4px;
}

.TicketCalculator-modal::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 200, 255, 0.5);
}

.TicketCalculator-avatarSection {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
}

.TicketCalculator-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.TicketCalculator-avatarPlaceholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.TicketCalculator-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #fff;
  font-size: 32px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  z-index: 10;
}

.TicketCalculator-close:hover {
  opacity: 1;
}

.TicketCalculator-header {
  text-align: center;
  margin-bottom: 12px;
}

.TicketCalculator-title {
  font-size: 22px;
  font-weight: bold;
  color: #fff;
  margin: 0 0 4px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.TicketCalculator-timer {
  font-size: 14px;
  color: #fff;
  opacity: 0.9;
  font-weight: 500;
}

.TicketCalculator-loading {
  text-align: center;
  padding: 40px;
  color: #fff;
}

.TicketCalculator-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.TicketCalculator-loadingSubtext {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8px;
}

.TicketCalculator-success {
  text-align: center;
  padding: 40px;
  color: #fff;
}

.TicketCalculator-successIcon {
  margin: 0 auto 20px;
}

.TicketCalculator-checkmark {
  width: 80px;
  height: 80px;
  margin: 0 auto;
}

.TicketCalculator-checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 3;
  stroke-miterlimit: 10;
  stroke: #fff;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
}

.TicketCalculator-checkmark-check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  stroke-width: 4;
  stroke: #fff;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.5s forwards;
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
}

.TicketCalculator-successTitle {
  font-size: 32px;
  font-weight: 900;
  color: #fff;
  margin: 0 0 10px 0;
  text-shadow: 0 4px 12px rgba(255, 255, 255, 0.4);
}

.TicketCalculator-successText {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

.TicketCalculator-holdingsCard {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
  text-align: center;
  backdrop-filter: blur(10px);
}

.TicketCalculator-holdingsValue {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.TicketCalculator-holdingsTier {
  font-size: 13px;
  color: #fff;
  opacity: 0.9;
}

.TicketCalculator-joinMessage,
.TicketCalculator-currentTickets {
  text-align: center;
  padding: 16px;
  margin-bottom: 16px;

  p {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.95);
    margin: 0;
    line-height: 1.5;
  }
}

.TicketCalculator-boostSection {
  margin-bottom: 12px;
}

.TicketCalculator-boostTitle {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
}

.TicketCalculator-boostDescription {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
  text-align: center;
}

.TicketCalculator-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.TicketCalculator-option {
  display: block;
  background: rgba(255, 255, 255, 0.15);
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  position: relative;
}

.TicketCalculator-option:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.TicketCalculator-option.is-selected {
  background: rgba(255, 255, 255, 0.4);
  border-color: #fff;
  border-width: 3px;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: scale(1.03);
}

.TicketCalculator-option.is-selected::before {
  content: '✓';
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: #fff;
  color: #4CAEE0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: checkmarkPop 0.3s ease;
}

.TicketCalculator-option.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.TicketCalculator-option.is-disabled:hover {
  transform: none;
  box-shadow: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.TicketCalculator-option.is-disabled input {
  cursor: not-allowed;
}

.TicketCalculator-optionWarning {
  font-size: 11px;
  color: #ff6b6b;
  margin-top: 4px;
  font-weight: 600;
}

@keyframes checkmarkPop {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.TicketCalculator-option--recommended {
  border-color: rgba(255, 215, 0, 0.7);
  background: rgba(255, 215, 0, 0.1);
}

.TicketCalculator-option--recommended:hover {
  border-color: rgba(255, 215, 0, 0.85);
  background: rgba(255, 215, 0, 0.2);
}

.TicketCalculator-option--recommended.is-selected {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.25);
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.6), 0 4px 16px rgba(0, 0, 0, 0.2);
}

.TicketCalculator-option--recommended.is-selected::before {
  background: #FFD700;
  color: #fff;
}

.TicketCalculator-radio {
  display: none;
}

.TicketCalculator-optionContent {
  width: 100%;
}

.TicketCalculator-optionHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.TicketCalculator-optionTitle {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.TicketCalculator-recommendedBadge {
  font-size: 11px;
  color: #ffd700;
  margin-left: 6px;
}

.TicketCalculator-optionPrice {
  font-size: 13px;
  color: #fff;
  font-weight: 600;
}

.TicketCalculator-optionTickets {
  font-size: 13px;
  color: #fff;
}

.TicketCalculator-optionBonus {
  color: #90EE90;
  font-size: 11px;
  font-weight: 600;
}

.TicketCalculator-optionEfficiency {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

.TicketCalculator-customInput {
  margin-top: 8px;
}

.TicketCalculator-inputWrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.TicketCalculator-dollarSign {
  position: absolute;
  left: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  pointer-events: none;
  z-index: 1;
}

.TicketCalculator-input {
  width: 100%;
  padding: 10px 10px 10px 28px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  -moz-appearance: textfield; /* Firefox */
  backdrop-filter: blur(5px);
}

.TicketCalculator-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

/* Remove spinner arrows in Chrome, Safari, Edge, Opera */
.TicketCalculator-input::-webkit-outer-spin-button,
.TicketCalculator-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.TicketCalculator-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.25);
}

.TicketCalculator-customPreview {
  margin-top: 6px;
  font-size: 12px;
  color: #fff;
}

.TicketCalculator-customPreviewSuccess {
  color: #4caf50;
  font-weight: 600;
}

.TicketCalculator-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  position: relative;
  z-index: 10;
}

.TicketCalculator-button {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  pointer-events: auto;
  position: relative;
  z-index: 1;
}

.TicketCalculator-button--secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.TicketCalculator-button--secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

.TicketCalculator-button--primary {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.5);
  font-weight: 700;
}

.TicketCalculator-button--primary:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.7);
  transform: translateY(-1px);
}

.TicketCalculator-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.TicketCalculator-button--disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;

  &:hover {
    transform: none !important;
    background: rgba(255, 255, 255, 0.25) !important;
    border-color: rgba(255, 255, 255, 0.5) !important;
  }
}

.TicketCalculator-buttonContent {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.TicketCalculator-loader {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

.TicketCalculator-info {
  font-size: 11px;
  color: #fff;
  text-align: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(5px);
}

.TicketCalculator-error {
  text-align: center;
  padding: 32px;
  color: #fff;
}

.TicketCalculator-error p {
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.4);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  backdrop-filter: blur(5px);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
