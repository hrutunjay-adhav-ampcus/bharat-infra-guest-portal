import { Booking } from '@/types';

const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#78350F' },
  confirmed: { bg: '#E6F1FB', text: '#042C53' },
  checked_in: { bg: '#EEEDFE', text: '#26215C' },
  completed: { bg: '#E1F5EE', text: '#085041' },
  rejected: { bg: '#FCEBEB', text: '#501313' },
  cancelled: { bg: '#f3f4f6', text: '#374151' },
};

export function BookingStatusBadge({ status }: { status: Booking['status'] }) {
  const style = BADGE_STYLES[status] || BADGE_STYLES.cancelled;
  const label = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: style.bg, color: style.text }}>
      {label}
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    Electrical: '#F59E0B',
    Plumbing: '#3B82F6',
    'AC/HVAC': '#14B8A6',
    Furniture: '#6B7280',
    'Post-checkout Cleaning': '#22C55E',
    'Pest Control': '#EF4444',
    Appliances: '#7F77DD',
    Other: '#6B7280',
  };
  const color = colors[category] || '#6B7280';
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: color + '20', color }}>
      {category}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = { High: '#EF4444', Medium: '#F59E0B', Low: '#22C55E' };
  const color = colors[priority] || '#6B7280';
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: color + '20', color }}>
      {priority}
    </span>
  );
}
