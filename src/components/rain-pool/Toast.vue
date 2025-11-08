<template>
  <Teleport to="body">
    <div class="Toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in store.toasts"
          :key="toast.id"
          class="Toast"
          :class="`Toast--${toast.type}`"
        >
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useRainPoolStore } from '@/stores/rainPool'

const store = useRainPoolStore()
</script>

<style scoped lang="scss">
.Toast-container {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.Toast {
  position: relative;
  background: rgba(20, 20, 40, 0.98);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 2px solid;
  font-weight: 600;
  min-width: 300px;
  text-align: center;
  pointer-events: auto;

  // Glass border effect for all toasts
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);

  // Glass highlight effect
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    border-radius: 10px 10px 0 0;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.15) 0%,
      rgba(255, 255, 255, 0) 100%
    );
    pointer-events: none;
  }

  &--success {
    border-color: rgba(76, 224, 174, 0.6);
    background: linear-gradient(135deg, rgba(76, 224, 174, 0.15) 0%, rgba(76, 224, 174, 0.25) 100%);
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  }

  &--error {
    border-color: rgba(224, 76, 76, 0.6);
    background: linear-gradient(135deg, rgba(224, 76, 76, 0.15) 0%, rgba(224, 76, 76, 0.25) 100%);
    box-shadow:
      0 8px 24px rgba(224, 76, 76, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  }

  &--info {
    border-color: rgba(76, 174, 224, 0.6);
    background: linear-gradient(135deg, rgba(76, 174, 224, 0.15) 0%, rgba(76, 174, 224, 0.25) 100%);
    box-shadow:
      0 8px 24px rgba(76, 174, 224, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  }

  &--warning {
    border-color: rgba(255, 165, 0, 0.6);
    background: linear-gradient(135deg, rgba(255, 165, 0, 0.15) 0%, rgba(255, 165, 0, 0.25) 100%);
    box-shadow:
      0 8px 24px rgba(255, 165, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  }

  &--stats {
    position: relative;
    border: 2px solid rgba(176, 216, 237, 0.5);
    background: linear-gradient(135deg, rgba(76, 174, 224, 0.25) 0%, rgba(157, 196, 223, 0.3) 100%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    font-size: 15px;
    padding: 0.875rem 1.25rem;
    box-shadow:
      0 8px 24px rgba(76, 174, 224, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(0, 0, 0, 0.1);

    // Glass highlight effect
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      border-radius: 10px 10px 0 0;
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.15) 0%,
        rgba(255, 255, 255, 0) 100%
      );
      pointer-events: none;
    }
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
