/**
 * seed.js — loads demo data into the store without needing a real Google Sheet.
 * Run: node seed.js  (then start the server)
 * Useful for hackathon demo if Sheets API isn't set up yet.
 */

const { setNeeds, addVolunteer } = require("./store");

const sampleNeeds = [
  {
    id: "need_demo_1",
    location_name: "Anna Nagar, Chennai",
    latitude: 13.0878,
    longitude: 80.2101,
    need_type: "Food distribution",
    description: "12 families without ration supplies after flooding",
    urgency: 1,
    urgency_label: "Critical",
    families_affected: 12,
    reported_date: "2026-04-10",
    status: "open",
  },
  {
    id: "need_demo_2",
    location_name: "Velachery, Chennai",
    latitude: 12.9815,
    longitude: 80.2180,
    need_type: "Medical camp assistance",
    description: "Need volunteers for mobile health screening camp",
    urgency: 2,
    urgency_label: "Moderate",
    families_affected: 40,
    reported_date: "2026-04-11",
    status: "open",
  },
  {
    id: "need_demo_3",
    location_name: "Tambaram, Chennai",
    latitude: 12.9249,
    longitude: 80.1000,
    need_type: "Tutoring",
    description: "Weekend literacy support for underprivileged students",
    urgency: 3,
    urgency_label: "Low",
    families_affected: 8,
    reported_date: "2026-04-09",
    status: "open",
  },
  {
    id: "need_demo_4",
    location_name: "Royapuram, Chennai",
    latitude: 13.1143,
    longitude: 80.2961,
    need_type: "Logistics",
    description: "Transport relief materials to flood-affected fishing community",
    urgency: 1,
    urgency_label: "Critical",
    families_affected: 25,
    reported_date: "2026-04-10",
    status: "open",
  },
  {
    id: "need_demo_5",
    location_name: "Adyar, Chennai",
    latitude: 13.0012,
    longitude: 80.2565,
    need_type: "Counseling",
    description: "Mental health support sessions for disaster-affected residents",
    urgency: 2,
    urgency_label: "Moderate",
    families_affected: 15,
    reported_date: "2026-04-11",
    status: "open",
  },
];

const sampleVolunteers = [
  {
    name: "Priya Subramaniam",
    phone: "+919876543210",
    skills: ["food distribution", "cooking"],
    latitude: 13.0820,
    longitude: 80.2100,
    availability: "available",
    language: "ta",
  },
  {
    name: "Arjun Mehta",
    phone: "+919876543211",
    skills: ["first aid", "medical", "nursing"],
    latitude: 12.9900,
    longitude: 80.2200,
    availability: "available",
    language: "en",
  },
  {
    name: "Lakshmi Rajan",
    phone: "+919876543212",
    skills: ["tutoring", "education", "teaching"],
    latitude: 12.9300,
    longitude: 80.1100,
    availability: "scheduled",
    language: "ta",
  },
  {
    name: "Vikram Nair",
    phone: "+919876543213",
    skills: ["logistics", "transport", "driving"],
    latitude: 13.1000,
    longitude: 80.2900,
    availability: "available",
    language: "en",
  },
  {
    name: "Meena Chandrasekaran",
    phone: "+919876543214",
    skills: ["counseling", "social work", "mental health"],
    latitude: 13.0100,
    longitude: 80.2600,
    availability: "available",
    language: "hi",
  },
];

setNeeds(sampleNeeds);
sampleVolunteers.forEach(addVolunteer);

console.log(`✅ Seeded ${sampleNeeds.length} needs and ${sampleVolunteers.length} volunteers`);
console.log("Now run: node index.js");
