import React, { useState, useEffect } from "react";
import { Bell, Heart, MessageCircle, UserPlus, Check, Star, Sparkles, BellOff, Receipt, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

// Helper to format timestamps to '1h', '2d', etc.
const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
    return `${backendUrl}${avatarPath}`;
};

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/me');
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error("Failed to mark notifications as read", err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case "like": return <Heart size={16} className="text-accent fill-accent" />;
            case "comment": return <MessageCircle size={16} className="text-accent" />;
            case "follow": return <UserPlus size={16} className="text-primary" />;
            case "system": return <Star size={16} className="text-accent fill-accent" />;
            case "bill": return <Receipt size={16} className="text-orange-500" />;
            case "payment": return <CreditCard size={16} className="text-green-500" />;
            default: return <Bell size={16} className="text-text-muted" />;
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-12 px-6 font-body min-h-screen pb-32">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-widest mb-2">
                        <Sparkles size={14} /> Activity Feed
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-display font-medium text-text-main tracking-tight">
                        Notifications
                    </h1>
                    <p className="text-text-muted mt-2 text-sm font-medium font-body">Stay updated with your socialite circle</p>
                </div>

                {notifications.length > 0 && (
                    <Button
                        onClick={markAllAsRead}
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <Check size={14} /> Mark all read
                    </Button>
                )}
            </div>

            {/* List Section */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-[2.5rem] overflow-hidden shadow-float">
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Syncing updates...</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center text-center px-10">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <BellOff size={32} className="text-text-muted/30" />
                        </div>
                        <h3 className="text-xl font-display font-medium text-text-main mb-2">Inbox is empty</h3>
                        <p className="text-text-muted text-sm max-w-xs font-medium font-body">
                            No active alerts at the moment. Explore the community to get noticed!
                        </p>
                        <Link to="/community" className="mt-8">
                            <Button variant="primary" size="sm">
                                Explore Community
                            </Button>
                        </Link>
                    </div>
                ) : (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    const grouped = notifications.reduce((acc, notif) => {
                        const notifDate = new Date(notif.created_at);
                        notifDate.setHours(0, 0, 0, 0);

                        if (notifDate.getTime() === today.getTime()) {
                            acc.Today.push(notif);
                        } else if (notifDate.getTime() === yesterday.getTime()) {
                            acc.Yesterday.push(notif);
                        } else {
                            acc.Earlier.push(notif);
                        }
                        return acc;
                    }, { Today: [], Yesterday: [], Earlier: [] });

                    return (
                        <div className="p-6 md:p-8 space-y-12">
                            {Object.entries(grouped).filter(([_, items]) => items.length > 0).map(([groupName, items]) => (
                                <div key={groupName}>
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-text-muted mb-6 pl-4 flex items-center gap-3">
                                        <Sparkles size={12} className={groupName === 'Today' ? 'text-accent' : 'text-text-muted opacity-50'} />
                                        {groupName}
                                    </h3>
                                    <div className="space-y-4">
                                        {items.map(notif => {
                                            const actorName = notif.actor?.name || "System";
                                            const actorAvatar = notif.actor?.avatar;

                                            return (
                                                <Link
                                                    to={
                                                        notif.type === 'bill' ? '/split-bill' 
                                                        : notif.type === 'payment' ? '/split-bill#expenses' 
                                                        : `/profile/${notif.actor?.id}`
                                                    }
                                                    key={notif.id}
                                                    onClick={!notif.is_read ? markAllAsRead : undefined}
                                                    className={`group block p-6 flex items-start gap-5 transition-all duration-500 hover:bg-white hover:shadow-float relative overflow-hidden rounded-[2rem] border ${!notif.is_read ? 'bg-accent/5 border-accent/20' : 'bg-surface-hover/30 border-black/5 hover:border-black/10'}`}
                                                >
                                                    {/* Shimmer Effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

                                                    <div className="relative shrink-0 z-10 transition-transform group-hover:scale-105 duration-500">
                                                        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-black/5 bg-white shadow-soft p-1">
                                                            {actorAvatar ? (
                                                                <img src={getAvatarUrl(actorAvatar)} className="w-full h-full object-cover rounded-xl" alt={actorName} />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-surface-hover rounded-xl text-text-muted">
                                                                    <Bell size={20} className="stroke-[1.5px]" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-white border border-black/5 flex items-center justify-center shadow-float ring-2 ring-page-bg">
                                                            {getIcon(notif.type)}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0 z-10 py-1">
                                                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 mb-2">
                                                            <p className="text-sm text-text-main leading-relaxed font-body pr-4">
                                                                <span className="font-bold text-primary group-hover:text-accent transition-colors uppercase tracking-tight">{actorName}</span>
                                                                <span className="text-text-muted ml-2">{notif.message}</span>
                                                            </p>
                                                            
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                {!notif.is_read && (
                                                                    <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--color-accent),0.5)] animate-pulse"></div>
                                                                )}
                                                                <span className="text-[10px] font-bold text-text-subtle uppercase tracking-widest">{formatTimeAgo(notif.created_at)}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Action Hint on Hover */}
                                                        <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-subtle group-hover:text-accent transition-colors">
                                                            {notif.type === 'follow' ? 'View Profile ->' : notif.type === 'bill' ? 'View Split ->' : notif.type === 'payment' ? 'View Payment ->' : 'View Post ->'}
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>

            {/* Footer Tip */}
            {notifications.length > 0 && (
                <p className="text-center mt-12 text-[10px] font-bold text-text-subtle uppercase tracking-[0.2em] font-body opacity-50">
                    End of line • Refreshed just now
                </p>
            )}
        </div>
    );
}
