import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    LayoutDashboard, 
    FlaskConical, 
    FileCode, 
    BarChart3, 
    Settings, 
    LogOut,
    Play,
    Zap
} from 'lucide-react';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/tests', icon: FlaskConical, label: 'Tests' },
        { path: '/editor', icon: FileCode, label: 'Test Editor' },
        { path: '/results', icon: BarChart3, label: 'Results' },
        { path: '/settings', icon: Settings, label: 'Settings' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            {/* Sidebar */}
            <div className="sidebar">
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <Link to="/dashboard" className="flex items-center gap-3" data-testid="logo-link">
                        <div className="w-10 h-10 rounded-lg gradient-button flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold font-display gradient-text">TestFlow</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || 
                            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item flex items-center gap-3 ${isActive ? 'active' : ''}`}
                                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Quick Actions */}
                <div className="p-4 border-t border-white/10">
                    <Link
                        to="/editor/new"
                        className="gradient-button w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white font-medium"
                        data-testid="new-test-button"
                    >
                        <Play className="w-4 h-4" />
                        New Test
                    </Link>
                </div>

                {/* User Section */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-zinc-400 hover:text-white transition-colors"
                            data-testid="logout-button"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {children}
            </div>
        </div>
    );
};

export default Layout;
