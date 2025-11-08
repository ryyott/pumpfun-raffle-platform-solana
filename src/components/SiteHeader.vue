<template>
  <header class="SiteHeader">
    <div class="SiteHeader-inner">
      <h1 class="SiteHeader-title">
        <router-link class="SiteHeader-titleLink" to="/">
          <FlippingCoin />
          <span class="sr-only">{{ $t('header.title') }}</span>
        </router-link>
      </h1>

      <nav aria-label="Main" class="SiteHeader-nav">
        <ActionButton
          class="SiteHeader-cta"
          variant="secondary"
          size="lg"
          @click="openLink('https://pump.fun')"
        >
          {{ $t('header.buy') }}
          <img src="@/assets/images/Pump_fun_logo.png" class="SiteHeader-pumpIcon" alt="Pump.fun" />
        </ActionButton>
        <template v-if="!helpers.isMobile()">
          <router-link to="/rainpool">{{ $t('header.rainpool') }}</router-link>
          <router-link to="/about">{{ $t('header.about') }}</router-link>
          <router-link to="/tokenomics">{{ $t('header.tokenomics') }}</router-link>
          <router-link to="/roadmap">{{ $t('header.roadmap') }}</router-link>
          <router-link to="/docs" class="SiteHeader-docsLink">Docs</router-link>
          <router-link to="/contact">{{ $t('header.contact') }}</router-link>
        </template>
        
        <button class="SiteHeader-hamburger" @click="toggleNav">
          <svg v-if="!isNavOpen" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 6H21" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
            <path d="M3 18H21" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
            <path d="M6 6L18 18" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </nav>
    </div>
    <div class="SiteHeader-hamburgerNav" v-if="isNavOpen">
      <nav class="SiteHeader-mobileNav">
        <router-link to="/rainpool" @click="toggleNav">{{ $t('header.rainpool') }}</router-link>
        <router-link to="/about" @click="toggleNav">{{ $t('header.about') }}</router-link>
        <router-link to="/tokenomics" @click="toggleNav">{{ $t('header.tokenomics') }}</router-link>
        <router-link to="/roadmap" @click="toggleNav">{{ $t('header.roadmap') }}</router-link>
        <router-link to="/docs" @click="toggleNav">Docs</router-link>
        <router-link to="/contact" @click="toggleNav">{{ $t('header.contact') }}</router-link>
      </nav>
    </div>
  </header>
</template>

<script>
import ScrollAnimation from '@/mixins/ScrollAnimation.mixin';
import ActionButton from '@/components/ActionButton.vue';
import FlippingCoin from '@/components/FlippingCoin.vue';

export default {
  name: 'SiteHeader',

  mixins: [ScrollAnimation],

  components: {
    ActionButton,
    FlippingCoin
  },
  
  data() {
    return {
      isNavOpen: false,
    }
  },

  mounted() {
    this.animateLogo();
    this.animateBgColor();
    this.animateTextColor();
    this.animateBuyButton();
    this.helpers.isMobile() && this.animateHamburger();
  },
  
  methods: {
    openLink(url) {
      window.open(url, '_blank');
    },
    
    toggleNav() {
      this.isNavOpen = !this.isNavOpen;
    },

    animateLogo() {
      const TARGET_SEL = '.SiteHeader-titleLink';
      const TRIGGER_ELEMENT_SEL = '.HomeView-title';
      const outroAnimationOptions = {
        runInMobile: false,
        gsapOptions: {
          scrollTrigger: {
            trigger: TRIGGER_ELEMENT_SEL,
            scrub: true,
            start: 'top top',
            end: 'bottom top',
          },
          // x: -this.helpers.vw(25),
          scale: 0
        },
      };

      this.timeline.from(TARGET_SEL, outroAnimationOptions);
    },
    
    animateBgColor() {
      const TARGET_SEL = '.SiteHeader';
      
      // Animation for Rain Pool section
      const rainPoolAnimationOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#rainpool',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          backgroundColor: '#4CAEE0',
        },
      };

      // Animation for About section
      const aboutAnimationOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#about',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          backgroundColor: '#4CAEE0',
        },
      };

      // Animation for Tokenomics section
      const tokenomicsAnimationOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#tokenomics',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          backgroundColor: '#4CAEE0',
        },
      };

      // Animation for Roadmap section
      const roadmapAnimationOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#roadmap',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          backgroundColor: '#4CAEE0',
        },
      };

      // Animation for Contact section
      const contactAnimationOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#contact',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          backgroundColor: '#4CAEE0',
        },
      };

      this.timeline.to(TARGET_SEL, rainPoolAnimationOptions);
      this.timeline.to(TARGET_SEL, aboutAnimationOptions);
      this.timeline.to(TARGET_SEL, tokenomicsAnimationOptions);
      this.timeline.to(TARGET_SEL, roadmapAnimationOptions);
      this.timeline.to(TARGET_SEL, contactAnimationOptions);
    },

    animateTextColor() {
      const TARGET_SEL = '.SiteHeader-nav a';
      
      // Text color for Rain Pool section
      const rainPoolTextOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#rainpool',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          color: '#ffffff',
        },
      };

      // Text color for About section
      const aboutTextOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#about',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          color: '#ffffff',
        },
      };

      // Text color for Tokenomics section
      const tokenomicsTextOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#tokenomics',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          color: '#ffffff',
        },
      };

      // Text color for Roadmap section
      const roadmapTextOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#roadmap',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          color: '#ffffff',
        },
      };

      // Text color for Contact section
      const contactTextOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#contact',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          color: '#ffffff',
        },
      };

      this.timeline.to(TARGET_SEL, rainPoolTextOptions);
      this.timeline.to(TARGET_SEL, aboutTextOptions);
      this.timeline.to(TARGET_SEL, tokenomicsTextOptions);
      this.timeline.to(TARGET_SEL, roadmapTextOptions);
      this.timeline.to(TARGET_SEL, contactTextOptions);
    },

    animateHamburger() {
      const TARGET_SEL = '.SiteHeader-hamburger';
      
      // Hamburger color for Rain Pool section
      const rainPoolHamburgerOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#rainpool',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          backgroundColor: '#000000',
        },
      };

      // Hamburger color for About section
      const aboutHamburgerOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#about',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          backgroundColor: '#000000',
        },
      };

      // Hamburger color for Tokenomics section
      const tokenomicsHamburgerOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#tokenomics',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          backgroundColor: '#000000',
        },
      };

      // Hamburger color for Roadmap section
      const roadmapHamburgerOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#roadmap',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          backgroundColor: '#000000',
        },
      };

      // Hamburger color for Contact section
      const contactHamburgerOptions = {
        runInMobile: true,
        gsapOptions: {
          scrollTrigger: {
            trigger: '#contact',
            scrub: true,
            start: 'top 75%',
            end: 'top top',
          },
          backgroundColor: '#000000',
        },
      };

      this.timeline.to(TARGET_SEL, rainPoolHamburgerOptions);
      this.timeline.to(TARGET_SEL, aboutHamburgerOptions);
      this.timeline.to(TARGET_SEL, tokenomicsHamburgerOptions);
      this.timeline.to(TARGET_SEL, roadmapHamburgerOptions);
      this.timeline.to(TARGET_SEL, contactHamburgerOptions);
    },

    animateBuyButton() {
      const TARGET_SEL = '.SiteHeader-cta';
      const TRIGGER_ELEMENT_SEL = '.HomeView-actions';

      const outroAnimationOptions = {
        runInMobile: false,
        gsapOptions: {
          scrollTrigger: {
            trigger: TRIGGER_ELEMENT_SEL,
            scrub: true,
            start: 'top top',
            end: 'bottom -200px',
          },
          scale: 0,
        },
      };

      this.timeline.from(TARGET_SEL, outroAnimationOptions);
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/variables';
@import '@/styles/breakpoints';

.SiteHeader {
  left: 0;
  position: fixed; 
  top: 0;
  width: 100%;
  z-index: 100;

  @include sm-down {
    padding-block: 5px;
  }
  
  &-inner {
    max-width: 100%;
    margin: 0 auto;
    padding-inline: 60px;
    align-items: center;
    display: flex;
    justify-content: space-between;

    @include sm-down {
      padding-inline: 20px;
      gap: 8px;
    }
  }

  &-title {
    margin: 0;
    display: flex;
  }

  &-titleLink {
    display: block;
    height: 70px;
    width: 70px;
    position: relative;

    @include sm-down {
      height: 50px;
      width: 50px;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  }

  // Override FlippingCoin styles when inside header
  .SiteHeader-title {
    .FlippingCoin {
      width: 70px;
      height: 70px;

      @include sm-down {
        width: 50px;
        height: 50px;
      }

      #main {
        width: 70px !important;
        height: 70px !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;

        @include sm-down {
          width: 50px !important;
          height: 50px !important;
        }
      }

      .coin {
        width: 100% !important;
        height: 100% !important;
      }

      #child:after {
        display: none;
      }
    }
  }

  &-nav {
    align-items: center;
    display: flex;
    gap: 12px;
    
    @include sm-down {
      gap: 8px;
    }

    a, .SiteHeader-docsLink {
      font-family: 'Krabby Patty', sans-serif;
      font-size: 22px;
      text-decoration: none;
      text-transform: uppercase;
      color: $white;

      @include sm-down {
        display: none;
      }
    }
  }

  &-cta {
    @include sm-down {
      font-size: 18px;
      gap: 10px;
      padding: 8px 16px;
    }

    .SvgIcon {
      width: 36px;
      height: 36px;
      margin: -6px;
    }
  }

  &-pumpIcon {
    width: 36px;
    height: 36px;
    margin: -6px;
  }

  &-hamburger {
    display: none;
    padding: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    width: 44px;
    height: 44px;
    cursor: pointer;
    position: relative;
    z-index: 101;
    transition: all 0.2s ease;

    @include sm-down {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    svg {
      width: 24px;
      height: 24px;
      stroke: $white;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &-hamburgerNav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    height: 100vh;
    background-color: #4CAEE0;
    padding-top: 30px;
  }

  &-mobileNav {
    padding: 80px 20px 20px;
    display: flex;
    flex-direction: column;

    a {
      font-family: 'Krabby Patty', sans-serif;
      font-size: 30px;
      text-decoration: none;
      text-transform: uppercase;
      color: $white;
      padding: 8px 0;
    }
  }
}
</style>