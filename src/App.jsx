import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, ShieldCheck, ShieldAlert, Lock, Unlock,
    Send, Eye, EyeOff, KeyRound, Zap, Activity, Radio, ChevronDown
} from 'lucide-react';

/* ──────────────────────────────────────────────
   BB84 SIMULATION HELPERS (pure frontend)
   ────────────────────────────────────────────── */
const BASES = ['+', 'x'];
const randomBit = () => Math.random() > 0.5 ? 1 : 0;
const randomBase = () => BASES[Math.floor(Math.random() * 2)];

function simulateBB84(numPhotons = 16, evePresent = false) {
    const photons = [];
    let matchCount = 0, errorCount = 0;

    for (let i = 0; i < numPhotons; i++) {
        const aliceBit = randomBit();
        const aliceBase = randomBase();
        let eveBit = null;
        let eveBase = null;
        let transmittedBit = aliceBit;

        if (evePresent) {
            eveBase = randomBase();
            eveBit = eveBase === aliceBase ? aliceBit : randomBit();
            transmittedBit = eveBit;
        }

        const bobBase = randomBase();
        const bobBit = bobBase === aliceBase ? transmittedBit : randomBit();
        const basesMatch = aliceBase === bobBase;

        if (basesMatch) {
            matchCount++;
            if (aliceBit !== bobBit) errorCount++;
        }

        photons.push({ id: i, aliceBit, aliceBase, bobBit, bobBase, eveBit, eveBase, basesMatch, correct: aliceBit === bobBit });
    }

    const qber = matchCount > 0 ? errorCount / matchCount : 0;
    return { photons, qber, secure: qber < 0.11, matchCount, errorCount };
}

/* ──────────────────────────────────────────────
   COMPONENTS
   ────────────────────────────────────────────── */

// Quantum Shield Spinner (shown during key negotiation)
function QuantumSpinner() {
    return (
        <div className="relative w-16 h-16 mx-auto my-4">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-1 rounded-full border-2 border-purple-500/20 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
            <div className="absolute inset-3 flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-blue-400 animate-pulse-slow" />
            </div>
            <div className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-orbit" style={{ top: '50%', left: '50%' }} />
        </div>
    );
}

// Photon travel animation strip
function PhotonStrip({ photon, evePresent }) {
    const color = photon.basesMatch
        ? (photon.correct ? 'from-green-400 to-cyan-400' : 'from-red-400 to-orange-400')
        : 'from-gray-500 to-gray-600';
    return (
        <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: photon.id * 0.06 }}
            className="flex items-center gap-2 text-[10px] sm:text-xs font-mono"
        >
            <span className="w-6 text-blue-300 font-bold">{photon.aliceBase}</span>
            <div className="flex-1 h-[3px] rounded-full relative overflow-hidden bg-gray-800">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.35, delay: photon.id * 0.06 }}
                    className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${color}`}
                />
            </div>
            {evePresent && <Eye className="w-3 h-3 text-red-400 shrink-0" />}
            <span className="w-6 text-purple-300 font-bold text-right">{photon.bobBase}</span>
            <span className={`w-4 text-center font-bold ${photon.basesMatch ? (photon.correct ? 'text-green-400' : 'text-red-400') : 'text-gray-600'}`}>
                {photon.basesMatch ? (photon.correct ? '✓' : '✗') : '·'}
            </span>
        </motion.div>
    );
}

// Encryption badge shown while "encrypting"
function EncryptionBadge({ stage }) {
    // stage: 'encrypting' | 'sent'
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase mt-1.5"
        >
            {stage === 'encrypting' ? (
                <>
                    <Lock className="w-3 h-3 text-yellow-400 animate-pulse" />
                    <span className="text-yellow-400/80">Encrypting with QKD key…</span>
                </>
            ) : (
                <>
                    <ShieldCheck className="w-3 h-3 text-green-400" />
                    <span className="text-green-400/80">Quantum-secured delivery</span>
                </>
            )}
        </motion.div>
    );
}

/* ──────────────────────────────────────────────
   MAIN APP
   ────────────────────────────────────────────── */
export default function App() {
    const [phase, setPhase] = useState('landing'); // landing | handshake | chat | intercepted
    const [eveMode, setEveMode] = useState(false);
    const [handshakeData, setHandshakeData] = useState(null);
    const [shownPhotons, setShownPhotons] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [encrypting, setEncrypting] = useState(null); // id of msg currently encrypting
    const [qber, setQber] = useState(0);

    const chatEndRef = useRef(null);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, encrypting]);

    /* ── Start the handshake ── */
    const beginHandshake = useCallback((withEve) => {
        setEveMode(withEve);
        setPhase('handshake');
        setShownPhotons([]);
        setQber(0);

        const result = simulateBB84(20, withEve);
        setHandshakeData(result);

        // reveal photons one by one
        result.photons.forEach((p, i) => {
            setTimeout(() => {
                setShownPhotons(prev => [...prev, p]);
                // live QBER update
                const shown = result.photons.slice(0, i + 1);
                const matched = shown.filter(x => x.basesMatch);
                const errors = matched.filter(x => !x.correct);
                setQber(matched.length > 0 ? (errors.length / matched.length) * 100 : 0);
            }, i * 120);
        });

        // after animation completes, decide outcome
        setTimeout(() => {
            if (result.secure) {
                setPhase('chat');
                setMessages([{
                    id: Date.now(),
                    sender: 'system',
                    text: `Quantum key established. QBER: ${(result.qber * 100).toFixed(1)}% — well below 11% threshold. Channel is physically secure.`,
                }]);
            } else {
                setPhase('intercepted');
            }
        }, result.photons.length * 120 + 800);
    }, []);

    /* ── Send a message (simulated quantum encryption visual) ── */
    const handleSend = (e) => {
        e.preventDefault();
        if (!inputMsg.trim() || phase !== 'chat') return;

        const msgId = Date.now();
        const userText = inputMsg.trim();
        setMessages(prev => [...prev, { id: msgId, sender: 'me', text: userText }]);
        setInputMsg('');
        setEncrypting(msgId);

        // Simulate encryption delay
        setTimeout(() => {
            setEncrypting(null); // encryption done for user msg
        }, 1000);

        // Bot reply after a realistic delay
        setTimeout(() => {
            const botId = Date.now() + 1;
            const botReplies = [
                "Message received. Decrypted using shared quantum key — integrity verified via BB84 sifting.",
                "Photon-layer verification complete. Your data was transmitted through a collapse-proof channel.",
                "Acknowledged. The key derived from basis reconciliation decrypted your payload with zero loss.",
                "Quantum channel stable. Message fidelity at 100%. No eavesdropping signature detected.",
                "Secure handshake intact. Each bit was individually verified against the sifted key stream.",
            ];
            let reply = botReplies[Math.floor(Math.random() * botReplies.length)];
            if (userText.toLowerCase().includes('hello') || userText.toLowerCase().includes('hi')) {
                reply = "QEdge online. The quantum channel is locked. Speak freely — physics protects us.";
            }
            setMessages(prev => [...prev, { id: botId, sender: 'bot', text: reply }]);
            setEncrypting(botId);
            setTimeout(() => setEncrypting(null), 800);
        }, 2200);
    };

    /* ═══════════════════════════════════════════
       RENDER
       ═══════════════════════════════════════════ */
    return (
        <div className="min-h-screen flex flex-col bg-[#050510] text-gray-200 relative overflow-hidden">
            {/* BG blobs */}
            <div className="fixed -top-1/4 -left-1/4 w-[60vw] h-[60vh] rounded-full bg-blue-900/10 blur-[140px] pointer-events-none" />
            <div className="fixed -bottom-1/4 -right-1/4 w-[60vw] h-[60vh] rounded-full bg-purple-900/10 blur-[140px] pointer-events-none" />

            {/* ─── LANDING ─── */}
            <AnimatePresence mode="wait">
                {phase === 'landing' && (
                    <motion.div
                        key="landing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="flex-1 flex items-center justify-center px-4"
                    >
                        <div className="text-center max-w-lg">
                            <motion.div
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                className="relative inline-block mb-8"
                            >
                                <div className="w-28 h-28 mx-auto rounded-full glass flex items-center justify-center relative">
                                    <Lock className="w-12 h-12 text-blue-400" />
                                    <div className="absolute w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-orbit" />
                                    <div className="absolute w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc] animate-orbit" style={{ animationDelay: '1.5s', animationDuration: '4s' }} />
                                </div>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl sm:text-5xl font-black tracking-tight mb-4"
                            >
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400">
                                    Quantum Secure Chat
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="text-gray-400 text-sm sm:text-base leading-relaxed mb-10 max-w-md mx-auto"
                            >
                                Simulate the BB84 Quantum Key Distribution protocol.
                                Every message you send will be encrypted using a key that is physically impossible to intercept without detection.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center"
                            >
                                <button
                                    onClick={() => beginHandshake(false)}
                                    className="group px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-blue-500/30 active:scale-[0.97] flex items-center justify-center gap-2"
                                >
                                    <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" /> Start Secure Chat
                                </button>
                                <button
                                    onClick={() => beginHandshake(true)}
                                    className="group px-8 py-4 rounded-2xl bg-red-950/50 hover:bg-red-900/60 border border-red-500/30 text-red-200 font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-red-500/10 active:scale-[0.97] flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" /> Simulate Eavesdropper
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* ─── HANDSHAKE ─── */}
                {phase === 'handshake' && (
                    <motion.div
                        key="handshake"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="flex-1 flex items-center justify-center px-4"
                    >
                        <div className="glass rounded-3xl p-8 sm:p-12 max-w-lg w-full text-center">
                            <QuantumSpinner />
                            <h2 className="text-xl sm:text-2xl font-bold mt-4 mb-2">
                                {eveMode
                                    ? <span className="text-red-400">Handshake — Eve Intercepting</span>
                                    : <span className="text-blue-300">Quantum Key Distribution</span>
                                }
                            </h2>
                            <p className="text-gray-500 text-xs sm:text-sm mb-6">
                                Transmitting {20} polarized photons between Alice & Bob…
                            </p>

                            {/* Live QBER */}
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <Activity className="w-4 h-4 text-gray-500" />
                                <span className="text-xs font-mono text-gray-400">QBER:</span>
                                <span className={`font-bold text-sm ${qber > 11 ? 'text-red-400' : 'text-green-400'}`}>{qber.toFixed(1)}%</span>
                                <span className="text-[10px] text-gray-600">(threshold 11%)</span>
                            </div>

                            {/* Photon stream */}
                            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                                <div className="flex items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
                                    <span className="w-6">A</span>
                                    <span className="flex-1 text-center">Photon Channel</span>
                                    {eveMode && <span className="w-3 mr-2"></span>}
                                    <span className="w-6 text-right">B</span>
                                    <span className="w-4"></span>
                                </div>
                                {shownPhotons.map(p => (
                                    <PhotonStrip key={p.id} photon={p} evePresent={eveMode} />
                                ))}
                            </div>

                            {/* Live fiber */}
                            <div className="photon-bar bg-gray-800/50 rounded-full mt-6" />
                        </div>
                    </motion.div>
                )}

                {/* ─── INTERCEPTED ─── */}
                {phase === 'intercepted' && (
                    <motion.div
                        key="intercepted"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex items-center justify-center px-4"
                    >
                        <div className="glass rounded-3xl p-10 sm:p-14 max-w-lg w-full text-center border-red-500/20">
                            <ShieldAlert className="w-20 h-20 text-red-500 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse" />
                            <h2 className="text-3xl font-black text-red-400 tracking-tight mb-3 uppercase">Eavesdropper Detected</h2>
                            <p className="text-red-200/70 leading-relaxed mb-3 text-sm sm:text-base">
                                The QBER spiked to <strong className="text-red-300">{qber.toFixed(1)}%</strong> — far exceeding the 11% safety threshold.
                                Eve's measurement of photon polarizations collapsed the quantum states, introducing detectable errors.
                            </p>
                            <p className="text-gray-500 text-xs mb-8">Session was automatically aborted to prevent data compromise.</p>
                            <button
                                onClick={() => { setPhase('landing'); setShownPhotons([]); setQber(0); }}
                                className="px-8 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-sm transition-all"
                            >
                                Retry Handshake
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ─── CHAT ─── */}
                {phase === 'chat' && (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1 flex flex-col min-h-0 max-h-screen"
                    >
                        {/* Top bar */}
                        <header className="glass border-b border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-20">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Lock className="w-6 h-6 text-blue-400" />
                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_6px_#4ade80] border border-[#050510]" />
                                </div>
                                <div>
                                    <h1 className="text-sm sm:text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 leading-tight">
                                        Quantum Secure Chat
                                    </h1>
                                    <p className="text-[10px] text-green-400/80 font-medium">BB84 Key Active · End-to-End Encrypted</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-gray-500 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                                    <Activity className="w-3 h-3" /> QBER {qber.toFixed(1)}%
                                </span>
                                <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] sm:text-xs font-bold tracking-wider">
                                    SECURE
                                </div>
                                <button
                                    onClick={() => { setPhase('landing'); setMessages([]); setShownPhotons([]); setQber(0); }}
                                    className="text-gray-500 hover:text-gray-300 transition-colors text-xs font-medium"
                                >
                                    Reset
                                </button>
                            </div>
                        </header>

                        {/* Photon bar under header */}
                        <div className="photon-bar bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-blue-900/20 shrink-0" />

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-5 relative">
                            <AnimatePresence>
                                {messages.map(m => (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                                        className={`flex flex-col ${m.sender === 'system' ? 'items-center' :
                                                m.sender === 'me' ? 'items-end' : 'items-start'
                                            }`}
                                    >
                                        {/* Sender label */}
                                        {m.sender !== 'system' && (
                                            <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 px-1 ${m.sender === 'me' ? 'text-blue-400/60' : 'text-purple-400/60'
                                                }`}>
                                                {m.sender === 'me' ? 'You' : 'QEdge Node'}
                                            </span>
                                        )}

                                        {/* Bubble */}
                                        <div className={`max-w-[85%] sm:max-w-[70%] relative ${m.sender === 'system'
                                                ? 'glass-light rounded-full px-5 py-2.5 text-xs sm:text-sm text-indigo-300 font-medium text-center shadow-[0_0_20px_rgba(99,102,241,0.08)]'
                                                : m.sender === 'me'
                                                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-md px-5 py-3.5 shadow-lg shadow-blue-600/10 text-sm leading-relaxed'
                                                    : 'glass rounded-2xl rounded-tl-md px-5 py-3.5 text-gray-200 text-sm leading-relaxed'
                                            }`}>
                                            {m.text}
                                        </div>

                                        {/* Encryption badge */}
                                        {m.sender !== 'system' && (
                                            <EncryptionBadge stage={encrypting === m.id ? 'encrypting' : 'sent'} />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input */}
                        <form
                            onSubmit={handleSend}
                            className="px-4 sm:px-6 py-4 glass border-t border-white/5 flex gap-3 shrink-0 z-20"
                        >
                            <input
                                type="text"
                                value={inputMsg}
                                onChange={e => setInputMsg(e.target.value)}
                                placeholder="Type a quantum-protected message…"
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/40 transition-all shadow-inner"
                            />
                            <button
                                type="submit"
                                disabled={!inputMsg.trim()}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800/60 disabled:border disabled:border-white/5 disabled:text-gray-600 text-white w-12 h-12 flex items-center justify-center rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 active:scale-[0.93] group"
                            >
                                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
