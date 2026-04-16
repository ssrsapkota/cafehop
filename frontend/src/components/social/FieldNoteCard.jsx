import React, { useState } from 'react';
import Card from '../ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageSquare, MapPin, Star, User, Send, Trash2 } from 'lucide-react';
import { cn } from '../../utils';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function FieldNoteCard({ note }) {
  const { user } = useAuth();
  
  const initialLikes = note.likes || [];
  const initialComments = note.comments || [];
  
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [isLiked, setIsLiked] = useState(initialLikes.some(l => l.user_id === user?.id));
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:8000';
    return `${backendUrl}${avatarPath}`;
  };

  const getSentimentStyles = (sentiment) => {
    switch (sentiment) {
      case 'Productive Spot':
        return 'bg-text-main text-white border-text-main';
      case 'Positive Vibe':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'Creative Sanctuary':
        return 'bg-accent text-white border-accent';
      default:
        return 'bg-surface-hover text-text-muted border-black/5';
    }
  };

  const handleLike = async () => {
    if (!user) return;
    
    // Optimistic update
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    
    if (wasLiked) {
      setLikes(likes.filter(l => l.user_id !== user.id));
      try {
        await api.delete(`/social/like/${note.id}`);
      } catch (err) {
        setIsLiked(wasLiked);
        setLikes([...likes, { user_id: user.id }]); // very naive revert
      }
    } else {
      const optimisticLike = { id: Date.now(), user_id: user.id, created_at: new Date().toISOString() };
      setLikes([...likes, optimisticLike]);
      try {
        const res = await api.post('/social/like', { log_id: note.id });
        setLikes([...likes, res.data]);
      } catch (err) {
        setIsLiked(wasLiked);
        setLikes(likes.filter(l => l.user_id !== user.id));
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    const optimisticComment = {
      id: Date.now(),
      log_id: note.id,
      text: newComment,
      user_id: user.id,
      user: { name: user.name, avatar: user.avatar },
      created_at: new Date().toISOString(),
      isOptimistic: true
    };

    setComments([...comments, optimisticComment]);
    setNewComment("");

    try {
      const res = await api.post('/social/comment', { log_id: note.id, text: optimisticComment.text });
      setComments(prev => prev.map(c => c.id === optimisticComment.id ? res.data : c));
    } catch (err) {
      console.error(err);
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id));
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleCommentDelete = async (commentId) => {
    try {
      await api.delete(`/social/comment/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card variant="base" className="overflow-hidden bg-white border border-black/5 shadow-soft group rounded-[2.5rem] transition-all duration-500 hover:shadow-float">
      <div className="p-8">
        {/* Header: User Info */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={`/profile/${note.user_id}`}>
              <div className="w-12 h-12 rounded-2xl bg-surface-hover flex items-center justify-center border border-black/5 overflow-hidden shadow-inner-soft hover:border-accent/30 transition-colors">
                  {note.user?.avatar ? (
                      <img src={getAvatarUrl(note.user.avatar)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                      <User size={20} className="text-text-muted" />
                  )}
              </div>
            </Link>
            <div>
              <Link to={`/profile/${note.user_id}`} className="text-sm font-bold text-text-main tracking-tight font-body uppercase hover:text-accent transition-colors">
                 {note.user?.name || "Curator"}
              </Link>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] mt-1">
                 {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
              </p>
            </div>
          </div>
        </div>

        {/* Content: Cafe Info */}
        <div className="relative aspect-[16/7] rounded-[2rem] overflow-hidden mb-8 shadow-float group-hover:shadow-glow transition-all duration-700">
           <img src={note.photos || note.cafe?.image_url || "https://placehold.co/800x400?text=Archived+Space"} alt="" className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
              <div className="flex items-center justify-between text-white">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-float">
                        <MapPin size={14} className="text-accent" />
                    </div>
                    <span className="text-sm font-display font-medium tracking-tight uppercase drop-shadow-md">{note.cafe?.name || "Unknown Space"}</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/20 shadow-float rounded-xl text-[10px] font-bold tracking-widest text-white">
                    <Star size={12} className="fill-accent text-accent" />
                    {note.rating?.toFixed(1) || "5.0"}
                 </div>
              </div>
           </div>
        </div>

        <p className="text-base text-text-muted leading-relaxed italic mb-8 font-body pl-6 border-l-2 border-accent/30">
          "{note.text?.replace(/\[Vibe: .*?\]/g, '').trim() || "No detailed review provided."}"
        </p>


        {/* Footer: Interactions */}
        <div className="pt-6 border-t border-black/5 flex items-center gap-6 mb-4">
          <button
            onClick={handleLike}
            className={cn("flex items-center gap-2.5 transition-all duration-300 group/btn", isLiked ? "text-accent" : "text-text-subtle hover:text-accent")}
          >
            <Heart size={16} className={cn("group-hover/btn:scale-110 transition-all", isLiked && "fill-accent")} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{likes.length}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={cn("flex items-center gap-2.5 transition-all duration-300 group/btn", showComments ? "text-text-main" : "text-text-subtle hover:text-text-main")}
          >
            <MessageSquare size={16} className={cn("group-hover/btn:scale-110 transition-all", showComments && "fill-black/10")} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{comments.length}</span>
          </button>
        </div>

        {/* Comments Expansion */}
        <AnimatePresence>
          {showComments && comments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="space-y-4">
                {comments.map(c => (
                  <div key={c.id} className={cn("flex gap-3 text-sm group/comment", c.isOptimistic && "opacity-50")}>
                    <div className="w-8 h-8 rounded-full bg-surface-hover shrink-0 overflow-hidden border border-black/5 flex items-center justify-center">
                      {c.user?.avatar ? <img src={getAvatarUrl(c.user.avatar)} className="w-full h-full object-cover" /> : <User size={14} className="text-text-muted" />}
                    </div>
                    <div className="bg-surface-hover p-3 rounded-2xl rounded-tl-none border border-black/5 flex-1 relative">
                       <div className="flex justify-between items-baseline mb-1">
                          <Link to={`/profile/${c.user_id}`} className="font-bold text-[10px] uppercase tracking-wider text-text-main hover:text-accent transition-colors">{c.user?.name || "User"}</Link>
                          <span className="text-[8px] text-text-subtle uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span>
                       </div>
                       <p className="text-text-muted text-xs leading-relaxed pr-6">{c.text}</p>
                       
                       {/* Delete Button */}
                       {c.user_id === user?.id && (
                         <button 
                           onClick={() => handleCommentDelete(c.id)}
                           className="absolute bottom-2 right-2 text-text-subtle hover:text-red-500 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                           title="Delete comment"
                         >
                           <Trash2 size={12} />
                         </button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Always Visible Comment Input */}
        <form onSubmit={handleCommentSubmit} className="flex gap-3 pt-4 border-t border-black/5 mt-auto">
            <div className="w-8 h-8 rounded-full bg-surface-hover shrink-0 overflow-hidden border border-black/5 flex items-center justify-center">
              {user?.avatar ? <img src={getAvatarUrl(user.avatar)} className="w-full h-full object-cover" /> : <User size={14} className="text-text-muted" />}
            </div>
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Add perspective..." 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="w-full bg-white border border-black/10 rounded-full py-2 pl-4 pr-10 text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors shadow-inner-soft"
              />
              <button 
                type="submit" 
                disabled={!newComment.trim() || isSubmitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-subtle hover:text-accent disabled:opacity-50 transition-colors p-1"
              >
                <Send size={14} />
              </button>
            </div>
        </form>

      </div>
    </Card>
  );
}
