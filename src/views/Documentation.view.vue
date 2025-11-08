<template>
  <div class="DocsView">
    <!-- Sidebar Navigation -->
    <aside class="DocsView-sidebar">
      <div class="DocsView-sidebarHeader">
        <router-link to="/" class="DocsView-backLink">
          <svg class="DocsView-backIcon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back to RainDr0p
        </router-link>
        <h2 class="DocsView-sidebarTitle">📚 Documentation</h2>
      </div>

      <nav class="DocsView-nav">
        <div class="DocsView-navSection">
          <h3 class="DocsView-navSectionTitle">Getting Started</h3>
          <ul class="DocsView-navList">
            <li><a href="#introduction" @click="scrollToSection" :class="{ active: activeSection === 'introduction' }">Introduction</a></li>
            <li><a href="#how-it-works" @click="scrollToSection" :class="{ active: activeSection === 'how-it-works' }">How RainDr0p Works</a></li>
          </ul>
        </div>

        <div class="DocsView-navSection">
          <h3 class="DocsView-navSectionTitle">Core Concepts</h3>
          <ul class="DocsView-navList">
            <li><a href="#pool-lifecycle" @click="scrollToSection" :class="{ active: activeSection === 'pool-lifecycle' }">Pool Lifecycle</a></li>
            <li><a href="#joining" @click="scrollToSection" :class="{ active: activeSection === 'joining' }">Joining a Pool</a></li>
            <li><a href="#tiered-entry" @click="scrollToSection" :class="{ active: activeSection === 'tiered-entry' }">Tiered Entry System</a></li>
            <li><a href="#winner-selection" @click="scrollToSection" :class="{ active: activeSection === 'winner-selection' }">Winner Selection</a></li>
            <li><a href="#provably-fair" @click="scrollToSection" :class="{ active: activeSection === 'provably-fair' }">Provably Fair System</a></li>
          </ul>
        </div>

        <div class="DocsView-navSection">
          <h3 class="DocsView-navSectionTitle">Advanced</h3>
          <ul class="DocsView-navList">
            <li><a href="#market-cap" @click="scrollToSection" :class="{ active: activeSection === 'market-cap' }">Market Cap Integration</a></li>
            <li><a href="#rewards" @click="scrollToSection" :class="{ active: activeSection === 'rewards' }">Reward Distribution</a></li>
            <li><a href="#tokenomics" @click="scrollToSection" :class="{ active: activeSection === 'tokenomics' }">Deflationary Tokenomics</a></li>
          </ul>
        </div>

        <div class="DocsView-navSection">
          <h3 class="DocsView-navSectionTitle">Help</h3>
          <ul class="DocsView-navList">
            <li><a href="#faq" @click="scrollToSection" :class="{ active: activeSection === 'faq' }">FAQ</a></li>
            <li><a href="#troubleshooting" @click="scrollToSection" :class="{ active: activeSection === 'troubleshooting' }">Troubleshooting</a></li>
          </ul>
        </div>
      </nav>

      <div class="DocsView-sidebarFooter">
        <p class="DocsView-version">Version 1.0</p>
        <p class="DocsView-updated">Updated Oct 2025</p>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="DocsView-main">
      <div class="DocsView-content">

        <!-- Introduction -->
        <section id="introduction" class="DocsView-section">
          <h1 class="DocsView-pageTitle">🌧️ Welcome to RainDr0p</h1>
          <p class="DocsView-lead">A community-driven reward system built on the Solana blockchain where users participate in hourly "rain pools" with SOL prizes distributed randomly to lucky winners. Pool rewards are dynamically funded from PumpFun creator fees, fetched every 7 minutes.</p>

          <div class="DocsView-cards">
            <div class="DocsView-card">
              <div class="DocsView-cardIcon">⏱️</div>
              <h3>Hourly Pools</h3>
              <p>New pool every 60 minutes</p>
            </div>
            <div class="DocsView-card">
              <div class="DocsView-cardIcon">🎲</div>
              <h3>Random Winners</h3>
              <p>Fair, randomized drawing process</p>
            </div>
            <div class="DocsView-card">
              <div class="DocsView-cardIcon">📈</div>
              <h3>Market-Based Winners</h3>
              <p>Winner count scales with market cap</p>
            </div>
            <div class="DocsView-card">
              <div class="DocsView-cardIcon">💰</div>
              <h3>Dynamic Rewards</h3>
              <p>Pool funded from PumpFun creator fees</p>
            </div>
          </div>
        </section>

        <!-- How It Works -->
        <section id="how-it-works" class="DocsView-section">
          <h1>How RainDr0p Works</h1>
          <p>RainDr0p operates through a simple 4-step process every hour:</p>

          <div class="DocsView-steps">
            <div class="DocsView-step">
              <div class="DocsView-stepNumber">1</div>
              <div class="DocsView-stepContent">
                <h3>Pool Creation</h3>
                <p>Every hour, a new rain pool is automatically created and funded from PumpFun creator fees (fetched every 7 minutes). Winner count is determined by current market cap.</p>
              </div>
            </div>

            <div class="DocsView-step">
              <div class="DocsView-stepNumber">2</div>
              <div class="DocsView-stepContent">
                <h3>Participation Phase (60 Minutes)</h3>
                <p>Users connect their Solana wallet and join the pool (one entry per wallet). The pool remains open for exactly 60 minutes while participants can join.</p>
              </div>
            </div>

            <div class="DocsView-step">
              <div class="DocsView-stepNumber">3</div>
              <div class="DocsView-stepContent">
                <h3>Pool Closure & Drawing</h3>
                <p>When the 60-minute timer expires, the pool closes and a random algorithm selects winners. The number of winners depends on the current market cap, and the prize pool is split evenly among all winners.</p>
              </div>
            </div>

            <div class="DocsView-step">
              <div class="DocsView-stepNumber">4</div>
              <div class="DocsView-stepContent">
                <h3>Payout</h3>
                <p>Winners receive their share of SOL from the creator rewards pool directly to their wallets with on-chain transaction signatures for full transparency.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Pool Lifecycle -->
        <section id="pool-lifecycle" class="DocsView-section">
          <h1>Pool Lifecycle</h1>

          <div class="DocsView-badges">
            <span class="DocsView-badge DocsView-badge--success">OPEN</span>
            <span class="DocsView-badgeArrow">→</span>
            <span class="DocsView-badge DocsView-badge--warning">CLOSED</span>
            <span class="DocsView-badgeArrow">→</span>
            <span class="DocsView-badge DocsView-badge--info">COMPLETED</span>
          </div>

          <h2>1. Open Pool</h2>
          <div class="DocsView-callout DocsView-callout--success">
            <strong>Status: OPEN (60 minutes)</strong>
            <p>Users can join the pool during the full 60-minute window. Market cap is tracked in real-time to determine the number of winners for this pool.</p>
          </div>

          <h2>2. Closed Pool</h2>
          <div class="DocsView-callout DocsView-callout--warning">
            <strong>Status: CLOSED</strong>
            <p>After 60 minutes, no more entries are accepted. Winners are selected based on the current market cap tier. The pool amount (from PumpFun creator fees) is distributed among winners.</p>
          </div>

          <h2>3. Completed Pool</h2>
          <div class="DocsView-callout DocsView-callout--info">
            <strong>Status: COMPLETED</strong>
            <p>All SOL payouts have been processed. Transaction signatures are stored for verification. A new 60-minute pool begins immediately.</p>
          </div>

          <h3>Automatic Pool Management</h3>
          <ul>
            <li>New pool starts automatically every hour</li>
            <li>Prevents multiple open pools from existing simultaneously</li>
            <li>Fetches market cap at pool creation to determine winner count</li>
            <li>Tracks market cap updates every 6 minutes during active pools</li>
            <li>Fetches PumpFun creator fees every 7 minutes to fund pool rewards</li>
          </ul>
        </section>

        <!-- Joining a Pool -->
        <section id="joining" class="DocsView-section">
          <h1>Joining a Pool</h1>

          <h2>Eligibility Requirements</h2>
          <p>To join a RainDr0p pool, you must:</p>
          <ul>
            <li><strong>Connect a Solana Wallet</strong> - Currently supports Phantom wallet</li>
            <li><strong>Not Already Joined</strong> - Each wallet can only join a pool once</li>
            <li><strong>Pool Not Full</strong> - If max_participants is set, spots are first-come, first-served</li>
          </ul>

          <h2>The Join Process</h2>
          <div class="DocsView-code">
            <pre><code>User clicks "Connect Wallet"
→ Phantom opens
→ User approves connection
→ System verifies eligibility
→ User joins pool
→ Participant record created
→ Timer counts down to drawing</code></pre>
          </div>
        </section>

        <!-- Tiered Entry System -->
        <section id="tiered-entry" class="DocsView-section">
          <h1>Tiered Entry System</h1>

          <h2>Hybrid Model Overview</h2>
          <p>RainDr0p uses a tiered entry system that rewards holders while keeping the giveaway accessible to everyone. The system combines free base entries with holder bonuses and optional burn boosts, creating deflationary pressure while maintaining inclusivity.</p>

          <div class="DocsView-callout DocsView-callout--success">
            <strong>Key Principles</strong>
            <ul>
              <li><strong>Free Base Entry</strong> - Everyone gets at least 1 free ticket by holding minimum DROP tokens</li>
              <li><strong>Holder Bonuses</strong> - Bigger holders automatically get more free tickets</li>
              <li><strong>Optional Burn Boost</strong> - Burn tokens for extra tickets and increase your odds</li>
            </ul>
          </div>

          <h2>Tier Breakdown: Free Tickets</h2>
          <p>Free tickets are automatically awarded based on the USD value of DROP tokens held in your wallet:</p>

          <div class="DocsView-table">
            <table>
              <thead>
                <tr>
                  <th>Holdings (USD Value)</th>
                  <th>Free Tickets</th>
                  <th>Benefits</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>$10 - $49</td>
                  <td>1 ticket</td>
                  <td>Base entry, eligible for all pools</td>
                </tr>
                <tr>
                  <td>$50 - $99</td>
                  <td>2 tickets</td>
                  <td>Double odds vs. base tier</td>
                </tr>
                <tr>
                  <td>$100 - $499</td>
                  <td>3 tickets</td>
                  <td>Triple odds vs. base tier</td>
                </tr>
                <tr>
                  <td>$500+</td>
                  <td>5 tickets</td>
                  <td>5x odds vs. base tier</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="DocsView-callout DocsView-callout--info">
            <strong>Dynamic Value Tracking</strong>
            <p>Your tier is determined by the current USD value of your DROP holdings. As token price changes, your tier may automatically adjust. Holdings are checked when you join each pool.</p>
          </div>

          <h2>Burn Boost: Extra Tickets</h2>
          <p>Want to increase your odds even further? You can optionally burn DROP tokens to receive additional tickets for the current pool. Burned tokens are permanently removed from circulation, creating deflationary pressure.</p>

          <div class="DocsView-table">
            <table>
              <thead>
                <tr>
                  <th>Burn Amount (USD)</th>
                  <th>Extra Tickets</th>
                  <th>Cost Per Ticket</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>$2</td>
                  <td>+1 ticket</td>
                  <td>$2.00</td>
                </tr>
                <tr>
                  <td>$5</td>
                  <td>+3 tickets</td>
                  <td>$1.67</td>
                </tr>
                <tr>
                  <td>$10</td>
                  <td>+7 tickets</td>
                  <td>$1.43</td>
                </tr>
                <tr>
                  <td>Custom Amount</td>
                  <td>Scales accordingly</td>
                  <td>Better rate for larger burns</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="DocsView-callout DocsView-callout--warning">
            <strong>Burn Boost Is Optional</strong>
            <p>You never have to burn tokens to participate. Free tickets from holding are always available. Burn boost is purely optional for those who want to increase their odds in a specific pool.</p>
          </div>

          <h2>Example Scenarios</h2>

          <h3>Scenario 1: Small Holder</h3>
          <div class="DocsView-example">
            <p><strong>Holdings:</strong> $15 worth of DROP</p>
            <p><strong>Free Tickets:</strong> 1 ticket (Tier 1)</p>
            <p><strong>Optional Burn Boost:</strong> Burn $5 worth → 3 extra tickets</p>
            <p><strong>Total Entries:</strong> 4 tickets (1 free + 3 from burn)</p>
          </div>

          <h3>Scenario 2: Medium Holder</h3>
          <div class="DocsView-example">
            <p><strong>Holdings:</strong> $150 worth of DROP</p>
            <p><strong>Free Tickets:</strong> 3 tickets (Tier 3)</p>
            <p><strong>Optional Burn Boost:</strong> Burn $10 worth → 7 extra tickets</p>
            <p><strong>Total Entries:</strong> 10 tickets (3 free + 7 from burn)</p>
          </div>

          <h3>Scenario 3: Large Holder (No Burn)</h3>
          <div class="DocsView-example">
            <p><strong>Holdings:</strong> $750 worth of DROP</p>
            <p><strong>Free Tickets:</strong> 5 tickets (Tier 4)</p>
            <p><strong>Optional Burn Boost:</strong> None</p>
            <p><strong>Total Entries:</strong> 5 tickets (all free)</p>
          </div>

          <h2>Why This System Works</h2>
          <ul>
            <li><strong>Rewards Loyalty</strong> - Bigger holders get more free tickets automatically</li>
            <li><strong>Deflationary Pressure</strong> - Burn boost permanently removes tokens from supply</li>
            <li><strong>Inclusive</strong> - Everyone can participate with just $10 worth of tokens</li>
            <li><strong>Voluntary Burns</strong> - No forced burning, only optional boosts</li>
            <li><strong>Flexible Strategy</strong> - Holders choose when to boost their odds</li>
          </ul>

          <div class="DocsView-callout DocsView-callout--success">
            <strong>Benefits Everyone</strong>
            <p>This hybrid model creates a win-win scenario: small holders can still participate and win, larger holders get rewarded with more free tickets, and optional burns reduce token supply which can benefit all holders long-term.</p>
          </div>
        </section>

        <!-- Winner Selection -->
        <section id="winner-selection" class="DocsView-section">
          <h1>Winner Selection</h1>

          <h2>Market Cap-Based Winner Scaling</h2>
          <p>The number of winners is determined by the token's current market cap at the time the pool closes. As the market cap grows, more winners share in the hourly Rain!</p>

          <div class="DocsView-table">
            <table>
              <thead>
                <tr>
                  <th>Market Cap</th>
                  <th>Number of Winners</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>$5,000 - $99,999</td>
                  <td>1 winner</td>
                </tr>
                <tr>
                  <td>$100,000 - $499,999</td>
                  <td>2 winners</td>
                </tr>
                <tr>
                  <td>$500,000 - $999,999</td>
                  <td>5 winners</td>
                </tr>
                <tr>
                  <td>$1,000,000 - $1,999,999</td>
                  <td>10 winners</td>
                </tr>
                <tr>
                  <td>$2,000,000+</td>
                  <td>20 winners (10 per million)</td>
                </tr>
                <tr>
                  <td>$3,000,000+</td>
                  <td>30 winners (10 per million)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="DocsView-callout DocsView-callout--info">
            <strong>Growing Community Rewards</strong>
            <p>For every million dollars in market cap beyond $1M, another 10 winners join the hourly Rain. This means as the token grows, more community members benefit!</p>
          </div>

          <h2>The Drawing Algorithm</h2>
          <p>Once the winner count is determined by market cap, the system:</p>
          <ol>
            <li><strong>Fetch All Participants</strong> - Query everyone who joined the pool during the 60-minute window</li>
            <li><strong>Check Market Cap</strong> - Determine winner count based on current market cap tier</li>
            <li><strong>Randomization</strong> - Shuffle participants using a fair random algorithm</li>
            <li><strong>Select Winners</strong> - Pick the determined number of winners randomly</li>
            <li><strong>Calculate Prizes</strong> - Split the pool amount (from creator fees) evenly among all winners</li>
          </ol>

          <div class="DocsView-code">
            <pre><code>// Determine winner count based on market cap
const winnerCount = getWinnerCountByMarketCap(currentMarketCap)

// Shuffle participants randomly
const shuffled = [...participants].sort(() => 0.5 - Math.random())

// Select winners based on market cap tier
const actualWinnerCount = Math.min(winnerCount, participants.length)
const winners = shuffled.slice(0, actualWinnerCount)

// Split pool amount evenly (from creator fees)
const rewardPerWinner = poolAmount / actualWinnerCount</code></pre>
          </div>

          <h2>Prize Calculation</h2>
          <p>The pool amount (from PumpFun creator fees) is split evenly among all winners based on market cap tier. The more winners, the smaller each individual share.</p>
        </section>

        <!-- Provably Fair System -->
        <section id="provably-fair" class="DocsView-section">
          <h1>🔒 Provably Fair System</h1>

          <p>RainDr0p uses a provably fair system that ensures complete transparency and verifiability in how winners are selected. Every draw can be independently verified using cryptographic evidence.</p>

          <div class="DocsView-callout DocsView-callout--success">
            <strong>What is "Provably Fair"?</strong>
            <p>Provably fair means the drawing process is transparent, deterministic, and impossible to manipulate. You don't have to trust us—you can verify the fairness yourself using the proof data we provide for every draw.</p>
          </div>

          <h2>How Our System Works</h2>

          <h3>1. Efficient Weighted Selection</h3>
          <p>Instead of creating massive duplicate arrays (which would be inefficient and memory-intensive), we use a cumulative weighted picker algorithm:</p>

          <div class="DocsView-code">
            <pre><code>// Calculate total tickets from all participants
totalTickets = sum(all participants' tickets)

// Generate cryptographically secure random number
randomValue = crypto.getRandomValues() / 2**32  // Range: [0, 1)

// Pick winner using cumulative distribution
targetValue = randomValue * totalTickets
cumulativeSum = 0

for each participant:
  cumulativeSum += participant.tickets
  if targetValue &lt; cumulativeSum:
    return participant as winner  // Found!</code></pre>
          </div>

          <h3>2. Cryptographically Secure Randomness</h3>
          <p>We use <code>crypto.getRandomValues()</code> for true entropy, not predictable pseudo-random numbers:</p>

          <div class="DocsView-table">
            <table>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Security</th>
                  <th>RainDr0p Uses</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>Math.random()</code></td>
                  <td>❌ Predictable, not secure</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td><code>crypto.getRandomValues()</code></td>
                  <td>✅ Cryptographically secure, uses OS entropy</td>
                  <td>Yes</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="DocsView-callout DocsView-callout--info">
            <strong>Why This Matters</strong>
            <p><code>crypto.getRandomValues()</code> uses your operating system's entropy source (hardware randomness from CPU, mouse movements, network activity, etc.), making it impossible to predict or manipulate the outcome.</p>
          </div>

          <h3>3. Proof of Fairness Data</h3>
          <p>Every draw generates and logs proof data that can be used to verify the drawing process:</p>

          <div class="DocsView-code">
            <pre><code>{
  "seed": "a3f5e9d2c1b8...",           // 32-byte cryptographic seed
  "timestamp": "2025-01-15T10:30:45Z", // Exact draw time
  "poolId": "abc-123",                 // Pool identifier
  "totalParticipants": 10,             // Number of participants
  "totalTickets": 45,                  // Total tickets in pool
  "participantsSnapshot": [
    {
      "wallet": "7yZ2e...nVFk",        // Partial wallet address
      "tickets": 5                     // Their ticket count
    },
    // ... more participants
  ],
  "winners": [
    {
      "wallet": "7yZ2e...nVFk",        // Winner's partial address
      "index": 0                       // Position in participants array
    }
  ]
}</code></pre>
          </div>

          <h2>What Can Users Verify?</h2>

          <h3>1. Randomness is Cryptographically Secure</h3>
          <ul>
            <li>The seed is generated using <code>crypto.getRandomValues()</code></li>
            <li>32 bytes of entropy (256 bits) = 2^256 possible outcomes</li>
            <li>Impossible to predict or manipulate</li>
          </ul>

          <h3>2. Winner Selection is Transparent</h3>
          <ul>
            <li>View exactly how many tickets each participant had</li>
            <li>See the total ticket pool at time of drawing</li>
            <li>Verify that the winner was selected based on their weighted odds</li>
          </ul>

          <h3>3. Participant Snapshot Cannot be Changed</h3>
          <ul>
            <li>All participants and their ticket counts are locked at pool close</li>
            <li>Snapshot is generated before randomization begins</li>
            <li>No one can manipulate the participant list after pool closes</li>
          </ul>

          <h3>4. Timing is Verifiable</h3>
          <ul>
            <li>Timestamp shows exact time of drawing</li>
            <li>Pool closes automatically after 60 minutes</li>
            <li>Drawing happens immediately upon pool closure</li>
          </ul>

          <h2>How to Verify a Draw Yourself</h2>

          <div class="DocsView-steps">
            <div class="DocsView-step">
              <div class="DocsView-stepNumber">1</div>
              <div class="DocsView-stepContent">
                <h3>Check Server Logs (if available)</h3>
                <p>The proof of fairness data is logged in our server console for every draw. This includes the seed, timestamp, and full participant snapshot.</p>
              </div>
            </div>

            <div class="DocsView-step">
              <div class="DocsView-stepNumber">2</div>
              <div class="DocsView-stepContent">
                <h3>Review Participant List</h3>
                <p>Before the pool closes, you can see all participants and their ticket counts on the Rain Pool page. This list is locked when the pool closes.</p>
              </div>
            </div>

            <div class="DocsView-step">
              <div class="DocsView-stepNumber">3</div>
              <div class="DocsView-stepContent">
                <h3>Verify Winner Odds</h3>
                <p>Calculate: winner's tickets ÷ total tickets = their probability of winning. Compare this to the actual selection to verify it aligns with expected odds over multiple draws.</p>
              </div>
            </div>

            <div class="DocsView-step">
              <div class="DocsView-stepNumber">4</div>
              <div class="DocsView-stepContent">
                <h3>Check On-Chain Transactions</h3>
                <p>All winner payouts are recorded on the Solana blockchain. Search the winner's wallet on Solscan to verify they received their payout.</p>
              </div>
            </div>
          </div>

          <h2>Example: Calculating Win Probability</h2>

          <div class="DocsView-example">
            <p><strong>Pool Snapshot:</strong></p>
            <ul>
              <li>Alice: 5 tickets</li>
              <li>Bob: 2 tickets</li>
              <li>Charlie: 3 tickets</li>
            </ul>
            <p><strong>Total Tickets:</strong> 10</p>
            <p><strong>Alice's Win Probability:</strong> 5 ÷ 10 = 50%</p>
            <p><strong>Bob's Win Probability:</strong> 2 ÷ 10 = 20%</p>
            <p><strong>Charlie's Win Probability:</strong> 3 ÷ 10 = 30%</p>
            <br>
            <p><strong>Winner Selected:</strong> Alice (wallet: 7yZ2e...nVFk)</p>
            <p><strong>Verification:</strong> Alice had the highest probability (50%) and was selected. Over many draws, Alice should win approximately 50% of the time, Bob 20%, and Charlie 30%.</p>
          </div>

          <h2>Trust Through Transparency</h2>

          <div class="DocsView-callout DocsView-callout--success">
            <strong>No Black Box</strong>
            <p>Unlike traditional lotteries where you must trust the operator, RainDr0p provides full transparency:</p>
            <ul>
              <li>✅ Cryptographic seed proves randomness</li>
              <li>✅ Participant snapshot shows exact odds</li>
              <li>✅ On-chain payouts are publicly verifiable</li>
              <li>✅ Algorithm is documented and deterministic</li>
              <li>✅ Server-side execution prevents client manipulation</li>
            </ul>
          </div>

          <div class="DocsView-callout DocsView-callout--info">
            <strong>Future Enhancement: Public Proof API</strong>
            <p>We're working on a public API endpoint where anyone can fetch the proof-of-fairness data for any historical draw. This will allow independent verification tools and third-party audits.</p>
          </div>
        </section>

        <!-- Market Cap Integration -->
        <section id="market-cap" class="DocsView-section">
          <h1>Market Cap Integration</h1>

          <h2>Real-Time Market Tracking</h2>
          <p>Market cap is the core mechanism that determines how many winners share in each hourly Rain. RainDr0p continuously tracks the RainDr0p token's market capitalization to ensure the winner count accurately reflects the token's growth.</p>

          <h3>How It Works</h3>
          <ol>
            <li><strong>Initial Fetch</strong> - When pool starts, baseline market cap is recorded</li>
            <li><strong>Continuous Updates</strong> - Every 6 minutes, new market data is fetched and updated</li>
            <li><strong>Calculation</strong> - Market Cap = Token Price × Circulating Supply</li>
            <li><strong>Winner Determination</strong> - At pool close, current market cap determines the number of winners</li>
            <li><strong>Storage</strong> - All market cap data stored in rain_pools table for transparency</li>
          </ol>

          <div class="DocsView-table">
            <table>
              <thead>
                <tr>
                  <th>Data Type</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Token Price</td>
                  <td>Moralis Solana Gateway API</td>
                </tr>
                <tr>
                  <td>Token Supply</td>
                  <td>Solana RPC getTokenSupply</td>
                </tr>
                <tr>
                  <td>Market Cap Calculation</td>
                  <td>Price × Supply (real-time)</td>
                </tr>
                <tr>
                  <td>Storage</td>
                  <td>Supabase rain_pools table</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Why Market Cap Matters</h3>
          <ul>
            <li><strong>Determines Winner Count</strong> - Higher market cap = more winners every hour</li>
            <li><strong>Community Growth Incentive</strong> - As token grows, more holders benefit from Rain</li>
            <li><strong>Fair Distribution</strong> - Larger community means more participants can win</li>
            <li><strong>Transparent & Real-Time</strong> - Everyone can see current market cap and expected winner count</li>
          </ul>

          <div class="DocsView-callout DocsView-callout--success">
            <strong>Growth Benefits Everyone</strong>
            <p>The market cap scaling system means that as RainDr0p grows, the entire community benefits. At $1M market cap, 10 winners share the Rain every hour. At $10M, that's 100 winners per hour!</p>
          </div>
        </section>

        <!-- Reward Distribution -->
        <section id="rewards" class="DocsView-section">
          <h1>Reward Distribution</h1>

          <h2>Prize Pool Source: PumpFun Creator Fees</h2>
          <p>RainDr0p pools are funded dynamically from PumpFun creator fees, fetched every 7 minutes. This creates a sustainable, community-driven reward system powered by token trading activity.</p>

          <div class="DocsView-callout DocsView-callout--success">
            <strong>Sustainable Rewards Model</strong>
            <p>50% of creator fees go to the dev wallet (used for marketing, development, and operations). The other 50% is sent to the deployer wallet, which funds pool rewards back to the community. This ensures sustainable, long-term rewards!</p>
          </div>

          <h2>How Prizes Are Calculated</h2>
          <ol>
            <li><strong>Fetch Creator Fees</strong> - Every 7 minutes, PumpFun creator fees are checked and fetched</li>
            <li><strong>Split Fees</strong> - 50% to dev wallet, 50% to deployer wallet (community rewards)</li>
            <li><strong>Determine Winner Count</strong> - Based on current market cap tier</li>
            <li><strong>Calculate Per-Winner Amount</strong> - Pool amount ÷ number of winners</li>
            <li><strong>Distribute Evenly</strong> - Each winner receives an equal share</li>
          </ol>

          <h2>Payout Process</h2>
          <div class="DocsView-steps">
            <div class="DocsView-step">
              <div class="DocsView-stepNumber">1</div>
              <div class="DocsView-stepContent">
                <h3>Winner Recording</h3>
                <p>Winners are recorded in the database with pool_id, wallet_address, and their calculated reward_sol amount from the fixed prize pool.</p>
              </div>
            </div>

            <div class="DocsView-step">
              <div class="DocsView-stepNumber">2</div>
              <div class="DocsView-stepContent">
                <h3>Transaction Processing</h3>
                <p>SOL is transferred from the RainDr0p wallet to each winner's wallet. Transactions are signed and sent to the Solana network.</p>
              </div>
            </div>

            <div class="DocsView-step">
              <div class="DocsView-stepNumber">3</div>
              <div class="DocsView-stepContent">
                <h3>Database Updates</h3>
                <p>Winner records are updated with transaction signatures. Pool is marked as "completed" when all payouts succeed. A new pool begins immediately.</p>
              </div>
            </div>
          </div>

          <div class="DocsView-callout DocsView-callout--info">
            <strong>Full Transparency</strong>
            <p>Winners can verify their payout using the transaction signature on Solana explorers like Solscan or Solana Explorer. All prize transactions are publicly visible on-chain.</p>
          </div>
        </section>

        <!-- Deflationary Tokenomics -->
        <section id="tokenomics" class="DocsView-section">
          <h1>Deflationary Tokenomics</h1>

          <h2>How Burn Boost Creates Deflation</h2>
          <p>The optional burn boost feature permanently removes DROP tokens from circulation, creating deflationary pressure that can benefit all holders over time.</p>

          <div class="DocsView-callout DocsView-callout--success">
            <strong>Voluntary Deflation</strong>
            <p>Unlike forced burn mechanisms, RainDr0p's burn boost is completely optional. Users choose when and how much to burn based on their strategy for a specific pool. This creates organic, sustainable deflation driven by user demand.</p>
          </div>

          <h2>Burn Mechanics</h2>
          <div class="DocsView-steps">
            <div class="DocsView-step">
              <div class="DocsView-stepNumber">1</div>
              <div class="DocsView-stepContent">
                <h3>User Initiates Burn</h3>
                <p>When joining a pool, users can optionally select a burn amount ($2, $5, $10, or custom). The system calculates the equivalent DROP tokens based on current price.</p>
              </div>
            </div>

            <div class="DocsView-step">
              <div class="DocsView-stepNumber">2</div>
              <div class="DocsView-stepContent">
                <h3>Tokens Sent to Burn Address</h3>
                <p>Burned tokens are sent to a verified burn address (null address) where they are permanently inaccessible. No one can ever retrieve or use these tokens.</p>
              </div>
            </div>

            <div class="DocsView-step">
              <div class="DocsView-stepNumber">3</div>
              <div class="DocsView-stepContent">
                <h3>Extra Tickets Awarded</h3>
                <p>User immediately receives their bonus tickets for the current pool. The burn is recorded on-chain and verifiable via Solana explorers.</p>
              </div>
            </div>

            <div class="DocsView-step">
              <div class="DocsView-stepNumber">4</div>
              <div class="DocsView-stepContent">
                <h3>Supply Permanently Reduced</h3>
                <p>Total circulating supply decreases, potentially increasing scarcity and value for remaining holders. The effect compounds over time as more users burn.</p>
              </div>
            </div>
          </div>

          <h2>Long-Term Impact</h2>
          <p>As pools run hourly and users optionally burn tokens to boost their odds, the cumulative effect can be significant:</p>

          <div class="DocsView-table">
            <table>
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Hourly Burns</th>
                  <th>Daily Impact</th>
                  <th>Monthly Impact</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Conservative (10 users burn $5)</td>
                  <td>$50 worth</td>
                  <td>$1,200 worth</td>
                  <td>$36,000 worth</td>
                </tr>
                <tr>
                  <td>Moderate (25 users burn $5)</td>
                  <td>$125 worth</td>
                  <td>$3,000 worth</td>
                  <td>$90,000 worth</td>
                </tr>
                <tr>
                  <td>High Activity (50 users burn $10)</td>
                  <td>$500 worth</td>
                  <td>$12,000 worth</td>
                  <td>$360,000 worth</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="DocsView-callout DocsView-callout--info">
            <strong>Compounding Scarcity</strong>
            <p>As supply decreases, the same USD burn amount removes proportionally more tokens from circulation (assuming stable or increasing price). This creates a compounding deflationary effect over time.</p>
          </div>

          <h2>Benefits for All Holders</h2>
          <ul>
            <li><strong>Reduced Supply</strong> - Fewer tokens in circulation can increase value for all holders</li>
            <li><strong>Organic & Voluntary</strong> - Deflation driven by real user demand, not forced mechanics</li>
            <li><strong>Incentive Alignment</strong> - Users burn because they see value in better pool odds</li>
            <li><strong>Transparent & Verifiable</strong> - All burns are visible on-chain via Solana explorers</li>
            <li><strong>Sustainable Model</strong> - Not dependent on external buy pressure or artificial mechanisms</li>
          </ul>

          <h2>Burn Address Verification</h2>
          <p>All burned tokens are sent to a verified null address where they are permanently inaccessible:</p>
          <div class="DocsView-code">
            <pre><code>Burn Address: 1111111111111111111111111111111111111111111
(Solana null address - no private key exists)</code></pre>
          </div>

          <div class="DocsView-callout DocsView-callout--success">
            <strong>Provably Burned</strong>
            <p>You can verify all burns on Solscan or Solana Explorer by searching for transactions to the null address. Every burn is permanent and publicly verifiable.</p>
          </div>
        </section>

        <!-- FAQ -->
        <section id="faq" class="DocsView-section">
          <h1>Frequently Asked Questions</h1>

          <div class="DocsView-accordion">
            <details class="DocsView-accordionItem">
              <summary class="DocsView-accordionSummary">How long does a pool last?</summary>
              <div class="DocsView-accordionContent">
                <p>Each Rain Pool lasts exactly 60 minutes (1 hour). A new pool starts automatically every hour.</p>
              </div>
            </details>

            <details class="DocsView-accordionItem">
              <summary class="DocsView-accordionSummary">How many winners are there per pool?</summary>
              <div class="DocsView-accordionContent">
                <p>The number of winners depends on the current market cap:</p>
                <ul>
                  <li>$5k - $99k: 1 winner</li>
                  <li>$100k - $499k: 2 winners</li>
                  <li>$500k - $999k: 5 winners</li>
                  <li>$1M+: 10 winners (plus 10 more for each additional $1M)</li>
                </ul>
                <p>If there are fewer participants than the winner count, all participants win!</p>
              </div>
            </details>

            <details class="DocsView-accordionItem">
              <summary class="DocsView-accordionSummary">Where does the prize pool come from?</summary>
              <div class="DocsView-accordionContent">
                <p>Pool rewards are funded from PumpFun creator fees, which are fetched every 7 minutes. 50% goes to the dev wallet (for marketing and development), and 50% goes to the deployer wallet to fund community rewards. This creates a sustainable, trading-driven reward system!</p>
              </div>
            </details>

            <details class="DocsView-accordionItem">
              <summary class="DocsView-accordionSummary">Can I join multiple pools?</summary>
              <div class="DocsView-accordionContent">
                <p>Yes! Once an hourly pool closes, you can join the next one. However, you can only join each individual pool once.</p>
              </div>
            </details>

            <details class="DocsView-accordionItem">
              <summary class="DocsView-accordionSummary">How are winners chosen?</summary>
              <div class="DocsView-accordionContent">
                <p>Winners are selected randomly from all entries (tickets). Each ticket has an equal chance of winning. More tickets = better odds, but everyone with at least 1 ticket has a chance.</p>
              </div>
            </details>

            <details class="DocsView-accordionItem">
              <summary class="DocsView-accordionSummary">How many free tickets do I get?</summary>
              <div class="DocsView-accordionContent">
                <p>Free tickets are based on your DROP holdings (USD value):</p>
                <ul>
                  <li>$10-49: 1 ticket</li>
                  <li>$50-99: 2 tickets</li>
                  <li>$100-499: 3 tickets</li>
                  <li>$500+: 5 tickets</li>
                </ul>
                <p>Your holdings are checked each time you join a pool.</p>
              </div>
            </details>

            <details class="DocsView-accordionItem">
              <summary class="DocsView-accordionSummary">What is burn boost?</summary>
              <div class="DocsView-accordionContent">
                <p>Burn boost is an optional feature that lets you burn DROP tokens to get extra tickets for the current pool. For example: burn $5 worth = 3 extra tickets. Burned tokens are permanently removed from circulation.</p>
              </div>
            </details>

            <details class="DocsView-accordionItem">
              <summary class="DocsView-accordionSummary">Do I have to burn tokens to participate?</summary>
              <div class="DocsView-accordionContent">
                <p>No! You always get free tickets based on your holdings. Burn boost is purely optional for those who want to increase their odds in a specific pool. You can participate in every pool without ever burning a single token.</p>
              </div>
            </details>

            <details class="DocsView-accordionItem">
              <summary class="DocsView-accordionSummary">How does burning tokens help me?</summary>
              <div class="DocsView-accordionContent">
                <p>Burning gives you extra tickets for better odds in the current pool. It also reduces total supply, which can potentially increase token value for all holders long-term. It's a strategic choice: boost your odds now while creating deflationary pressure.</p>
              </div>
            </details>

            <details class="DocsView-accordionItem">
              <summary class="DocsView-accordionSummary">When will I receive my winnings?</summary>
              <div class="DocsView-accordionContent">
                <p>Payouts are processed automatically shortly after the pool closes and winners are selected. SOL is sent directly to your connected wallet address.</p>
              </div>
            </details>

            <details class="DocsView-accordionItem">
              <summary class="DocsView-accordionSummary">What happens if market cap increases during the pool?</summary>
              <div class="DocsView-accordionContent">
                <p>The winner count is determined by the market cap at the time the pool closes. If the market cap grows during the 60-minute window, more winners will be selected when the pool ends!</p>
              </div>
            </details>

            <details class="DocsView-accordionItem">
              <summary class="DocsView-accordionSummary">What's the token mint address?</summary>
              <div class="DocsView-accordionContent">
                <p><code>[TOKEN ADDRESS]</code></p>
              </div>
            </details>
          </div>
        </section>

        <!-- Troubleshooting -->
        <section id="troubleshooting" class="DocsView-section">
          <h1>Troubleshooting</h1>

          <h2>Wallet Connection Issues</h2>
          <div class="DocsView-callout DocsView-callout--warning">
            <strong>My wallet won't connect</strong>
            <p>Try these steps:</p>
            <ol>
              <li>Ensure Phantom wallet extension is installed</li>
              <li>Refresh the page</li>
              <li>Check that Phantom is unlocked</li>
              <li>Try disconnecting and reconnecting</li>
            </ol>
          </div>

          <h2>Participation Issues</h2>
          <div class="DocsView-callout DocsView-callout--warning">
            <strong>I joined but don't see myself in the participant list</strong>
            <p>Wait a few seconds for the UI to update, then refresh the page. Check your wallet connection and verify you received a "Successfully joined" confirmation.</p>
          </div>

          <h2>Payment Issues</h2>
          <div class="DocsView-callout DocsView-callout--warning">
            <strong>I won but didn't receive my SOL</strong>
            <ol>
              <li>Check your wallet balance (may take a few moments)</li>
              <li>Look for the transaction in your wallet history</li>
              <li>Verify on a Solana explorer using your wallet address</li>
              <li>If still missing after 5 minutes, contact support</li>
            </ol>
          </div>
        </section>

      </div>

      <!-- Page Navigation -->
      <div class="DocsView-pageNav">
        <button @click="scrollToTop" class="DocsView-scrollTop" :class="{ visible: showScrollTop }">
          ↑ Back to top
        </button>
      </div>
    </main>
  </div>
</template>

<script>
export default {
  name: 'DocumentationView',

  data() {
    return {
      activeSection: 'introduction',
      showScrollTop: false
    }
  },

  mounted() {
    window.scrollTo(0, 0)
    this.setupScrollSpy()
    window.addEventListener('scroll', this.handleScroll)
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  },

  methods: {
    scrollToSection(e) {
      e.preventDefault()
      const targetId = e.currentTarget.getAttribute('href')

      if (!targetId || !targetId.startsWith('#')) return

      const element = document.querySelector(targetId)

      if (element) {
        const offsetTop = element.offsetTop - 30
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        })
      }
    },

    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    },

    handleScroll() {
      this.showScrollTop = window.pageYOffset > 300
      this.updateActiveSection()
    },

    updateActiveSection() {
      const sections = document.querySelectorAll('.DocsView-section')
      const scrollPos = window.pageYOffset + 100

      sections.forEach(section => {
        const sectionTop = section.offsetTop
        const sectionBottom = sectionTop + section.offsetHeight
        const sectionId = section.getAttribute('id')

        if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
          this.activeSection = sectionId
        }
      })
    },

    setupScrollSpy() {
      this.updateActiveSection()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables';
@import '@/styles/breakpoints';

.DocsView {
  display: flex;
  min-height: 100vh;
  background: #4CAEE0 url('@/assets/images/clouds.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;

  // Sidebar
  &-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    background: $white;
    border-right: 1px solid #e5e7eb;
    overflow-y: auto;
    z-index: 100;
    display: flex;
    flex-direction: column;

    @include sm-down {
      display: none;
    }
  }

  &-sidebarHeader {
    padding: 24px 20px;
    border-bottom: 1px solid #e5e7eb;
  }

  &-backLink {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 16px;
    transition: all 0.2s;
    padding: 8px 12px;
    border-radius: 8px;

    &:hover {
      color: #4CAEE0;
      background: #f3f4f6;

      .DocsView-backIcon {
        transform: translateX(-3px);
      }
    }
  }

  &-backIcon {
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  &-sidebarTitle {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: $gray-900;
  }

  &-nav {
    flex: 1;
    padding: 20px 0;
  }

  &-navSection {
    margin-bottom: 24px;
  }

  &-navSectionTitle {
    padding: 0 20px;
    margin: 0 0 8px 0;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: #9ca3af;
    letter-spacing: 0.05em;
  }

  &-navList {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      margin: 0;
    }

    a {
      display: block;
      padding: 8px 20px;
      color: #4b5563;
      text-decoration: none;
      font-size: 14px;
      transition: all 0.2s;
      border-left: 3px solid transparent;

      &:hover {
        background: #f9fafb;
        color: #4CAEE0;
      }

      &.active {
        background: rgba(76, 174, 224, 0.1);
        color: #4CAEE0;
        border-left-color: #4CAEE0;
        font-weight: 600;
      }
    }
  }

  &-sidebarFooter {
    padding: 20px;
    border-top: 1px solid #e5e7eb;
    font-size: 12px;
    color: #9ca3af;

    p {
      margin: 4px 0;
    }
  }

  &-version {
    font-weight: 600;
  }

  // Main Content
  &-main {
    margin-left: 280px;
    flex: 1;
    padding: 40px;
    max-width: 900px;

    @include sm-down {
      margin-left: 0;
      padding: 80px 20px 40px;
    }
  }

  &-content {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 48px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

    @include sm-down {
      padding: 24px;
    }
  }

  &-section {
    margin-bottom: 64px;

    &:last-child {
      margin-bottom: 0;
    }

    h1 {
      font-size: 36px;
      font-weight: 700;
      color: $gray-900;
      margin: 0 0 24px 0;
      line-height: 1.2;

      @include sm-down {
        font-size: 28px;
      }
    }

    h2 {
      font-size: 28px;
      font-weight: 700;
      color: $gray-900;
      margin: 36px 0 16px 0;

      @include sm-down {
        font-size: 24px;
      }
    }

    h3 {
      font-size: 20px;
      font-weight: 600;
      color: $gray-900;
      margin: 24px 0 12px 0;
    }

    p {
      line-height: 1.7;
      color: #374151;
      margin: 16px 0;
    }

    ul, ol {
      line-height: 1.7;
      color: #374151;
      margin: 16px 0;
      padding-left: 24px;

      li {
        margin: 8px 0;
      }
    }

    code {
      background: #f3f4f6;
      color: #4CAEE0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
      font-family: 'Monaco', 'Courier New', monospace;
    }
  }

  &-pageTitle {
    font-size: 42px !important;
    margin-bottom: 12px !important;

    @include sm-down {
      font-size: 32px !important;
    }
  }

  &-lead {
    font-size: 18px;
    color: #6b7280;
    margin-bottom: 32px !important;
    line-height: 1.6;
  }

  // Cards
  &-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 32px 0;

    @include sm-down {
      grid-template-columns: 1fr;
    }
  }

  &-card {
    padding: 24px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      border-color: #4CAEE0;
      box-shadow: 0 4px 12px rgba(76, 174, 224, 0.15);
      transform: translateY(-2px);
    }

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: $gray-900;
      margin: 12px 0 8px 0;
    }

    p {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
  }

  &-cardIcon {
    font-size: 32px;
    line-height: 1;
  }

  // Steps
  &-steps {
    margin: 32px 0;
  }

  &-step {
    display: flex;
    gap: 20px;
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &-stepNumber {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #4CAEE0, #3a95c9);
    color: $white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 18px;
  }

  &-stepContent {
    flex: 1;

    h3 {
      margin-top: 0;
      font-size: 18px;
    }

    p {
      margin: 8px 0 0 0;
    }
  }

  // Badges
  &-badges {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0;
    flex-wrap: wrap;
  }

  &-badge {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;

    &--success {
      background: rgba($success, 0.1);
      color: darken($success, 15%);
      border: 2px solid $success;
    }

    &--warning {
      background: rgba($primary, 0.2);
      color: $primary-darker;
      border: 2px solid $primary-dark;
    }

    &--info {
      background: rgba($info, 0.1);
      color: darken($info, 15%);
      border: 2px solid $info;
    }
  }

  &-badgeArrow {
    font-size: 20px;
    color: #9ca3af;
  }

  // Callouts
  &-callout {
    padding: 20px;
    border-radius: 8px;
    border-left: 4px solid;
    margin: 24px 0;

    &--success {
      background: rgba($success, 0.08);
      border-color: $success;
    }

    &--warning {
      background: rgba($primary, 0.15);
      border-color: $primary-dark;
    }

    &--info {
      background: rgba($info, 0.08);
      border-color: $info;
    }

    strong {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: $gray-900;
    }

    p {
      margin: 0;
      color: #374151;
    }

    ol, ul {
      margin: 12px 0 0 0;
    }
  }

  // Code blocks
  &-code {
    margin: 24px 0;

    pre {
      background: #1f2937;
      color: #e5e7eb;
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 14px;
      line-height: 1.6;

      code {
        background: none;
        color: #e5e7eb;
        padding: 0;
      }
    }
  }

  // Tables
  &-table {
    margin: 24px 0;
    overflow-x: auto;

    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    thead {
      background: #f9fafb;
    }

    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }

    td {
      padding: 12px 16px;
      font-size: 14px;
      color: #4b5563;
      border-bottom: 1px solid #e5e7eb;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tbody tr:hover {
      background: #f9fafb;
    }
  }

  // Accordion
  &-accordion {
    margin: 32px 0;
  }

  &-accordionItem {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 12px;
    overflow: hidden;

    &[open] {
      .DocsView-accordionSummary {
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }
    }
  }

  &-accordionSummary {
    padding: 16px 20px;
    cursor: pointer;
    font-weight: 600;
    color: $gray-900;
    list-style: none;
    transition: background 0.2s;
    user-select: none;

    &::-webkit-details-marker {
      display: none;
    }

    &:hover {
      background: #f9fafb;
    }
  }

  &-accordionContent {
    padding: 16px 20px;
    color: #4b5563;

    p {
      margin: 0;
    }

    code {
      word-break: break-all;
    }
  }

  // Example Boxes
  &-example {
    padding: 20px;
    background: linear-gradient(135deg, rgba(76, 174, 224, 0.05), rgba(157, 217, 210, 0.05));
    border: 2px solid #4CAEE0;
    border-radius: 8px;
    margin: 16px 0;

    p {
      margin: 8px 0;
      font-size: 15px;
      color: #374151;

      strong {
        color: $gray-900;
        font-weight: 600;
      }
    }

    &:first-of-type {
      margin-top: 24px;
    }
  }

  // Page Navigation
  &-pageNav {
    margin-top: 40px;
    text-align: center;
  }

  &-scrollTop {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: $white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    color: #4b5563;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    opacity: 0;
    visibility: hidden;

    &.visible {
      opacity: 1;
      visibility: visible;
    }

    &:hover {
      background: #4CAEE0;
      color: $white;
      border-color: #4CAEE0;
    }
  }
}
</style>
