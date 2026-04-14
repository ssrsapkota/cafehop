import React, { useEffect, useState } from "react";
import { Coffee, Search, Star, MessageSquare, Heart, Bookmark, Eye, Edit, Calendar, User, MapPin } from "lucide-react";
import api from "../api/axios";

export default function LogCard({ log }) {
    const [cafe, setCafe] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [cRes, uRes] = await Promise.all([
                    api.get(`/cafes/${log.cafe_id}`),
                    api.get(`/users/${log.user_id}`)
                ]);
                setCafe(cRes.data);
                setUser(uRes.data);
            } catch (err) {
                console.error("Failed to load log details", err);
            }
        };
        fetchDetails();
    }, [log.cafe_id, log.user_id]);


    return (
        <article className="bg-white border border-[var(--color-border)] rounded-3xl overflow-hidden hover:shadow-float transition-all duration-500 group relative">
            {/* AUTHOR & DATE */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-[var(--color-border)]/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-[var(--color-border)] p-0.5 bg-[var(--color-page-bg)]">
                        <div className="w-full h-full rounded-full bg-[var(--color-surface-hover)] overflow-hidden flex items-center justify-center">
                            {user?.avatar ? (
                                <img src={user.avatar} className="w-full h-full object-cover" alt="author" />
                            ) : (
                                <User className="w-5 h-5 opacity-40 text-[var(--color-text-main)] stroke-[1.5]" />
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-[var(--color-text-main)] text-[15px] hover:text-[var(--color-primary)] transition-colors cursor-pointer">{user?.name || "Anonymous Curate"}</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--color-text-subtle)] font-medium">
                            <Calendar className="w-3 h-3 stroke-[2]" /> {new Date(log.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </div>
                <button className="hidden sm:flex text-xs font-semibold uppercase tracking-widest text-[var(--color-accent)] hover:text-[var(--color-primary)] border border-transparent hover:border-[var(--color-accent)] rounded-full px-4 py-1.5 transition-all">
                    Follow
                </button>
            </div>

            <div className="p-6 md:p-8">
                {/* CAFE TARGET */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-widest block mb-2 bg-[var(--color-page-bg)] px-2 py-1 w-fit border border-[var(--color-border)] rounded-full">Subject Space</span>
                        <h3 className="font-display font-medium text-3xl md:text-4xl text-[var(--color-primary)] leading-tight tracking-tight hover:text-[var(--color-accent)] transition-colors cursor-pointer select-all">
                            {cafe?.name || "Refined Roasters"}
                        </h3>
                        <p className="text-sm font-medium text-[var(--color-text-main)] mt-2 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" /> {cafe?.area || "Urban Center"}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 bg-[var(--color-surface-hover)] p-2 rounded-2xl border border-[var(--color-border)]">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 md:w-5 md:h-5 ${i < log.rating ? "text-[var(--color-accent)] fill-[var(--color-accent)]" : "text-[var(--color-border)]"}`} />
                        ))}
                    </div>
                </div>

                {/* REVIEW TEXT */}
                <div className="relative mb-8">
                    <div className="text-[60px] leading-none font-display font-medium text-[var(--color-border)] absolute -top-8 -left-4 opacity-50 select-none">"</div>
                    <p className="font-body text-[var(--color-text-main)] text-base md:text-lg leading-relaxed md:leading-[1.8] font-light z-10 relative">
                        {log.text}
                    </p>
                </div>

                {/* IMAGE SCROLL */}
                {log.photos && log.photos.trim() !== "" && (
                    <div className="flex gap-4 overflow-x-auto pb-6 snap-x custom-scrollbar">
                        {log.photos.split(',').filter(Boolean).map((photo, i) => (
                            <div key={i} className="min-w-[280px] h-[360px] md:min-w-[340px] md:h-[420px] rounded-3xl border border-[var(--color-border)] overflow-hidden shrink-0 snap-center shadow-soft relative group">
                                <img src={photo.startsWith("http") ? photo : `http://localhost:8000${photo}`} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" onError={(e) => { e.target.style.display = 'none'; }} />
                            </div>
                        ))}
                    </div>
                )}

                {/* VIBE TAGS */}
                {Array.isArray(log.vibe_tags) && log.vibe_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8 pt-4">
                        {log.vibe_tags.map((tag, i) => (
                            <span key={i} className="px-4 py-1.5 text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-page-bg)] border border-[var(--color-border)] rounded-full shadow-inner-soft hover:shadow-soft transition-shadow cursor-default">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}


                {/* INTERACTIONS */}
                <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border)]">
                    <div className="flex gap-6">
                        <button className="flex items-center gap-2 group transition-colors hover:text-[#f43f5e] text-[var(--color-text-subtle)] font-medium">
                            <Heart className="w-5 h-5 stroke-[1.5] group-hover:fill-[#f43f5e] transition-all" />
                            <span className="text-sm">24</span>
                        </button>
                        <button className="flex items-center gap-2 group transition-colors hover:text-[var(--color-text-main)] text-[var(--color-text-subtle)] font-medium">
                            <MessageSquare className="w-5 h-5 stroke-[1.5] group-hover:fill-[var(--color-text-main)] transition-all" />
                            <span className="text-sm">Comments</span>
                        </button>
                    </div>
                    <button className="flex items-center gap-2 text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] font-medium transition-colors">
                        <Bookmark className="w-5 h-5 stroke-[1.5]" />
                    </button>
                </div>
            </div>
        </article>
    );
}
