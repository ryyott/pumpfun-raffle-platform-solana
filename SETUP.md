# RainDr0p Setup Guide

Complete setup instructions for running your own instance of the RainDr0p raffle platform.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Solana Wallet Setup](#solana-wallet-setup)
- [Environment Variables](#environment-variables)
- [Edge Functions Deployment](#edge-functions-deployment)
- [Frontend Setup](#frontend-setup)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Deno** (latest version) - [Installation Guide](https://docs.deno.com/runtime/manual)
- **PostgreSQL client tools** (psql, pg_dump) - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### Accounts Needed

1. **Supabase Account** - [Sign up](https://supabase.com)
2. **Helius API Account** - [Sign up](https://helius.dev) (for Solana RPC access)
3. **PumpPortal API Access** - [Documentation](https://pumpportal.fun/docs)

---

## Database Setup

### Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - **Name**: raindr0p (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your users
4. Wait for project to finish setting up (~2 minutes)

### Step 2: Get Database Connection String

1. In your Supabase project dashboard, go to **Settings > Database**
2. Scroll to **Connection String** section
3. Copy the **Connection string** (should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
4. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 3: Apply Database Schema

Run the following command to create all tables, views, functions, and indexes:

```bash
psql "YOUR_CONNECTION_STRING" -f supabase/schema.sql
```

**Example:**
```bash
psql "postgresql://postgres:MyPassword123@db.abc123xyz.supabase.co:5432/postgres" -f supabase/schema.sql
```

You should see output confirming:
- ✅ 9 tables created
- ✅ 4 views created
- ✅ 6 functions created
- ✅ 1 trigger created

### Step 4: Verify Database Setup

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. Verify these tables exist:
   - `users`
   - `rain_pools`
   - `rain_pool_participants`
   - `rain_pool_winners`
   - `burn_transactions`
   - `creator_fee_claims`
   - `system_settings`
   - `maintenance_attempts`
   - `schema_version`

---

## Solana Wallet Setup

### Create Creator Wallet

You need a Solana wallet to receive creator fees and manage the raffle pool:

```bash
# Generate a new wallet keypair
solana-keygen new --outfile ~/.config/solana/creator-wallet.json

# Get the public key
solana-keygen pubkey ~/.config/solana/creator-wallet.json
```

**Save the public key** - you'll need it for environment variables.

### Fund the Wallet

The creator wallet needs SOL for:
- Transaction fees for winner payouts (~0.000005 SOL per transaction)
- Initial pool funding (if not using creator fees)

**Recommended minimum:** 0.1 SOL for testing, 1+ SOL for production

```bash
# Check balance
solana balance YOUR_CREATOR_PUBKEY

# Fund via transfer from another wallet or exchange
```

---

## Environment Variables

### Step 1: Copy Example File

```bash
cp .env.example .env
```

### Step 2: Configure Variables

Edit `.env` with your actual values:

```bash
# ============================================================================
# Supabase Configuration
# ============================================================================
VUE_APP_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VUE_APP_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================================================
# Token Configuration
# ============================================================================
# Your token's mint address on Solana
VUE_APP_RAINDR0P_TOKEN_MINT=YOUR_TOKEN_MINT_ADDRESS

# Link to your token on pump.fun
VUE_APP_PUMP_FUN_URL=https://pump.fun/coin/YOUR_TOKEN_MINT_ADDRESS

# ============================================================================
# Solana Configuration
# ============================================================================
# Your creator wallet public key
CREATOR_PUBKEY=YOUR_CREATOR_WALLET_PUBKEY

# Helius RPC URL (recommended for reliability)
RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY

# Helius API key for balance/holdings checks
VUE_APP_HELIUS_API_KEY=YOUR_HELIUS_API_KEY

# ============================================================================
# PumpPortal Configuration
# ============================================================================
# API key for claiming creator fees from pump.fun
PUMPPORTAL_API_KEY=YOUR_PUMPPORTAL_API_KEY

# ============================================================================
# Burn Wallet Configuration
# ============================================================================
# Wallet where tokens are sent to be burned
VUE_APP_BURN_WALLET=YOUR_BURN_WALLET_ADDRESS

# ============================================================================
# Maintenance Mode
# ============================================================================
# Password for accessing site during maintenance
VUE_APP_MAINTENANCE_PASSWORD=your_secure_password_here

# ============================================================================
# Development Settings
# ============================================================================
VUE_APP_ENV=production
```

### Where to Find Each Value

| Variable | How to Get It |
|----------|---------------|
| `VUE_APP_SUPABASE_URL` | Supabase Dashboard > Settings > API > Project URL |
| `VUE_APP_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API > Project API keys > `anon` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API > Project API keys > `service_role` key (keep secret!) |
| `VUE_APP_RAINDR0P_TOKEN_MINT` | Your token's mint address from pump.fun |
| `CREATOR_PUBKEY` | Output from `solana-keygen pubkey` command |
| `VUE_APP_HELIUS_API_KEY` | [Get API key from Helius Dashboard](https://dev.helius.xyz/dashboard/app) |
| `PUMPPORTAL_API_KEY` | Request from [PumpPortal Documentation](https://pumpportal.fun/docs) |

---

## Edge Functions Deployment

RainDr0p uses Supabase Edge Functions for all backend logic.

### Step 1: Link Supabase Project

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

You'll be prompted to log in to Supabase via browser.

### Step 2: Set Edge Function Secrets

Edge functions need access to your environment variables:

```bash
# Set all secrets at once
npx supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" \
  CREATOR_PUBKEY="your_creator_pubkey" \
  RPC_URL="your_rpc_url" \
  PUMPPORTAL_API_KEY="your_pumpportal_api_key"
```

**Or set them one by one:**

```bash
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
npx supabase secrets set CREATOR_PUBKEY="your_creator_pubkey"
npx supabase secrets set RPC_URL="your_rpc_url"
npx supabase secrets set PUMPPORTAL_API_KEY="your_pumpportal_api_key"
```

### Step 3: Deploy Edge Functions

Deploy all functions:

```bash
npx supabase functions deploy join-pool
npx supabase functions deploy start-new-pool
npx supabase functions deploy close-and-draw
npx supabase functions deploy payout-winners
npx supabase functions deploy claim-twitter-bonus
npx supabase functions deploy claim-creator-fee
npx supabase functions deploy check-maintenance-password
```

**Or deploy all at once:**

```bash
for func in join-pool start-new-pool close-and-draw payout-winners claim-twitter-bonus claim-creator-fee check-maintenance-password; do
  npx supabase functions deploy $func
done
```

### Step 4: Verify Deployment

```bash
npx supabase functions list
```

You should see all 7 functions with status "deployed".

---

## Frontend Setup

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build for Production

```bash
npm run build
```

This creates optimized files in the `dist/` directory.

### Step 3: Deploy Frontend

You can deploy to:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)
- **Supabase Storage**: Upload to storage bucket
- **Your own server**: Copy `dist/` contents

### Step 4: Configure CORS (if needed)

If frontend and backend are on different domains, update Supabase CORS settings:

1. Go to **Settings > API**
2. Add your frontend domain to **CORS Allowed Origins**

---

## Testing

### Test Database Connection

```bash
psql "YOUR_CONNECTION_STRING" -c "SELECT * FROM schema_version;"
```

Expected output:
```
 version |        applied_at         |                    description
---------+---------------------------+---------------------------------------------------
 1.0.0   | 2025-11-08 18:25:00+00    | Initial schema with all core tables and features
```

### Test Edge Functions

```bash
# Test maintenance password check
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-maintenance-password \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password": "test123"}'
```

### Run Development Server

```bash
npm run serve
```

Visit [http://localhost:8080](http://localhost:8080) to test the frontend.

---

## Troubleshooting

### Database Schema Fails to Apply

**Problem:** `psql` command fails with authentication error

**Solution:**
- Verify your database password is correct
- Make sure you replaced `[YOUR-PASSWORD]` in the connection string
- Try resetting database password in Supabase Dashboard

---

### Edge Functions Return 401 Unauthorized

**Problem:** Functions can't access database

**Solution:**
```bash
# Verify secrets are set
npx supabase secrets list

# Re-set the service role key
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="your_actual_key"
```

---

### Winners Not Receiving Payouts

**Problem:** `payout-winners` function fails

**Possible causes:**
1. Creator wallet has insufficient SOL balance
2. Creator wallet private key not set correctly
3. RPC endpoint is rate-limited

**Solution:**
```bash
# Check wallet balance
solana balance YOUR_CREATOR_PUBKEY

# Fund wallet if needed
# Verify RPC_URL in edge function secrets
npx supabase secrets list | grep RPC_URL
```

---

### "No open pool" error when joining

**Problem:** Pool not starting automatically

**Solution:**
1. Check `system_settings` table: `creator_fees_enabled` should be `'true'`
2. Manually trigger pool creation:
   ```bash
   curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/start-new-pool \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

---

## Next Steps

Once setup is complete:

1. **Test the full flow:**
   - Create a test wallet with $10+ of your token
   - Join the raffle pool
   - Wait for 30-minute timer to complete
   - Verify winner selection and payout

2. **Monitor your application:**
   - Supabase Dashboard > Database > Table Editor
   - Check `rain_pools` for pool history
   - Check `creator_fee_claims` for fee collection

3. **Customize for your token:**
   - Update branding in frontend (`src/assets/`)
   - Modify pool duration in `start-new-pool` function
   - Adjust ticket tiers in `join-pool` function

---

## Support

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/raindr0p/issues)
- **Documentation:** [README.md](./README.md)
- **Supabase Docs:** [docs.supabase.com](https://docs.supabase.com)

---

## Security Considerations

- 🔐 **Never commit `.env` file** - it contains sensitive keys
- 🔐 **Keep `service_role` key secret** - it has full database access
- 🔐 **Rotate keys regularly** - especially if exposed
- 🔐 **Use environment-specific keys** - separate dev/prod Supabase projects
- 🔐 **Monitor edge function logs** - watch for suspicious activity
- 🔐 **Set up database backups** - Supabase Dashboard > Database > Backups

Happy launching! 🎉
