<template>
  <i 
    class="SvgIcon"
    :class="`SvgIcon--${size}`"
    :style="{backgroundImage: url}" 
  />
</template>
<script>
export default {
  name: 'SvgIcon',
  
  props: {
    name: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: false,
      default: 'md',
      validator: (value) => {
        return ['xs', 'sm', 'md', 'lg', 'xl'].includes(value);
      }
    }
  },

  computed: {
    url() {
      const r = require(`@/assets/images/icons/${this.name}.svg`);
      return `url(${r})`;
    }
  }
}
</script>

<style lang="scss">
.SvgIcon {
  display: inline-block;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;

  &--xs {
    height: 16px;
    width: 16px;
  }

  &--sm {
    height: 18px;
    width: 18px;
  }

  &--md {
    height: 20px;
    width: 20px;
  }

  &--lg {
    height: 22px;
    width: 22px;
  }

  &--xl {
    height: 24px;
    width: 24px;
  }
}
</style>