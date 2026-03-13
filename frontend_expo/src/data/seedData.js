// src/data/seedData.js

export const INITIAL_LISTINGS = [
  {
    id: 'L001',
    donorName: 'Arjun Sharma',
    donorEmail: 'arjun@donor.com',
    foodType: 'Chicken Biryani',
    quantity: 30,
    unit: 'portions',
    preparedTime: '2026-03-08T09:00',
    expiryTime: '2026-03-08T20:00',
    location: '12, MG Road, Hyderabad',
    pickupAvailable: true,
    status: 'active',        // active | claimed | picked_up | delivered | expired
    claimedBy: null,         // NGO email
    claimedByName: null,
    deliveryId: null,        // Delivery email
    deliveryName: null,
    photo: null,
    notes: 'Freshly cooked, well packed in containers.',
  },
  {
    id: 'L002',
    donorName: 'Arjun Sharma',
    donorEmail: 'arjun@donor.com',
    foodType: 'Veg Pulao + Raita',
    quantity: 15,
    unit: 'portions',
    preparedTime: '2026-03-08T08:00',
    expiryTime: '2026-03-08T17:00',
    location: '88, Jubilee Hills, Hyderabad',
    pickupAvailable: true,
    status: 'active',
    claimedBy: null,
    claimedByName: null,
    deliveryId: null,
    deliveryName: null,
    photo: null,
    notes: 'Includes raita and papad.',
  },
  {
    id: 'L003',
    donorName: 'Priya Kapoor',
    donorEmail: 'priya@donor.com',
    foodType: 'Bread & Pastries',
    quantity: 8,
    unit: 'kg',
    preparedTime: '2026-03-08T06:00',
    expiryTime: '2026-03-08T15:00',
    location: '5, Banjara Hills, Hyderabad',
    pickupAvailable: false,
    status: 'active',
    claimedBy: null,
    claimedByName: null,
    deliveryId: null,
    deliveryName: null,
    photo: null,
    notes: '',
  },
];

export const INITIAL_RATINGS = {
  'arjun@donor.com': [
    { id: 1, reviewer: 'Hope NGO',       role: 'ngo',      rating: 5, comment: 'Fresh and accurate quantity!',       date: 'Mar 5'  },
    { id: 2, reviewer: 'Delivery - Ravi', role: 'delivery', rating: 5, comment: 'Well packed and easy to find.',      date: 'Feb 28' },
  ],
  'ravi@delivery.com': [
    { id: 1, reviewer: 'Hope NGO',        role: 'ngo', rating: 5, comment: 'On time and handled with care.',         date: 'Mar 5'  },
    { id: 2, reviewer: 'GreenHands NGO',  role: 'ngo', rating: 4, comment: 'Good delivery, slight delay.',           date: 'Feb 20' },
  ],
};

export const DONOR_LEADERBOARD = [
  { rank: 1, name: 'Arjun Sharma', email: 'arjun@donor.com', meals: 340, badge: '🏆' },
  { rank: 2, name: 'Ananya S.',    email: 'a@d.com',          meals: 290, badge: '🥈' },
  { rank: 3, name: 'Priya Kapoor', email: 'priya@donor.com',  meals: 210, badge: '🥉' },
  { rank: 4, name: 'Rajan M.',     email: 'r@d.com',          meals: 180, badge: ''   },
];

export const DELIVERY_LEADERBOARD = [
  { rank: 1, name: 'Ravi K.',   email: 'ravi@delivery.com', deliveries: 87, badge: '🏆' },
  { rank: 2, name: 'Suresh T.', email: 's@d.com',           deliveries: 64, badge: '🥈' },
  { rank: 3, name: 'Meena R.',  email: 'm@d.com',           deliveries: 51, badge: '🥉' },
  { rank: 4, name: 'Imran A.',  email: 'i@d.com',           deliveries: 38, badge: ''   },
];

// Demo accounts — maps email → { name, role, status }
export const DEMO_ACCOUNTS = {
  'arjun@donor.com':    { name: 'Arjun Sharma', role: 'donor',    status: 'approved' },
  'priya@donor.com':    { name: 'Priya Kapoor',  role: 'donor',    status: 'approved' },
  'hope@ngo.com':       { name: 'Hope NGO',       role: 'ngo',      status: 'approved' },
  'green@ngo.com':      { name: 'GreenHands NGO', role: 'ngo',      status: 'pending'  },
  'ravi@delivery.com':  { name: 'Ravi Kumar',     role: 'delivery', status: 'approved' },
  'bad@delivery.com':   { name: 'Bad Actor',      role: 'delivery', status: 'rejected' },
};