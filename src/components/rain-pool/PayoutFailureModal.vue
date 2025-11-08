<template>
  <Teleport to="body">
    <div v-if="isOpen" class="PayoutFailureModal" @click="close">
      <div class="PayoutFailureModal-content" @click.stop>
        <!-- Error Icon -->
        <div class="PayoutFailureModal-icon">⚠️</div>

        <!-- Title -->
        <h2 class="PayoutFailureModal-title">Payout Failed</h2>

        <!-- Error Message -->
        <div class="PayoutFailureModal-message">
          <p class="PayoutFailureModal-errorText">
            The payout wallet does not have enough funds to complete this transaction.
          </p>
          <p class="PayoutFailureModal-instructions">
            Please contact <strong>@raindr0p_fun</strong> on X (Twitter) with the Pool ID below, and we will send your winnings ASAP.
          </p>
        </div>

        <!-- Pool ID Box -->
        <div class="PayoutFailureModal-poolIdBox">
          <div class="PayoutFailureModal-poolIdLabel">Pool ID</div>
          <div class="PayoutFailureModal-poolIdValue">{{ poolId }}</div>
          <button @click="copyPoolId" class="PayoutFailureModal-copyBtn">
            {{ copied ? 'Copied!' : 'Copy Pool ID' }}
          </button>
        </div>

        <!-- Winner Info (if provided) -->
        <div v-if="winnerAddress" class="PayoutFailureModal-winnerInfo">
          <div class="PayoutFailureModal-winnerLabel">Your Wallet</div>
          <div class="PayoutFailureModal-winnerAddress">{{ truncatedAddress }}</div>
          <div class="PayoutFailureModal-prizeAmount">{{ prizeAmount }} SOL</div>
        </div>

        <!-- Apology -->
        <p class="PayoutFailureModal-apology">
          We sincerely apologize for this inconvenience. Your winnings are guaranteed and will be sent shortly!
        </p>

        <!-- Action Buttons -->
        <div class="PayoutFailureModal-actions">
          <a
            href="https://x.com/raindr0p_fun"
            target="_blank"
            rel="noopener noreferrer"
            class="PayoutFailureModal-contactBtn"
          >
            <SvgIcon name="x" size="lg" />
            Contact on X
          </a>
          <button @click="close" class="PayoutFailureModal-closeBtn">
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'

const props = defineProps({
  isOpen: Boolean,
  poolId: String,
  winnerAddress: String,
  prizeAmount: Number,
  errorMessage: String
})

const emit = defineEmits(['close'])

const copied = ref(false)

const truncatedAddress = computed(() => {
  if (!props.winnerAddress) return ''
  return `${props.winnerAddress.slice(0, 4)}...${props.winnerAddress.slice(-4)}`
})

function copyPoolId() {
  if (!props.poolId) return

  navigator.clipboard.writeText(props.poolId)
  copied.value = true

  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function close() {
  emit('close')
}
</script>

<style scoped lang="scss">
.PayoutFailureModal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000; // Higher than winner modal
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  animation: fadeIn 0.3s ease;

  &-content {
    position: relative;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
    border: 3px solid rgba(255, 255, 255, 0.6);
    border-radius: 20px;
    padding: 2.5rem 2rem;
    max-width: 550px;
    width: 90%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(239, 68, 68, 0.5);
    animation: slideUp 0.4s ease;
    max-height: 90vh;
    overflow-y: auto;

    @media (max-width: 768px) {
      padding: 2rem 1.5rem;
    }
  }

  &-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: pulse 2s ease infinite;
  }

  &-title {
    font-size: 2rem;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    margin-bottom: 1.5rem;

    @media (max-width: 768px) {
      font-size: 1.75rem;
    }
  }

  &-message {
    margin-bottom: 1.5rem;
  }

  &-errorText,
  &-instructions {
    color: white;
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1rem;

    strong {
      font-weight: 900;
      color: #fef3c7;
    }
  }

  &-poolIdBox {
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  &-poolIdLabel {
    font-size: 0.75rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
  }

  &-poolIdValue {
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
    font-family: 'Courier New', monospace;
    word-break: break-all;
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  &-copyBtn {
    padding: 0.625rem 1.25rem;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 8px;
    color: white;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &-winnerInfo {
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  &-winnerLabel {
    font-size: 0.75rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
  }

  &-winnerAddress {
    font-size: 1rem;
    font-weight: 600;
    color: white;
    font-family: 'Courier New', monospace;
    margin-bottom: 0.75rem;
  }

  &-prizeAmount {
    font-size: 1.5rem;
    font-weight: 900;
    color: #fef3c7;
    text-shadow: 0 2px 8px rgba(254, 243, 199, 0.4);
  }

  &-apology {
    color: rgba(255, 255, 255, 0.95);
    font-size: 0.875rem;
    font-style: italic;
    line-height: 1.5;
    margin-bottom: 1.5rem;
  }

  &-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &-contactBtn,
  &-closeBtn {
    width: 100%;
    padding: 1rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    text-decoration: none;
  }

  &-contactBtn {
    background: rgba(255, 255, 255, 0.95);
    color: #dc2626;
    border: 2px solid rgba(255, 255, 255, 1);

    .SvgIcon {
      filter: none;
    }

    &:hover {
      background: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 255, 255, 0.3);
    }

    &:active {
      transform: translateY(0);
    }
  }

  &-closeBtn {
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}
</style>
