<template>
  <Teleport to="body">
    <div v-if="isOpen" class="TwitterBonusModal" @click="handleSkip">
      <div class="TwitterBonusModal-content" @click.stop>
        <!-- Header -->
        <div class="TwitterBonusModal-header">
          <h2 class="TwitterBonusModal-title">🎉 You're In!</h2>
          <p class="TwitterBonusModal-subtitle">Want to double your chances?</p>
        </div>

        <!-- Main Content -->
        <div v-if="step === 'initial'" class="TwitterBonusModal-body">
          <div class="TwitterBonusModal-offer">
            <div class="TwitterBonusModal-offerIcon">🎫</div>
            <div class="TwitterBonusModal-offerText">
              <strong>Get +1 Bonus Ticket</strong>
              <span>Share on X (Twitter) to support the RainDr0p community!</span>
            </div>
          </div>

          <div class="TwitterBonusModal-tweetPreview">
            <p>{{ tweetText }}</p>
          </div>

          <div class="TwitterBonusModal-actions">
            <button @click="openTwitter" class="TwitterBonusModal-shareBtn">
              <SvgIcon name="x" size="lg" />
              Share & Claim Bonus
            </button>
            <button @click="handleSkip" class="TwitterBonusModal-skipBtn">
              Skip
            </button>
          </div>
        </div>

        <!-- Tweet URL Input Step -->
        <div v-else-if="step === 'verify'" class="TwitterBonusModal-body">
          <div class="TwitterBonusModal-verifyHeader">
            <div class="TwitterBonusModal-verifyIcon">✅</div>
            <p class="TwitterBonusModal-verifyText">
              Great! Now paste your tweet URL below to claim your bonus ticket.
            </p>
          </div>

          <div class="TwitterBonusModal-inputGroup">
            <label for="tweetUrl" class="TwitterBonusModal-label">Tweet URL</label>
            <input
              id="tweetUrl"
              v-model="tweetUrl"
              type="url"
              placeholder="https://twitter.com/username/status/1234..."
              class="TwitterBonusModal-input"
              :disabled="isVerifying"
              @keyup.enter="handleVerify"
            />
            <p v-if="errorMessage" class="TwitterBonusModal-error">{{ errorMessage }}</p>
          </div>

          <div class="TwitterBonusModal-actions">
            <button
              @click="handleVerify"
              class="TwitterBonusModal-verifyBtn"
              :disabled="!tweetUrl || isVerifying"
            >
              <span v-if="isVerifying">Verifying...</span>
              <span v-else>Claim Bonus Ticket</span>
            </button>
            <button @click="handleSkip" class="TwitterBonusModal-skipBtn" :disabled="isVerifying">
              Cancel
            </button>
          </div>
        </div>

        <!-- Success Step -->
        <div v-else-if="step === 'success'" class="TwitterBonusModal-body">
          <div class="TwitterBonusModal-success">
            <div class="TwitterBonusModal-successIcon">🎊</div>
            <h3 class="TwitterBonusModal-successTitle">Bonus Claimed!</h3>
            <p class="TwitterBonusModal-successText">
              You now have <strong>{{ newTotalTickets }} tickets</strong> in this pool!
            </p>
            <p class="TwitterBonusModal-successWinChance">
              Win Chance: <strong>{{ newWinChance }}%</strong>
            </p>
          </div>

          <button @click="handleClose" class="TwitterBonusModal-continueBtn">
            Continue
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import SupabaseService from '@/services/SupabaseService'

const props = defineProps({
  isOpen: Boolean,
  walletAddress: String,
  poolId: String,
  currentTickets: Number
})

const emit = defineEmits(['close', 'success', 'show-toast'])

// State
const step = ref('initial') // 'initial' | 'verify' | 'success'
const tweetUrl = ref('')
const errorMessage = ref('')
const isVerifying = ref(false)
const newTotalTickets = ref(0)
const newWinChance = ref(0)

// Tweet text
const tweetText = computed(() => {
  return `I just joined @raindr0p_fun live RainPool giving away Solana! 💧\n\nJoin now at raindr0p.fun or watch the stream on pump.fun\n\n#RainDr0p #Solana #Web3`
})

// Twitter intent URL
const twitterIntentUrl = computed(() => {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText.value)}`
})

// Open Twitter in new window
function openTwitter() {
  window.open(twitterIntentUrl.value, '_blank', 'noopener,noreferrer,width=550,height=420')

  // Move to verification step
  setTimeout(() => {
    step.value = 'verify'
  }, 500)
}

// Verify tweet URL and claim bonus
async function handleVerify() {
  if (!tweetUrl.value.trim()) {
    errorMessage.value = 'Please enter a tweet URL'
    return
  }

  // Basic URL validation
  if (!tweetUrl.value.includes('twitter.com/') && !tweetUrl.value.includes('x.com/')) {
    errorMessage.value = 'Please enter a valid Twitter/X URL'
    return
  }

  if (!tweetUrl.value.includes('/status/')) {
    errorMessage.value = 'Please enter a direct link to your tweet (must include /status/)'
    return
  }

  isVerifying.value = true
  errorMessage.value = ''

  try {
    const result = await SupabaseService.claimTwitterBonus(
      props.walletAddress,
      props.poolId,
      tweetUrl.value.trim()
    )

    if (result.success) {
      newTotalTickets.value = result.tickets.total
      newWinChance.value = result.winChance.toFixed(2)
      step.value = 'success'

      // Emit success event with new ticket data
      emit('success', {
        tickets: result.tickets,
        winChance: result.winChance
      })

      // Show success toast
      emit('show-toast', '🎉 Twitter bonus claimed! +1 ticket added', 'success')
    } else {
      errorMessage.value = result.error || 'Failed to claim bonus'

      // Show error toast
      emit('show-toast', result.error || 'Failed to claim bonus', 'error')
    }
  } catch (error) {
    console.error('Error claiming Twitter bonus:', error)
    errorMessage.value = 'An error occurred. Please try again.'
    emit('show-toast', 'An error occurred. Please try again.', 'error')
  } finally {
    isVerifying.value = false
  }
}

// Handle skip/cancel
function handleSkip() {
  if (step.value === 'initial' || step.value === 'verify') {
    emit('close')
  }
}

// Handle close after success
function handleClose() {
  emit('close')
}

// Reset state when modal closes
function reset() {
  step.value = 'initial'
  tweetUrl.value = ''
  errorMessage.value = ''
  isVerifying.value = false
  newTotalTickets.value = 0
  newWinChance.value = 0
}

// Expose reset for parent component
defineExpose({ reset })
</script>

<style scoped lang="scss">
.TwitterBonusModal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  animation: fadeIn 0.3s ease;

  &-content {
    position: relative;
    background: linear-gradient(135deg, rgba(135, 206, 235, 0.98) 0%, rgba(94, 182, 227, 0.98) 50%, rgba(76, 174, 224, 0.98) 100%);
    border: 3px solid rgba(255, 255, 255, 0.5);
    border-radius: 20px;
    padding: 2.5rem 2rem;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.4s ease;
    max-height: 90vh;
    overflow-y: auto;

    @media (max-width: 768px) {
      padding: 2rem 1.5rem;
    }
  }

  &-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  &-title {
    font-size: 2rem;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 4px 12px rgba(255, 255, 255, 0.6);
    margin-bottom: 0.5rem;

    @media (max-width: 768px) {
      font-size: 1.75rem;
    }
  }

  &-subtitle {
    font-size: 1.125rem;
    color: rgba(255, 255, 255, 0.95);
    font-weight: 600;
  }

  &-body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &-offer {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.4);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }

  &-offerIcon {
    font-size: 2.5rem;
    flex-shrink: 0;
  }

  &-offerText {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    color: white;

    strong {
      font-size: 1.125rem;
      font-weight: 700;
    }

    span {
      font-size: 0.875rem;
      opacity: 0.9;
    }
  }

  &-tweetPreview {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;

    p {
      color: white;
      font-size: 0.875rem;
      line-height: 1.6;
      white-space: pre-wrap;
      margin: 0;
    }
  }

  &-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &-shareBtn,
  &-verifyBtn,
  &-continueBtn {
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

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &-shareBtn {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);

    .SvgIcon {
      filter: brightness(0) invert(1);
    }

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(34, 197, 94, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }

  &-verifyBtn,
  &-continueBtn {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }

  &-skipBtn {
    width: 100%;
    padding: 0.875rem;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  // Verification Step
  &-verifyHeader {
    text-align: center;
  }

  &-verifyIcon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  &-verifyText {
    color: white;
    font-size: 1rem;
    line-height: 1.5;
  }

  &-inputGroup {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &-label {
    font-size: 0.875rem;
    font-weight: 700;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &-input {
    padding: 0.875rem 1rem;
    border-radius: 10px;
    border: 2px solid rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 0.875rem;
    transition: all 0.2s ease;

    &::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    &:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.7);
      background: rgba(255, 255, 255, 0.25);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &-error {
    color: #fca5a5;
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0;
  }

  // Success Step
  &-success {
    text-align: center;
    padding: 1rem 0;
  }

  &-successIcon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce 1s ease infinite;
  }

  &-successTitle {
    font-size: 1.75rem;
    font-weight: 900;
    color: white;
    text-shadow: 0 4px 12px rgba(255, 255, 255, 0.6);
    margin-bottom: 0.75rem;
  }

  &-successText {
    font-size: 1.125rem;
    color: white;
    margin-bottom: 0.5rem;

    strong {
      font-weight: 900;
      color: #ffd700;
      text-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
    }
  }

  &-successWinChance {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.95);

    strong {
      font-weight: 900;
      color: white;
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

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
