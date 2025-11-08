import confetti from 'canvas-confetti'

export function useConfetti() {
  // Create or get confetti canvas with proper z-index
  let confettiCanvas = null
  let myConfetti = null

  function getConfettiInstance() {
    if (!confettiCanvas) {
      // Create a dedicated canvas for confetti if it doesn't exist
      confettiCanvas = document.createElement('canvas')
      confettiCanvas.style.position = 'fixed'
      confettiCanvas.style.top = '0'
      confettiCanvas.style.left = '0'
      confettiCanvas.style.width = '100%'
      confettiCanvas.style.height = '100%'
      confettiCanvas.style.pointerEvents = 'none'
      confettiCanvas.style.zIndex = '999999'
      document.body.appendChild(confettiCanvas)

      // Create confetti instance once and reuse it
      myConfetti = confetti.create(confettiCanvas, { resize: true, useWorker: true })
    }
    return myConfetti
  }

  function celebrateWinner() {
    const confettiInstance = getConfettiInstance()
    const colors = ['#4CAEE0', '#87CEEB', '#B8E6FF', '#FFD700', '#FFA500']

    // Reduced main confetti blast
    confettiInstance({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
    })

    // Side blasts - reduced particles
    setTimeout(() => {
      confettiInstance({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      })
      confettiInstance({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      })
    }, 200)
  }

  function celebrateUserWin() {
    const confettiInstance = getConfettiInstance()

    // Special celebration for user wins
    confettiInstance({
      particleCount: 80,
      spread: 120,
      origin: { y: 0.4 },
      colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4'],
    })
  }

  function celebrateMultipleWinners(count) {
    const confettiInstance = getConfettiInstance()

    // Staggered celebration for multiple winners
    for (let i = 0; i < Math.min(count, 3); i++) {
      setTimeout(() => {
        confettiInstance({
          particleCount: 50,
          spread: 50 + i * 10,
          origin: { y: 0.5 + i * 0.05 },
          colors: ['#4CAEE0', '#87CEEB', '#FFD700'],
        })
      }, i * 300)
    }
  }

  return {
    celebrateWinner,
    celebrateUserWin,
    celebrateMultipleWinners,
  }
}
