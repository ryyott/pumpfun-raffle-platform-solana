<template>
  <div 
    class="SkeletonLoader"
    :class="`SkeletonLoader--${variant}`"
    :style="{ width: width, height: height }"
  ></div>
</template>

<script>
export default {
  name: 'SkeletonLoader',
  props: {
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '20px'
    },
    variant: {
      type: String,
      default: 'text',
      validator: (value) => {
        return ['text', 'address', 'balance', 'button'].includes(value);
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables';

.SkeletonLoader {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1) 25%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.1) 75%
  );
  background-size: 200% 100%;
  border-radius: 6px;
  animation: shimmer 1.5s infinite;
  
  &--text {
    height: 20px;
    border-radius: 4px;
  }
  
  &--address {
    height: 24px;
    border-radius: 6px;
    font-family: monospace;
  }
  
  &--balance {
    height: 28px;
    border-radius: 8px;
  }
  
  &--button {
    height: 40px;
    border-radius: 12px;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>