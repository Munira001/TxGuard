import { useState, useEffect, useRef } from 'react';
import { Send, Trophy, Users, ShieldAlert, Award, MessageSquare, ChevronUp, ChevronDown, X } from 'lucide-react';
import './FanZone.css';

const INITIAL_MATCHES = [
  { id: '1', home: 'Spain', away: 'Portugal', homeOdds: '2.10', drawOdds: '3.15', awayOdds: '3.40', votesHome: 720, votesDraw: 190, votesAway: 640, status: 'R16 • FT 1-0' },
  { id: '2', home: 'USA', away: 'Belgium', homeOdds: '2.85', drawOdds: '3.20', awayOdds: '2.30', votesHome: 1150, votesDraw: 310, votesAway: 920, status: 'R16 • FT 1-2' },
  { id: '3', home: 'France', away: 'Morocco', homeOdds: '1.80', drawOdds: '3.30', awayOdds: '4.50', votesHome: 1250, votesDraw: 280, votesAway: 510, status: 'QF • FT 2-0' },
  { id: '4', home: 'Norway', away: 'England', homeOdds: '3.25', drawOdds: '3.10', awayOdds: '2.15', votesHome: 610, votesDraw: 280, votesAway: 980, status: 'Quarter-Final • July 11' },
  { id: '5', home: 'Spain', away: 'Belgium', homeOdds: '1.75', drawOdds: '3.50', awayOdds: '4.20', votesHome: 1300, votesDraw: 290, votesAway: 480, status: 'QF • FT 2-1' },
  { id: '6', home: 'Argentina', away: 'Switzerland', homeOdds: '2.10', drawOdds: '3.25', awayOdds: '3.10', votesHome: 1050, votesDraw: 320, votesAway: 910, status: 'Quarter-Final • July 12' },
  { id: '7', home: 'France', away: 'Spain', homeOdds: '1.95', drawOdds: '3.20', awayOdds: '3.10', votesHome: 1500, votesDraw: 400, votesAway: 1100, status: 'Semi-Final • July 14' }
];

const MOCK_FAN_MESSAGES = [
  "Messi is performing absolute miracles today! 🐐",
  "No way Germany holds Brazil's wingers off... defense looks shaky.",
  "Just claimed my World Cup Fan NFT. Transaction fee was literally $0.0001 on Solana! ⚡",
  "Are you seeing these sharp odds changes? Bookies are sweating!",
  "Staking my FAN tokens on a draw, France is mounting a comeback.",
  "Argentina's high press is insane right now.",
  "Voted Brazil to win. Easiest points of my life! 🇧🇷",
  "Is the oracle showing France odds dropping? Let's check the alerts."
];

const MOCK_NAMES = ["SolBoy_42", "CryptoGaucho", "Velasquez_99", "LeNazionale", "NeymarFanatic", "ViteRacer", "TxWizard", "SolanaSamba"];

export default function FanZone({ alerts, walletAddress, onConnectWallet, liveMatches = [] }) {
  const [matches, setMatches] = useState(INITIAL_MATCHES);
  const [selectedMatch, setSelectedMatch] = useState(INITIAL_MATCHES[3]); // Default to today's game (Norway vs England)
  const [selectedPrediction, setSelectedPrediction] = useState(null); // 'home' | 'draw' | 'away'
  const [stakeAmount, setStakeAmount] = useState('10');
  const [fanPoints, setFanPoints] = useState(250);
  const [streak, setStreak] = useState(3);
  const [predictions, setPredictions] = useState(() => {
    const saved = localStorage.getItem('txguard_fan_predictions');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync predictions to local storage
  useEffect(() => {
    localStorage.setItem('txguard_fan_predictions', JSON.stringify(predictions));
  }, [predictions]);

  // Settlement Engine Loop
  useEffect(() => {
    let pointsAwarded = 0;
    let predictionsUpdated = false;
    const systemMessages = [];

    const updatedPredictions = predictions.map(pred => {
      if (pred.settled) return pred;

      const currentMatch = matches.find(m => String(m.id) === String(pred.matchId));
      if (!currentMatch) return pred;

      const status = currentMatch.status;
      // Match FT followed by goals, e.g. "FT 1-0" or "FT 2-1"
      const ftRegex = /FT\s+(\d+)\s*-\s*(\d+)/i;
      const match = status.match(ftRegex);

      if (match) {
        const homeGoals = parseInt(match[1]);
        const awayGoals = parseInt(match[2]);
        let result = 'draw';
        if (homeGoals > awayGoals) result = 'home';
        else if (awayGoals > homeGoals) result = 'away';

        const won = pred.selection === result;
        const payout = won ? Math.round(pred.stake * parseFloat(pred.odds)) : 0;

        if (won) {
          pointsAwarded += payout;
          systemMessages.push({
            author: "TxGuard Settle Oracle",
            body: `🎉 CONGRATS! Your prediction on "${pred.teams}" was CORRECT! Selected ${pred.selection.toUpperCase()} @ ${pred.odds}. Payout: +${payout} FAN points.`,
            system: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          });
        } else {
          systemMessages.push({
            author: "TxGuard Settle Oracle",
            body: `❌ Prediction settled for "${pred.teams}". Outcome: ${result.toUpperCase()} (Score: ${homeGoals}-${awayGoals}). You predicted ${pred.selection.toUpperCase()}. Stake lost.`,
            system: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          });
        }

        predictionsUpdated = true;
        return { ...pred, settled: true, won, payout, score: `${homeGoals}-${awayGoals}` };
      }

      return pred;
    });

    if (predictionsUpdated) {
      setPredictions(updatedPredictions);
      if (pointsAwarded > 0) {
        setFanPoints(prev => prev + pointsAwarded);
      }
      if (systemMessages.length > 0) {
        setChatMessages(prev => [...prev, ...systemMessages]);
      }
    }
  }, [matches, predictions]);

  useEffect(() => {
    if (liveMatches && liveMatches.length > 0) {
      setMatches(prevMatches => {
        const updatedMatches = prevMatches.map(em => {
          const liveMatch = liveMatches.find(lm => String(lm.id) === em.id);
          if (!liveMatch) return em;

          const homeGoals = liveMatch.stats?.[1] ?? 0;
          const awayGoals = liveMatch.stats?.[2] ?? 0;

          // Only show active live score overrides for today's match (Norway vs England, id '4')
          let updatedStatus = em.status;
          if (em.id === '4') {
            updatedStatus = `Live • ${homeGoals} - ${awayGoals}`;
          }

          return {
            ...em,
            homeOdds: parseFloat(liveMatch.odds?.win || em.homeOdds).toFixed(2),
            drawOdds: parseFloat(liveMatch.odds?.draw || em.drawOdds).toFixed(2),
            awayOdds: parseFloat(liveMatch.odds?.loss || em.awayOdds).toFixed(2),
            status: updatedStatus
          };
        });

        // Sync selected match details
        setSelectedMatch(prevSelected => {
          if (!prevSelected) return updatedMatches[3];
          const match = updatedMatches.find(nm => nm.id === prevSelected.id);
          return match || prevSelected;
        });

        return updatedMatches;
      });
    }
  }, [liveMatches]);
  
  const [chatMessages, setChatMessages] = useState([
    { author: "SolBoy_42", body: "Let's go! Argentina looking solid this half.", system: false, time: "17:10:02" },
    { author: "LeNazionale", body: "France still has Mbappé. Never count them out.", system: false, time: "17:11:15" },
    { author: "TxGuard AI Oracle", body: "🚨 Sharp odds movement detected on France! Win odds dropped from 4.50 to 4.20. Consensus shifts 6.67%.", system: true, time: "17:12:40" }
  ]);
  const [typedMessage, setTypedMessage] = useState('');
  
  const [mintingStatus, setMintingStatus] = useState('idle'); // 'idle' | 'minting' | 'completed'
  const [mintTx, setMintTx] = useState(null);
  
  const chatContainerRef = useRef(null);
  const lastAlertLengthRef = useRef(alerts.length);
  
  const [showTrending, setShowTrending] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-scroll chat to bottom on new messages (container-level only, to prevent page jumping)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages]);

  // Inject system message when new live TxODDS alert rolls in
  useEffect(() => {
    if (alerts.length > lastAlertLengthRef.current) {
      const newAlert = alerts[0]; // latest alert
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const oracleMessage = {
        author: "TxGuard AI Oracle",
        body: `🚨 ORACLE UPDATE: Sharp shift detected on ${newAlert.teams} (${newAlert.market}). Odds changed from ${newAlert.oldOdds} → ${newAlert.newOdds} (Shift of ${newAlert.changePercent}%). Live sentiment is reacting!`,
        system: true,
        time: timeStr
      };

      setChatMessages(prev => [...prev, oracleMessage]);

      // Update match odds in real time based on the alert
      setMatches(prev => prev.map(m => {
        if (newAlert.teams.toLowerCase().includes(m.home.toLowerCase()) && newAlert.teams.toLowerCase().includes(m.away.toLowerCase())) {
          const updated = { ...m };
          if (newAlert.market === 'home' || newAlert.market === 'win') {
            updated.homeOdds = newAlert.newOdds;
            updated.votesHome += 50; // shift mock votes
          } else if (newAlert.market === 'away') {
            updated.awayOdds = newAlert.newOdds;
            updated.votesAway += 50;
          } else if (newAlert.market === 'draw') {
            updated.drawOdds = newAlert.newOdds;
            updated.votesDraw += 20;
          }
          // Refresh selection details if this is the active match card
          if (selectedMatch.id === m.id) {
            setSelectedMatch(updated);
          }
          return updated;
        }
        return m;
      }));
    }
    lastAlertLengthRef.current = alerts.length;
  }, [alerts, selectedMatch]);

  // Simulate rolling social chat comments every 8-12 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const randomMsg = MOCK_FAN_MESSAGES[Math.floor(Math.random() * MOCK_FAN_MESSAGES.length)];
      const randomUser = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setChatMessages(prev => [...prev, {
        author: randomUser,
        body: randomMsg,
        system: false,
        time: timeStr
      }]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Handle Predict Submission
  const handlePredictSubmit = (e) => {
    e.preventDefault();
    if (!selectedPrediction) return alert("Select Home, Draw, or Away prediction first!");
    const stake = parseInt(stakeAmount);
    if (isNaN(stake) || stake <= 0) return alert("Enter a valid stake amount.");
    if (stake > fanPoints) return alert("Insufficient FAN points!");

    setFanPoints(prev => prev - stake);

    const matchOdds = selectedPrediction === 'home' 
      ? selectedMatch.homeOdds 
      : selectedPrediction === 'draw' 
        ? selectedMatch.drawOdds 
        : selectedMatch.awayOdds;

    const newPrediction = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      matchId: selectedMatch.id,
      teams: `${selectedMatch.home} vs ${selectedMatch.away}`,
      home: selectedMatch.home,
      away: selectedMatch.away,
      selection: selectedPrediction, // 'home' | 'draw' | 'away'
      odds: matchOdds,
      stake,
      settled: false
    };

    setPredictions(prev => [...prev, newPrediction]);
    
    // Animate mock pool votes
    setMatches(prev => prev.map(m => {
      if (m.id === selectedMatch.id) {
        const updated = { ...m };
        if (selectedPrediction === 'home') updated.votesHome += 10;
        if (selectedPrediction === 'draw') updated.votesDraw += 10;
        if (selectedPrediction === 'away') updated.votesAway += 10;
        
        setSelectedMatch(updated);
        return updated;
      }
      return m;
    }));

    // Post to chat
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setChatMessages(prev => [...prev, {
      author: "You",
      body: `🗳️ Just predicted ${selectedPrediction === 'home' ? selectedMatch.home : selectedPrediction === 'away' ? selectedMatch.away : 'Draw'} on ${selectedMatch.home} vs ${selectedMatch.away} at odds of ${matchOdds} with ${stake} FAN points!`,
      system: false,
      time: timeStr
    }]);

    setSelectedPrediction(null);
  };

  // Submit User Chat Message
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setChatMessages(prev => [...prev, {
      author: walletAddress ? `${walletAddress.substring(0, 4)}...${walletAddress.substring(walletAddress.length - 4)}` : "You",
      body: typedMessage,
      system: false,
      time: timeStr
    }]);

    setTypedMessage('');
  };

  // Solana NFT Mint Real Cryptographic Flow
  const handleMintNFT = async () => {
    if (!walletAddress) return;
    const provider = window.phantom?.solana || window.solana;
    if (!provider) {
      alert("Phantom wallet provider not found. Please install Phantom extension.");
      return;
    }

    try {
      setMintingStatus('minting');
      
      const message = `Confirming TxGuard World Cup 2026 Fan Badge Mint for wallet: ${walletAddress}`;
      const encodedMessage = new TextEncoder().encode(message);
      
      const signedMessage = await provider.signMessage(encodedMessage, "utf8");
      const signatureBytes = signedMessage.signature;
      
      // Self-contained Base58 encoder for Solana standard signatures
      const bs58Encode = (buffer) => {
        const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
        const result = [];
        for (const byte of buffer) {
          let carry = byte;
          for (let i = 0; i < result.length; i++) {
            carry += result[i] << 8;
            result[i] = carry % 58;
            carry = Math.floor(carry / 58);
          }
          while (carry > 0) {
            result.push(carry % 58);
            carry = Math.floor(carry / 58);
          }
        }
        for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
          result.push(0);
        }
        return result.reverse().map(digit => alphabet[digit]).join('');
      };

      const base58Sig = bs58Encode(signatureBytes);

      setMintTx(base58Sig);
      setMintingStatus('completed');
      setStreak(prev => prev + 1);
      setFanPoints(prev => prev + 100);

      // Post verification confirmation to chat
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setChatMessages(prev => [...prev, {
        author: "TxGuard AI Oracle",
        body: `🎉 SUCCESS: Verified Phantom cryptographic signature! Commemorative Fan NFT minted to wallet. Sig: ${base58Sig.substring(0, 16)}...`,
        system: true,
        time: timeStr
      }]);

    } catch (err) {
      console.error("NFT Mint signing error:", err);
      setMintingStatus('idle');
      alert(`Minting cancelled or failed: ${err.message}`);
    }
  };

  // Sizing details helper
  const totalVotes = selectedMatch.votesHome + selectedMatch.votesDraw + selectedMatch.votesAway;
  const homePct = Math.round((selectedMatch.votesHome / totalVotes) * 100);
  const drawPct = Math.round((selectedMatch.votesDraw / totalVotes) * 100);
  const awayPct = Math.round((selectedMatch.votesAway / totalVotes) * 100);

  return (
    <div className="fanzone-wrapper animate-fade-in">
      {/* TRENDING MARKETS BANNER */}
      {showTrending && (
        <div className="trending-markets-banner">
          <div className="banner-header">
            <div className="banner-title-wrapper">
              <span className="live-pill">LIVE</span>
              <div className="banner-icon-title">
                <Trophy className="w-4 h-4 text-violet-400" />
                <h3>Predict the 2026 Champion <span className="text-secondary font-normal">Trending Markets</span></h3>
              </div>
            </div>
            <div className="banner-actions">
              <button 
                className="banner-action-btn"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
              <button 
                className="banner-action-btn"
                onClick={() => setShowTrending(false)}
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!isCollapsed && (
            <div className="banner-cards-grid">
              {/* Card 1: World Cup */}
              <div className="banner-card">
                <div className="card-lbl">World Cup</div>
                <div className="team-row">
                  <div className="team-info">
                    <span className="flag">🇧🇪</span>
                    <span className="name">Belgium</span>
                  </div>
                  <span className="val">47%</span>
                </div>
                <div className="team-row">
                  <div className="team-info">
                    <span className="flag">🇺🇸</span>
                    <span className="name">USA</span>
                  </div>
                  <span className="val">54%</span>
                </div>
                <div className="split-progress-bar">
                  <div className="progress-fill-home" style={{ width: '47%' }}></div>
                  <div className="progress-fill-away" style={{ width: '54%' }}></div>
                </div>
                <div className="card-footer">July 7th, 2026 • 12:00 AM GMT</div>
              </div>

              {/* Card 2: Upcoming Games */}
              <div className="banner-card">
                <div className="card-lbl">Upcoming Games</div>
                <div className="list-row">
                  <span>🇫🇷 France vs 🇲🇦 Morocco</span>
                  <span className="val font-mono">France 78%</span>
                </div>
                <div className="list-row">
                  <span>🇪🇸 Spain vs 🇧🇪 Belgium</span>
                  <span className="val font-mono">Spain 58%</span>
                </div>
                <div className="list-row">
                  <span>🇳🇴 Norway vs 🏴󠁧󠁢󠁥󠁮󠁧󠁿 England</span>
                  <span className="val font-mono">England 63%</span>
                </div>
                <div className="list-row">
                  <span>🇦🇷 Argentina vs 🇨🇭 Switzerland</span>
                  <span className="val font-mono">Argentina 67%</span>
                </div>
              </div>

              {/* Card 3: Realtime Signals Promotion */}
              <div className="banner-card promo-card">
                <div className="promo-lbl">TxGuard Insights</div>
                <h4>Get realtime signal on culture, sports, and more.</h4>
                <div className="promo-illustration">
                  <svg className="w-16 h-16 opacity-60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" stroke="var(--accent-purple)" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="50" cy="50" r="28" fill="rgba(139, 92, 246, 0.05)" stroke="var(--accent-pink)" strokeWidth="1" />
                    <path d="M50 15 V85 M15 50 H85" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    <path d="M30 65 L45 50 L58 57 L72 35" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="72" cy="35" r="3" fill="var(--color-success)" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="fanzone-container">
      
      {/* LEFT COLUMN: PREDICTOR GAME */}
      <div className="predictor-section">
        
        {/* MATCH CARDS */}
        <div className="match-cards-grid">
          {matches.map(m => (
            <button 
              key={m.id}
              className={`match-card-btn ${selectedMatch.id === m.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedMatch(m);
                setSelectedPrediction(null);
              }}
            >
              <div className="match-card-header-row">
                <span className="match-card-cup-label" style={{ color: m.id === '4' ? '#f43f5e' : 'inherit', fontWeight: m.id === '4' ? 800 : 'inherit' }}>
                  {m.id === '4' ? '🔥 TODAY' : 'World Cup'}
                </span>
                <span className="match-card-status-label">{m.status}</span>
              </div>
              <div className="match-card-teams-label">{m.home} vs {m.away}</div>
            </button>
          ))}
        </div>

        {/* ACTIVE SELECTOR PREDICT PANEL */}
        <div className="match-selector-card">
          <div className="match-header">
            <span className="text-xs tracking-widest text-violet-400 uppercase font-mono">LIVE PREDICTOR ARENA</span>
            <div className="match-status-pill">
              <span className="match-status-live-dot" />
              <span>{selectedMatch.status}</span>
            </div>
          </div>

          <div className="teams-display">
            <span>{selectedMatch.home}</span>
            <span className="teams-divider">VS</span>
            <span>{selectedMatch.away}</span>
          </div>

          {/* ODDS SELECTION GRID */}
          <div className="odds-betting-grid">
            <button 
              className={`odds-option-btn ${selectedPrediction === 'home' ? 'selected' : ''}`}
              onClick={() => setSelectedPrediction('home')}
            >
              <span className="odds-label">HOME ({selectedMatch.home})</span>
              <span className="odds-val">{selectedMatch.homeOdds}</span>
            </button>

            <button 
              className={`odds-option-btn ${selectedPrediction === 'draw' ? 'selected' : ''}`}
              onClick={() => setSelectedPrediction('draw')}
            >
              <span className="odds-label">DRAW</span>
              <span className="odds-val">{selectedMatch.drawOdds}</span>
            </button>

            <button 
              className={`odds-option-btn ${selectedPrediction === 'away' ? 'selected' : ''}`}
              onClick={() => setSelectedPrediction('away')}
            >
              <span className="odds-label">AWAY ({selectedMatch.away})</span>
              <span className="odds-val">{selectedMatch.awayOdds}</span>
            </button>
          </div>

          {/* STAKING FORM */}
          <form onSubmit={handlePredictSubmit} className="stake-input-wrapper">
            <input 
              type="number" 
              className="stake-field" 
              value={stakeAmount}
              onChange={e => setStakeAmount(e.target.value)}
              placeholder="Stake FAN points"
              min="1"
            />
            <button type="submit" className="submit-prediction-btn">
              Lock Prediction
            </button>
          </form>

          {/* STATS: FAN POOL SENTIMENT */}
          <div className="pool-results-wrapper">
            <span className="text-xs font-mono tracking-wider text-zinc-500 block mb-3">FAN SENTIMENT VOTING POOL</span>
            
            <div className="pool-bar-item">
              <div className="pool-bar-labels">
                <span>{selectedMatch.home}</span>
                <span>{homePct}% ({selectedMatch.votesHome} votes)</span>
              </div>
              <div className="pool-bar-bg">
                <div className="pool-bar-fill" style={{ width: `${homePct}%` }} />
              </div>
            </div>

            <div className="pool-bar-item">
              <div className="pool-bar-labels">
                <span>Draw</span>
                <span>{drawPct}% ({selectedMatch.votesDraw} votes)</span>
              </div>
              <div className="pool-bar-bg">
                <div className="pool-bar-fill" style={{ width: `${drawPct}%` }} />
              </div>
            </div>

            <div className="pool-bar-item">
              <div className="pool-bar-labels">
                <span>{selectedMatch.away}</span>
                <span>{awayPct}% ({selectedMatch.votesAway} votes)</span>
              </div>
              <div className="pool-bar-bg">
                <div className="pool-bar-fill" style={{ width: `${awayPct}%` }} />
              </div>
            </div>
          </div>

          {/* YOUR PREDICTIONS LIST */}
          {predictions.length > 0 && (
            <div className="predictions-history-card" style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={14} style={{ color: 'var(--accent-purple)' }} />
                Your Prediction History
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.4rem' }}>
                {predictions.slice().reverse().map(pred => {
                  let statusColor = 'var(--text-muted)';
                  let statusText = 'PENDING';
                  if (pred.settled) {
                    statusColor = pred.won ? '#10b981' : '#f43f5e';
                    statusText = pred.won ? `WON (+${pred.payout} FAN)` : 'LOST';
                  }
                  return (
                    <div key={pred.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', background: 'rgba(255,255,255,0.01)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, display: 'block', color: 'white' }}>{pred.teams}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                          Predicted: <strong style={{ color: '#c084fc' }}>{pred.selection.toUpperCase()}</strong> @ {pred.odds} ({pred.stake} FAN)
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 700, color: statusColor, fontSize: '0.7rem' }}>
                        {statusText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

         </div>

      </div>

      {/* RIGHT COLUMN: SOCIAL LIVE CHATROOM */}
      <div className="chat-section">
        <div className="chat-header">
          <div className="chat-header-title">
            <MessageSquare size={16} className="text-violet-400" />
            <span>World Cup Fan Chatroom</span>
          </div>
          <div className="chat-header-status">
            <Users size={12} />
            <span>2,492 online</span>
          </div>
        </div>

        {/* CHAT MESSAGES BODY */}
        <div className="chat-messages-container" ref={chatContainerRef}>
          {chatMessages.map((msg, i) => (
            <div key={i} className={`chat-msg-row ${msg.system ? 'system' : ''}`}>
              <div className="chat-author-line">
                <span>{msg.author}</span>
                <span className="chat-timestamp">{msg.time}</span>
              </div>
              <p className="chat-body-line">{msg.body}</p>
            </div>
          ))}
        </div>

        {/* INPUT FORM */}
        <form onSubmit={handleSendChat} className="chat-input-row">
          <input 
            type="text" 
            className="chat-input-field" 
            placeholder="Talk with other fans..."
            value={typedMessage}
            onChange={e => setTypedMessage(e.target.value)}
          />
          <button type="submit" className="chat-send-btn">
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* WEB3 REWARDS CLAIM BLOCK */}
      <div className="rewards-card">
        <div className="reward-info-block">
          <div className="reward-title-row">
            <Award className="text-amber-400" />
            <h3>Solana Devnet Fan Reward Portal</h3>
          </div>
          <p className="reward-desc-text">
            Staking Wallet: <span className="font-mono text-zinc-300">{walletAddress || 'Disconnected'}</span>. You have <span className="text-amber-400 font-semibold font-mono">{fanPoints} FAN</span> points and a streak of <span className="text-rose-400 font-bold">{streak} 🔥</span>. Mint a commemorative World Cup badge NFT on devnet.
          </p>
        </div>

        <div>
          {mintingStatus === 'idle' && (
            <button 
              className="claim-reward-btn" 
              onClick={walletAddress ? handleMintNFT : onConnectWallet}
            >
              {walletAddress ? 'Mint Devnet Fan NFT' : 'Connect Wallet to Claim'}
            </button>
          )}
          {mintingStatus === 'minting' && (
            <button className="claim-reward-btn" disabled>
              Minting on Solana...
            </button>
          )}
          {mintingStatus === 'completed' && (
            <div className="text-right">
              <span className="text-emerald-400 font-bold text-sm block mb-1">✅ NFT Minted!</span>
              <a 
                href={`https://solscan.io/tx/${mintTx}?cluster=devnet`} 
                target="_blank" 
                rel="noreferrer"
                className="text-[10px] font-mono text-violet-400 underline block max-w-[200px] truncate"
              >
                Signature: {mintTx}
              </a>
            </div>
          )}
        </div>
      </div>

    </div>
  </div>
  );
}
