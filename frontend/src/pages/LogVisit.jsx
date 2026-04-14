import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Camera, Upload, CheckCircle2, Coffee, Star, MapPin, Feather, Sparkles, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function LogVisit() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedCafeId = searchParams.get('cafe_id');

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cafes, setCafes] = useState([]);
  
  const [formData, setFormData] = useState({
    cafe_id: "",
    cafeName: "",
    vibe: "Focused",
    rating: 5,
    notes: "",
    date: new Date().toISOString().split('T')[0],
    image: null,      // File object for upload
    imagePreview: null // URL for display
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch available cafes to map names to IDs
    const fetchCafes = async () => {
      try {
        const res = await api.get('/cafes', { params: { limit: 500 } });
        const data = res.data;
        setCafes(data);

        // Pre-fill from ?cafe_id= query param
        if (preselectedCafeId) {
          const match = data.find(c => String(c.id) === String(preselectedCafeId));
          if (match) {
            setFormData(prev => ({ ...prev, cafeName: match.name, cafe_id: match.id }));
          }
        }
      } catch (err) {
        console.error("Failed to load cafes", err);
      }
    };
    fetchCafes();
  }, [preselectedCafeId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Find or match the cafe ID
      // If user typed a name that exactly matches a known cafe, use that ID.
      // In a full implementation, the input should be a proper typeahead/select dropdown.
      const matchedCafe = cafes.find(c => c.name.toLowerCase() === formData.cafeName.toLowerCase());
      
      if (!matchedCafe) {
        throw new Error(`Space not found in database: ${formData.cafeName}. Please select an existing space.`);
      }

      let photoUrl = "";
      
      // 2. Upload image if present
      if (formData.image) {
        const uploadData = new FormData();
        uploadData.append('file', formData.image);
        const uploadRes = await api.post('/logs/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        photoUrl = uploadRes.data.url;
      }

      // 3. Submit log
      const logPayload = {
        cafe_id: matchedCafe.id,
        rating: formData.rating,
        text: formData.notes ? `${formData.notes} [Vibe: ${formData.vibe}]` : `[Vibe: ${formData.vibe}]`,
        photos: photoUrl,
        plug_rating: 0
      };

      await api.post('/logs/', logPayload);

      // Success Transition
      setIsSuccess(true);
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || "Failed to save journal entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full py-6 md:py-10 px-6 font-body flex gap-8 flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-5xl mx-auto z-10">
        
        {/* Header Title */}
        <header className="mb-6 text-center md:text-left md:ml-4 flex items-end gap-4">
          <h1 className="text-4xl md:text-5xl font-display font-medium text-text-main tracking-tighter leading-none">
            Log a Visit
          </h1>
          <p className="text-[10px] font-bold text-accent uppercase tracking-[0.4em] mb-1">Cafe Visit Journal</p>
        </header>

        <div className="bg-white border border-black/5 shadow-float rounded-[2rem] md:rounded-[3rem] overflow-hidden relative">
          <div className="absolute inset-0 architectural-grid opacity-10 pointer-events-none" />

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-32 px-6 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center mb-6 shadow-glow">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-4xl font-display font-medium text-text-main tracking-tight mb-4">Journal Entry Saved</h3>
                <p className="text-text-muted text-lg max-w-md mx-auto mb-10 leading-relaxed font-light">Your visit has been saved and added to your profile.</p>
                <Button variant="outline" className="rounded-full px-8 py-4 uppercase text-[10px] tracking-widest font-bold" onClick={() => { setIsSuccess(false); setFormData({ cafe_id: "", cafeName: "", vibe: "Focused", rating: 5, notes: "", date: new Date().toISOString().split('T')[0], image: null, imagePreview: null }); }}>
                  Log Another Space
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative z-10 flex flex-col md:flex-row p-6 md:p-8 gap-8 md:gap-12"
                onSubmit={handleSubmit}
              >
                {/* Left: Poster Image area */}
                <div className="w-full md:w-[32%] flex-shrink-0">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />
                  <div 
                    onClick={handleImageClick}
                    className="aspect-[2/3] w-full rounded-2xl md:rounded-[2rem] border-2 border-dashed border-black/10 bg-surface-hover hover:bg-white hover:border-accent/40 shadow-inner-soft transition-all duration-500 group flex flex-col items-center justify-center gap-4 cursor-pointer overflow-hidden relative"
                  >
                    {formData.imagePreview ? (
                        <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover grayscale brightness-95 group-hover:grayscale-0 transition-all duration-700" />
                    ) : (
                        <>
                            <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent/10 transition-transform duration-500">
                            <Camera size={24} className="text-text-muted group-hover:text-accent transition-colors duration-500" />
                            </div>
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] group-hover:text-text-main transition-colors text-center px-6 leading-relaxed">
                            Select Space<br/>Poster Image
                            </span>
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                        </>
                    )}
                  </div>
                </div>

                {/* Right: Letterboxd-style Input form */}
                <div className="w-full md:w-[68%] flex flex-col pt-1">
                  
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 text-[11px] font-bold uppercase tracking-widest rounded-xl border border-red-200">
                        {error}
                    </div>
                  )}

                  {/* Space Title Input */}
                  <div className="mb-6 relative" ref={dropdownRef}>
                    <label className="text-[10px] uppercase font-bold text-text-muted tracking-[0.3em] pl-1 mb-1 block">I visited...</label>
                    <input 
                      type="text" 
                      placeholder="Name of the space"
                      className="w-full text-3xl md:text-5xl font-display font-medium text-text-main bg-transparent border-b-2 border-black/10 py-1.5 focus:border-accent outline-none placeholder:text-black/10 transition-colors tracking-tight relative z-20"
                      value={formData.cafeName}
                      onChange={(e) => {
                          setFormData({...formData, cafeName: e.target.value, cafe_id: ""});
                          setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      autoFocus={!preselectedCafeId}
                      required
                    />
                    
                    <AnimatePresence>
                      {isDropdownOpen && formData.cafeName && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/5 rounded-2xl shadow-float max-h-60 overflow-y-auto z-[100] custom-scrollbar"
                        >
                          {cafes.filter(c => c.name.toLowerCase().includes(formData.cafeName.toLowerCase())).length > 0 ? (
                            cafes.filter(c => c.name.toLowerCase().includes(formData.cafeName.toLowerCase())).map(cafe => (
                              <button
                                key={cafe.id}
                                type="button"
                                className="w-full text-left px-5 py-3 hover:bg-surface-hover hover:text-accent transition-colors border-b border-black/5 last:border-0 font-display font-medium text-lg text-text-main flex items-center justify-between group"
                                onClick={() => {
                                  setFormData({...formData, cafeName: cafe.name, cafe_id: cafe.id});
                                  setIsDropdownOpen(false);
                                }}
                              >
                                {cafe.name}
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted group-hover:text-accent/60 line-clamp-1 truncate max-w-[150px]">{cafe.area || "Space"}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-5 py-4 text-sm text-text-muted italic">No matching spaces found.</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Date & Rating Row */}
                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 mb-6 pb-6 border-b border-black/5">
                    {/* Date */}
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-text-muted tracking-[0.3em] mb-3 block">Date</label>
                      <input 
                        type="date"
                        className="w-full bg-transparent border-none text-lg font-medium text-text-main outline-none focus:text-accent cursor-pointer tracking-tight"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                      />
                    </div>

                    {/* Rating */}
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-text-muted tracking-[0.3em] mb-3 block">Rating</label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star} 
                            type="button"
                            onClick={() => setFormData({...formData, rating: star})}
                            className={`p-1 transition-all duration-300 hover:scale-125 ${formData.rating >= star ? "text-accent" : "text-black/10 hover:text-accent/40"}`}
                          >
                            <Star size={24} className={formData.rating >= star ? "fill-accent stroke-accent" : "stroke-2"} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Vibe Selection */}
                  <div className="mb-6">
                    <label className="text-[10px] uppercase font-bold text-text-muted tracking-[0.3em] mb-3 block">Atmosphere</label>
                    <div className="flex flex-wrap gap-2">
                      {["Focused", "Vibrant", "Minimal", "Cozy", "Architectural", "Botanical"].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setFormData({...formData, vibe: v})}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 border ${
                            formData.vibe === v 
                              ? "bg-text-main border-text-main text-white shadow-soft scale-105" 
                              : "border-black/10 text-text-muted hover:border-black/30 hover:bg-surface-hover"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Textarea */}
                  <div className="mb-6 flex-grow">
                    <label className="text-[10px] uppercase font-bold text-text-muted tracking-[0.3em] mb-3 block">Review</label>
                    <textarea 
                      rows={3}
                      placeholder="Add a review..."
                      className="w-full text-base font-body bg-transparent border-none p-0 outline-none resize-none placeholder:text-black/20 text-text-main leading-relaxed"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>

                  {/* Actions */}
                  <div className="pt-6 flex items-center justify-between border-t border-black/5 mt-auto">
                    <div className="flex items-center gap-2 text-text-muted text-[10px] uppercase font-bold tracking-[0.2em]">
                      <Sparkles size={12} className="text-accent" />
                      <span>Visiting on {formData.date || "today"}</span>
                    </div>
                    <Button 
                      type="submit"
                      variant="primary"
                      className="px-10 py-4 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold shadow-soft"
                      isLoading={isSubmitting}
                      disabled={!formData.cafeName}
                    >
                      Save Visit
                    </Button>
                  </div>

                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>


    </div>
  );
}
