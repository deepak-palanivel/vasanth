import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, KeyRound, Activity, Send, Lock, RadioReceiver, Eye } from 'lucide-react';
import axios from 'axios';

export default function App() {
    const [systemState, setSystemState] = useState('idle'); // idle, negotiating, secure, intercepted
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [keyVisuals, setKeyVisuals] = useState([]);
    const [errorRate, setErrorRate] = useState(0);

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
                    setErrorRate(prev => Math.min(prev + (Math.random() * 5 + 2), 100)); // Eve spikes error rate
                } else {
                    setErrorRate(Math.random() * 2); // Natural noise
                }
            }, i * 150);
        }

        setTimeout(async () => {
            try {
                const res = await axios.post('/api/bb84', { intercept });
                if (res.data.secure) {
                    setSystemState('secure');
                    setMessages([{ sender: 'system', text: 'Quantum Key Distributed. Connection is physically secure.', id: Date.now() }]);
                } else {
                    setSystemState('intercepted');
                    setErrorRate(res.data.error_rate * 100);
                }
            } catch (err) {
                setSystemState('idle');
            }
        }, stream.length * 150 + 500);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!inputMsg.trim() || systemState !== 'secure') return;

        const newMsg = { sender: 'me', text: inputMsg, id: Date.now() };
        setMessages(prev => [...prev, newMsg]);
        setInputMsg('');

        try {
            const res = await axios.post('/api/chat', { message: inputMsg });
            setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply, id: Date.now() + 1 }]);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-[#050511] text-gray-200 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none" />

            <main className="max-w-6xl mx-auto px-6 py-12 relative z-10 flex flex-col h-screen">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <Lock className="text-blue-400 w-8 h-8 pulse-glow" />
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            QEdge Secure
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-medium">
                        <span className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-400" />
                            Error Rate: <span className={errorRate > 15 ? 'text-red-400' : 'text-green-400'}>{errorRate.toFixed(1)}%</span>
                        </span>
                        <div className={`px-4 py-1.5 rounded-full border ${systemState === 'secure' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                                systemState === 'intercepted' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                    systemState === 'negotiating' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                                        'bg-gray-800/50 border-gray-700 text-gray-400'
                            }`}>
                            {systemState.toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">

                    {/* Controls & Visualization */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                            <h2 className="text-lg font-semibold text-white flex gap-2 items-center"><KeyRound className="w-5 h-5" /> BB84 Protocol</h2>
                            <p className="text-sm text-gray-400">
                                Establish a key using quantum superposition. Particles measured by eavesdroppers will collapse visually.
                            </p>

                            <button
                                onClick={() => startHandshake(false)}
                                disabled={systemState === 'negotiating'}
                                className="mt-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
                            >
                                Establish Secure Channel
                            </button>

                            <button
                                onClick={() => startHandshake(true)}
                                disabled={systemState === 'negotiating'}
                                className="w-full py-3 rounded-xl bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 text-red-200 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Eye className="w-4 h-4" /> Simulate Eavesdropper
                            </button>
                        </div>

                        {/* Quantum Visualizer */}
                        <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col relative overflow-hidden">
                            <h3 className="text-sm font-medium text-gray-400 mb-4">Channel Monitor</h3>
                            <div className="flex-1 flex flex-col justify-end space-y-2 overflow-hidden relative">

                                {/* Horizontal line */}
                                <div className="absolute top-1/2 left-0 w-full h-px bg-blue-500/20 z-0"></div>

                                <AnimatePresence>
                                    {keyVisuals.map((k, i) => (
                                        <motion.div
                                            key={k.id}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className="flex items-center justify-between text-xs font-mono z-10"
                                        >
                                            <span className="text-blue-400">Alice</span>
                                            <motion.div
                                                initial={{ x: -100 }}
                                                animate={{ x: 100 }}
                                                transition={{ duration: 0.5, ease: "linear" }}
                                                className={`w-2 h-2 rounded-full ${k.state === '+' ? 'bg-cyan-400' : 'bg-purple-400'} shadow-[0_0_8px_currentColor]`}
                                            />
                                            <span className="text-purple-400">Bob</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Chat Interface */}
                    <div className="lg:col-span-2 glass-panel rounded-2xl flex flex-col overflow-hidden relative">
                        {systemState === 'idle' && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050511]/80 backdrop-blur-sm">
                                <Shield className="w-16 h-16 text-gray-600 mb-4" />
                                <h3 className="text-xl font-medium text-gray-300">Channel Offline</h3>
                                <p className="text-gray-500 mt-2">Establish a quantum key to begin securely.</p>
                            </div>
                        )}

                        {systemState === 'intercepted' && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/80 backdrop-blur-md">
                                <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                                <h3 className="text-2xl font-bold text-red-400">Wavefunction Collapsed</h3>
                                <p className="text-red-200/70 mt-2 max-w-sm text-center">Eavesdropper detected! The error rate spiked due to observation. Session aborted instantly to protect data.</p>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <AnimatePresence>
                                {messages.map((m) => (
                                    <motion.div
                                        key={m.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${m.sender === 'system' ? 'justify-center' : m.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${m.sender === 'system' ? 'bg-green-900/20 text-green-400 border border-green-500/20 text-sm font-medium' :
                                                m.sender === 'me' ? 'bg-blue-600 text-white rounded-br-sm' :
                                                    'bg-gray-800/80 border border-gray-700 rounded-bl-sm text-gray-200'
                                            }`}>
                                            {m.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <form onSubmit={sendMessage} className="p-4 bg-gray-900/50 border-t border-gray-800 flex gap-3 pb-8 lg:pb-4">
                            <input
                                type="text"
                                value={inputMsg}
                                onChange={e => setInputMsg(e.target.value)}
                                placeholder="Encrypt message with quantum key..."
                                className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all font-medium text-gray-200"
                                disabled={systemState !== 'secure'}
                            />
                            <button
                                type="submit"
                                disabled={systemState !== 'secure' || !inputMsg.trim()}
                                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white w-12 h-12 flex items-center justify-center rounded-xl transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>

                </div>
            </main>
        </div>
    );
}
