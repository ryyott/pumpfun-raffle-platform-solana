<template>
  <Transition name="banner">
    <div v-if="isVisible" class="StickyBanner">
      <div class="StickyBanner-container">
        <p class="StickyBanner-text">
          <slot>
            <span class="StickyBanner-highlight">⚠️ Warning:</span>
            The token has not launched. Do not buy copies. Join our <a href="https://x.com/raindr0p_fun" target="_blank" rel="noopener noreferrer">Twitter community</a> to be informed when we go live.
          </slot>
        </p>
      </div>
    </div>
  </Transition>
</template>

<script>
export default {
  name: 'StickyBanner',

  props: {
    persistent: {
      type: Boolean,
      default: false,
    },
    storageKey: {
      type: String,
      default: 'stickyBannerDismissed'
    }
  },

  data() {
    return {
      isVisible: false,
    }
  },

  mounted() {
    // Delay to trigger entrance animation
    setTimeout(() => {
      this.isVisible = true;
    }, 500);
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables';
@import '@/styles/breakpoints';

.StickyBanner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: linear-gradient(90deg, #4CAEE0 0%, #357ABD 100%);
  color: white;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);

  &-container {
    max-width: 100%;
    margin: 0 auto;
    padding: 12px 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    position: relative;

    @include sm-down {
      padding: 12px 20px;
      gap: 12px;
    }
  }

  &-text {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    text-align: center;

    @include sm-down {
      font-size: 14px;
    }

    a {
      color: white;
      font-weight: 700;
      text-decoration: underline;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  &-highlight {
    font-weight: 700;
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 4px;
    margin-right: 8px;
  }
}

// Vue transition animations
.banner-enter-active {
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.banner-leave-active {
  animation: slideDown 0.3s cubic-bezier(0.5, 0, 0.75, 0);
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(100%);
    opacity: 0;
  }
}
</style>
