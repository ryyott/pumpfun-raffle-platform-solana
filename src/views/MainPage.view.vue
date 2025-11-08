<template>
  <div class="main-page">
    <SiteHeader />
    <div class="content">
      <HomeView />
      <RainPoolView />
      <AboutView />
      <TokenomicsView />
      <RoadmapView />
      <ContactView />
    </div>
  </div>
</template>

<script>
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import SiteHeader from '@/components/SiteHeader.vue';
import HomeView from '@/views/Home.view.vue';
import AboutView from '@/views/About.view.vue';
import RainPoolView from '@/views/RainPool.view.vue';
import TokenomicsView from '@/views/Tokenomics.view.vue';
import RoadmapView from '@/views/Roadmap.view.vue';
import ContactView from '@/views/Contact.view.vue';

gsap.registerPlugin(ScrollToPlugin);

export default {
  name: 'MainPage',
  components: {
    SiteHeader,
    HomeView,
    AboutView,
    RainPoolView,
    TokenomicsView,
    RoadmapView,
    ContactView
  },

  data() {
    return {
      isScrollingProgrammatically: false,
      isUpdatingFromScroll: false,
      scrollTimeout: null
    }
  },

  mounted() {
    // Scroll to section on initial page load
    this.scrollToSection();

    // Set up scroll spy to update URL based on scroll position
    window.addEventListener('scroll', this.handleScroll);
  },

  beforeUnmount() {
    // Clean up scroll listener
    window.removeEventListener('scroll', this.handleScroll);
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  },

  watch: {
    '$route'() {
      // Don't scroll if this route change was triggered by scroll spy
      if (this.isUpdatingFromScroll) {
        this.isUpdatingFromScroll = false;
        return;
      }

      // Scroll when route changes from clicking links
      this.scrollToSection();
    }
  },

  methods: {
    scrollToSection() {
      // Map route paths to section IDs
      const sectionMap = {
        '/': 'home',
        '/rainpool': 'rainpool',
        '/about': 'about',
        '/tokenomics': 'tokenomics',
        '/roadmap': 'roadmap',
        '/contact': 'contact'
      };

      const sectionId = sectionMap[this.$route.path];

      if (sectionId) {
        // Mark that we're scrolling programmatically
        this.isScrollingProgrammatically = true;

        // Use nextTick to ensure DOM is ready
        this.$nextTick(() => {
          const target = document.querySelector(`#${sectionId}`);

          if (target) {
            const scrollTo = target.offsetTop;

            gsap.to(window, {
              duration: 1.5,
              scrollTo: scrollTo,
              ease: 'power2.inOut',
              onComplete: () => {
                // Allow scroll spy to work again after animation completes
                setTimeout(() => {
                  this.isScrollingProgrammatically = false;
                }, 100);
              }
            });
          }
        });
      }
    },

    handleScroll() {
      // Don't update URL if we're scrolling programmatically from a route change
      if (this.isScrollingProgrammatically) {
        return;
      }

      // Debounce scroll events for better performance
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }

      this.scrollTimeout = setTimeout(() => {
        this.updateActiveSection();
      }, 100);
    },

    updateActiveSection() {
      // Get all sections
      const sections = [
        { id: 'home', path: '/' },
        { id: 'rainpool', path: '/rainpool' },
        { id: 'about', path: '/about' },
        { id: 'tokenomics', path: '/tokenomics' },
        { id: 'roadmap', path: '/roadmap' },
        { id: 'contact', path: '/contact' }
      ];

      // Get current scroll position (use a smaller offset for less sticky feeling)
      const scrollPosition = window.scrollY + 200; // Just 200px from top

      // Find which section is currently in view
      let activeSection = sections[0]; // Default to home

      for (const section of sections) {
        const element = document.querySelector(`#${section.id}`);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            activeSection = section;
            break;
          }
        }
      }

      // Update URL if it's different from current route
      if (this.$route.path !== activeSection.path) {
        // Mark that this URL update is from scrolling, not clicking
        this.isUpdatingFromScroll = true;
        this.$router.replace(activeSection.path);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.content {
  margin: 0;
  padding: 0;
  line-height: 0;
  background: #4CAEE0;
  
  > section {
    margin: 0 !important;
    padding: 0 !important;
    display: block;
    line-height: normal;
    width: 100vw;
    box-sizing: border-box;
  }
}
</style>