<template>
  <Teleport to="body">
    <div
      v-if="store.showWinnerModal && store.winnerModalData"
      class="WinnerModal"
      @click="close"
    >
      <div class="WinnerModal-content" @click.stop>
        <div class="WinnerModal-confetti"></div>

        <h1 class="WinnerModal-title">
          {{
            store.winnerModalData.totalWinners > 1
              ? store.winnerModalData.position === store.winnerModalData.totalWinners
                ? 'RAINPOOL COMPLETED!'
                : `WINNER ${store.winnerModalData.position}/${store.winnerModalData.totalWinners}!`
              : 'WINNER!'
          }}
        </h1>

        <div class="WinnerModal-avatar">
          <img
            v-if="store.winnerModalData.avatar"
            :src="store.winnerModalData.avatar"
            :alt="store.winnerModalData.address"
          />
          <div v-else-if="store.winnerModalData.icon" class="WinnerModal-avatarIcon">
            {{ store.winnerModalData.icon }}
          </div>
        </div>

        <div class="WinnerModal-address" @click="openExplorer">
          {{ store.winnerModalData.truncatedAddress }}
        </div>

        <div class="WinnerModal-prize">{{ store.winnerModalData.prize }} SOL</div>

        <div v-if="store.winnerModalData.txSig" class="WinnerModal-txSig">
          <div class="WinnerModal-txLabel">Transaction:</div>
          <a
            :href="`https://solscan.io/tx/${store.winnerModalData.txSig}`"
            target="_blank"
            rel="noopener noreferrer"
            @click.stop
          >
            {{ store.winnerModalData.txSig.slice(0, 8) }}...{{
              store.winnerModalData.txSig.slice(-8)
            }}
            <span class="WinnerModal-txIcon">↗</span>
          </a>
        </div>

        <button @click="shareOnTwitter" class="WinnerModal-shareBtn" :disabled="isGeneratingImage">
          <template v-if="!isGeneratingImage">
            <SvgIcon name="x" size="lg" />
            Share on X
          </template>
          <template v-else>
            Generating image...
          </template>
        </button>

        <button @click="close" class="WinnerModal-continueBtn">Continue</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRainPoolStore } from '@/stores/rainPool'
import { useConfetti } from '@/composables/rain-pool/useConfetti'
import { useWinnerShareImage } from '@/composables/rain-pool/useWinnerShareImage'
import SvgIcon from '@/components/SvgIcon.vue'

const store = useRainPoolStore()
const { celebrateWinner } = useConfetti()
const { generateWinnerImage, downloadImage } = useWinnerShareImage()

const isGeneratingImage = ref(false)

// Trigger confetti when modal opens
watch(() => store.showWinnerModal, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      celebrateWinner()
    }, 100)
  }
})

function close() {
  store.setWinnerModal(false)
}

function openExplorer() {
  if (store.winnerModalData?.address) {
    window.open(`https://solscan.io/account/${store.winnerModalData.address}`, '_blank')
  }
}

async function shareOnTwitter() {
  if (!store.winnerModalData) return

  try {
    isGeneratingImage.value = true

    // Generate the share image
    const imageBlob = await generateWinnerImage(store.winnerModalData)

    // Download the image
    downloadImage(imageBlob, `raindr0p-winner-${Date.now()}.png`)

    // Wait a moment for download to initiate
    await new Promise(resolve => setTimeout(resolve, 500))

    // Open Twitter with pre-filled text
    const prize = store.winnerModalData.prize
    const tweetText = `I just won ${prize} SOL in @raindr0p_fun Rain Pool! 🔥💰\n\nJoin the community-driven rewards at raindr0p.fun\n\n#RainDr0p #Solana #Web3`
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
    window.open(twitterUrl, '_blank', 'noopener,noreferrer')

  } catch (error) {
    console.error('Error generating share image:', error)
    store.addToast('Failed to generate share image', 'error')
  } finally {
    isGeneratingImage.value = false
  }
}
</script>

<style scoped lang="scss">
.WinnerModal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10002;
  animation: fadeIn 0.3s ease;

  &-content {
    position: relative;
    background: linear-gradient(135deg, rgba(135, 206, 235, 0.98) 0%, rgba(94, 182, 227, 0.98) 50%, rgba(76, 174, 224, 0.98) 100%);
    border: 3px solid rgba(255, 255, 255, 0.5);
    border-radius: 20px;
    padding: 3rem 2rem;
    max-width: 500px;
    width: 90%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(135, 206, 235, 0.4);
    animation: slideUp 0.4s ease;
  }

  &-confetti {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    border-radius: 20px;
  }

  &-title {
    font-size: 2rem;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 4px 12px rgba(255, 255, 255, 0.6);
    margin-bottom: 1.5rem;
    animation: pulse 1s ease infinite;
  }

  &-avatar {
    width: 120px;
    height: 120px;
    margin: 0 auto 1rem;
    border-radius: 50%;
    border: 4px solid #fff;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(255, 255, 255, 0.5);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &-address {
    font-size: 1.125rem;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    transition: color 0.2s ease;

    &:hover {
      color: #fff;
    }
  }

  &-prize {
    font-size: 2.5rem;
    font-weight: 900;
    color: #fff;
    margin: 1rem 0;
    text-shadow: 0 4px 16px rgba(255, 255, 255, 0.8);
  }

  &-shareBtn,
  &-continueBtn {
    width: 100%;
    padding: 1rem;
    margin-top: 1rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  &-shareBtn {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.5);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    .SvgIcon {
      filter: brightness(0) invert(1);
    }

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.35);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 255, 255, 0.3);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &-continueBtn {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.5);
    color: white;

    &:hover {
      background: rgba(255, 255, 255, 0.35);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 255, 255, 0.3);
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
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
</style>
