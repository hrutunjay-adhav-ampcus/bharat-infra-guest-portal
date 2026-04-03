export interface Settings {
  companyName: string;
  checkinTime: string;
  checkoutTime: string;
  cleaningBufferMinutes: number;
  bookingExpiryHours: number;
  smtpEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  dosAndDonts: string;
}

export interface Manager {
  id: string;
  name: string;
  empId: string;
  email: string;
  phone: string;
  assignedGHs: string[];
  status: 'active' | 'inactive';
  password: string;
}

export interface GuestHouse {
  id: string;
  name: string;
  city: string;
  address: string;
  floors: number;
  managerId: string;
  status: 'active' | 'inactive';
}

export interface RoomSection {
  sectionId: string;
  label: string;
  status: 'available' | 'booked' | 'occupied' | 'pending_approval' | 'maintenance';
  guestName: string | null;
  bookingRef: string | null;
}

export interface Room {
  id: string;
  ghId: string;
  number: string;
  floor: number;
  gridX: number;
  gridY: number;
  bhkCount: number;
  amenities: string[];
  sections: RoomSection[];
}

export interface BookingGuest {
  name: string;
  phone: string;
  company: string;
  type: 'employee' | 'visitor';
  empId: string | null;
  gender: 'Male' | 'Female';
  email: string;
  allocatedRoom: string | null;
  allocatedSection: string | null;
}

export interface PickupDrop {
  enabled: boolean;
  location?: string;
  date?: string;
  time?: string;
  vehicle?: string;
  notes?: string;
}

export interface Booking {
  ref: string;
  ghId: string;
  guests: BookingGuest[];
  checkin: string;
  checkout: string;
  nights: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'rejected' | 'cancelled';
  actualCheckin?: string;
  pendingExpiresAt?: number;
  cancellationReason?: string;
  rejectionReason?: string;
  pickup: PickupDrop;
  drop: PickupDrop;
  purpose: string;
  emailSent: boolean;
  occupancyType: string;
}

export interface MaintenanceTicket {
  id: string;
  ghId: string;
  roomId: string;
  sectionId: string;
  floor: number;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  reportedAt: string;
  resolvedAt?: string;
  resolutionHours?: number;
  resolutionNote?: string;
}

export type UserRole = 'admin' | 'manager';

export interface AuthUser {
  role: UserRole;
  userId: string;
}
