import { Room, RoomSection, MaintenanceTicket } from '@/types';

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  available: { bg: '#E1F5EE', border: '#5DCAA5', text: '#085041', dot: '#1D9E75' },
  pending_approval: { bg: '#FEF3C7', border: '#F59E0B', text: '#78350F', dot: '#F59E0B' },
  booked: { bg: '#E6F1FB', border: '#85B7EB', text: '#042C53', dot: '#378ADD' },
  occupied: { bg: '#EEEDFE', border: '#AFA9EC', text: '#26215C', dot: '#7F77DD' },
  maintenance: { bg: '#FCEBEB', border: '#F09595', text: '#501313', dot: '#E24B4A' },
};

function getSectionContent(section: RoomSection, tickets?: MaintenanceTicket[]) {
  switch (section.status) {
    case 'occupied':
    case 'booked': {
      const name = section.guestName || '';
      const first = name.split(' ')[0];
      return first.length > 8 ? first.slice(0, 7) + '…' : first;
    }
    case 'available':
      return 'Free';
    case 'maintenance': {
      if (tickets) {
        const t = tickets.find(tk => tk.sectionId === section.sectionId);
        if (t) {
          const abbrevs: Record<string, string> = { Electrical: 'Elec.', Plumbing: 'Plumb.', 'AC/HVAC': 'AC', Furniture: 'Furn.', 'Post-checkout Cleaning': 'Clean.', 'Pest Control': 'Pest', Appliances: 'Appl.' };
          return abbrevs[t.category] || t.category.slice(0, 5);
        }
      }
      return 'Maint.';
    }
    case 'pending_approval':
      return 'Pending';
    default:
      return '';
  }
}

interface RoomCardProps {
  room: Room;
  tickets?: MaintenanceTicket[];
  onClick?: (room: Room, sectionId?: string) => void;
}

export default function RoomCard({ room, tickets, onClick }: RoomCardProps) {
  const firstStatus = room.sections[0]?.status || 'available';
  const borderColor = STATUS_STYLES[firstStatus]?.border || '#e2e8f0';

  const handleClick = () => {
    if (room.bhkCount === 1) {
      onClick?.(room, room.sections[0]?.sectionId);
    } else {
      onClick?.(room);
    }
  };

  return (
    <div
      className="rounded-lg cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
      style={{ border: `2px solid ${borderColor}`, minHeight: '80px' }}
      onClick={handleClick}
    >
      <div className="flex h-[52px]">
        {room.sections.map((section, i) => {
          const style = STATUS_STYLES[section.status] || STATUS_STYLES.available;
          const content = getSectionContent(section, tickets?.filter(t => t.roomId === room.id));
          const isPending = section.status === 'pending_approval';

          return (
            <div
              key={section.sectionId}
              className={`flex-1 relative px-1.5 py-1.5 flex flex-col items-center justify-center ${isPending ? 'cursor-not-allowed' : ''}`}
              style={{
                backgroundColor: style.bg,
                borderRight: i < room.sections.length - 1 ? '1px solid #94a3b8' : 'none',
              }}
              title={isPending ? 'Awaiting admin approval' : undefined}
            >
              <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />
              {room.bhkCount > 1 && (
                <span className="text-[9px] font-medium leading-none" style={{ color: style.text }}>
                  {room.number}-{section.label}
                </span>
              )}
              <span className="text-[10px] font-semibold leading-tight mt-0.5" style={{ color: style.text }}>
                {content}
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-center py-1 border-t" style={{ borderColor: '#e2e8f0', backgroundColor: 'white' }}>
        <span className="text-xs font-bold text-foreground">{room.number}</span>
        <span className="text-[10px] text-muted-foreground ml-1">{room.bhkCount}BHK</span>
      </div>
    </div>
  );
}
