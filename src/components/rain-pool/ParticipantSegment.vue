<template>
  <div
    class="ParticipantSegment"
    :class="{
      'ParticipantSegment--winner': segment.participant?.isWinner,
      'ParticipantSegment--special': segment.participant?.isSpecial,
      'ParticipantSegment--interactive': segment.participant?.address,
    }"
    :style="{ width: segment.width + 'px' }"
    @click="$emit('click', segment)"
  >
    <div class="ParticipantSegment-content">
      <img
        v-if="segment.participant?.avatar"
        :src="segment.participant.avatar"
        :alt="segment.participant.address"
        class="ParticipantSegment-avatar"
      />
      <div v-else-if="segment.participant?.icon" class="ParticipantSegment-icon">
        {{ segment.participant.icon }}
      </div>

      <!-- Show share percentage for larger segments -->
      <div
        v-if="segment.sharePercentage && segment.sharePercentage > 0.15 && segment.width > 100"
        class="ParticipantSegment-share"
      >
        {{ Math.round(segment.sharePercentage * 100) }}%
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  segment: Object
})

defineEmits(['click'])
</script>

<style scoped lang="scss">
.ParticipantSegment {
  flex-shrink: 0;
  height: 100%;
  background: linear-gradient(180deg, rgba(76, 174, 224, 0.3) 0%, rgba(76, 174, 224, 0.15) 100%);
  border: 2px solid rgba(76, 174, 224, 0.4);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;

  &--interactive {
    cursor: pointer;

    &:hover {
      box-shadow: 0 4px 16px rgba(76, 174, 224, 0.5);
      border-color: rgba(76, 174, 224, 0.8);
    }
  }

  &--winner {
    background: linear-gradient(180deg, rgba(255, 215, 0, 0.4) 0%, rgba(255, 165, 0, 0.3) 100%);
    border-color: rgba(255, 215, 0, 0.8);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
  }

  &--special {
    border-color: rgba(76, 224, 174, 0.8);
    box-shadow: 0 0 16px rgba(76, 224, 174, 0.4);
  }

  &-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 100%;
    padding: 8px;
  }

  &-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  &-icon {
    font-size: 32px;
    line-height: 1;
  }

  &-share {
    font-size: 12px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
}
</style>
