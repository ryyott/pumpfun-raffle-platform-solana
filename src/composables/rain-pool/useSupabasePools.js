import { useRainPoolStore } from '@/stores/rainPool'
import SupabaseService from '@/services/SupabaseService'

let isLoadingPool = false
let lastParticipantFetch = 0
const DEBOUNCE_MS = 1000

export function useSupabasePools() {
  const store = useRainPoolStore()

  async function loadCurrentPool() {
    if (isLoadingPool) return
    isLoadingPool = true

    try {
      const poolResult = await SupabaseService.getCurrentOpenPool()

      if (poolResult.success && poolResult.pool) {
        const pool = poolResult.pool

        // Calculate remaining time from pool end time
        const startTime = new Date(pool.starts_at).getTime()
        const endTime = new Date(pool.ends_at).getTime()
        const currentTime = Date.now()
        const remainingMs = Math.max(0, endTime - currentTime)
        const totalDurationMs = endTime - startTime

        store.setCurrentPool(pool)
        store.remainingSeconds = remainingMs / 1000
        store.totalTimeSeconds = totalDurationMs / 1000
        store.progressPercentage = Math.max(0, (store.remainingSeconds / store.totalTimeSeconds) * 100)
      } else {
        store.currentPool = null
      }
    } catch (error) {
      console.error('Error loading current pool:', error)
    } finally {
      isLoadingPool = false
    }
  }

  async function startNewPool() {
    if (store.isCreatingPool) {
      console.log('Pool creation already in progress')
      return
    }

    store.isCreatingPool = true

    try {
      // Double-check for existing pool
      const existingPoolCheck = await SupabaseService.getCurrentOpenPool()

      if (existingPoolCheck.success && existingPoolCheck.pool) {
        console.log('Found existing pool during creation check')
        await loadCurrentPool()
        return
      }

      const result = await SupabaseService.startNewPool()

      if (result.success && result.pool) {
        const pool = result.pool
        const startTime = new Date(pool.starts_at).getTime()
        const endTime = new Date(pool.ends_at).getTime()
        const currentTime = Date.now()
        const remainingMs = Math.max(0, endTime - currentTime)
        const totalDurationMs = endTime - startTime

        store.setCurrentPool(pool)
        store.remainingSeconds = remainingMs / 1000
        store.totalTimeSeconds = totalDurationMs / 1000
        store.progressPercentage = Math.max(0, (store.remainingSeconds / store.totalTimeSeconds) * 100)

        console.log('✅ New pool started:', {
          poolId: pool.id,
          endsAt: pool.ends_at,
          remainingSeconds: store.remainingSeconds,
          totalSeconds: store.totalTimeSeconds
        })

        // Wait for market cap to be fetched
        setTimeout(async () => {
          await loadCurrentPool()
        }, 3000)
      }
    } catch (error) {
      console.error('Error starting new pool:', error)
    } finally {
      store.isCreatingPool = false
    }
  }

  async function loadPoolParticipants() {
    // Debounce to prevent overlap
    const now = Date.now()
    if (now - lastParticipantFetch < DEBOUNCE_MS || store.isLoadingParticipants) {
      return
    }

    lastParticipantFetch = now
    store.isLoadingParticipants = true

    try {
      if (!store.currentPool) {
        const poolResult = await SupabaseService.getCurrentOpenPool()
        if (poolResult.success && poolResult.pool) {
          store.setCurrentPool(poolResult.pool)
        } else {
          return
        }
      }

      const participantsResult = await SupabaseService.getPoolParticipants(store.currentPool.id)

      if (participantsResult.success && participantsResult.participants) {
        const dbParticipants = participantsResult.participants.map((p) => {
          let avatarPath = p.avatar_url
          if (avatarPath && !avatarPath.startsWith('/raindrops/')) {
            avatarPath = `/raindrops/${avatarPath}`
          }

          return {
            id: `db-${p.user_id}`,
            address: p.wallet_address,
            truncatedAddress: `${p.wallet_address.slice(0, 4)}...${p.wallet_address.slice(-4)}`,
            avatar: avatarPath,
            icon: avatarPath ? null : getRandomIcon(),
            isWinner: false,
            isSpecial: false,
            joinedAt: p.joined_at,
            total_tickets: p.total_tickets || 1,
            free_tickets: p.free_tickets || 0,
            burn_boost_tickets: p.burn_boost_tickets || 0,
            tier: p.tier || 1,
            burn_amount_usd: p.burn_amount_usd || 0,
          }
        })

        store.setParticipants(dbParticipants)
      }
    } catch (error) {
      console.error('Error loading pool participants:', error)
    } finally {
      store.isLoadingParticipants = false
    }
  }

  async function loadPoolHistory(limit = 10) {
    try {
      const result = await SupabaseService.getPoolHistory(limit)

      if (result.success && result.pools) {
        store.poolHistory = result.pools
      }
    } catch (error) {
      console.error('Error loading pool history:', error)
    }
  }

  async function joinPool(walletAddress, avatar, burnData) {
    try {
      const result = await SupabaseService.joinRainPool(walletAddress, avatar, burnData)
      return result
    } catch (error) {
      console.error('Error joining pool:', error)
      return { success: false, error: error.message }
    }
  }

  // Idempotency tracking: prevent duplicate close-and-draw calls
  const pendingClosures = new Set()

  // Track failed close attempts to prevent infinite loops
  const failedClosures = new Set()

  async function closeAndDrawWinners() {
    if (!store.currentPool) return []

    // CRITICAL: Save pool ID before closing, as currentPool will change
    const closingPoolId = store.currentPool.id

    // IDEMPOTENCY CHECK: Prevent duplicate calls for the same pool
    if (pendingClosures.has(closingPoolId)) {
      console.log('⚠️ Close already in progress for pool:', closingPoolId)
      return []
    }

    // INFINITE LOOP PREVENTION: If this pool failed multiple times, give up
    if (failedClosures.has(closingPoolId)) {
      console.log('⚠️ Pool has already failed to close, skipping to prevent infinite loop:', closingPoolId)
      return []
    }

    // Check if pool is already closed before making API call
    if (store.currentPool.status !== 'open') {
      console.log('⚠️ Pool is not open, status:', store.currentPool.status)
      return []
    }

    // Mark this pool as being closed
    pendingClosures.add(closingPoolId)

    try {
      const response = await fetch(`${process.env.VUE_APP_SUPABASE_URL}/functions/v1/close-and-draw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.VUE_APP_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ poolId: closingPoolId }),
      })

      const closeResult = await response.json()
      console.log('✅ Close-and-draw response:', closeResult)

      if (!closeResult.success) {
        // Check if error is due to pool already being closed (race condition - another tab/call won)
        if (closeResult.error && (closeResult.error.includes('not open') || closeResult.error.includes('already being processed'))) {
          console.log('ℹ️ Pool already closed by another tab/request - this is expected')
          console.log('   Waiting for the other call to complete and fetch winners...')

          // Wait a moment for the other call to insert winners, then try to fetch them
          await new Promise(resolve => setTimeout(resolve, 3000))

          // Try to get winners that the other call created
          const winnersResult = await SupabaseService.getPoolWinners(closingPoolId)
          if (winnersResult.success && winnersResult.winners && winnersResult.winners.length > 0) {
            console.log(`✅ Found ${winnersResult.winners.length} winner(s) from parallel call`)
            return winnersResult.winners
          }

          // If still no winners after waiting, mark as failed and return empty
          console.log('⚠️ No winners found after waiting - marking pool as failed')
          failedClosures.add(closingPoolId)
          return []
        }

        console.error('Failed to close pool:', closeResult.error)
        failedClosures.add(closingPoolId)
        return []
      }

      // Use the SAVED pool ID, not currentPool which may have changed
      console.log(`📋 Fetching winners for closed pool: ${closingPoolId}`)
      const winnersResult = await SupabaseService.getPoolWinners(closingPoolId)
      console.log('👥 Winners result:', winnersResult)

      if (winnersResult.success && winnersResult.winners && winnersResult.winners.length > 0) {
        console.log(`✅ Found ${winnersResult.winners.length} winner(s)`)
        return winnersResult.winners
      }

      console.warn('⚠️ No winners found for pool:', closingPoolId)
      return []
    } catch (error) {
      console.error('Error closing and drawing winners:', error)
      return []
    } finally {
      // Clean up: remove from pending set after completion (success or failure)
      pendingClosures.delete(closingPoolId)
    }
  }

  async function getPoolWinners(poolId) {
    try {
      const result = await SupabaseService.getPoolWinners(poolId)
      if (result.success && result.winners) {
        return result.winners
      }
      return []
    } catch (error) {
      console.error('Error fetching pool winners:', error)
      return []
    }
  }

  async function triggerPayouts(poolId) {
    try {
      console.log('🔄 Triggering payouts for pool:', poolId)
      const response = await fetch(`${process.env.VUE_APP_SUPABASE_URL}/functions/v1/payout-winners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.VUE_APP_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ poolId }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Payout failed:', result)
        return { success: false, error: result.error || 'Payout failed' }
      }

      console.log('✅ Payouts completed:', result)
      return { success: true, result }
    } catch (error) {
      console.error('❌ Error triggering payouts:', error)
      return { success: false, error: error.message }
    }
  }

  async function loadReplayData(poolId) {
    store.loadingReplay = true

    try {
      // Load pool details (use from selectedPoolDetails if already loaded)
      store.replayPool = store.selectedPoolDetails

      // Load participants
      const participantsResult = await SupabaseService.getHistoricalParticipants(poolId)

      if (participantsResult.success && participantsResult.participants) {
        const formattedParticipants = participantsResult.participants.map((p) => {
          let avatarPath = p.avatar_url
          if (avatarPath && !avatarPath.startsWith('/raindrops/')) {
            avatarPath = `/raindrops/${avatarPath}`
          }

          return {
            wallet_address: p.wallet_address,
            avatar_url: avatarPath,
            total_tickets: p.total_tickets || 1,
            free_tickets: p.free_tickets || 0,
            burn_boost_tickets: p.burn_boost_tickets || 0,
            burn_amount_usd: p.burn_amount_usd || 0,
            tier: p.tier || 1,
            joined_at: p.joined_at,
          }
        })

        store.replayParticipants = formattedParticipants
      }

      // Load winners (use from poolDetailsWinners if already loaded)
      if (store.poolDetailsWinners && store.poolDetailsWinners.length > 0) {
        store.replayWinners = store.poolDetailsWinners
      } else {
        const winnersResult = await SupabaseService.getPoolWinners(poolId)
        if (winnersResult.success && winnersResult.winners) {
          store.replayWinners = winnersResult.winners
        }
      }

      console.log('📼 Replay data loaded:', {
        poolId,
        participantCount: store.replayParticipants.length,
        winnerCount: store.replayWinners.length
      })
    } catch (error) {
      console.error('Error loading replay data:', error)
      store.addToast('Failed to load replay data', 'error')
    } finally {
      store.loadingReplay = false
    }
  }

  function getRandomIcon() {
    const icons = ['🌧️', '💧', '☔', '🌦️', '⛈️', '🌨️', '💙', '🎯', '💫', '⭐']
    return icons[Math.floor(Math.random() * icons.length)]
  }

  return {
    loadCurrentPool,
    startNewPool,
    loadPoolParticipants,
    loadPoolHistory,
    joinPool,
    closeAndDrawWinners,
    getPoolWinners,
    triggerPayouts,
    loadReplayData,
  }
}
