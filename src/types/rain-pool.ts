export interface Pool {
  id: string
  status: 'open' | 'closed' | 'rolling' | 'completed'
  starts_at: string
  ends_at: string
  total_prize_sol: number
  total_payout_sol?: number
  market_cap: number
  winner_count?: number
  completed_at?: string
  created_at: string
}

export interface Participant {
  id: string
  address: string
  truncatedAddress: string
  avatar: string | null
  icon: string | null
  isWinner: boolean
  isSpecial: boolean
  joinedAt: string
  total_tickets: number
  free_tickets: number
  burn_boost_tickets: number
  tier: number
  burn_amount_usd: number
}

export interface Winner {
  wallet_address: string
  reward_sol: number
  payout_tx_sig?: string
  avatar_url?: string
}

export interface SegmentData {
  participant: Participant
  width: number
  sharePercentage: number
  tickets: number
  index: number
  id: string
  copyIndex?: number
}

export interface WinnerModalData {
  address: string
  truncatedAddress: string
  prize: number
  avatar: string | null
  icon: string | null
  position: number
  totalWinners: number
  txSig: string | null
}

export interface UserInfo {
  address: string
  avatar?: string | null
  solBalance?: number
  tokenBalance?: number
  tokenValueUsd?: number
  isEligible?: boolean
  formattedSolBalance?: string
  formattedTokenBalance?: string
  isLoading?: boolean
}

export interface PoolHistoryItem extends Pool {
  winner_avatars?: string[]
}

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}
