import React, { useState, useEffect, useRef } from "react";
import { Edit, MapPin, Trophy, Award, List, ChevronRight, User, Settings, Users, ArrowUpRight, Heart, Calendar, Star, Camera, Plus, X, Trash2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils";
import Button from "../components/ui/Button";
import Dialog from "../components/ui/Dialog";

export default function Profile() {
  const { user, refreshUser, setUser } = useAuth();
  const { userId } = useParams();
  const isMe = !userId || String(userId) === String(user?.id);
  const targetId = userId || user?.id;

  const [targetUser, setTargetUser] = useState(isMe ? user : null);
  const [currentUserFollowing, setCurrentUserFollowing] = useState([]);
  const [myLogs, setMyLogs] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [cafesMap, setCafesMap] = useState({});
  const [myLists, setMyLists] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [optimisticListId, setOptimisticListId] = useState(null);

  // Edit profile modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit log state
  const [editingLog, setEditingLog] = useState(null);
  const [editLogText, setEditLogText] = useState("");
  const [editLogRating, setEditLogRating] = useState(5);
  const [savingLog, setSavingLog] = useState(false);
  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState(null);

  // Avatar upload
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!targetId) return;
      setLoading(true);
      try {
        if (!isMe) {
          try {
            const userRes = await api.get(`/users/${targetId}`);
            setTargetUser(userRes.data);
          } catch (e) {
            console.error("Target user not found", e);
            setTargetUser(null);
          }
        } else {
          setTargetUser(user);
        }

        const [logsRes, followersRes, followingRes, usersRes, cafesRes, listsRes, favsRes] = await Promise.all([
          api.get(isMe ? '/logs/me' : `/logs/user/${targetId}`),
          api.get(`/social/user/${targetId}/followers`),
          api.get(`/social/user/${targetId}/following`),
          api.get('/users/'),
          api.get('/cafes/'),
          api.get(isMe ? '/lists/me' : `/lists/user/${targetId}`),
          isMe ? api.get('/favorites/me') : Promise.resolve({ data: [] })
        ]);

        setMyLogs(logsRes.data);
        setFollowers(followersRes.data);
        setFollowing(followingRes.data);
        setMyLists(listsRes.data);
        setFavorites(favsRes.data);

        if (!isMe && user) {
          try {
            const currentFollowingRes = await api.get(`/social/user/${user.id}/following`);
            setCurrentUserFollowing(currentFollowingRes.data);
          } catch(e) { console.error("Could not fetch cur user following", e); }
        }

        const uMap = {};
        usersRes.data.forEach(u => uMap[u.id] = u);
        setUsersMap(uMap);

        const cMap = {};
        cafesRes.data.forEach(c => cMap[c.id] = c);
        setCafesMap(cMap);
      } catch (error) {
        console.error("Failed to fetch profile data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user, targetId, isMe]);

  // ---- CREATE LIST ----
  const handleCreateList = async (e) => {
    e?.preventDefault();
    if (!newListName.trim()) {
       setIsCreatingList(false);
       return;
    }
    const tempId = Date.now();
    setOptimisticListId(tempId);
    const optimisticList = { id: tempId, name: newListName, items: [], is_public: false, isOptimistic: true };
    setMyLists([optimisticList, ...myLists]);
    setIsCreatingList(false);
    setNewListName("");
    try {
      const res = await api.post('/lists/', { name: optimisticList.name, is_public: false });
      setMyLists(currentLists => currentLists.map(list => list.id === tempId ? res.data : list));
      setOptimisticListId(null);
    } catch (err) {
      console.error("Failed to create collection", err);
      setMyLists(currentLists => currentLists.filter(list => list.id !== tempId));
      setOptimisticListId(null);
    }
  };

  // ---- DELETE LOG ----
  const handleDeleteLog = async () => {
    if (!confirmDeleteLogId) return;
    setMyLogs(prev => prev.filter(l => l.id !== confirmDeleteLogId));
    setConfirmDeleteLogId(null);
    try {
      await api.delete(`/logs/${confirmDeleteLogId}`);
    } catch (e) {
      console.error("Failed to delete log", e);
    }
  };

  // ---- EDIT LOG ----
  const openEditLog = (log) => {
    setEditingLog(log);
    setEditLogText(log.text?.replace(/\[Vibe: .*?\]/g, '').trim() || "");
    setEditLogRating(log.rating || 5);
  };

  const handleSaveLog = async () => {
    if (!editingLog) return;
    setSavingLog(true);
    try {
      const res = await api.put(`/logs/${editingLog.id}`, {
        cafe_id: editingLog.cafe_id,
        text: editLogText,
        rating: editLogRating,
        photos: editingLog.photos || "",
        menu_photo: editingLog.menu_photo || "",
        wifi_speed: editingLog.wifi_speed || "",
        plug_rating: editingLog.plug_rating || 0,
        vibe_tags: editingLog.vibe_tags || [],
      });
      setMyLogs(prev => prev.map(l => l.id === editingLog.id ? { ...l, text: res.data.text, rating: res.data.rating } : l));
      setEditingLog(null);
    } catch (e) {
      console.error("Failed to update log", e);
    } finally {
      setSavingLog(false);
    }
  };

  // ---- FOLLOW/UNFOLLOW ----
  const isFollowing = currentUserFollowing.includes(Number(targetId));

  const toggleFollow = async () => {
    if (isFollowing) {
      setCurrentUserFollowing(prev => prev.filter(id => id !== Number(targetId)));
      setFollowers(prev => prev.filter(id => id !== user.id));
      try { await api.delete(`/social/follow/${targetId}`); } catch (e) { console.error("Failed to unfollow", e); }
    } else {
      setCurrentUserFollowing(prev => [...prev, Number(targetId)]);
      setFollowers(prev => [...prev, user.id]);
      try { await api.post('/social/follow', { following_id: Number(targetId) }); } catch (e) { console.error("Failed to follow", e); }
    }
  };

  // ---- EDIT PROFILE ----
  const openEditModal = () => {
    setEditName(targetUser?.name || "");
    setEditBio(targetUser?.bio || "");
    setEditLocation(targetUser?.location || "");
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/me', {
        name: editName || undefined,
        bio: editBio || undefined,
        location: editLocation || undefined,
      });
      setTargetUser(res.data);
      setUser(res.data);
      setShowEditModal(false);
    } catch (e) {
      console.error("Failed to update profile", e);
    } finally {
      setSaving(false);
    }
  };

  // ---- AVATAR UPLOAD ----
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTargetUser(res.data);
      setUser(res.data);
    } catch (e) {
      console.error("Avatar upload failed", e);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const backendUrl = api.defaults.baseURL?.replace('/api', '') || 'http://localhost:8000';

  return (
    <div className="max-w-6xl mx-auto py-12 md:py-20 px-6 font-body flex flex-col gap-16 relative bg-page-bg min-h-screen selection:bg-accent selection:text-white">

      {/* Decorative Blur */}
      <div className="absolute top-0 center w-[60%] h-[20%] bg-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 border-b border-black/5 pb-12">
        <div className="flex flex-col md:flex-row items-center md:items-center gap-8 text-center md:text-left">
          <div className="relative group">
            <div className={cn("w-32 h-32 md:w-40 md:h-40 rounded-full border border-black/10 bg-surface-hover flex items-center justify-center overflow-hidden shadow-soft", uploadingAvatar && "animate-pulse")}>
              {targetUser?.avatar ? (
                <img src={targetUser.avatar.startsWith('http') ? targetUser.avatar : `${backendUrl}${targetUser.avatar}`} alt={targetUser?.name} className="w-full h-full object-cover grayscale brightness-105 group-hover:grayscale-0 transition-all duration-700" />
              ) : (
                <User size={40} className="text-black/20 stroke-[1.5]" />
              )}
            </div>
            {isMe && (
              <>
                <input type="file" ref={avatarInputRef} accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <button onClick={() => avatarInputRef.current?.click()} className="absolute bottom-1 right-1 w-12 h-12 bg-white border border-black/10 shadow-float rounded-full flex items-center justify-center text-text-muted hover:text-accent hover:border-accent/30 transition-all">
                  <Camera size={18} />
                </button>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] mb-2">Curator Identity</p>
              <h1 className="text-4xl md:text-5xl font-display font-medium text-text-main tracking-tight">
                {targetUser?.name || "Curious Soul"} <span className="text-accent italic">.</span>
              </h1>
            </div>
            <p className="text-text-muted text-sm max-w-sm leading-relaxed italic">
              {targetUser?.bio ? `"${targetUser.bio}"` : '"Documenting the ritual of caffeine in high-definition spaces."'}
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-subtle">
                <MapPin size={12} className="text-accent" /> {targetUser?.location || "Kathmandu"}
              </div>
              <div className="w-1 h-1 bg-black/10 rounded-full" />
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-subtle">
                <Calendar size={12} className="text-accent" /> Est. {targetUser?.created_at ? new Date(targetUser.created_at).getFullYear() : "2024"}
              </div>
            </div>
          </div>
        </div>

        {isMe ? (
          <Button variant="outline" onClick={openEditModal} className="hidden md:flex items-center gap-2 rounded-full px-8 py-3 text-[10px] font-bold tracking-[0.2em] uppercase border-black/10 hover:border-accent shadow-sm">
            <Settings size={14} /> Edit Profile
          </Button>
        ) : (
          <Button
            variant={isFollowing ? "outline" : "primary"}
            onClick={toggleFollow}
            className="md:flex items-center gap-2 rounded-full px-8 py-3 text-[10px] font-bold tracking-[0.2em] uppercase shadow-sm"
          >
            {isFollowing ? "Following" : "Follow Space"}
          </Button>
        )}
      </header>

      {/* STATS LEDGER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-black/5 rounded-[2rem] overflow-hidden shadow-inner-soft">
        {[
          { label: "Archived Logs", value: loading ? "-" : myLogs.length },
          { label: "Followers", value: loading ? "-" : followers.length },
          { label: "Following", value: loading ? "-" : following.length },
          { label: "Collections", value: loading ? "-" : myLists.length },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 md:p-8 flex flex-col items-center justify-center text-center transition-all hover:bg-surface-hover">
            <span className="text-3xl md:text-5xl font-display font-medium text-text-main mb-1 tracking-tighter">{stat.value}</span>
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">

        {/* LEFT COLUMN: Logs */}
        <div className="md:col-span-8 space-y-16">

          {/* RECENT ARCHIVES */}
          <section className="space-y-8">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
               <h3 className="text-2xl font-display font-medium text-text-main tracking-tight">Recent Archives</h3>
               {isMe && <Link to="/log-visit" className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent hover:text-text-main transition-colors">Log New +</Link>}
            </div>

            <div className="space-y-6">
              {loading ? (
                <div className="h-40 bg-surface-hover rounded-[2rem] animate-pulse border border-black/5"></div>
              ) : myLogs.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-black/10 rounded-[2rem] bg-surface-hover">
                  <p className="text-text-muted text-lg italic mb-6">"No spatial records located."</p>
                  {isMe && (
                    <Link to="/log-visit">
                      <Button variant="outline" className="rounded-full text-[10px] tracking-widest px-8">Initialize First Log</Button>
                    </Link>
                  )}
                </div>
              ) : (
                myLogs.map((log) => {
                  const cafe = log.cafe || cafesMap[log.cafe_id];
                  const likeCount = log.likes?.length || 0;
                  return (
                    <div key={log.id} className="flex flex-col sm:flex-row gap-6 p-6 rounded-[2rem] border border-black/5 hover:border-accent/20 bg-white shadow-soft hover:shadow-float transition-all duration-500 group relative">
                      {isMe && (
                        <div className="absolute -top-3 -right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-20">
                          <button
                            onClick={() => openEditLog(log)}
                            className="w-8 h-8 rounded-full bg-white border border-accent/30 flex items-center justify-center text-accent hover:bg-accent hover:text-white hover:border-accent shadow-md scale-95 hover:scale-105 transition-all"
                            title="Edit log"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteLogId(log.id)}
                            className="w-8 h-8 rounded-full bg-white border border-red-100 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 shadow-md scale-95 hover:scale-105 transition-all"
                            title="Delete log"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                      <div className="w-full sm:w-32 aspect-square sm:aspect-auto sm:h-32 rounded-[1.5rem] bg-surface-hover overflow-hidden border border-black/5 shrink-0 relative">
                        <img src={cafe?.image_url || "https://placehold.co/200"} alt="" className="w-full h-full object-cover grayscale brightness-95 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1 relative">
                         <div>
                           <div className="flex justify-between items-start mb-2 pr-2">
                             <Link to={cafe ? `/cafe/${cafe.id}` : '#'} className="text-2xl font-display font-medium text-text-main group-hover:text-accent transition-colors tracking-tight">
                               {cafe?.name || "Local Space"}
                             </Link>
                             <div className="flex gap-1 items-center px-2 py-1 bg-surface-hover rounded-lg border border-black/5 shrink-0 ml-4 transition-transform group-hover:scale-105">
                                <Star size={12} className="fill-accent text-accent" />
                                <span className="text-[10px] font-bold">{log.rating}.0</span>
                             </div>
                           </div>
                           <p className="text-base text-text-muted italic line-clamp-2 leading-relaxed">&quot;{log.text?.replace(/\[Vibe: .*?\]/g, '').trim() || "No detailed review provided."}&quot;</p>
                         </div>
                         <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-text-subtle pt-6 mt-auto border-t border-black/5">
                            <span>{new Date(log.created_at).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            <div className="w-1 h-1 bg-black/10 rounded-full" />
                            <span className="flex items-center gap-1"><Heart size={12} /> {likeCount}</span>
                         </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Collections & Network */}
        <div className="md:col-span-4 space-y-12">

          {/* CURATED LISTS */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
               <h3 className="text-xl font-display font-medium text-text-main tracking-tight">Collections</h3>
            </div>

            <div className="space-y-4">
               {isMe && (
                 isCreatingList ? (
                   <form onSubmit={handleCreateList} className="flex items-center border border-black/10 rounded-2xl p-4 bg-surface-hover shadow-inner-soft">
                     <input type="text" autoFocus placeholder="Name..." value={newListName} onChange={(e) => setNewListName(e.target.value)} onBlur={() => !newListName && setIsCreatingList(false)} className="bg-transparent text-sm w-full outline-none font-medium" />
                     <button type="submit" className="text-accent p-1 hover:bg-black/5 rounded-full transition-colors"><ChevronRight size={16} /></button>
                   </form>
                 ) : (
                   <button onClick={() => setIsCreatingList(true)} className="w-full py-5 border border-dashed border-black/15 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all">
                     <Plus size={14} /> New Collection
                   </button>
                 )
               )}

               {myLists.length > 0 && myLists.map(list => (
                 <Link to={list.isOptimistic ? "#" : `/lists/${list.id}`} key={list.id} className={cn("block p-6 border border-black/5 bg-white rounded-2xl shadow-soft hover:shadow-float hover:border-accent/20 transition-all duration-300 group relative", list.isOptimistic && "opacity-50 pointer-events-none grayscale")}>
                   <div className="flex justify-between items-center mb-4">
                     <h4 className="font-display font-medium text-lg text-text-main group-hover:text-accent transition-colors">{list.name}</h4>
                     {list.isOptimistic ? <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" /> : <ChevronRight size={16} className="text-black/20 group-hover:text-accent transition-colors" />}
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-subtle">
                     <div className="flex -space-x-1.5">
                       {[...Array(Math.min(3, list.items?.length || 0))].map((_, i) => (
                           <div key={i} className="w-5 h-5 rounded-full bg-accent/20 border border-white" />
                       ))}
                     </div>
                     <span>{list.items?.length || 0} Spaces</span>
                   </div>
                 </Link>
               ))}
            </div>
          </section>

          {/* NETWORK (Following) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
               <h3 className="text-xl font-display font-medium text-text-main tracking-tight">Network</h3>
            </div>

            <div className="space-y-3">
              {following.length === 0 ? (
                <div className="py-10 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-text-subtle border border-dashed border-black/10 rounded-2xl bg-surface-hover">Empty Network</div>
              ) : (
                following.slice(0, 5).map(id => (
                  <Link to={`/profile/${id}`} key={id} className="flex items-center justify-between gap-4 p-4 border border-transparent hover:border-black/5 hover:bg-white shadow-none hover:shadow-soft rounded-2xl cursor-pointer group transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-hover border border-black/5 overflow-hidden shadow-inner-soft">
                        {usersMap[id]?.avatar ? <img src={usersMap[id].avatar.startsWith('http') ? usersMap[id].avatar : `${backendUrl}${usersMap[id].avatar}`} className="w-full h-full object-cover" /> : <User size={20} className="m-auto mt-2 text-black/20" />}
                        </div>
                        <div>
                        <h5 className="text-sm font-bold font-body text-text-main group-hover:text-accent transition-colors uppercase tracking-tight">{usersMap[id]?.name || "Field Agent"}</h5>
                        <p className="text-[9px] uppercase tracking-[0.2em] text-text-subtle mt-0.5 font-bold">Curator</p>
                        </div>
                    </div>
                    <ChevronRight size={14} className="text-black/20 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </Link>
                ))
              )}
            </div>
            {following.length > 5 && (
              <Button variant="minimal" className="w-full text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 hover:opacity-100">View Full Network</Button>
            )}
          </section>
        </div>

      </div>

      {/* ======== EDIT PROFILE MODAL ======== */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 md:p-10 relative"
            >
              <button onClick={() => setShowEditModal(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-text-muted hover:text-text-main transition-colors">
                <X size={18} />
              </button>

              <p className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] mb-2">Edit Profile</p>
              <h2 className="text-2xl font-display font-medium text-text-main tracking-tight mb-8">Update Your Identity</h2>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2 block">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-5 py-4 border border-black/10 rounded-2xl font-body text-sm focus:border-accent focus:outline-none transition-colors bg-surface-hover"
                    placeholder="Your name..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2 block">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    rows={3}
                    className="w-full px-5 py-4 border border-black/10 rounded-2xl font-body text-sm focus:border-accent focus:outline-none transition-colors bg-surface-hover resize-none"
                    placeholder="Describe your vibe..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2 block">Location</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-5 py-4 border border-black/10 rounded-2xl font-body text-sm focus:border-accent focus:outline-none transition-colors bg-surface-hover"
                    placeholder="Kathmandu, Nepal..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="rounded-full px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase">
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveProfile} disabled={saving} className="rounded-full px-8 py-3 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======== EDIT LOG MODAL ======== */}
      <AnimatePresence>
        {editingLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setEditingLog(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 md:p-10 relative"
            >
              <button onClick={() => setEditingLog(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-text-muted hover:text-text-main transition-colors">
                <X size={18} />
              </button>

              <p className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] mb-2">Edit Visit</p>
              <h2 className="text-2xl font-display font-medium text-text-main tracking-tight mb-6">
                {editingLog.cafe?.name || "Update Log"}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2 block">Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button key={star} type="button" onClick={() => setEditLogRating(star)}
                        className={`p-1 transition-all hover:scale-125 ${editLogRating >= star ? 'text-accent' : 'text-black/10'}`}>
                        <Star size={24} className={editLogRating >= star ? 'fill-accent stroke-accent' : 'stroke-2'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-2 block">Review</label>
                  <textarea
                    rows={4}
                    value={editLogText}
                    onChange={(e) => setEditLogText(e.target.value)}
                    className="w-full px-5 py-4 border border-black/10 rounded-2xl font-body text-sm focus:border-accent focus:outline-none transition-colors bg-surface-hover resize-none"
                    placeholder="Update your review..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <Button variant="outline" onClick={() => setEditingLog(null)} className="rounded-full px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase">Cancel</Button>
                <Button variant="primary" onClick={handleSaveLog} disabled={savingLog} className="rounded-full px-8 py-3 text-[10px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                  {savingLog ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
                  {savingLog ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======== DELETE LOG CONFIRMATION DIALOG ======== */}
      <Dialog
        isOpen={!!confirmDeleteLogId}
        onClose={() => setConfirmDeleteLogId(null)}
        onConfirm={handleDeleteLog}
        title="Remove this log?"
        message="This visit entry will be permanently removed from your profile. This cannot be undone."
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
