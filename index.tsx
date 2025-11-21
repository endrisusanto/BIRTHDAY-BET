import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Plus, Lock, Upload, Trash2, Gift, Users, ShieldCheck, X, AlertTriangle, Banknote, Sparkles, CheckCircle, Terminal, HelpCircle, ArrowUpDown, LogOut, Edit2, Save, User, History, LayoutDashboard, Search, Filter, BarChart3, DollarSign, Calendar, ChevronRight, Smile, Zap, Crown, Ghost } from 'lucide-react';

// --- Types ---
interface Candidate {
  id: string;
  name: string;
  imageUrl: string;
  voteCount: number;    
  totalAmount: number;  
}

interface BetLog {
    id: string;
    userId: string;
    username: string;
    userIp: string;
    candidateId: string;
    candidateName: string;
    amount: number;
    timestamp: number;
}

interface UserSession {
  userId: string; // Unique ID for history tracking
  username: string; 
  ip: string; 
  avatarIcon: string;
  hasVotedFor: string | null; 
  lastBetAmount: number; 
}

// --- Constants ---
const MIN_BET_IDR = 10000;
const DEFAULT_BET_IDR = 50000;
const ADMIN_PASSWORD = 'admin123';
const UNIX_NAMES = ['root', 'daemon', 'bin', 'sys', 'sync', 'games', 'man', 'mail', 'news', 'uucp', 'proxy', 'www-data', 'backup', 'list', 'irc', 'gnats', 'nobody', 'systemd-network', 'neon_ghost', 'cyber_punk', 'obsidian_rat', 'glitch_user'];
const AVATARS = ['smile', 'zap', 'crown', 'ghost', 'terminal', 'users', 'shield'];

type ModalType = 'NONE' | 'AUTH' | 'ADD' | 'DELETE_CONFIRM' | 'BET_CONFIRM' | 'PROFILE' | 'ADMIN_DASHBOARD';
type AuthIntent = 'ADD' | 'DELETE' | 'DASHBOARD' | null;
type SortMode = 'VALUE' | 'NAME';
type DashboardTab = 'OVERVIEW' | 'BETS' | 'USERS';

// --- Utils ---
const generateSimulatedIP = () => {
  return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

const generateUnixUsername = () => {
  return UNIX_NAMES[Math.floor(Math.random() * UNIX_NAMES.length)];
};

const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9);
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const formatIDR = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
};

// --- Components ---

const App = () => {
  // -- State --
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [betHistory, setBetHistory] = useState<BetLog[]>([]);
  
  const [session, setSession] = useState<UserSession>({ 
      userId: '', 
      username: 'guest', 
      ip: '', 
      avatarIcon: 'smile',
      hasVotedFor: null, 
      lastBetAmount: 0 
  });
  
  // UI State
  const [sortMode, setSortMode] = useState<SortMode>('VALUE');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal & Admin State
  const [activeModal, setActiveModal] = useState<ModalType>('NONE');
  const [authIntent, setAuthIntent] = useState<AuthIntent>(null);
  const [targetCandidateId, setTargetCandidateId] = useState<string | null>(null);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  
  // Inputs
  const [passwordInput, setPasswordInput] = useState('');
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateImage, setNewCandidateImage] = useState<string | null>(null);
  const [betAmountInput, setBetAmountInput] = useState<number>(DEFAULT_BET_IDR);
  const [errorMsg, setErrorMsg] = useState('');
  const [tempUsername, setTempUsername] = useState('');

  // Animation State
  const [justVotedId, setJustVotedId] = useState<string | null>(null);

  // -- Initialization --
  useEffect(() => {
    // Load Session
    const storedIp = localStorage.getItem('obsidian_user_ip');
    const storedUser = localStorage.getItem('obsidian_username');
    const storedUserId = localStorage.getItem('obsidian_user_id');
    const storedAvatar = localStorage.getItem('obsidian_user_avatar');
    const storedVote = localStorage.getItem('obsidian_user_vote');
    const storedBetAmount = localStorage.getItem('obsidian_user_bet_amount');
    
    let currentIp = storedIp;
    let currentUser = storedUser;
    let currentUserId = storedUserId;

    if (!currentIp) {
      currentIp = generateSimulatedIP();
      localStorage.setItem('obsidian_user_ip', currentIp);
    }

    if (!currentUser) {
      currentUser = generateUnixUsername();
      localStorage.setItem('obsidian_username', currentUser);
    }
    
    if (!currentUserId) {
        currentUserId = generateUserId();
        localStorage.setItem('obsidian_user_id', currentUserId);
    }

    setSession({
      userId: currentUserId!,
      ip: currentIp!,
      username: currentUser!,
      avatarIcon: storedAvatar || 'smile',
      hasVotedFor: storedVote,
      lastBetAmount: storedBetAmount ? parseInt(storedBetAmount) : 0
    });

    setTempUsername(currentUser!);

    // Load Candidates (Database Simulation)
    const storedCandidates = localStorage.getItem('obsidian_candidates');
    if (storedCandidates) {
      try {
        const parsed = JSON.parse(storedCandidates);
        // Migration logic for old data structure
        const migrated = parsed.map((c: any) => ({
            id: c.id,
            name: c.name,
            imageUrl: c.imageUrl,
            voteCount: c.voteCount !== undefined ? c.voteCount : (c.votes || 0),
            totalAmount: c.totalAmount !== undefined ? c.totalAmount : ((c.votes || 0) * DEFAULT_BET_IDR)
        }));
        setCandidates(migrated);
      } catch (e) {
        console.error("Failed to parse candidates", e);
      }
    }

    // Load History
    const storedHistory = localStorage.getItem('obsidian_bet_history');
    if (storedHistory) {
        try {
            setBetHistory(JSON.parse(storedHistory));
        } catch (e) { console.error(e); }
    }
  }, []);

  // -- Persistence --
  useEffect(() => {
    if (candidates.length > 0 || localStorage.getItem('obsidian_candidates')) {
      localStorage.setItem('obsidian_candidates', JSON.stringify(candidates));
    }
  }, [candidates]);

  useEffect(() => {
      if (betHistory.length > 0) {
          localStorage.setItem('obsidian_bet_history', JSON.stringify(betHistory));
      }
  }, [betHistory]);

  // -- Derived State --
  const totalPool = candidates.reduce((acc, c) => acc + c.totalAmount, 0);
  const totalVoters = candidates.reduce((acc, c) => acc + c.voteCount, 0);
  
  // Sorting Logic
  const sortedCandidates = [...candidates].sort((a, b) => {
    if (sortMode === 'VALUE') {
        return b.totalAmount - a.totalAmount;
    } else {
        return a.name.localeCompare(b.name);
    }
  });

  const winningCandidate = candidates.length > 0 
    ? [...candidates].sort((a, b) => b.totalAmount - a.totalAmount)[0] 
    : null;
  
  const targetCandidate = candidates.find(c => c.id === targetCandidateId);

  // Admin Data Processing
  const filteredBets = useMemo(() => {
      return betHistory.filter(bet => 
        bet.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        bet.candidateName.toLowerCase().includes(searchTerm.toLowerCase())
      ).sort((a,b) => b.timestamp - a.timestamp);
  }, [betHistory, searchTerm]);

  const uniqueUsers = useMemo(() => {
      const users = new Map();
      betHistory.forEach(bet => {
          if (!users.has(bet.userId)) {
              users.set(bet.userId, {
                  userId: bet.userId,
                  username: bet.username,
                  ip: bet.userIp,
                  totalBet: 0,
                  lastActive: 0
              });
          }
          const u = users.get(bet.userId);
          u.totalBet += bet.amount;
          if (bet.timestamp > u.lastActive) u.lastActive = bet.timestamp;
      });
      return Array.from(users.values()).sort((a,b) => b.totalBet - a.totalBet);
  }, [betHistory]);

  // -- Handlers --

  const openAuthModal = (intent: AuthIntent, targetId?: string) => {
    if (adminAuthenticated) {
      if (intent === 'ADD') {
        setActiveModal('ADD');
      } else if (intent === 'DELETE' && targetId) {
        setTargetCandidateId(targetId);
        setActiveModal('DELETE_CONFIRM');
      } else if (intent === 'DASHBOARD') {
        setActiveModal('ADMIN_DASHBOARD');
      }
    } else {
      setAuthIntent(intent);
      if (targetId) setTargetCandidateId(targetId);
      setActiveModal('AUTH');
      setErrorMsg('');
      setPasswordInput('');
    }
  };

  const handleAdminLogout = () => {
      setAdminAuthenticated(false);
      setActiveModal('NONE');
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setAdminAuthenticated(true);
      if (authIntent === 'ADD') {
        setActiveModal('ADD');
      } else if (authIntent === 'DELETE') {
        setActiveModal('DELETE_CONFIRM');
      } else if (authIntent === 'DASHBOARD') {
        setActiveModal('ADMIN_DASHBOARD');
      } else {
        setActiveModal('NONE');
      }
    } else {
      setErrorMsg('Access Denied: Incorrect Password');
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateName || !newCandidateImage) {
      setErrorMsg('Please provide both name and image');
      return;
    }

    const newCandidate: Candidate = {
      id: Date.now().toString(),
      name: newCandidateName,
      imageUrl: newCandidateImage,
      voteCount: 0,
      totalAmount: 0
    };

    setCandidates(prev => [...prev, newCandidate]);
    closeModal();
  };

  const handleDeleteCandidate = () => {
    if (targetCandidateId) {
      setCandidates(prev => prev.filter(c => c.id !== targetCandidateId));
      
      // Reset session vote if deleted
      if (session.hasVotedFor === targetCandidateId) {
        setSession(prev => ({ ...prev, hasVotedFor: null, lastBetAmount: 0 }));
        localStorage.removeItem('obsidian_user_vote');
        localStorage.removeItem('obsidian_user_bet_amount');
      }
    }
    closeModal();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setNewCandidateImage(base64);
      } catch (err) {
        setErrorMsg('Failed to process image');
      }
    }
  };

  const initiateVote = (candidateId: string) => {
    setTargetCandidateId(candidateId);
    setBetAmountInput(DEFAULT_BET_IDR); 
    setActiveModal('BET_CONFIRM');
  }

  const confirmVote = () => {
    if (!targetCandidateId) return;
    const candidate = candidates.find(c => c.id === targetCandidateId);
    if (!candidate) return;

    // Update Candidates
    setCandidates(prev => prev.map(c => {
      if (c.id === targetCandidateId) {
          // Logic: If switching, we consider this a NEW bet for simplicity in display, 
          // but ideally we would refund the previous candidate. 
          // For this app's "Accumulator" style: We just add the difference or full amount?
          // Let's stick to: One user = One Active Vote. 
          // If switching, remove value from old, add to new.
          return { 
              ...c, 
              voteCount: c.id === session.hasVotedFor ? c.voteCount : c.voteCount + 1,
              totalAmount: c.id === session.hasVotedFor 
                ? (c.totalAmount - session.lastBetAmount + betAmountInput) 
                : (c.totalAmount + betAmountInput) 
          };
      }
      if (c.id === session.hasVotedFor && c.id !== targetCandidateId) {
        return { 
            ...c, 
            voteCount: Math.max(0, c.voteCount - 1),
            totalAmount: Math.max(0, c.totalAmount - session.lastBetAmount)
        };
      }
      return c;
    }));

    // Log the Bet
    const newLog: BetLog = {
        id: Date.now().toString(),
        userId: session.userId,
        username: session.username,
        userIp: session.ip,
        candidateId: targetCandidateId,
        candidateName: candidate.name,
        amount: betAmountInput,
        timestamp: Date.now()
    };
    setBetHistory(prev => [newLog, ...prev]);

    // Update Session
    setSession(prev => ({ 
        ...prev, 
        hasVotedFor: targetCandidateId,
        lastBetAmount: betAmountInput 
    }));
    
    localStorage.setItem('obsidian_user_vote', targetCandidateId);
    localStorage.setItem('obsidian_user_bet_amount', betAmountInput.toString());
    
    setJustVotedId(targetCandidateId);
    setTimeout(() => setJustVotedId(null), 1500);
    
    closeModal();
  };

  const saveProfile = () => {
      if (tempUsername.trim().length > 0) {
          setSession(prev => ({ ...prev, username: tempUsername }));
          localStorage.setItem('obsidian_username', tempUsername);
          localStorage.setItem('obsidian_user_avatar', session.avatarIcon);
      }
      setActiveModal('NONE');
  };

  const closeModal = () => {
    setActiveModal('NONE');
    setPasswordInput('');
    setNewCandidateName('');
    setNewCandidateImage(null);
    setErrorMsg('');
    setTargetCandidateId(null);
    setAuthIntent(null);
  };

  // -- Render Helper --
  const getIcon = (name: string) => {
      switch(name) {
          case 'zap': return <Zap size={20} />;
          case 'crown': return <Crown size={20} />;
          case 'ghost': return <Ghost size={20} />;
          case 'terminal': return <Terminal size={20} />;
          case 'users': return <Users size={20} />;
          case 'shield': return <ShieldCheck size={20} />;
          default: return <Smile size={20} />;
      }
  };

  // -- Render --

  return (
    <div className="min-h-screen pb-24 relative overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-black -z-10"></div>
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

      {/* Header */}
      <header className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 relative">
        <div className="text-center lg:text-left animate-float">
          <div className="flex items-center gap-3 justify-center lg:justify-start mb-2">
            <Gift className="w-8 h-8 md:w-10 md:h-10 text-fuchsia-500 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]" />
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 neon-text">
              BIRTHDAY BET
            </h1>
          </div>
          <p className="text-cyan-400/80 text-xs md:text-sm font-light tracking-widest uppercase">
            Place your stakes on the best gift
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
           {/* Stats Panel */}
           <div className="flex gap-3 md:gap-4 w-full justify-center lg:justify-end">
                <div className="glass-panel px-4 md:px-6 py-3 rounded-2xl flex flex-col items-center md:items-end border-cyan-500/20 flex-1 md:flex-none">
                    <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Banknote size={12} /> Total Pool
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-cyan-300 neon-text">
                        {formatIDR(totalPool)}
                    </span>
                </div>
                <div className="glass-panel px-4 md:px-6 py-3 rounded-2xl flex flex-col items-center md:items-end border-fuchsia-500/20 flex-1 md:flex-none">
                    <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Users size={12} /> Voters
                    </span>
                    <span className="text-xl md:text-2xl font-bold text-fuchsia-300 neon-text">
                        {totalVoters}
                    </span>
                </div>
           </div>
           
           {/* Controls */}
           <div className="flex items-center gap-2">
               <button 
                 onClick={() => setActiveModal('PROFILE')}
                 className="glass-panel p-3 rounded-xl hover:bg-cyan-500/10 transition-colors text-slate-300 hover:text-cyan-300 flex items-center gap-2"
                 title="My Profile"
               >
                 <User size={18} />
               </button>

               <button 
                 onClick={() => setSortMode(prev => prev === 'VALUE' ? 'NAME' : 'VALUE')}
                 className="glass-panel p-3 rounded-xl hover:bg-white/5 transition-colors text-slate-400 hover:text-cyan-400 flex items-center gap-2 text-xs uppercase font-bold tracking-wider"
                 title="Toggle Sort"
               >
                 <ArrowUpDown size={18} />
                 <span className="hidden md:inline">{sortMode === 'VALUE' ? 'Highest Value' : 'Name A-Z'}</span>
               </button>

               {/* Admin Access Button */}
               <button 
                    onClick={() => openAuthModal('DASHBOARD')}
                    className={`glass-panel p-3 rounded-xl transition-colors ${adminAuthenticated ? 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10' : 'text-slate-500 hover:text-white'}`}
                    title="Admin Dashboard"
                >
                    {adminAuthenticated ? <LayoutDashboard size={18} /> : <Lock size={18} />}
                </button>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-4 md:pt-8">
        {candidates.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Gift className="w-16 h-16 mx-auto mb-4 text-slate-700" />
            <p className="text-xl text-slate-500">No gift options added yet.</p>
            <p className="text-sm text-slate-600 mt-2">Be the first to suggest a gift!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {sortedCandidates.map((candidate) => {
              const isLeading = winningCandidate?.id === candidate.id && candidate.totalAmount > 0;
              const isVoted = session.hasVotedFor === candidate.id;
              const isJustVoted = justVotedId === candidate.id;

              return (
                <div 
                  key={candidate.id}
                  className={`relative group glass-panel rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-2
                    ${isLeading ? 'border-fuchsia-500/50 shadow-[0_0_30px_rgba(217,70,239,0.15)]' : 'hover:border-cyan-500/30'}
                    ${isJustVoted ? 'ring-2 ring-green-400 ring-offset-2 ring-offset-black animate-pop' : ''}
                  `}
                >
                  {/* Leading Badge */}
                  {isLeading && (
                    <div className="absolute top-4 right-4 z-20 bg-fuchsia-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1">
                      <Sparkles size={10} /> LEADING
                    </div>
                  )}

                  {/* Delete Button (Admin Trigger) */}
                  {adminAuthenticated && (
                    <button
                        onClick={(e) => {
                        e.stopPropagation();
                        openAuthModal('DELETE', candidate.id);
                        }}
                        className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                        title="Delete Candidate"
                    >
                        <Trash2 size={16} />
                    </button>
                  )}

                  {/* Image */}
                  <div className="h-56 md:h-64 w-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent z-10"></div>
                    <img 
                      src={candidate.imageUrl} 
                      alt={candidate.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative z-20 -mt-20 p-6">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-1 truncate">{candidate.name}</h3>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-cyan-400 text-sm font-mono font-bold">{formatIDR(candidate.totalAmount)}</span>
                      <span className="text-slate-400 text-xs flex items-center gap-1"><Users size={10}/> {candidate.voteCount}</span>
                    </div>

                    <button
                      onClick={() => initiateVote(candidate.id)}
                      className={`w-full py-3 md:py-4 rounded-xl font-bold tracking-wider transition-all duration-300 relative overflow-hidden
                        ${isVoted 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                          : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-95'
                        }
                      `}
                    >
                      {isVoted ? (
                        <span className="flex items-center justify-center gap-2 text-sm md:text-base">
                          <CheckCircle size={18} /> RAISE BET
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2 text-sm md:text-base">
                          <Banknote size={18} /> BET
                        </span>
                      )}
                      
                      {!isVoted && (
                         <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:animate-[shine_1s_infinite]"></div>
                      )}
                    </button>
                  </div>

                  {/* Just Voted Feedback */}
                  {isJustVoted && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                      <div className="bg-black/80 backdrop-blur-sm rounded-full p-4 animate-pop">
                        <CheckCircle className="w-12 h-12 text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Button FAB */}
      <button
        onClick={() => openAuthModal('ADD')}
        className="fixed bottom-8 right-8 md:bottom-10 md:right-10 w-14 h-14 md:w-16 md:h-16 bg-cyan-500 hover:bg-cyan-400 rounded-full flex items-center justify-center text-black shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] transition-all duration-300 z-40 group hover:scale-110 active:scale-95"
      >
        <Plus className="w-6 h-6 md:w-8 md:h-8 transition-transform group-hover:rotate-90" />
      </button>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 py-6 text-center px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 text-slate-600 text-xs font-mono">
             <div onClick={() => setActiveModal('PROFILE')} className="flex items-center gap-2 cursor-pointer group">
                 <div className="text-cyan-600">{getIcon(session.avatarIcon)}</div>
                 <span className="text-cyan-700/80 group-hover:text-cyan-400 transition-colors">{session.username}</span>
                 <span className="text-slate-700">@{session.ip}</span>
             </div>
        </div>
      </footer>

      {/* --- Modals --- */}

      {activeModal !== 'NONE' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          
          {/* 1. Auth Modal */}
          {activeModal === 'AUTH' && (
            <div className="bg-[#111] border border-cyan-500/30 rounded-2xl p-6 md:p-8 w-11/12 max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
              <button onClick={closeModal} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                  <Lock className="text-cyan-400 w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Admin Access</h2>
              </div>
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <input
                  type="password"
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none text-center tracking-widest"
                />
                {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all">
                  Unlock
                </button>
              </form>
            </div>
          )}

          {/* 2. User Profile Modal */}
          {activeModal === 'PROFILE' && (
              <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
                  <button onClick={closeModal} className="absolute top-4 right-4 text-slate-500 hover:text-white z-10"><X size={24} /></button>
                  
                  <div className="p-8">
                      <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                          <User className="text-fuchsia-400" /> Player Profile
                      </h2>

                      <div className="flex flex-col md:flex-row gap-8 mb-10">
                          {/* Avatar & Name Edit */}
                          <div className="flex-1 flex flex-col items-center gap-4">
                              <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 border border-white/20 flex items-center justify-center text-cyan-300">
                                    <div className="scale-[2.5]">{getIcon(session.avatarIcon)}</div>
                                </div>
                              </div>
                              <div className="flex gap-2 justify-center flex-wrap max-w-[200px]">
                                  {AVATARS.map(icon => (
                                      <button 
                                        key={icon}
                                        onClick={() => setSession(prev => ({ ...prev, avatarIcon: icon }))}
                                        className={`p-2 rounded-lg hover:bg-white/10 ${session.avatarIcon === icon ? 'bg-white/10 text-cyan-400' : 'text-slate-500'}`}
                                      >
                                          {getIcon(icon)}
                                      </button>
                                  ))}
                              </div>
                              
                              <div className="w-full space-y-2">
                                  <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Username</label>
                                  <div className="flex gap-2">
                                      <input 
                                          value={tempUsername}
                                          onChange={(e) => setTempUsername(e.target.value)}
                                          className="bg-black border border-white/10 rounded-lg px-3 py-2 flex-1 text-white focus:border-cyan-500 outline-none"
                                      />
                                      <button onClick={saveProfile} className="bg-cyan-500/20 text-cyan-400 px-3 rounded-lg hover:bg-cyan-500/30"><Save size={18}/></button>
                                  </div>
                              </div>
                          </div>

                          {/* Stats */}
                          <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5">
                              <h3 className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-4">Contribution Stats</h3>
                              <div className="space-y-4">
                                  <div className="flex justify-between items-end pb-2 border-b border-white/5">
                                      <span className="text-slate-400">Total Bet</span>
                                      <span className="text-2xl font-bold text-cyan-400">
                                          {formatIDR(betHistory.filter(b => b.userId === session.userId).reduce((acc, b) => acc + b.amount, 0))}
                                      </span>
                                  </div>
                                  <div className="flex justify-between items-end pb-2 border-b border-white/5">
                                      <span className="text-slate-400">Total Votes</span>
                                      <span className="text-xl font-bold text-white">
                                          {betHistory.filter(b => b.userId === session.userId).length}
                                      </span>
                                  </div>
                                  <div className="flex justify-between items-end">
                                      <span className="text-slate-400">Current Pick</span>
                                      <span className="text-sm font-bold text-fuchsia-400 truncate max-w-[120px]">
                                          {candidates.find(c => c.id === session.hasVotedFor)?.name || 'None'}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* History List */}
                      <div>
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><History size={18} /> History</h3>
                          <div className="bg-black/50 rounded-xl border border-white/10 overflow-hidden">
                              {betHistory.filter(b => b.userId === session.userId).length === 0 ? (
                                  <div className="p-8 text-center text-slate-500">No betting history found.</div>
                              ) : (
                                  <div className="divide-y divide-white/10">
                                      {betHistory.filter(b => b.userId === session.userId).sort((a,b) => b.timestamp - a.timestamp).map(bet => (
                                          <div key={bet.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                              <div className="flex items-center gap-3">
                                                  <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400">
                                                      <Banknote size={16} />
                                                  </div>
                                                  <div>
                                                      <div className="text-white font-medium">{bet.candidateName}</div>
                                                      <div className="text-xs text-slate-500">{formatDate(bet.timestamp)}</div>
                                                  </div>
                                              </div>
                                              <div className="text-cyan-400 font-mono font-bold">
                                                  +{formatIDR(bet.amount)}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* 3. Admin Dashboard Modal */}
          {activeModal === 'ADMIN_DASHBOARD' && (
               <div className="fixed inset-0 bg-[#050505] z-50 flex flex-col">
                   {/* Admin Header */}
                   <div className="bg-[#111] border-b border-white/10 p-4 flex justify-between items-center">
                       <div className="flex items-center gap-3">
                           <div className="bg-red-500/10 p-2 rounded-lg text-red-400"><ShieldCheck /></div>
                           <div>
                               <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                               <p className="text-xs text-slate-500">Manage bets, users, and pool</p>
                           </div>
                       </div>
                       <div className="flex items-center gap-3">
                           <button onClick={handleAdminLogout} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 flex items-center gap-2 text-sm font-bold">
                               <LogOut size={16}/> Logout
                           </button>
                           <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-lg text-slate-400"><X /></button>
                       </div>
                   </div>

                   {/* Admin Content */}
                   <div className="flex-1 flex overflow-hidden">
                       {/* Sidebar */}
                       <div className="w-64 bg-[#0a0a0a] border-r border-white/10 p-4 hidden md:block space-y-2">
                           <button onClick={() => setDashboardTab('OVERVIEW')} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${dashboardTab === 'OVERVIEW' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:bg-white/5'}`}>
                               <BarChart3 size={18} /> Overview
                           </button>
                           <button onClick={() => setDashboardTab('BETS')} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${dashboardTab === 'BETS' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:bg-white/5'}`}>
                               <History size={18} /> All Bets
                           </button>
                           <button onClick={() => setDashboardTab('USERS')} className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${dashboardTab === 'USERS' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:bg-white/5'}`}>
                               <Users size={18} /> User List
                           </button>
                       </div>

                       {/* Main View */}
                       <div className="flex-1 p-6 md:p-10 overflow-y-auto">
                           
                           {dashboardTab === 'OVERVIEW' && (
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                                        <div className="text-slate-400 text-xs uppercase font-bold mb-2">Total Pool Value</div>
                                        <div className="text-3xl font-bold text-cyan-400">{formatIDR(totalPool)}</div>
                                    </div>
                                    <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                                        <div className="text-slate-400 text-xs uppercase font-bold mb-2">Total Transactions</div>
                                        <div className="text-3xl font-bold text-fuchsia-400">{betHistory.length}</div>
                                    </div>
                                    <div className="bg-[#111] p-6 rounded-2xl border border-white/10">
                                        <div className="text-slate-400 text-xs uppercase font-bold mb-2">Active Users</div>
                                        <div className="text-3xl font-bold text-white">{uniqueUsers.length}</div>
                                    </div>
                               </div>
                           )}

                           {/* Search & Filter Bar */}
                           {(dashboardTab === 'BETS' || dashboardTab === 'USERS') && (
                               <div className="flex gap-4 mb-6">
                                   <div className="flex-1 bg-[#111] border border-white/10 rounded-xl flex items-center px-4 py-3">
                                       <Search className="text-slate-500 mr-3" size={20} />
                                       <input 
                                           type="text" 
                                           placeholder="Search users or gifts..." 
                                           value={searchTerm}
                                           onChange={(e) => setSearchTerm(e.target.value)}
                                           className="bg-transparent text-white outline-none flex-1"
                                       />
                                   </div>
                               </div>
                           )}

                           {/* Bets Table */}
                           {dashboardTab === 'BETS' && (
                               <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                                   <table className="w-full text-left text-sm text-slate-400">
                                       <thead className="bg-white/5 text-slate-300 uppercase font-bold text-xs">
                                           <tr>
                                               <th className="p-4">Time</th>
                                               <th className="p-4">User</th>
                                               <th className="p-4">Gift</th>
                                               <th className="p-4 text-right">Amount</th>
                                           </tr>
                                       </thead>
                                       <tbody className="divide-y divide-white/5">
                                           {filteredBets.map(bet => (
                                               <tr key={bet.id} className="hover:bg-white/5 transition-colors">
                                                   <td className="p-4 font-mono">{formatDate(bet.timestamp)}</td>
                                                   <td className="p-4 text-white">{bet.username} <span className="text-xs text-slate-600">@{bet.userIp}</span></td>
                                                   <td className="p-4">{bet.candidateName}</td>
                                                   <td className="p-4 text-right text-cyan-400 font-mono">+{formatIDR(bet.amount)}</td>
                                               </tr>
                                           ))}
                                       </tbody>
                                   </table>
                               </div>
                           )}

                           {/* Users Table */}
                           {dashboardTab === 'USERS' && (
                               <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                                   <table className="w-full text-left text-sm text-slate-400">
                                       <thead className="bg-white/5 text-slate-300 uppercase font-bold text-xs">
                                           <tr>
                                               <th className="p-4">User</th>
                                               <th className="p-4">IP Address</th>
                                               <th className="p-4">Last Active</th>
                                               <th className="p-4 text-right">Total Contribution</th>
                                           </tr>
                                       </thead>
                                       <tbody className="divide-y divide-white/5">
                                           {uniqueUsers.map(user => (
                                               <tr key={user.userId} className="hover:bg-white/5 transition-colors">
                                                   <td className="p-4 text-white font-bold">{user.username}</td>
                                                   <td className="p-4 font-mono">{user.ip}</td>
                                                   <td className="p-4">{formatDate(user.lastActive)}</td>
                                                   <td className="p-4 text-right text-green-400 font-mono">{formatIDR(user.totalBet)}</td>
                                               </tr>
                                           ))}
                                       </tbody>
                                   </table>
                               </div>
                           )}
                       </div>
                   </div>
               </div>
          )}

          {/* 4. Add Candidate (Same as before) */}
          {activeModal === 'ADD' && (
            <div className="bg-[#111] border border-fuchsia-500/30 rounded-2xl p-6 md:p-8 w-11/12 max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
              <button onClick={closeModal} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Gift className="text-fuchsia-400" /> Add Gift Option
              </h2>
              <form onSubmit={handleAddCandidate} className="space-y-6">
                <div className="relative group cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={`w-full h-40 md:h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${newCandidateImage ? 'border-fuchsia-500/50 bg-black' : 'border-slate-700 bg-slate-900 group-hover:border-fuchsia-500/30 group-hover:bg-slate-800'}`}>
                    {newCandidateImage ? (
                      <img src={newCandidateImage} alt="Preview" className="w-full h-full object-cover rounded-lg opacity-80" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 md:w-10 md:h-10 text-slate-500 mb-2 group-hover:text-fuchsia-400 transition-colors" />
                        <p className="text-slate-400 text-xs md:text-sm">Click to upload image</p>
                      </>
                    )}
                  </div>
                </div>
                <input type="text" value={newCandidateName} onChange={(e) => setNewCandidateName(e.target.value)} placeholder="Gift Name / Description" className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:border-fuchsia-500 focus:outline-none" />
                {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
                <button type="submit" className="w-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white font-bold py-3 rounded-xl hover:from-fuchsia-500 hover:to-fuchsia-400 transition-all">Add to Betting Pool</button>
              </form>
            </div>
          )}

          {/* 5. Delete Confirm (Same as before) */}
          {activeModal === 'DELETE_CONFIRM' && (
            <div className="bg-[#111] border border-red-500/30 rounded-2xl p-6 md:p-8 w-11/12 max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative text-center">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20"><Trash2 className="text-red-400 w-7 h-7" /></div>
              <h2 className="text-xl font-bold text-white mb-2">Remove Gift?</h2>
              <div className="flex gap-3 mt-6">
                <button onClick={closeModal} className="flex-1 py-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 font-medium">Cancel</button>
                <button onClick={handleDeleteCandidate} className="flex-1 py-3 rounded-xl bg-red-600 text-white hover:bg-red-500 font-bold">Confirm Delete</button>
              </div>
            </div>
          )}

          {/* 6. Bet Confirm (Same as before) */}
          {activeModal === 'BET_CONFIRM' && targetCandidate && (
             <div className="bg-[#111] border border-cyan-500/50 rounded-2xl p-6 md:p-8 w-11/12 max-w-md shadow-[0_0_100px_rgba(6,182,212,0.2)] relative text-center overflow-hidden">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>
               <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border-2 border-white/20 shadow-xl"><img src={targetCandidate.imageUrl} alt="target" className="w-full h-full object-cover" /></div>
                  <h2 className="text-xl font-bold text-white mb-1">Confirm Your Bet</h2>
                  <p className="text-slate-400 text-sm mb-6">Place your stake on <br/> <span className="text-cyan-300 font-bold text-lg">"{targetCandidate.name}"</span></p>
                  <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl mb-6">
                     <label className="text-slate-400 text-xs uppercase tracking-widest block mb-2">Amount (IDR)</label>
                     <input type="number" min={MIN_BET_IDR} step="5000" value={betAmountInput} onChange={(e) => setBetAmountInput(parseInt(e.target.value))} className="w-full bg-black/50 border border-cyan-500/50 rounded-lg py-2 text-center text-xl font-mono text-cyan-400 focus:outline-none" />
                     <div className="flex justify-between mt-2 px-2">
                        <button onClick={() => setBetAmountInput(Math.max(MIN_BET_IDR, betAmountInput - 10000))} className="text-xs text-slate-500 hover:text-white">-10k</button>
                        <button onClick={() => setBetAmountInput(betAmountInput + 10000)} className="text-xs text-slate-500 hover:text-white">+10k</button>
                     </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={closeModal} className="flex-1 py-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 font-medium">Cancel</button>
                    <button onClick={confirmVote} className="flex-1 py-3 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400 font-bold">Confirm <Banknote size={16} className="inline ml-1"/></button>
                  </div>
               </div>
             </div>
          )}

        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
