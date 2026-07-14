const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'public');
const logFile = path.join(logDir, 'alerts.csv');

// Ensure public directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Mock fixtures with odds
const mockFixtures = [
  { id: 1, teams: 'Argentina vs France', odds: { win: 1.95, draw: 3.20, loss: 4.10 } },
  { id: 2, teams: 'Brazil vs Germany', odds: { win: 1.80, draw: 3.40, loss: 4.50 } },
  { id: 3, teams: 'Spain vs Italy', odds: { win: 2.10, draw: 3.10, loss: 3.80 } },
];

let previousOdds = {};

function logAlerts(alerts) {
  alerts.forEach(alert => {
    const row = `${alert.timestamp},${alert.fixtureId},${alert.teams.replace(/,/g, ' vs ')},${alert.market},${alert.oldOdds},${alert.newOdds},${alert.changePercent}`;
    fs.appendFileSync(logFile, row + '\n');
  });
}

// Initialize CSV and pre-populate with 3 historical alerts
if (!fs.existsSync(logFile) || fs.readFileSync(logFile, 'utf8').trim().split('\n').length <= 1) {
  fs.writeFileSync(logFile, 'timestamp,fixtureId,teams,market,oldOdds,newOdds,changePercent\n');
  const now = new Date();
  const initialAlerts = [
    {
      timestamp: new Date(now - 10 * 60000).toISOString(),
      fixtureId: 1,
      teams: 'Argentina vs France',
      market: 'win',
      oldOdds: '1.950',
      newOdds: '1.872',
      changePercent: '4.00'
    },
    {
      timestamp: new Date(now - 8 * 60000).toISOString(),
      fixtureId: 2,
      teams: 'Brazil vs Germany',
      market: 'draw',
      oldOdds: '3.400',
      newOdds: '3.298',
      changePercent: '3.00'
    },
    {
      timestamp: new Date(now - 5 * 60000).toISOString(),
      fixtureId: 3,
      teams: 'Spain vs Italy',
      market: 'loss',
      oldOdds: '3.800',
      newOdds: '3.914',
      changePercent: '3.00'
    }
  ];
  logAlerts(initialAlerts);
  console.log('📊 Pre-populated public/alerts.csv with 3 initial alerts.');
}

function simulateOddsMovement(fixture) {
  const alerts = [];
  
  Object.entries(fixture.odds).forEach(([market, currentOdds]) => {
    if (!previousOdds[fixture.id]) {
      previousOdds[fixture.id] = {};
    }

    const oldOdds = previousOdds[fixture.id][market];
    
    if (oldOdds) {
      // Random movement between -8% and +8% (frequent trigger)
      const randomChange = (Math.random() - 0.5) * 16;
      const newOdds = oldOdds + (oldOdds * randomChange / 100);
      const changePercent = Math.abs(randomChange);
      
      // Log if movement > 2.5%
      if (changePercent > 2.5) {
        const alert = {
          timestamp: new Date().toISOString(),
          fixtureId: fixture.id,
          teams: fixture.teams,
          market,
          oldOdds: oldOdds.toFixed(3),
          newOdds: newOdds.toFixed(3),
          changePercent: changePercent.toFixed(2)
        };
        alerts.push(alert);
        console.log(`🚨 ALERT: ${fixture.teams} - ${market}: ${oldOdds.toFixed(3)} → ${newOdds.toFixed(3)} (${changePercent.toFixed(1)}%)`);
      }
      
      previousOdds[fixture.id][market] = newOdds;
    } else {
      previousOdds[fixture.id][market] = currentOdds;
    }
  });

  return alerts;
}

async function run() {
  console.log('🤖 Sharp Movement Detector (DEMO MODE)');
  console.log('📍 Simulating odds every 15 seconds...\n');

  // Initialize previousOdds with the mock base values
  mockFixtures.forEach(fixture => {
    previousOdds[fixture.id] = {};
    Object.entries(fixture.odds).forEach(([market, odds]) => {
      previousOdds[fixture.id][market] = odds;
    });
  });

  let cycle = 0;
  
  const simulateCycle = () => {
    cycle++;
    console.log(`\n⏱️  Cycle ${cycle} - ${new Date().toLocaleTimeString()}`);
    
    mockFixtures.forEach(fixture => {
      const alerts = simulateOddsMovement(fixture);
      if (alerts.length > 0) {
        logAlerts(alerts);
        console.log(`✅ Logged ${alerts.length} movement(s)`);
      }
    });
  };

  // Run the first simulation cycle immediately
  simulateCycle();

  // Then run every 15 seconds
  setInterval(simulateCycle, 15000);
}

run();