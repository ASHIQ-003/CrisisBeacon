/**
 * seed.js — Demo data for CrisisBeacon hackathon demo.
 */
const { setStaff, setVenue } = require('./store');

const demoStaff = [
  { id: 'staff_1', name: 'Rajesh Kumar', role: 'security', floor: 'Floor 1', status: 'available', phone: '+919800000001', crises_handled: 8 },
  { id: 'staff_2', name: 'Anitha Devi', role: 'medical', floor: 'Floor 2', status: 'available', phone: '+919800000002', crises_handled: 12 },
  { id: 'staff_3', name: 'Mohammed Ali', role: 'maintenance', floor: 'Floor 1', status: 'available', phone: '+919800000003', crises_handled: 5 },
  { id: 'staff_4', name: 'Priya Sharma', role: 'security', floor: 'Floor 3', status: 'available', phone: '+919800000004', crises_handled: 15 },
  { id: 'staff_5', name: 'David Chen', role: 'management', floor: 'Floor 1', status: 'available', phone: '+919800000005', crises_handled: 20 },
  { id: 'staff_6', name: 'Fatima Begum', role: 'medical', floor: 'Floor 4', status: 'available', phone: '+919800000006', crises_handled: 7 },
  { id: 'staff_7', name: 'Vikram Patel', role: 'security', floor: 'Floor 2', status: 'available', phone: '+919800000007', crises_handled: 3 },
  { id: 'staff_8', name: 'Sunita Reddy', role: 'maintenance', floor: 'Floor 3', status: 'available', phone: '+919800000008', crises_handled: 6 },
];

const demoVenue = {
  name: 'Grand Horizon Hotel & Convention Center',
  address: '120 Marina Boulevard, Chennai - 600001',
  floors: ['Lobby', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Rooftop'],
  rooms_per_floor: 20,
  areas: {
    'Lobby': ['Reception', 'Lounge', 'Restaurant', 'Bar', 'Pool Area', 'Parking'],
    'Floor 1': ['Room 101-120', 'Conference Hall A', 'Business Center', 'Gym'],
    'Floor 2': ['Room 201-220', 'Conference Hall B', 'Spa', 'Laundry'],
    'Floor 3': ['Room 301-320', 'Banquet Hall', 'Kitchen', 'Staff Room'],
    'Floor 4': ['Room 401-420', 'Presidential Suite', 'Private Dining'],
    'Floor 5': ['Room 501-520', 'Executive Lounge'],
    'Rooftop': ['Sky Bar', 'Helipad', 'Garden Terrace'],
  },
};

setStaff(demoStaff);
setVenue(demoVenue);

console.log(`✅ Seeded ${demoStaff.length} staff members for "${demoVenue.name}"`);

module.exports = { demoStaff, demoVenue };
