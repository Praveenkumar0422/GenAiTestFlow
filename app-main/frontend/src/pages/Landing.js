import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Play, Zap, CheckCircle, Clock, Code2, 
    Bot, GitBranch, Shield, BarChart3, ArrowRight,
    Terminal, Sparkles, Layers
} from 'lucide-react';

const Landing = () => {
    const stats = [
        { value: '10x', label: 'Faster Test Creation' },
        { value: '99%', label: 'Uptime SLA' },
        { value: '50K+', label: 'Tests Run Daily' },
        { value: '500+', label: 'Happy Teams' },
    ];

    const features = [
        {
            icon: Bot,
            title: 'AI-Powered Test Generation',
            description: 'Describe your test in plain English and let AI generate Playwright code automatically.',
            span: 'col-span-12 md:col-span-6'
        },
        {
            icon: Code2,
            title: 'Visual Test Builder',
            description: 'Build tests visually with our step-by-step editor. No coding required.',
            span: 'col-span-12 md:col-span-6'
        },
        {
            icon: Play,
            title: 'Real Playwright Execution',
            description: 'Run tests on real browsers with full Playwright support. MCP integration included.',
            span: 'col-span-12 md:col-span-4'
        },
        {
            icon: GitBranch,
            title: 'CI/CD Integration',
            description: 'Connect with GitHub, Jenkins, and your favorite CI tools seamlessly.',
            span: 'col-span-12 md:col-span-4'
        },
        {
            icon: BarChart3,
            title: 'Detailed Analytics',
            description: 'Track test health, execution trends, and identify flaky tests instantly.',
            span: 'col-span-12 md:col-span-4'
        },
    ];

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
        <div className="min-h-screen bg-[#0A0A0A] overflow-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3" data-testid="landing-logo">
                        <div className="w-10 h-10 rounded-lg gradient-button flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold font-display gradient-text">TestFlow</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link 
                            to="/login" 
                            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors font-medium"
                            data-testid="login-link"
                        >
                            Sign In
                        </Link>
                        <Link 
                            to="/register" 
                            className="gradient-button px-6 py-2.5 rounded-lg text-white font-medium"
                            data-testid="get-started-link"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-6 hero-gradient">
                {/* Background Image */}
                <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'url(https://images.pexels.com/photos/18337612/pexels-photo-18337612.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-transparent to-[#0A0A0A]" />

                <motion.div 
                    className="max-w-7xl mx-auto relative z-10"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div className="text-center max-w-4xl mx-auto" variants={itemVariants}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-zinc-400">AI-Powered E2E Testing</span>
                        </div>
                        
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display mb-6 leading-tight">
                            <span className="text-white">Test Automation</span>
                            <br />
                            <span className="gradient-text">Made Simple</span>
                        </h1>
                        
                        <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
                            Build, run, and maintain end-to-end tests with AI assistance. 
                            Visual editor, real Playwright execution, and seamless CI/CD integration.
                        </p>
                        
                        <div className="flex items-center justify-center gap-4 flex-wrap">
                            <Link 
                                to="/register" 
                                className="gradient-button px-8 py-4 rounded-xl text-white font-semibold text-lg flex items-center gap-2"
                                data-testid="hero-cta"
                            >
                                Start Testing Free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link 
                                to="/login" 
                                className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-colors"
                                data-testid="hero-demo"
                            >
                                View Demo
                            </Link>
                        </div>
                    </motion.div>

                    {/* Animated Test Runner Preview */}
                    <motion.div 
                        className="mt-16 max-w-4xl mx-auto"
                        variants={itemVariants}
                    >
                        <div className="test-runner-preview p-6 rounded-2xl">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="ml-4 text-sm text-zinc-500 font-mono">test-runner.ts</span>
                            </div>
                            <div className="space-y-3 font-mono text-sm">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-green-400">✓</span>
                                    <span className="text-zinc-300">Navigate to homepage</span>
                                    <span className="text-zinc-600 ml-auto">120ms</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-green-400">✓</span>
                                    <span className="text-zinc-300">Click login button</span>
                                    <span className="text-zinc-600 ml-auto">45ms</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-green-400">✓</span>
                                    <span className="text-zinc-300">Fill email and password</span>
                                    <span className="text-zinc-600 ml-auto">89ms</span>
                                </div>
                                <div className="flex items-center gap-3 animate-pulse">
                                    <div className="spinner" />
                                    <span className="text-blue-400">●</span>
                                    <span className="text-zinc-300">Verify dashboard loads</span>
                                    <span className="text-zinc-600 ml-auto">...</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-6 border-y border-white/10">
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        className="grid grid-cols-2 md:grid-cols-4 gap-8"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={containerVariants}
                    >
                        {stats.map((stat, i) => (
                            <motion.div 
                                key={i} 
                                className="text-center"
                                variants={itemVariants}
                            >
                                <div className="text-4xl md:text-5xl font-bold font-display gradient-text mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-zinc-500">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                            Everything You Need for <span className="gradient-text">E2E Testing</span>
                        </h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto">
                            From test creation to execution and reporting, TestFlow has you covered.
                        </p>
                    </motion.div>

                    <motion.div 
                        className="bento-grid"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={containerVariants}
                    >
                        {features.map((feature, i) => (
                            <motion.div 
                                key={i}
                                className={`bento-item ${feature.span}`}
                                variants={itemVariants}
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-6">
                                    <feature.icon className="w-6 h-6 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                                <p className="text-zinc-400">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div 
                        className="card p-12 md:p-16 text-center relative overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10" />
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-2xl gradient-button flex items-center justify-center mx-auto mb-8">
                                <Terminal className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                                Ready to Transform Your Testing?
                            </h2>
                            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
                                Join thousands of teams using TestFlow to ship faster and more confidently.
                            </p>
                            <Link 
                                to="/register" 
                                className="gradient-button inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-semibold text-lg"
                                data-testid="cta-button"
                            >
                                Get Started for Free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg gradient-button flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold gradient-text">TestFlow</span>
                    </div>
                    <p className="text-zinc-600 text-sm">© 2025 TestFlow. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
