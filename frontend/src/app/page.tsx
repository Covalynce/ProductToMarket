'use client';
import React, { useEffect, useState } from 'react';
import {
    Github, TrendingUp, Bell, Settings, LogOut, RefreshCw,
    LayoutGrid, Code2, Megaphone, Crosshair, Check, X,
    Loader2, Linkedin, Slack, HelpCircle, Key, CreditCard, User, Sparkles,
    Target, Brain, Image as ImageIcon, Plus, Zap, Copy, Search, Download, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, Toast } from '../components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CLIENT_IDS = {
    github: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "YOUR_GH_ID",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || "YOUR_LI_ID",
    slack: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID || "YOUR_SLACK_ID",
    google: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_ID",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "YOUR_FACEBOOK_ID"
};
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "YOUR_RAZORPAY_KEY_ID";

// Razorpay types
declare global {
    interface Window {
        Razorpay: any;
    }
}

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
    const [view, setView] = useState<'LOGIN' | 'SIGNUP' | 'DASHBOARD' | 'SETTINGS' | 'SOURCES' | 'TRENDS' | 'HELP' | 'NOTIFICATIONS' | 'PRIVACY' | 'HISTORY'>('LOGIN');

    // Card History State
    const [cardHistory, setCardHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [cards, setCards] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Auth State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState("");

    // Editor State
    const [editingCard, setEditingCard] = useState<any>(null);
    const [editContent, setEditContent] = useState("");
    const [editImageUrl, setEditImageUrl] = useState("");
    const [generatingImage, setGeneratingImage] = useState(false);

    // Integration Consent State
    const [showConsent, setShowConsent] = useState(false);
    const [pendingProvider, setPendingProvider] = useState<string | null>(null);
    const [pendingPermissions, setPendingPermissions] = useState<string[]>([]);
    const [consentChecked, setConsentChecked] = useState(false);

    // Trends & Competitor Tracking State
    const [competitors, setCompetitors] = useState<any[]>([]);
    const [trendingContent, setTrendingContent] = useState<any[]>([]);
    const [selectedCompetitor, setSelectedCompetitor] = useState<any>(null);
    const [competitorPosts, setCompetitorPosts] = useState<any[]>([]);
    const [memeTemplates, setMemeTemplates] = useState<any[]>([]);
    const [selectedMeme, setSelectedMeme] = useState<any>(null);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [memeText, setMemeText] = useState({ top: '', bottom: '' });

    // Location & Filters
    const [targetLocation, setTargetLocation] = useState("");

    // AI Preferences
    const [aiPreferences, setAiPreferences] = useState({
        tone: 'professional',
        style: 'engaging',
        length: 'medium',
        include_hashtags: true,
        include_emojis: false
    });

    // Usage Limits
    const [usageStats, setUsageStats] = useState({ daily: { used: 0, limit: 50 }, monthly: { used: 0, limit: 1000 } });

    // Multi-source Post State
    const [postSources, setPostSources] = useState<any[]>([]);
    const [combinedContent, setCombinedContent] = useState("");

    // Notifications State
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Plan Switching State
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    // Password Strength State
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });

    // Toast Notifications State
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Loading States
    const [rephrasing, setRephrasing] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");

    // Bulk Selection State
    const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

    // Modal States
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [promptConfig, setPromptConfig] = useState<{ title: string, message: string, placeholder: string, onConfirm: (value: string) => void } | null>(null);
    const [promptValue, setPromptValue] = useState("");
    const [showMultiPromptModal, setShowMultiPromptModal] = useState(false);
    const [multiPromptConfig, setMultiPromptConfig] = useState<{ title: string, description: string, fields: Array<{ label: string, placeholder: string, key: string }>, onConfirm: (values: Record<string, string>) => void } | null>(null);
    const [multiPromptValues, setMultiPromptValues] = useState<Record<string, string>>({});

    // --- Auth & Init ---
    useEffect(() => {
        const p = new URLSearchParams(window.location.search);
        const code = p.get('code');
        const stored = localStorage.getItem('covalynce_uid');
        const token = localStorage.getItem('covalynce_token');

        if (code) {
            const provider = localStorage.getItem('pending_provider') || 'github';
            handleOAuth(code, provider);
        } else if (stored && token) {
            setUserId(stored);
            setView('DASHBOARD');
            fetchData(stored);
            fetchProfile(stored);
            fetchIntegrations(stored);
            // Load trends data
            fetch(`${API_URL}/trends/competitors`, { headers: { 'x-user-id': stored } })
                .then(r => r.json()).then(d => setCompetitors(d.competitors || []));
            fetch(`${API_URL}/trends/usage`, { headers: { 'x-user-id': stored } })
                .then(r => r.json()).then(d => setUsageStats(d));
            fetch(`${API_URL}/trends/ai/preferences`, { headers: { 'x-user-id': stored } })
                .then(r => r.json()).then(d => setAiPreferences(d.preferences || aiPreferences));
        }
    }, []);

    const fetchIntegrations = async (uid: string) => {
        try {
            const res = await fetch(`${API_URL}/integrations/list`, {
                headers: { 'x-user-id': uid }
            });
            const data = await res.json();
            if (data.integrations) setIntegrations(data.integrations);
        } catch (e) {
            console.error('Failed to fetch integrations:', e);
        }
    };

    const fetchNotifications = async (uid: string) => {
        try {
            const res = await fetch(`${API_URL}/notifications`, {
                headers: { 'x-user-id': uid }
            });
            const data = await res.json();
            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter((n: any) => !n.read).length);
            }
        } catch (e) {
            console.error('Failed to fetch notifications:', e);
        }
    };

    const fetchUnreadCount = async (uid: string) => {
        try {
            const res = await fetch(`${API_URL}/notifications/unread-count`, {
                headers: { 'x-user-id': uid }
            });
            const data = await res.json();
            setUnreadCount(data.count || 0);
        } catch (e) {
            console.error('Failed to fetch unread count:', e);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch(`${API_URL}/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: { 'x-user-id': userId || '' }
            });
            setNotifications(notifications.map((n: any) =>
                n.id === notificationId ? { ...n, read: true } : n
            ));
            setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (e) {
            console.error('Failed to mark as read:', e);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`${API_URL}/notifications/read-all`, {
                method: 'POST',
                headers: { 'x-user-id': userId || '' }
            });
            setNotifications(notifications.map((n: any) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error('Failed to mark all as read:', e);
        }
    };

    const checkPasswordStrength = (pwd: string) => {
        const feedback: string[] = [];
        let score = 0;

        if (pwd.length >= 8) score += 1;
        else feedback.push('At least 8 characters');

        if (/[A-Z]/.test(pwd)) score += 1;
        else feedback.push('One uppercase letter');

        if (/[a-z]/.test(pwd)) score += 1;
        else feedback.push('One lowercase letter');

        if (/[0-9]/.test(pwd)) score += 1;
        else feedback.push('One number');

        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
        else feedback.push('One special character');

        setPasswordStrength({ score, feedback });
    };

    const demoLogin = (role: string) => {
        let uid = role === 'pro' ? 'demo_user_pro' : 'demo_user_free';
        localStorage.setItem('covalynce_uid', uid);
        setUserId(uid);
        setView('DASHBOARD');
        fetchData(uid);
        fetchProfile(uid);
    }

    const fetchProviderPermissions = async (provider: string) => {
        try {
            const res = await fetch(`${API_URL}/integrations/permissions/${provider}`);
            const data = await res.json();
            return data.permissions || [];
        } catch (e) {
            return [];
        }
    };

    const connect = async (provider: string) => {
        // Fetch permissions first
        const permissions = await fetchProviderPermissions(provider);
        setPendingProvider(provider);
        setPendingPermissions(permissions);
        setShowConsent(true);
    };

    const proceedWithConnection = () => {
        if (!consentChecked) {
            setAuthError("Please consent to the permissions to continue");
            return;
        }

        setShowConsent(false);
        localStorage.setItem('pending_provider', pendingProvider!);

        const urls: any = {
            github: `https://github.com/login/oauth/authorize?client_id=${CLIENT_IDS.github}&scope=repo`,
            linkedin: `https://linkedin.com/oauth/v2/authorization?client_id=${CLIENT_IDS.linkedin}&response_type=code&scope=w_member_social`,
            slack: `https://slack.com/oauth/v2/authorize?client_id=${CLIENT_IDS.slack}&scope=chat:write`,
            google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_IDS.google}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/google/callback')}&response_type=code&scope=openid%20profile%20email`,
            facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${CLIENT_IDS.facebook}&redirect_uri=${encodeURIComponent(window.location.origin + '/auth/facebook/callback')}&scope=email,public_profile`
        };

        if (urls[pendingProvider!]) {
            window.location.href = urls[pendingProvider!];
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        setAuthError("");
        try {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('covalynce_token', data.access_token);
                localStorage.setItem('covalynce_uid', data.user_id);
                setUserId(data.user_id);
                setView('DASHBOARD');
                fetchData(data.user_id);
                fetchProfile(data.user_id);
            } else {
                setAuthError(data.detail || 'Sign up failed');
            }
        } catch (e: any) {
            setAuthError(e.message || 'Sign up failed');
        }
        setLoading(false);
    };

    const handleSignIn = async () => {
        setLoading(true);
        setAuthError("");
        try {
            const res = await fetch(`${API_URL}/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('covalynce_token', data.access_token);
                localStorage.setItem('covalynce_uid', data.user_id);
                setUserId(data.user_id);
                setView('DASHBOARD');
                fetchData(data.user_id);
                fetchProfile(data.user_id);
                fetchIntegrations(data.user_id);
            } else {
                setAuthError(data.detail || 'Sign in failed');
            }
        } catch (e: any) {
            setAuthError(e.message || 'Sign in failed');
        }
        setLoading(false);
    };

    const handleOAuth = async (code: string, provider: string) => {
        setLoading(true);
        let uid = localStorage.getItem('covalynce_uid') || "user_" + Math.random().toString(36).substr(2, 9);
        try {
            const res = await fetch(`${API_URL}/auth/${provider}/callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    user_id: uid,
                    redirect_uri: window.location.origin + `/auth/${provider}/callback`
                })
            });
            const data = await res.json();

            // Save consent if provider supports it
            if (pendingProvider && consentChecked) {
                await fetch(`${API_URL}/integrations/consent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user-id': uid },
                    body: JSON.stringify({
                        provider: pendingProvider,
                        permissions: pendingPermissions,
                        consent_given: true
                    })
                });
            }

            localStorage.setItem('covalynce_uid', uid);
            setUserId(uid);
            setView('DASHBOARD');
            window.history.replaceState({}, '', '/');
            fetchData(uid);
            fetchProfile(uid);
            fetchIntegrations(uid);
            setShowConsent(false);
            setPendingProvider(null);
        } catch (e) {
            console.error(e);
            setAuthError('Authentication failed');
        }
        setLoading(false);
    };

    const fetchData = async (uid: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/sync/github`, { headers: { 'x-user-id': uid } });
            const data = await res.json();
            if (Array.isArray(data)) setCards(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const fetchProfile = async (uid: string) => {
        try {
            const res = await fetch(`${API_URL}/user/profile`, { headers: { 'x-user-id': uid } });
            const data = await res.json();
            setProfile(data);
        } catch (e) { console.error(e); }
    };

    const handleAction = async (id: string, action: string, platform: string, card?: any) => {
        if (id === 'limit') { setView('SETTINGS'); return; }

        // Get card content if available
        const cardContent = card?.content || "";

        // Optimistic UI - The card will animate out via Framer Motion
        setCards(prev => prev.filter(c => c.id !== id));

        try {
            const response = await fetch(`${API_URL}/action/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                body: JSON.stringify({ id, content: cardContent, platform: platform || "LINKEDIN" })
            });

            const result = await response.json();

            // If it's an Engineering card and action is execute, also notify Slack
            if (action === 'execute' && card?.category === 'ENG' && platform === 'SLACK') {
                try {
                    await fetch(`${API_URL}/action/slack/notify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                        body: JSON.stringify({ card_id: id })
                    });
                } catch (e) {
                    console.error('Slack notification failed:', e);
                }
            }
        } catch (e) {
            console.error('Action failed:', e);
            // Restore card on error
            if (card) {
                setCards(prev => [...prev, card]);
            }
        }
    };

    const openEditor = (card: any) => {
        setEditingCard(card);
        setEditContent(card.content);
        setEditImageUrl(card.image_url || "");
    };

    const generateImage = async () => {
        if (!editContent.trim()) {
            setAuthError("Please enter content to generate image");
            return;
        }
        setGeneratingImage(true);
        try {
            const res = await fetch(`${API_URL}/image/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                body: JSON.stringify({
                    prompt: editContent,
                    card_id: editingCard?.id
                })
            });
            const data = await res.json();
            if (data.image_url) {
                setEditImageUrl(data.image_url);
            }
        } catch (e) {
            console.error('Image generation failed:', e);
            setAuthError('Image generation failed');
        }
        setGeneratingImage(false);
    };

    const saveEditor = () => {
        setCards(prev => prev.map(c => c.id === editingCard.id ? {
            ...c,
            content: editContent,
            image_url: editImageUrl || c.image_url
        } : c));
        setEditingCard(null);
        setEditImageUrl("");
    };

    // Toast notifications
    const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3000);
    };
    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };
    const showToast = addToast; // Alias for compatibility

    // Export functionality
    const exportData = async () => {
        try {
            const res = await fetch(`${API_URL}/user/data/export`, {
                headers: { 'x-user-id': userId || '' }
            });
            const data = await res.json();

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `covalynce-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Data exported successfully', 'success');
        } catch (e) {
            showToast('Failed to export data', 'error');
        }
    };

    // Search and filter
    const filteredCards = cards.filter((card: any) => {
        return searchQuery === "" ||
            card.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            card.category?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Bulk actions
    const toggleCardSelection = (cardId: string) => {
        setSelectedCards(prev => {
            const next = new Set(prev);
            if (next.has(cardId)) {
                next.delete(cardId);
            } else {
                next.add(cardId);
            }
            return next;
        });
    };

    const handleBulkAction = async (action: 'approve' | 'discard') => {
        if (selectedCards.size === 0) return;

        const cardsToProcess = Array.from(selectedCards);
        for (const cardId of cardsToProcess) {
            const card = cards.find((c: any) => c.id === cardId);
            if (card) {
                await handleAction(cardId, action === 'approve' ? 'execute' : 'dismiss', card.platform || 'LINKEDIN', card);
            }
        }
        setSelectedCards(new Set());
        showToast(`${action === 'approve' ? 'Approved' : 'Discarded'} ${cardsToProcess.length} card(s)`, 'success');
    };

    // AI Rephrase
    const handleRephrase = async () => {
        if (!editContent.trim()) {
            showToast('Please enter content to rephrase', 'warning');
            return;
        }
        setRephrasing(true);
        try {
            const res = await fetch(`${API_URL}/ai/rephrase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                body: JSON.stringify({ content: editContent })
            });
            const data = await res.json();
            if (data.rephrased_content) {
                setEditContent(data.rephrased_content);
                showToast('Content rephrased successfully', 'success');
            } else {
                showToast('Failed to rephrase content', 'error');
            }
        } catch (e) {
            showToast('Error rephrasing content', 'error');
        }
        setRephrasing(false);
    };

    // Fetch Card History
    const fetchCardHistory = async (uid: string) => {
        setLoadingHistory(true);
        try {
            const res = await fetch(`${API_URL}/cards/history`, {
                headers: { 'x-user-id': uid }
            });
            const data = await res.json();
            if (data.cards) {
                setCardHistory(data.cards);
            } else {
                setCardHistory([]);
            }
        } catch (e) {
            console.error('Failed to fetch card history:', e);
            showToast('Failed to load card history', 'error');
            setCardHistory([]);
        }
        setLoadingHistory(false);
    };

    // Modal Helpers
    const showConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmConfig({ title, message, onConfirm });
        setShowConfirmModal(true);
    };

    const showPrompt = (title: string, message: string, placeholder: string, onConfirm: (value: string) => void) => {
        setPromptConfig({ title, message, placeholder, onConfirm });
        setPromptValue("");
        setShowPromptModal(true);
    };

    const showMultiPrompt = (title: string, description: string, fields: Array<{ label: string, placeholder: string, key: string }>, onConfirm: (values: Record<string, string>) => void) => {
        setMultiPromptConfig({ title, description, fields, onConfirm });
        setMultiPromptValues({});
        setShowMultiPromptModal(true);
    };

    // --- RENDER HELPERS ---

    switch (view) {
        case 'LOGIN':
            return (
                <div className="min-h-screen bg-obsidian flex items-center justify-center relative overflow-hidden font-sans">
                    <div className="absolute inset-0 opacity-30 grid-bg"></div>
                    <div className="absolute inset-0 radial-glow"></div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="glass-card p-12 rounded-3xl w-full max-w-md relative z-10 border-neon/30 shadow-[0_0_100px_rgba(102,252,241,0.1)]"
                    >
                        <div className="text-center mb-8">
                            <div className="w-24 h-24 bg-neon/10 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(102,252,241,0.2)] border border-neon/20">
                                <CovalynceLogo size="w-16 h-16" color="text-neon" />
                            </div>
                            <h1 className="text-4xl font-bold text-white font-brand mb-2 tracking-tight">Covalynce</h1>
                            <p className="text-gray-400 mb-6 font-mono text-sm">Zero lag between Code & Content.</p>
                        </div>

                        {/* Email/Password Sign In */}
                        <div className="space-y-4 mb-6">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gunmetal border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon outline-none"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gunmetal border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon outline-none"
                            />
                            {authError && <p className="text-red-400 text-sm">{authError}</p>}
                            <button
                                onClick={handleSignIn}
                                disabled={loading}
                                className="w-full bg-neon text-obsidian font-bold py-3 rounded-xl hover:bg-neonhov transition-all disabled:opacity-50"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </div>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-obsidian text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        {/* OAuth Providers */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button onClick={() => connect('github')} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 transition-all">
                                <Github className="w-5 h-5 text-white" />
                                <span className="text-sm text-white font-medium">GitHub</span>
                            </button>
                            <button onClick={() => connect('google')} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 transition-all">
                                <span className="text-sm text-white font-medium">Google</span>
                            </button>
                            <button onClick={() => connect('linkedin')} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 transition-all">
                                <Linkedin className="w-5 h-5 text-white" />
                                <span className="text-sm text-white font-medium">LinkedIn</span>
                            </button>
                            <button onClick={() => connect('facebook')} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 transition-all">
                                <span className="text-sm text-white font-medium">Facebook</span>
                            </button>
                        </div>

                        <div className="text-center">
                            <button onClick={() => setView('SIGNUP')} className="text-neon hover:underline text-sm">
                                Don't have an account? Sign up
                            </button>
                        </div>

                        <div className="mt-6 flex justify-center gap-4 text-xs font-mono text-gray-600">
                            <button onClick={() => demoLogin('free')} className="hover:text-neon transition-colors">[Demo Free]</button>
                            <button onClick={() => demoLogin('pro')} className="hover:text-neon transition-colors">[Demo Pro]</button>
                        </div>
                    </motion.div>
                </div>
            );

        case 'SIGNUP':
            return (
                <div className="min-h-screen bg-obsidian flex items-center justify-center relative overflow-hidden font-sans">
                    <div className="absolute inset-0 opacity-30 grid-bg"></div>
                    <div className="absolute inset-0 radial-glow"></div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="glass-card p-12 rounded-3xl w-full max-w-md relative z-10 border-neon/30 shadow-[0_0_100px_rgba(102,252,241,0.1)]"
                    >
                        <div className="text-center mb-8">
                            <div className="w-24 h-24 bg-neon/10 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(102,252,241,0.2)] border border-neon/20">
                                <CovalynceLogo size="w-16 h-16" color="text-neon" />
                            </div>
                            <h1 className="text-4xl font-bold text-white font-brand mb-2 tracking-tight">Create Account</h1>
                            <p className="text-gray-400 mb-6 font-mono text-sm">Join Covalynce to get started.</p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gunmetal border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon outline-none"
                            />
                            <div className="w-full">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        checkPasswordStrength(e.target.value);
                                    }}
                                    className="w-full bg-gunmetal border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon outline-none"
                                />
                                {password && (
                                    <div className="mt-2">
                                        <div className="flex gap-1 mb-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded ${passwordStrength.score >= i ? (passwordStrength.score <= 2 ? 'bg-red-500' : passwordStrength.score <= 4 ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-700'}`}
                                                />
                                            ))}
                                        </div>
                                        {passwordStrength.feedback.length > 0 && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                Needs: {passwordStrength.feedback.join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            {authError && <p className="text-red-400 text-sm">{authError}</p>}
                            <button
                                onClick={handleSignUp}
                                disabled={loading}
                                className="w-full bg-neon text-obsidian font-bold py-3 rounded-xl hover:bg-neonhov transition-all disabled:opacity-50"
                            >
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </button>
                        </div>

                        <div className="text-center">
                            <button onClick={() => setView('LOGIN')} className="text-neon hover:underline text-sm">
                                Already have an account? Sign in
                            </button>
                        </div>
                    </motion.div>
                </div>
            );


        default:
            return (
                <div className="flex h-screen bg-obsidian text-muted overflow-hidden font-sans relative">

                    {/* Sidebar */}
                    <aside className="w-64 border-r border-white/5 flex flex-col p-4 bg-obsidian/90 backdrop-blur-sm z-20">
                        <div className="flex items-center gap-3 px-4 mb-10 mt-2">
                            <CovalynceLogo size="w-8 h-8" color="text-neon" />
                            <span className="text-2xl font-bold text-white tracking-tight font-brand">Covalynce</span>
                        </div>

                        <nav className="space-y-2 flex-1">
                            <NavItem icon={LayoutGrid} label="Dashboard" active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} count={cards.length} />
                            <NavItem icon={Github} label="Sources" active={view === 'SOURCES'} onClick={() => { setView('SOURCES'); fetchIntegrations(userId!); }} />
                            <NavItem icon={TrendingUp} label="Trends" active={view === 'TRENDS'} onClick={() => setView('TRENDS')} />
                            <NavItem icon={Bell} label="Notifications" active={view === 'NOTIFICATIONS'} onClick={() => { setView('NOTIFICATIONS'); fetchNotifications(userId!); }} count={unreadCount} />
                            <NavItem icon={HelpCircle} label="Help" active={view === 'HELP'} onClick={() => setView('HELP')} />
                        </nav>

                        <div className="mt-auto space-y-2">
                            <div className="bg-gunmetal rounded-xl p-4 border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-mono text-gray-400">PLAN: {profile?.plan || 'SOLO'}</span>
                                    <button
                                        onClick={() => setShowPlanModal(true)}
                                        className="text-neon hover:underline text-xs font-mono"
                                    >
                                        Switch
                                    </button>
                                </div>
                                <div className="text-white font-bold text-lg font-brand">
                                    ${profile?.plan === 'PRO' ? '29' : '0'} <span className="text-gray-500 text-sm font-normal font-sans">/mo</span>
                                </div>
                                <div className="w-full bg-gray-800 h-1 mt-3 rounded-full overflow-hidden">
                                    <div className="bg-neon h-full" style={{ width: `${Math.min(((profile?.cards_used || 0) / (profile?.card_limit || 5)) * 100, 100)}%` }}></div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 font-mono">{Math.floor((((profile?.cards_used || 0) / (profile?.card_limit || 5)) * 100))}% of monthly tokens used</p>
                            </div>
                            <NavItem icon={Settings} label="Settings" active={view === 'SETTINGS'} onClick={() => setView('SETTINGS')} />
                            <button
                                onClick={() => setView('PRIVACY')}
                                className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
                            >
                                <span>Privacy Policy</span>
                            </button>
                            <NavItem icon={LogOut} label="Log Out" onClick={() => { localStorage.clear(); window.location.href = '/' }} />
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
                                <div className="max-w-7xl mx-auto h-full relative z-10">
                                    {/* Search and Bulk Actions Bar */}
                                    <div className="mb-6 flex items-center gap-4">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Search cards..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full bg-gunmetal border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-neon outline-none font-sans"
                                            />
                                        </div>
                                        {selectedCards.size > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-400 font-mono">{selectedCards.size} selected</span>
                                                <button
                                                    onClick={() => handleBulkAction('approve')}
                                                    className="px-4 py-2 bg-neon text-obsidian font-bold rounded-xl hover:bg-neonhov transition-colors text-sm"
                                                >
                                                    Approve All
                                                </button>
                                                <button
                                                    onClick={() => handleBulkAction('discard')}
                                                    className="px-4 py-2 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors text-sm"
                                                >
                                                    Discard All
                                                </button>
                                                <button
                                                    onClick={() => setSelectedCards(new Set())}
                                                    className="px-4 py-2 bg-gunmetal border border-white/10 text-gray-400 rounded-xl hover:text-white transition-colors text-sm"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setView('HISTORY')}
                                                className="px-4 py-2 bg-gunmetal border border-white/10 text-gray-400 rounded-xl hover:text-white transition-colors flex items-center gap-2 text-sm"
                                            >
                                                <History size={16} /> History
                                            </button>
                                            <button
                                                onClick={exportData}
                                                className="px-4 py-2 bg-gunmetal border border-white/10 text-gray-400 rounded-xl hover:text-white transition-colors flex items-center gap-2 text-sm"
                                            >
                                                <Download size={16} /> Export
                                            </button>
                                        </div>
                                    </div>

                                    {loading && cards.length === 0 ? (
                                        <div className="flex items-center justify-center h-64">
                                            <Loader2 className="w-8 h-8 text-neon animate-spin" />
                                            <span className="ml-3 text-gray-400 font-mono">Loading cards...</span>
                                        </div>
                                    ) : filteredCards.length === 0 ? (
                                        <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
                                            <LayoutGrid className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                            <p className="text-gray-400 font-mono mb-2">
                                                {searchQuery ? 'No cards match your search' : 'No cards yet'}
                                            </p>
                                            {!searchQuery && (
                                                <p className="text-gray-500 text-xs font-mono">Connect GitHub to start generating cards</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <StackColumn title="Marketing" icon={Megaphone} count={filteredCards.filter(c => c.category === 'MKT').length} color="text-neon">
                                                <AnimatePresence>
                                                    {filteredCards.filter(c => c.category === 'MKT').length === 0 ? (
                                                        <div className="text-center py-8 text-gray-500 text-sm font-mono">No marketing cards</div>
                                                    ) : (
                                                        filteredCards.filter(c => c.category === 'MKT').map(card => (
                                                            <TaskCard
                                                                key={card.id}
                                                                data={card}
                                                                onAction={handleAction}
                                                                onEdit={() => openEditor(card)}
                                                                selected={selectedCards.has(card.id)}
                                                                onSelect={() => toggleCardSelection(card.id)}
                                                            />
                                                        ))
                                                    )}
                                                </AnimatePresence>
                                            </StackColumn>
                                            <StackColumn title="Engineering" icon={Code2} count={filteredCards.filter(c => c.category === 'ENG').length} color="text-purple-400">
                                                <AnimatePresence>
                                                    {filteredCards.filter(c => c.category === 'ENG').length === 0 ? (
                                                        <div className="text-center py-8 text-gray-500 text-sm font-mono">No engineering cards</div>
                                                    ) : (
                                                        filteredCards.filter(c => c.category === 'ENG').map(card => (
                                                            <TaskCard
                                                                key={card.id}
                                                                data={card}
                                                                onAction={(id, action, platform) => handleAction(id, action, platform, card)}
                                                                onEdit={() => openEditor(card)}
                                                                selected={selectedCards.has(card.id)}
                                                                onSelect={() => toggleCardSelection(card.id)}
                                                            />
                                                        ))
                                                    )}
                                                </AnimatePresence>
                                            </StackColumn>
                                            <StackColumn title="Strategy" icon={Crosshair} count={filteredCards.filter(c => c.category === 'STRAT').length} color="text-blue-400">
                                                <AnimatePresence>
                                                    {filteredCards.filter(c => c.category === 'STRAT').length === 0 ? (
                                                        <div className="text-center py-8 text-gray-500 text-sm font-mono">No strategy cards</div>
                                                    ) : (
                                                        filteredCards.filter(c => c.category === 'STRAT').map(card => (
                                                            <TaskCard
                                                                key={card.id}
                                                                data={card}
                                                                onAction={handleAction}
                                                                onEdit={() => openEditor(card)}
                                                                selected={selectedCards.has(card.id)}
                                                                onSelect={() => toggleCardSelection(card.id)}
                                                            />
                                                        ))
                                                    )}
                                                </AnimatePresence>
                                            </StackColumn>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sources View - Simplified List */}
                            {view === 'SOURCES' && (
                                <div className="max-w-3xl mx-auto relative z-10">
                                    <h2 className="text-2xl font-bold text-white font-brand mb-2">Sources</h2>
                                    <p className="text-gray-400 mb-6 text-sm font-mono">Connect tools. AI handles the rest.</p>

                                    <div className="space-y-2">
                                        {[
                                            { id: 'github', name: 'GitHub', icon: Github, connected: integrations.find((i: any) => i.provider === 'github') },
                                            { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, connected: integrations.find((i: any) => i.provider === 'linkedin') },
                                            { id: 'slack', name: 'Slack', icon: Slack, connected: integrations.find((i: any) => i.provider === 'slack') },
                                            { id: 'twitter', name: 'Twitter', icon: null, connected: integrations.find((i: any) => i.provider === 'twitter') },
                                            { id: 'instagram', name: 'Instagram', icon: null, connected: integrations.find((i: any) => i.provider === 'instagram') },
                                            { id: 'jira', name: 'Jira', icon: null, connected: integrations.find((i: any) => i.provider === 'jira') },
                                            { id: 'google', name: 'Google', icon: null, connected: integrations.find((i: any) => i.provider === 'google') },
                                            { id: 'facebook', name: 'Facebook', icon: null, connected: integrations.find((i: any) => i.provider === 'facebook') }
                                        ].map((source) => {
                                            const Icon = source.icon;
                                            const integration = source.connected;
                                            const permissions = integration?.permissions || [];

                                            return (
                                                <div key={source.id} className="glass-card p-4 rounded-xl border border-white/10 hover:border-neon/30 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className="w-10 h-10 bg-neon/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                {Icon ? <Icon className="w-5 h-5 text-neon" /> : <span className="text-neon text-xs font-brand">{source.name[0]}</span>}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-white font-bold font-brand">{source.name}</h4>
                                                                    {integration ? (
                                                                        <span className="text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded font-mono">Connected</span>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-500 font-mono">Not connected</span>
                                                                    )}
                                                                </div>
                                                                {permissions.length > 0 && (
                                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                                        {permissions.slice(0, 3).map((perm: string, idx: number) => (
                                                                            <span key={idx} className="text-[10px] text-gray-500 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                                                                {perm.split(' ')[0]}
                                                                            </span>
                                                                        ))}
                                                                        {permissions.length > 3 && (
                                                                            <span className="text-[10px] text-gray-500 font-mono">+{permissions.length - 3}</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {integration ? (
                                                                <button
                                                                    onClick={async () => {
                                                                        // Disable integration
                                                                        await fetch(`${API_URL}/integrations/${source.id}/disable`, {
                                                                            method: 'POST',
                                                                            headers: { 'x-user-id': userId || '' }
                                                                        });
                                                                        fetchIntegrations(userId!);
                                                                    }}
                                                                    className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 rounded-lg transition-colors font-mono"
                                                                >
                                                                    Disable
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => connect(source.id)}
                                                                    className="px-3 py-1.5 text-xs bg-neon text-obsidian font-bold rounded-lg hover:bg-neonhov transition-colors font-brand"
                                                                >
                                                                    Connect
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Trends View - Redesigned */}
                            {view === 'TRENDS' && (
                                <div className="max-w-7xl mx-auto relative z-10">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white font-brand mb-2">Trends Playground</h2>
                                            <p className="text-gray-400 text-sm font-mono">AI learns silently. You just explore.</p>
                                        </div>
                                        {/* Usage Limits */}
                                        <div className="flex gap-4 text-xs font-mono">
                                            <div className="bg-gunmetal px-3 py-2 rounded-lg border border-white/10">
                                                <div className="text-gray-400">Daily</div>
                                                <div className="text-neon font-bold">{usageStats.daily.used}/{usageStats.daily.limit}</div>
                                            </div>
                                            <div className="bg-gunmetal px-3 py-2 rounded-lg border border-white/10">
                                                <div className="text-gray-400">Monthly</div>
                                                <div className="text-neon font-bold">{usageStats.monthly.used}/{usageStats.monthly.limit}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location Input - Required First */}
                                    {!targetLocation && (
                                        <div className="glass-card p-8 rounded-2xl border border-white/10 mb-6 text-center">
                                            <h3 className="text-white font-bold font-brand mb-4">Enter Target Location</h3>
                                            <p className="text-gray-400 text-sm mb-4 font-mono">We'll show trending content for your location</p>
                                            <div className="flex gap-3 max-w-md mx-auto">
                                                <input
                                                    type="text"
                                                    placeholder="e.g., Mumbai, India or San Francisco, USA"
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter' && e.currentTarget.value) {
                                                            const loc = e.currentTarget.value;
                                                            setTargetLocation(loc);
                                                            // Fetch trending content
                                                            fetch(`${API_URL}/trends/trending?location=${encodeURIComponent(loc)}`, {
                                                                method: 'GET',
                                                                headers: { 'x-user-id': userId || '' }
                                                            })
                                                                .then(r => {
                                                                    if (!r.ok) throw new Error('Failed to fetch');
                                                                    return r.json();
                                                                })
                                                                .then(d => {
                                                                    setTrendingContent(d.trending || []);
                                                                    setMemeTemplates(d.memes || []);
                                                                })
                                                                .catch(err => {
                                                                    console.error('Trending fetch error:', err);
                                                                    // Set empty arrays on error
                                                                    setTrendingContent([]);
                                                                    setMemeTemplates([]);
                                                                });
                                                        }
                                                    }}
                                                    className="flex-1 bg-gunmetal border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon outline-none font-sans"
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                        if (input.value) {
                                                            const loc = input.value;
                                                            setTargetLocation(loc);
                                                            fetch(`${API_URL}/trends/trending?location=${encodeURIComponent(loc)}`, {
                                                                method: 'GET',
                                                                headers: { 'x-user-id': userId || '' }
                                                            })
                                                                .then(r => {
                                                                    if (!r.ok) throw new Error('Failed to fetch');
                                                                    return r.json();
                                                                })
                                                                .then(d => {
                                                                    setTrendingContent(d.trending || []);
                                                                    setMemeTemplates(d.memes || []);
                                                                })
                                                                .catch(err => {
                                                                    console.error('Trending fetch error:', err);
                                                                    // Set empty arrays on error
                                                                    setTrendingContent([]);
                                                                    setMemeTemplates([]);
                                                                });
                                                        }
                                                    }}
                                                    className="px-6 py-3 bg-neon text-obsidian font-bold rounded-xl hover:bg-neonhov transition-colors font-brand"
                                                >
                                                    Go
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {targetLocation && (
                                        <>
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                                                    <span>📍 {targetLocation}</span>
                                                    <button
                                                        onClick={() => {
                                                            setTargetLocation("");
                                                            setTrendingContent([]);
                                                            setMemeTemplates([]);
                                                        }}
                                                        className="text-neon hover:text-neonhov"
                                                    >
                                                        Change
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                                {/* Competitor Tracking - AI Training Only */}
                                                <div className="lg:col-span-2 space-y-4">
                                                    <div className="glass-card p-6 rounded-2xl border border-white/10">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <h3 className="text-white font-bold font-brand flex items-center gap-2 mb-1">
                                                                    <Target className="w-5 h-5 text-neon" />
                                                                    Competitors (AI Training)
                                                                </h3>
                                                                <p className="text-gray-400 text-xs font-mono">AI learns from their posts automatically</p>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    showMultiPrompt(
                                                                        "Add Competitor",
                                                                        "Track a competitor to learn from their content",
                                                                        [
                                                                            { label: "Competitor Name", placeholder: "e.g., TechCorp", key: "name" },
                                                                            { label: "Platform", placeholder: "e.g., LinkedIn, Twitter", key: "platform" },
                                                                            { label: "Handle", placeholder: "@username or profile URL", key: "handle" }
                                                                        ],
                                                                        (values) => {
                                                                            if (values.name && values.platform && values.handle) {
                                                                                fetch(`${API_URL}/trends/competitor/add`, {
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                                                                                    body: JSON.stringify({ name: values.name, platform: values.platform, handle: values.handle })
                                                                                }).then(() => {
                                                                                    fetch(`${API_URL}/trends/competitors`, {
                                                                                        headers: { 'x-user-id': userId || '' }
                                                                                    }).then(r => r.json()).then(d => {
                                                                                        setCompetitors(d.competitors || []);
                                                                                        // Auto-fetch posts and train AI
                                                                                        if (d.competitors && d.competitors.length > 0) {
                                                                                            const newComp = d.competitors[d.competitors.length - 1];
                                                                                            fetch(`${API_URL}/trends/competitor/${newComp.id}/posts`, {
                                                                                                headers: { 'x-user-id': userId || '' }
                                                                                            }).then(r => r.json()).then(posts => {
                                                                                                setCompetitorPosts(posts.posts || []);
                                                                                                setSelectedCompetitor(newComp);
                                                                                                // AI learns automatically
                                                                                                fetch(`${API_URL}/trends/competitor/learn`, {
                                                                                                    method: 'POST',
                                                                                                    headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                                                                                                    body: JSON.stringify({ competitor_id: newComp.id })
                                                                                                });
                                                                                            });
                                                                                        }
                                                                                    });
                                                                                });
                                                                            } else {
                                                                                showToast('Please fill all fields', 'warning');
                                                                            }
                                                                        })
                                                                }}
                                                                className="px-3 py-1.5 bg-neon text-obsidian text-xs font-bold rounded-lg hover:bg-neonhov transition-colors flex items-center gap-1 font-brand"
                                                            >
                                                                <Plus size={14} /> Add
                                                            </button>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {competitors.length === 0 ? (
                                                                <p className="text-gray-500 text-sm text-center py-6 font-mono">Add competitors → AI learns automatically</p>
                                                            ) : (
                                                                competitors.map((comp: any) => (
                                                                    <div
                                                                        key={comp.id}
                                                                        onClick={() => {
                                                                            setSelectedCompetitor(comp);
                                                                            fetch(`${API_URL}/trends/competitor/${comp.id}/posts`, {
                                                                                headers: { 'x-user-id': userId || '' }
                                                                            }).then(r => r.json()).then(d => {
                                                                                setCompetitorPosts(d.posts || []);
                                                                                // AI learns when you view posts
                                                                                fetch(`${API_URL}/trends/competitor/learn`, {
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                                                                                    body: JSON.stringify({ competitor_id: comp.id })
                                                                                });
                                                                            });
                                                                        }}
                                                                        className="bg-gunmetal p-3 rounded-xl border border-white/5 hover:border-neon/30 transition-colors cursor-pointer"
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div>
                                                                                <h4 className="text-white font-bold font-brand text-sm">{comp.name}</h4>
                                                                                <p className="text-gray-400 text-xs font-mono">{comp.platform} • @{comp.handle}</p>
                                                                            </div>
                                                                            <Brain className="w-4 h-4 text-purple-400" />
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Competitor Posts - Click to Edit */}
                                                    {selectedCompetitor && competitorPosts.length > 0 && (
                                                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                                                            <h3 className="text-white font-bold font-brand mb-4 text-sm">
                                                                {selectedCompetitor.name}'s Posts • Click to Edit
                                                            </h3>
                                                            <div className="space-y-2">
                                                                {competitorPosts.map((post: any) => (
                                                                    <div
                                                                        key={post.id}
                                                                        onClick={() => {
                                                                            setSelectedPost(post);
                                                                            setEditContent(post.content);
                                                                            setEditImageUrl(post.image_url || "");
                                                                            setEditingCard({ id: 'trend', content: post.content, image_url: post.image_url });
                                                                        }}
                                                                        className="bg-gunmetal p-3 rounded-xl border border-white/5 hover:border-neon/30 cursor-pointer transition-colors"
                                                                    >
                                                                        {post.image_url && (
                                                                            <img src={post.image_url} alt="" className="w-full h-32 object-cover rounded-lg mb-2" />
                                                                        )}
                                                                        <p className="text-white text-xs mb-1 line-clamp-2">{post.content}</p>
                                                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                                                            <span className="font-mono">👍 {post.engagement?.likes || 0}</span>
                                                                            <span className="text-neon text-[10px] font-mono">Click to edit →</span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* AI Preferences - Simple Filters */}
                                                    <div className="glass-card p-6 rounded-2xl border border-white/10">
                                                        <h3 className="text-white font-bold font-brand mb-4 flex items-center gap-2 text-sm">
                                                            <Brain className="w-4 h-4 text-purple-400" />
                                                            AI Style
                                                        </h3>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-xs text-gray-400 mb-1 block font-mono">Tone</label>
                                                                <select
                                                                    value={aiPreferences.tone}
                                                                    onChange={(e) => {
                                                                        const newPrefs = { ...aiPreferences, tone: e.target.value };
                                                                        setAiPreferences(newPrefs);
                                                                        fetch(`${API_URL}/trends/ai/preferences`, {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                                                                            body: JSON.stringify(newPrefs)
                                                                        });
                                                                    }}
                                                                    className="w-full bg-gunmetal border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-neon outline-none font-sans"
                                                                >
                                                                    <option value="professional">Professional</option>
                                                                    <option value="casual">Casual</option>
                                                                    <option value="sassy">Sassy (Grok)</option>
                                                                    <option value="hinglish">Hinglish (Grok)</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-400 mb-1 block font-mono">Length</label>
                                                                <select
                                                                    value={aiPreferences.length}
                                                                    onChange={(e) => {
                                                                        const newPrefs = { ...aiPreferences, length: e.target.value };
                                                                        setAiPreferences(newPrefs);
                                                                        fetch(`${API_URL}/trends/ai/preferences`, {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                                                                            body: JSON.stringify(newPrefs)
                                                                        });
                                                                    }}
                                                                    className="w-full bg-gunmetal border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-neon outline-none font-sans"
                                                                >
                                                                    <option value="short">Short</option>
                                                                    <option value="medium">Medium</option>
                                                                    <option value="long">Long</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-3">
                                                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={aiPreferences.include_hashtags}
                                                                    onChange={(e) => {
                                                                        const newPrefs = { ...aiPreferences, include_hashtags: e.target.checked };
                                                                        setAiPreferences(newPrefs);
                                                                        fetch(`${API_URL}/trends/ai/preferences`, {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                                                                            body: JSON.stringify(newPrefs)
                                                                        });
                                                                    }}
                                                                    className="w-3 h-3 text-neon bg-gunmetal border-white/20 rounded"
                                                                />
                                                                <span className="font-mono">Hashtags</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={aiPreferences.include_emojis}
                                                                    onChange={(e) => {
                                                                        const newPrefs = { ...aiPreferences, include_emojis: e.target.checked };
                                                                        setAiPreferences(newPrefs);
                                                                        fetch(`${API_URL}/trends/ai/preferences`, {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                                                                            body: JSON.stringify(newPrefs)
                                                                        });
                                                                    }}
                                                                    className="w-3 h-3 text-neon bg-gunmetal border-white/20 rounded"
                                                                />
                                                                <span className="font-mono">Emojis</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Trending Content & Memes - Only show after location */}
                                                <div className="space-y-4">
                                                    <div className="glass-card p-6 rounded-2xl border border-white/10">
                                                        <h3 className="text-white font-bold font-brand mb-4 flex items-center gap-2 text-sm">
                                                            <TrendingUp className="w-4 h-4 text-neon" />
                                                            Trending
                                                        </h3>

                                                        <div className="space-y-2">
                                                            {trendingContent.length === 0 ? (
                                                                <p className="text-gray-500 text-xs text-center py-4 font-mono">No trends yet</p>
                                                            ) : (
                                                                trendingContent.slice(0, 5).map((trend: any) => (
                                                                    <div
                                                                        key={trend.id}
                                                                        onClick={() => {
                                                                            setSelectedPost(trend);
                                                                            setEditContent(trend.content);
                                                                            setEditingCard({ id: 'trend', content: trend.content });
                                                                        }}
                                                                        className="bg-gunmetal p-3 rounded-xl border border-white/5 hover:border-neon/30 cursor-pointer transition-colors"
                                                                    >
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <span className="text-xs text-neon font-mono">#{trend.category}</span>
                                                                            <span className="text-xs text-gray-500 font-mono">{trend.trending_score}%</span>
                                                                        </div>
                                                                        <p className="text-white text-xs font-brand line-clamp-2">{trend.content}</p>
                                                                        <div className="flex gap-1 mt-1">
                                                                            {trend.hashtags?.slice(0, 2).map((tag: string) => (
                                                                                <span key={tag} className="text-[10px] text-gray-500 font-mono">#{tag}</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Meme Templates - Click to Edit */}
                                                    <div className="glass-card p-6 rounded-2xl border border-white/10">
                                                        <h3 className="text-white font-bold font-brand mb-4 flex items-center gap-2 text-sm">
                                                            <ImageIcon className="w-4 h-4 text-yellow-400" />
                                                            Memes
                                                        </h3>

                                                        <div className="grid grid-cols-2 gap-2">
                                                            {memeTemplates.length === 0 ? (
                                                                <p className="col-span-2 text-gray-500 text-xs text-center py-4 font-mono">No memes yet</p>
                                                            ) : (
                                                                memeTemplates.slice(0, 4).map((meme: any) => (
                                                                    <div
                                                                        key={meme.id}
                                                                        onClick={() => setSelectedMeme(meme)}
                                                                        className="aspect-square bg-gunmetal rounded-lg border border-white/5 hover:border-neon/30 cursor-pointer overflow-hidden group"
                                                                    >
                                                                        <img src={meme.image_url} alt={meme.name} className="w-full h-full object-cover" />
                                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                                            <span className="text-white text-xs opacity-0 group-hover:opacity-100 font-mono">Click to edit</span>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Meme Editor Modal */}
                            <AnimatePresence>
                                {selectedMeme && (
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
                                                <h3 className="text-white font-bold font-brand">Edit Meme</h3>
                                                <button onClick={() => setSelectedMeme(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                                            </div>
                                            <div className="p-6 bg-obsidian">
                                                <div className="relative mb-4">
                                                    <img src={selectedMeme.image_url} alt="Meme template" className="w-full rounded-xl" />
                                                    <div className="absolute top-4 left-0 right-0 text-center">
                                                        <input
                                                            type="text"
                                                            value={memeText.top}
                                                            onChange={(e) => setMemeText({ ...memeText, top: e.target.value })}
                                                            placeholder="Top text"
                                                            className="bg-black/50 text-white text-xl font-bold px-4 py-2 rounded-lg border border-white/20 focus:border-neon outline-none text-center"
                                                        />
                                                    </div>
                                                    <div className="absolute bottom-4 left-0 right-0 text-center">
                                                        <input
                                                            type="text"
                                                            value={memeText.bottom}
                                                            onChange={(e) => setMemeText({ ...memeText, bottom: e.target.value })}
                                                            placeholder="Bottom text"
                                                            className="bg-black/50 text-white text-xl font-bold px-4 py-2 rounded-lg border border-white/20 focus:border-neon outline-none text-center"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setSelectedMeme(null)}
                                                        className="flex-1 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors border border-white/10"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            const res = await fetch(`${API_URL}/trends/meme/edit`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                                                                body: JSON.stringify({
                                                                    template_id: selectedMeme.id,
                                                                    top_text: memeText.top,
                                                                    bottom_text: memeText.bottom
                                                                })
                                                            });
                                                            const data = await res.json();
                                                            setEditImageUrl(data.image_url);
                                                            setSelectedMeme(null);
                                                            showToast('Meme created! You can use it in your post editor.', 'success');
                                                        }}
                                                        className="flex-1 px-4 py-2 rounded-lg text-sm bg-neon text-obsidian font-bold hover:bg-neonhov transition-colors"
                                                    >
                                                        Create Meme
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Settings View */}
                            {view === 'SETTINGS' && (
                                <div className="max-w-2xl mx-auto relative z-10">
                                    <h2 className="text-2xl font-bold text-white font-brand mb-6">Profile & Settings</h2>

                                    {/* Account Section */}
                                    <div className="glass-card p-6 rounded-2xl border border-white/10 mb-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <User className="w-5 h-5 text-neon" />
                                            <h3 className="text-white font-bold font-brand">Account</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm text-gray-400 mb-2 block">Email</label>
                                                <input
                                                    type="email"
                                                    placeholder="your@email.com"
                                                    defaultValue={email}
                                                    className="w-full bg-gunmetal border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:border-neon outline-none"
                                                    onBlur={async (e) => {
                                                        if (e.target.value && e.target.value !== email) {
                                                            try {
                                                                const res = await fetch(`${API_URL}/settings/update-email`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                                                                    body: JSON.stringify({ email: e.target.value })
                                                                });
                                                                if (res.ok) {
                                                                    showToast('Email updated successfully', 'success');
                                                                    setEmail(e.target.value);
                                                                } else {
                                                                    showToast('Failed to update email', 'error');
                                                                }
                                                            } catch (e) {
                                                                showToast('Error updating email', 'error');
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-400 mb-2 block">Change Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="New password"
                                                    className="w-full bg-gunmetal border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:border-neon outline-none mb-2"
                                                    onBlur={async (e) => {
                                                        if (e.target.value) {
                                                            try {
                                                                const res = await fetch(`${API_URL}/settings/update-password`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                                                                    body: JSON.stringify({ password: e.target.value })
                                                                });
                                                                if (res.ok) {
                                                                    showToast('Password updated successfully', 'success');
                                                                    e.target.value = '';
                                                                } else {
                                                                    showToast('Failed to update password', 'error');
                                                                }
                                                            } catch (e) {
                                                                showToast('Error updating password', 'error');
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* BYOK Section */}
                                    <div className="glass-card p-6 rounded-2xl border border-white/10 mb-6">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Key className="w-5 h-5 text-neon" />
                                            <h3 className="text-white font-bold font-brand">Bring Your Own Key (BYOK)</h3>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-4">Use your own OpenAI API key for AI features</p>
                                        <div className="flex gap-3">
                                            <input
                                                type="password"
                                                placeholder="sk-..."
                                                className="flex-1 bg-gunmetal border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:border-neon outline-none"
                                                defaultValue={profile?.openai_key || ''}
                                                onBlur={async (e) => {
                                                    if (e.target.value) {
                                                        await fetch(`${API_URL}/settings/update`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                                                            body: JSON.stringify({ openai_key: e.target.value })
                                                        });
                                                        fetchProfile(userId!);
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={() => {
                                                    showPrompt(
                                                        "Enter OpenAI API Key",
                                                        "Add your OpenAI API key to use custom AI models",
                                                        "sk-...",
                                                        async (key) => {
                                                            if (key) {
                                                                try {
                                                                    await fetch(`${API_URL}/settings/update`, {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json', 'x-user-id': userId || '' },
                                                                        body: JSON.stringify({ openai_key: key })
                                                                    });
                                                                    showToast('API key saved successfully', 'success');
                                                                    fetchProfile(userId!);
                                                                } catch (e) {
                                                                    showToast('Failed to save API key', 'error');
                                                                }
                                                            }
                                                        }
                                                    );
                                                }}
                                                className="px-4 py-2 bg-neon text-obsidian font-bold rounded-xl hover:bg-neonhov transition-colors"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>

                                    {/* GDPR Section */}
                                    <div className="glass-card p-6 rounded-2xl border border-white/10 mb-6">
                                        <h3 className="text-white font-bold font-brand mb-4">Data Management</h3>
                                        <div className="space-y-3">
                                            <button
                                                onClick={exportData}
                                                className="w-full px-4 py-2 bg-gunmetal border border-white/10 rounded-xl text-white hover:border-neon transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Download size={16} /> Export All Data
                                            </button>
                                            <button
                                                onClick={() => {
                                                    showConfirm(
                                                        'Delete All Data',
                                                        'Are you sure? This will delete all your data permanently. This action cannot be undone.',
                                                        async () => {
                                                            try {
                                                                const res = await fetch(`${API_URL}/user/data/delete`, {
                                                                    method: 'DELETE',
                                                                    headers: { 'x-user-id': userId || '' }
                                                                });
                                                                if (res.ok) {
                                                                    showToast('All data deleted', 'success');
                                                                    localStorage.clear();
                                                                    window.location.href = '/';
                                                                } else {
                                                                    showToast('Failed to delete data', 'error');
                                                                }
                                                            } catch (e) {
                                                                showToast('Error deleting data', 'error');
                                                            }
                                                        }
                                                    );
                                                }}
                                                className="w-full px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 hover:bg-red-500/30 transition-colors"
                                            >
                                                Delete All Data
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* Notifications View */}
                            {view === 'NOTIFICATIONS' && (
                                <div className="max-w-4xl mx-auto relative z-10 p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white font-brand mb-2">Notifications</h2>
                                            <p className="text-gray-400 text-sm font-mono">Stay updated on your activity</p>
                                        </div>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="px-4 py-2 bg-gunmetal border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white hover:border-neon transition-colors font-mono"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        {notifications.length === 0 ? (
                                            <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
                                                <Bell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                                <p className="text-gray-400 font-mono">No notifications yet</p>
                                                <p className="text-gray-500 text-xs mt-2 font-mono">You'll see updates here when something happens</p>
                                            </div>
                                        ) : (
                                            notifications.map((notif: any) => (
                                                <motion.div
                                                    key={notif.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    onClick={() => {
                                                        if (!notif.read) markAsRead(notif.id);
                                                        if (notif.action_url) {
                                                            // Handle navigation if needed
                                                        }
                                                    }}
                                                    className={`glass-card p-4 rounded-xl border transition-all cursor-pointer ${notif.read
                                                        ? 'border-white/5 opacity-60'
                                                        : 'border-neon/30 bg-neon/5'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notif.severity === 'error' ? 'bg-red-500' :
                                                            notif.severity === 'warning' ? 'bg-yellow-500' :
                                                                notif.severity === 'success' ? 'bg-green-500' :
                                                                    'bg-neon'
                                                            }`} />
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h4 className="text-white font-bold font-brand text-sm">{notif.title}</h4>
                                                                <span className="text-xs text-gray-500 font-mono">
                                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-300 text-sm font-sans">{notif.message}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Privacy Policy View */}
                            {view === 'PRIVACY' && (
                                <div className="max-w-4xl mx-auto relative z-10 p-8">
                                    <h2 className="text-2xl font-bold text-white font-brand mb-6">Privacy Policy</h2>
                                    <div className="glass-card p-8 rounded-2xl border border-white/10 space-y-6">
                                        <div>
                                            <h3 className="text-white font-bold font-brand mb-3">Data Collection</h3>
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                We collect only the data necessary to provide our services. This includes:
                                            </p>
                                            <ul className="list-disc list-inside text-gray-300 text-sm mt-2 space-y-1 ml-4">
                                                <li>Account information (email, password - encrypted)</li>
                                                <li>Integration tokens (encrypted at rest)</li>
                                                <li>Content generated through our platform</li>
                                                <li>Usage analytics (anonymized)</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="text-white font-bold font-brand mb-3">Data Usage</h3>
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                Your data is used solely to provide orchestration services. We do not sell your data to third parties.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-white font-bold font-brand mb-3">Data Security</h3>
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                All sensitive data (tokens, API keys) is encrypted using AES-256 encryption. We follow industry best practices for data security.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-white font-bold font-brand mb-3">Your Rights (GDPR)</h3>
                                            <p className="text-gray-300 text-sm leading-relaxed mb-2">
                                                You have the right to:
                                            </p>
                                            <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 ml-4">
                                                <li><strong>Access:</strong> Export all your data via Settings</li>
                                                <li><strong>Deletion:</strong> Delete all your data via Settings</li>
                                                <li><strong>Correction:</strong> Update your information anytime</li>
                                                <li><strong>Portability:</strong> Export your data in JSON format</li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h3 className="text-white font-bold font-brand mb-3">Third-Party Services</h3>
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                We integrate with GitHub, LinkedIn, Slack, and other services. Your data shared with these services is governed by their privacy policies.
                                            </p>
                                        </div>

                                        <div>
                                            <h3 className="text-white font-bold font-brand mb-3">Contact</h3>
                                            <p className="text-gray-300 text-sm">
                                                For privacy concerns, contact us at privacy@covalynce.com
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-white/10">
                                            <p className="text-xs text-gray-500 font-mono">
                                                Last updated: {new Date().toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Card History View */}
                            {view === 'HISTORY' && (
                                <div className="max-w-4xl mx-auto relative z-10 p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white font-brand mb-2">Card History</h2>
                                            <p className="text-gray-400 text-sm font-mono">View all your past cards</p>
                                        </div>
                                        <button
                                            onClick={() => fetchCardHistory(userId!)}
                                            disabled={loadingHistory}
                                            className="px-4 py-2 bg-gunmetal border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white hover:border-neon transition-colors font-mono flex items-center gap-2"
                                        >
                                            {loadingHistory ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin" /> Loading...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw size={16} /> Refresh
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {loadingHistory ? (
                                        <div className="flex items-center justify-center h-64">
                                            <Loader2 className="w-8 h-8 text-neon animate-spin" />
                                            <span className="ml-3 text-gray-400 font-mono">Loading history...</span>
                                        </div>
                                    ) : cardHistory.length === 0 ? (
                                        <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
                                            <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                                            <p className="text-gray-400 font-mono mb-2">No history yet</p>
                                            <p className="text-gray-500 text-xs font-mono">Your card history will appear here</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {cardHistory.map((card: any) => (
                                                <div
                                                    key={card.id}
                                                    className="glass-card p-4 rounded-xl border border-white/10"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-white font-bold font-brand text-sm">{card.title}</h4>
                                                        <span className="text-xs text-gray-500 font-mono">
                                                            {new Date(card.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-300 text-sm font-sans line-clamp-2">{card.content}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`text-xs px-2 py-1 rounded ${card.status === 'POSTED' ? 'bg-green-500/20 text-green-400' :
                                                            card.status === 'DISMISSED' ? 'bg-red-500/20 text-red-400' :
                                                                'bg-gray-500/20 text-gray-400'
                                                            }`}>
                                                            {card.status || 'PENDING'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Help/Documentation View */}
                            {view === 'HELP' && (
                                <div className="max-w-4xl mx-auto relative z-10 p-8">
                                    <h2 className="text-2xl font-bold text-white font-brand mb-6">Help & Documentation</h2>

                                    <div className="space-y-4 mb-6">
                                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                                            <h3 className="text-white font-bold font-brand mb-3 flex items-center gap-2">
                                                <HelpCircle className="w-5 h-5 text-neon" />
                                                Getting Started
                                            </h3>
                                            <div className="space-y-3 text-sm text-gray-300">
                                                <div>
                                                    <p className="font-bold text-white mb-1">1. Connect Your Sources</p>
                                                    <p className="text-gray-400">Go to Sources and connect GitHub, LinkedIn, Slack, and other tools you use.</p>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white mb-1">2. Let AI Generate Content</p>
                                                    <p className="text-gray-400">AI automatically creates marketing posts from your engineering activity.</p>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white mb-1">3. Review & Post</p>
                                                    <p className="text-gray-400">Review generated cards, edit if needed, and post to LinkedIn with one click.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                                            <h3 className="text-white font-bold font-brand mb-3">FAQ</h3>
                                            <div className="space-y-4 text-sm">
                                                <div>
                                                    <p className="font-bold text-white mb-1">How does orchestration work?</p>
                                                    <p className="text-gray-300">AI watches your GitHub activity, generates marketing content, and can auto-update Jira tickets when PRs merge. It works silently in the background.</p>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white mb-1">Can I use my own OpenAI API key?</p>
                                                    <p className="text-gray-300">Yes! Go to Settings and add your OpenAI API key (BYOK - Bring Your Own Key).</p>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white mb-1">How do I track competitors?</p>
                                                    <p className="text-gray-300">Go to Trends, enter your location, and add competitors. AI learns from their posts automatically.</p>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white mb-1">What are usage limits?</p>
                                                    <p className="text-gray-300">SOLO plan: 5 cards/month. PRO plan: Unlimited. Limits prevent overuse of AI.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                                            <h3 className="text-white font-bold font-brand mb-3">API Documentation</h3>
                                            <p className="text-gray-300 text-sm mb-3">
                                                All endpoints require <code className="bg-gunmetal px-2 py-1 rounded text-neon font-mono">x-user-id</code> header.
                                            </p>
                                            <div className="space-y-2 text-xs font-mono text-gray-400">
                                                <div><span className="text-neon">POST</span> /auth/signup - Create account</div>
                                                <div><span className="text-neon">POST</span> /auth/signin - Sign in</div>
                                                <div><span className="text-neon">GET</span> /sync/github - Get cards</div>
                                                <div><span className="text-neon">POST</span> /action/execute - Post to LinkedIn</div>
                                                <div><span className="text-neon">GET</span> /notifications - Get notifications</div>
                                                <div><span className="text-neon">POST</span> /user/data/export - Export data (GDPR)</div>
                                                <div><span className="text-neon">DELETE</span> /user/data/delete - Delete data (GDPR)</div>
                                            </div>
                                        </div>
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
                                            className="w-full h-48 bg-[#15171e] text-gray-300 p-4 rounded-xl border border-white/10 focus:border-neon outline-none font-sans text-sm leading-relaxed resize-none mb-4"
                                        ></textarea>

                                        {/* Image Section */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm text-gray-400">Image</label>
                                                <button
                                                    onClick={generateImage}
                                                    disabled={generatingImage || !editContent.trim()}
                                                    className="text-xs text-neon hover:text-neonhov flex items-center gap-1 transition-colors disabled:opacity-50"
                                                >
                                                    {generatingImage ? 'Generating...' : <><Sparkles size={12} /> Generate Image</>}
                                                </button>
                                            </div>
                                            {editImageUrl && (
                                                <div className="relative rounded-xl overflow-hidden border border-white/10">
                                                    <img src={editImageUrl} alt="Post image" className="w-full h-48 object-cover" />
                                                    <button
                                                        onClick={() => setEditImageUrl("")}
                                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )}
                                            {!editImageUrl && (
                                                <div className="w-full h-32 bg-gunmetal border border-dashed border-white/10 rounded-xl flex items-center justify-center">
                                                    <span className="text-gray-500 text-sm">No image</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center mt-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleRephrase}
                                                    disabled={rephrasing || !editContent.trim()}
                                                    className="text-xs text-gray-500 hover:text-neon flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {rephrasing ? (
                                                        <>
                                                            <Loader2 size={12} className="animate-spin" /> Rephrasing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles size={12} /> AI Rephrase
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => { setEditingCard(null); setEditImageUrl(""); }} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
                                                <button onClick={saveEditor} className="px-4 py-2 rounded-lg text-sm bg-neon text-obsidian font-bold hover:bg-neonhov transition-colors">Save Changes</button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Plan Switching Modal */}
                    <AnimatePresence>
                        {showPlanModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                                onClick={() => setShowPlanModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="glass-card w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
                                >
                                    <div className="bg-gunmetal/50 px-6 py-4 border-b border-white/5">
                                        <h3 className="text-white font-bold font-brand">Upgrade Plan</h3>
                                    </div>
                                    <div className="p-6 bg-obsidian">
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className={`p-4 rounded-xl border-2 ${profile?.plan === 'SOLO'
                                                ? 'border-neon bg-neon/10'
                                                : 'border-white/10 bg-gunmetal'
                                                }`}>
                                                <h4 className="text-white font-bold font-brand mb-2">SOLO</h4>
                                                <p className="text-2xl font-bold text-white mb-1">$0<span className="text-sm text-gray-400">/mo</span></p>
                                                <ul className="text-xs text-gray-300 space-y-1 mt-3">
                                                    <li>• 5 cards/month</li>
                                                    <li>• Basic integrations</li>
                                                    <li>• Community support</li>
                                                </ul>
                                            </div>
                                            <div className={`p-4 rounded-xl border-2 ${profile?.plan === 'PRO'
                                                ? 'border-neon bg-neon/10'
                                                : 'border-white/10 bg-gunmetal'
                                                }`}>
                                                <h4 className="text-white font-bold font-brand mb-2">PRO</h4>
                                                <p className="text-2xl font-bold text-white mb-1">$29<span className="text-sm text-gray-400">/mo</span></p>
                                                <ul className="text-xs text-gray-300 space-y-1 mt-3">
                                                    <li>• Unlimited cards</li>
                                                    <li>• All integrations</li>
                                                    <li>• Priority support</li>
                                                    <li>• Advanced AI features</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowPlanModal(false)}
                                                className="flex-1 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors border border-white/10"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (processingPayment) return;
                                                    setProcessingPayment(true);

                                                    try {
                                                        // Create Razorpay order
                                                        const orderRes = await fetch(`${API_URL}/payment/order`, {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'x-user-id': userId || ''
                                                            },
                                                            body: JSON.stringify({
                                                                amount: 2900, // ₹29 in paise
                                                                currency: 'INR'
                                                            })
                                                        });

                                                        if (!orderRes.ok) {
                                                            throw new Error('Failed to create order');
                                                        }

                                                        const orderData = await orderRes.json();

                                                        // Wait for Razorpay script to load if not already available
                                                        if (!window.Razorpay) {
                                                            // Script should be loaded via layout.tsx, but wait if needed
                                                            let attempts = 0;
                                                            while (!window.Razorpay && attempts < 50) {
                                                                await new Promise(resolve => setTimeout(resolve, 100));
                                                                attempts++;
                                                            }

                                                            if (!window.Razorpay) {
                                                                throw new Error('Razorpay SDK failed to load. Please refresh the page.');
                                                            }
                                                        }

                                                        const Razorpay = window.Razorpay;

                                                        const options = {
                                                            key: RAZORPAY_KEY,
                                                            amount: orderData.amount,
                                                            currency: orderData.currency,
                                                            name: 'Covalynce',
                                                            description: 'Upgrade to PRO Plan',
                                                            order_id: orderData.id,
                                                            handler: async function (response: any) {
                                                                try {
                                                                    // Verify payment
                                                                    const verifyRes = await fetch(`${API_URL}/payment/verify`, {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'x-user-id': userId || ''
                                                                        },
                                                                        body: JSON.stringify({
                                                                            razorpay_order_id: response.razorpay_order_id,
                                                                            razorpay_payment_id: response.razorpay_payment_id,
                                                                            razorpay_signature: response.razorpay_signature
                                                                        })
                                                                    });

                                                                    const verifyData = await verifyRes.json();

                                                                    if (verifyRes.ok) {
                                                                        showToast('Payment successful! Plan upgraded to PRO', 'success');
                                                                        setShowPlanModal(false);
                                                                        fetchProfile(userId!);
                                                                    } else {
                                                                        showToast('Payment verification failed', 'error');
                                                                    }
                                                                } catch (e) {
                                                                    showToast('Error verifying payment', 'error');
                                                                } finally {
                                                                    setProcessingPayment(false);
                                                                }
                                                            },
                                                            prefill: {
                                                                email: email || '',
                                                                name: 'User'
                                                            },
                                                            theme: {
                                                                color: '#66FCF1'
                                                            },
                                                            modal: {
                                                                ondismiss: function () {
                                                                    setProcessingPayment(false);
                                                                    showToast('Payment cancelled', 'warning');
                                                                },
                                                                escape: true,
                                                                backdropclose: true
                                                            }
                                                        };

                                                        const razorpay = new Razorpay(options);
                                                        razorpay.open();

                                                    } catch (e: any) {
                                                        showToast(e.message || 'Failed to initiate payment', 'error');
                                                        setProcessingPayment(false);
                                                    }
                                                }}
                                                disabled={processingPayment}
                                                className="flex-1 px-4 py-2 rounded-lg text-sm bg-neon text-obsidian font-bold hover:bg-neonhov transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {processingPayment ? (
                                                    <>
                                                        <Loader2 size={16} className="animate-spin" /> Processing...
                                                    </>
                                                ) : (
                                                    'Upgrade to PRO'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Toast Container */}
                    {/* Confirm Modal */}
                    <AnimatePresence>
                        {showConfirmModal && confirmConfig && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="glass-card p-6 rounded-2xl border border-white/10 max-w-md w-full"
                                >
                                    <h3 className="text-white font-bold font-brand text-xl mb-2">{confirmConfig.title}</h3>
                                    <p className="text-gray-400 text-sm mb-6">{confirmConfig.message}</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowConfirmModal(false)}
                                            className="flex-1 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors border border-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                confirmConfig.onConfirm();
                                                setShowConfirmModal(false);
                                            }}
                                            className="flex-1 px-4 py-2 rounded-lg text-sm bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Prompt Modal */}
                    <AnimatePresence>
                        {showPromptModal && promptConfig && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                onClick={() => setShowPromptModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="glass-card p-6 rounded-2xl border border-white/10 max-w-md w-full"
                                >
                                    <h3 className="text-white font-bold font-brand text-xl mb-2">{promptConfig.title}</h3>
                                    <p className="text-gray-400 text-sm mb-4">{promptConfig.message}</p>
                                    <input
                                        type="text"
                                        value={promptValue}
                                        onChange={(e) => setPromptValue(e.target.value)}
                                        placeholder={promptConfig.placeholder}
                                        className="w-full bg-gunmetal border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon outline-none mb-4"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                promptConfig.onConfirm(promptValue);
                                                setShowPromptModal(false);
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowPromptModal(false)}
                                            className="flex-1 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors border border-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                promptConfig.onConfirm(promptValue);
                                                setShowPromptModal(false);
                                            }}
                                            className="flex-1 px-4 py-2 rounded-lg text-sm bg-neon text-obsidian font-bold hover:bg-neonhov transition-colors"
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Multi-Prompt Modal */}
                    <AnimatePresence>
                        {showMultiPromptModal && multiPromptConfig && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                onClick={() => setShowMultiPromptModal(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="glass-card p-6 rounded-2xl border border-white/10 max-w-md w-full max-h-[90vh] overflow-y-auto"
                                >
                                    <h3 className="text-white font-bold font-brand text-xl mb-2">{multiPromptConfig.title}</h3>
                                    <p className="text-gray-400 text-sm mb-4">{multiPromptConfig.description}</p>
                                    <div className="space-y-4 mb-6">
                                        {multiPromptConfig.fields.map((field) => (
                                            <div key={field.key}>
                                                <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                                                <input
                                                    type="text"
                                                    value={multiPromptValues[field.key] || ''}
                                                    onChange={(e) => setMultiPromptValues({ ...multiPromptValues, [field.key]: e.target.value })}
                                                    placeholder={field.placeholder}
                                                    className="w-full bg-gunmetal border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-neon outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowMultiPromptModal(false)}
                                            className="flex-1 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors border border-white/10"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                multiPromptConfig.onConfirm(multiPromptValues);
                                                setShowMultiPromptModal(false);
                                            }}
                                            className="flex-1 px-4 py-2 rounded-lg text-sm bg-neon text-obsidian font-bold hover:bg-neonhov transition-colors"
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Consent Modal */}
                    <AnimatePresence>
                        {showConsent && (
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
                                    className="glass-card w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                                >
                                    <div className="bg-gunmetal/50 px-6 py-4 border-b border-white/5">
                                        <h3 className="text-white font-bold">Connect {pendingProvider?.toUpperCase()}</h3>
                                        <p className="text-gray-400 text-sm mt-1">We need the following permissions:</p>
                                    </div>
                                    <div className="p-6 bg-obsidian">
                                        <ul className="space-y-2 mb-6">
                                            {pendingPermissions.map((perm, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-gray-300 text-sm">
                                                    <Check size={16} className="text-neon mt-0.5 flex-shrink-0" />
                                                    <span>{perm}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <label className="flex items-start gap-3 cursor-pointer mb-6">
                                            <input
                                                type="checkbox"
                                                checked={consentChecked}
                                                onChange={(e) => setConsentChecked(e.target.checked)}
                                                className="mt-1 w-4 h-4 text-neon bg-gunmetal border-white/20 rounded focus:ring-neon"
                                            />
                                            <span className="text-sm text-gray-300">
                                                I consent to granting these permissions to Covalynce. I understand that I can revoke access at any time.
                                            </span>
                                        </label>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => { setShowConsent(false); setConsentChecked(false); }}
                                                className="flex-1 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors border border-white/10"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={proceedWithConnection}
                                                disabled={!consentChecked}
                                                className="flex-1 px-4 py-2 rounded-lg text-sm bg-neon text-obsidian font-bold hover:bg-neonhov transition-colors disabled:opacity-50"
                                            >
                                                Connect
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <ToastContainer toasts={toasts} onRemove={removeToast} />
                </div>
            );
    }
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

const TaskCard = ({ data, onAction, onEdit, selected, onSelect }: any) => {
    const Icon = data.icon || Github;
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, rotate: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`glass-card p-5 rounded-2xl hover:border-neon/30 transition-colors duration-300 group relative ${data.colorClass} ${selected ? 'ring-2 ring-neon' : ''}`}
        >
            {onSelect && (
                <div className="absolute top-2 right-2 z-10">
                    <input
                        type="checkbox"
                        checked={selected || false}
                        onChange={onSelect}
                        className="w-4 h-4 text-neon bg-gunmetal border-white/20 rounded cursor-pointer"
                    />
                </div>
            )}
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

            {data.image_url && (
                <div className="mb-3 rounded-lg overflow-hidden border border-white/5">
                    <img src={data.image_url} alt={data.title} className="w-full h-32 object-cover" />
                </div>
            )}
            <div className="bg-obsidian/50 p-3 rounded-lg border border-white/5 mb-3 relative">
                <p className="text-gray-300 text-xs leading-relaxed font-sans line-clamp-4 whitespace-pre-wrap">{data.content}</p>
                <div onClick={onEdit} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="bg-neon text-obsidian text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-brand hover:bg-neonhov hover:scale-105 transition-transform">Edit</div>
                </div>
            </div>

            <div className="flex gap-1.5 mb-4 flex-wrap">
                {data.tags?.map((tag: string) => (
                    <span key={tag} className="text-[10px] text-gray-500 font-mono border border-white/5 px-1.5 py-0.5 rounded">#{tag.replace('#', '')}</span>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onAction(data.id, 'discard', 'NONE')} className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-white/10 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all font-medium text-xs active:scale-95">
                    <X size={14} /> Discard
                </button>
                {data.id === 'limit' ? (
                    <button onClick={() => onAction(data.id, 'upgrade', 'NONE')} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all font-bold text-xs active:scale-95"><CreditCard size={14} /> Upgrade</button>
                ) : data.category === 'ENG' ? (
                    <button onClick={() => onAction(data.id, 'execute', 'SLACK')} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-all font-bold text-xs active:scale-95"><Slack size={14} /> Notify Slack</button>
                ) : (
                    <button onClick={() => onAction(data.id, 'execute', 'LINKEDIN')} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neon text-obsidian hover:bg-neonhov transition-all font-bold text-xs active:scale-95"><Check size={14} /> Approve</button>
                )}
            </div>
        </motion.div>
    );
};

const IntegrationRow = ({ icon: Icon, name, status, onClick }: any) => (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
        <div className="flex items-center gap-3 text-gray-300 text-sm"><Icon size={18} /> {name}</div>
        <button onClick={onClick} className={`text-xs px-3 py-1 rounded transition-colors ${status === 'Connected' ? 'text-green-400 bg-green-900/20' : 'bg-white/10 hover:bg-white/20 text-white'}`}>{status}</button>
    </div>
);