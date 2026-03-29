import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
    FlaskConical, CheckCircle, XCircle, Clock, 
    TrendingUp, Play, Plus, ArrowRight, Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
    const [stats, setStats] = useState({
        total_tests: 0,
        total_suites: 0,
        total_runs: 0,
        pass_rate: 0,
        passed: 0,
        failed: 0,
        recent_results: [],
        health_data: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/dashboard/stats`, {
                withCredentials: true
            });
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { 
            icon: FlaskConical, 
            label: 'Total Tests', 
            value: stats.total_tests,
            color: 'from-blue-500 to-blue-600'
        },
        { 
            icon: Activity, 
            label: 'Test Runs', 
            value: stats.total_runs,
            color: 'from-purple-500 to-purple-600'
        },
        { 
            icon: CheckCircle, 
            label: 'Passed', 
            value: stats.passed,
            color: 'from-green-500 to-green-600'
        },
        { 
            icon: TrendingUp, 
            label: 'Pass Rate', 
            value: `${stats.pass_rate}%`,
            color: 'from-amber-500 to-amber-600'
        },
    ];

    const formatTime = (isoString) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toLocaleString();
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <Layout>
            <div className="p-8">
                {/* Header */}
                <motion.div 
                    className="flex items-center justify-between mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div>
                        <h1 className="text-3xl font-bold font-display mb-1">Dashboard</h1>
                        <p className="text-zinc-500">Monitor your test automation health</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/tests">
                            <Button variant="outline" className="border-white/10 text-zinc-300 hover:bg-white/5" data-testid="view-tests-btn">
                                View All Tests
                            </Button>
                        </Link>
                        <Link to="/editor/new">
                            <Button className="gradient-button" data-testid="create-test-btn">
                                <Plus className="w-4 h-4 mr-2" />
                                New Test
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {statCards.map((card, i) => (
                        <motion.div 
                            key={i}
                            className="card p-6"
                            variants={itemVariants}
                            data-testid={`stat-card-${card.label.toLowerCase().replace(' ', '-')}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${card.color} bg-opacity-20 flex items-center justify-center`}>
                                    <card.icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold font-display mb-1">
                                {loading ? <div className="spinner" /> : card.value}
                            </div>
                            <div className="text-zinc-500 text-sm">{card.label}</div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Charts and Recent Results */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Test Health Chart */}
                    <motion.div 
                        className="lg:col-span-2 card p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-lg font-semibold mb-6">Test Health Trends</h2>
                        <div className="h-64">
                            {stats.health_data.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.health_data}>
                                        <defs>
                                            <linearGradient id="passedGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{ fill: '#71717A', fontSize: 12 }} 
                                            axisLine={{ stroke: '#27272A' }}
                                        />
                                        <YAxis 
                                            tick={{ fill: '#71717A', fontSize: 12 }} 
                                            axisLine={{ stroke: '#27272A' }}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                background: '#12141D', 
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="passed" 
                                            stroke="#22C55E" 
                                            fill="url(#passedGradient)" 
                                            strokeWidth={2}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="failed" 
                                            stroke="#EF4444" 
                                            fill="url(#failedGradient)" 
                                            strokeWidth={2}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-500">
                                    <div className="text-center">
                                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>No test data yet</p>
                                        <p className="text-sm">Run some tests to see trends</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Recent Results */}
                    <motion.div 
                        className="card p-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">Recent Runs</h2>
                            <Link to="/results" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1" data-testid="view-all-results">
                                View all <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {stats.recent_results.length > 0 ? (
                                stats.recent_results.slice(0, 5).map((result, i) => (
                                    <Link
                                        key={result.id}
                                        to={`/results/${result.id}`}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-[#0F1117] hover:bg-[#12141D] transition-colors"
                                        data-testid={`recent-result-${i}`}
                                    >
                                        {result.status === 'passed' ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : result.status === 'failed' ? (
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <Clock className="w-5 h-5 text-blue-500" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{result.test_name}</p>
                                            <p className="text-xs text-zinc-500">{formatTime(result.started_at)}</p>
                                        </div>
                                        <span className="text-xs text-zinc-500">{result.duration_ms}ms</span>
                                    </Link>
                                ))
                            ) : (
                                <div className="text-center py-8 text-zinc-500">
                                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No recent runs</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div 
                    className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Link to="/editor/new" className="card p-6 hover:border-blue-500/50 transition-colors group" data-testid="quick-action-create">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                                <Plus className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Create New Test</h3>
                                <p className="text-sm text-zinc-500">Build a test visually or with AI</p>
                            </div>
                        </div>
                    </Link>
                    <Link to="/tests" className="card p-6 hover:border-purple-500/50 transition-colors group" data-testid="quick-action-manage">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                                <FlaskConical className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Manage Tests</h3>
                                <p className="text-sm text-zinc-500">View and organize test suites</p>
                            </div>
                        </div>
                    </Link>
                    <Link to="/settings" className="card p-6 hover:border-amber-500/50 transition-colors group" data-testid="quick-action-settings">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                                <Activity className="w-6 h-6 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Configure Settings</h3>
                                <p className="text-sm text-zinc-500">Integrations & notifications</p>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            </div>
        </Layout>
    );
};

export default Dashboard;
