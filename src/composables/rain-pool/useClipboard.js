import { ref } from 'vue'

export function useClipboard() {
  const isCopied = ref(false)
  const copiedTimeout = ref(null)

  async function copyToClipboard(text) {
    if (!navigator.clipboard) {
      console.warn('Clipboard API not available')
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      isCopied.value = true

      // Clear previous timeout
      if (copiedTimeout.value !== null) {
        clearTimeout(copiedTimeout.value)
      }

      // Reset after 2 seconds
      copiedTimeout.value = window.setTimeout(() => {
        isCopied.value = false
        copiedTimeout.value = null
      }, 2000)

      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  function resetCopied() {
    isCopied.value = false
    if (copiedTimeout.value !== null) {
      clearTimeout(copiedTimeout.value)
      copiedTimeout.value = null
    }
  }

  return {
    isCopied,
    copyToClipboard,
    resetCopied,
  }
}
