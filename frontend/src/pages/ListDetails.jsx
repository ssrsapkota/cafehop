import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, List, Trash2, Sparkles, MapPin } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import CafeCard from "../components/discovery/CafeCard";
import { cn } from "../utils";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";

export default function ListDetails() {
    const { listId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchListDetails();
    }, [listId]);

    const fetchListDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/lists/me`);
            const targetList = res.data.find(l => l.id === parseInt(listId));
            if (targetList) {
                // fetch cafes for list items
                const listItemsWithCafes = await Promise.all(targetList.items.map(async item => {
                    try {
                        const cafeRes = await api.get(`/cafes/${item.cafe_id}`);
                        return { ...item, cafe: cafeRes.data };
                    } catch (e) {
                        return { ...item, cafe: null };
                    }
                }));
                setList({ ...targetList, items: listItemsWithCafes });
            } else {
                setList(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveItem = async (cafeId) => {
        try {
            await api.delete(`/lists/${listId}/items/${cafeId}`);
            setList(prev => ({ ...prev, items: prev.items.filter(item => item.cafe_id !== cafeId) }));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center py-48 gap-6 selection:bg-accent selection:text-page-bg">
                <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin shadow-glow-accent"></div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] animate-pulse">Synchronizing Collection...</span>
            </div>
        );
    }

    if (!list) {
        return (
            <div className="max-w-4xl mx-auto py-32 px-6 text-center">
                <div className="w-20 h-20 bg-accent/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-accent/10">
                    <List size={32} className="text-accent opacity-50" />
                </div>
                <h2 className="text-4xl font-display font-medium text-text-main mb-6 tracking-tight">Collection <span className="text-accent italic">Not Found.</span></h2>
                <Button onClick={() => navigate(-1)} variant="outline" className="px-12">Return to Profile</Button>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto py-20 px-6 font-body pb-48 selection:bg-accent selection:text-page-bg">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-16">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-3 text-text-muted hover:text-accent font-bold transition-all uppercase text-[10px] tracking-[0.3em] group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-2 transition-transform duration-500" /> Back to Profile
                </button>
            </div>

            {/* List Hero Section */}
            <div className="relative overflow-hidden rounded-[3.5rem] bg-white/10 backdrop-blur-md border border-white/20 p-12 sm:p-20 mb-20 shadow-float group">
                {/* Background Architectures */}
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[150%] bg-accent/10 blur-[120px] -z-10 group-hover:bg-accent/15 transition-all duration-1000" />
                <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
                <div className="absolute inset-0 architectural-grid opacity-10 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-16">
                    <div className="w-32 h-32 sm:w-40 sm:h-40 bg-primary rounded-[2.5rem] flex items-center justify-center shrink-0 shadow-float rotate-6 transform transition-all duration-700 group-hover:rotate-0 group-hover:scale-105 group-hover:bg-accent relative">
                        <List size={56} className="text-page-bg" />
                        <div className="absolute inset-0 bg-white/10 rounded-[2.5rem] backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-8">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-accent-soft text-accent text-[10px] font-bold uppercase tracking-[0.3em] shadow-soft">
                            <Sparkles size={14} /> Curated Protocol
                        </div>
                        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-medium text-text-main tracking-tighter leading-[0.9] mb-4">
                            {list.name}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-text-muted text-[10px] font-bold uppercase tracking-[0.2em]">
                            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-soft">
                                <User size={14} className="text-accent" />
                                {user?.name || "Operative"}
                            </div>
                            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-soft">
                                <MapPin size={14} className="text-accent" />
                                {list.items.length} Nodes
                            </div>
                            <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-soft">
                                <span className={cn(
                                    "w-2.5 h-2.5 rounded-full shadow-glow",
                                    list.is_public ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-accent shadow-accent/50'
                                )}></span>
                                {list.is_public ? 'Global Access' : 'Encrypted Access'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Section */}
            <div className="space-y-12">
                <div className="flex items-center justify-between px-4 border-b border-white/5 pb-8">
                    <h3 className="text-3xl font-display font-medium text-text-main tracking-tight italic">Nodes in this Ledger</h3>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] opacity-60 font-body">{list.items.length || 0} Entries Curated</p>
                </div>

                {list.items.length === 0 ? (
                    <div className="text-center py-48 bg-white/5 backdrop-blur-sm rounded-[3rem] border border-white/10 shadow-inner-soft group hover:border-white/20 transition-all duration-700">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-8 border border-white/10 group-hover:scale-110 transition-transform duration-700">
                            <List size={40} className="text-text-subtle opacity-40" />
                        </div>
                        <h3 className="text-2xl font-display font-medium text-text-main mb-3 tracking-tight">Ledger Empty.</h3>
                        <p className="text-text-muted text-sm font-medium font-body opacity-60 mb-10 italic">"No nodes have been synchronized with this collection yet."</p>
                        <Button variant="primary" className="px-10" onClick={() => navigate('/discover')}>Discover Spaces</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {list.items.map((item, i) => {
                            const cafe = item.cafe;
                            if (!cafe) return null;
                            return (
                                <motion.div 
                                    key={item.id} 
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1, duration: 0.8 }}
                                    className="relative group/item"
                                >
                                    <CafeCard cafe={cafe} />
                                    <button
                                        onClick={() => handleRemoveItem(cafe.id)}
                                        className="absolute top-6 right-6 p-4 bg-primary/90 backdrop-blur-xl text-page-bg rounded-2xl opacity-0 group-hover/item:opacity-100 transition-all duration-500 hover:bg-accent scale-90 group-hover/item:scale-100 z-10 shadow-glow"
                                        title="Sever Node Connection"
                                    >
                                        <Trash2 size={20} className="stroke-[1.5px]" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
