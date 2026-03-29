import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);
        setLoading(false);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link to="/" className="flex items-center justify-center gap-3 mb-10" data-testid="login-logo">
                    <div className="w-12 h-12 rounded-xl gradient-button flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold font-display gradient-text">TestFlow</span>
                </Link>

                {/* Login Card */}
                <div className="card p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
                        <p className="text-zinc-500">Sign in to continue to TestFlow</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400" data-testid="login-error">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-11 bg-[#0F1117] border-white/10 text-white placeholder:text-zinc-600"
                                    required
                                    data-testid="email-input"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-11 bg-[#0F1117] border-white/10 text-white placeholder:text-zinc-600"
                                    required
                                    data-testid="password-input"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full gradient-button py-3 text-white font-semibold"
                            disabled={loading}
                            data-testid="login-submit"
                        >
                            {loading ? (
                                <div className="spinner mx-auto" />
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="text-center mt-6 text-zinc-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium" data-testid="register-link">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
