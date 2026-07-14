const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_ORIGIN = process.env.API_ORIGIN || "https://txline.txodds.com";
const API_BASE = `${API_ORIGIN}/api`;
const JWT = process.env.JWT_TOKEN;
const API_TOKEN = process.env.API_TOKEN;

let previousOdds = {};
const alertsLog = [];

const logDir = path.join(__dirname, 'public');
const logFile = path.join(logDir, 'alerts.csv');

// Ensure public directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Initialize CSV header (7 columns matching App.jsx)
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, 'timestamp,fixtureId,teams,market,oldOdds,newOdds,changePercent\n');
  console.log('📊 Created public/alerts.csv');
}

async function fetchOdds() {
  try {
    const headers = {};
    if (JWT) {
      headers['Authorization'] = `Bearer ${JWT}`;
    }
    if (API_TOKEN) {
      headers['X-Api-Token'] = API_TOKEN;
    }

    // Get all World Cup fixtures (competitionId 72 for World Cup)
    const response = await axios.get(
      `${API_BASE}/fixtures/snapshot?competitionId=72`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.data?.message || error.message);
    return null;
  }
}

function detectSharpMovements(fixtures) {
  const alerts = [];
  
  if (!fixtures) return alerts;

  // Handle both { fixtures: [...] } wrapper and direct array response
  const fixtureList = Array.isArray(fixtures) ? fixtures : (fixtures.fixtures || []);

  fixtureList.forEach(fixture => {
    const fixtureId = fixture.FixtureId || fixture.id;
    if (!fixtureId) return;
    
    const odds = fixture.Odds || fixture.odds;
    if (!odds) return;

    // Resolve team names
    const p1 = fixture.Participant1 || fixture.participant1 || '';
    const p2 = fixture.Participant2 || fixture.participant2 || '';
    const isHome = fixture.Participant1IsHome ?? fixture.participant1IsHome ?? true;
    const homeTeam = isHome ? p1 : p2;
    const awayTeam = isHome ? p2 : p1;
    const teams = homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : (fixture.teams || `Fixture ${fixtureId}`);

    Object.entries(odds).forEach(([market, newOddsVal]) => {
      const newOdds = parseFloat(newOddsVal);
      if (isNaN(newOdds)) return;

      if (!previousOdds[fixtureId]) {
        previousOdds[fixtureId] = {};
      }

      const oldOddsVal = previousOdds[fixtureId][market];
      const oldOdds = oldOddsVal ? parseFloat(oldOddsVal) : undefined;
      
      if (oldOdds && oldOdds > 0) {
        const changePercent = Math.abs((newOdds - oldOdds) / oldOdds * 100);
        
        // Log if odds move by more than 2.5%
        if (changePercent > 2.5) {
          const alert = {
            timestamp: new Date().toISOString(),
            fixtureId,
            teams,
            market,
            oldOdds: oldOdds.toFixed(3),
            newOdds: newOdds.toFixed(3),
            changePercent: changePercent.toFixed(2)
          };
          alerts.push(alert);
          console.log(`🚨 ALERT: ${teams} (${market}): ${oldOdds.toFixed(3)} → ${newOdds.toFixed(3)} (${changePercent.toFixed(1)}%)`);
        }
      }
      
      previousOdds[fixtureId][market] = newOdds;
    });
  });

  return alerts;
}

function logAlerts(alerts) {
  alerts.forEach(alert => {
    const row = `${alert.timestamp},${alert.fixtureId},${alert.teams.replace(/,/g, ' vs ')},${alert.market},${alert.oldOdds},${alert.newOdds},${alert.changePercent}`;
    fs.appendFileSync(logFile, row + '\n');
  });
}

async function run() {
  console.log('🤖 Sharp Movement Detector Started');
  console.log('📍 Polling every 60 seconds...\n');

  setInterval(async () => {
    const fixtures = await fetchOdds();
    if (fixtures) {
      const alerts = detectSharpMovements(fixtures);
      if (alerts.length > 0) {
        logAlerts(alerts);
        console.log(`✅ Logged ${alerts.length} movement(s)\n`);
      }
    }
  }, 60000); // 60 seconds
}

run();