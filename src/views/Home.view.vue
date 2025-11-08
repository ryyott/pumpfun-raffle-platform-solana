<template>
  <section class="HomeView Section" id="home">
    <div class="HomeView-overlay"></div>
    <div class="HomeView-inner View">
      <div class="HomeView-content d-flex">
        <div class="HomeView-contentCol my-auto">
          <h1 class="HomeView-title">
            <span>
              <img class="HomeView-titleImg" alt="Raindrop $DROP" src="@/assets/images/raindrop.png"/>
            </span>
            <span>
              <img class="HomeView-mainImgMobile" alt="Raindrop $DROP" src="@/assets/images/raindr0p-standing.png"/>
            </span>
          </h1>
          <p class="HomeView-description text-xl">
            {{ $t('home.description') }}
          </p>

          <div class="HomeView-actions">
            <ActionButton
              size="xl"
              class="HomeView-cta"
              variant="success"
              @click="openLink('https://pump.fun')"
            >
              {{ $t('home.actions.buy') }}
              <img src="@/assets/images/Pump_fun_logo.png" class="HomeView-pumpIcon" alt="Pump.fun" />
            </ActionButton>

            <ActionButton
              size="xl"
              :title="$t('home.actions.x')"
              variant="secondary"
              @click="openLink('https://x.com/raindr0p_fun')"
              >
              <SvgIcon name="x" size="xl" />
            </ActionButton>
          </div>

          <!-- Burn Statistics -->
          <BurnStats />
        </div>
        <div class="HomeView-contentCol d-flex">
          <img class="HomeView-mainImg" alt="Raindrop $DROP" src="@/assets/images/raindr0p-standing.png"/>
        </div>
      </div>
    </div>

    <!-- Animated raindrops -->
    <div class="HomeView-raindrops">
      <div class="HomeView-raindrop HomeView-raindrop--1"></div>
      <div class="HomeView-raindrop HomeView-raindrop--2"></div>
      <div class="HomeView-raindrop HomeView-raindrop--3"></div>
      <div class="HomeView-raindrop HomeView-raindrop--4"></div>
      <div class="HomeView-raindrop HomeView-raindrop--5"></div>
    </div>
  </section>
</template>
<script>
import ActionButton from '@/components/ActionButton.vue';
import SvgIcon from '@/components/SvgIcon.vue';
import BurnStats from '@/components/BurnStats.vue';
import ScrollAnimation from '@/mixins/ScrollAnimation.mixin';

export default {
  name: 'HomeView',

  mixins: [ScrollAnimation],

  components: {
    ActionButton,
    SvgIcon,
    BurnStats
  },
  
  data() {
    return {
      scrollHandler: null
    }
  },

  mounted() {
    this.animateMain();
    this.setupScrollAnimation();
    this.animateRaindrops();
  },

  beforeUnmount() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
  },
  
  methods: {
    openLink(url) {
      window.open(url, '_blank');
    },
    animateMain() {
      const TARGET_SEL = '.HomeView-mainImg';
      const TRIGGER_ELEMENT_SEL = "#about";
      const outroAnimationOptions = {
        runInMobile: false,
        gsapOptions: {
          scrollTrigger: {
            trigger: TRIGGER_ELEMENT_SEL,
            scrub: true,
            start: "top bottom",
            end: "top top",
          },
          x: this.helpers.vh(5),
        },
      };

      this.timeline.to(TARGET_SEL, outroAnimationOptions);
    },

    setupScrollAnimation() {
      const rainDropImg = document.querySelector('.HomeView-mainImg');
      
      if (!rainDropImg) return;

      this.scrollHandler = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Calculate movement based on scroll position
        // Move right as we scroll down, with a maximum movement
        const maxScroll = window.innerHeight * 1.5; // Adjust based on when you want max movement
        const scrollProgress = Math.min(scrollTop / maxScroll, 1);
        const translateX = scrollProgress * 80; // Maximum 80px movement to the right
        
        rainDropImg.style.transform = `translateX(${translateX}px)`;
      };

      window.addEventListener('scroll', this.scrollHandler);
    },

    animateRaindrops() {
      const TARGET_SEL = '.HomeView-raindrop';
      const TRIGGER_ELEMENT_SEL = "#home";

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
@import '@/styles/animations';
@import '@/styles/breakpoints';

.HomeView {
  background-image: url('@/assets/images/asfalt-light.png');
  background-color: #4CAEE0;
  background-repeat: repeat;
  overflow: hidden;
  position: relative;

  &-overlay {
    background-color: rgba(105, 196, 242, 0.3);
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;

    animation-name: dark;
    animation-duration: 3.5s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
  }

  &-inner {
    display: flex;
    position: relative;
    z-index: 1;
  }

  &-content {
    margin: 20vh 0 auto 0;
    gap: 5vw;
    width: 100%;

    @include sm-down {
      flex-direction: column-reverse;
      margin: 10vh 0 auto 0;
    }
  }

  &-contentCol {
    width: 50%;

    @include sm-down {
      width: 100%;
    }

    &:first-child {
      position: relative;
      z-index: 2;
    }

    &:last-child {
      @include sm-down {
        display: none;
      }
    }
  }

  &-title {
    margin: 0 0 20px 0;

    @include sm-down {
      display: flex;
      gap: 28px;
      justify-content: space-between;
      margin: 0 0 15px 0;
    }
  }

  &-titleImg {
    max-width: 100%;
    max-height: 280px;

    @include sm-down {
      max-height: 180px;
    }
  }


  &-description {
    color: $white;
  }

  &-info {
    display: flex;
    gap: 18px;
    margin-bottom: 24px;
  }

  &-mainImg {
    width: 80%;
    max-width: 500px;
    margin-block: auto;
    margin-left: auto;
    pointer-events: none;
  }

  &-mainImgMobile {
    display: none;
    max-width: 300px;
    width: 100%;
    
    @include sm-down {
      display: block;
    }
  }

  &-misc {
    filter: brightness(50%) blur(3px);
    position: absolute;
    bottom: -15vh;
    z-index: 0;
    max-width: 500px;
    width: 25vw;
    pointer-events: none;

    @include sm-down {
      display: none;
    }

    &--1 {
      left: 20px;
    }

    &--2 {
      left: 30%;
      bottom: -5vh;
      max-width: 250px;
    }

    &--3 {
      right: 20px;
      z-index: 2;
    }

  }

  &-actions {
    display: flex;
    gap: 18px;
    
    @include sm-down {
      flex-wrap: wrap;
    }
  }

  &-cta {
    @include sm-down {
      justify-content: center;
      text-align: center;
      width: 100%;
    }

    .SvgIcon {
      width: 40px;
      height: 40px;
      margin: -8px;
    }
  }

  &-pumpIcon {
    width: 40px;
    height: 40px;
    margin: -8px;
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
