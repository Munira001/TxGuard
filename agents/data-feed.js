/**
 * @module data-feed
 * @description Shared TxLINE data ingestion layer for all TxGuard autonomous agents.
 * Supports two modes:
 *   - **live**: Fetches real odds from TxLINE API (requires JWT_TOKEN or API_TOKEN in .env)
 *   - **demo**: Generates realistic simulated odds movements for World Cup fixtures
 *
 * Architecture: Single fetch → broadcast to all agent consumers.
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Load env from project root
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const API_ORIGIN = process.env.API_ORIGIN || 'https://txline.txodds.com';
const API_BASE = `${API_ORIGIN}/api`;
const JWT = process.env.JWT_TOKEN;
const API_TOKEN = process.env.API_TOKEN;

/**
 * World Cup 2026 mock fixtures used in demo/simulation mode.
 * Each fixture has realistic decimal odds for win/draw/loss markets.
 * @type {Array<{id: number, teams: string, homeTeam: string, awayTeam: string, odds: {win: number, draw: number, loss: number}}>}
 */
const MOCK_FIXTURES = [
  { id: 1, teams: '🇪🇸 Spain vs 🇵🇹 Portugal (R16)',    homeTeam: '🇪🇸 Spain',  awayTeam: '🇵🇹 Portugal',   odds: { win: 2.10, draw: 3.15, loss: 3.40 } },
  { id: 2, teams: '🇺🇸 USA vs 🇧🇪 Belgium (R16)',      homeTeam: '🇺🇸 USA',    awayTeam: '🇧🇪 Belgium',    odds: { win: 2.85, draw: 3.20, loss: 2.30 } },
  { id: 3, teams: '🇫🇷 France vs 🇲🇦 Morocco (QF)',    homeTeam: '🇫🇷 France',  awayTeam: '🇲🇦 Morocco',    odds: { win: 1.80, draw: 3.30, loss: 4.50 } },
  { id: 4, teams: '🇳🇴 Norway vs 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England (QF)',    homeTeam: '🇳🇴 Norway',  awayTeam: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 England',   odds: { win: 3.25, draw: 3.10, loss: 2.15 } },
  { id: 5, teams: '🇪🇸 Spain vs 🇧🇪 Belgium (QF)', homeTeam: '🇪🇸 Spain', awayTeam: '🇧🇪 Belgium', odds: { win: 1.75, draw: 3.50, loss: 4.20 } },
  { id: 6, teams: '🇦🇷 Argentina vs 🇨🇭 Switzerland (QF)', homeTeam: '🇦🇷 Argentina', awayTeam: '🇨🇭 Switzerland', odds: { win: 2.10, draw: 3.25, loss: 3.10 } },
];

/** @type {Object<number, Object<string, number>>} Mutable state for demo mode odds */
let demoOddsState = {};
/** @type {Object<number, Object<string, number>>} Mutable state for demo mode stats */
let demoStatsState = {};

/**
 * Initializes the demo odds and stats state from MOCK_FIXTURES base values.
 * Must be called once before the first demo fetch cycle.
 */
function initDemoState() {
  MOCK_FIXTURES.forEach(f => {
    demoOddsState[f.id] = { ...f.odds };
    demoStatsState[f.id] = {
      1: 0, // Participant 1 goals
      2: 0, // Participant 2 goals
      3: 0, // Participant 1 yellow cards
      4: 0, // Participant 2 yellow cards
      5: 0, // Participant 1 red cards
      6: 0, // Participant 2 red cards
      7: 2, // Participant 1 corners (start with some corners)
      8: 1  // Participant 2 corners
    };
  });
}

/**
 * Applies a bounded random walk to a single odds value.
 * Uses a mean-reverting Ornstein-Uhlenbeck-inspired process to keep
 * odds within realistic bounds while producing frequent sharp moves.
 *
 * Mathematical model:
 *   drift = -θ × (current - mean) / mean   // mean-reversion pull
 *   noise = σ × U(-1, 1)                   // random shock
 *   newOdds = current × (1 + drift + noise)
 *
 * @param {number} current - Current odds value
 * @param {number} baseOdds - The original base odds (mean-reversion target)
 * @param {number} [sigma=0.04] - Volatility parameter (std dev of % change)
 * @param {number} [theta=0.1] - Mean-reversion speed (0 = pure random walk, 1 = snap back)
 * @returns {number} New odds value, floored at 1.01
 */
function evolveOdds(current, baseOdds, sigma = 0.04, theta = 0.1) {
  const drift = -theta * ((current - baseOdds) / baseOdds);
  const noise = sigma * (Math.random() * 2 - 1);
  const change = drift + noise;
  const newVal = current * (1 + change);
  return Math.max(1.01, parseFloat(newVal.toFixed(3)));
}

/**
 * Fetches fixture odds from the live TxLINE API.
 * @returns {Promise<Array|null>} Normalized fixture array or null on failure
 */
async function fetchLive() {
  try {
    const headers = {};
    if (JWT) headers['Authorization'] = `Bearer ${JWT}`;
    if (API_TOKEN) headers['X-Api-Token'] = API_TOKEN;

    const response = await axios.get(
      `${API_BASE}/fixtures/snapshot?competitionId=72`,
      { headers, timeout: 15000 }
    );

    const data = response.data;
    const fixtureList = Array.isArray(data) ? data : (data.fixtures || []);

    return fixtureList.map(f => {
      const p1 = f.Participant1 || f.participant1 || '';
      const p2 = f.Participant2 || f.participant2 || '';
      const isHome = f.Participant1IsHome ?? f.participant1IsHome ?? true;
      const homeTeam = isHome ? p1 : p2;
      const awayTeam = isHome ? p2 : p1;

      // Extract and normalize live match stats (ScoreStatKey mapping with period prefixes)
      const rawStats = f.Stats || f.stats || {};
      const normalizedStats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };
      
      const processStatItem = (key, val) => {
        const numericKey = parseInt(key);
        const numericVal = parseInt(val) || 0;
        if (!isNaN(numericKey)) {
          const baseKey = numericKey % 10;
          if (baseKey >= 1 && baseKey <= 8) {
            normalizedStats[baseKey] += numericVal;
          }
        }
      };

      if (Array.isArray(rawStats)) {
        rawStats.forEach(item => {
          const key = item.Key ?? item.key;
          const val = item.Value ?? item.value;
          if (key !== undefined && val !== undefined) {
            processStatItem(key, val);
          }
        });
      } else {
        Object.entries(rawStats).forEach(([k, v]) => {
          processStatItem(k, v);
        });
      }

      return {
        id: f.FixtureId || f.id,
        teams: homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : `Fixture ${f.FixtureId || f.id}`,
        homeTeam,
        awayTeam,
        odds: f.Odds || f.odds || {},
        stats: normalizedStats
      };
    });
  } catch (err) {
    console.error(`❌ TxLINE API error: ${err.response?.data?.message || err.message}`);
    return null;
  }
}

/**
 * Generates a simulated odds snapshot by evolving the demo state.
 * Periodically triggers goals/corners/cards and jumps odds directionally.
 * @returns {Array} Array of fixture objects with evolved odds
 */
function fetchDemo() {
  if (Object.keys(demoOddsState).length === 0) initDemoState();

  return MOCK_FIXTURES.map(base => {
    const current = demoOddsState[base.id];
    const stats = demoStatsState[base.id];
    
    // Simulate periodic match events
    const rand = Math.random();
    let oddsMultiplier = { win: 1.0, draw: 1.0, loss: 1.0 };
    
    if (rand < 0.015) {
      // 1.5% chance: Goal scored!
      const isHomeGoal = Math.random() < 0.55; // slight home bias
      if (isHomeGoal) {
        stats[1] += 1; // Key 1 = Home goals
        // Home odds shorten, away odds drift
        oddsMultiplier.win = 0.65;
        oddsMultiplier.loss = 1.6;
        oddsMultiplier.draw = 0.9;
        console.log(`    ⚽ [Demo Live Event] GOAL! ${base.homeTeam} scores! Score is now ${stats[1]} - ${stats[2]}`);
      } else {
        stats[2] += 1; // Key 2 = Away goals
        oddsMultiplier.loss = 0.65;
        oddsMultiplier.win = 1.6;
        oddsMultiplier.draw = 0.9;
        console.log(`    ⚽ [Demo Live Event] GOAL! ${base.awayTeam} scores! Score is now ${stats[1]} - ${stats[2]}`);
      }
    } else if (rand < 0.025) {
      // 1% chance: Red card!
      const isHomeRed = Math.random() < 0.5;
      if (isHomeRed) {
        stats[5] += 1; // Key 5 = Home red cards
        oddsMultiplier.win = 1.4; // Home drifts
        oddsMultiplier.loss = 0.75;
        console.log(`    🟥 [Demo Live Event] RED CARD! ${base.homeTeam} down to 10 men!`);
      } else {
        stats[6] += 1; // Key 6 = Away red cards
        oddsMultiplier.loss = 1.4;
        oddsMultiplier.win = 0.75;
        console.log(`    🟥 [Demo Live Event] RED CARD! ${base.awayTeam} down to 10 men!`);
      }
    } else if (rand < 0.055) {
      // 3% chance: Corner
      const isHomeCorner = Math.random() < 0.5;
      if (isHomeCorner) {
        stats[7] += 1; // Key 7 = Home corners
      } else {
        stats[8] += 1; // Key 8 = Away corners
      }
    }

    const evolved = {};
    for (const [market, val] of Object.entries(current)) {
      // Evolve odds starting from multiplier-adjusted value
      const adjustedVal = val * oddsMultiplier[market];
      evolved[market] = evolveOdds(adjustedVal, base.odds[market]);
    }
    
    demoOddsState[base.id] = evolved;
    
    return {
      id: base.id,
      teams: base.teams,
      homeTeam: base.homeTeam,
      awayTeam: base.awayTeam,
      odds: { ...evolved },
      stats: { ...stats }
    };
  });
}

/**
 * Detects whether live mode is possible by checking for API credentials.
 * @returns {boolean}
 */
function canGoLive() {
  return !!(JWT || API_TOKEN);
}

/**
 * Fetches odds data in the specified mode.
 * @param {'live'|'demo'} mode
 * @returns {Promise<Array|null>}
 */
async function fetchOdds(mode = 'demo') {
  let fixtures = null;
  if (mode === 'live' && canGoLive()) {
    fixtures = await fetchLive();
    if (!fixtures) {
      console.warn("  ⚠️  Live API snapshot query returned 403 or failed. Falling back to local high-fidelity simulator...");
      fixtures = fetchDemo();
    }
  } else {
    fixtures = fetchDemo();
  }

  if (fixtures) {
    try {
      const publicDir = path.join(__dirname, '..', 'public');
      ensureDir(publicDir);
      fs.writeFileSync(
        path.join(publicDir, 'fixtures.json'),
        JSON.stringify(fixtures, null, 2)
      );
    } catch (err) {
      console.error('❌ Failed to write public/fixtures.json:', err.message);
    }
  }

  return fixtures;
}

/**
 * Ensures a directory exists, creating it recursively if needed.
 * @param {string} dir
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Appends a row to a CSV file. Creates the file with headers if it doesn't exist.
 * @param {string} filePath
 * @param {string} headers - CSV header row (no newline)
 * @param {string} row - CSV data row (no newline)
 */
function appendCsv(filePath, headers, row) {
  ensureDir(path.dirname(filePath));
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, headers + '\n');
  }
  fs.appendFileSync(filePath, row + '\n');
}

module.exports = {
  fetchOdds,
  canGoLive,
  appendCsv,
  ensureDir,
  MOCK_FIXTURES,
  initDemoState,
  evolveOdds,
};

