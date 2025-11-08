import { createClient } from '@supabase/supabase-js'
import AvatarService from './AvatarService'

class SupabaseService {
  constructor() {
    const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
    const supabaseKey = process.env.VUE_APP_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please check your environment variables.')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.currentUser = null
  }

  async createOrUpdateUser(walletAddress, balances = {}) {
    try {
      // Check if user already exists to determine if we need to assign an avatar
      const existingUser = await this.getUserByWallet(walletAddress)
      const isNewUser = !existingUser.exists

      const userData = {
        wallet_address: walletAddress,
        last_seen: new Date().toISOString(),
        sol_balance: balances.sol || 0,
        token_balance: balances.token || 0,
        is_eligible: (balances.token || 0) > 0,
        updated_at: new Date().toISOString()
      }

      // Only assign avatar for new users, preserve existing avatar for existing users
      if (isNewUser) {
        userData.avatar = AvatarService.getRandomAvatar()
      } else if (existingUser.user && existingUser.user.avatar) {
        // Preserve existing avatar (ensure it's just the filename, not full path)
        let avatarFilename = existingUser.user.avatar
        if (avatarFilename.startsWith('/raindrops/')) {
          avatarFilename = avatarFilename.replace('/raindrops/', '')
        }
        userData.avatar = avatarFilename
      }

      const { data, error } = await this.supabase
        .from('users')
        .upsert(userData, {
          onConflict: 'wallet_address',
          returning: 'representation'
        })
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to create/update user: ${error.message}`)
      }

      this.currentUser = data[0]
      return {
        success: true,
        user: this.currentUser,
        message: 'User profile updated successfully'
      }
    } catch (error) {
      console.error('Error creating/updating user:', error)
      return {
        success: false,
        error: error.message || 'Failed to create/update user'
      }
    }
  }

  async getUserByWallet(walletAddress) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw new Error(`Failed to fetch user: ${error.message}`)
      }

      this.currentUser = data
      return {
        success: true,
        user: data,
        exists: !!data
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch user',
        exists: false
      }
    }
  }

  async updateUserBalances(walletAddress, balances) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          sol_balance: balances.sol,
          token_balance: balances.token,
          is_eligible: balances.token > 0,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress)
        .select()

      if (error) {
        throw new Error(`Failed to update balances: ${error.message}`)
      }

      if (data && data.length > 0) {
        this.currentUser = data[0]
      }

      return {
        success: true,
        user: this.currentUser,
        message: 'Balances updated successfully'
      }
    } catch (error) {
      console.error('Error updating balances:', error)
      return {
        success: false,
        error: error.message || 'Failed to update balances'
      }
    }
  }

  async updateUserAvatar(walletAddress, avatarFilename) {
    try {
      // Validate avatar filename
      if (!AvatarService.isValidAvatar(avatarFilename)) {
        throw new Error('Invalid avatar filename')
      }

      const { data, error } = await this.supabase
        .from('users')
        .update({
          avatar: avatarFilename,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress)
        .select()

      if (error) {
        throw new Error(`Failed to update avatar: ${error.message}`)
      }

      if (data && data.length > 0) {
        this.currentUser = data[0]
      }

      return {
        success: true,
        user: this.currentUser,
        message: 'Avatar updated successfully'
      }
    } catch (error) {
      console.error('Error updating avatar:', error)
      return {
        success: false,
        error: error.message || 'Failed to update avatar'
      }
    }
  }

  async addPoolParticipation(walletAddress, poolId) {
    try {
      // First, get the user ID
      const userResult = await this.getUserByWallet(walletAddress)
      if (!userResult.success || !userResult.user) {
        throw new Error('User not found')
      }

      const participationData = {
        user_id: userResult.user.id,
        pool_id: poolId,
        wallet_address: walletAddress,
        avatar_url: userResult.user.avatar,
        joined_at: new Date().toISOString()
      }

      const { data, error } = await this.supabase
        .from('rain_pool_participants')
        .insert(participationData)
        .select()

      if (error) {
        throw new Error(`Failed to add pool participation: ${error.message}`)
      }

      return {
        success: true,
        participation: data[0],
        message: 'Pool participation recorded successfully'
      }
    } catch (error) {
      console.error('Error adding pool participation:', error)
      return {
        success: false,
        error: error.message || 'Failed to add pool participation'
      }
    }
  }

  async getUserParticipations(walletAddress, limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('rain_pool_participants')
        .select(`
          *,
          users!inner(wallet_address)
        `)
        .eq('users.wallet_address', walletAddress)
        .order('joined_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Failed to fetch participations: ${error.message}`)
      }

      return {
        success: true,
        participations: data || [],
        message: 'Participations fetched successfully'
      }
    } catch (error) {
      console.error('Error fetching participations:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch participations',
        participations: []
      }
    }
  }

  async getPoolStats() {
    try {
      const { data: participantsData, error: participantsError } = await this.supabase
        .from('rain_pool_participants')
        .select('*')
      
      const { data: winnersData, error: winnersError } = await this.supabase
        .from('rain_pool_winners')
        .select('*')

      if (participantsError || winnersError) {
        throw new Error(`Failed to fetch pool stats: ${participantsError?.message || winnersError?.message}`)
      }

      const totalParticipations = participantsData.length
      const uniqueParticipants = new Set(participantsData.map(p => p.user_id)).size
      const totalRewards = winnersData.reduce((sum, w) => sum + (w.reward_sol || 0), 0)
      const winnerCount = winnersData.length

      return {
        success: true,
        stats: {
          totalParticipations,
          uniqueParticipants,
          totalRewards,
          winnerCount
        }
      }
    } catch (error) {
      console.error('Error fetching pool stats:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch pool stats',
        stats: {
          totalParticipations: 0,
          uniqueParticipants: 0,
          totalRewards: 0,
          winnerCount: 0
        }
      }
    }
  }

  async createPoolWinner(poolId, userId, walletAddress, rewardSol, position = 1) {
    try {
      const { data, error } = await this.supabase
        .from('rain_pool_winners')
        .insert({
          pool_id: poolId,
          user_id: userId,
          wallet_address: walletAddress,
          reward_sol: rewardSol,
          position: position
        })
        .select()

      if (error) {
        throw new Error(`Failed to create winner: ${error.message}`)
      }

      return {
        success: true,
        winner: data[0],
        message: 'Winner created successfully'
      }
    } catch (error) {
      console.error('Error creating winner:', error)
      return {
        success: false,
        error: error.message || 'Failed to create winner'
      }
    }
  }

  async getAllEligibleUsers() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('is_eligible', true)
        .order('token_balance', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch eligible users: ${error.message}`)
      }

      return {
        success: true,
        users: data || [],
        message: 'Eligible users fetched successfully'
      }
    } catch (error) {
      console.error('Error fetching eligible users:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch eligible users',
        users: []
      }
    }
  }

  getCurrentUser() {
    return this.currentUser
  }

  async signOut() {
    this.currentUser = null
    return {
      success: true,
      message: 'Signed out successfully'
    }
  }

  isAuthenticated() {
    return !!this.currentUser
  }

  // Rain Pool Methods
  async getCurrentOpenPool() {
    try {
      // First check if tables exist
      const tablesCheck = await this.ensureTablesExist()
      if (!tablesCheck.exists) {
        return {
          success: false,
          error: 'Database tables not created yet. Please apply migration.',
          exists: false,
          needsMigration: true
        }
      }

      const { data, error } = await this.supabase
        .from('rain_pools')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        throw new Error(`Failed to fetch current pool: ${error.message}`)
      }

      const pool = data && data.length > 0 ? data[0] : null

      return {
        success: true,
        pool: pool,
        exists: !!pool
      }
    } catch (error) {
      console.error('Error fetching current pool:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch current pool',
        exists: false
      }
    }
  }

  async getPoolParticipants(poolId) {
    try {
      const { data, error } = await this.supabase
        .from('rain_pool_participants')
        .select('*')
        .eq('pool_id', poolId)
        .order('joined_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch participants: ${error.message}`)
      }

      return {
        success: true,
        participants: data || []
      }
    } catch (error) {
      console.error('Error fetching participants:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch participants',
        participants: []
      }
    }
  }

  async getPoolWinners(poolId) {
    try {
      const { data, error } = await this.supabase
        .from('rain_pool_winners')
        .select(`
          wallet_address,
          reward_sol,
          payout_tx_sig,
          created_at,
          users!rain_pool_winners_user_id_fkey (
            avatar
          )
        `)
        .eq('pool_id', poolId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch winners: ${error.message}`)
      }

      // Map the data to include avatar_url
      const winners = (data || []).map(winner => ({
        wallet_address: winner.wallet_address,
        reward_sol: winner.reward_sol,
        payout_tx_sig: winner.payout_tx_sig,
        created_at: winner.created_at,
        avatar_url: winner.users?.avatar ? `/raindrops/${winner.users.avatar}` : null
      }))

      return {
        success: true,
        winners
      }
    } catch (error) {
      console.error('Error fetching winners:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch winners',
        winners: []
      }
    }
  }

  async getHistoricalParticipants(poolId) {
    try {
      const { data, error } = await this.supabase
        .from('rain_pool_participants')
        .select('*')
        .eq('pool_id', poolId)
        .order('joined_at', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch historical participants: ${error.message}`)
      }

      return {
        success: true,
        participants: data || []
      }
    } catch (error) {
      console.error('Error fetching historical participants:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch historical participants',
        participants: []
      }
    }
  }

  async joinRainPool(walletAddress, avatarUrl, options = {}) {
    try {
      const {
        mintAddress = process.env.VUE_APP_RAINDR0P_TOKEN_MINT,
        burnAmountUsd = 0,
        burnTransactionSignature = null
      } = options

      const response = await fetch(`${process.env.VUE_APP_SUPABASE_URL}/functions/v1/join-pool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VUE_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          wallet: walletAddress,
          avatarUrl: avatarUrl,
          mintAddress,
          burnAmountUsd,
          burnTransactionSignature
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to join pool')
      }

      return {
        success: true,
        ...result
      }
    } catch (error) {
      console.error('Error joining rain pool:', error)
      return {
        success: false,
        error: error.message || 'Failed to join rain pool'
      }
    }
  }

  async isUserInCurrentPool(walletAddress) {
    try {
      const poolResult = await this.getCurrentOpenPool()
      if (!poolResult.success || !poolResult.pool) {
        return { success: true, inPool: false, pool: null }
      }

      const userResult = await this.getUserByWallet(walletAddress)
      if (!userResult.success || !userResult.user) {
        return { success: true, inPool: false, pool: poolResult.pool }
      }

      const { data, error } = await this.supabase
        .from('rain_pool_participants')
        .select('*')
        .eq('pool_id', poolResult.pool.id)
        .eq('user_id', userResult.user.id)
        .limit(1)

      if (error) {
        throw new Error(`Failed to check participation: ${error.message}`)
      }

      const participant = data && data.length > 0 ? data[0] : null

      return {
        success: true,
        inPool: !!participant,
        pool: poolResult.pool,
        participant: participant
      }
    } catch (error) {
      console.error('Error checking pool participation:', error)
      return {
        success: false,
        error: error.message || 'Failed to check pool participation',
        inPool: false
      }
    }
  }

  // Pool Lifecycle Management
  async startNewPool(maxParticipants = null) { // Duration controlled by edge function
    try {
      const response = await fetch(`${process.env.VUE_APP_SUPABASE_URL}/functions/v1/start-new-pool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VUE_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          maxParticipants
          // durationMinutes and prizeSol controlled by edge function
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start new pool')
      }

      return {
        success: true,
        ...result
      }
    } catch (error) {
      console.error('Error starting new pool:', error)
      return {
        success: false,
        error: error.message || 'Failed to start new pool'
      }
    }
  }

  async closeCurrentPool(poolId = null, winnerCount = 3, specificWinner = null) {
    try {
      const response = await fetch(`${process.env.VUE_APP_SUPABASE_URL}/functions/v1/close-and-draw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VUE_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          poolId,
          winnerCount,
          specificWinner
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to close pool')
      }

      return {
        success: true,
        ...result
      }
    } catch (error) {
      console.error('Error closing pool:', error)
      return {
        success: false,
        error: error.message || 'Failed to close pool'
      }
    }
  }

  async managePoolLifecycle(action, poolId = null, winnerCount = 3) {
    try {
      const response = await fetch(`${process.env.VUE_APP_SUPABASE_URL}/functions/v1/manage-pool-lifecycle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VUE_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action,
          poolId,
          winnerCount
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to manage pool lifecycle')
      }

      return {
        success: true,
        ...result
      }
    } catch (error) {
      console.error('Error managing pool lifecycle:', error)
      return {
        success: false,
        error: error.message || 'Failed to manage pool lifecycle'
      }
    }
  }

  async ensureTablesExist() {
    try {
      // Check if rain_pools table exists by trying to query it
      const { error } = await this.supabase
        .from('rain_pools')
        .select('id')
        .limit(1)
      
      if (error && error.code === '42P01') {
        // Table doesn't exist, need to create it
        console.log('Rain pool tables do not exist. Please run the database migration.')
        console.log('You can apply the migration by running the SQL in migrations/001_create_rain_pool_tables.sql')
        return { exists: false, error: 'Tables need to be created' }
      }
      
      return { exists: true, error: null }
    } catch (error) {
      console.error('Error checking table existence:', error)
      return { exists: false, error: error.message }
    }
  }

  async getPoolHistory(limit = 10) {
    try {
      console.log('Fetching pool history from rain_pool_winners...')

      // Query all winners with pool and user info
      const { data: winners, error } = await this.supabase
        .from('rain_pool_winners')
        .select(`
          pool_id,
          wallet_address,
          reward_sol,
          created_at,
          rain_pools!inner (
            id,
            total_prize_sol,
            total_payout_sol,
            status,
            completed_at,
            created_at,
            updated_at,
            winner_count,
            proof_data
          ),
          users (
            avatar
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch pool history: ${error.message}`)
      }

      // Group winners by pool_id
      const poolsMap = new Map()

      for (const winner of (winners || [])) {
        const poolId = winner.rain_pools.id

        if (!poolsMap.has(poolId)) {
          // First winner for this pool - initialize pool data
          poolsMap.set(poolId, {
            id: poolId,
            total_prize_sol: winner.rain_pools.total_prize_sol,
            total_payout_sol: winner.reward_sol, // Use individual winner amount, will be summed
            status: winner.rain_pools.status,
            winner_count: 1, // Count winners as we go
            winner_avatars: [],
            completed_at: winner.rain_pools.completed_at,
            created_at: winner.rain_pools.created_at,
            updated_at: winner.rain_pools.updated_at,
            proof_data: winner.rain_pools.proof_data,
            // Store first winner's created_at for sorting
            first_winner_created_at: winner.created_at
          })
        } else {
          // Pool exists, increment winner count and sum payout
          const pool = poolsMap.get(poolId)
          pool.winner_count += 1
          pool.total_payout_sol += winner.reward_sol
        }

        // Add avatar to the pool's avatar list (limit to 5)
        const pool = poolsMap.get(poolId)
        if (pool.winner_avatars.length < 5 && winner.users?.avatar) {
          const avatarUrl = winner.users.avatar.startsWith('/raindrops/')
            ? winner.users.avatar
            : `/raindrops/${winner.users.avatar}`
          pool.winner_avatars.push(avatarUrl)
        }
      }

      // Convert map to array and sort by completion time
      const pools = Array.from(poolsMap.values())
        .sort((a, b) => new Date(b.first_winner_created_at) - new Date(a.first_winner_created_at))
        .slice(0, limit)

      return {
        success: true,
        pools
      }
    } catch (error) {
      console.error('Error fetching pool history:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch pool history',
        pools: []
      }
    }
  }


  async closeEmptyPool(poolId) {
    try {
      console.log('🔄 Calling close-empty-pool edge function for:', poolId)

      const response = await fetch(`${process.env.VUE_APP_SUPABASE_URL}/functions/v1/close-empty-pool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VUE_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ poolId })
      })

      const result = await response.json()

      if (!result.success) {
        console.error('❌ Failed to close empty pool:', result.error)
        return { success: false, error: result.error }
      }

      console.log('✅ Pool closed successfully via edge function:', poolId)
      return { success: true }
    } catch (error) {
      console.error('❌ Exception calling close-empty-pool:', error)
      return { success: false, error: error.message }
    }
  }

  async claimTwitterBonus(walletAddress, poolId, tweetUrl) {
    try {
      const response = await fetch(`${process.env.VUE_APP_SUPABASE_URL}/functions/v1/claim-twitter-bonus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.VUE_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          walletAddress,
          poolId,
          tweetUrl
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to claim Twitter bonus')
      }

      return {
        success: true,
        ...result
      }
    } catch (error) {
      console.error('Error claiming Twitter bonus:', error)
      return {
        success: false,
        error: error.message || 'Failed to claim Twitter bonus'
      }
    }
  }

  getSupabaseClient() {
    return this.supabase
  }
}

export default new SupabaseService()