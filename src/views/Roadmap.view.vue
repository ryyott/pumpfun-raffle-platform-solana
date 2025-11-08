<template>
  <section class="RoadmapView Section" id="roadmap">
    <div class="RoadmapView-inner View">
      <div class="RoadmapView-contentWrapper">
        <h1 class="RoadmapView-title">{{ $t('roadmap.title') }}</h1>
        <div class="RoadmapView-content">
          <article
            class="RoadmapView-info"
            v-for="phase, i in data"
            :key="i"
          >
            <h2 class="RoadmapView-infoTitle">{{ $t(`roadmap.phase.${i}.title`) }}</h2>
            <p
              class="RoadmapView-infoDescription text-xl"
              v-for="step, j in phase"
              :key="j"
            >
              {{ $t(`roadmap.phase.${i}.step.${step.step}`) }}
              <i class="check-icon" v-if="step.completed"></i>
            </p>
          </article>
        </div>
      </div>
    </div>
    
    <!-- Cloud SVGs -->
    <svg class="RoadmapView-cloud RoadmapView-cloud--1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 300" role="img" aria-label="Cartoon cloud">
      <defs>
        <radialGradient id="roadmapSheen1" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="1"/>
          <stop offset="80%" stop-color="#F1FAFF" stop-opacity="1"/>
          <stop offset="100%" stop-color="#E6F7FF" stop-opacity=".9"/>
        </radialGradient>
        <filter id="roadmapDrop1" x="-20%" y="-30%" width="140%" height="160%">
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
      <g filter="url(#roadmapDrop1)">
        <path fill="url(#roadmapSheen1)" stroke="#7ED3FF" stroke-width="10" stroke-linejoin="round"
          d="M147 206c-36 0-66-26-66-59 0-28 20-52 48-58 7-39 45-70 90-70 34 0 64 16 79 40 9-4 20-6 31-6 43 0 78 30 78 68 0 2 0 4-.2 6 34 6 60 32 60 63 0 36-32 65-72 65H147z"/>
        <ellipse cx="200" cy="90" rx="42" ry="28" fill="#FFFFFF" opacity=".85"/>
        <ellipse cx="260" cy="75" rx="55" ry="36" fill="#FFFFFF" opacity=".9"/>
        <ellipse cx="320" cy="95" rx="48" ry="30" fill="#FFFFFF" opacity=".9"/>
        <ellipse cx="380" cy="110" rx="60" ry="36" fill="#FFFFFF" opacity=".92"/>
        <ellipse cx="140" cy="125" rx="58" ry="38" fill="#FFFFFF" opacity=".92"/>
      </g>
    </svg>

    <svg class="RoadmapView-cloud RoadmapView-cloud--2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" aria-label="Cloud icon">
      <path fill="#FFFFFF" stroke="#7ED3FF" stroke-width="8" stroke-linejoin="round"
        d="M58 112c-22 0-40-16-40-35 0-17 12-31 29-34 4-23 26-39 52-39 20 0 38 9 47 22 5-2 12-3 18-3 26 0 46 18 46 40 0 1 0 2-.1 3 20 4 34 19 34 36 0 21-19 38-42 38H58z"/>
    </svg>

    <!-- Animated raindrops -->
    <div class="RoadmapView-raindrops">
      <div class="RoadmapView-raindrop RoadmapView-raindrop--1"></div>
      <div class="RoadmapView-raindrop RoadmapView-raindrop--2"></div>
      <div class="RoadmapView-raindrop RoadmapView-raindrop--3"></div>
      <div class="RoadmapView-raindrop RoadmapView-raindrop--4"></div>
      <div class="RoadmapView-raindrop RoadmapView-raindrop--5"></div>
    </div>

  </section>
</template>

<script>
import ScrollAnimation from '@/mixins/ScrollAnimation.mixin';

export default {
  name: "RoadmapView",

  mixins: [ScrollAnimation],

  data() {
    return {
      data: [
        [
          { step: 'launch', completed: false },
          { step: 'website', completed: false },
          { step: 'firstRain', completed: false },
          { step: 'community', completed: false },
          { step: 'transparency', completed: false }
        ],
        [
          { step: 'milestones', completed: false },
          { step: 'marketing', completed: false },
          { step: 'partnerships', completed: false },
          { step: 'leaderboard', completed: false },
          { step: 'content', completed: false }
        ],
        [
          { step: 'cex', completed: false },
          { step: 'tieredEntry', completed: false },
          { step: 'burnMechanics', completed: false },
          { step: 'features', completed: false },
          { step: 'governance', completed: false },
          { step: 'brand', completed: false }
        ],
      ]
    };
  },

  mounted() {
    this.animateBg();
    this.animateRaindrops();
  },

  methods: {
    animateBg() {
      const TARGET_SEL = '.RoadmapView';
      const TRIGGER_ELEMENT_SEL = "#roadmap";
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
          backgroundPositionY: '70vh, 20vh, 30vh, 20vh, center, center',
        },
      };

      this.timeline.to(TARGET_SEL, outroAnimationOptions);
    },

    animateRaindrops() {
      const TARGET_SEL = '.RoadmapView-raindrop';
      const TRIGGER_ELEMENT_SEL = "#roadmap";

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
    },
  }
};
</script>
  
<style lang="scss" scoped>
@import "@/styles/variables";
@import "@/styles/breakpoints";

.RoadmapView {
  background-image: url('@/assets/images/asfalt-light.png');
  background-color: #4CAEE0;
  background-repeat: repeat;
  position: relative;


  &-inner {
    display: flex;
  }
  
  &-contentWrapper {
    margin: auto;
    width: 100%;
  }
  
  &-content {
    justify-content: center;
    display: flex;
    flex-wrap: wrap;
    gap: 50px;

    @include sm-down {
      flex-direction: column;
      gap: 8px;
    }
  }

  &-title {
    color: $white;
    text-align: center;

    @include sm-down {
      text-align: left;
    }
  }

  &-info {
    background-color: #4CAEE0;
    border-radius: 12px;
    margin-bottom: 12px;
    padding: 18px;
    mask-image: url('@/assets/images/tokenomics-mask.svg');
    mask-position: center;
    mask-repeat: no-repeat;
    mask-size: 100% 100%;
    flex: 1;
  }

  &-infoTitle {
    font-size: 20px;
    color: $white;

    @include sm-down {
      margin: 0 0 8px;
    }
  }

  &-infoDescription {
    font-size: 18px;
    color: $white;
    
    @include sm-down {
      margin: 0;
    }
  }

  .check-icon::before {
    content: "\2713";
    color: green;
  }

  &-cloud {
    position: absolute;
    pointer-events: none;
    opacity: 0.4;
    z-index: 0;

    @include sm-down {
      display: none;
    }

    &--1 {
      top: 25vh;
      right: -12vw;
      width: 18vw;
      height: auto;
      animation: float 8s ease-in-out infinite;
    }

    &--2 {
      top: 65vh;
      left: -10vw;
      width: 15vw;
      height: auto;
      animation: float 12s ease-in-out infinite reverse;
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