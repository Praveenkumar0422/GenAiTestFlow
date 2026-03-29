import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tests from './pages/Tests';
import TestEditor from './pages/TestEditor';
import Results from './pages/Results';
import Settings from './pages/Settings';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route 
                path="/login" 
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                } 
            />
            <Route 
                path="/register" 
                element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                } 
            />

            {/* Protected Routes */}
            <Route 
                path="/dashboard" 
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/tests" 
                element={
                    <ProtectedRoute>
                        <Tests />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/editor/:id" 
                element={
                    <ProtectedRoute>
                        <TestEditor />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/results" 
                element={
                    <ProtectedRoute>
                        <Results />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/results/:id" 
                element={
                    <ProtectedRoute>
                        <Results />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/settings" 
                element={
                    <ProtectedRoute>
                        <Settings />
                    </ProtectedRoute>
                } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="App">
                    <AppRoutes />
                    <Toaster 
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: '#12141D',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff',
                            },
                        }}
                    />
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
