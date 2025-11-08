/**
 * Composable for generating winner share images
 * Creates a branded canvas image with winner stats for social sharing
 */

export function useWinnerShareImage() {
  /**
   * Generate a shareable winner image
   * @param {Object} winnerData - Winner information
   * @param {string} winnerData.avatar - Avatar URL or data URI
   * @param {string} winnerData.address - Wallet address
   * @param {string} winnerData.truncatedAddress - Shortened wallet address
   * @param {number} winnerData.prize - Prize amount in SOL
   * @returns {Promise<Blob>} - Generated image as blob
   */
  async function generateWinnerImage(winnerData) {
    // Canvas dimensions (Twitter card optimized)
    const WIDTH = 1200
    const HEIGHT = 630

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext('2d')

    // Brand colors
    const WHITE = '#FFFFFF'

    try {
      // 1. Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT)
      gradient.addColorStop(0, '#4CAEE0')
      gradient.addColorStop(1, '#3A9FD1')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, WIDTH, HEIGHT)

      // 2. Draw rain drops
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'

      for (let i = 0; i < 100; i++) {
        const x = Math.random() * WIDTH
        const y = Math.random() * HEIGHT
        const length = 10 + Math.random() * 20

        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x, y + length)
        ctx.stroke()
      }

      // 3. Draw clouds
      try {
        const clouds = await loadImage('/img/clouds.png')

        // Draw clouds at different positions with varying opacity
        ctx.globalAlpha = 0.3
        ctx.drawImage(clouds, 0, 0, WIDTH, HEIGHT)

        ctx.globalAlpha = 0.2
        ctx.drawImage(clouds, WIDTH * 0.2, HEIGHT * 0.1, WIDTH * 0.6, HEIGHT * 0.6)

        ctx.globalAlpha = 1.0
      } catch (err) {
        console.warn('Failed to load clouds, continuing without them:', err)
      }

      // 3. Draw avatar (top-left, circular)
      const AVATAR_SIZE = 100
      const AVATAR_X = 50
      const AVATAR_Y = 50

      if (winnerData.avatar) {
        try {
          const avatarImg = await loadImage(winnerData.avatar)
          ctx.save()

          // Create circular clip path
          ctx.beginPath()
          ctx.arc(AVATAR_X + AVATAR_SIZE / 2, AVATAR_Y + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2)
          ctx.closePath()
          ctx.clip()

          // Draw avatar
          ctx.drawImage(avatarImg, AVATAR_X, AVATAR_Y, AVATAR_SIZE, AVATAR_SIZE)

          ctx.restore()

          // Draw white border around avatar
          ctx.strokeStyle = WHITE
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.arc(AVATAR_X + AVATAR_SIZE / 2, AVATAR_Y + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2)
          ctx.stroke()
        } catch (err) {
          console.warn('Failed to load avatar:', err)
          // Draw placeholder circle if avatar fails
          drawPlaceholderAvatar(ctx, AVATAR_X, AVATAR_Y, AVATAR_SIZE)
        }
      } else {
        // Draw placeholder if no avatar
        drawPlaceholderAvatar(ctx, AVATAR_X, AVATAR_Y, AVATAR_SIZE)
      }

      // 4. Draw "RainDr0p" text in KrabbyPatty font
      const BRAND_X = AVATAR_X + AVATAR_SIZE + 25
      const BRAND_Y = AVATAR_Y + 30

      // Wait for KrabbyPatty font to load (it's already loaded via CSS)
      try {
        await document.fonts.load('48px "Krabby Patty"')
        console.log('KrabbyPatty font loaded successfully')
        ctx.font = '48px "Krabby Patty", sans-serif'
      } catch (err) {
        console.warn('KrabbyPatty font not loaded, using fallback:', err)
        ctx.font = 'bold 48px Arial, sans-serif'
      }

      ctx.fillStyle = WHITE
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.fillText('RainDr0p', BRAND_X, BRAND_Y)
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0

      // 5. Draw social links
      const SOCIAL_Y = BRAND_Y + 60
      ctx.font = '24px Arial, Helvetica, sans-serif'
      ctx.fillStyle = WHITE
      ctx.globalAlpha = 0.95

      // X icon (using 𝕏 character)
      ctx.fillText('𝕏 @raindr0p_fun', BRAND_X, SOCIAL_Y)

      // Website icon and URL
      const websiteX = BRAND_X + 220
      ctx.fillText('🌐 raindr0p.fun', websiteX, SOCIAL_Y)

      ctx.globalAlpha = 1.0

      // 6. Draw horizontal divider
      const DIVIDER_Y = AVATAR_Y + AVATAR_SIZE + 30
      ctx.strokeStyle = WHITE
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.4
      ctx.beginPath()
      ctx.moveTo(50, DIVIDER_Y)
      ctx.lineTo(WIDTH - 50, DIVIDER_Y)
      ctx.stroke()
      ctx.globalAlpha = 1.0

      // 7. Draw winner stats (centered)
      const STATS_START_Y = DIVIDER_Y + 80
      ctx.textAlign = 'center'

      // Winner emoji/title
      ctx.font = '56px "Krabby Patty", sans-serif'
      ctx.fillStyle = WHITE
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 10
      ctx.fillText('🎉 WINNER! 🎉', WIDTH / 2, STATS_START_Y)

      // Prize amount
      ctx.font = '72px "Krabby Patty", sans-serif'
      ctx.fillStyle = WHITE
      ctx.shadowBlur = 12
      ctx.fillText(`${winnerData.prize} SOL`, WIDTH / 2, STATS_START_Y + 90)

      // Date and time - use actual win date from database
      console.log('🔍 DEBUG: winnerData object:', winnerData)
      console.log('🔍 DEBUG: winnerData.created_at:', winnerData.created_at)
      const winDate = winnerData.created_at ? new Date(winnerData.created_at) : new Date()
      console.log('🔍 DEBUG: Parsed winDate:', winDate.toString())
      const dateStr = winDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      const timeStr = winDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      console.log('🔍 DEBUG: Formatted date string:', dateStr)
      console.log('🔍 DEBUG: Formatted time string:', timeStr)

      ctx.font = '28px "Krabby Patty", sans-serif'
      ctx.fillStyle = WHITE
      ctx.globalAlpha = 0.9
      ctx.shadowBlur = 6
      ctx.fillText(`${dateStr} • ${timeStr}`, WIDTH / 2, STATS_START_Y + 200)

      // Wallet address
      ctx.font = '32px "Krabby Patty", sans-serif'
      ctx.fillStyle = WHITE
      ctx.globalAlpha = 0.95
      ctx.shadowBlur = 6
      ctx.fillText(winnerData.truncatedAddress, WIDTH / 2, STATS_START_Y + 260)

      ctx.shadowBlur = 0
      ctx.globalAlpha = 1.0

      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to generate image blob'))
          }
        }, 'image/png')
      })

    } catch (error) {
      console.error('Error generating winner image:', error)
      throw error
    }
  }

  /**
   * Download the generated image
   * @param {Blob} blob - Image blob
   * @param {string} filename - Download filename
   */
  function downloadImage(blob, filename = 'raindr0p-winner.png') {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Load an image from URL
   * @param {string} src - Image source URL
   * @returns {Promise<HTMLImageElement>}
   */
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
      img.src = src
    })
  }

  /**
   * Draw a placeholder avatar circle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} size - Avatar size
   */
  function drawPlaceholderAvatar(ctx, x, y, size) {
    // Background circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.beginPath()
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
    ctx.fill()

    // User icon (simple representation)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = `${size * 0.5}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('👤', x + size / 2, y + size / 2)

    // Border
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
    ctx.stroke()
  }

  return {
    generateWinnerImage,
    downloadImage
  }
}
