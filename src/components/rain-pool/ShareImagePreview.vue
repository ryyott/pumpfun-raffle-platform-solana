<template>
  <Teleport to="body">
    <div v-if="show" class="ShareImagePreview" @click="close">
      <div class="ShareImagePreview-content" @click.stop>
        <button class="ShareImagePreview-closeBtn" @click="close">×</button>

        <div class="ShareImagePreview-imageContainer">
          <img v-if="imageUrl" :src="imageUrl" alt="Winner Share Image" class="ShareImagePreview-image" />
        </div>

        <div class="ShareImagePreview-actions">
          <button @click="shareToX" class="ShareImagePreview-actionBtn ShareImagePreview-actionBtn--share">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
            </svg>
            Share to X
          </button>
          <button @click="downloadImage" class="ShareImagePreview-actionBtn ShareImagePreview-actionBtn--download">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z" fill="currentColor"/>
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { watch } from 'vue'

const props = defineProps({
  show: Boolean,
  imageUrl: String,
  tweetText: String
})

const emit = defineEmits(['close', 'download', 'share'])

function close() {
  emit('close')
}

function downloadImage() {
  emit('download')
}

function shareToX() {
  emit('share')
}

// Prevent body scroll when modal is open
watch(() => props.show, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped lang="scss">
.ShareImagePreview {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10003;
  padding: 1rem;
  animation: fadeIn 0.2s ease;

  &-content {
    position: relative;
    max-width: 1200px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &-closeBtn {
    position: absolute;
    top: -60px;
    right: 10px;
    background: rgba(255, 255, 255, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.4);
    color: white;
    font-size: 2rem;
    font-weight: 300;
    line-height: 1;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 10;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.6);
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &-imageContainer {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  &-image {
    width: 100%;
    height: auto;
    display: block;
  }

  &-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;

    @media (max-width: 600px) {
      flex-direction: column;
    }
  }

  &-actionBtn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    min-width: 200px;

    svg {
      flex-shrink: 0;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    &--share {
      background: linear-gradient(135deg, #1DA1F2 0%, #0D8BD9 100%);
      color: white;

      &:hover {
        background: linear-gradient(135deg, #0D8BD9 0%, #1DA1F2 100%);
      }
    }

    &--download {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.5);
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
