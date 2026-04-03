import { Settings, Manager, GuestHouse, Room, Booking, MaintenanceTicket } from '@/types';

export const initialSettings: Settings = {
  companyName: "Bharat Infra Corp",
  checkinTime: "14:00",
  checkoutTime: "11:00",
  cleaningBufferMinutes: 60,
  bookingExpiryHours: 4,
  smtpEmail: "noreply@bharatinfra.com",
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  dosAndDonts: "1. No smoking inside rooms.\n2. Visitors not allowed after 10PM.\n3. Report maintenance issues immediately.\n4. Keep rooms clean.\n5. No loud music."
};

export const initialManagers: Manager[] = [
  { id: "mgr1", name: "Rajesh Kumar", empId: "EMP001", email: "rajesh@bharatinfra.com", phone: "9876543210", assignedGHs: ["gh1"], status: "active", password: "pass123" },
  { id: "mgr2", name: "Sneha Patil", empId: "EMP002", email: "sneha@bharatinfra.com", phone: "9876543211", assignedGHs: ["gh2"], status: "active", password: "pass123" },
  { id: "mgr3", name: "Arvind Singh", empId: "EMP003", email: "arvind@bharatinfra.com", phone: "9876543212", assignedGHs: ["gh3"], status: "active", password: "pass123" },
  { id: "mgr4", name: "Meena Joshi", empId: "EMP004", email: "meena@bharatinfra.com", phone: "9876543213", assignedGHs: [], status: "active", password: "pass123" },
];

export const initialGuestHouses: GuestHouse[] = [
  { id: "gh1", name: "Raipur Executive Suites", city: "Raipur", address: "12 Industrial Area, Raipur, CG 492001", floors: 3, managerId: "mgr1", status: "active" },
  { id: "gh2", name: "Mumbai Business Lodge", city: "Mumbai", address: "45 BKC Complex, Mumbai, MH 400051", floors: 4, managerId: "mgr2", status: "active" },
  { id: "gh3", name: "Delhi Corporate Inn", city: "Delhi", address: "7 Connaught Place, New Delhi 110001", floors: 2, managerId: "mgr3", status: "active" },
];

export const initialRooms: Room[] = [
  // gh1 Floor 1
  { id: "rm101", ghId: "gh1", number: "101", floor: 1, gridX: 0, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm102", ghId: "gh1", number: "102", floor: 1, gridX: 1, gridY: 0, bhkCount: 2, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "occupied", guestName: "Rahul Sharma", bookingRef: "BK001" }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm103", ghId: "gh1", number: "103", floor: 1, gridX: 2, gridY: 0, bhkCount: 3, amenities: ["AC", "WiFi"], sections: [{ sectionId: "A", label: "A", status: "maintenance", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "maintenance", guestName: null, bookingRef: null }, { sectionId: "C", label: "C", status: "maintenance", guestName: null, bookingRef: null }] },
  { id: "rm104", ghId: "gh1", number: "104", floor: 1, gridX: 3, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm105", ghId: "gh1", number: "105", floor: 1, gridX: 0, gridY: 1, bhkCount: 2, amenities: ["AC", "WiFi", "TV", "Kitchen"], sections: [{ sectionId: "A", label: "A", status: "booked", guestName: "Meera Patel", bookingRef: "BK002" }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm106", ghId: "gh1", number: "106", floor: 1, gridX: 1, gridY: 1, bhkCount: 1, amenities: ["AC", "WiFi"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  // gh1 Floor 2
  { id: "rm201", ghId: "gh1", number: "201", floor: 2, gridX: 0, gridY: 0, bhkCount: 2, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "occupied", guestName: "Anita Desai", bookingRef: "BK003" }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm202", ghId: "gh1", number: "202", floor: 2, gridX: 1, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm203", ghId: "gh1", number: "203", floor: 2, gridX: 2, gridY: 0, bhkCount: 3, amenities: ["AC", "WiFi", "TV", "Kitchen"], sections: [{ sectionId: "A", label: "A", status: "booked", guestName: "Priya Nair", bookingRef: "BK004" }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }, { sectionId: "C", label: "C", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm204", ghId: "gh1", number: "204", floor: 2, gridX: 3, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm205", ghId: "gh1", number: "205", floor: 2, gridX: 0, gridY: 1, bhkCount: 2, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm206", ghId: "gh1", number: "206", floor: 2, gridX: 1, gridY: 1, bhkCount: 2, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "occupied", guestName: "Sunita Roy", bookingRef: "BK005" }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  // gh1 Floor 3
  { id: "rm301", ghId: "gh1", number: "301", floor: 3, gridX: 0, gridY: 0, bhkCount: 3, amenities: ["AC", "WiFi", "TV", "Kitchen"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }, { sectionId: "C", label: "C", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm302", ghId: "gh1", number: "302", floor: 3, gridX: 1, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "booked", guestName: "Vikram Rao", bookingRef: "BK006" }] },
  { id: "rm303", ghId: "gh1", number: "303", floor: 3, gridX: 2, gridY: 0, bhkCount: 2, amenities: ["AC", "WiFi"], sections: [{ sectionId: "A", label: "A", status: "maintenance", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "maintenance", guestName: null, bookingRef: null }] },
  { id: "rm304", ghId: "gh1", number: "304", floor: 3, gridX: 3, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm305", ghId: "gh1", number: "305", floor: 3, gridX: 0, gridY: 1, bhkCount: 2, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "occupied", guestName: "Arjun Mehta", bookingRef: "BK007" }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm306", ghId: "gh1", number: "306", floor: 3, gridX: 1, gridY: 1, bhkCount: 1, amenities: ["AC", "WiFi"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  // gh2 Mumbai - 4 floors, 10 rooms
  { id: "rm2101", ghId: "gh2", number: "101", floor: 1, gridX: 0, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm2102", ghId: "gh2", number: "102", floor: 1, gridX: 1, gridY: 0, bhkCount: 2, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm2103", ghId: "gh2", number: "103", floor: 1, gridX: 2, gridY: 0, bhkCount: 3, amenities: ["AC", "WiFi", "TV", "Kitchen"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }, { sectionId: "C", label: "C", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm2201", ghId: "gh2", number: "201", floor: 2, gridX: 0, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm2202", ghId: "gh2", number: "202", floor: 2, gridX: 1, gridY: 0, bhkCount: 2, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm2301", ghId: "gh2", number: "301", floor: 3, gridX: 0, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm2302", ghId: "gh2", number: "302", floor: 3, gridX: 1, gridY: 0, bhkCount: 3, amenities: ["AC", "WiFi", "TV", "Geyser"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }, { sectionId: "C", label: "C", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm2401", ghId: "gh2", number: "401", floor: 4, gridX: 0, gridY: 0, bhkCount: 2, amenities: ["AC", "WiFi", "TV", "Kitchen"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm2402", ghId: "gh2", number: "402", floor: 4, gridX: 1, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm2403", ghId: "gh2", number: "403", floor: 4, gridX: 2, gridY: 0, bhkCount: 2, amenities: ["AC", "WiFi"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  // gh3 Delhi - 2 floors, 10 rooms
  { id: "rm3101", ghId: "gh3", number: "101", floor: 1, gridX: 0, gridY: 0, bhkCount: 2, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm3102", ghId: "gh3", number: "102", floor: 1, gridX: 1, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm3103", ghId: "gh3", number: "103", floor: 1, gridX: 2, gridY: 0, bhkCount: 3, amenities: ["AC", "WiFi", "TV", "Kitchen"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }, { sectionId: "C", label: "C", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm3104", ghId: "gh3", number: "104", floor: 1, gridX: 3, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm3105", ghId: "gh3", number: "105", floor: 1, gridX: 0, gridY: 1, bhkCount: 2, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm3201", ghId: "gh3", number: "201", floor: 2, gridX: 0, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm3202", ghId: "gh3", number: "202", floor: 2, gridX: 1, gridY: 0, bhkCount: 2, amenities: ["AC", "WiFi", "TV", "Geyser"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm3203", ghId: "gh3", number: "203", floor: 2, gridX: 2, gridY: 0, bhkCount: 3, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }, { sectionId: "C", label: "C", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm3204", ghId: "gh3", number: "204", floor: 2, gridX: 3, gridY: 0, bhkCount: 1, amenities: ["AC", "WiFi"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }] },
  { id: "rm3205", ghId: "gh3", number: "205", floor: 2, gridX: 0, gridY: 1, bhkCount: 2, amenities: ["AC", "WiFi", "TV"], sections: [{ sectionId: "A", label: "A", status: "available", guestName: null, bookingRef: null }, { sectionId: "B", label: "B", status: "available", guestName: null, bookingRef: null }] },
];

export const initialBookings: Booking[] = [
  {
    ref: "BK001", ghId: "gh1",
    guests: [
      { name: "Rahul Sharma", phone: "9811111111", company: "TechCorp", type: "employee", empId: "TC001", gender: "Male", email: "rahul@techcorp.com", allocatedRoom: "rm102", allocatedSection: "A" },
      { name: "Anita Roy", phone: "9822222222", company: "TechCorp", type: "employee", empId: "TC002", gender: "Female", email: "anita@techcorp.com", allocatedRoom: "rm201", allocatedSection: "A" }
    ],
    checkin: "2024-04-01T14:00", checkout: "2024-04-03T11:00", nights: 2,
    status: "checked_in", actualCheckin: "2024-04-01T14:15",
    pickup: { enabled: true, location: "Raipur Airport", date: "2024-04-01", time: "12:00", vehicle: "Car" },
    drop: { enabled: true, location: "Raipur Airport", date: "2024-04-03", time: "12:00", vehicle: "Car" },
    purpose: "Project site visit", emailSent: true, occupancyType: "single_section"
  },
  {
    ref: "BK002", ghId: "gh1",
    guests: [{ name: "Meera Patel", phone: "9855555555", company: "TCS", type: "visitor", empId: null, gender: "Female", email: "meera@tcs.com", allocatedRoom: "rm105", allocatedSection: "A" }],
    checkin: "2024-04-02T14:00", checkout: "2024-04-04T11:00", nights: 2,
    status: "confirmed",
    pickup: { enabled: false }, drop: { enabled: false },
    purpose: "Client meeting", emailSent: true, occupancyType: "single_section"
  },
  {
    ref: "BK003", ghId: "gh1",
    guests: [{ name: "Anita Desai", phone: "9833333333", company: "Wipro", type: "employee", empId: "WP001", gender: "Female", email: "anita@wipro.com", allocatedRoom: "rm201", allocatedSection: "A" }],
    checkin: "2024-03-30T14:00", checkout: "2024-04-02T11:00", nights: 3,
    status: "checked_in", actualCheckin: "2024-03-30T14:10",
    pickup: { enabled: false }, drop: { enabled: false },
    purpose: "Audit", emailSent: true, occupancyType: "single_section"
  },
  {
    ref: "BK004", ghId: "gh1",
    guests: [
      { name: "Priya Nair", phone: "9844444444", company: "Wipro", type: "employee", empId: "WP002", gender: "Female", email: "priya@wipro.com", allocatedRoom: "rm203", allocatedSection: "A" },
      { name: "Sunita Desai", phone: "9855555556", company: "Wipro", type: "employee", empId: "WP003", gender: "Female", email: "sunita@wipro.com", allocatedRoom: "rm206", allocatedSection: "A" },
      { name: "Arjun Singh", phone: "9866666666", company: "Wipro", type: "employee", empId: "WP004", gender: "Male", email: "arjun@wipro.com", allocatedRoom: "rm305", allocatedSection: "A" }
    ],
    checkin: "2024-04-04T14:00", checkout: "2024-04-07T11:00", nights: 3,
    status: "pending",
    pendingExpiresAt: Date.now() + 4 * 60 * 60 * 1000,
    pickup: { enabled: true, location: "Raipur Station", date: "2024-04-04", time: "12:00", vehicle: "Van" },
    drop: { enabled: false },
    purpose: "Training batch", emailSent: false, occupancyType: "single_section"
  },
  {
    ref: "BK005", ghId: "gh1",
    guests: [{ name: "Sunita Roy", phone: "9866666667", company: "Infra Ltd", type: "visitor", empId: null, gender: "Female", email: "sunita@infra.com", allocatedRoom: "rm206", allocatedSection: "A" }],
    checkin: "2024-04-01T14:00", checkout: "2024-04-03T11:00", nights: 2,
    status: "checked_in", actualCheckin: "2024-04-01T14:05",
    pickup: { enabled: false }, drop: { enabled: false },
    purpose: "Site inspection", emailSent: true, occupancyType: "single_section"
  },
  {
    ref: "BK006", ghId: "gh1",
    guests: [{ name: "Vikram Rao", phone: "9844444445", company: "HCL", type: "employee", empId: "HCL001", gender: "Male", email: "vikram@hcl.com", allocatedRoom: "rm302", allocatedSection: "A" }],
    checkin: "2024-04-03T14:00", checkout: "2024-04-06T11:00", nights: 3,
    status: "confirmed",
    pickup: { enabled: false }, drop: { enabled: false },
    purpose: "Client demo", emailSent: true, occupancyType: "single_section"
  },
  {
    ref: "BK007", ghId: "gh1",
    guests: [{ name: "Arjun Mehta", phone: "9877777777", company: "BPCL", type: "employee", empId: "BP001", gender: "Male", email: "arjun@bpcl.com", allocatedRoom: "rm305", allocatedSection: "A" }],
    checkin: "2024-03-31T14:00", checkout: "2024-04-02T11:00", nights: 2,
    status: "checked_in", actualCheckin: "2024-03-31T14:00",
    pickup: { enabled: false },
    drop: { enabled: true, location: "Raipur Bus Stand", date: "2024-04-02", time: "12:00", vehicle: "Car" },
    purpose: "Audit visit", emailSent: true, occupancyType: "single_section"
  },
  {
    ref: "BK008", ghId: "gh1",
    guests: [{ name: "Neha Gupta", phone: "9822233344", company: "Accenture", type: "visitor", empId: null, gender: "Female", email: "neha@acc.com", allocatedRoom: null, allocatedSection: null }],
    checkin: "2024-04-06T14:00", checkout: "2024-04-08T11:00", nights: 2,
    status: "cancelled",
    cancellationReason: "Guest cancelled trip",
    pickup: { enabled: false }, drop: { enabled: false },
    purpose: "Review", emailSent: false, occupancyType: "single_section"
  },
];

export const initialTickets: MaintenanceTicket[] = [
  { id: "TK001", ghId: "gh1", roomId: "rm103", sectionId: "A", floor: 1, category: "Electrical", priority: "High", description: "AC circuit trip — room unusable", status: "open", reportedAt: "2024-04-01" },
  { id: "TK002", ghId: "gh1", roomId: "rm303", sectionId: "A", floor: 3, category: "Plumbing", priority: "Medium", description: "Bathroom tap leaking", status: "in_progress", reportedAt: "2024-04-02" },
  { id: "TK003", ghId: "gh1", roomId: "rm201", sectionId: "A", floor: 2, category: "Furniture", priority: "Low", description: "Chair leg broken", status: "resolved", reportedAt: "2024-04-01", resolvedAt: "2024-04-01", resolutionHours: 4, resolutionNote: "Replaced chair" },
  { id: "TK004", ghId: "gh1", roomId: "rm104", sectionId: "A", floor: 1, category: "AC/HVAC", priority: "High", description: "AC not cooling", status: "resolved", reportedAt: "2024-03-30", resolvedAt: "2024-03-31", resolutionHours: 6, resolutionNote: "Gas refilled" },
  { id: "TK005", ghId: "gh1", roomId: "rm202", sectionId: "A", floor: 2, category: "Appliances", priority: "Medium", description: "TV remote not working", status: "resolved", reportedAt: "2024-03-29", resolvedAt: "2024-03-29", resolutionHours: 1, resolutionNote: "Remote replaced" },
];
