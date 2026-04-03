import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Settings, Manager, GuestHouse, Room, Booking, MaintenanceTicket, AuthUser } from '@/types';
import { initialSettings, initialManagers, initialGuestHouses, initialRooms, initialBookings, initialTickets } from '@/data/mockData';

interface AppContextType {
  user: AuthUser | null;
  login: (role: 'admin' | 'manager', email: string, password: string) => boolean;
  logout: () => void;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  managers: Manager[];
  setManagers: React.Dispatch<React.SetStateAction<Manager[]>>;
  guestHouses: GuestHouse[];
  setGuestHouses: React.Dispatch<React.SetStateAction<GuestHouse[]>>;
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  tickets: MaintenanceTicket[];
  setTickets: React.Dispatch<React.SetStateAction<MaintenanceTicket[]>>;
  selectedGHId: string;
  setSelectedGHId: (id: string) => void;
  getManagerGHs: (managerId: string) => GuestHouse[];
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('ghms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [managers, setManagers] = useState<Manager[]>(initialManagers);
  const [guestHouses, setGuestHouses] = useState<GuestHouse[]>(initialGuestHouses);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(initialTickets);
  const [selectedGHId, setSelectedGHIdState] = useState<string>(() => {
    return localStorage.getItem('ghms_selectedGH') || '';
  });

  const setSelectedGHId = useCallback((id: string) => {
    setSelectedGHIdState(id);
    localStorage.setItem('ghms_selectedGH', id);
  }, []);

  const login = useCallback((role: 'admin' | 'manager', email: string, password: string): boolean => {
    if (role === 'admin') {
      if (email === 'admin@company.com' && password === 'admin123') {
        const u: AuthUser = { role: 'admin', userId: 'admin' };
        setUser(u);
        localStorage.setItem('ghms_user', JSON.stringify(u));
        return true;
      }
      return false;
    }
    const mgr = managers.find(m => m.email === email && m.password === password);
    if (mgr) {
      const u: AuthUser = { role: 'manager', userId: mgr.id };
      setUser(u);
      localStorage.setItem('ghms_user', JSON.stringify(u));
      if (mgr.assignedGHs.length > 0) {
        setSelectedGHId(mgr.assignedGHs[0]);
      }
      return true;
    }
    return false;
  }, [managers, setSelectedGHId]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('ghms_user');
    localStorage.removeItem('ghms_selectedGH');
  }, []);

  const getManagerGHs = useCallback((managerId: string) => {
    const mgr = managers.find(m => m.id === managerId);
    if (!mgr) return [];
    return guestHouses.filter(gh => mgr.assignedGHs.includes(gh.id));
  }, [managers, guestHouses]);

  // Auto-expire pending bookings
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBookings(prev => prev.map(b => {
        if (b.status === 'pending' && b.pendingExpiresAt && b.pendingExpiresAt <= now) {
          // Release sections
          setRooms(prevRooms => prevRooms.map(room => ({
            ...room,
            sections: room.sections.map(s => {
              const isAllocated = b.guests.some(g => g.allocatedRoom === room.id && g.allocatedSection === s.sectionId);
              if (isAllocated && s.status === 'pending_approval') {
                return { ...s, status: 'available' as const, guestName: null, bookingRef: null };
              }
              return s;
            })
          })));
          return { ...b, status: 'rejected' as const, rejectionReason: 'Auto-rejected: approval window expired' };
        }
        return b;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider value={{
      user, login, logout,
      settings, setSettings,
      managers, setManagers,
      guestHouses, setGuestHouses,
      rooms, setRooms,
      bookings, setBookings,
      tickets, setTickets,
      selectedGHId, setSelectedGHId,
      getManagerGHs,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
