import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string; // e.g., "+5%"
    trendUp?: boolean;
    color?: "primary" | "green" | "blue" | "orange";
    description?: string;
    className?: string;
}

const colorMap = {
    primary: "bg-primary/10 text-primary border-primary/20",
    green: "bg-green-500/10 text-green-600 border-green-500/20",
    blue: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    orange: "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color = "primary", description, className }: StatCardProps) {
    return (
        <div className={cn("relative overflow-hidden rounded-2xl bg-white/60 hover:bg-white/80 backdrop-blur-xl border border-white/40 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]", className)}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform", colorMap[color])}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {trend && (
                        <span className={cn("text-xs font-bold px-2 py-1 rounded-full", trendUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                            {trend}
                        </span>
                    )}
                </div>

                <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                {description && <p className="text-xs text-muted-foreground/60 mt-2">{description}</p>}
            </div>

            {/* Decorative glow */}
            <div className={cn("absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-3xl pointer-events-none",
                color === 'primary' ? 'bg-primary' :
                    color === 'green' ? 'bg-green-500' :
                        color === 'blue' ? 'bg-blue-500' : 'bg-orange-500'
            )} />
        </div>
    );
}
