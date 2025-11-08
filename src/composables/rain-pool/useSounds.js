export function useSounds() {
  const rollStartSound = new Audio('/sounds/roll-start.mp3')
  const winnerSound = new Audio('/sounds/winner-sound.mp3')

  function playRollStart() {
    try {
      rollStartSound.currentTime = 0
      rollStartSound.play().catch(err => {
        console.log('Could not play roll start sound:', err)
      })
    } catch (error) {
      console.error('Error playing roll start sound:', error)
    }
  }

  function playWinnerSound() {
    try {
      winnerSound.currentTime = 0
      winnerSound.play().catch(err => {
        console.log('Could not play winner sound:', err)
      })
    } catch (error) {
      console.error('Error playing winner sound:', error)
    }
  }

  return {
    playRollStart,
    playWinnerSound
  }
}
