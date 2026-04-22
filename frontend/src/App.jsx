import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './pages/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Discover from './pages/Discover';
import LogVisit from './pages/LogVisit';
import SplitBill from './pages/SplitBill';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AdminDashboard from './pages/AdminDashboard';
import Community from './pages/Community';
import ListDetails from './pages/ListDetails';
import Notifications from './pages/Notifications';
import ESewaSuccess from './pages/ESewaSuccess';
import ESewaFailure from './pages/ESewaFailure';
import ErrorBoundary from './components/common/ErrorBoundary';

const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin' && user.email !== 'admin@cafehop.com') return <Navigate to="/" replace />;
    return children;
};

function AppRoutes() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.email === 'admin@cafehop.com';

    return (
        <Routes>
            {/* Auth Routes - Redirect if already logged in */}
            <Route path="/login" element={user ? <Navigate to={isAdmin ? "/admin" : "/"} /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to={isAdmin ? "/admin" : "/"} /> : <Register />} />

            {/* Main Application Structure */}
            <Route element={<MainLayout />}>
                {/* Public View: Landing */}
                <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <Home />} />
                
                {/* Secure Perspectives */}
                <Route path="discover" element={<PrivateRoute><Discover /></PrivateRoute>} />
                <Route path="community" element={<PrivateRoute><Community /></PrivateRoute>} />
                <Route path="notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
                <Route path="log-visit" element={<PrivateRoute><LogVisit /></PrivateRoute>} />
                <Route path="split-bill" element={<PrivateRoute><SplitBill /></PrivateRoute>} />
                <Route path="esewa-success" element={<PrivateRoute><ESewaSuccess /></PrivateRoute>} />
                <Route path="esewa-failure" element={<PrivateRoute><ESewaFailure /></PrivateRoute>} />
                <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="profile/:userId" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="lists/:listId" element={<PrivateRoute><ListDetails /></PrivateRoute>} />
                <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            </Route>

            {/* Catch-all Redirect to Landing */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <ErrorBoundary>
                        <AppRoutes />
                    </ErrorBoundary>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
