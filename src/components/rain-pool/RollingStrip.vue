<template>
  <div class="RollingStrip">
    <div class="RollingStrip-container">
      <div
        ref="stripRef"
        class="RollingStrip-strip"
        :class="{ 'RollingStrip-strip--rolling': store.isRolling }"
      >
        <ParticipantSegment
          v-for="segment in displaySegments"
          :key="segment.id"
          :segment="segment"
          @click="handleSegmentClick(segment)"
        />
      </div>

      <!-- Winner Indicator -->
      <div class="RollingStrip-indicator"></div>
    </div>

    <!-- User Stats Modal -->
    <UserStatsModal
      :show="showUserStats"
      :participant="selectedParticipant"
      @close="showUserStats = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRainPoolStore } from '@/stores/rainPool'
import { useRolling } from '@/composables/rain-pool/useRolling'
import ParticipantSegment from './ParticipantSegment.vue'
import UserStatsModal from './UserStatsModal.vue'

const store = useRainPoolStore()
const { stripRef, createProportionalSegments, rollToWinner, resetStripPosition } = useRolling()

// User stats modal
const showUserStats = ref(false)
const selectedParticipant = ref(null)

// Expose methods to parent
defineExpose({
  rollToWinner,
  resetStripPosition,
})

const displaySegments = computed(() => {
  if (store.participants.length === 0) return []

  const segments = createProportionalSegments()

  // Create multiple copies for smooth continuous looping
  const copies = []
  const numberOfCopies = Math.max(20, segments.length * 8)

  for (let i = 0; i < numberOfCopies; i++) {
    segments.forEach((segment, index) => {
      copies.push({
        ...segment,
        id: `${segment.participant.id}-copy${i}-seg${index}`,
        copyIndex: i,
      })
    })
  }

  return copies
})

function handleSegmentClick(segment) {
  if (!segment.participant?.address || store.isRolling) return

  // Show user stats modal
  selectedParticipant.value = segment.participant
  showUserStats.value = true
}

onMounted(() => {
  console.log('RollingStrip mounted')
})
</script>

<style scoped lang="scss">
.RollingStrip {
  position: relative;
  width: 100%;
  overflow: hidden;
  margin: 1.5rem 0;

  &-container {
    position: relative;
    width: 100%;
    height: 64px;
    overflow: hidden;
    background: rgba(157, 196, 223, 0.3);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border-radius: 12px;
    border: 2px solid rgba(176, 216, 237, 0.4);
  }

  &-strip {
    display: flex;
    align-items: center;
    height: 100%;
    gap: 6px;
    padding: 0 10px;
    will-change: transform;
    transition: none;
  }

  &-indicator {
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
    transform: translateX(-50%);
    z-index: 10;
    pointer-events: none;

    &::before,
    &::after {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
    }

    &::before {
      top: -10px;
      border-bottom: 10px solid #FFD700;
    }

    &::after {
      bottom: -10px;
      border-top: 10px solid #FFA500;
    }
  }
}
</style>
