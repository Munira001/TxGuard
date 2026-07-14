/**
 * @file test-agents-logic.js
 * @description Automated Unit Test Suite for TxGuard Agent Algorithms & Mathematics.
 * Uses Node's built-in assert module to run and verify logic.
 */

const assert = require('assert');
const { evolveOdds } = require('./agents/data-feed');
const { sharpeRatio } = require('./agents/arena');
const { stddev } = require('./agents/market-maker');

console.log('🧪 Starting TxGuard Agent Algorithmic Unit Tests...\n');

let passCount = 0;
let failCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Reason: ${err.message}`);
    failCount++;
  }
}

// ─── Data Feed Tests ─────────────────────────────────────────────────────────

runTest('data-feed.js - evolveOdds boundaries', () => {
  // Odds should never drop below 1.01
  for (let i = 0; i < 50; i++) {
    const nextOdds = evolveOdds(1.02, 1.80, 0.50, 0.1);
    assert.ok(nextOdds >= 1.01, `Odds should be >= 1.01, got ${nextOdds}`);
  }
});

runTest('data-feed.js - evolveOdds mean-reversion drift direction', () => {
  // If current odds are way higher than baseOdds, drift should pull it down
  const baseOdds = 2.0;
  const currentOdds = 5.0;
  // Let noise = 0 by using sigma = 0
  const nextOdds = evolveOdds(currentOdds, baseOdds, 0.0, 0.1);
  assert.ok(nextOdds < currentOdds, `Odds should revert down toward baseOdds (${baseOdds}), got ${nextOdds}`);
  
  // If current odds are lower than baseOdds, drift should push it up
  const lowOdds = 1.20;
  const nextOddsLow = evolveOdds(lowOdds, baseOdds, 0.0, 0.1);
  assert.ok(nextOddsLow > lowOdds, `Odds should revert up toward baseOdds (${baseOdds}), got ${nextOddsLow}`);
});

// ─── Arena Agent Tests ───────────────────────────────────────────────────────

runTest('arena.js - sharpeRatio basic calculation', () => {
  // Returns: [0.10, -0.05, 0.15, 0.08, -0.02]
  // Mean = 0.052
  // Standard deviation of returns = 0.0841
  // Expected Sharpe = 0.052 / 0.0841 ≈ 0.618 (rounded to 3 decimals)
  const returns = [0.10, -0.05, 0.15, 0.08, -0.02];
  const sharpe = sharpeRatio(returns);
  assert.strictEqual(sharpe, 0.618, `Expected Sharpe ratio of 0.618, got ${sharpe}`);
});

runTest('arena.js - sharpeRatio empty/insufficient data handling', () => {
  assert.strictEqual(sharpeRatio([]), 0, 'Empty returns should yield Sharpe of 0');
  assert.strictEqual(sharpeRatio([0.15]), 0, 'Single return element should yield Sharpe of 0');
});

// ─── Market Maker Agent Tests ───────────────────────────────────────────────

runTest('market-maker.js - stddev basic calculation', () => {
  // Stddev of [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]
  // Mean = 5.0
  // Variance = (9 + 1 + 1 + 1 + 0 + 0 + 4 + 16) / 8 = 32 / 8 = 4
  // Stddev = sqrt(4) = 2.0
  const values = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0];
  const valStddev = stddev(values);
  assert.strictEqual(valStddev, 2.0, `Expected standard deviation of 2.0, got ${valStddev}`);
});

runTest('market-maker.js - stddev edge cases', () => {
  assert.strictEqual(stddev([]), 0, 'Empty values should yield standard deviation of 0');
  assert.strictEqual(stddev([42.0]), 0, 'Single element should yield standard deviation of 0');
});

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n==================================================');
console.log(`📊 Test Execution Complete: ${passCount} Passed, ${failCount} Failed.`);
console.log('==================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
