import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Wifi, BookOpen, Coffee, Users, Zap, Music, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOOD_CHIPS = [
  { label: 'Work Focus', icon: Zap,     color: 'text-blue-600',   bg: 'bg-blue-50',   activeBg: 'bg-blue-600' },
  { label: 'Chill',      icon: Coffee,   color: 'text-amber-600',  bg: 'bg-amber-50',  activeBg: 'bg-amber-500' },
  { label: 'Social',     icon: Users,    color: 'text-purple-600', bg: 'bg-purple-50', activeBg: 'bg-purple-600' },
  { label: 'Study',      icon: BookOpen, color: 'text-green-600',  bg: 'bg-green-50',  activeBg: 'bg-green-600' },
  { label: 'WiFi',       icon: Wifi,     color: 'text-sky-600',    bg: 'bg-sky-50',    activeBg: 'bg-sky-500' },
  { label: 'Outdoor',    icon: Sun,      color: 'text-orange-600', bg: 'bg-orange-50', activeBg: 'bg-orange-500' },
  { label: 'Live Music', icon: Music,    color: 'text-rose-600',   bg: 'bg-rose-50',   activeBg: 'bg-rose-500' },
];

export default function SearchBar({ onSearch, onMoodFilter, activeMoods = [] }) {
  const [query, setQuery]       = useState('');
  const [focused, setFocused]   = useState(false);
  const inputRef                = useRef(null);

  const handleChange = (val) => {
    setQuery(val);
    onSearch(val);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
      {/* Main search pill */}
      <motion.div
        animate={{ boxShadow: focused
          ? '0 8px 40px rgba(200,125,93,0.18), 0 0 0 2px rgba(200,125,93,0.25)'
          : '0 8px 32px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)' }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/60"
      >
        <motion.div
          animate={{ color: focused ? 'var(--color-accent)' : '#9ca3af' }}
          transition={{ duration: 0.2 }}
        >
          <Search size={20} strokeWidth={2.5} />
        </motion.div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search cafes, areas, or moods…"
          className="flex-1 bg-transparent outline-none text-[15px] font-medium text-text-main placeholder:text-text-subtle font-body tracking-tight"
        />

        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-all"
            >
              <X size={15} />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Mood chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {MOOD_CHIPS.map((chip) => {
          const Icon    = chip.icon;
          const isActive = activeMoods.includes(chip.label);
          return (
            <motion.button
              key={chip.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onMoodFilter?.(chip.label)}
              className={`
                flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide
                transition-all duration-200 border whitespace-nowrap
                ${isActive
                  ? `${chip.activeBg} text-white border-transparent shadow-sm`
                  : `${chip.bg} ${chip.color} border-transparent hover:border-current/20`}
              `}
            >
              <Icon size={11} strokeWidth={2.5} />
              {chip.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
