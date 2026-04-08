import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Search, Bell, Menu, User, Shield } from "lucide-react";
import Button from "../ui/Button";
import { cn } from "../../utils";
import logo from "../../assets/Cafehop_logo.png";

export default function Header({ onMenuClick }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Import api to get the backend URL
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') 
        || 'http://localhost:8000';

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const getPageContext = () => {
        const path = location.pathname;

        if (path === '/')
            return { isHome: true };

        if (path === '/discover')
            return { title: 'Discover Cafes', subtitle: 'Find new places to visit' };

        if (path === '/log-visit')
            return { title: 'Add Visit', subtitle: 'Record your cafe visit' };

        if (path === '/profile')
            return { title: 'My Profile', subtitle: 'Your account details' };

        if (path.startsWith('/lists/'))
            return { title: 'My Lists', subtitle: 'Your saved cafes' };

        if (path.startsWith('/cafe/'))
            return { title: 'Cafe Details', subtitle: 'Information about this cafe' };

        if (path === '/community')
            return { title: 'Community', subtitle: 'See what others are sharing' };

        if (path === '/notifications')
            return { title: 'Notifications', subtitle: 'Updates and alerts' };

        return { title: 'Home', subtitle: 'Welcome to CafeHop' };
    };


    const context = getPageContext();

    return (
        <header className="fixed top-0 left-0 right-0 z-[100] bg-page-bg py-5 border-b border-black/5 shadow-sm">
            <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 flex items-center justify-between">
                {/* Left: Brand or Context Block */}
                <div className="flex items-center gap-4">
                    {user && (
                        <button
                            onClick={onMenuClick}
                            className="md:hidden p-3 text-text-main hover:bg-black/5 rounded-2xl transition-all"
                        >
                            <Menu size={20} />
                        </button>
                    )}

                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                            <div className="w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-display font-bold text-xl tracking-tighter text-text-main pt-1">CafeHop</span>
                        </Link>

                        {user && !context.isHome && (
                            <>
                                <div className="w-px h-10 bg-black/10 mx-1"></div>
                                <div className="flex flex-col justify-center">
                                    <span className="text-[9px] uppercase font-bold tracking-[0.4em] text-accent/60 mb-0.5 leading-none">{context.subtitle}</span>
                                    <span className="text-[22px] font-display font-medium text-text-main tracking-tight leading-none">{context.title}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {!user && (
                        <Link to="/" className="flex items-center gap-3 transition-opacity duration-500 md:opacity-100 group md:hidden">
                            <div className="w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-display font-bold text-xl tracking-tighter text-text-main">CafeHop</span>
                        </Link>
                    )}
                </div>

                {/* Right: Refined Interaction Capsule */}
                <div className="flex items-center gap-3 font-body">
                    {user ? (
                        <div className="flex items-center gap-1 p-1 rounded-full bg-white border border-black/5 shadow-soft">
                            <Link to="/notifications" className="p-3 text-text-muted hover:text-accent rounded-full transition-all relative group">
                                <Bell size={18} className="stroke-[1.5px] group-hover:scale-110 transition-transform" />
                                <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-accent rounded-full border border-white shadow-sm" />
                            </Link>

                            <div className="w-px h-4 bg-black/10 mx-1"></div>

                            <div className="relative group">
                                <Link to="/profile" className="block p-1">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-accent/30 transition-all duration-500 shadow-sm">
                                        {user.avatar ? (
                                            <img 
                                                src={user.avatar.startsWith('http') ? user.avatar : `${backendUrl}${user.avatar}`} 
                                                alt={user.name} 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-surface-hover flex items-center justify-center text-text-muted">
                                                <User size={18} className="stroke-[1.5px]" />
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                {/* Designer Dropdown */}
                                <div className="absolute right-0 top-full pt-4 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                                    <div className="bg-white/80 backdrop-blur-3xl border border-white/40 shadow-float rounded-[2.5rem] overflow-hidden">
                                        <div className="p-8 border-b border-black/5 bg-accent-soft/20">
                                            <p className="font-display font-medium text-text-main text-xl tracking-tight">{user.name}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"></div>
                                                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-accent">Member</p>
                                            </div>
                                        </div>
                                        <div className="p-3 space-y-1">
                                            <Link to="/profile" className="flex items-center justify-between px-5 py-4 text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-primary hover:bg-black/5 rounded-2xl transition-all group/item">
                                                <div className="flex items-center gap-4">
                                                    <User size={16} /> My Profile
                                                </div>
                                                <Menu size={14} className="opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                                            </Link>
                                            {(user?.role === 'admin' || user?.email === 'admin@cafehop.com') && (
                                                <Link to="/admin" className="flex items-center justify-between px-5 py-4 text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-accent hover:bg-black/5 rounded-2xl transition-all group/item">
                                                    <div className="flex items-center gap-4">
                                                        <Shield size={16} /> Admin Dashboard
                                                    </div>
                                                    <Menu size={14} className="opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all" />
                                                </Link>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center justify-between px-5 py-4 text-[10px] uppercase tracking-widest font-bold text-accent hover:bg-accent/5 rounded-2xl transition-all group/logout"
                                            >
                                                <span>Sign Out</span>
                                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center group-hover/logout:bg-accent group-hover/logout:text-white transition-all">
                                                    <Menu size={14} />
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link to="/login">
                                <Button variant="minimal" className="text-[11px] font-bold uppercase tracking-widest">Sign In</Button>
                            </Link>
                            <Link to="/register">
                                <Button variant="primary" size="sm" className="px-6 rounded-full text-[11px] font-bold uppercase tracking-widest">Join Community</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
