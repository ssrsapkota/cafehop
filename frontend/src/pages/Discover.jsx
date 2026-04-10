import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Map as MapIcon, Layers, Navigation2, Star, Compass, X,
  Bookmark, Check, Plus, PlusSquare, List, SlidersHorizontal,
  ArrowUpDown, LayoutGrid,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import api from "../api/axios";
import Button from "../components/ui/Button";
import CafeCard, { CafeCardSkeleton } from "../components/discovery/CafeCard";
import SearchBar from "../components/discovery/SearchBar";

// ─── Fix Leaflet default icons ────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ─── Kathmandu center ─────────────────────────────────────────────────────────
const KTM = [27.7069, 85.3143];
const DEFAULT_ZOOM = 15;

// ─── Google Maps directions helper ────────────────────────────────────────────
function openDirections(userLocation, cafe) {
  if (!cafe?.lat || !cafe?.lng) return;
  const dest   = `${cafe.lat},${cafe.lng}`;
  const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : "";
  const url    = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=walking`
    : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
  window.open(url, "_blank", "noopener,noreferrer");
}

// ─── Map fly-to updater ────────────────────────────────────────────────────────
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] != null && center[1] != null) {
      map.flyTo(center, zoom ?? DEFAULT_ZOOM, { animate: true, duration: 1.4 });
    }
  }, [center, zoom, map]);
  return null;
}

// ─── Fit map to markers ───────────────────────────────────────────────────────
function FitBounds({ cafes }) {
  const map = useMap();
  useEffect(() => {
    if (!cafes || cafes.length === 0) return;
    const valid = cafes.filter(c => c.lat && c.lng);
    if (valid.length === 0) return;
    try {
      const bounds = L.latLngBounds(valid.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
    } catch (_) {}
  }, [cafes, map]);
  return null;
}

// ─── Save-to-Collection Modal ─────────────────────────────────────────────────
function SaveToListModal({ cafe, onClose }) {
  const [lists, setLists]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(null);
  const [saved, setSaved]           = useState({});
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating]     = useState(false);
  const [showNewInput, setShowNewInput] = useState(false);

  useEffect(() => {
    api.get("/lists/me")
      .then(r => setLists(r.data))
      .catch(() => setLists([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (listId) => {
    setSaving(listId);
    try {
      await api.post(`/lists/${listId}/items`, { cafe_id: cafe.id });
      setSaved(p => ({ ...p, [listId]: true }));
    } catch {
      setSaved(p => ({ ...p, [listId]: true }));
    } finally { setSaving(null); }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/lists/", { name: newListName.trim(), is_public: false });
      setLists(p => [...p, res.data]);
      setNewListName("");
      setShowNewInput(false);
      await handleAdd(res.data.id);
    } finally { setCreating(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[700] flex items-end sm:items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="flex items-start justify-between p-6 pb-4 border-b border-black/5">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-1.5 bg-accent/10 rounded-xl">
                <Bookmark size={14} className="text-accent" />
              </div>
              <h3 className="text-lg font-display font-bold text-text-main">Save to List</h3>
            </div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider pl-8">{cafe.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 text-text-muted hover:text-text-main transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-6 text-center text-[11px] font-bold uppercase tracking-widest text-text-muted animate-pulse">Loading lists…</div>
          ) : lists.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-text-muted">No lists yet. Create one below!</div>
          ) : (
            lists.map(list => {
              const isSaved  = saved[list.id];
              const isSaving = saving === list.id;
              return (
                <button
                  key={list.id}
                  onClick={() => !isSaved && handleAdd(list.id)}
                  disabled={isSaving || isSaved}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all group ${
                    isSaved
                      ? "border-accent/30 bg-accent/5 cursor-default"
                      : "border-black/8 bg-surface-hover hover:border-accent/30 hover:bg-accent/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isSaved ? "bg-accent/20" : "bg-black/5 group-hover:bg-accent/10"} transition-colors`}>
                      <List size={12} className={isSaved ? "text-accent" : "text-text-muted group-hover:text-accent transition-colors"} />
                    </div>
                    <span className={`text-sm font-semibold ${isSaved ? "text-accent" : "text-text-main"}`}>{list.name}</span>
                  </div>
                  <div className={`flex items-center justify-center w-7 h-7 rounded-xl transition-all ${
                    isSaved ? "bg-accent text-white" : "bg-black/5 text-text-muted group-hover:bg-accent group-hover:text-white"
                  }`}>
                    {isSaving ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                        <Plus size={12} />
                      </motion.div>
                    ) : isSaved ? <Check size={12} /> : <Plus size={12} />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="p-4 pt-2 border-t border-black/5 space-y-2">
          <AnimatePresence>
            {showNewInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 pb-2">
                  <input
                    autoFocus
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateList()}
                    placeholder="List name…"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 text-sm text-text-main bg-surface-hover focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/10 transition-all"
                  />
                  <button
                    onClick={handleCreateList}
                    disabled={creating || !newListName.trim()}
                    className="px-4 py-2.5 rounded-xl bg-accent text-white text-[11px] font-bold uppercase tracking-wide hover:bg-accent/90 transition-all disabled:opacity-40"
                  >
                    {creating ? "…" : "Create"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setShowNewInput(p => !p)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-black/10 text-[11px] font-bold uppercase tracking-wide text-text-muted hover:border-accent/40 hover:text-accent transition-all"
          >
            <PlusSquare size={13} />
            {showNewInput ? "Cancel" : "New List"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = ["Default", "Rating ↓", "Name A–Z", "Nearest"];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Discover() {
  const [cafes, setCafes]                   = useState([]);
  const [filteredCafes, setFilteredCafes]   = useState([]);
  const [selectedCafe, setSelectedCafe]     = useState(null);
  const [saveTarget, setSaveTarget]         = useState(null);
  const [loading, setLoading]               = useState(true);
  const [isSearching, setIsSearching]       = useState(false);
  const [userLocation, setUserLocation]     = useState(null);
  const [locating, setLocating]             = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeMoods, setActiveMoods]       = useState([]);
  const [sortBy, setSortBy]                 = useState("Default");
  const [showSortMenu, setShowSortMenu]     = useState(false);
  const [fitOnce, setFitOnce]               = useState(true);

  const searchTimeoutRef = useRef(null);
  const hasAnimatedRef   = useRef(false);

  // ── Fetch cafes ──────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/cafes")
      .then(r => { setCafes(r.data); setFilteredCafes(r.data); })
      .catch(err => console.error("Failed to load cafes", err))
      .finally(() => {
        setLoading(false);
        setTimeout(() => { hasAnimatedRef.current = true; }, 1000);
      });
  }, []);

  // ── Search ───────────────────────────────────────────────────────────────────
  const handleSearch = useCallback((query) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setFitOnce(false);
    if (!query) { applyFilters(cafes, activeMoods, query); setIsSearching(false); return; }
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get("/cafes", { params: { search: query } });
        applyFilters(res.data, activeMoods, query);
      } catch {
        const q = query.toLowerCase();
        applyFilters(cafes.filter(c =>
          c.name?.toLowerCase().includes(q) ||
          c.area?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
        ), activeMoods, query);
      } finally { setIsSearching(false); }
    }, 300);
  }, [cafes, activeMoods]);

  // ── Mood filter ───────────────────────────────────────────────────────────────
  const handleMoodFilter = useCallback((mood) => {
    setActiveMoods(prev => {
      const next = prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood];
      applyFilters(cafes, next, "");
      return next;
    });
  }, [cafes]);

  // ── Apply all filters + sort ───────────────────────────────────────────────────
  const applyFilters = useCallback((source, moods, _query) => {
    let result = [...source];
    // mood tags match description keywords (simple heuristic)
    if (moods.length > 0) {
      const moodKeywords = {
        'Work Focus': ['work', 'focus', 'quiet', 'productivity', 'laptop'],
        'Chill':      ['chill', 'relax', 'cozy', 'casual', 'laid-back'],
        'Social':     ['social', 'community', 'friends', 'lively', 'busy'],
        'Study':      ['study', 'student', 'book', 'library', 'academic'],
        'WiFi':       ['wifi', 'wi-fi', 'internet', 'fast', 'speed'],
        'Outdoor':    ['outdoor', 'garden', 'terrace', 'patio', 'rooftop'],
        'Live Music': ['music', 'live', 'jazz', 'band', 'performance'],
      };
      result = result.filter(c => {
        const text = `${c.name} ${c.description} ${c.area}`.toLowerCase();
        return moods.some(m => (moodKeywords[m] ?? [m.toLowerCase()]).some(kw => text.includes(kw)));
      });
    }
    setFilteredCafes(applySorting(result, sortBy));
  }, [sortBy]);

  const applySorting = (list, sort) => {
    switch (sort) {
      case "Rating ↓": return [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case "Name A–Z":  return [...list].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
      default:          return list;
    }
  };

  // ── Sort change ───────────────────────────────────────────────────────────────
  const handleSortChange = (s) => {
    setSortBy(s);
    setShowSortMenu(false);
    setFilteredCafes(prev => applySorting(prev, s));
  };

  useEffect(() => () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); }, []);

  // ── Geolocation ──────────────────────────────────────────────────────────────
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setSelectedCafe({ __locateMe: true, lat: loc.lat, lng: loc.lng });
        setLocating(false);
      },
      () => {
        setSelectedCafe({ __locateMe: true, lat: KTM[0], lng: KTM[1] });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const handleSelectCafe = useCallback((cafe) => {
    setSelectedCafe(cafe);
    setIsMobileSidebarOpen(false);
    setFitOnce(false);
  }, []);

  const handleDirections = useCallback((cafe) => {
    openDirections(userLocation, cafe);
  }, [userLocation]);

  // ── Map marker icons ──────────────────────────────────────────────────────────
  const createCustomIcon = useCallback((isActive) => L.divIcon({
    className: "custom-cafe-marker bg-transparent border-0",
    html: `
      <div style="
        position:relative; width:${isActive ? 48 : 38}px; height:${isActive ? 48 : 38}px;
        border-radius:50%;
        border: 2.5px solid ${isActive ? "white" : "rgba(0,0,0,0.08)"};
        background: ${isActive ? "var(--color-accent,#C87D5D)" : "white"};
        box-shadow: ${isActive
          ? "0 0 0 5px rgba(200,125,93,0.22),0 6px 20px rgba(0,0,0,0.18)"
          : "0 2px 10px rgba(0,0,0,0.14)"};
        display:flex; align-items:center; justify-content:center;
        transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${isActive ? 20 : 16}" height="${isActive ? 20 : 16}" viewBox="0 0 24 24" fill="none"
          stroke="${isActive ? "white" : "#C87D5D"}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m8 19 1.71-10.3c.18-1.06 1.1-1.84 2.18-1.84h.22c1.08 0 2 .78 2.18 1.84L16 19c.33 2-1.21 3.86-3.25 3.86h-1.5c-2.04 0-3.58-1.86-3.25-3.86Z"/>
          <path d="M12 2v2"/><path d="m8 5 4-3 4 3"/>
        </svg>
      </div>
    `,
    iconSize: [isActive ? 48 : 38, isActive ? 48 : 38],
    iconAnchor: [isActive ? 24 : 19, isActive ? 24 : 19],
    popupAnchor: [0, -28],
  }), []);

  const userLocationIcon = L.divIcon({
    className: "bg-transparent border-0",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.35),0 2px 8px rgba(0,0,0,0.2);"></div>`,
    iconSize: [16, 16], iconAnchor: [8, 8],
  });

  // ── Sidebar header ─────────────────────────────────────────────────────────────
  const SidebarHeader = () => (
    <div className="flex items-center justify-between px-5 py-4 shrink-0 bg-white/90 backdrop-blur-md border-b border-black/5">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-accent/10 rounded-xl text-accent">
          <LayoutGrid size={14} />
        </div>
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-main block leading-tight">
            {loading || isSearching ? "Scanning…" : `${filteredCafes.length} Spaces`}
          </span>
          {activeMoods.length > 0 && (
            <span className="text-[9px] text-accent font-bold uppercase tracking-wider">
              Filtered by {activeMoods.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Sort button */}
      <div className="relative">
        <button
          onClick={() => setShowSortMenu(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all ${
            showSortMenu ? "bg-accent text-white" : "bg-surface-hover text-text-muted hover:text-accent"
          }`}
        >
          <ArrowUpDown size={12} />
          {sortBy === "Default" ? "Sort" : sortBy}
        </button>
        <AnimatePresence>
          {showSortMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -6 }}
              className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-float border border-black/5 overflow-hidden w-40"
            >
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleSortChange(opt)}
                  className={`w-full px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide transition-colors ${
                    sortBy === opt
                      ? "bg-accent/10 text-accent"
                      : "text-text-muted hover:bg-surface-hover hover:text-text-main"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // ── Sidebar list ──────────────────────────────────────────────────────────────
  // Close sort menu when clicking outside
  const handleSidebarClick = () => { if (showSortMenu) setShowSortMenu(false); };

  const CafeList = () => (
    <>
      <SidebarHeader />
      <div
        className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 p-4 bg-surface-hover/30"
        onClick={handleSidebarClick}
      >
        <AnimatePresence mode="popLayout">
          {loading || isSearching ? (
            // Skeleton loader
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <CafeCardSkeleton key={i} />)}
            </motion.div>
          ) : filteredCafes.length === 0 ? (
            // Empty state
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-4 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-hover border border-black/5 flex items-center justify-center">
                <MapIcon size={22} className="text-text-subtle/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-muted">No cafes found</p>
                <p className="text-[11px] text-text-subtle mt-1">Try different moods or search terms</p>
              </div>
              {activeMoods.length > 0 && (
                <button
                  onClick={() => { setActiveMoods([]); applyFilters(cafes, [], ""); }}
                  className="text-[11px] font-bold text-accent uppercase tracking-widest hover:underline"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          ) : (
            filteredCafes.map((cafe, i) => (
              <motion.div
                key={cafe.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ delay: hasAnimatedRef.current ? 0 : i * 0.04, duration: 0.28 }}
              >
                <CafeCard
                  cafe={cafe}
                  isActive={selectedCafe?.id === cafe.id}
                  onClick={() => handleSelectCafe(cafe)}
                  onSave={(c) => setSaveTarget(c)}
                  onDirections={cafe.lat && cafe.lng ? handleDirections : null}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </>
  );

  // ── Map center logic ──────────────────────────────────────────────────────────
  const mapCenter = selectedCafe
    ? [selectedCafe.lat, selectedCafe.lng]
    : null;
  const mapZoom = selectedCafe?.__locateMe ? 15 : undefined;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-[calc(100vh-120px)] w-full overflow-hidden rounded-[2.5rem] border border-border bg-page-bg shadow-float font-body">

      {/* ── Search + chips overlay ── */}
      <div className="absolute top-6 left-0 right-0 z-30 px-5 md:px-8 lg:pl-[28rem] xl:pl-[30rem]">
        <SearchBar
          onSearch={handleSearch}
          onMoodFilter={handleMoodFilter}
          activeMoods={activeMoods}
        />
      </div>

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex absolute left-5 md:left-6 top-6 bottom-6 w-[22rem] lg:w-[24rem] z-20 flex-col bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-float rounded-[2rem] overflow-hidden">
        <CafeList />
      </div>

      {/* ── Mobile bottom drawer ── */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="md:hidden absolute bottom-0 left-0 right-0 z-40 flex flex-col bg-white rounded-t-[2.5rem] overflow-hidden shadow-float border-t border-black/5"
            style={{ maxHeight: "72vh" }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-black/10" />
            </div>
            <CafeList />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB cluster ── */}
      <div className="absolute bottom-8 right-6 z-30 flex flex-col items-center gap-3">
        {/* Mobile spaces toggle */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          className="md:hidden flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-soft border border-black/8 text-[10px] font-bold uppercase tracking-widest text-text-main"
          onClick={() => setIsMobileSidebarOpen(v => !v)}
        >
          <Layers size={14} />
          {isMobileSidebarOpen ? "Close" : `${filteredCafes.length} Spaces`}
        </motion.button>

        {/* Locate me */}
        <Button
          variant="primary"
          size="icon"
          className="w-14 h-14 rounded-full shadow-[0_8px_24px_rgba(200,125,93,0.35)] group relative"
          onClick={handleLocateMe}
          disabled={locating}
        >
          {locating ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Compass size={20} />
            </motion.div>
          ) : (
            <Navigation2 size={20} className="group-hover:scale-110 transition-transform" />
          )}
        </Button>
      </div>

      {/* ── Map ── */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={KTM}
          zoom={DEFAULT_ZOOM}
          zoomControl={false}
          className="h-full w-full custom-map-container"
        >
          <ZoomControl position="topright" />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Fit bounds on first load */}
          {fitOnce && cafes.length > 0 && <FitBounds cafes={cafes} />}

          {/* User location */}
          {userLocation && (
            <>
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={80}
                pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.12, weight: 1 }}
              />
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} />
            </>
          )}

          {/* Cafe markers */}
          {filteredCafes.map(cafe => {
            const isActive = selectedCafe?.id === cafe.id;
            return (
              <Marker
                key={cafe.id}
                position={[cafe.lat || KTM[0], cafe.lng || KTM[1]]}
                icon={createCustomIcon(isActive)}
                eventHandlers={{ click: () => handleSelectCafe(cafe) }}
                ref={(m) => {
                  if (m && isActive && !selectedCafe?.__locateMe) {
                    setTimeout(() => m.openPopup(), 80);
                  }
                }}
              >
                <Popup
                  className="custom-popup border-0 shadow-none bg-transparent"
                  closeButton={false}
                  maxWidth={280}
                >
                  <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-float border border-black/5 w-64 font-body">
                    <div className="h-36 relative">
                      <img
                        src={cafe.image_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400&auto=format&fit=crop"}
                        alt={cafe.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-xl flex items-center gap-1 shadow-sm border border-black/5">
                        <Star size={10} className="text-accent fill-accent" />
                        <span className="text-[10px] font-bold text-text-main">{cafe.rating || "4.5"}</span>
                      </div>
                      <div className="absolute bottom-3 left-3">
                        <h4 className="font-display font-semibold text-[15px] text-white leading-tight">{cafe.name}</h4>
                        <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">{cafe.area}</p>
                      </div>
                    </div>

                    <div className="p-4">
                      {cafe.description && (
                        <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed opacity-70 mb-4">
                          {cafe.description || "A wonderful sanctuary for connection and focus."}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSaveTarget(cafe); }}
                          title="Save to list"
                          className="flex items-center justify-center w-9 h-9 rounded-xl bg-black/5 hover:bg-accent hover:text-white text-text-muted transition-all duration-200 border border-black/5"
                        >
                          <Bookmark size={13} />
                        </button>
                        <Link to={`/log-visit?cafe_id=${cafe.id}`} className="flex-1">
                          <button className="w-full h-9 rounded-xl bg-accent text-white text-[10px] font-bold uppercase tracking-widest hover:bg-accent/90 transition-all">
                            Log Visit
                          </button>
                        </Link>
                        {cafe.lat && cafe.lng && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openDirections(userLocation, cafe); }}
                            title="Get directions"
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-black/5 hover:bg-emerald-500 hover:text-white text-text-muted transition-all duration-200 border border-black/5"
                          >
                            <Navigation2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          <MapUpdater center={mapCenter} zoom={mapZoom} />
        </MapContainer>
      </div>

      {/* ── Vignette overlays ── */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-page-bg/60 to-transparent pointer-events-none z-10" />

      {/* ── Save to List Modal ── */}
      <AnimatePresence>
        {saveTarget && (
          <SaveToListModal
            cafe={saveTarget}
            onClose={() => setSaveTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
