import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
    Search, Filter, Plus, Play, Trash2, Edit, 
    ChevronDown, ChevronRight, FolderOpen, FileCode,
    CheckCircle, XCircle, Clock, MoreVertical
} from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '../components/ui/collapsible';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Tests = () => {
    const [tests, setTests] = useState([]);
    const [suites, setSuites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedSuites, setExpandedSuites] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [testsRes, suitesRes] = await Promise.all([
                axios.get(`${API_URL}/api/tests`, { withCredentials: true }),
                axios.get(`${API_URL}/api/test-suites`, { withCredentials: true })
            ]);
            setTests(testsRes.data);
            setSuites(suitesRes.data);
            // Expand all suites by default
            const expanded = {};
            suitesRes.data.forEach(s => expanded[s.id] = true);
            setExpandedSuites(expanded);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load tests');
        } finally {
            setLoading(false);
        }
    };

    const runTest = async (testId, e) => {
        e.stopPropagation();
        try {
            const response = await axios.post(`${API_URL}/api/tests/${testId}/run`, {}, {
                withCredentials: true
            });
            toast.success('Test started');
            navigate(`/results/${response.data.result_id}`);
        } catch (error) {
            toast.error('Failed to start test');
        }
    };

    const deleteTest = async (testId, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this test?')) return;
        try {
            await axios.delete(`${API_URL}/api/tests/${testId}`, { withCredentials: true });
            toast.success('Test deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete test');
        }
    };

    const toggleSuite = (suiteId) => {
        setExpandedSuites(prev => ({
            ...prev,
            [suiteId]: !prev[suiteId]
        }));
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            passed: 'status-passed',
            failed: 'status-failed',
            running: 'status-running',
            idle: 'status-pending'
        };
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusClasses[status] || statusClasses.idle}`}>
                {status || 'idle'}
            </span>
        );
    };

    const filteredTests = tests.filter(test => {
        const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const unassignedTests = filteredTests.filter(t => !t.suite_id);
    const getTestsForSuite = (suiteId) => filteredTests.filter(t => t.suite_id === suiteId);

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
                        <h1 className="text-3xl font-bold font-display mb-1">Tests</h1>
                        <p className="text-zinc-500">Manage your test suites and individual tests</p>
                    </div>
                    <Link to="/editor/new">
                        <Button className="gradient-button" data-testid="new-test-btn">
                            <Plus className="w-4 h-4 mr-2" />
                            New Test
                        </Button>
                    </Link>
                </motion.div>

                {/* Filters */}
                <motion.div 
                    className="flex items-center gap-4 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <Input
                            placeholder="Search tests..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 bg-[#0F1117] border-white/10 text-white"
                            data-testid="search-input"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="border-white/10 text-zinc-300" data-testid="filter-dropdown">
                                <Filter className="w-4 h-4 mr-2" />
                                {statusFilter === 'all' ? 'All Status' : statusFilter}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#12141D] border-white/10">
                            <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Status</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('passed')}>Passed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('failed')}>Failed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('idle')}>Idle</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="spinner" />
                    </div>
                ) : (
                    <motion.div 
                        className="space-y-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Test Suites */}
                        {suites.map((suite) => {
                            const suiteTests = getTestsForSuite(suite.id);
                            return (
                                <Collapsible 
                                    key={suite.id} 
                                    open={expandedSuites[suite.id]}
                                    onOpenChange={() => toggleSuite(suite.id)}
                                >
                                    <div className="card overflow-hidden">
                                        <CollapsibleTrigger asChild>
                                            <div 
                                                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                                                data-testid={`suite-${suite.id}`}
                                            >
                                                {expandedSuites[suite.id] ? (
                                                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-zinc-400" />
                                                )}
                                                <FolderOpen className="w-5 h-5 text-blue-400" />
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{suite.name}</h3>
                                                    <p className="text-sm text-zinc-500">{suiteTests.length} tests</p>
                                                </div>
                                            </div>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <div className="border-t border-white/10">
                                                {suiteTests.length > 0 ? (
                                                    suiteTests.map((test) => (
                                                        <TestItem 
                                                            key={test.id} 
                                                            test={test} 
                                                            onRun={runTest}
                                                            onDelete={deleteTest}
                                                            getStatusBadge={getStatusBadge}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-zinc-500 text-sm">
                                                        No tests in this suite
                                                    </div>
                                                )}
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>
                            );
                        })}

                        {/* Unassigned Tests */}
                        {unassignedTests.length > 0 && (
                            <div className="card overflow-hidden">
                                <div className="flex items-center gap-4 p-4 border-b border-white/10">
                                    <FileCode className="w-5 h-5 text-zinc-400" />
                                    <div className="flex-1">
                                        <h3 className="font-medium">Unassigned Tests</h3>
                                        <p className="text-sm text-zinc-500">{unassignedTests.length} tests</p>
                                    </div>
                                </div>
                                {unassignedTests.map((test) => (
                                    <TestItem 
                                        key={test.id} 
                                        test={test} 
                                        onRun={runTest}
                                        onDelete={deleteTest}
                                        getStatusBadge={getStatusBadge}
                                    />
                                ))}
                            </div>
                        )}

                        {filteredTests.length === 0 && (
                            <div className="text-center py-16">
                                <FileCode className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No tests found</h3>
                                <p className="text-zinc-500 mb-6">Create your first test to get started</p>
                                <Link to="/editor/new">
                                    <Button className="gradient-button" data-testid="create-first-test">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Test
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

const TestItem = ({ test, onRun, onDelete, getStatusBadge }) => {
    const navigate = useNavigate();
    
    return (
        <div 
            className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer border-t border-white/10 first:border-t-0"
            onClick={() => navigate(`/editor/${test.id}`)}
            data-testid={`test-item-${test.id}`}
        >
            <div className="w-8 h-8 rounded-lg bg-[#0F1117] flex items-center justify-center">
                <FileCode className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{test.name}</h4>
                <p className="text-sm text-zinc-500 truncate">
                    {test.steps?.length || 0} steps • {test.browser || 'chromium'}
                </p>
            </div>
            {getStatusBadge(test.status)}
            <div className="flex items-center gap-2">
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-zinc-400 hover:text-green-400"
                    onClick={(e) => onRun(test.id, e)}
                    data-testid={`run-test-${test.id}`}
                >
                    <Play className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-zinc-400" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#12141D] border-white/10">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/editor/${test.id}`); }}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="text-red-400 focus:text-red-400"
                            onClick={(e) => onDelete(test.id, e)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default Tests;
