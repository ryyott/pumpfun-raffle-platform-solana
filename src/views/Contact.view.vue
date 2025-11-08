<template>
  <section class="ContactView Section" id="contact">
    <div class="ContactView-inner View">
      <div class="ContactView-content d-flex">
        <div class="ContactView-contact">
          <h1 class="ContactView-title">
            {{ $t('contact.title') }}
          </h1>
          <p class="ContactView-text text-lg">
            {{ $t('contact.paragraph') }}

            <a href="mailto:team@raindrop.fun" target="_blank">
              team@raindrop.fun
            </a>
          </p>
        </div>
      </div>
    </div>

    <!-- Animated raindrops -->
    <div class="ContactView-raindrops">
      <div class="ContactView-raindrop ContactView-raindrop--1"></div>
      <div class="ContactView-raindrop ContactView-raindrop--2"></div>
      <div class="ContactView-raindrop ContactView-raindrop--3"></div>
      <div class="ContactView-raindrop ContactView-raindrop--4"></div>
      <div class="ContactView-raindrop ContactView-raindrop--5"></div>
    </div>
  </section>
</template>

<script>
import ScrollAnimation from '@/mixins/ScrollAnimation.mixin';

export default {
  name: 'ContactView',

  mixins: [ScrollAnimation],

  components: {},

  mounted() {
    this.animateRaindrops();
  },

  methods: {
    animateRaindrops() {
      const TARGET_SEL = '.ContactView-raindrop';
      const TRIGGER_ELEMENT_SEL = "#contact";

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

.ContactView {
  background-image: url('@/assets/images/asfalt-light.png');
  background-color: #4CAEE0;
  background-repeat: repeat;
  position: relative;
  overflow: hidden;
    
  @include sm-down {
    background-position: 60vw 5vh, 50vw 10vh, 0vw 10vh, center, center;
  }

  &-inner {
    display: flex;
  }

  &-content {
    align-items: center;

    @include sm-down {
      flex-direction: column-reverse;
      justify-content: center;
      position: relative;
      gap: 40px;
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

  &-text {
    color: $white;

    @include sm-down {
      font-size: 18px;
    }

    a {
      color: $white;
    }
  }

  &-partners {
    text-align: right;
    
    .ContactView-title {
      justify-content: flex-end;
    }
  }

  &-partnersList {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 30px;
    flex-wrap: wrap;
  }

  &-partner {
    // min-width: 200px;
  }

  &-partnerImg {
    max-width: 100%;
    max-height: 50px;
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