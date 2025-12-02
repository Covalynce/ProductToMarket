'use client';
import React, { useEffect, useState } from 'react';
import { 
  Github, TrendingUp, Bell, Settings, LogOut, RefreshCw, 
  LayoutGrid, Code2, Megaphone, Crosshair, Check, X, 
  Loader2, Linkedin, Slack, HelpCircle, Key, CreditCard, User, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CLIENT_IDS = { github: "YOUR_GH_ID", linkedin: "YOUR_LI_ID", slack: "YOUR_SLACK_ID" };
const RAZORPAY_KEY = "YOUR_RAZORPAY_KEY_ID"; 

// --- CUSTOM LOGO: "THE KINETIC BREATH" ---
// Two heavy conduits separating and reconnecting around a pulsing core.
const CovalynceLogo = ({ size = "w-10 h-10", color = "text-obsidian" }: { size?: string, color?: string }) => (
  <div className={`${size} ${color} relative flex items-center justify-center`}>
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
      
      {/* Top Conduit Group (Moves Up) */}
      <g>
        <path 
          d="M20 30 H65 V50" 
          stroke="currentColor" 
          strokeWidth="10" 
          strokeLinecap="square" 
          strokeLinejoin="miter" 
          fill="none"
        />
        <path d="M20 30 L30 30" stroke="black" strokeWidth="2" strokeOpacity="0.3" />
        
        {/* Animation: Move Up and Back */}
        <animateTransform 
            attributeName="transform" 
            type="translate" 
            values="0 0; 0 -4; 0 0" 
            dur="4s" 
            repeatCount="indefinite"
            keyTimes="0; 0.5; 1"
            calcMode="spline" 
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
        />
      </g>
      
      {/* Bottom Conduit Group (Moves Down) */}
      <g>
        <path 
          d="M80 70 H35 V50" 
          stroke="currentColor" 
          strokeWidth="10" 
          strokeLinecap="square" 
          strokeLinejoin="miter" 
          fill="none"
        />
        <path d="M80 70 L70 70" stroke="black" strokeWidth="2" strokeOpacity="0.3" />

        {/* Animation: Move Down and Back */}
        <animateTransform 
            attributeName="transform" 
            type="translate" 
            values="0 0; 0 4; 0 0" 
            dur="4s" 
            repeatCount="indefinite"
            keyTimes="0; 0.5; 1"
            calcMode="spline" 
            keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
        />
      </g>
      
      {/* The Central Pulsing Dot */}
      <circle cx="50" cy="50" r="5" fill="currentColor">
         {/* Animation: Pulse Size & Opacity sync with separation */}
         <animate attributeName="r" values="5;7;5" dur="4s" repeatCount="indefinite" keyTimes="0; 0.5; 1" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
         <animate attributeName="opacity" values="1;0.6;1" dur="4s" repeatCount="indefinite" keyTimes="0; 0.5; 1" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1" />
      </circle>
      
    </svg>
  </div>
);

export default function Home() {
  const [view, setView] = useState<'LOGIN' | 'DASHBOARD' | 'SETTINGS' | 'HELP'>('LOGIN');
  const [userId, setUserId] = useState<string | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Editor State
  const [editingCard, setEditingCard] = useState<any>(null);
  const [editContent, setEditContent] = useState("");

  // --- Auth & Init ---
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const code = p.get('code');
    const stored = localStorage.getItem('covalynce_uid');
    
    if (code) handleOAuth(code, localStorage.getItem('pending_provider') || 'github');
    else if (stored) { setUserId(stored); setView('DASHBOARD'); fetchData(stored); fetchProfile(stored); }
  }, []);

  const demoLogin = (role: string) => {
      let uid = role === 'pro' ? 'demo_user_pro' : 'demo_user_free';
      localStorage.setItem('covalynce_uid', uid);
      setUserId(uid);
      setView('DASHBOARD');
      fetchData(uid);
      fetchProfile(uid);
  }

  const connect = (provider: string) => {
    localStorage.setItem('pending_provider', provider);
    const urls: any = {
        github: `https://github.com/login/oauth/authorize?client_id=${CLIENT_IDS.github}&scope=repo`,
        linkedin: `https://linkedin.com/oauth/v2/authorization?client_id=${CLIENT_IDS.linkedin}&response_type=code&scope=w_member_social`,
        slack: `https://slack.com/oauth/v2/authorize?client_id=${CLIENT_IDS.slack}&scope=chat:write`
    };
    window.location.href = urls[provider];
  };

  const handleOAuth = async (code: string, provider: string) => {
    setLoading(true);
    let uid = localStorage.getItem('covalynce_uid') || "user_" + Math.random().toString(36).substr(2,9);
    try {
        await fetch(`${API_URL}/auth/${provider}/callback`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({code, user_id: uid})
        });
        localStorage.setItem('covalynce_uid', uid);
        setUserId(uid);
        setView('DASHBOARD');
        window.history.replaceState({}, '', '/');
        fetchData(uid);
        fetchProfile(uid);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchData = async (uid: string) => {
    setLoading(true);
    try {
        const res = await fetch(`${API_URL}/sync/github`, { headers: { 'x-user-id': uid } });
        const data = await res.json();
        if(Array.isArray(data)) setCards(data);
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const fetchProfile = async (uid: string) => {
      try {
        const res = await fetch(`${API_URL}/user/profile`, { headers: { 'x-user-id': uid } });
        const data = await res.json();
        setProfile(data);
      } catch(e) { console.error(e); }
  };

  const handleAction = async (id: string, action: string, platform: string) => {
    if (id === 'limit') { setView('SETTINGS'); return; }
    
    // Optimistic UI - The card will animate out via Framer Motion
    setCards(prev => prev.filter(c => c.id !== id));
    
    await fetch(`${API_URL}/action/${action}`, {
        method: 'POST', headers: {'Content-Type':'application/json', 'x-user-id': userId || ''},
        body: JSON.stringify({id, content:"", platform: platform || "LINKEDIN"})
    });
  };

  const openEditor = (card: any) => {
      setEditingCard(card);
      setEditContent(card.content);
  };

  const saveEditor = () => {
      setCards(prev => prev.map(c => c.id === editingCard.id ? {...c, content: editContent} : c));
      setEditingCard(null);
  };

  // --- RENDER HELPERS ---
  
  if (view === 'LOGIN') return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center relative overflow-hidden font-sans">
        <div className="absolute inset-0 opacity-30 grid-bg"></div>
        <div className="absolute inset-0 radial-glow"></div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-12 rounded-3xl w-full max-w-md relative z-10 text-center border-neon/30 shadow-[0_0_100px_rgba(102,252,241,0.1)]"
        >
            <div className="w-24 h-24 bg-neon/10 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(102,252,241,0.2)] border border-neon/20">
                <CovalynceLogo size="w-16 h-16" color="text-neon" />
            </div>
            <h1 className="text-4xl font-bold text-white font-brand mb-2 tracking-tight">Covalynce</h1>
            <p className="text-gray-400 mb-10 font-mono text-sm">Zero lag between Code & Content.</p>

            <button onClick={() => connect('github')} className="w-full bg-white text-obsidian font-bold py-4 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3 group hover:scale-[1.02] active:scale-[0.98]">
                <Github className="w-5 h-5" />
                <span>Sign in with GitHub</span>
            </button>
            
            <div className="mt-6 flex justify-center gap-4 text-xs font-mono text-gray-600">
                <button onClick={() => demoLogin('free')} className="hover:text-neon transition-colors">[Demo Free]</button>
                <button onClick={() => demoLogin('pro')} className="hover:text-neon transition-colors">[Demo Pro]</button>
            </div>
        </motion.div>
    </div>
  );

  return (
    <div className="flex h-screen bg-obsidian text-muted overflow-hidden font-sans relative">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col p-4 bg-obsidian/90 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3 px-4 mb-10 mt-2">
            <CovalynceLogo size="w-8 h-8" color="text-neon" />
            <span className="text-2xl font-bold text-white tracking-tight font-brand">Covalynce</span>
        </div>

        <nav className="space-y-2 flex-1">
            <NavItem icon={LayoutGrid} label="Dashboard" active={view==='DASHBOARD'} onClick={()=>setView('DASHBOARD')} count={cards.length} />
            <NavItem icon={Github} label="Sources" />
            <NavItem icon={TrendingUp} label="Trends" />
            <NavItem icon={Bell} label="Notifications" />
        </nav>

        <div className="mt-auto space-y-2">
            <div className="bg-gunmetal rounded-xl p-4 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-gray-400">PLAN: {profile?.plan || 'SOLO'}</span>
                    <button className="text-neon hover:underline text-xs font-mono">Switch</button>
                </div>
                <div className="text-white font-bold text-lg font-brand">
                    $29 <span className="text-gray-500 text-sm font-normal font-sans">/mo</span>
                </div>
                <div className="w-full bg-gray-800 h-1 mt-3 rounded-full overflow-hidden">
                    <div className="bg-neon h-full" style={{width: `${Math.min(((profile?.cards_used || 0)/(profile?.card_limit || 5))*100, 100)}%`}}></div>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 font-mono">{Math.floor((((profile?.cards_used || 0)/(profile?.card_limit || 5))*100))}% of monthly tokens used</p>
            </div>
            <NavItem icon={Settings} label="Settings" active={view==='SETTINGS'} onClick={()=>setView('SETTINGS')} />
            <NavItem icon={LogOut} label="Log Out" onClick={()=>{localStorage.clear(); window.location.href='/'}} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-obsidian z-20">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-mono text-gray-500 tracking-wider">SYSTEM ONLINE // MONITORING VERTICALS</span>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => fetchData(userId!)} className={`p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-neon transition-colors ${loading ? 'animate-spin' : ''}`}>
                    <RefreshCw size={18} />
                </button>
                <div 
                    onClick={() => setView('SETTINGS')} 
                    className="flex items-center gap-3 border-l border-white/10 pl-4 cursor-pointer group"
                >
                    <div className="text-right hidden sm:block">
                        <div className="text-xs text-white font-bold group-hover:text-neon transition-colors">Alex Founder</div>
                        <div className="text-[10px] text-gray-500 font-mono">alex@vectal.io</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neon to-purple-500 border border-white/20 shadow-[0_0_10px_rgba(102,252,241,0.2)] group-hover:shadow-[0_0_15px_rgba(102,252,241,0.5)] transition-all"></div>
                </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative bg-[radial-gradient(ellipse_at_center,_#1F2833_0%,_#0B0C10_100%)]">
            <div className="fixed inset-0 opacity-20 grid-bg pointer-events-none"></div>
            
            {/* Dashboard View */}
            {view === 'DASHBOARD' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto h-full relative z-10">
                    <StackColumn title="Marketing" icon={Megaphone} count={cards.filter(c=>c.category==='MKT').length} color="text-neon">
                        <AnimatePresence>
                            {cards.filter(c=>c.category==='MKT').map(card => (
                                <TaskCard key={card.id} data={card} onAction={handleAction} onEdit={() => openEditor(card)} />
                            ))}
                        </AnimatePresence>
                    </StackColumn>
                    <StackColumn title="Engineering" icon={Code2} count={cards.filter(c=>c.category==='ENG').length} color="text-purple-400">
                        <AnimatePresence>
                            {cards.filter(c=>c.category==='ENG').map(card => (
                                <TaskCard key={card.id} data={card} onAction={handleAction} onEdit={() => openEditor(card)} />
                            ))}
                        </AnimatePresence>
                    </StackColumn>
                    <StackColumn title="Strategy" icon={Crosshair} count={cards.filter(c=>c.category==='STRAT').length} color="text-blue-400">
                        <AnimatePresence>
                            {cards.filter(c=>c.category==='STRAT').map(card => (
                                <TaskCard key={card.id} data={card} onAction={handleAction} onEdit={() => openEditor(card)} />
                            ))}
                        </AnimatePresence>
                    </StackColumn>
                </div>
            )}

            {/* Settings View */}
            {view === 'SETTINGS' && (
                <div className="max-w-2xl mx-auto relative z-10">
                    <h2 className="text-2xl font-bold text-white font-brand mb-6">Profile & Settings</h2>
                    <div className="glass-card p-6 rounded-2xl border border-white/10 mb-6">
                        <h3 className="text-white font-bold mb-4">Integrations</h3>
                        <IntegrationRow icon={Github} name="GitHub" status="Connected" />
                        <IntegrationRow icon={Linkedin} name="LinkedIn" status="Connect" onClick={()=>connect('linkedin')} />
                    </div>
                </div>
            )}
        </div>
      </main>

      {/* Editor Modal */}
      <AnimatePresence>
        {editingCard && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="glass-card w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
                >
                    <div className="bg-gunmetal/50 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-neon font-mono text-xs px-2 py-1 bg-neon/10 rounded">EDIT MODE</span>
                            <span className="text-white font-bold">{editingCard.title}</span>
                        </div>
                        <button onClick={() => setEditingCard(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="p-6 bg-obsidian">
                        <textarea 
                            value={editContent} 
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full h-48 bg-[#15171e] text-gray-300 p-4 rounded-xl border border-white/10 focus:border-neon outline-none font-sans text-sm leading-relaxed resize-none"
                        ></textarea>
                        <div className="flex justify-between items-center mt-4">
                            <div className="flex gap-2">
                                <button className="text-xs text-gray-500 hover:text-neon flex items-center gap-1 transition-colors"><Sparkles size={12} /> AI Rephrase</button>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setEditingCard(null)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                                <button onClick={saveEditor} className="px-4 py-2 rounded-lg text-sm bg-neon text-obsidian font-bold hover:bg-neonhov transition-colors">Save Changes</button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- Components ---

const NavItem = ({ icon: Icon, label, active, onClick, count }: any) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group ${active ? 'bg-gunmetal text-white border border-white/5 shadow-lg' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
    <Icon size={20} className={active ? 'text-neon' : 'group-hover:text-white transition-colors'} />
    <span className="font-medium text-sm flex-1 font-brand">{label}</span>
    {count !== undefined && (
      <span className="bg-neon/20 text-neon text-xs font-bold px-2 py-0.5 rounded-full font-mono">{count}</span>
    )}
  </div>
);

const StackColumn = ({ title, icon: Icon, count, children, color }: any) => (
  <div className="flex flex-col h-full min-h-[500px]">
    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-2">
      <h2 className="text-white font-bold flex items-center gap-2 font-brand text-lg">
        <Icon className={`w-5 h-5 ${color}`} /> {title}
      </h2>
      <span className="text-xs font-mono text-gray-500">{count} tasks</span>
    </div>
    <div className="relative flex-1 w-full space-y-4">{children}</div>
  </div>
);

const TaskCard = ({ data, onAction, onEdit }: any) => {
  const Icon = data.icon || Github;
  return (
    <motion.div 
        layout
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, rotate: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`glass-card p-5 rounded-2xl hover:border-neon/30 transition-colors duration-300 group ${data.colorClass}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white/5">
            <Icon size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm font-brand line-clamp-1">{data.title}</h3>
            <p className="text-gray-400 text-[10px] font-mono mt-0.5 line-clamp-1">{data.subtitle}</p>
          </div>
        </div>
        <span className="text-neon text-[10px] font-mono bg-neon/5 px-1.5 py-0.5 rounded border border-neon/10">{data.timestamp}</span>
      </div>

      <div className="bg-obsidian/50 p-3 rounded-lg border border-white/5 mb-3 relative">
        <p className="text-gray-300 text-xs leading-relaxed font-sans line-clamp-4 whitespace-pre-wrap">{data.content}</p>
        <div onClick={onEdit} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <div className="bg-neon text-obsidian text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-brand hover:bg-neonhov hover:scale-105 transition-transform">Edit</div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {data.tags?.map((tag:string) => (
          <span key={tag} className="text-[10px] text-gray-500 font-mono border border-white/5 px-1.5 py-0.5 rounded">#{tag.replace('#','')}</span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onAction(data.id, 'discard', 'NONE')} className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all font-medium text-xs active:scale-95">
          <X size={14} /> Discard
        </button>
        {data.id === 'limit' ? (
             <button onClick={() => onAction(data.id, 'upgrade', 'NONE')} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all font-bold text-xs active:scale-95"><CreditCard size={14} /> Upgrade</button>
        ) : (
             <button onClick={() => onAction(data.id, 'execute', 'LINKEDIN')} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neon text-obsidian hover:bg-neonhov transition-all font-bold text-xs active:scale-95"><Check size={14} /> Approve</button>
        )}
      </div>
    </motion.div>
  );
};

const IntegrationRow = ({icon:Icon, name, status, onClick}: any) => (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
        <div className="flex items-center gap-3 text-gray-300 text-sm"><Icon size={18}/> {name}</div>
        <button onClick={onClick} className={`text-xs px-3 py-1 rounded transition-colors ${status==='Connected'?'text-green-400 bg-green-900/20':'bg-white/10 hover:bg-white/20 text-white'}`}>{status}</button>
    </div>
);