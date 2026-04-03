import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  badge?: number;
}

export default function StatCard({ title, value, icon: Icon, color = '#0f172a', badge }: StatCardProps) {
  return (
    <div className="bg-card rounded-[10px] border border-border p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
      </div>
      <div className="relative">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#ef4444', color: 'white' }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
