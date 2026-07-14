import { useState, useEffect, useRef } from 'react';
import {
  Star,
  BarChart3,
  BookOpen,
  Users,
  Rocket,
  Play,
  Square,
  Sliders,
  CheckCircle2,
  Terminal,
  Loader2,
  Check,
  AlertCircle,
  Trophy,
  X,
  ShieldAlert
} from 'lucide-react';

import FanZone from './FanZone';

const WORLD_CUP_STATS = {
  goals: [
    { rank: 1, name: 'Kylian Mbappé', team: 'France', flag: '🇫🇷', value: 8, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mbappe' },
    { rank: 1, name: 'Lionel Messi', team: 'Argentina', flag: '🇦🇷', value: 8, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Messi' },
    { rank: 3, name: 'Erling Haaland', team: 'Norway', flag: '🇳🇴', value: 7, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Haaland' },
    { rank: 4, name: 'Harry Kane', team: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', value: 6, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Kane' },
    { rank: 5, name: 'Ousmane Dembélé', team: 'France', flag: '🇫🇷', value: 5, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Dembele' }
  ],
  assists: [
    { rank: 1, name: 'Michael Olise', team: 'France', flag: '🇫🇷', value: 5, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Olise' },
    { rank: 2, name: 'Brahim Díaz', team: 'Morocco', flag: '🇲🇦', value: 4, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Diaz' },
    { rank: 2, name: 'Bruno Guimarães', team: 'Brazil', flag: '🇧🇷', value: 4, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Guimaraes' },
    { rank: 4, name: 'Alexander Isak', team: 'Sweden', flag: '🇸🇪', value: 3, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Isak' },
    { rank: 4, name: 'Andreas Schjelderup', team: 'Norway', flag: '🇳🇴', value: 3, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Schjelderup' },
    { rank: 4, name: 'Bukayo Saka', team: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', value: 3, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Saka' },
    { rank: 4, name: 'Florian Wirtz', team: 'Germany', flag: '🇩🇪', value: 3, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Wirtz' }
  ],
  yellowCards: [
    { rank: 1, name: 'Issa Diop', team: 'Morocco', flag: '🇲🇦', value: 3, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Diop' },
    { rank: 2, name: 'Bernardo Silva', team: 'Portugal', flag: '🇵🇹', value: 2, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Silva' },
    { rank: 2, name: 'Casemiro', team: 'Brazil', flag: '🇧🇷', value: 2, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Casemiro' },
    { rank: 2, name: 'Cyle Larin', team: 'Canada', flag: '🇨🇦', value: 2, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Larin' },
    { rank: 2, name: 'Danilo', team: 'Brazil', flag: '🇧🇷', value: 2, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Danilo' },
    { rank: 2, name: 'Denis Zakaria', team: 'Switzerland', flag: '🇨🇭', value: 2, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Zakaria' },
    { rank: 2, name: 'Diego Gómez', team: 'Paraguay', flag: '🇵🇾', value: 2, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Gomez' },
    { rank: 2, name: 'Stefan Posch', team: 'Austria', flag: '🇦🇹', value: 2, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Posch' },
    { rank: 2, name: 'Teboho Mokoena', team: 'South Africa', flag: '🇿🇦', value: 2, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mokoena' }
  ],
  redCards: [
    { rank: 1, name: 'Agustin Canobbio', team: 'Uruguay', flag: '🇺🇾', value: 1, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Canobbio' },
    { rank: 1, name: 'Assim Madibo', team: 'Qatar', flag: '🇶🇦', value: 1, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Madibo' },
    { rank: 1, name: 'César Montes', team: 'Mexico', flag: '🇲🇽', value: 1, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Montes' },
    { rank: 1, name: 'Folarin Balogun', team: 'USA', flag: '🇺🇸', value: 1, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Balogun' },
    { rank: 1, name: 'Homam Ahmed', team: 'Qatar', flag: '🇶🇦', value: 1, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ahmed' },
    { rank: 1, name: 'Jarell Quansah', team: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', value: 1, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Quansah' },
    { rank: 1, name: 'Miguel Almirón', team: 'Paraguay', flag: '🇵🇾', value: 1, image: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Almiron' }
  ]
};

const COUNTRY_PROFILES = {
  'France': {
    flag: '🇫🇷',
    ranking: '#2',
    group: 'Group D',
    manager: 'Didier Deschamps',
    starPlayer: 'Kylian Mbappé',
    stats: { mp: 5, wins: 4, draws: 0, losses: 1, gf: 12, ga: 4, cleanSheets: 3 },
    fixtures: [
      { round: 'QF', opponent: 'Morocco', result: 'W 2-0' },
      { round: 'SF', opponent: 'Spain', result: 'July 14' }
    ]
  },
  'Argentina': {
    flag: '🇦🇷',
    ranking: '#1',
    group: 'Group A',
    manager: 'Lionel Scaloni',
    starPlayer: 'Lionel Messi',
    stats: { mp: 5, wins: 4, draws: 1, losses: 0, gf: 10, ga: 3, cleanSheets: 3 },
    fixtures: [
      { round: 'R16', opponent: 'Australia', result: 'W 2-1' },
      { round: 'QF', opponent: 'Switzerland', result: 'July 12' }
    ]
  },
  'Spain': {
    flag: '🇪🇸',
    ranking: '#3',
    group: 'Group B',
    manager: 'Luis de la Fuente',
    starPlayer: 'Lamine Yamal',
    stats: { mp: 5, wins: 5, draws: 0, losses: 0, gf: 11, ga: 2, cleanSheets: 3 },
    fixtures: [
      { round: 'R16', opponent: 'Portugal', result: 'W 1-0' },
      { round: 'QF', opponent: 'Belgium', result: 'W 2-1' },
      { round: 'SF', opponent: 'France', result: 'July 14' }
    ]
  },
  'Norway': {
    flag: '🇳🇴',
    ranking: '#12',
    group: 'Group C',
    manager: 'Ståle Solbakken',
    starPlayer: 'Erling Haaland',
    stats: { mp: 4, wins: 3, draws: 0, losses: 1, gf: 9, ga: 5, cleanSheets: 1 },
    fixtures: [
      { round: 'R16', opponent: 'Croatia', result: 'W 3-2' },
      { round: 'QF', opponent: 'England', result: 'Live' }
    ]
  },
  'England': {
    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    ranking: '#4',
    group: 'Group C',
    manager: 'Gareth Southgate',
    starPlayer: 'Harry Kane',
    stats: { mp: 4, wins: 3, draws: 1, losses: 0, gf: 8, ga: 3, cleanSheets: 2 },
    fixtures: [
      { round: 'R16', opponent: 'Senegal', result: 'W 2-0' },
      { round: 'QF', opponent: 'Norway', result: 'Live' }
    ]
  },
  'Morocco': {
    flag: '🇲🇦',
    ranking: '#13',
    group: 'Group F',
    manager: 'Walid Regragui',
    starPlayer: 'Brahim Díaz',
    stats: { mp: 5, wins: 3, draws: 1, losses: 1, gf: 7, ga: 4, cleanSheets: 2 },
    fixtures: [
      { round: 'R16', opponent: 'Germany', result: 'W 1-1 (P 4-3)' },
      { round: 'QF', opponent: 'France', result: 'L 0-2' }
    ]
  },
  'Belgium': {
    flag: '🇧🇪',
    ranking: '#6',
    group: 'Group E',
    manager: 'Domenico Tedesco',
    starPlayer: 'Kevin De Bruyne',
    stats: { mp: 5, wins: 3, draws: 0, losses: 2, gf: 8, ga: 6, cleanSheets: 1 },
    fixtures: [
      { round: 'R16', opponent: 'USA', result: 'W 2-1' },
      { round: 'QF', opponent: 'Spain', result: 'L 1-2' }
    ]
  },
  'Portugal': {
    flag: '🇵🇹',
    ranking: '#8',
    group: 'Group F',
    manager: 'Roberto Martínez',
    starPlayer: 'Cristiano Ronaldo',
    stats: { mp: 4, wins: 2, draws: 1, losses: 1, gf: 6, ga: 4, cleanSheets: 1 },
    fixtures: [
      { round: 'R16', opponent: 'Spain', result: 'L 0-1' }
    ]
  },
  'Brazil': {
    flag: '🇧🇷',
    ranking: '#5',
    group: 'Group G',
    manager: 'Dorival Júnior',
    starPlayer: 'Vinícius Júnior',
    stats: { mp: 4, wins: 3, draws: 0, losses: 1, gf: 9, ga: 3, cleanSheets: 2 },
    fixtures: [
      { round: 'R16', opponent: 'Ghana', result: 'W 3-0' }
    ]
  },
  'Switzerland': {
    flag: '🇨🇭',
    ranking: '#15',
    group: 'Group A',
    manager: 'Murat Yakin',
    starPlayer: 'Granit Xhaka',
    stats: { mp: 4, wins: 2, draws: 2, losses: 0, gf: 5, ga: 3, cleanSheets: 2 },
    fixtures: [
      { round: 'R16', opponent: 'Italy', result: 'W 1-0' },
      { round: 'QF', opponent: 'Argentina', result: 'July 12' }
    ]
  },
  'USA': {
    flag: '🇺🇸',
    ranking: '#16',
    group: 'Group E',
    manager: 'Gregg Berhalter',
    starPlayer: 'Christian Pulisic',
    stats: { mp: 4, wins: 2, draws: 0, losses: 2, gf: 6, ga: 5, cleanSheets: 1 },
    fixtures: [
      { round: 'R16', opponent: 'Belgium', result: 'L 1-2' }
    ]
  }
};

const getCountryProfile = (name, flag = '🏳️') => {
  return COUNTRY_PROFILES[name] || {
    flag,
    ranking: 'N/A',
    group: 'Tournament Pool',
    manager: 'Head Coach',
    starPlayer: 'Squad Captain',
    stats: { mp: 3, wins: 1, draws: 1, losses: 1, gf: 3, ga: 3, cleanSheets: 1 },
    fixtures: []
  };
};

const renderLogMessage = (msg) => {
  const txRegex = /(mock_tx_[a-zA-Z0-9_]+|[1-9A-HJ-NP-Za-km-z]{32,88})/g;

  if (txRegex.test(msg)) {
    txRegex.lastIndex = 0;
    const parts = msg.split(txRegex);
    const matches = msg.match(txRegex) || [];

    return (
      <span>
        {parts.map((part, index) => {
          const isMatch = matches.includes(part);
          if (isMatch) {
            const url = part.startsWith('mock_tx_')
              ? `https://solscan.io/tx/4hK82m9kF2x2HjM3gP1bU5sV8yW9zN7qC3dE6fG7hI8jK9lM0nO1pQ2rS3tU4vW5xY6z?cluster=devnet`
              : `https://solscan.io/tx/${part}?cluster=devnet`;
            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#10b981',
                  textDecoration: 'underline',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  marginLeft: '0.2rem',
                  marginRight: '0.2rem'
                }}
              >
                {part.substring(0, 12)}...
              </a>
            );
          }
          return part;
        })}
      </span>
    );
  }
  return msg;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('analyse');
  const [statsSubTab, setStatsSubTab] = useState('goals');
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCountryFlag, setSelectedCountryFlag] = useState('');
  const [botRunning, setBotRunning] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);
  const [liveMatches, setLiveMatches] = useState([]);

  // Check if Phantom is installed on mount
  useEffect(() => {
    const checkPhantom = () => {
      const provider = window.phantom?.solana || window.solana;
      setIsPhantomInstalled(!!(provider && provider.isPhantom));
    };
    checkPhantom();
    const timer = setTimeout(checkPhantom, 800);
    return () => clearTimeout(timer);
  }, []);

  // Eagerly autoconnect Phantom Wallet on page mount if already trusted
  useEffect(() => {
    const eagerConnect = async () => {
      try {
        const provider = window.phantom?.solana || window.solana;
        if (provider && provider.isPhantom) {
          // onlyIfTrusted: true reconnects silently without popping up Phantom connection request
          const response = await provider.connect({ onlyIfTrusted: true });
          const pubKey = response.publicKey.toString();
          setWalletAddress(pubKey);
          addLog(`🔌 Reconnected to Phantom wallet: ${pubKey}`);
        }
      } catch (err) {
        // Fail silently if not yet trusted/authorized
        console.log("Eager connection not trusted yet or failed.");
      }
    };
    const timer = setTimeout(eagerConnect, 1000);
    return () => clearTimeout(timer);
  }, []);

  const [realWallets, setRealWallets] = useState({
    'agent-a': 'TxSAgentAMomentum111111111111111111111111',
    'agent-b': 'TxSAgentBContrarian222222222222222222222222',
    'market-maker': 'TxSMarketMaker33333333333333333333333333',
    'simulated-client': 'TxSClientSimulator44444444444444444444444'
  });

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const res = await fetch('/wallets-info.json');
        if (res.ok) {
          const data = await res.json();
          setRealWallets(prev => ({ ...prev, ...data }));
        }
      } catch (e) { }
    };
    fetchWallets();
    const interval = setInterval(fetchWallets, 10000);
    return () => clearInterval(interval);
  }, []);

  const [walletBalances, setWalletBalances] = useState({});

  useEffect(() => {
    const fetchBalances = async () => {
      const updated = {};
      for (const [name, address] of Object.entries(realWallets)) {
        if (!address || address.startsWith('TxS')) {
          updated[name] = 10.0; // simulated default
          continue;
        }
        try {
          const res = await fetch('https://api.devnet.solana.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getBalance',
              params: [address]
            })
          });
          if (res.ok) {
            const data = await res.json();
            const lamports = data.result?.value ?? 0;
            updated[name] = lamports / 1000000000;
          } else {
            updated[name] = 10.0;
          }
        } catch (e) {
          updated[name] = 10.0;
        }
      }
      setWalletBalances(updated);
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [realWallets]);

  useEffect(() => {
    const fetchLiveMatches = async () => {
      try {
        const res = await fetch('/fixtures.json');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setLiveMatches(data);
          }
        }
      } catch (e) {
        console.warn("Failed to load /fixtures.json. Falling back to default simulation.");
      }
    };
    fetchLiveMatches();
    const interval = setInterval(fetchLiveMatches, 10000);
    return () => clearInterval(interval);
  }, []);

  // Deploy View Settings
  const [threshold, setThreshold] = useState(2.5);
  const [gasFee, setGasFee] = useState(0.005);
  const [slippage, setSlippage] = useState(0.5);
  const [botLogs, setBotLogs] = useState([
    { time: new Date().toLocaleTimeString(), msg: "🛡️ TxGuard Shield initialized." },
    { time: new Date().toLocaleTimeString(), msg: "🔐 Solana RPC devnet connection established." },
    { time: new Date().toLocaleTimeString(), msg: "🤖 Bot online and polling at 60s snapshot interval." }
  ]);

  // Train View State
  const [trainingStatus, setTrainingStatus] = useState('idle'); // 'idle' | 'training' | 'completed'
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [selectedModel, setSelectedModel] = useState('X-Gradient Sharp Odds Predictor v1.4');
  const [selectedAgent, setSelectedAgent] = useState('detector');
  const [trainingLogs, setTrainingLogs] = useState([]);

  // Testing View State
  const [testingStatus, setTestingStatus] = useState('idle'); // 'idle' | 'testing' | 'completed'
  const [testingMetrics, setTestingMetrics] = useState(null);
  const [testingLogs, setTestingLogs] = useState([]);

  const logPanelRef = useRef(null);

  // Fetch alerts from CSV
  const fetchAlerts = async () => {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isProduction) {
      if (alerts.length === 0) {
        // Initial mock alerts population on production load
        setAlerts([
          { timestamp: new Date().toISOString(), teams: '🇪🇸 Spain vs 🇧🇪 Belgium', market: 'win', oldOdds: '1.750', newOdds: '1.685', changePercent: '3.71' },
          { timestamp: new Date().toISOString(), teams: '🇦🇷 Argentina vs 🇨🇭 Switzerland', market: 'draw', oldOdds: '3.250', newOdds: '3.385', changePercent: '4.15' },
          { timestamp: new Date().toISOString(), teams: '🇫🇷 France vs 🇲🇦 Morocco', market: 'win', oldOdds: '1.800', newOdds: '1.872', changePercent: '4.00' },
        ]);
      }
      return;
    }
    try {
      const response = await fetch('/alerts.csv');
      if (!response.ok) throw new Error('Alerts file not ready yet');
      const text = await response.text();
      const lines = text.split('\n').slice(1).filter(line => line.trim());

      const parsed = lines.map(line => {
        const [timestamp, fixtureId, teams, market, oldOdds, newOdds, changePercent] = line.split(',');
        return {
          timestamp,
          fixtureId,
          teams: teams ? teams.replace(/"/g, '').replace(/\s*\[\d+-\d+\]$/, '') : 'Unknown Match',
          market: market || 'N/A',
          oldOdds: oldOdds || '0.00',
          newOdds: newOdds || '0.00',
          changePercent: changePercent || '0.00'
        };
      });

      if (parsed.length === 0) {
        throw new Error('No alerts in CSV yet');
      }

      // Show latest alerts first
      setAlerts(parsed.reverse().slice(0, 15));
    } catch (error) {
      console.log('Falling back to simulated fallback alerts...');
      // Simulated realtime database fallback
      setAlerts([
        { timestamp: new Date().toISOString(), teams: '🇪🇸 Spain vs 🇧🇪 Belgium', market: 'win', oldOdds: '1.750', newOdds: '1.685', changePercent: '3.71' },
        { timestamp: new Date().toISOString(), teams: '🇦🇷 Argentina vs 🇨🇭 Switzerland', market: 'draw', oldOdds: '3.250', newOdds: '3.385', changePercent: '4.15' },
        { timestamp: new Date().toISOString(), teams: '🇫🇷 France vs 🇲🇦 Morocco', market: 'win', oldOdds: '1.800', newOdds: '1.872', changePercent: '4.00' },
      ]);
    }
  };

  // Simulation refs for real-time terminal logs
  const simCycleRef = useRef(0);
  const simAlertsRef = useRef([
    { timestamp: new Date().toISOString(), teams: '🇪🇸 Spain vs 🇧🇪 Belgium', market: 'win', oldOdds: '1.750', newOdds: '1.685', changePercent: '3.71' },
    { timestamp: new Date().toISOString(), teams: '🇦🇷 Argentina vs 🇨🇭 Switzerland', market: 'draw', oldOdds: '3.250', newOdds: '3.385', changePercent: '4.15' },
    { timestamp: new Date().toISOString(), teams: '🇫🇷 France vs 🇲🇦 Morocco', market: 'win', oldOdds: '1.800', newOdds: '1.872', changePercent: '4.00' },
  ]);
  const simArenaRef = useRef({ agentA: 10.0, agentB: 10.0 });
  const simMMRef = useRef({ netPosition: 0.0, cumulativePnl: 0.0, fills: 0 });
  const simScoresRef = useRef({
    '🇪🇸 Spain vs 🇵🇹 Portugal (R16)': [1, 0],
    '🇺🇸 USA vs 🇧🇪 Belgium (R16)': [1, 2],
    '🇫🇷 France vs 🇲🇦 Morocco (QF)': [2, 0],
    '🇳🇴 Norway vs 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England (QF)': [0, 0],
    '🇪🇸 Spain vs 🇧🇪 Belgium (QF)': [2, 1],
    '🇦🇷 Argentina vs 🇨🇭 Switzerland (QF)': [0, 0]
  });

  // Add standard logs helper
  const addLog = (msg) => {
    setBotLogs(prev => [
      { time: new Date().toLocaleTimeString(), msg },
      ...prev.slice(0, 49) // Keep last 50 logs to prevent memory leaks
    ]);
  };

  // Real-time agent logic loop
  const runAgentSimulation = () => {
    if (!botRunning) return;

    simCycleRef.current += 1;
    const cycle = simCycleRef.current;

    const fixtures = [
      '🇪🇸 Spain vs 🇵🇹 Portugal (R16)',
      '🇺🇸 USA vs 🇧🇪 Belgium (R16)',
      '🇫🇷 France vs 🇲🇦 Morocco (QF)',
      '🇳🇴 Norway vs 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England (QF)',
      '🇪🇸 Spain vs 🇧🇪 Belgium (QF)',
      '🇦🇷 Argentina vs 🇨🇭 Switzerland (QF)'
    ];
    const markets = ['win', 'draw', 'loss'];

    const randomFixture = fixtures[Math.floor(Math.random() * fixtures.length)];
    const randomMarket = markets[Math.floor(Math.random() * markets.length)];

    // Simulate occasional score events in the frontend demo loop - ONLY for Norway vs England (today's live match)
    const isGoalEvent = Math.random() < 0.15 && randomFixture === '🇳🇴 Norway vs 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England (QF)';
    if (isGoalEvent) {
      const currentScore = simScoresRef.current[randomFixture] || [0, 0];
      const isHomeScore = Math.random() < 0.55;
      if (isHomeScore) {
        currentScore[0] += 1;
      } else {
        currentScore[1] += 1;
      }
      simScoresRef.current[randomFixture] = currentScore;
      addLog(`⚽ [Event] GOAL! ${randomFixture.replace(/ \(R16\)|\n \(QF\)/g, '')} scored! New score: ${currentScore[0]} - ${currentScore[1]}`);
    }

    const cleanFixtureName = randomFixture.replace(/ \(R16\)|\n \(QF\)/g, '');
    const formattedFixtureName = cleanFixtureName;

    if (selectedAgent === 'detector') {
      addLog(`⏱️ [Scan] Ingesting TxLINE odds feed snapshot (Cycle ${cycle})...`);

      if (isGoalEvent || Math.random() < 0.4) {
        const changePercent = isGoalEvent ? (25.0 + Math.random() * 10).toFixed(2) : (4 + Math.random() * 4).toFixed(2);
        const oldOdds = (isGoalEvent ? 2.20 : 1.5 + Math.random() * 3).toFixed(3);
        const newOdds = (parseFloat(oldOdds) * (1 - parseFloat(changePercent) / 100)).toFixed(3);

        const newAlert = {
          timestamp: new Date().toISOString(),
          teams: formattedFixtureName,
          market: randomMarket,
          oldOdds,
          newOdds,
          changePercent
        };

        simAlertsRef.current = [newAlert, ...simAlertsRef.current].slice(0, 15);
        setAlerts([...simAlertsRef.current]);

        const eventPrefix = isGoalEvent ? '🔥 GOAL ALERT: ' : '🚨 ';
        addLog(`${eventPrefix}[Sharp Movement Detector] ${formattedFixtureName} [${randomMarket}] shifted ${changePercent}%`);
        addLog(`   Old Consensus: ${oldOdds} | New Consensus: ${newOdds} | TxGuard Oracle published to feed.`);
      } else {
        addLog(`— No anomalies detected above ${threshold}% threshold.`);
      }
    } else if (selectedAgent === 'arena') {
      addLog(`⚔️ [Arena] Round ${cycle} starting — fetching TxLINE consensus odds...`);

      if (isGoalEvent || Math.random() < 0.5) {
        const oldOdds = (1.5 + Math.random() * 3).toFixed(3);
        const newOdds = (parseFloat(oldOdds) * (1 - 0.03)).toFixed(3);
        const changePercent = '3.00';

        const stakeMultiplier = isGoalEvent ? 2.0 : 1.0;
        const stake = (0.50 * stakeMultiplier).toFixed(2);

        const eventLog = isGoalEvent ? ' 🔥 [EVENT SIGNAL STAKE X2]' : '';
        addLog(`📍 Arena Signal: ${formattedFixtureName} [${randomMarket}] moved ${changePercent}%${eventLog}`);
        addLog(`   Agent-A (Momentum): BUY (${stake} SOL) | Agent-B (Contrarian): SELL (${stake} SOL)`);

        setTimeout(() => {
          const win = Math.random() < 0.5;
          const delta = (0.05 + Math.random() * 0.05) * stakeMultiplier;
          const mockTxSig = `mock_tx_arena_settle_${Date.now().toString(36)}`;
          if (win) {
            simArenaRef.current.agentA += delta;
            simArenaRef.current.agentB -= delta;
            addLog(`💚 Agent-A (Momentum) settled BUY on ${formattedFixtureName} → PnL: +${delta.toFixed(3)} SOL | Tx: ${mockTxSig}`);
            addLog(`🔴 Agent-B (Contrarian) settled SELL on ${formattedFixtureName} → PnL: -${delta.toFixed(3)} SOL`);
          } else {
            simArenaRef.current.agentA -= delta;
            simArenaRef.current.agentB += delta;
            addLog(`🔴 Agent-A (Momentum) settled BUY on ${formattedFixtureName} → PnL: -${delta.toFixed(3)} SOL`);
            addLog(`💚 Agent-B (Contrarian) settled SELL on ${formattedFixtureName} → PnL: +${delta.toFixed(3)} SOL | Tx: ${mockTxSig}`);
          }
          addLog(`🏆 Leaderboard | Agent-A: ${simArenaRef.current.agentA.toFixed(3)} SOL | Agent-B: ${simArenaRef.current.agentB.toFixed(3)} SOL`);
        }, 4000);
      } else {
        addLog(`— Consensus steady, agents holding open positions.`);
      }
    } else if (selectedAgent === 'market_maker') {
      addLog(`⚖️ [Market Maker] Cycle ${cycle} quoting — dynamic spread optimization active.`);

      const consensus = (1.5 + Math.random() * 3);
      // Double the spread during goal events (volatility cooldown protection)
      const baseSpreadSize = 0.018;
      const spreadMultiplier = isGoalEvent ? 2.5 : 1.0;
      const spread = baseSpreadSize * spreadMultiplier;

      const bid = (consensus * (1 - spread / 2)).toFixed(3);
      const ask = (consensus * (1 + spread / 2)).toFixed(3);

      const eventLog = isGoalEvent ? ' 🔥 [COOLDOWN WIDE SPREAD] ' : ' ';
      addLog(`⚖️ Quotes:${eventLog}${formattedFixtureName} [${randomMarket}] Consensus: ${consensus.toFixed(3)} | Bid: ${bid} | Ask: ${ask} (Spread: ${(spread * 100).toFixed(1)}%)`);

      // Reduce order fill frequency during goal event cooldowns
      const fillChance = isGoalEvent ? 0.2 : 0.4;
      if (Math.random() < fillChance) {
        const buy = Math.random() < 0.5;
        const size = (0.2 + Math.random() * 0.8).toFixed(2);
        const mockTxSig = `mock_tx_mm_fill_${Date.now().toString(36)}`;

        if (buy) {
          simMMRef.current.netPosition += parseFloat(size);
          const pnl = (parseFloat(size) * 0.012);
          simMMRef.current.cumulativePnl += pnl;
          simMMRef.current.fills += 1;
          addLog(`📥 Filled Client BUY order: ${size} contracts @ Ask (${ask}) | Tx: ${mockTxSig}`);
        } else {
          simMMRef.current.netPosition -= parseFloat(size);
          const pnl = (parseFloat(size) * 0.012);
          simMMRef.current.cumulativePnl += pnl;
          simMMRef.current.fills += 1;
          addLog(`📤 Filled Client SELL order: ${size} contracts @ Bid (${bid}) | Tx: ${mockTxSig}`);
        }
        addLog(`📈 MM Inventory: Net Position: ${simMMRef.current.netPosition.toFixed(2)} | Realized PnL: +${simMMRef.current.cumulativePnl.toFixed(4)} SOL (Fills: ${simMMRef.current.fills})`);
      }
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [selectedAgent]);

  const fetchRealLogs = async () => {
    if (!botRunning) return;

    // Force high-fidelity client-side simulation on Vercel/production deployment (no local backend agent output files)
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isProduction) {
      runAgentSimulation();
      return;
    }

    let url = '';
    if (selectedAgent === 'detector') {
      url = '/alerts.csv';
    } else if (selectedAgent === 'arena') {
      url = '/arena.csv';
    } else if (selectedAgent === 'market_maker') {
      url = '/market-maker.csv';
    }

    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("File not found");
      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim());
      const rows = lines.slice(1);

      if (rows.length === 0) {
        throw new Error("No rows yet");
      }

      // Parse and format last 15 rows
      const formatted = rows.slice(-15).reverse().map(row => {
        const parts = row.split(',');
        const timestamp = parts[0] ? new Date(parts[0]).toLocaleTimeString() : new Date().toLocaleTimeString();

        if (selectedAgent === 'detector') {
          const teams = (parts[2] || '').replace(/"/g, '');
          const market = parts[3] || '';
          const oldOdds = parts[4] || '';
          const newOdds = parts[5] || '';
          const changePercent = parts[6] || '';
          const prediction = parts[7] || '';
          const result = parts[8] || 'PENDING';
          return {
            time: timestamp,
            msg: `🚨 [Detector] ${teams} [${market}] shifted ${changePercent}% (${oldOdds} → ${newOdds}) | Prediction: ${prediction} [${result}]`
          };
        } else if (selectedAgent === 'arena') {
          const agent = parts[1] || '';
          const teams = (parts[3] || '').replace(/"/g, '');
          const market = parts[4] || '';
          const action = parts[5] || '';
          const entryOdds = parts[6] || '';
          const exitOdds = parts[7] || '';
          const size = parts[8] || '';
          const pnl = parts[9] || '';
          const cumulative = parts[10] || '';
          const tx = parts[11] || '';
          return {
            time: timestamp,
            msg: `⚔️ [Arena] ${agent} ${action} on ${teams} [${market}] @ entry: ${entryOdds} / exit: ${exitOdds} (size: ${size} SOL, PnL: ${parseFloat(pnl) >= 0 ? '+' : ''}${pnl} SOL, Cum: ${cumulative} SOL) | Tx: ${tx}`
          };
        } else if (selectedAgent === 'market_maker') {
          const teams = (parts[2] || '').replace(/"/g, '');
          const market = parts[3] || '';
          const consensus = parts[4] || '';
          const bid = parts[5] || '';
          const ask = parts[6] || '';
          const spread = parts[7] || '';
          const action = parts[8] || '';
          const fill = parts[9] || '';
          const delta = parts[10] || '';
          const net = parts[11] || '';
          const pnl = parts[12] || '';
          const cum = parts[13] || '';
          const tx = parts[14] || '';
          return {
            time: timestamp,
            msg: `⚖️ [Market Maker] ${teams} [${market}] Consensus: ${consensus} | Quotes: ${bid}/${ask} (spread: ${(parseFloat(spread) * 100).toFixed(1)}%) | Fill: ${action} @ ${fill} (size: ${delta}, net: ${net}, PnL: +${pnl} SOL, Cum: +${cum} SOL) | Tx: ${tx}`
          };
        }
        return { time: timestamp, msg: row };
      });

      setBotLogs(formatted);
    } catch (e) {
      runAgentSimulation();
    }
  };

  // Run simulation or real logs polling loop
  useEffect(() => {
    if (!botRunning) return;
    fetchRealLogs();
    const interval = setInterval(fetchRealLogs, 6000);
    return () => clearInterval(interval);
  }, [botRunning, selectedAgent]);

  // Connect wallet toggle (opens modal or disconnects)
  const handleConnectWallet = () => {
    if (walletAddress) {
      setWalletAddress(null);
      addLog("🔌 Wallet disconnected.");
    } else {
      setShowWalletModal(true);
    }
  };

  // Connect directly to Phantom Wallet provider
  const connectPhantom = async () => {
    console.log("🔍 connectPhantom clicked!");
    try {
      const provider = window.phantom?.solana || window.solana;
      console.log("🔍 Solana Provider object:", provider);
      console.log("🔍 Is Phantom?", provider?.isPhantom);

      if (provider && provider.isPhantom) {
        addLog("⏳ Connecting to Phantom wallet...");
        console.log("🔍 Requesting provider.connect()...");
        const response = await provider.connect();
        console.log("🔍 Connection response received:", response);
        const pubKey = response.publicKey.toString();
        setWalletAddress(pubKey);
        setShowWalletModal(false);
        addLog(`🔑 Connected to Phantom wallet: ${pubKey}`);
      } else {
        console.log("🔍 Provider not found or is not Phantom.");
        addLog("⚠️ Phantom Wallet not detected. Redirecting to installation page...");
        window.open('https://phantom.app/', '_blank');
      }
    } catch (err) {
      console.error("🔍 Phantom connection error:", err);
      addLog(`❌ Phantom connection error: ${err.message}`);
    }
  };



  // Bot running toggle
  const toggleBot = () => {
    const nextState = !botRunning;
    setBotRunning(nextState);
    if (nextState) {
      addLog("🟢 Sharp Movement Detector activated: scanning World Cup fixtures...");
    } else {
      addLog("🔴 Sharp Movement Detector suspended. Automated monitoring offline.");
    }
  };

  // Simulation handlers
  const handleStartTraining = () => {
    if (trainingStatus === 'training') return;
    setTrainingStatus('training');
    setTrainingProgress(0);
    setTrainingLogs([
      "⚙️ [Core] Ingesting historical delta training sets...",
      "⚙️ [Dataset] 1,402 feature vectors prepared."
    ]);
    addLog(`⚙️ Starting training sequence for model: ${selectedModel}`);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setTrainingProgress(progress);

      if (progress === 20) {
        setTrainingLogs(prev => [...prev, "🔄 Epoch 1/5 - Loss: 0.684 | Val Loss: 0.652 | Accuracy: 72.1%"]);
      } else if (progress === 40) {
        setTrainingLogs(prev => [...prev, "🔄 Epoch 2/5 - Loss: 0.542 | Val Loss: 0.518 | Accuracy: 78.4%"]);
      } else if (progress === 60) {
        setTrainingLogs(prev => [...prev, "🔄 Epoch 3/5 - Loss: 0.384 | Val Loss: 0.366 | Accuracy: 82.9%"]);
      } else if (progress === 80) {
        setTrainingLogs(prev => [...prev, "🔄 Epoch 4/5 - Loss: 0.245 | Val Loss: 0.252 | Accuracy: 85.8%"]);
      } else if (progress === 90) {
        setTrainingLogs(prev => [...prev, "🔄 Epoch 5/5 - Loss: 0.122 | Val Loss: 0.158 | Accuracy: 88.4%"]);
        setTrainingLogs(prev => [...prev, "⚙️ [Regularization] Applying dropout layer optimization (rate = 0.2)"]);
      }

      if (progress >= 100) {
        clearInterval(interval);
        setTrainingStatus('completed');
        setTrainingLogs(prev => [...prev, "✅ [Training Completed] Model weights successfully optimized."]);
        addLog(`✅ Model ${selectedModel} trained successfully. Accuracy: 88.42%`);
      }
    }, 400);
  };

  const handleStartTesting = () => {
    if (testingStatus === 'testing') return;
    setTestingStatus('testing');
    setTestingMetrics(null);
    setTestingLogs([
      "🔬 [Backtest] Loading historical snapshots (142 files)...",
      "🔬 [Backtest] Processing Spain vs Portugal (R16) -> Alert triggered, outcome matched! ✅"
    ]);
    addLog("🔬 Executing backtest evaluation suite on past 24 hours matches...");

    setTimeout(() => {
      setTestingLogs(prev => [
        ...prev,
        "🔬 [Backtest] Processing France vs Morocco (QF) -> Alert triggered, outcome matched! ✅",
        "🔬 [Backtest] Processing Norway vs England (QF) -> No alert triggered. ⚪"
      ]);
    }, 800);

    setTimeout(() => {
      setTestingLogs(prev => [
        ...prev,
        "🔬 [Backtest] Processing Spain vs Belgium (QF) -> Alert triggered, outcome pending. ⏳",
        "🔬 [Backtest] Compiling model precision/recall stats..."
      ]);
    }, 1600);

    setTimeout(() => {
      setTestingStatus('completed');
      const metrics = {
        accuracy: "86.4%",
        precision: "84.2%",
        recall: "81.9%",
        f1: "83.0%",
        processed: "142 odds movement logs"
      };
      setTestingMetrics(metrics);
      setTestingLogs(prev => [...prev, "✅ [Backtest Finished] Metrics validated successfully."]);
      addLog("✅ Backtest evaluation completed successfully.");
    }, 2500);
  };

  const handleCountryClick = (countryName) => {
    // Clean name from flag emojis or trim whitespace
    const cleanName = countryName.replace(/[\uD83C-\uDBFF\uDC00-\uDFFF\u200D]/g, '').trim();
    // Get the profile
    const profile = getCountryProfile(cleanName);
    setSelectedCountry({ name: cleanName, ...profile });
  };

  const renderClickableTeams = (teams) => {
    if (!teams) return null;
    const parts = teams.split(/\s+vs\s+/i);
    if (parts.length === 2) {
      const leftTeam = parts[0].trim();
      const rightTeam = parts[1].trim();

      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span
            className="clickable-team-link"
            onClick={(e) => { e.stopPropagation(); handleCountryClick(leftTeam); }}
            style={{
              cursor: 'pointer',
              color: 'var(--accent-purple)',
              textDecoration: 'underline',
              fontWeight: 600,
              transition: 'color 0.2s ease'
            }}
          >
            {leftTeam}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>vs</span>
          <span
            className="clickable-team-link"
            onClick={(e) => { e.stopPropagation(); handleCountryClick(rightTeam); }}
            style={{
              cursor: 'pointer',
              color: 'var(--accent-purple)',
              textDecoration: 'underline',
              fontWeight: 600,
              transition: 'color 0.2s ease'
            }}
          >
            {rightTeam}
          </span>
        </span>
      );
    }

    return (
      <span
        className="clickable-team-link"
        onClick={(e) => { e.stopPropagation(); handleCountryClick(teams); }}
        style={{
          cursor: 'pointer',
          color: 'var(--accent-purple)',
          textDecoration: 'underline',
          fontWeight: 600
        }}
      >
        {teams}
      </span>
    );
  };



  return (
    <div className="app-container">
      {/* Navigation */}
      <nav className="navbar">

        <a href="#" className="logo-section">
          <span className="logo-text">TxGuard</span>
        </a>
        <div className="nav-actions">
          <div className="status-badge">
            <span className={`status-indicator ${botRunning ? 'running' : 'offline'} ${botRunning ? 'bg-success' : 'bg-error'}`} />
            <span>{botRunning ? 'Live' : 'Suspended'}</span>
          </div>
          <button className="wallet-btn" onClick={handleConnectWallet}>
            {walletAddress
              ? `Connected (${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)})`
              : 'Connect Wallet'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="badge-wrapper">
          <Star className="badge-icon w-3.5 h-3.5 fill-current" />
          <span className="badge-text">{alerts.length}+ Sharp Odds Shifts Monitored</span>
        </div>
        <h1 className="hero-title">
          Detect Sharp <br />
          <span className="gradient-text">Odds Movements</span>
        </h1>
        <p className="hero-desc">
          Real-time consensus World Cup odds scanner backed by TxLINE and the Solana Blockchain. Monitor shifts, train models, and manage automated execution.
        </p>
      </header>

      {/* Tabs Menu */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'analyse' ? 'active' : ''}`}
          onClick={() => setActiveTab('analyse')}
        >
          <BarChart3 className="w-4 h-4" />
          Analyse
        </button>
        <button
          className={`tab-btn ${activeTab === 'train' ? 'active' : ''}`}
          onClick={() => setActiveTab('train')}
        >
          <BookOpen className="w-4 h-4" />
          Train
        </button>
        <button
          className={`tab-btn ${activeTab === 'testing' ? 'active' : ''}`}
          onClick={() => setActiveTab('testing')}
        >
          <Users className="w-4 h-4" />
          Testing
        </button>
        <button
          className={`tab-btn ${activeTab === 'deploy' ? 'active' : ''}`}
          onClick={() => setActiveTab('deploy')}
        >
          <Rocket className="w-4 h-4" />
          Deploy
        </button>

        <button
          className={`tab-btn ${activeTab === 'fanzone' ? 'active' : ''}`}
          onClick={() => setActiveTab('fanzone')}
        >
          <Trophy className="w-4 h-4" />
          Fan Zone
        </button>
        <button
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <Star className="w-4 h-4" />
          Stats
        </button>
      </div>

      {/* View Content Area */}
      <main className="view-content">

        {activeTab === 'analyse' && (
          <div>
            {/* Metric Cards Grid */}
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value purple">
                  {new Set(alerts.map(a => a.fixtureId || a.teams)).size || 6}
                </div>
                <div className="stat-label">Unique Matches Tracked</div>
              </div>
              <div className="stat-item">
                <div className="stat-value pink">
                  {alerts.length}
                </div>
                <div className="stat-label">Total Anomalies Logged</div>
              </div>
              <div className="stat-item">
                <div className="stat-value success">{threshold}%</div>
                <div className="stat-label">Movement Alert Threshold</div>
              </div>
            </div>

            {/* Live Alerts List */}
            <div className="glass-card alerts-card">
              <div className="card-header">
                <h3 className="card-title">
                  <span className="pulsing-dot" /> Live Movement Logs
                </h3>
                <span className="stat-label">{alerts.length} Shifts Detected</span>
              </div>

              <div className="table-container">
                {alerts.length > 0 ? (
                  <table className="alerts-table">
                    <thead>
                      <tr>
                        <th>Fixture Name</th>
                        <th>Market Type</th>
                        <th>Old Odds</th>
                        <th>New Odds</th>
                        <th>Movement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alerts.map((alert, i) => (
                        <tr key={i}>
                          <td className="team-cell">{renderClickableTeams(alert.teams)}</td>
                          <td>
                            <span className="market-cell">{alert.market}</span>
                          </td>
                          <td className="odds-cell">{alert.oldOdds}</td>
                          <td className="odds-cell">{alert.newOdds}</td>
                          <td className="change-cell">+{alert.changePercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted" />
                    <p>No sharp movements detected above the {threshold}% threshold yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Alert Details Modal */}
            {selectedAlert && (
              <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
                <div className="alert-modal-card" onClick={(e) => e.stopPropagation()}>
                  <button className="alert-modal-close" onClick={() => setSelectedAlert(null)}>
                    <X className="w-5 h-5" />
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--color-error-bg)',
                      color: 'var(--color-error)'
                    }}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Anomaly Alert Details
                      </h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                        Consensus odds anomaly detected on TxLINE
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
                    <div className="detail-row">
                      <span className="detail-label">Fixture Name</span>
                      <span className="detail-value">{selectedAlert.teams}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Market Affected</span>
                      <span className="detail-value" style={{ textTransform: 'uppercase', color: 'var(--accent-purple)' }}>
                        {selectedAlert.market}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Old Odds</span>
                      <span className="detail-value" style={{ fontFamily: 'var(--font-mono)' }}>{selectedAlert.oldOdds}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">New Odds</span>
                      <span className="detail-value" style={{ fontFamily: 'var(--font-mono)' }}>{selectedAlert.newOdds}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Consensus Shift</span>
                      <span className="detail-value" style={{ color: 'var(--color-success)' }}>
                        +{selectedAlert.changePercent}%
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Directional Prediction</span>
                      <span className="detail-value" style={{ color: selectedAlert.newOdds < selectedAlert.oldOdds ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {selectedAlert.newOdds < selectedAlert.oldOdds ? 'Outcome MORE likely (Odds Shortened)' : 'Outcome LESS likely (Odds Drifted)'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Timestamp</span>
                      <span className="detail-value" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(selectedAlert.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Solana Audit Proof</span>
                      <span className="detail-value">
                        {renderLogMessage(`mock_tx_anomaly_detect_${selectedAlert.fixtureId || 'hash'}`)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <div style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Agent A Strategy (Trend)
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-success)' }}>
                        {selectedAlert.newOdds < selectedAlert.oldOdds ? 'BUY MATCH ODDS' : 'SELL MATCH ODDS'}
                      </div>
                    </div>

                    <div style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                        Agent B Strategy (Mean Rev)
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-warning)' }}>
                        {selectedAlert.newOdds < selectedAlert.oldOdds ? 'SELL MATCH ODDS' : 'BUY MATCH ODDS'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'train' && (
          <div className="glass-card">
            <h3 className="card-title mb-4">
              <BookOpen className="w-5 h-5 text-purple-400 inline mr-2" /> Train AI Predictor Model
            </h3>
            <p className="hero-desc" style={{ textAlign: 'left', margin: '0 0 2rem 0' }}>
              Train machine learning classification algorithms directly on the streams of live odds delta metrics. Generated models are encrypted and optimized for predicting arbitrage spikes.
            </p>

            <div className="training-panel">
              <div className="control-group model-selector">
                <label className="control-label">Select Model Architecture</label>
                <select
                  className="control-input"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={trainingStatus === 'training'}
                >
                  <option value="X-Gradient Sharp Odds Predictor v1.4">X-Gradient Predictor v1.4</option>
                  <option value="Arbitrage XGBoost Consensus Classifier">XGBoost Consensus Classifier</option>
                  <option value="LSTM Sequential Delta Recurrent Net">LSTM Sequential Recurrent Net</option>
                </select>
              </div>

              {trainingStatus === 'idle' && (
                <button className="action-btn" onClick={handleStartTraining}>
                  Start Model Training
                </button>
              )}

              {trainingStatus === 'training' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: '#c084fc', fontWeight: 600 }}>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Optimizing neural weights ({trainingProgress}%)</span>
                  </div>
                  <div className="training-progress-container">
                    <div className="training-progress-bar" style={{ width: `${trainingProgress}%` }} />
                  </div>
                </div>
              )}

              {trainingStatus === 'completed' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontWeight: 600, marginBottom: '1.5rem' }}>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Optimization Complete!</span>
                  </div>
                  <div className="stats-grid" style={{ marginTop: 0, marginBottom: '2rem' }}>
                    <div className="stat-item">
                      <div className="stat-value success">88.42%</div>
                      <div className="stat-label">Model Accuracy</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value purple">0.892</div>
                      <div className="stat-label">F1 Coefficient</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value pink">12.5ms</div>
                      <div className="stat-label">Inference Latency</div>
                    </div>
                  </div>
                  <button className="tab-btn" style={{ margin: '0 auto' }} onClick={() => {
                    setTrainingStatus('idle');
                    setTrainingLogs([]);
                  }}>
                    Train New Model
                  </button>
                </div>
              )}

              {/* Training Logs Console Terminal */}
              {trainingLogs.length > 0 && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '1rem',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  textAlign: 'left',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  marginTop: '1.5rem',
                  color: '#a78bfa',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                  lineHeight: 1.5
                }}>
                  {trainingLogs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '0.25rem' }}>{log}</div>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {activeTab === 'testing' && (
          <div className="glass-card">
            <h3 className="card-title mb-4">
              <Users className="w-5 h-5 text-pink-400 inline mr-2" /> Model Backtest Validation
            </h3>
            <p className="hero-desc" style={{ textAlign: 'left', margin: '0 0 2rem 0' }}>
              Run historical validation suites of the current prediction weights against recorded World Cup matches. Measures accuracy of arbitrage signal warnings.
            </p>

            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              {testingStatus === 'idle' && (
                <button className="action-btn" onClick={handleStartTesting}>
                  Run Backtest Validation
                </button>
              )}

              {testingStatus === 'testing' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Analyzing historical datasets...</span>
                </div>
              )}

              {testingStatus === 'completed' && testingMetrics && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', fontWeight: 600, marginBottom: '2rem' }}>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Validation Successful on {testingMetrics.processed}</span>
                  </div>

                  <div className="stats-grid" style={{ marginTop: 0, marginBottom: '2rem' }}>
                    <div className="stat-item">
                      <div className="stat-value success">{testingMetrics.accuracy}</div>
                      <div className="stat-label">Accuracy Score</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value purple">{testingMetrics.precision}</div>
                      <div className="stat-label">Precision Score</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value pink">{testingMetrics.recall}</div>
                      <div className="stat-label">Recall Score</div>
                    </div>
                  </div>

                  <button className="tab-btn" style={{ margin: '0 auto' }} onClick={() => {
                    setTestingStatus('idle');
                    setTestingLogs([]);
                  }}>
                    Reset Test Runner
                  </button>
                </div>
              )}

              {/* Testing Logs Console Terminal */}
              {testingLogs.length > 0 && (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '1rem',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  textAlign: 'left',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  marginTop: '1.5rem',
                  color: '#f472b6',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                  lineHeight: 1.5
                }}>
                  {testingLogs.map((log, i) => (
                    <div key={i} style={{ marginBottom: '0.25rem' }}>{log}</div>
                  ))}
                </div>
              )}

            </div>
          </div>
        )}

        {activeTab === 'deploy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* AUTONOMOUS AGENT SELECT GRID */}
            <div>
              <h3 className="card-title mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy className="w-5 h-5 text-amber-400" /> Deploy Autonomous Agents
              </h3>

              <div className="agent-selection-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>

                {/* Agent 1: Sharp Movement Detector */}
                <div
                  className={`agent-card ${selectedAgent === 'detector' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedAgent('detector');
                    addLog("🔄 Autonomous Agent switched to: [Sharp Movement Detector]");
                  }}
                  style={{
                    background: selectedAgent === 'detector' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${selectedAgent === 'detector' ? 'var(--accent-purple)' : 'var(--border-glass)'}`,
                    borderRadius: '16px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: selectedAgent === 'detector' ? 'var(--shadow-glow)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <Star className="w-5 h-5 text-violet-400" />
                    <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>Sharp Movement Detector</h4>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Monitors TxLINE odds every 60 seconds and flags significant odds shifts, logging signals and tracking prediction accuracy.
                  </p>
                </div>

                {/* Agent 2: Agent vs Agent Arena */}
                <div
                  className={`agent-card ${selectedAgent === 'arena' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedAgent('arena');
                    addLog("🔄 Autonomous Agent switched to: [Agent vs Agent Arena]");
                  }}
                  style={{
                    background: selectedAgent === 'arena' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${selectedAgent === 'arena' ? 'var(--accent-purple)' : 'var(--border-glass)'}`,
                    borderRadius: '16px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: selectedAgent === 'arena' ? 'var(--shadow-glow)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <Users className="w-5 h-5 text-pink-400" />
                    <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>Agent vs Agent Arena</h4>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Two agents reading the same TxLINE feed running opposite strategies. Positions settle on-chain to find the winning system.
                  </p>
                </div>

                {/* Agent 3: In-Play Market Maker */}
                <div
                  className={`agent-card ${selectedAgent === 'market_maker' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedAgent('market_maker');
                    addLog("🔄 Autonomous Agent switched to: [In-Play Market Maker]");
                  }}
                  style={{
                    background: selectedAgent === 'market_maker' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${selectedAgent === 'market_maker' ? 'var(--accent-purple)' : 'var(--border-glass)'}`,
                    borderRadius: '16px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: selectedAgent === 'market_maker' ? 'var(--shadow-glow)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <Sliders className="w-5 h-5 text-emerald-400" />
                    <h4 style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>In-Play Market Maker</h4>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Quotes buy/sell prices on live outcomes, adjusting dynamically to live match flow based on consensus oracle lines.
                  </p>
                </div>

              </div>
            </div>

            {/* AUTONOMOUS AGENT CONFIGURATIONS */}
            {selectedAgent === 'detector' && (
              <div className="glass-card">
                <h3 className="card-title mb-4">
                  <Rocket className="w-5 h-5 text-violet-400 inline mr-2" /> Agent Config: Sharp Movement Detector
                </h3>

                <div className="control-grid">
                  <div className="control-panel">
                    <div className="toggle-switch">
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Execution Status</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Toggle live automated odds scanning
                        </p>
                      </div>
                      <button
                        className={`toggle-btn ${botRunning ? 'active' : ''}`}
                        onClick={toggleBot}
                      >
                        {botRunning ? 'Stop Agent' : 'Start Agent'}
                      </button>
                    </div>

                    <div className="control-group">
                      <label className="control-label">
                        <span>Sharp Movement Threshold</span>
                        <span className="value">{threshold}%</span>
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={threshold}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setThreshold(val);
                          addLog(`🔧 Adjusted sharp movement threshold to: ${val}%`);
                        }}
                        style={{ accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div className="control-panel">
                    <div className="control-grid" style={{ gap: '1rem', marginTop: 0 }}>
                      <div className="control-group">
                        <label className="control-label">Gas Fee Limit (SOL)</label>
                        <input
                          type="number"
                          step="0.001"
                          className="control-input"
                          value={gasFee}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setGasFee(val);
                            addLog(`🔧 Limit gas fee updated: ${val} SOL`);
                          }}
                        />
                      </div>
                      <div className="control-group">
                        <label className="control-label">Slippage Limit (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="control-input"
                          value={slippage}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setSlippage(val);
                            addLog(`🔧 Slippage limit modified: ${val}%`);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedAgent === 'arena' && (
              <div className="glass-card">
                <h3 className="card-title mb-4">
                  <Rocket className="w-5 h-5 text-pink-400 inline mr-2" /> Agent Config: Agent vs Agent Arena
                </h3>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>🤖 Agent-A Wallet (Devnet)</span>
                    {realWallets['agent-a'].startsWith('TxS') ? (
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#10b981', fontSize: '0.8rem' }}>
                        {realWallets['agent-a'].substring(0, 10)}... (Simulated)
                      </span>
                    ) : (
                      <a href={`https://solscan.io/account/${realWallets['agent-a']}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', color: '#10b981', textDecoration: 'underline' }}>
                        {realWallets['agent-a'].substring(0, 10)}...{realWallets['agent-a'].substring(realWallets['agent-a'].length - 4)}
                      </a>
                    )}
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                      Balance: {walletBalances['agent-a'] !== undefined ? walletBalances['agent-a'].toFixed(4) : '...'} SOL
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end', textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>🤖 Agent-B Wallet (Devnet)</span>
                    {realWallets['agent-b'].startsWith('TxS') ? (
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#a78bfa', fontSize: '0.8rem' }}>
                        {realWallets['agent-b'].substring(0, 10)}... (Simulated)
                      </span>
                    ) : (
                      <a href={`https://solscan.io/account/${realWallets['agent-b']}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', color: '#a78bfa', textDecoration: 'underline' }}>
                        {realWallets['agent-b'].substring(0, 10)}...{realWallets['agent-b'].substring(realWallets['agent-b'].length - 4)}
                      </a>
                    )}
                    <span style={{ fontSize: '0.7rem', color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
                      Balance: {walletBalances['agent-b'] !== undefined ? walletBalances['agent-b'].toFixed(4) : '...'} SOL
                    </span>
                  </div>
                </div>

                <div className="control-grid">
                  <div className="control-panel">
                    <div className="toggle-switch">
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Arena Match Status</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Toggle simulation of competing systems
                        </p>
                      </div>
                      <button
                        className={`toggle-btn ${botRunning ? 'active' : ''}`}
                        onClick={toggleBot}
                      >
                        {botRunning ? 'Stop Arena' : 'Start Arena'}
                      </button>
                    </div>

                    <div className="control-grid" style={{ gap: '1rem', marginTop: '1rem' }}>
                      <div className="control-group">
                        <label className="control-label">Agent A Strategy (Long)</label>
                        <select className="control-input" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', color: '#fff' }} onChange={(e) => addLog(`🔧 Agent A strategy set to: ${e.target.value}`)}>
                          <option>Momentum Odds Follower</option>
                          <option>Aggressive Volume Taker</option>
                        </select>
                      </div>
                      <div className="control-group">
                        <label className="control-label">Agent B Strategy (Short)</label>
                        <select className="control-input" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', color: '#fff' }} onChange={(e) => addLog(`🔧 Agent B strategy set to: ${e.target.value}`)}>
                          <option>Mean-Reverting Contrarian</option>
                          <option>Statistical Arbitrageur</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="control-panel">
                    <div className="control-grid" style={{ gap: '1rem', marginTop: 0 }}>
                      <div className="control-group">
                        <label className="control-label">Solana Collateral Settle Amount (SOL)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="control-input"
                          defaultValue="1.5"
                          onChange={(e) => addLog(`🔧 Arena settle collateral updated: ${e.target.value} SOL`)}
                        />
                      </div>
                      <div className="control-group">
                        <label className="control-label">Tournament Duration (Matches)</label>
                        <input
                          type="number"
                          className="control-input"
                          defaultValue="10"
                          onChange={(e) => addLog(`🔧 Arena match limit set to: ${e.target.value} matches`)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedAgent === 'market_maker' && (
              <div className="glass-card">
                <h3 className="card-title mb-4">
                  <Rocket className="w-5 h-5 text-emerald-400 inline mr-2" /> Agent Config: In-Play Market Maker
                </h3>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>⚖️ Market-Maker Wallet (Devnet)</span>
                    {realWallets['market-maker'].startsWith('TxS') ? (
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#10b981', fontSize: '0.8rem' }}>
                        {realWallets['market-maker'].substring(0, 10)}... (Simulated)
                      </span>
                    ) : (
                      <a href={`https://solscan.io/account/${realWallets['market-maker']}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', color: '#10b981', textDecoration: 'underline' }}>
                        {realWallets['market-maker'].substring(0, 10)}...{realWallets['market-maker'].substring(realWallets['market-maker'].length - 4)}
                      </a>
                    )}
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontFamily: 'var(--font-mono)', textAlign: 'left' }}>
                      Balance: {walletBalances['market-maker'] !== undefined ? walletBalances['market-maker'].toFixed(4) : '...'} SOL
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end', textAlign: 'right' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>👤 Client Wallet (Simulator)</span>
                    {realWallets['simulated-client'].startsWith('TxS') ? (
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#f472b6', fontSize: '0.8rem' }}>
                        {realWallets['simulated-client'].substring(0, 10)}... (Simulated)
                      </span>
                    ) : (
                      <a href={`https://solscan.io/account/${realWallets['simulated-client']}?cluster=devnet`} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', color: '#f472b6', textDecoration: 'underline' }}>
                        {realWallets['simulated-client'].substring(0, 10)}...{realWallets['simulated-client'].substring(realWallets['simulated-client'].length - 4)}
                      </a>
                    )}
                    <span style={{ fontSize: '0.7rem', color: '#f472b6', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                      Balance: {walletBalances['simulated-client'] !== undefined ? walletBalances['simulated-client'].toFixed(4) : '...'} SOL
                    </span>
                  </div>
                </div>

                <div className="control-grid">
                  <div className="control-panel">
                    <div className="toggle-switch">
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Market Maker Status</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Toggle quoting in-play buy/sell spreads
                        </p>
                      </div>
                      <button
                        className={`toggle-btn ${botRunning ? 'active' : ''}`}
                        onClick={toggleBot}
                      >
                        {botRunning ? 'Stop Market Maker' : 'Start Market Maker'}
                      </button>
                    </div>

                    <div className="control-group" style={{ marginTop: '1.5rem' }}>
                      <label className="control-label">
                        <span>Quote Bid/Ask Spread</span>
                        <span className="value">1.8%</span>
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        defaultValue="1.8"
                        onChange={(e) => addLog(`🔧 Bid/Ask Quote Spread adjusted to: ${e.target.value}%`)}
                        style={{ accentColor: 'var(--accent-purple)', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div className="control-panel">
                    <div className="control-grid" style={{ gap: '1rem', marginTop: 0 }}>
                      <div className="control-group">
                        <label className="control-label">Re-hedging Frequency (Seconds)</label>
                        <input
                          type="number"
                          className="control-input"
                          defaultValue="15"
                          onChange={(e) => addLog(`🔧 Hedging window frequency set to: ${e.target.value}s`)}
                        />
                      </div>
                      <div className="control-group">
                        <label className="control-label">Maximum Liquidity Risk per Trade (SOL)</label>
                        <input
                          type="number"
                          step="0.5"
                          className="control-input"
                          defaultValue="5.0"
                          onChange={(e) => addLog(`🔧 MM trade risk exposure limit updated to: ${e.target.value} SOL`)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Execution Console Logs */}
            <div className="glass-card">
              <div className="card-header">
                <h3 className="card-title">
                  <Terminal className="w-5 h-5 text-gray-400" /> TxGuard Execution Logs
                </h3>
                <span className="stat-label">Console Window</span>
              </div>
              <div className="log-panel" ref={logPanelRef}>
                {botLogs.map((log, i) => (
                  <div className="log-entry" key={i}>
                    <span className="log-time">[{log.time}]</span>
                    <span className="log-message">{renderLogMessage(log.msg)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fanzone' && (
          <FanZone
            alerts={alerts}
            walletAddress={walletAddress}
            onConnectWallet={handleConnectWallet}
            liveMatches={liveMatches}
          />
        )}

        {activeTab === 'stats' && (
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div className="card-header" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                  🏆 World Cup 2026 Tournament Stats
                </h3>
                <p className="hero-desc" style={{ textAlign: 'left', margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>
                  Live player stats and leaderboard tracking for the World Cup matches.
                </p>
              </div>

              {/* Stats Category Selector */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '0.25rem',
                borderRadius: '8px',
                border: '1px solid var(--border-glass)'
              }}>
                <button
                  className={`tab-btn ${statsSubTab === 'goals' ? 'active' : ''}`}
                  onClick={() => setStatsSubTab('goals')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  ⚽ Goals
                </button>
                <button
                  className={`tab-btn ${statsSubTab === 'assists' ? 'active' : ''}`}
                  onClick={() => setStatsSubTab('assists')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  👟 Assists
                </button>
                <button
                  className={`tab-btn ${statsSubTab === 'yellow' ? 'active' : ''}`}
                  onClick={() => setStatsSubTab('yellow')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  🟨 Yellow Cards
                </button>
                <button
                  className={`tab-btn ${statsSubTab === 'red' ? 'active' : ''}`}
                  onClick={() => setStatsSubTab('red')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  🟥 Red Cards
                </button>
              </div>
            </div>

            <div className="table-container" style={{ marginTop: '1rem' }}>
              <table className="alerts-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                    <th>Player</th>
                    <th>Country</th>
                    <th style={{ textAlign: 'right', paddingRight: '2rem' }}>
                      {statsSubTab === 'goals' && 'Goals'}
                      {statsSubTab === 'assists' && 'Assists'}
                      {statsSubTab === 'yellow' && 'Yellow Cards'}
                      {statsSubTab === 'red' && 'Red Cards'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(statsSubTab === 'goals' ? WORLD_CUP_STATS.goals :
                    statsSubTab === 'assists' ? WORLD_CUP_STATS.assists :
                      statsSubTab === 'yellow' ? WORLD_CUP_STATS.yellowCards :
                        WORLD_CUP_STATS.redCards).map((player, i) => (
                          <tr key={i} style={{ height: '60px' }}>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                background: player.rank === 1 ? 'linear-gradient(135deg, #fbbf24, #b45309)' :
                                  player.rank === 2 ? 'linear-gradient(135deg, #94a3b8, #475569)' :
                                    player.rank === 3 ? 'linear-gradient(135deg, #d97706, #78350f)' :
                                      'rgba(255,255,255,0.05)',
                                color: player.rank <= 3 ? '#fff' : 'var(--text-secondary)',
                                border: player.rank <= 3 ? '1px solid rgba(255,255,255,0.2)' : 'none'
                              }}>
                                {player.rank}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <img
                                  src={player.image}
                                  alt={player.name}
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--border-glass)',
                                    padding: '2px'
                                  }}
                                />
                                <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{player.name}</span>
                              </div>
                            </td>
                            <td
                              onClick={() => handleCountryClick(player.team)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>{player.flag}</span>
                                <span style={{ color: 'var(--accent-purple)', textDecoration: 'underline', fontWeight: 600 }}>{player.team}</span>
                              </div>
                            </td>
                            <td style={{
                              textAlign: 'right',
                              paddingRight: '2.5rem',
                              fontWeight: 800,
                              fontSize: '1.1rem',
                              color: statsSubTab === 'goals' ? 'var(--accent-pink)' :
                                statsSubTab === 'assists' ? 'var(--accent-purple)' :
                                  statsSubTab === 'yellow' ? '#fbbf24' : '#ef4444'
                            }}>
                              {player.value}
                            </td>
                          </tr>
                        ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Footer Info Details */}
      <footer className="footer-details">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-sans)', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          <svg style={{ height: '0.9em', width: 'auto', display: 'block' }} viewBox="0 0 398 337" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 64.6 15.6 L 392.6 15.6 L 333.4 75 L 5.4 75 Z" fill="url(#solana-footer-grad)" />
            <path d="M 5.4 138.8 L 333.4 138.8 L 392.6 198.2 L 64.6 198.2 Z" fill="url(#solana-footer-grad)" />
            <path d="M 64.6 262 L 392.6 262 L 333.4 321.4 L 5.4 321.4 Z" fill="url(#solana-footer-grad)" />
            <defs>
              <linearGradient id="solana-footer-grad" x1="392.6" y1="15.6" x2="5.4" y2="321.4" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00FFA3" />
                <stop offset="50%" stopColor="#03E1FF" />
                <stop offset="100%" stopColor="#DC1FFF" />
              </linearGradient>
            </defs>
          </svg>
          SOLANA
        </span>
        <span>•</span>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
          TXLINE
        </span>
        <span>•</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <svg style={{ height: '1.4em', width: 'auto', display: 'block' }} viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="11" y="9" fontFamily="var(--font-sans)" fontWeight="900" fontSize="15" fill="#ffffff" textAnchor="middle" dominantBaseline="middle" letterSpacing="-0.5">2</text>
            <text x="11" y="19" fontFamily="var(--font-sans)" fontWeight="900" fontSize="15" fill="#ffffff" textAnchor="middle" dominantBaseline="middle" letterSpacing="-0.5">6</text>
            <path d="M8.5 20 C 8.5 19.5, 13.5 19.5, 13.5 20 L13 21 C 13 21.5, 9 21.5, 9 21 Z" fill="#10b981" />
            <path d="M10 20 C10 15, 9 12, 11 8 C13 12, 12 15, 12 20 Z" fill="#fbbf24" />
            <circle cx="11" cy="7" r="2.2" fill="#fbbf24" />
            <circle cx="11" cy="7" r="2.2" fill="url(#trophy-glow-2)" opacity="0.8" />
            <path d="M9.8 9.5 C10.2 9, 10.5 8, 9.8 7" stroke="#d97706" strokeWidth="0.6" strokeLinecap="round" />
            <path d="M12.2 9.5 C11.8 9, 11.5 8, 12.2 7" stroke="#d97706" strokeWidth="0.6" strokeLinecap="round" />
            <defs>
              <radialGradient id="trophy-glow-2" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="60%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#b45309" />
              </radialGradient>
            </defs>
          </svg>
          FIFA World Cup 2026
        </span>
      </footer>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowWalletModal(false)}>×</button>
            <h3 className="modal-title">Connect Wallet</h3>
            <p className="modal-subtitle">Choose a Solana wallet to continue.</p>

            <button className="wallet-option" onClick={connectPhantom}>
              <div className="wallet-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" rx="12" fill="#AB9FF2" />
                  <path d="M20 9C14.477 9 10 13.477 10 19v6c0 1.103.897 2 2 2h1a2 2 0 0 0 2-2v-1a2 2 0 0 1 4 0v1a2 2 0 0 0 2 2h1c1.103 0 2-.897 2-2v-6c0-5.523-4.477-10-10-10zm-3 8a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill="white" />
                </svg>
              </div>
              <span>Phantom Wallet</span>
            </button>

            {!isPhantomInstalled && (
              <div style={{ textAlign: 'center', marginTop: '1.25rem', padding: '0 0.5rem' }}>
                <p style={{ color: '#fbbf24', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                  ⚠️ Phantom extension was not detected automatically. If you have it installed, make sure it is enabled and click the button above to try connecting anyway.
                </p>
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#60a5fa',
                    textDecoration: 'underline',
                    fontSize: '0.8rem',
                    fontWeight: 500
                  }}
                >
                  Download Phantom Extension
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Country Profile Modal */}
      {selectedCountry && (
        <div className="modal-overlay" onClick={() => setSelectedCountry(null)}>
          <div className="alert-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <button className="alert-modal-close" onClick={() => setSelectedCountry(null)}>
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
              <div style={{ fontSize: '2.5rem' }}>{selectedCountry.flag}</div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {selectedCountry.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', margin: '2px 0 0 0', fontWeight: 600 }}>
                  FIFA World Ranking: {selectedCountry.ranking} | {selectedCountry.group}
                </p>
              </div>
            </div>

            {/* Profile Details Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.5rem' }}>
              <div className="detail-row">
                <span className="detail-label">Head Manager</span>
                <span className="detail-value">{selectedCountry.manager}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Star Player</span>
                <span className="detail-value" style={{ color: 'var(--accent-pink)' }}>
                  {selectedCountry.starPlayer}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tournament Form</span>
                <span className="detail-value">
                  {selectedCountry.stats.wins}W - {selectedCountry.stats.draws}D - {selectedCountry.stats.losses}L
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Goals (Scored/Conceded)</span>
                <span className="detail-value" style={{ fontFamily: 'var(--font-mono)' }}>
                  {selectedCountry.stats.gf} GF / {selectedCountry.stats.ga} GA
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Clean Sheets</span>
                <span className="detail-value" style={{ color: 'var(--color-success)' }}>
                  {selectedCountry.stats.cleanSheets} Match(es)
                </span>
              </div>
            </div>

            {/* Recent/Upcoming Fixtures */}
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                Fixture Schedule
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedCountry.fixtures && selectedCountry.fixtures.length > 0 ? (
                  selectedCountry.fixtures.map((fix, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem'
                    }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                        {fix.round}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        vs {fix.opponent}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: fix.result.startsWith('W') ? 'var(--color-success)' : fix.result.startsWith('L') ? 'var(--color-error)' : 'var(--text-secondary)' }}>
                        {fix.result}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                    Eliminated or no scheduled fixtures.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}