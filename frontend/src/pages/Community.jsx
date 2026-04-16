import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, Globe, Plus, Search } from "lucide-react";
import FieldNoteCard from "../components/social/FieldNoteCard";
import NotificationToast from "../components/ui/NotificationToast";
import Button from "../components/ui/Button";
import { cn } from "../utils";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Community() {
  const { user } = useAuth();
  const [allNotes, setAllNotes] = useState([]);
  const [feedNotes, setFeedNotes] = useState([]);
  const [following, setFollowing] = useState([]);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allRes, feedRes, followingRes, followersRes] = await Promise.all([
          api.get('/logs/'),
          api.get('/social/feed').catch(() => ({ data: [] })),
          user ? api.get(`/social/user/${user.id}/following`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          user ? api.get(`/social/user/${user.id}/followers`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);
        setAllNotes(allRes.data);
        setFeedNotes(feedRes.data);

        const followingIds = followingRes.data;   // array of user IDs I follow
        const followerIds = followersRes.data;     // array of user IDs who follow me
        setFollowing(followingIds);

        // Friends = mutual: I follow them AND they follow me
        const mutualIds = followingIds.filter(id => followerIds.includes(id));
        setMutualFriends(mutualIds);
      } catch (err) {
        console.error("Failed to load community feed", err);
        setError("Unable to load posts. Check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);


  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Derive displayed notes based on active tab
  const displayedNotes = React.useMemo(() => {
    if (activeTab === "Feed") return feedNotes;
    if (activeTab === "Friends") {
      return allNotes.filter(n => mutualFriends.includes(n.user_id));
    }
    return allNotes;
  }, [activeTab, allNotes, feedNotes, following, mutualFriends]);

  const TABS = [
    { id: "All",     label: "All Notes",  icon: Globe },
    { id: "Feed",    label: "Following",  icon: UserCheck },
    { id: "Friends", label: `Friends${mutualFriends.length > 0 ? ` (${mutualFriends.length})` : ""}`, icon: Users },
  ];

  return (
    <div className="max-w-2xl mx-auto py-12 md:py-20 px-6 font-body flex flex-col gap-12 relative">

      {/* Decorative Blur */}
      <div className="absolute top-0 center w-[60%] h-[30%] bg-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <header className="text-center space-y-6 flex flex-col items-center mb-4">
        <p className="text-accent text-[10px] uppercase font-bold tracking-[0.4em]">Community</p>
        <h1 className="text-5xl md:text-6xl font-display font-medium text-text-main leading-none tracking-tighter">
          Community Journal.
        </h1>
        <p className="text-base text-text-muted leading-relaxed max-w-md font-light">
          Visit logs from people you follow and the wider community.
        </p>

        {/* Tab Bar */}
        <nav className="flex items-center justify-center gap-2 pt-4 bg-surface-hover p-1.5 rounded-full border border-black/5 shadow-inner">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] uppercase font-bold tracking-[0.2em] transition-all duration-300",
                activeTab === id
                  ? "bg-white text-text-main shadow-soft border border-black/5"
                  : "text-text-muted hover:text-text-main"
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Feed */}
      <div className="space-y-16">
        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white border border-black/5 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : displayedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-black/5 rounded-[2.5rem] shadow-sm">
            <div className="w-16 h-16 bg-surface-hover rounded-2xl flex items-center justify-center mb-6">
              <Search size={22} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-display font-medium text-text-main mb-2">Nothing here yet</h3>
            <p className="text-sm text-text-muted mb-6 leading-relaxed text-center max-w-xs">
              {activeTab === "Feed"
                ? "Follow some people from Discover to see their posts here."
                : activeTab === "Friends"
                ? "No mutual friends yet. Follow someone back who follows you to become friends."
                : "No posts yet. Be the first to log a visit."}
            </p>
            <Button variant="outline" className="rounded-full text-[10px] font-bold uppercase tracking-widest px-8" onClick={() => setActiveTab("All")}>
              View All Notes
            </Button>
          </div>
        ) : (
          displayedNotes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <FieldNoteCard note={note} />
            </motion.div>
          ))
        )}

        <div className="pt-20 pb-10 flex flex-col items-center gap-6">
          <div className="w-px h-16 bg-gradient-to-b from-accent to-transparent" />
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-[0.4em] opacity-50">End of Feed</p>
        </div>
      </div>

      <NotificationToast notifications={notifications} onRemove={removeNotification} />

      {/* Floating Log Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="fixed bottom-8 right-8 z-[100]"
      >
        <button
          onClick={() => window.location.href = '/log-visit'}
          className="flex items-center gap-3 bg-text-main text-white px-6 py-4 rounded-full shadow-float hover:bg-black hover:scale-105 transition-all duration-300 group"
        >
          <Plus size={18} className="transition-transform group-hover:rotate-90 duration-500" />
          <span className="text-[11px] font-bold uppercase tracking-widest hidden md:block pr-2">Log a Visit</span>
        </button>
      </motion.div>
    </div>
  );
}
