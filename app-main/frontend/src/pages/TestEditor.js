import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { 
    Play, Save, Plus, Trash2, GripVertical, 
    Navigation, MousePointer, Type, CheckSquare, Clock,
    Sparkles, Code2, Settings, ChevronDown, ArrowLeft
} from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const stepTypes = [
    { type: 'navigate', icon: Navigation, label: 'Navigate', color: 'text-blue-400' },
    { type: 'click', icon: MousePointer, label: 'Click', color: 'text-green-400' },
    { type: 'type', icon: Type, label: 'Type', color: 'text-purple-400' },
    { type: 'assert', icon: CheckSquare, label: 'Assert', color: 'text-amber-400' },
    { type: 'wait', icon: Clock, label: 'Wait', color: 'text-cyan-400' },
];

const TestEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [test, setTest] = useState({
        name: '',
        description: '',
        steps: [],
        tags: [],
        browser: 'chromium'
    });
    const [activeTab, setActiveTab] = useState('visual');
    const [playwrightCode, setPlaywrightCode] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (!isNew) {
            fetchTest();
        }
    }, [id]);

    useEffect(() => {
        generatePlaywrightCode();
    }, [test.steps]);

    const fetchTest = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/tests/${id}`, {
                withCredentials: true
            });
            setTest(response.data);
        } catch (error) {
            toast.error('Failed to load test');
            navigate('/tests');
        } finally {
            setLoading(false);
        }
    };

    const generatePlaywrightCode = () => {
        const lines = [
            `import { test, expect } from '@playwright/test';`,
            ``,
            `test('${test.name || 'Untitled Test'}', async ({ page }) => {`,
        ];

        test.steps.forEach((step, i) => {
            const indent = '  ';
            switch (step.type) {
                case 'navigate':
                    lines.push(`${indent}// Step ${i + 1}: Navigate to ${step.url}`);
                    lines.push(`${indent}await page.goto('${step.url || ''}');`);
                    break;
                case 'click':
                    lines.push(`${indent}// Step ${i + 1}: Click ${step.description || step.selector}`);
                    lines.push(`${indent}await page.click('${step.selector || ''}');`);
                    break;
                case 'type':
                    lines.push(`${indent}// Step ${i + 1}: Type "${step.value}" into ${step.selector}`);
                    lines.push(`${indent}await page.fill('${step.selector || ''}', '${step.value || ''}');`);
                    break;
                case 'assert':
                    lines.push(`${indent}// Step ${i + 1}: Assert ${step.description || step.selector}`);
                    if (step.value) {
                        lines.push(`${indent}await expect(page.locator('${step.selector || ''}')).toContainText('${step.value}');`);
                    } else {
                        lines.push(`${indent}await expect(page.locator('${step.selector || ''}')).toBeVisible();`);
                    }
                    break;
                case 'wait':
                    lines.push(`${indent}// Step ${i + 1}: Wait ${step.description || ''}`);
                    if (step.selector) {
                        lines.push(`${indent}await page.waitForSelector('${step.selector}', { timeout: ${step.timeout || 5000} });`);
                    } else {
                        lines.push(`${indent}await page.waitForTimeout(${step.timeout || 1000});`);
                    }
                    break;
            }
            lines.push('');
        });

        lines.push(`});`);
        setPlaywrightCode(lines.join('\n'));
    };

    const addStep = (type) => {
        const newStep = {
            id: Date.now().toString(),
            type,
            selector: '',
            value: '',
            url: '',
            timeout: 5000,
            description: ''
        };
        setTest(prev => ({
            ...prev,
            steps: [...prev.steps, newStep]
        }));
    };

    const updateStep = (index, field, value) => {
        setTest(prev => {
            const newSteps = [...prev.steps];
            newSteps[index] = { ...newSteps[index], [field]: value };
            return { ...prev, steps: newSteps };
        });
    };

    const removeStep = (index) => {
        setTest(prev => ({
            ...prev,
            steps: prev.steps.filter((_, i) => i !== index)
        }));
    };

    const moveStep = (from, to) => {
        if (to < 0 || to >= test.steps.length) return;
        setTest(prev => {
            const newSteps = [...prev.steps];
            const [removed] = newSteps.splice(from, 1);
            newSteps.splice(to, 0, removed);
            return { ...prev, steps: newSteps };
        });
    };

    const saveTest = async () => {
        if (!test.name.trim()) {
            toast.error('Please enter a test name');
            return;
        }

        setSaving(true);
        try {
            if (isNew) {
                const response = await axios.post(`${API_URL}/api/tests`, test, {
                    withCredentials: true
                });
                toast.success('Test created');
                navigate(`/editor/${response.data.id}`);
            } else {
                await axios.put(`${API_URL}/api/tests/${id}`, test, {
                    withCredentials: true
                });
                toast.success('Test saved');
            }
        } catch (error) {
            toast.error('Failed to save test');
        } finally {
            setSaving(false);
        }
    };

    const runTest = async () => {
        if (isNew) {
            toast.error('Please save the test first');
            return;
        }
        try {
            const response = await axios.post(`${API_URL}/api/tests/${id}/run`, {}, {
                withCredentials: true
            });
            toast.success('Test started');
            navigate(`/results/${response.data.result_id}`);
        } catch (error) {
            toast.error('Failed to start test');
        }
    };

    const generateFromAI = async () => {
        if (!aiPrompt.trim()) {
            toast.error('Please enter a description');
            return;
        }

        setGenerating(true);
        try {
            const response = await axios.post(`${API_URL}/api/ai/generate`, {
                prompt: aiPrompt
            }, { withCredentials: true });

            if (response.data.steps) {
                setTest(prev => ({
                    ...prev,
                    steps: response.data.steps.map((step, i) => ({
                        ...step,
                        id: Date.now().toString() + i
                    }))
                }));
                toast.success('Test generated from AI');
            }
        } catch (error) {
            toast.error('AI generation failed');
        } finally {
            setGenerating(false);
        }
    };

    const getStepIcon = (type) => {
        const stepType = stepTypes.find(s => s.type === type);
        if (!stepType) return null;
        const Icon = stepType.icon;
        return <Icon className={`w-4 h-4 ${stepType.color}`} />;
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
            <div className="h-[calc(100vh-0px)] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0F1117]">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate('/tests')}
                            className="text-zinc-400"
                            data-testid="back-btn"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <div className="w-px h-6 bg-white/10" />
                        <Input
                            value={test.name}
                            onChange={(e) => setTest(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Test name..."
                            className="bg-transparent border-none text-xl font-semibold w-64 focus-visible:ring-0"
                            data-testid="test-name-input"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            className="border-white/10"
                            onClick={saveTest}
                            disabled={saving}
                            data-testid="save-btn"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                        <Button 
                            className="gradient-button"
                            onClick={runTest}
                            disabled={isNew}
                            data-testid="run-btn"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Run Test
                        </Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel - Step Builder */}
                    <div className="w-1/2 border-r border-white/10 flex flex-col">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                            <div className="border-b border-white/10 px-4">
                                <TabsList className="bg-transparent border-none h-12">
                                    <TabsTrigger 
                                        value="visual" 
                                        className="editor-tab data-[state=active]:bg-transparent"
                                        data-testid="visual-tab"
                                    >
                                        Visual Builder
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="ai" 
                                        className="editor-tab data-[state=active]:bg-transparent"
                                        data-testid="ai-tab"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        AI Generate
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="visual" className="flex-1 overflow-auto p-4 m-0">
                                {/* Add Step Buttons */}
                                <div className="flex items-center gap-2 mb-4 flex-wrap">
                                    {stepTypes.map((stepType) => (
                                        <Button
                                            key={stepType.type}
                                            variant="outline"
                                            size="sm"
                                            className="border-white/10 text-zinc-300"
                                            onClick={() => addStep(stepType.type)}
                                            data-testid={`add-${stepType.type}-btn`}
                                        >
                                            <stepType.icon className={`w-4 h-4 mr-2 ${stepType.color}`} />
                                            {stepType.label}
                                        </Button>
                                    ))}
                                </div>

                                {/* Steps List */}
                                <div className="space-y-3">
                                    {test.steps.map((step, index) => (
                                        <motion.div
                                            key={step.id}
                                            className="step-item"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            data-testid={`step-${index}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex items-center gap-2 pt-2">
                                                    <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab" />
                                                    <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs text-zinc-500">
                                                        {index + 1}
                                                    </span>
                                                    {getStepIcon(step.type)}
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium capitalize">{step.type}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="ml-auto text-zinc-500 hover:text-red-400"
                                                            onClick={() => removeStep(index)}
                                                            data-testid={`delete-step-${index}`}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>

                                                    {step.type === 'navigate' && (
                                                        <Input
                                                            placeholder="https://example.com"
                                                            value={step.url}
                                                            onChange={(e) => updateStep(index, 'url', e.target.value)}
                                                            className="bg-[#0A0A0A] border-white/10 text-sm"
                                                            data-testid={`step-${index}-url`}
                                                        />
                                                    )}

                                                    {(step.type === 'click' || step.type === 'type' || step.type === 'assert' || step.type === 'wait') && (
                                                        <Input
                                                            placeholder="CSS selector (e.g., #button, .class)"
                                                            value={step.selector}
                                                            onChange={(e) => updateStep(index, 'selector', e.target.value)}
                                                            className="bg-[#0A0A0A] border-white/10 text-sm font-mono"
                                                            data-testid={`step-${index}-selector`}
                                                        />
                                                    )}

                                                    {(step.type === 'type' || step.type === 'assert') && (
                                                        <Input
                                                            placeholder={step.type === 'type' ? 'Text to type' : 'Expected text (optional)'}
                                                            value={step.value}
                                                            onChange={(e) => updateStep(index, 'value', e.target.value)}
                                                            className="bg-[#0A0A0A] border-white/10 text-sm"
                                                            data-testid={`step-${index}-value`}
                                                        />
                                                    )}

                                                    {step.type === 'wait' && (
                                                        <Input
                                                            type="number"
                                                            placeholder="Timeout (ms)"
                                                            value={step.timeout}
                                                            onChange={(e) => updateStep(index, 'timeout', parseInt(e.target.value) || 5000)}
                                                            className="bg-[#0A0A0A] border-white/10 text-sm w-32"
                                                            data-testid={`step-${index}-timeout`}
                                                        />
                                                    )}

                                                    <Input
                                                        placeholder="Step description (optional)"
                                                        value={step.description}
                                                        onChange={(e) => updateStep(index, 'description', e.target.value)}
                                                        className="bg-[#0A0A0A] border-white/10 text-sm text-zinc-500"
                                                        data-testid={`step-${index}-description`}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {test.steps.length === 0 && (
                                        <div className="text-center py-12 text-zinc-500">
                                            <Plus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                            <p>No steps yet</p>
                                            <p className="text-sm">Click a button above to add your first step</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="ai" className="flex-1 p-4 m-0">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm text-zinc-400 mb-2 block">
                                            Describe your test in natural language
                                        </Label>
                                        <Textarea
                                            placeholder="E.g., Navigate to https://example.com, click the login button, fill in email and password fields, submit the form, and verify the dashboard loads"
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            className="bg-[#0A0A0A] border-white/10 min-h-32"
                                            data-testid="ai-prompt"
                                        />
                                    </div>
                                    <Button
                                        className="gradient-button w-full"
                                        onClick={generateFromAI}
                                        disabled={generating}
                                        data-testid="generate-btn"
                                    >
                                        {generating ? (
                                            <>
                                                <div className="spinner mr-2" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Generate Test Steps
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-xs text-zinc-600 text-center">
                                        Powered by OpenAI • Steps will be added to the visual builder
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right Panel - Code View */}
                    <div className="w-1/2 flex flex-col">
                        <div className="border-b border-white/10 px-4 py-3 flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm font-medium">Playwright Code</span>
                            <span className="text-xs text-zinc-600 ml-auto">Auto-generated</span>
                        </div>
                        <div className="flex-1">
                            <Editor
                                height="100%"
                                defaultLanguage="typescript"
                                value={playwrightCode}
                                theme="vs-dark"
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    padding: { top: 16 }
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Config Sidebar */}
                <div className="border-t border-white/10 p-4 bg-[#0F1117]">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-zinc-400">Browser:</Label>
                            <Select 
                                value={test.browser} 
                                onValueChange={(value) => setTest(prev => ({ ...prev, browser: value }))}
                            >
                                <SelectTrigger className="w-32 bg-[#0A0A0A] border-white/10" data-testid="browser-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#12141D] border-white/10">
                                    <SelectItem value="chromium">Chromium</SelectItem>
                                    <SelectItem value="firefox">Firefox</SelectItem>
                                    <SelectItem value="webkit">WebKit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-zinc-400">Tags:</Label>
                            <Input
                                placeholder="smoke, regression"
                                value={test.tags?.join(', ') || ''}
                                onChange={(e) => setTest(prev => ({ 
                                    ...prev, 
                                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                                }))}
                                className="w-48 bg-[#0A0A0A] border-white/10 text-sm"
                                data-testid="tags-input"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TestEditor;
