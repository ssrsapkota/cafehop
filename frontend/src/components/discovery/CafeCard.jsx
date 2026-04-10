import React from 'react';
import { MapPin, Star, Clock, Bookmark, Navigation2, Coffee } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils';
import { formatCurrency } from '../../utils/formatters';

// Skeleton loader
export function CafeCardSkeleton() {
  return (
    <div className="rounded-[1.5rem] bg-white border border-black/5 overflow-hidden animate-pulse">
      <div className="h-40 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded-full w-2/3" />
        <div className="h-3 bg-gray-100 rounded-full w-1/3" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
      </div>
    </div>
  );
}

export default function CafeCard({ cafe, onClick, isActive, onSave, onDirections }) {
  const priceMap = { 
    low: `${formatCurrency(100)}–${formatCurrency(300)}`, 
    mid: `${formatCurrency(300)}–${formatCurrency(600)}`, 
    high: `${formatCurrency(600)}+` 
  };
  const priceLabel = priceMap[cafe.price_range] ?? null;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        'relative rounded-[1.5rem] overflow-hidden cursor-pointer group transition-all duration-300 border',
        isActive
          ? 'border-accent/30 shadow-[0_8px_32px_rgba(200,125,93,0.18)] ring-1 ring-accent/20'
          : 'border-black/5 bg-white hover:border-black/10 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]'
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <motion.div
          layoutId="active-bar"
          className="absolute left-0 top-0 bottom-0 w-1 bg-accent rounded-l-[1.5rem] z-10"
        />
      )}

      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-surface-hover">
        <img
          src={cafe.image_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop'}
          alt={cafe.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating pill */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-black/5">
          <Star size={11} className="text-accent fill-accent" />
          <span className="text-[11px] font-bold text-text-main">{cafe.rating ?? '4.5'}</span>
        </div>

        {/* Hover action buttons */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          {onSave && (
            <button
              onClick={(e) => { e.stopPropagation(); onSave(cafe); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wide text-text-main hover:bg-white hover:text-accent transition-all border border-white/30 shadow-sm"
            >
              <Bookmark size={11} /> Save
            </button>
          )}
          {onDirections && (
            <button
              onClick={(e) => { e.stopPropagation(); onDirections(cafe); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wide text-text-main hover:bg-accent hover:text-white transition-all border border-white/30 shadow-sm"
            >
              <Navigation2 size={11} /> Directions
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className={cn(
        'p-4 space-y-2 transition-colors duration-300',
        isActive ? 'bg-accent/[0.03]' : 'bg-white'
      )}>
        {/* Name + distance */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[16px] font-display font-semibold text-text-main leading-tight tracking-tight">
            {cafe.name}
          </h3>
          <span className="shrink-0 text-[10px] font-bold text-text-subtle bg-surface-hover px-2 py-0.5 rounded-lg border border-black/5 mt-0.5">
            {cafe.distance ?? '0.4km'}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-text-subtle">
          <span className="flex items-center gap-1">
            <MapPin size={11} className="text-accent/70 stroke-[2.5]" />
            {cafe.area ?? 'Kathmandu'}
          </span>
          <span className="w-0.5 h-0.5 rounded-full bg-black/15" />
          <span className="flex items-center gap-1">
            <Clock size={11} className="text-accent/70 stroke-[2.5]" />
            Open until 22:00
          </span>
          {priceLabel && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-black/15" />
              <span className="flex items-center gap-1">
                <Coffee size={11} className="text-accent/70 stroke-[2.5]" />
                {priceLabel}
              </span>
            </>
          )}
        </div>

        {/* Description */}
        {cafe.description && (
          <p className="text-[12px] text-text-muted line-clamp-2 leading-relaxed opacity-75 group-hover:opacity-100 transition-opacity">
            {cafe.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
