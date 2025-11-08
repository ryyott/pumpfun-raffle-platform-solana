<template>
  <div class="ProgressBar">
    <div v-if="store.isAdminPaused" class="ProgressBar-pausedOverlay">
      <div class="ProgressBar-pausedCard">
        <div class="ProgressBar-pausedIcon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
            <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
          </svg>
        </div>
        <div class="ProgressBar-pausedTitle">Pool Temporarily Paused</div>
        <div class="ProgressBar-pausedMessage">
          The pool is currently paused by the admin. It will resume shortly.
        </div>
      </div>
    </div>
    <div v-else>
      <div class="ProgressBar-label">
        <span>ROLLING IN {{ formattedTimeRemaining }}</span>
      </div>
      <div class="ProgressBar-track">
        <div class="ProgressBar-fill" :style="{ width: store.progressPercentage + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRainPoolStore } from '@/stores/rainPool'
import { useCountdown } from '@/composables/rain-pool/useCountdown'

const store = useRainPoolStore()
const { formattedTimeRemaining } = useCountdown()
</script>

<style scoped lang="scss">
.ProgressBar {
  margin: 1.5rem 0;

  &-label {
    font-size: 0.875rem;
    font-weight: 700;
    color: white;
    text-align: center;
    margin-bottom: 0.5rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  &-pausedOverlay {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &-pausedCard {
    background: rgba(157, 196, 223, 0.35);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 2px solid rgba(176, 216, 237, 0.5);
    border-radius: 12px;
    padding: 0.75rem 1.5rem;
    text-align: center;
    box-shadow: 0 4px 20px rgba(135, 206, 235, 0.3);
    animation: gentlePulse 3s ease-in-out infinite;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &-pausedIcon {
    color: #FFA500;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &-pausedTitle {
    font-size: 0.875rem;
    font-weight: 700;
    color: white;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  &-pausedMessage {
    display: none;
  }

  &-track {
    width: 100%;
    height: 24px;
    background: rgba(157, 196, 223, 0.3);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border-radius: 12px;
    overflow: hidden;
    border: 2px solid rgba(176, 216, 237, 0.4);
  }

  &-fill {
    height: 100%;
    background: linear-gradient(90deg, #4CAEE0 0%, #87CEEB 100%);
    transition: width 0.1s linear;
    box-shadow: 0 0 16px rgba(76, 174, 224, 0.6);
  }
}

@keyframes gentlePulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(135, 206, 235, 0.3);
  }
  50% {
    transform: scale(1.01);
    box-shadow: 0 4px 24px rgba(135, 206, 235, 0.4);
  }
}
</style>
