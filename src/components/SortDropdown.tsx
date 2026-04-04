interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
    >
      <option value="date_desc">Date — Newest First</option>
      <option value="date_asc">Date — Oldest First</option>
      <option value="time_desc">Time — Latest First</option>
      <option value="time_asc">Time — Earliest First</option>
    </select>
  );
}

export function sortData<T extends Record<string, any>>(data: T[], sortKey: string): T[] {
  return [...data].sort((a, b) => {
    const dateA = new Date(a.checkin || a.reportedAt || a.date || 0);
    const dateB = new Date(b.checkin || b.reportedAt || b.date || 0);
    if (sortKey === 'date_desc') return dateB.getTime() - dateA.getTime();
    if (sortKey === 'date_asc') return dateA.getTime() - dateB.getTime();
    if (sortKey === 'time_desc') return dateB.getTime() - dateA.getTime();
    if (sortKey === 'time_asc') return dateA.getTime() - dateB.getTime();
    return 0;
  });
}
