import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
    Settings as SettingsIcon, Bell, Key, Plug,
    Save, CheckCircle, ExternalLink
} from 'lucide-react';
import { SiGithub, SiSlack, SiJenkins, SiJira } from 'react-icons/si';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
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

const integrationConfigs = [
    { 
        type: 'github', 
        name: 'GitHub', 
        icon: SiGithub,
        description: 'Connect to GitHub for CI/CD integration',
        fields: [
            { key: 'token', label: 'Personal Access Token', type: 'password' },
            { key: 'repo', label: 'Repository (owner/repo)', type: 'text' }
        ]
    },
    { 
        type: 'slack', 
        name: 'Slack', 
        icon: SiSlack,
        description: 'Send test notifications to Slack channels',
        fields: [
            { key: 'webhook_url', label: 'Webhook URL', type: 'text' },
            { key: 'channel', label: 'Channel', type: 'text' }
        ]
    },
    { 
        type: 'jenkins', 
        name: 'Jenkins', 
        icon: SiJenkins,
        description: 'Trigger tests from Jenkins pipelines',
        fields: [
            { key: 'url', label: 'Jenkins URL', type: 'text' },
            { key: 'api_token', label: 'API Token', type: 'password' },
            { key: 'username', label: 'Username', type: 'text' }
        ]
    },
    { 
        type: 'jira', 
        name: 'Jira', 
        icon: SiJira,
        description: 'Create issues for failed tests in Jira',
        fields: [
            { key: 'url', label: 'Jira URL', type: 'text' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'api_token', label: 'API Token', type: 'password' },
            { key: 'project_key', label: 'Project Key', type: 'text' }
        ]
    }
];

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({
        general: {
            default_browser: 'chromium',
            timeout: 30000,
            retries: 0,
            parallel_tests: 1,
            headless: true
        },
        notifications: {
            email_on_failure: true,
            slack_on_failure: false,
            email_on_success: false
        }
    });
    const [integrations, setIntegrations] = useState([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [settingsRes, integrationsRes] = await Promise.all([
                axios.get(`${API_URL}/api/settings`, { withCredentials: true }),
                axios.get(`${API_URL}/api/integrations`, { withCredentials: true })
            ]);
            setSettings(settingsRes.data);
            setIntegrations(integrationsRes.data);
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            await axios.put(`${API_URL}/api/settings`, settings, {
                withCredentials: true
            });
            toast.success('Settings saved');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const updateIntegration = async (type, enabled, config) => {
        try {
            await axios.put(`${API_URL}/api/integrations/${type}`, {
                type,
                enabled,
                config
            }, { withCredentials: true });
            
            setIntegrations(prev => 
                prev.map(i => i.type === type ? { ...i, enabled, config } : i)
            );
            toast.success(`${type} integration updated`);
        } catch (error) {
            toast.error('Failed to update integration');
        }
    };

    const testIntegration = async (type) => {
        try {
            await axios.post(`${API_URL}/api/integrations/${type}/test`, {}, {
                withCredentials: true
            });
            toast.success('Connection successful');
        } catch (error) {
            toast.error('Connection failed');
        }
    };

    const getIntegration = (type) => {
        return integrations.find(i => i.type === type) || { type, enabled: false, config: {} };
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
                    <div>
                        <h1 className="text-3xl font-bold font-display mb-1">Settings</h1>
                        <p className="text-zinc-500">Configure your TestFlow preferences</p>
                    </div>
                    <Button 
                        className="gradient-button"
                        onClick={saveSettings}
                        disabled={saving}
                        data-testid="save-settings-btn"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </motion.div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-[#12141D] border border-white/10 p-1 mb-8">
                        <TabsTrigger 
                            value="general" 
                            className="data-[state=active]:bg-white/10"
                            data-testid="general-tab"
                        >
                            <SettingsIcon className="w-4 h-4 mr-2" />
                            General
                        </TabsTrigger>
                        <TabsTrigger 
                            value="integrations"
                            className="data-[state=active]:bg-white/10"
                            data-testid="integrations-tab"
                        >
                            <Plug className="w-4 h-4 mr-2" />
                            Integrations
                        </TabsTrigger>
                        <TabsTrigger 
                            value="notifications"
                            className="data-[state=active]:bg-white/10"
                            data-testid="notifications-tab"
                        >
                            <Bell className="w-4 h-4 mr-2" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger 
                            value="api"
                            className="data-[state=active]:bg-white/10"
                            data-testid="api-tab"
                        >
                            <Key className="w-4 h-4 mr-2" />
                            API Keys
                        </TabsTrigger>
                    </TabsList>

                    {/* General Settings */}
                    <TabsContent value="general" className="m-0">
                        <motion.div 
                            className="card p-6 space-y-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <h2 className="text-lg font-semibold mb-4">Test Execution Settings</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Default Browser</Label>
                                    <Select 
                                        value={settings.general?.default_browser || 'chromium'}
                                        onValueChange={(value) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, default_browser: value }
                                        }))}
                                    >
                                        <SelectTrigger className="bg-[#0F1117] border-white/10" data-testid="browser-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#12141D] border-white/10">
                                            <SelectItem value="chromium">Chromium</SelectItem>
                                            <SelectItem value="firefox">Firefox</SelectItem>
                                            <SelectItem value="webkit">WebKit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Default Timeout (ms)</Label>
                                    <Input
                                        type="number"
                                        value={settings.general?.timeout || 30000}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, timeout: parseInt(e.target.value) }
                                        }))}
                                        className="bg-[#0F1117] border-white/10"
                                        data-testid="timeout-input"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Retry Count</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="5"
                                        value={settings.general?.retries || 0}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, retries: parseInt(e.target.value) }
                                        }))}
                                        className="bg-[#0F1117] border-white/10"
                                        data-testid="retries-input"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Parallel Tests</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={settings.general?.parallel_tests || 1}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, parallel_tests: parseInt(e.target.value) }
                                        }))}
                                        className="bg-[#0F1117] border-white/10"
                                        data-testid="parallel-input"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between py-4 border-t border-white/10">
                                <div>
                                    <Label>Headless Mode</Label>
                                    <p className="text-sm text-zinc-500">Run tests without visible browser</p>
                                </div>
                                <Switch
                                    checked={settings.general?.headless !== false}
                                    onCheckedChange={(checked) => setSettings(prev => ({
                                        ...prev,
                                        general: { ...prev.general, headless: checked }
                                    }))}
                                    data-testid="headless-switch"
                                />
                            </div>
                        </motion.div>
                    </TabsContent>

                    {/* Integrations */}
                    <TabsContent value="integrations" className="m-0">
                        <motion.div 
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {integrationConfigs.map((integration) => {
                                const currentIntegration = getIntegration(integration.type);
                                const Icon = integration.icon;
                                
                                return (
                                    <div 
                                        key={integration.type}
                                        className={`integration-card ${currentIntegration.enabled ? 'connected' : ''}`}
                                        data-testid={`integration-${integration.type}`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{integration.name}</h3>
                                                    <p className="text-sm text-zinc-500">{integration.description}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={currentIntegration.enabled}
                                                onCheckedChange={(checked) => 
                                                    updateIntegration(integration.type, checked, currentIntegration.config)
                                                }
                                                data-testid={`${integration.type}-switch`}
                                            />
                                        </div>

                                        {currentIntegration.enabled && (
                                            <div className="space-y-4 pt-4 border-t border-white/10">
                                                {integration.fields.map((field) => (
                                                    <div key={field.key} className="space-y-2">
                                                        <Label className="text-sm">{field.label}</Label>
                                                        <Input
                                                            type={field.type}
                                                            value={currentIntegration.config?.[field.key] || ''}
                                                            onChange={(e) => {
                                                                const newConfig = {
                                                                    ...currentIntegration.config,
                                                                    [field.key]: e.target.value
                                                                };
                                                                updateIntegration(integration.type, true, newConfig);
                                                            }}
                                                            className="bg-[#0A0A0A] border-white/10 text-sm"
                                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                                            data-testid={`${integration.type}-${field.key}`}
                                                        />
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-white/10 w-full"
                                                    onClick={() => testIntegration(integration.type)}
                                                    data-testid={`test-${integration.type}`}
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Test Connection
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </motion.div>
                    </TabsContent>

                    {/* Notifications */}
                    <TabsContent value="notifications" className="m-0">
                        <motion.div 
                            className="card p-6 space-y-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <h2 className="text-lg font-semibold mb-4">Notification Preferences</h2>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-white/10">
                                    <div>
                                        <Label>Email on Test Failure</Label>
                                        <p className="text-sm text-zinc-500">Receive email when a test fails</p>
                                    </div>
                                    <Switch
                                        checked={settings.notifications?.email_on_failure !== false}
                                        onCheckedChange={(checked) => setSettings(prev => ({
                                            ...prev,
                                            notifications: { ...prev.notifications, email_on_failure: checked }
                                        }))}
                                        data-testid="email-failure-switch"
                                    />
                                </div>

                                <div className="flex items-center justify-between py-3 border-b border-white/10">
                                    <div>
                                        <Label>Email on Test Success</Label>
                                        <p className="text-sm text-zinc-500">Receive email when all tests pass</p>
                                    </div>
                                    <Switch
                                        checked={settings.notifications?.email_on_success === true}
                                        onCheckedChange={(checked) => setSettings(prev => ({
                                            ...prev,
                                            notifications: { ...prev.notifications, email_on_success: checked }
                                        }))}
                                        data-testid="email-success-switch"
                                    />
                                </div>

                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <Label>Slack Notifications</Label>
                                        <p className="text-sm text-zinc-500">Send test results to Slack</p>
                                    </div>
                                    <Switch
                                        checked={settings.notifications?.slack_on_failure === true}
                                        onCheckedChange={(checked) => setSettings(prev => ({
                                            ...prev,
                                            notifications: { ...prev.notifications, slack_on_failure: checked }
                                        }))}
                                        data-testid="slack-switch"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </TabsContent>

                    {/* API Keys */}
                    <TabsContent value="api" className="m-0">
                        <motion.div 
                            className="card p-6 space-y-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <h2 className="text-lg font-semibold mb-4">API Configuration</h2>
                            
                            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <div className="flex items-start gap-3">
                                    <Key className="w-5 h-5 text-blue-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-blue-300">
                                            Your API key is securely stored and managed by TestFlow. 
                                            AI features are powered by OpenAI through Emergent's integration.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>TestFlow API Endpoint</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={`${API_URL}/api`}
                                            readOnly
                                            className="bg-[#0A0A0A] border-white/10 font-mono text-sm"
                                        />
                                        <Button 
                                            variant="outline" 
                                            size="icon"
                                            className="border-white/10"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${API_URL}/api`);
                                                toast.success('Copied to clipboard');
                                            }}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
};

export default Settings;
