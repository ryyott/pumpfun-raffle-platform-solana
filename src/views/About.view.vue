<template>
  <section class="AboutView Section" id="about">
    <div class="AboutView-inner View">
      <div class="AboutView-content d-flex">
        <FlippingCoin class="AboutView-coin"/>
        <div class="AboutView-about">
          <h1 class="AboutView-title">
            About
            <FlippingCoin class="AboutView-coinMobile"/>
          </h1>
          <p class="AboutView-text text-lg">{{ $t('about.paragraph1') }}</p>
          <p class="AboutView-text text-lg">{{ $t('about.paragraph2') }}</p>
        </div>
      </div>
      
    </div>
    
    <!-- Cloud SVGs -->
    <svg class="AboutView-cloud AboutView-cloud--1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 300" role="img" aria-label="Cartoon cloud">
      <defs>
        <radialGradient id="aboutSheen1" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1"/>
          <stop offset="80%" stop-color="#F1FAFF" stop-opacity="1"/>
          <stop offset="100%" stop-color="#E6F7FF" stop-opacity=".9"/>
        </radialGradient>
        <filter id="aboutDrop1" x="-20%" y="-30%" width="140%" height="160%">
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
      <g filter="url(#aboutDrop1)">
        <path fill="url(#aboutSheen1)" stroke="#7ED3FF" stroke-width="10" stroke-linejoin="round"
          d="M147 206c-36 0-66-26-66-59 0-28 20-52 48-58 7-39 45-70 90-70 34 0 64 16 79 40 9-4 20-6 31-6 43 0 78 30 78 68 0 2 0 4-.2 6 34 6 60 32 60 63 0 36-32 65-72 65H147z"/>
        <ellipse cx="200" cy="90" rx="42" ry="28" fill="#FFFFFF" opacity=".85"/>
        <ellipse cx="260" cy="75" rx="55" ry="36" fill="#FFFFFF" opacity=".9"/>
        <ellipse cx="320" cy="95" rx="48" ry="30" fill="#FFFFFF" opacity=".9"/>
        <ellipse cx="380" cy="110" rx="60" ry="36" fill="#FFFFFF" opacity=".92"/>
        <ellipse cx="140" cy="125" rx="58" ry="38" fill="#FFFFFF" opacity=".92"/>
      </g>
    </svg>

    <svg class="AboutView-cloud AboutView-cloud--2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" aria-label="Cloud icon">
      <path fill="#FFFFFF" stroke="#7ED3FF" stroke-width="8" stroke-linejoin="round"
        d="M58 112c-22 0-40-16-40-35 0-17 12-31 29-34 4-23 26-39 52-39 20 0 38 9 47 22 5-2 12-3 18-3 26 0 46 18 46 40 0 1 0 2-.1 3 20 4 34 19 34 36 0 21-19 38-42 38H58z"/>
    </svg>

    <svg class="AboutView-cloud AboutView-cloud--3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 300" role="img" aria-label="Cartoon cloud">
      <defs>
        <radialGradient id="aboutSheen3" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1"/>
          <stop offset="80%" stop-color="#F1FAFF" stop-opacity="1"/>
          <stop offset="100%" stop-color="#E6F7FF" stop-opacity=".9"/>
        </radialGradient>
        <filter id="aboutDrop3" x="-20%" y="-30%" width="140%" height="160%">
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
      <g filter="url(#aboutDrop3)">
        <path fill="url(#aboutSheen3)" stroke="#7ED3FF" stroke-width="10" stroke-linejoin="round"
          d="M147 206c-36 0-66-26-66-59 0-28 20-52 48-58 7-39 45-70 90-70 34 0 64 16 79 40 9-4 20-6 31-6 43 0 78 30 78 68 0 2 0 4-.2 6 34 6 60 32 60 63 0 36-32 65-72 65H147z"/>
        <ellipse cx="200" cy="90" rx="42" ry="28" fill="#FFFFFF" opacity=".85"/>
        <ellipse cx="260" cy="75" rx="55" ry="36" fill="#FFFFFF" opacity=".9"/>
        <ellipse cx="320" cy="95" rx="48" ry="30" fill="#FFFFFF" opacity=".9"/>
        <ellipse cx="380" cy="110" rx="60" ry="36" fill="#FFFFFF" opacity=".92"/>
        <ellipse cx="140" cy="125" rx="58" ry="38" fill="#FFFFFF" opacity=".92"/>
      </g>
    </svg>

    <!-- Animated raindrops -->
    <div class="AboutView-raindrops">
      <div class="AboutView-raindrop AboutView-raindrop--1"></div>
      <div class="AboutView-raindrop AboutView-raindrop--2"></div>
      <div class="AboutView-raindrop AboutView-raindrop--3"></div>
      <div class="AboutView-raindrop AboutView-raindrop--4"></div>
      <div class="AboutView-raindrop AboutView-raindrop--5"></div>
    </div>
  </section>
</template>

<script>
import FlippingCoin from '@/components/FlippingCoin.vue';
import ScrollAnimation from '@/mixins/ScrollAnimation.mixin';

export default {
  name: 'AboutView',

  mixins: [ScrollAnimation],

  components: {
    FlippingCoin
  },
  
  mounted() {
    this.animateBg();
    this.animateRaindrops();
  },
  
  methods: {
    animateBg() {
      const TARGET_SEL = '.AboutView';
      const TRIGGER_ELEMENT_SEL = "#about";
      const outroAnimationOptions = {
        runInMobile: false,
        gsapOptions: {
          scrollTrigger: {
            trigger: TRIGGER_ELEMENT_SEL,
            scrub: true,
            start: "top bottom",
            end: "bottom top",
          },
          backgroundPositionY: '20vh, 15vh, 15vh, center, center',
        },
      };

      this.timeline.to(TARGET_SEL, outroAnimationOptions);
    },

    animateRaindrops() {
      const TARGET_SEL = '.AboutView-raindrop';
      const TRIGGER_ELEMENT_SEL = "#about";

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

<style lang="scss" scoped>
@import '@/styles/variables';
@import '@/styles/breakpoints';

.AboutView {
  background-image: url('@/assets/images/asfalt-light.png');
  background-color: #4CAEE0;
  background-repeat: repeat;
  position: relative;

  &-inner {
    display: flex;
  }

  &-content {
    align-items: center;

    @include sm-down {
      flex-direction: column;
      justify-content: center;
      position: relative;
    }

    div {
      flex: 1;

      @include sm-down {
        flex: unset;
      }
    }
  }

  &-title {
    align-items: center;
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-end;
    gap: 24px;
    color: $white;
  }

  &-coin {
    @include sm-down {
      display: none;
    }
  }

  &-coinMobile {
    display: none;

    @include sm-down {
      display: block;
    }
  }

  &-text {
    color: $white;
    
    @include sm-down {
      font-size: 18px;
    }
  }

  &-cloud {
    position: absolute;
    pointer-events: none;
    opacity: 0.6;
    z-index: 0;

    @include sm-down {
      display: none;
    }

    &--1 {
      top: 20vh;
      right: -15vw;
      width: 20vw;
      height: auto;
      animation: float 8s ease-in-out infinite;
    }

    &--2 {
      top: 60vh;
      right: 10vw;
      width: 8vw;
      height: auto;
      animation: float 12s ease-in-out infinite reverse;
    }

    &--3 {
      top: 40vh;
      left: -15vw;
      width: 25vw;
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