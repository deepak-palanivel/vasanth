import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, KeyRound, Activity, Send, Lock, RadioReceiver, Eye, Zap } from 'lucide-react';
import axios from 'axios';

export default function App() {
    const [systemState, setSystemState] = useState('idle'); // idle, negotiating, secure, intercepted
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [keyVisuals, setKeyVisuals] = useState([]);
    const [errorRate, setErrorRate] = useState(0);
    const [demoMode, setDemoMode] = useState(true); // Default to true out-of-the-box for easy viewing

    // Auto-scroll logic for chat
    const messagesEndRef = useRef(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const startHandshake = async (intercept = false) => {
        setSystemState('negotiating');
        setKeyVisuals([]);
        setErrorRate(0);

        // Simulate the stream of photons
        const stream = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            state: Math.random() > 0.5 ? '+' : 'x',
            bit: Math.random() > 0.5 ? '1' : '0'
        }));

        for (let i = 0; i < stream.length; i++) {
            setTimeout(() => {
                setKeyVisuals(prev => [...prev, stream[i]]);
                if (intercept) {
                    // Eve spikes error rate continuously
                    setErrorRate(prev => Math.min(prev + (Math.random() * 5 + 2), 100));
                } else {
                    // Natural negligible noise
                    setErrorRate(Math.random() * 2);
                }
            }, i * 150);
        }

        setTimeout(async () => {
            // 1. Simulation / Demo Mode Logic
            if (demoMode) {
                const finalQber = intercept ? 0.35 + Math.random() * 0.2 : 0.02 + Math.random() * 0.03;
                if (finalQber < 0.11) {
                    setSystemState('secure');
                    setErrorRate(finalQber * 100);
                    setMessages([{ sender: 'system', text: 'Quantum Key Distributed via Simulation. Physical channel is bridged securely.', id: Date.now() }]);
                } else {
                    setSystemState('intercepted');
                    setErrorRate(finalQber * 100);
                }
                return;
            }

            // 2. Real Backend Logic via Axios
            try {
                const res = await axios.post('/api/bb84', { intercept });
                if (res.data.secure) {
                    setSystemState('secure');
                    setMessages([{ sender: 'system', text: 'Quantum Key Distributed via Backend. Connection is securely authenticated.', id: Date.now() }]);
                } else {
                    setSystemState('intercepted');
                    setErrorRate(res.data.error_rate * 100);
                }
            } catch (err) {
                setSystemState('idle');
                setMessages(prev => [...prev, { sender: 'system', text: 'Network Error: Backend API unreachable. Please enable Simulation Mode or boot the local Python engine.', id: Date.now() }]);
            }
        }, stream.length * 150 + 500);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!inputMsg.trim() || systemState !== 'secure') return;

        const newMsg = { sender: 'me', text: inputMsg, id: Date.now() };
        setMessages(prev => [...prev, newMsg]);
        setInputMsg('');

        // 1. Simulation / Demo Mode
        if (demoMode) {
            setTimeout(() => {
                const replies = [
                    "[Simulation] Payload thoroughly verified. Encryption holds.",
                    "[Simulation] Secure trajectory locked. Message received on remote.",
                    "[Simulation] Q-state maintains stable entanglement. Received.",
                    "[Simulation] Backend mocked: Your message is hidden behind physics itself.",
                ];

                let responseText = replies[Math.floor(Math.random() * replies.length)];
                if (newMsg.text.toLowerCase().includes('hello') || newMsg.text.toLowerCase().includes('hi')) {
                    responseText = "[Simulation] QEdge Secure System Online. Go ahead.";
                }

                setMessages(prev => [...prev, { sender: 'bot', text: responseText, id: Date.now() + 1 }]);
            }, 800);
            return;
        }

        // 2. Real Backend Interface
        try {
            const res = await axios.post('/api/chat', { message: inputMsg });
            setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply, id: Date.now() + 1 }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { sender: 'bot', text: "Error: Connection to core lost.", id: Date.now() + 1 }]);
        }
    };

    return (
        <div className="min-h-screen bg-[#050511] text-gray-200 overflow-x-hidden relative flex flex-col font-sans">
            {/* Background radial gradients */}
            <div className="fixed top-[-20%] left-[-10%] w-[70vw] h-[70vh] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[70vw] h-[70vh] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />

            <main className="container mx-auto px-4 sm:px-6 py-6 lg:py-10 relative z-10 flex flex-col flex-1 min-h-0">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8 w-full glass-panel px-6 py-4 rounded-2xl border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <Lock className="text-blue-400 w-8 h-8 pulse-glow" />
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 uppercase drop-shadow-sm">
                            QEdge System
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm font-medium">
                        <button
                            onClick={() => setDemoMode(!demoMode)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 shadow-lg ${demoMode
                                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-indigo-500/20 hover:bg-indigo-500/30'
                                    : 'bg-gray-800/80 border-gray-600 text-gray-400 hover:text-gray-200 hover:bg-gray-700/80'
                                }`}
                        >
                            <Zap className={`w-4 h-4 ${demoMode ? 'text-indigo-400' : 'text-gray-500'}`} />
                            {demoMode ? 'SIMULATION: ON' : 'SIMULATION: OFF'}
                        </button>
                        <span className="flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-white/5">
                            <Activity className="w-4 h-4 text-gray-400" />
                            Error Rate: <span className={errorRate > 15 ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>{errorRate.toFixed(1)}%</span>
                        </span>
                        <div className={`px-4 py-1.5 rounded-full border text-xs sm:text-sm font-bold shadow-lg ${systemState === 'secure' ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-green-500/10' :
                                systemState === 'intercepted' ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-red-500/10' :
                                    systemState === 'negotiating' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-yellow-500/10' :
                                        'bg-gray-800/50 border-gray-700 text-gray-400'
                            }`}>
                            {systemState.toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-1 w-full pb-6 lg:pb-0 h-auto lg:h-[calc(100vh-180px)]">

                    {/* Controls & Visualization Column */}
                    <div className="w-full lg:w-[35%] xl:w-1/3 flex flex-col gap-6 lg:h-full">
                        <div className="glass-panel p-6 sm:p-8 rounded-2xl flex flex-col gap-5 bg-gradient-to-br from-white/[0.03] to-transparent">
                            <div>
                                <h2 className="text-xl font-bold text-white flex gap-2 items-center tracking-tight"><KeyRound className="w-5 h-5 text-blue-400" /> BB84 Core Protocol</h2>
                                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                                    Generate an impenetrable key using quantum superposition laws. If an eavesdropper attempts to measure the stream, the wavefunction collapses immediately, causing a visible error spike that aborts the protocol.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 mt-4">
                                <button
                                    onClick={() => startHandshake(false)}
                                    disabled={systemState === 'negotiating'}
                                    className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide transition-all shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                >
                                    <Shield className="w-5 h-5" /> Establish Secure Engine
                                </button>

                                <button
                                    onClick={() => startHandshake(true)}
                                    disabled={systemState === 'negotiating'}
                                    className="w-full py-4 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-200 font-bold tracking-wide transition-all shadow-lg hover:shadow-red-500/10 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-5 h-5" /> Simulate Intruder (Eve)
                                </button>
                            </div>
                        </div>

                        {/* Quantum Visualizer */}
                        <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col relative overflow-hidden min-h-[300px] lg:min-h-0">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2"><RadioReceiver className="w-4 h-4" /> Live Channel Topology</h3>
                            <div className="flex-1 flex flex-col justify-end space-y-2.5 overflow-hidden relative pb-4">

                                {/* Channel Guide */}
                                <div className="absolute top-1/2 left-0 w-full h-px border-t border-dashed border-blue-500/30 -z-10"></div>
                                <div className="absolute inset-x-0 bottom-0 top-[20%] bg-gradient-to-t from-[#050511]/80 to-transparent z-10 pointer-events-none"></div>

                                <AnimatePresence>
                                    {keyVisuals.map((k, i) => (
                                        <motion.div
                                            key={k.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center justify-between text-xs font-mono z-0 relative"
                                        >
                                            <span className="text-blue-400 font-semibold w-12 text-left">ALICE</span>
                                            <motion.div
                                                initial={{ x: -120 }}
                                                animate={{ x: 120 }}
                                                transition={{ duration: 0.6, ease: "linear" }}
                                                className="relative"
                                            >
                                                <div className={`w-2.5 h-2.5 rounded-full ${k.state === '+' ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-purple-400 shadow-[0_0_12px_#c084fc]'}`} />
                                            </motion.div>
                                            <span className="text-purple-400 font-semibold w-12 text-right">BOB</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Chat Interface Column */}
                    <div className="w-full lg:w-[65%] xl:w-2/3 glass-panel rounded-2xl flex flex-col overflow-hidden relative min-h-[500px] lg:h-full lg:min-h-0 bg-black/40">
                        {systemState === 'idle' && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050511]/90 backdrop-blur-xl">
                                <Shield className="w-20 h-20 text-blue-900/50 mb-6 drop-shadow-2xl" />
                                <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Awaiting Synchronization</h3>
                                <p className="text-gray-400 text-center max-w-sm">Initiate the BB84 handshake sequence on the left to lock keys physically.</p>
                            </div>
                        )}

                        {systemState === 'intercepted' && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/95 backdrop-blur-xl">
                                <ShieldAlert className="w-24 h-24 text-red-500 mb-6 animate-pulse drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]" />
                                <h3 className="text-3xl font-black tracking-tight text-red-400 mb-3 uppercase">Interference Detected</h3>
                                <p className="text-red-200/80 text-center max-w-md text-lg leading-relaxed">
                                    Due to observation attempts by Eve, state fidelity dropped entirely. Automatic failsafe deployed. Session aborted!
                                </p>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent flex flex-col">
                            <AnimatePresence>
                                {messages.map((m) => (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className={`flex w-full ${m.sender === 'system' ? 'justify-center my-6' : m.sender === 'me' ? 'justify-end pl-12' : 'justify-start pr-12'}`}
                                    >
                                        <div className={`px-5 py-3.5 relative ${m.sender === 'system' ? 'bg-indigo-900/20 text-indigo-300 border border-indigo-500/30 text-xs sm:text-sm font-semibold rounded-full max-w-lg text-center backdrop-blur-sm shadow-[0_0_15px_rgba(99,102,241,0.1)]' :
                                                m.sender === 'me' ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md font-medium text-sm sm:text-base leading-relaxed' :
                                                    'bg-gray-800/80 border border-gray-700/50 rounded-2xl rounded-tl-sm text-gray-200 font-medium text-sm sm:text-base backdrop-blur-md leading-relaxed shadow-lg'
                                            }`}>
                                            {m.text}
                                            {m.sender === 'system' && (
                                                <div className="absolute -inset-0.5 rounded-full bg-indigo-500/20 blur-sm -z-10 animate-pulse"></div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-4 sm:p-5 bg-gradient-to-t from-gray-950 to-gray-950/80 border-t border-white/5 flex gap-3 z-10">
                            <input
                                type="text"
                                value={inputMsg}
                                onChange={e => setInputMsg(e.target.value)}
                                placeholder={systemState === 'secure' ? "Type to encrypt via quantum sequence..." : "Locked. Awaiting protocol..."}
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 transition-all font-medium text-gray-100 placeholder:text-gray-600 shadow-inner"
                                disabled={systemState !== 'secure'}
                            />
                            <button
                                type="submit"
                                disabled={systemState !== 'secure' || !inputMsg.trim()}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800/50 disabled:border overflow-hidden disabled:border-white/5 disabled:text-gray-600 text-white w-14 h-auto aspect-square flex items-center justify-center rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 active:scale-[0.95] disabled:active:scale-100 group"
                            >
                                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </form>
                    </div>

                </div>
            </main>
        </div>
    );
}
