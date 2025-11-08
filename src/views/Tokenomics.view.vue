<template>
  <section class="TokenomicsView Section" id="tokenomics">
    <div class="TokenomicsView-inner View d-flex">
      <div class="TokenomicsView-contentWrapper">
        <h1 class="TokenomicsView-title">
          {{ $t('tokenomics.title') }}
        </h1>
        <div class="TokenomicsView-content d-flex">
          <div class="TokenomicsView-infoContainer">
            <article class="TokenomicsView-info">
              <h2 class="TokenomicsView-infoTitle">
                {{ $t('tokenomics.address.title') }}
              </h2>
              <p class="TokenomicsView-infoDescription text-xl">
                {{ $t('tokenomics.address.description') }}
              </p>
                <ActionButton
                  size="xs"
                  variant="secondary"
                  :title="$t('tokenomics.address.copy')"
                  class="TokenomicsView-copyButton"
                  @click="copyToClipboard()"
                  >
                  <SvgIcon name="copy" size="xs" />
                  <transition name="fade">
                    <div class="tooltip" v-if="showTooltip">Copied!</div>
                  </transition>
                </ActionButton>
            </article>

            <article class="TokenomicsView-info">
              <h2 class="TokenomicsView-infoTitle">
                {{ $t('tokenomics.supply.title') }}
              </h2>
              <p class="TokenomicsView-infoDescription text-xl">
                {{ $t('tokenomics.supply.description') }}
              </p>
            </article>

            <article class="TokenomicsView-info">
              <h2 class="TokenomicsView-infoTitle">
                {{ $t('tokenomics.tax.title') }}
              </h2>
              <p class="TokenomicsView-infoDescription text-xl">
                {{ $t('tokenomics.tax.description') }}
              </p>
            </article>

            <article class="TokenomicsView-infoSection">
              <h2 class="TokenomicsView-infoTitle">
                {{ $t('tokenomics.allocation.title') }}
              </h2>
              <div class="TokenomicsView-allocationList">
                <p class="TokenomicsView-allocationItem text-lg">{{ $t('tokenomics.allocation.liquidity') }}</p>
                <p class="TokenomicsView-allocationItem text-lg">{{ $t('tokenomics.allocation.dev') }}</p>
                <p class="TokenomicsView-allocationItem text-lg">{{ $t('tokenomics.allocation.marketing') }}</p>
                <p class="TokenomicsView-allocationItem text-lg">{{ $t('tokenomics.allocation.cex') }}</p>
              </div>
            </article>

          </div>
          <div class="TokenomicsView-chartContainer">
            <TokenChart />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Cloud SVGs -->
    <svg class="TokenomicsView-cloud TokenomicsView-cloud--1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 300" role="img" aria-label="Cartoon cloud">
      <defs>
        <radialGradient id="tokenomicsSheen1" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1"/>
          <stop offset="80%" stop-color="#F1FAFF" stop-opacity="1"/>
          <stop offset="100%" stop-color="#E6F7FF" stop-opacity=".9"/>
        </radialGradient>
        <filter id="tokenomicsDrop1" x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur"/>
          <feOffset dx="0" dy="6" in="blur" result="off"/>
          <feColorMatrix in="off" type="matrix" 
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 .18 0" result="shadow"/>
          <feBlend in="SourceGraphic" in2="shadow" mode="normal"/>
        </filter>
      </defs>
      <g filter="url(#tokenomicsDrop1)">
        <path fill="url(#tokenomicsSheen1)" stroke="#7ED3FF" stroke-width="10" stroke-linejoin="round"
          d="M147 206c-36 0-66-26-66-59 0-28 20-52 48-58 7-39 45-70 90-70 34 0 64 16 79 40 9-4 20-6 31-6 43 0 78 30 78 68 0 2 0 4-.2 6 34 6 60 32 60 63 0 36-32 65-72 65H147z"/>
        <ellipse cx="200" cy="90" rx="42" ry="28" fill="#FFFFFF" opacity=".85"/>
        <ellipse cx="260" cy="75" rx="55" ry="36" fill="#FFFFFF" opacity=".9"/>
        <ellipse cx="320" cy="95" rx="48" ry="30" fill="#FFFFFF" opacity=".9"/>
        <ellipse cx="380" cy="110" rx="60" ry="36" fill="#FFFFFF" opacity=".92"/>
        <ellipse cx="140" cy="125" rx="58" ry="38" fill="#FFFFFF" opacity=".92"/>
      </g>
    </svg>

    <svg class="TokenomicsView-cloud TokenomicsView-cloud--2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" aria-label="Cloud icon">
      <path fill="#FFFFFF" stroke="#7ED3FF" stroke-width="8" stroke-linejoin="round"
        d="M58 112c-22 0-40-16-40-35 0-17 12-31 29-34 4-23 26-39 52-39 20 0 38 9 47 22 5-2 12-3 18-3 26 0 46 18 46 40 0 1 0 2-.1 3 20 4 34 19 34 36 0 21-19 38-42 38H58z"/>
    </svg>

    <svg class="TokenomicsView-cloud TokenomicsView-cloud--3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 300" role="img" aria-label="Cartoon cloud">
      <defs>
        <radialGradient id="tokenomicsSheen3" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1"/>
          <stop offset="80%" stop-color="#F1FAFF" stop-opacity="1"/>
          <stop offset="100%" stop-color="#E6F7FF" stop-opacity=".9"/>
        </radialGradient>
        <filter id="tokenomicsDrop3" x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur"/>
          <feOffset dx="0" dy="6" in="blur" result="off"/>
          <feColorMatrix in="off" type="matrix" 
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 .18 0" result="shadow"/>
          <feBlend in="SourceGraphic" in2="shadow" mode="normal"/>
        </filter>
      </defs>
      <g filter="url(#tokenomicsDrop3)">
        <path fill="url(#tokenomicsSheen3)" stroke="#7ED3FF" stroke-width="10" stroke-linejoin="round"
          d="M147 206c-36 0-66-26-66-59 0-28 20-52 48-58 7-39 45-70 90-70 34 0 64 16 79 40 9-4 20-6 31-6 43 0 78 30 78 68 0 2 0 4-.2 6 34 6 60 32 60 63 0 36-32 65-72 65H147z"/>
        <ellipse cx="200" cy="90" rx="42" ry="28" fill="#FFFFFF" opacity=".85"/>
        <ellipse cx="260" cy="75" rx="55" ry="36" fill="#FFFFFF" opacity=".9"/>
        <ellipse cx="320" cy="95" rx="48" ry="30" fill="#FFFFFF" opacity=".9"/>
        <ellipse cx="380" cy="110" rx="60" ry="36" fill="#FFFFFF" opacity=".92"/>
        <ellipse cx="140" cy="125" rx="58" ry="38" fill="#FFFFFF" opacity=".92"/>
      </g>
    </svg>

    <!-- Animated raindrops -->
    <div class="TokenomicsView-raindrops">
      <div class="TokenomicsView-raindrop TokenomicsView-raindrop--1"></div>
      <div class="TokenomicsView-raindrop TokenomicsView-raindrop--2"></div>
      <div class="TokenomicsView-raindrop TokenomicsView-raindrop--3"></div>
      <div class="TokenomicsView-raindrop TokenomicsView-raindrop--4"></div>
      <div class="TokenomicsView-raindrop TokenomicsView-raindrop--5"></div>
    </div>
  </section>
</template>

<script>
import TokenChart from '@/components/TokenChart.vue';
import ActionButton from '@/components/ActionButton.vue';
import SvgIcon from '@/components/SvgIcon.vue';
import ScrollAnimation from '@/mixins/ScrollAnimation.mixin';

export default {
  name: 'TokenomicsView',

  mixins: [ScrollAnimation],

  data() {
    return {
      address: '4RB9s6anCqR9bwA5NBYPZdsY3pdkS43r9bGLJjBYpump',
      showTooltip: false,
    }
  },

  components: {
    TokenChart,
    ActionButton,
    SvgIcon
  },

  mounted() {
    this.animateBg();
    this.animateRaindrops();
  },

  methods: {
    animateBg() {
      const TARGET_SEL = '.TokenomicsView';
      const TRIGGER_ELEMENT_SEL = "#tokenomics";
      const outroAnimationOptions = {
        runInMobile: false,
        gsapOptions: {
          scrollTrigger: {
            trigger: TRIGGER_ELEMENT_SEL,
            scrub: true,
            start: "top bottom",
            end: "bottom top",
          },
          //: 70vw -5vh, 30vw 0vh, 0vw -5vh, center;
          backgroundPositionY: '20vh, 25vh, 20vh, center, center',
        },
      };

      this.timeline.to(TARGET_SEL, outroAnimationOptions);
    },

    async copyToClipboard() {
      try {
        // Try modern clipboard API first
        await navigator.clipboard.writeText(this.address);
        this.showTooltip = true;
        setTimeout(() => {
          this.showTooltip = false;
        }, 2000);
      } catch (err) {
        // Fallback for older browsers or when clipboard API is blocked
        try {
          const textArea = document.createElement('textarea');
          textArea.value = this.address;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);

          if (successful) {
            this.showTooltip = true;
            setTimeout(() => {
              this.showTooltip = false;
            }, 2000);
          } else {
            console.error('Failed to copy text');
          }
        } catch (fallbackErr) {
          console.error('Clipboard copy failed:', fallbackErr);
        }
      }
    },

    animateRaindrops() {
      const TARGET_SEL = '.TokenomicsView-raindrop';
      const TRIGGER_ELEMENT_SEL = "#tokenomics";

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
      };

      this.timeline.to(TARGET_SEL, animationOptions);
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables';
@import '@/styles/breakpoints';

.TokenomicsView {
  background-image: url('@/assets/images/asfalt-light.png');
  background-color: #4CAEE0;
  background-repeat: repeat;
  position: relative;

  &-contentWrapper {
    margin: auto;
    width: 100%;
  }

  &-title,
  &-description {
    color: $white;
  }

  &-content {
    @include sm-down {
      flex-direction: column;  
    }
  }

  &-infoContainer {
    width: 50%;

    @include md-down {
      width: 35%;
    }

    @include sm-down {
      box-sizing: border-box;
      gap: 12px;
      width: 100%;
      background: #4CAEE0;
      mask-image: url('@/assets/images/tokenomics-mask.svg');
      mask-position: center;
      mask-repeat: no-repeat;
      mask-size: 100% 100%;
      padding: 8px;
    }
  }

  &-chartContainer {
    display: flex;
    justify-content: center;
    width: 50%;

    @include md-down {
      justify-content: unset;
    }
    
    @include sm-down {
      justify-content: center;
      width: 100%;
    }
  }

  &-info {
    background: #4CAEE0;
    border-radius: 12px;
    margin-bottom: 12px;
    padding: 18px;
    mask-image: url('@/assets/images/tokenomics-mask.svg');
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 100% 100%;
    max-width: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    text-align: left;

    @include sm-down {
      display: flex;
      gap: 12px; 
      padding: 0;
      margin-bottom: 0;
      mask-image: unset;
      background: unset;
      border-radius: 0;
      overflow: visible;

      &:nth-child(1) {
        flex: 3;
      }
      &:nth-child(2) {
        flex: 2;
      }
      &:nth-child(3) {
        flex: 1;
      }
    }

    &:first-child {
      position: relative;

      p {
        @include sm-down {
          padding-right: 38px;
        }
      }
    }
  }

  &-infoSection {
    background: #4CAEE0;
    border-radius: 12px;
    margin-bottom: 12px;
    padding: 18px;
    mask-image: url('@/assets/images/tokenomics-mask.svg');
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 100% 100%;
    text-align: left;

    @include sm-down {
      margin-bottom: 8px;
      mask-image: unset;
      background: unset;
      border-radius: 0;
      padding: 12px;
    }
  }

  &-allocationList {
    margin-top: 12px;
  }

  &-allocationItem {
    margin: 8px 0;
    line-height: 1.4;
    color: $white;
    
    @include sm-down {
      font-size: 16px;
      margin: 6px 0;
    }
  }

  &-infoTitle {
    margin: 0 0 12px 0;
    color: $white;

    @include sm-down {
      font-size: 20px;
      margin-bottom: 0px;
    }
  }

  &-infoDescription {
    margin: 0;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    text-align: left;
    color: $white;
    
    @include sm-down {
      font-size: 18px;
    }
  }

  &-copyButton {
    position: absolute;
    right: 18px;
    top: 18px;

    @include sm-down {
      top: 0px;
      right: 0px;
    }
  }

  // TODO: move when component created
  .tooltip {
    position: absolute;
    background: #333;
    color: white;
    padding: 5px;
    border-radius: 5px;
    left: -9px;
    bottom: -20px;
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity .5s;
  }

  .fade-enter, .fade-leave-to {
    opacity: 0;
  }

  &-cloud {
    position: absolute;
    pointer-events: none;
    opacity: 0.5;
    z-index: 0;

    @include sm-down {
      display: none;
    }

    &--1 {
      top: 30vh;
      right: -18vw;
      width: 22vw;
      height: auto;
      animation: float 8s ease-in-out infinite;
    }

    &--2 {
      top: 70vh;
      right: 15vw;
      width: 8vw;
      height: auto;
      animation: float 12s ease-in-out infinite reverse;
    }

    &--3 {
      top: 50vh;
      left: -18vw;
      width: 28vw;
      height: auto;
      animation: float 10s ease-in-out infinite;
      animation-delay: -2s;
    }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) translateX(0px); }
    25% { transform: translateY(-10px) translateX(5px); }
    50% { transform: translateY(-5px) translateX(-5px); }
    75% { transform: translateY(-8px) translateX(3px); }
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
}
</style>