#!/usr/bin/env node

/**
 * Admin RainPool Control Script
 *
 * Usage:
 * node admin-rainpool.js pause [reason]          - Pause the rain pool
 * node admin-rainpool.js resume                  - Resume the rain pool
 * node admin-rainpool.js status                  - Check current status
 * node admin-rainpool.js maintenance on [msg]    - Enable maintenance mode
 * node admin-rainpool.js maintenance off         - Disable maintenance mode
 * node admin-rainpool.js maintenance status      - Check maintenance status
 * node admin-rainpool.js maintenance reset-ip IP - Reset lockout for IP
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL
const supabaseAnonKey = process.env.VUE_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   VUE_APP_SUPABASE_URL and VUE_APP_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function ensureSystemSettingsTable() {
  const { error } = await supabase
    .from('system_settings')
    .select('key')
    .limit(1)

  if (error && error.code === '42P01') { // Table doesn't exist
    console.log('📋 Creating system_settings table...')
    
    const { error: createError } = await supabase.rpc('create_system_settings_table', {})
    
    if (createError) {
      console.error('❌ Failed to create system_settings table:', createError.message)
      console.log('\n🔧 Please run this SQL in your Supabase dashboard:')
      console.log(`
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `)
      process.exit(1)
    }
  }
}

async function pauseRainPool(reason = 'Admin paused') {
  try {
    await ensureSystemSettingsTable()
    
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'rain_pool_paused',
        value: 'true',
        description: `Rain Pool paused: ${reason}`
      }, {
        onConflict: 'key'
      })
      .select()

    if (error) {
      console.error('❌ Failed to pause rain pool:', error.message)
      return false
    }

    console.log('⏸️  Rain Pool has been PAUSED')
    console.log(`📝 Reason: ${reason}`)
    console.log('🕐 Timestamp:', new Date().toISOString())
    return true
  } catch (error) {
    console.error('❌ Error pausing rain pool:', error.message)
    return false
  }
}

async function resumeRainPool() {
  try {
    await ensureSystemSettingsTable()
    
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'rain_pool_paused',
        value: 'false',
        description: 'Rain Pool resumed by admin'
      }, {
        onConflict: 'key'
      })
      .select()

    if (error) {
      console.error('❌ Failed to resume rain pool:', error.message)
      return false
    }

    console.log('▶️  Rain Pool has been RESUMED')
    console.log('🕐 Timestamp:', new Date().toISOString())
    return true
  } catch (error) {
    console.error('❌ Error resuming rain pool:', error.message)
    return false
  }
}

async function checkStatus() {
  try {
    await ensureSystemSettingsTable()
    
    const { data: systemSettings, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'rain_pool_paused')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Failed to check status:', error.message)
      return
    }

    const isPaused = systemSettings?.value === 'true'
    
    console.log('📊 Rain Pool Status:')
    console.log(`   Status: ${isPaused ? '⏸️  PAUSED' : '▶️  RUNNING'}`)
    
    if (systemSettings) {
      console.log(`   Description: ${systemSettings.description || 'No description'}`)
      console.log(`   Last Updated: ${new Date(systemSettings.updated_at).toLocaleString()}`)
    } else {
      console.log('   No pause setting found (default: RUNNING)')
    }
    
  } catch (error) {
    console.error('❌ Error checking status:', error.message)
  }
}

// ============= MAINTENANCE MODE FUNCTIONS =============

async function enableMaintenanceMode(message) {
  try {
    await ensureSystemSettingsTable()

    const customMessage = message || "Site is temporarily down for maintenance. We'll be back soon!"

    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'maintenance_mode',
        value: 'true',
        description: 'Maintenance mode enabled by admin'
      }, {
        onConflict: 'key'
      })

    if (error) {
      console.error('❌ Failed to enable maintenance mode:', error.message)
      return false
    }

    // Update maintenance message
    const { error: msgError } = await supabase
      .from('system_settings')
      .upsert({
        key: 'maintenance_message',
        value: customMessage,
        description: 'Maintenance screen message'
      }, {
        onConflict: 'key'
      })

    if (msgError) {
      console.error('⚠️  Warning: Failed to update message:', msgError.message)
    }

    console.log('🔧 Maintenance Mode ENABLED')
    console.log(`📝 Message: ${customMessage}`)
    console.log('🕐 Timestamp:', new Date().toISOString())
    console.log('')
    console.log('💡 Site is now in maintenance mode.')
    console.log('   Users will see the maintenance screen.')
    console.log('   You can access with the MAINTENANCE_PASSWORD from .env')
    return true
  } catch (error) {
    console.error('❌ Error enabling maintenance mode:', error.message)
    return false
  }
}

async function disableMaintenanceMode() {
  try {
    await ensureSystemSettingsTable()

    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key: 'maintenance_mode',
        value: 'false',
        description: 'Maintenance mode disabled by admin'
      }, {
        onConflict: 'key'
      })

    if (error) {
      console.error('❌ Failed to disable maintenance mode:', error.message)
      return false
    }

    console.log('✅ Maintenance Mode DISABLED')
    console.log('🕐 Timestamp:', new Date().toISOString())
    console.log('')
    console.log('💡 Site is now accessible to everyone.')
    return true
  } catch (error) {
    console.error('❌ Error disabling maintenance mode:', error.message)
    return false
  }
}

async function checkMaintenanceStatus() {
  try {
    await ensureSystemSettingsTable()

    const { data: modeData } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'maintenance_mode')
      .single()

    const { data: msgData } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'maintenance_message')
      .single()

    const isEnabled = modeData?.value === 'true'

    console.log('🔧 Maintenance Mode Status:')
    console.log(`   Status: ${isEnabled ? '🔴 ENABLED' : '🟢 DISABLED'}`)

    if (isEnabled && msgData) {
      console.log(`   Message: ${msgData.value}`)
      console.log(`   Last Updated: ${new Date(modeData.updated_at).toLocaleString()}`)
    }

    // Check locked IPs
    const { data: lockedIPs, error } = await supabase
      .from('maintenance_attempts')
      .select('ip_address, attempt_count, locked_until')
      .not('locked_until', 'is', null)
      .gt('locked_until', new Date().toISOString())

    if (error) {
      console.error('⚠️  Warning: Could not fetch locked IPs:', error.message)
    } else if (lockedIPs && lockedIPs.length > 0) {
      console.log('')
      console.log('🔒 Locked IPs:')
      lockedIPs.forEach(ip => {
        const unlockTime = new Date(ip.locked_until)
        const minutesLeft = Math.ceil((unlockTime - new Date()) / (1000 * 60))
        console.log(`   ${ip.ip_address} - locked for ${minutesLeft} more min`)
      })
    }

  } catch (error) {
    console.error('❌ Error checking maintenance status:', error.message)
  }
}

async function resetIPLockout(ipAddress) {
  try {
    if (!ipAddress) {
      console.error('❌ IP address is required')
      console.log('Usage: node admin-rainpool.js maintenance reset-ip <IP_ADDRESS>')
      return false
    }

    const { error } = await supabase
      .from('maintenance_attempts')
      .delete()
      .eq('ip_address', ipAddress)

    if (error) {
      console.error('❌ Failed to reset IP lockout:', error.message)
      return false
    }

    console.log(`✅ Lockout reset for IP: ${ipAddress}`)
    console.log('🕐 Timestamp:', new Date().toISOString())
    return true
  } catch (error) {
    console.error('❌ Error resetting IP lockout:', error.message)
    return false
  }
}

// Main execution
async function main() {
  const command = process.argv[2]
  const subCommand = process.argv[3]

  switch (command) {
    case 'pause':
      const reason = process.argv.slice(3).join(' ') || 'Admin paused'
      await pauseRainPool(reason)
      break

    case 'resume':
      await resumeRainPool()
      break

    case 'status':
      await checkStatus()
      break

    case 'maintenance':
      switch (subCommand) {
        case 'on':
          const message = process.argv.slice(4).join(' ')
          await enableMaintenanceMode(message)
          break

        case 'off':
          await disableMaintenanceMode()
          break

        case 'status':
          await checkMaintenanceStatus()
          break

        case 'reset-ip':
          const ipAddress = process.argv[4]
          await resetIPLockout(ipAddress)
          break

        default:
          console.log('❌ Invalid maintenance command')
          console.log('')
          console.log('Usage:')
          console.log('  node admin-rainpool.js maintenance on [message]')
          console.log('  node admin-rainpool.js maintenance off')
          console.log('  node admin-rainpool.js maintenance status')
          console.log('  node admin-rainpool.js maintenance reset-ip <IP>')
          break
      }
      break

    default:
      console.log('🎮 Rain Pool Admin Control')
      console.log('')
      console.log('Rain Pool Commands:')
      console.log('  pause [reason]              - Pause the rain pool')
      console.log('  resume                      - Resume the rain pool')
      console.log('  status                      - Check rain pool status')
      console.log('')
      console.log('Maintenance Mode Commands:')
      console.log('  maintenance on [message]    - Enable maintenance mode')
      console.log('  maintenance off             - Disable maintenance mode')
      console.log('  maintenance status          - Check maintenance status')
      console.log('  maintenance reset-ip <IP>   - Reset IP lockout')
      console.log('')
      console.log('Examples:')
      console.log('  node admin-rainpool.js pause "Emergency maintenance"')
      console.log('  node admin-rainpool.js maintenance on "Upgrading servers"')
      console.log('  node admin-rainpool.js maintenance status')
      console.log('  node admin-rainpool.js maintenance reset-ip 192.168.1.1')
      break
  }
}

main().catch(console.error)