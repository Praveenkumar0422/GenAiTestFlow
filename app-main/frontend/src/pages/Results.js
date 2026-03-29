import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
    CheckCircle, XCircle, Clock, Calendar, Timer,
    ChevronDown, ChevronRight, Image, AlertTriangle,
    ArrowLeft, RefreshCw
} from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '../components/ui/collapsible';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Results = () => {
    const { id } = useParams();
    const [results, setResults] = useState([]);
    const [selectedResult, setSelectedResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedResults, setExpandedResults] = useState({});

    useEffect(() => {
        if (id) {
            fetchResult(id);
        } else {
            fetchResults();
        }
    }, [id]);

    const fetchResults = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/results`, {
                withCredentials: true
            });
            setResults(response.data);
            if (response.data.length > 0) {
                setSelectedResult(response.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch results:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchResult = async (resultId) => {
        try {
            const response = await axios.get(`${API_URL}/api/results/${resultId}`, {
                withCredentials: true
            });
            setSelectedResult(response.data);
            setExpandedResults({ [resultId]: true });
        } catch (error) {
            console.error('Failed to fetch result:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleResult = (resultId) => {
        setExpandedResults(prev => ({
            ...prev,
            [resultId]: !prev[resultId]
        }));
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        return new Date(isoString).toLocaleString();
    };

    const formatDuration = (ms) => {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'passed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'running':
                return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
            default:
                return <Clock className="w-5 h-5 text-zinc-500" />;
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            passed: 'status-passed',
            failed: 'status-failed',
            running: 'status-running',
            pending: 'status-pending'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status] || statusClasses.pending}`}>
                {status || 'pending'}
            </span>
        );
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-screen">
                    <div className="spinner" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-8">
                {/* Header */}
                <motion.div 
                    className="flex items-center justify-between mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-4">
                        {id && (
                            <Link to="/results">
                                <Button variant="ghost" size="sm" className="text-zinc-400" data-testid="back-btn">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                            </Link>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold font-display mb-1">
                                {id ? 'Test Result' : 'Results'}
                            </h1>
                            <p className="text-zinc-500">
                                {id ? 'Detailed execution results' : 'View test execution history'}
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="outline" 
                        className="border-white/10"
                        onClick={() => id ? fetchResult(id) : fetchResults()}
                        data-testid="refresh-btn"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </motion.div>

                {id && selectedResult ? (
                    /* Single Result View */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        {/* Result Header */}
                        <div className="card p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    {getStatusIcon(selectedResult.status)}
                                    <div>
                                        <h2 className="text-xl font-semibold">{selectedResult.test_name}</h2>
                                        <p className="text-zinc-500">Test ID: {selectedResult.test_id}</p>
                                    </div>
                                </div>
                                {getStatusBadge(selectedResult.status)}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-sm text-zinc-500 mb-1">Started</p>
                                    <p className="font-medium flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-zinc-400" />
                                        {formatDate(selectedResult.started_at)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 mb-1">Duration</p>
                                    <p className="font-medium flex items-center gap-2">
                                        <Timer className="w-4 h-4 text-zinc-400" />
                                        {formatDuration(selectedResult.duration_ms)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 mb-1">Steps Completed</p>
                                    <p className="font-medium">
                                        {selectedResult.steps_completed} / {selectedResult.total_steps}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 mb-1">Pass Rate</p>
                                    <p className="font-medium">
                                        {selectedResult.total_steps > 0 
                                            ? Math.round((selectedResult.steps_completed / selectedResult.total_steps) * 100)
                                            : 0}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {selectedResult.error_message && (
                            <div className="card p-6 border-red-500/30">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-red-400 mb-2">Error Details</h3>
                                        <pre className="text-sm text-zinc-400 bg-[#0A0A0A] p-4 rounded-lg overflow-x-auto font-mono whitespace-pre-wrap">
                                            {selectedResult.error_message}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step Results */}
                        {selectedResult.step_results && selectedResult.step_results.length > 0 && (
                            <div className="card p-6">
                                <h3 className="font-semibold mb-4">Step Results</h3>
                                <div className="space-y-3">
                                    {selectedResult.step_results.map((step, i) => (
                                        <div 
                                            key={i}
                                            className={`flex items-center gap-4 p-4 rounded-lg ${
                                                step.status === 'passed' ? 'bg-green-500/5' : 'bg-red-500/5'
                                            }`}
                                            data-testid={`step-result-${i}`}
                                        >
                                            {step.status === 'passed' ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-500" />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium">Step {step.step + 1}</p>
                                                <p className="text-sm text-zinc-500">{step.description}</p>
                                                {step.error && (
                                                    <p className="text-sm text-red-400 mt-1">{step.error}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    /* Results List */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        {results.length > 0 ? (
                            results.map((result) => (
                                <Collapsible
                                    key={result.id}
                                    open={expandedResults[result.id]}
                                    onOpenChange={() => toggleResult(result.id)}
                                >
                                    <div className="card overflow-hidden">
                                        <CollapsibleTrigger asChild>
                                            <div 
                                                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                                                data-testid={`result-${result.id}`}
                                            >
                                                {expandedResults[result.id] ? (
                                                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                                                )}
                                                {getStatusIcon(result.status)}
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{result.test_name}</h3>
                                                    <p className="text-sm text-zinc-500">
                                                        {formatDate(result.started_at)} • {formatDuration(result.duration_ms)}
                                                    </p>
                                                </div>
                                                {getStatusBadge(result.status)}
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="border-t border-white/10 p-4 bg-[#0A0A0A]">
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-sm text-zinc-500">Steps</p>
                                                        <p className="font-medium">{result.steps_completed} / {result.total_steps}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-zinc-500">Duration</p>
                                                        <p className="font-medium">{formatDuration(result.duration_ms)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-zinc-500">Completed</p>
                                                        <p className="font-medium">{formatDate(result.completed_at)}</p>
                                                    </div>
                                                </div>
                                                {result.error_message && (
                                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                                                        {result.error_message}
                                                    </div>
                                                )}
                                                <div className="mt-4">
                                                    <Link to={`/results/${result.id}`}>
                                                        <Button variant="outline" size="sm" className="border-white/10">
                                                            View Details
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>
                            ))
                        ) : (
                            <div className="text-center py-16">
                                <Clock className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No results yet</h3>
                                <p className="text-zinc-500 mb-6">Run some tests to see results here</p>
                                <Link to="/tests">
                                    <Button className="gradient-button" data-testid="go-to-tests">
                                        Go to Tests
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </Layout>
    );
};

export default Results;
