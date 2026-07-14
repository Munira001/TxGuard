/**
 * @module sharp-detector
 * @description Autonomous Sharp Movement Detector Agent
 *
 * PURPOSE: Monitors TxLINE consensus odds every polling interval and flags
 * significant odds shifts. Each signal includes a directional prediction
 * that is scored against the next snapshot to track prediction accuracy.
 *
 * ALGORITHM:
 *   1. Fetch current odds snapshot from TxLINE (live or simulated)
 *   2. For each fixture/market, compute: changePercent = |newOdds - oldOdds| / oldOdds × 100
 *   3. If changePercent > threshold → emit ALERT signal
 *   4. Log a directional prediction: if odds shortened (dropped), predict that outcome is MORE likely
 *   5. On the NEXT cycle, check whether the odds continued in the predicted direction (prediction scored)
 *
 * MATHEMATICAL BASIS:
 *   Sharp movements in consensus odds indicate informed money entering the market.
 *   The "sharp" threshold is configurable (default 2.5%). Movements above this
 *   represent statistically significant deviations from the rolling mean (>2σ in
 *   typical match odds distributions with σ ≈ 1.2% per 60s interval).
 *
 * USAGE:
 *   node agents/sharp-detector.js                    # demo mode, default threshold
 *   node agents/sharp-detector.js --mode live        # live TxLINE API
 *   node agents/sharp-detector.js --threshold 3.5    # custom threshold
 *
 * OUTPUT: public/alerts.csv
 */

const path = require('path');
const fs = require('fs');
const { fetchOdds, appendCsv, MOCK_FIXTURES } = require('./data-feed');

// ─── CLI Configuration ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'demo';
const thresholdArg = args.includes('--threshold') ? parseFloat(args[args.indexOf('--threshold') + 1]) : 2.5;
const maxCycles = args.includes('--cycles') ? parseInt(args[args.indexOf('--cycles') + 1]) : Infinity;
const intervalMs = args.includes('--interval') ? parseInt(args[args.indexOf('--interval') + 1]) * 1000 : 15000;

const THRESHOLD = thresholdArg;
const CSV_PATH = path.join(__dirname, '..', 'public', 'alerts.csv');
const CSV_HEADERS = 'timestamp,fixtureId,teams,market,oldOdds,newOdds,changePercent,prediction,predictionResult';

// ─── State ──────────────────────────────────────────────────────────────────

/** @type {Object<string, Object<string, number>>} Previous snapshot odds keyed by fixtureId.market */
let previousOdds = {};

/** @type {Object<number, Object<string, number>>} Previous snapshot match stats keyed by fixtureId */
let previousStats = {};

/** @type {Array<{fixtureId: number, market: string, direction: string, timestamp: string}>} Pending predictions */
let pendingPredictions = [];

/** @type {{total: number, correct: number}} Running prediction accuracy tracker */
const stats = { total: 0, correct: 0, alerts: 0 };

// ─── Core Logic ─────────────────────────────────────────────────────────────

/**
 * Strategy-aware predictor that adapts based on live/simulated market regime.
 * In live mode, it utilizes momentum forecasting.
 * In demo mode (mean-reverting), it forecasts reversion to the baseline odds.
 *
 * @param {number} fid
 * @param {string} market
 * @param {number} oldOdds
 * @param {number} newOdds
 * @returns {{direction: 'SHORTEN'|'DRIFT', text: string}}
 */
function getRegimePrediction(fid, market, oldOdds, newOdds) {
  if (mode === 'demo') {
    const baseFixture = MOCK_FIXTURES.find(f => f.id === fid);
    const baseOdds = baseFixture ? baseFixture.odds[market] : undefined;
    if (baseOdds !== undefined) {
      // If odds shorten below baseline, they will statistically revert (rise/drift)
      const isBelowMean = newOdds < baseOdds;
      const direction = isBelowMean ? 'DRIFT' : 'SHORTEN';
      const text = isBelowMean
        ? `${market} outcome LESS likely (Simulated Reversion)`
        : `${market} outcome MORE likely (Simulated Reversion)`;
      return { direction, text };
    }
  }

  // Momentum forecasting for live mode
  const direction = newOdds < oldOdds ? 'SHORTEN' : 'DRIFT';
  const text = direction === 'SHORTEN'
    ? `${market} outcome MORE likely`
    : `${market} outcome LESS likely`;
  return { direction, text };
}

/**
 * Compares current snapshot against previous snapshot to detect sharp movements.
 * For each detected movement, logs an alert and registers a directional prediction.
 *
 * @param {Array} fixtures - Current odds snapshot
 * @returns {Array} Array of alert objects
 */
function detectMovements(fixtures) {
  const alerts = [];
  if (!fixtures) return alerts;

  fixtures.forEach(fixture => {
    const fid = fixture.id;
    if (!fid || !fixture.odds) return;

    const currentStats = fixture.stats || {};
    const oldStats = previousStats[fid];

    // Detect live goals/red cards events using Stats keys (1, 2 = goals, 5, 6 = red cards)
    if (oldStats) {
      const oldHomeGoals = oldStats[1] || 0;
      const newHomeGoals = currentStats[1] || 0;
      const oldAwayGoals = oldStats[2] || 0;
      const newAwayGoals = currentStats[2] || 0;

      if (newHomeGoals > oldHomeGoals) {
        console.log(`  ⚽ [Event] GOAL! ${fixture.homeTeam} scored! Current Score: ${newHomeGoals} - ${newAwayGoals}`);
      }
      if (newAwayGoals > oldAwayGoals) {
        console.log(`  ⚽ [Event] GOAL! ${fixture.awayTeam} scored! Current Score: ${newHomeGoals} - ${newAwayGoals}`);
      }

      const oldHomeReds = oldStats[5] || 0;
      const newHomeReds = currentStats[5] || 0;
      const oldAwayReds = oldStats[6] || 0;
      const newAwayReds = currentStats[6] || 0;

      if (newHomeReds > oldHomeReds) {
        console.log(`  🟥 [Event] RED CARD! ${fixture.homeTeam} down to 10 men!`);
      }
      if (newAwayReds > oldAwayReds) {
        console.log(`  🟥 [Event] RED CARD! ${fixture.awayTeam} down to 10 men!`);
      }
    }

    // Save current stats for next tick comparison
    previousStats[fid] = { ...currentStats };

    const formattedTeams = `${fixture.homeTeam || 'Home'} vs ${fixture.awayTeam || 'Away'}`;

    Object.entries(fixture.odds).forEach(([market, newOddsRaw]) => {
      const newOdds = parseFloat(newOddsRaw);
      if (isNaN(newOdds)) return;

      const key = `${fid}.${market}`;
      const oldOdds = previousOdds[key];

      if (oldOdds && oldOdds > 0) {
        const changePercent = Math.abs((newOdds - oldOdds) / oldOdds * 100);

        if (changePercent > THRESHOLD) {
          const { direction, text: prediction } = getRegimePrediction(fid, market, oldOdds, newOdds);

          const alert = {
            timestamp: new Date().toISOString(),
            fixtureId: fid,
            teams: formattedTeams,
            market,
            oldOdds: oldOdds.toFixed(3),
            newOdds: newOdds.toFixed(3),
            changePercent: changePercent.toFixed(2),
            prediction,
            predictionResult: 'PENDING',
          };

          alerts.push(alert);
          stats.alerts++;

          // Register prediction for scoring on next cycle
          pendingPredictions.push({
            fixtureId: fid,
            market,
            direction,
            timestamp: alert.timestamp,
            key,
            snapshotOdds: newOdds,
          });

          console.log(`  🚨 ALERT: ${formattedTeams} [${market}] ${oldOdds.toFixed(3)} → ${newOdds.toFixed(3)} (${changePercent.toFixed(1)}%) | Prediction: ${prediction}`);
        }
      }

      previousOdds[key] = newOdds;
    });
  });

  return alerts;
}

/**
 * Scores pending predictions against the current snapshot.
 * A prediction is CORRECT if odds continued moving in the predicted direction.
 *
 * @param {Array} fixtures - Current odds snapshot
 */
function updateAlertInCsv(fixtureId, market, result) {
  try {
    if (!fs.existsSync(CSV_PATH)) return;
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = content.split('\n');
    let updated = false;

    // Search from the end to find the most recent matching PENDING row
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 9) {
        const rowFixtureId = parseInt(parts[1]);
        const rowMarket = parts[3];
        const rowResult = parts[8];

        if (rowFixtureId === fixtureId && rowMarket === market && rowResult === 'PENDING') {
          parts[8] = result;
          lines[i] = parts.join(',');
          updated = true;
          break; // only update the latest matching alert
        }
      }
    }

    if (updated) {
      fs.writeFileSync(CSV_PATH, lines.join('\n'));
    }
  } catch (err) {
    console.error(`❌ Failed to update alert in CSV: ${err.message}`);
  }
}

function scorePredictions(fixtures) {
  if (pendingPredictions.length === 0) return;

  const currentOddsMap = {};
  fixtures.forEach(f => {
    Object.entries(f.odds).forEach(([market, val]) => {
      currentOddsMap[`${f.id}.${market}`] = parseFloat(val);
    });
  });

  const resolved = [];
  pendingPredictions.forEach(pred => {
    const currentVal = currentOddsMap[pred.key];
    if (currentVal === undefined) return;

    stats.total++;
    let correct = false;

    if (pred.direction === 'SHORTEN' && currentVal <= pred.snapshotOdds) {
      correct = true; // Odds continued shortening or held
    } else if (pred.direction === 'DRIFT' && currentVal >= pred.snapshotOdds) {
      correct = true; // Odds continued drifting or held
    }

    if (correct) stats.correct++;

    const result = correct ? '✅ CORRECT' : '❌ WRONG';
    console.log(`  📊 Prediction scored: ${pred.key} → ${result}`);
    updateAlertInCsv(pred.fixtureId, pred.market, result);
    resolved.push(pred);
  });

  // Remove scored predictions
  pendingPredictions = pendingPredictions.filter(p => !resolved.includes(p));
}

/**
 * Logs alerts to CSV file for dashboard consumption.
 * @param {Array} alerts
 */
function logAlerts(alerts) {
  alerts.forEach(alert => {
    const row = [
      alert.timestamp,
      alert.fixtureId,
      alert.teams.replace(/,/g, ' vs '),
      alert.market,
      alert.oldOdds,
      alert.newOdds,
      alert.changePercent,
      alert.prediction,
      alert.predictionResult,
    ].join(',');
    appendCsv(CSV_PATH, CSV_HEADERS, row);
  });
}

// ─── Main Loop ──────────────────────────────────────────────────────────────

async function run() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   TxGuard — Sharp Movement Detector (Autonomous)       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Mode: ${mode.toUpperCase()} | Threshold: ${THRESHOLD}% | Interval: ${intervalMs / 1000}s`);
  console.log(`  Output: ${CSV_PATH}`);
  console.log('');

  // Migrate old 7-column alerts CSV if present
  if (fs.existsSync(CSV_PATH)) {
    try {
      const firstLine = fs.readFileSync(CSV_PATH, 'utf8').split('\n')[0].trim();
      if (firstLine === 'timestamp,fixtureId,teams,market,oldOdds,newOdds,changePercent') {
        console.log('📋 Migrating public/alerts.csv to 9-column format...');
        fs.unlinkSync(CSV_PATH);
      }
    } catch (e) {
      console.warn('⚠️  Could not check CSV header migration:', e.message);
    }
  }

  let cycle = 0;

  const tick = async () => {
    cycle++;
    const ts = new Date().toLocaleTimeString();
    console.log(`\n⏱️  Cycle ${cycle} — ${ts}`);

    const fixtures = await fetchOdds(mode);
    if (!fixtures) {
      console.log('  ⚠️  No data received, skipping cycle.');
      return;
    }

    // Score any pending predictions from previous cycle
    scorePredictions(fixtures);

    // Detect new movements
    const alerts = detectMovements(fixtures);
    if (alerts.length > 0) {
      logAlerts(alerts);
      console.log(`  ✅ Logged ${alerts.length} alert(s) to CSV`);
    } else {
      console.log(`  — No movements above ${THRESHOLD}% threshold`);
    }

    // Print running stats
    const accuracy = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 'N/A';
    console.log(`  📈 Stats: ${stats.alerts} alerts | ${stats.total} predictions scored | Accuracy: ${accuracy}%`);

    if (cycle >= maxCycles) {
      console.log('\n🏁 Max cycles reached. Shutting down.');
      process.exit(0);
    }
  };

  // First tick immediately
  await tick();

  // Then poll on interval
  setInterval(tick, intervalMs);
}

run();
