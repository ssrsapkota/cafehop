import React from 'react';
import { cn } from '../../utils';
import { Sparkles, ArrowRight } from 'lucide-react';

export function BentoGrid({ children, className }) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[250px]", className)}>
            {children}
        </div>
    );
}

export function BentoCard({
    title,
    description,
    icon,
    className,
    href,
    cta = "View details",
    image
}) {
    // If it's a structural generic card without an image...
    return (
        <a
            href={href}
            className={cn(
                "group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-white transition-all duration-300 shadow-sm border border-black/5 hover:border-black/10 hover:shadow-md p-6",
                className
            )}
        >
            {/* Image Overlay */}
            {image && (
                <div className="absolute inset-0 z-0 overflow-hidden bg-black/5">
                    <img
                        src={image}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                </div>
            )}

            {/* Icon Top right */}
            <div className={cn(
                "absolute top-6 right-6 z-20 transition-transform duration-300 group-hover:scale-110",
                image ? "text-white/80" : "text-text-muted"
            )}>
                {icon ? React.cloneElement(icon, { size: 20 }) : <Sparkles size={20} />}
            </div>

            {/* Content Bottom */}
            <div className="relative z-20 mt-auto flex flex-col gap-2 transition-transform duration-300 group-hover:-translate-y-1">
                <h3 className={cn("text-xl font-bold tracking-tight", image ? "text-white" : "text-text-main")}>
                    {title}
                </h3>
                <p className={cn("text-sm font-medium leading-relaxed max-w-sm", image ? "text-white/80" : "text-text-muted")}>
                    {description}
                </p>

                <div className={cn(
                    "mt-2 flex items-center gap-1.5 text-sm font-semibold opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1",
                    image ? "text-white" : "text-black"
                )}>
                    {cta} <ArrowRight size={14} />
                </div>
            </div>
        </a>
    );
}
