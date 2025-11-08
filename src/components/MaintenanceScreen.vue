<template>
  <div class="MaintenanceScreen">
    <!-- Rain effect background -->
    <canvas ref="rainCanvas" class="MaintenanceScreen-rain"></canvas>

    <!-- Cloud background -->
    <div class="MaintenanceScreen-clouds"></div>

    <!-- Content card -->
    <div class="MaintenanceScreen-card">
      <!-- Logo -->
      <div class="MaintenanceScreen-logo">
        <img src="/raindrops/raindrop_blue_smile.svg" alt="RainDr0p Logo" />
      </div>

      <!-- Title -->
      <h1 class="MaintenanceScreen-title">Site Maintenance</h1>

      <!-- Message -->
      <p class="MaintenanceScreen-message">
        {{ maintenanceMessage }}
      </p>

      <!-- Password form (only if not locked) -->
      <div v-if="!isLocked" class="MaintenanceScreen-form">
        <div class="MaintenanceScreen-inputGroup">
          <input
            ref="passwordInput"
            v-model="password"
            type="text"
            placeholder="Enter password"
            class="MaintenanceScreen-input"
            :disabled="isSubmitting"
            @keyup.enter="handleSubmit"
            autocomplete="new-password"
            style="color: #000 !important; -webkit-text-fill-color: #000 !important; background: #fff !important;"
          />
          <button
            class="MaintenanceScreen-submit"
            :disabled="!password || isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="!isSubmitting">Enter</span>
            <span v-else class="MaintenanceScreen-spinner"></span>
          </button>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="MaintenanceScreen-error">
          {{ errorMessage }}
        </div>

        <!-- Attempts remaining -->
        <div v-if="attemptsLeft !== null && attemptsLeft < 3" class="MaintenanceScreen-attempts">
          {{ attemptsLeft }} attempt{{ attemptsLeft !== 1 ? 's' : '' }} remaining
        </div>
      </div>

      <!-- Lockout message -->
      <div v-else class="MaintenanceScreen-lockout">
        <div class="MaintenanceScreen-lockoutIcon">🔒</div>
        <p class="MaintenanceScreen-lockoutText">
          Too many incorrect attempts.
        </p>
        <p class="MaintenanceScreen-lockoutRetry">
          Try again in {{ retryAfter }} minute{{ retryAfter !== 1 ? 's' : '' }}.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const rainCanvas = ref(null)
const passwordInput = ref(null)
const password = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const attemptsLeft = ref(null)
const isLocked = ref(false)
const retryAfter = ref(0)
const maintenanceMessage = ref('We\'re making some improvements. Please check back soon!')

const emit = defineEmits(['authenticated'])

// Rain effect variables
let animationFrameId = null
let raindrops = []

// Initialize rain effect
const initRainEffect = () => {
  const canvas = rainCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  // Raindrop class
  class Raindrop {
    constructor() {
      this.x = Math.random() * canvas.width
      this.y = Math.random() * canvas.height - canvas.height
      this.length = Math.random() * 20 + 10
      this.speed = Math.random() * 3 + 2
      this.opacity = Math.random() * 0.3 + 0.3
    }

    fall() {
      this.y += this.speed
      if (this.y > canvas.height) {
        this.y = -this.length
        this.x = Math.random() * canvas.width
      }
    }

    draw() {
      ctx.beginPath()
      ctx.moveTo(this.x, this.y)
      ctx.lineTo(this.x, this.y + this.length)
      ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  // Create raindrops
  for (let i = 0; i < 150; i++) {
    raindrops.push(new Raindrop())
  }

  // Animation loop
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    raindrops.forEach(drop => {
      drop.fall()
      drop.draw()
    })
    animationFrameId = requestAnimationFrame(animate)
  }

  animate()

  // Handle resize
  const handleResize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }

  window.addEventListener('resize', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
  }
}

// Fetch maintenance message
const fetchMaintenanceMessage = async () => {
  try {
    const SupabaseService = await import('@/services/SupabaseService')
    const supabase = SupabaseService.default.getSupabaseClient()

    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'maintenance_message')
      .single()

    if (data?.value) {
      maintenanceMessage.value = data.value
    }
  } catch (error) {
    console.error('Failed to fetch maintenance message:', error)
  }
}

// Handle password submission
const handleSubmit = async () => {
  if (!password.value || isSubmitting.value) return

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(
      `${process.env.VUE_APP_SUPABASE_URL}/functions/v1/check-maintenance-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VUE_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ password: password.value })
      }
    )

    const result = await response.json()

    if (result.valid) {
      // Store session token
      sessionStorage.setItem('maintenance_auth', result.token)
      // Emit authenticated event
      emit('authenticated')
    } else if (result.locked) {
      isLocked.value = true
      retryAfter.value = result.retryAfter || 15
      errorMessage.value = result.message
    } else {
      errorMessage.value = result.message || 'Incorrect password'
      attemptsLeft.value = result.attemptsLeft ?? null
      password.value = ''
      // Focus back on input
      setTimeout(() => {
        passwordInput.value?.focus()
      }, 100)
    }
  } catch (error) {
    console.error('Error checking password:', error)
    errorMessage.value = 'Failed to verify password. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  const cleanup = initRainEffect()
  fetchMaintenanceMessage()

  // Focus password input
  setTimeout(() => {
    passwordInput.value?.focus()
  }, 500)

  onUnmounted(() => {
    if (cleanup) cleanup()
  })
})
</script>

<style lang="scss" scoped>
.MaintenanceScreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: #4CAEE0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.MaintenanceScreen-rain {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.MaintenanceScreen-clouds {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('@/assets/images/clouds.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  opacity: 0.5;
  z-index: 2;
}

.MaintenanceScreen-card {
  position: relative;
  z-index: 3;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px 40px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.MaintenanceScreen-logo {
  margin-bottom: 24px;

  img {
    width: 120px;
    height: 120px;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    animation: float 3s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.MaintenanceScreen-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0 0 16px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.MaintenanceScreen-message {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 32px 0;
  line-height: 1.5;
}

.MaintenanceScreen-form {
  margin-top: 32px;
}

.MaintenanceScreen-inputGroup {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.MaintenanceScreen-input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  background: #ffffff !important;
  color: #000000 !important;
  font-size: 16px;
  font-weight: 600;
  outline: none;
  transition: all 0.3s ease;
  -webkit-text-fill-color: #000000 !important;
  caret-color: #000000 !important;

  &::placeholder {
    color: rgba(0, 0, 0, 0.4);
    -webkit-text-fill-color: rgba(0, 0, 0, 0.4);
  }

  &:focus {
    border-color: rgba(255, 255, 255, 0.6);
    background: white;
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  // Override autofill styles
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-text-fill-color: #000 !important;
    -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.95) inset !important;
    box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.95) inset !important;
  }
}

.MaintenanceScreen-submit {
  padding: 14px 28px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
}

.MaintenanceScreen-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.MaintenanceScreen-error {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fef2f2;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.MaintenanceScreen-attempts {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.MaintenanceScreen-lockout {
  margin-top: 32px;
}

.MaintenanceScreen-lockoutIcon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.MaintenanceScreen-lockoutText {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
}

.MaintenanceScreen-lockoutRetry {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

// Responsive
@media (max-width: 640px) {
  .MaintenanceScreen-card {
    padding: 32px 24px;
  }

  .MaintenanceScreen-logo img {
    width: 80px;
    height: 80px;
  }

  .MaintenanceScreen-title {
    font-size: 24px;
  }

  .MaintenanceScreen-message {
    font-size: 14px;
  }

  .MaintenanceScreen-inputGroup {
    flex-direction: column;
  }

  .MaintenanceScreen-submit {
    width: 100%;
  }
}
</style>
