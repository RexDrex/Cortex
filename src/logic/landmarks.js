// Surface-layer landmarks — each is an Orbit feature: a large central hub
// with rotating rings carrying orbiting sub-feature "moons". Positions are
// hand-scattered across a vast landscape rather than evenly spaced on a
// circle — varied distance, varied angle, irregular spacing — so the
// space reads as an open landscape to explore, not a menu arranged in a
// ring. This is the single source of truth for what exists in the Void.

const RAW = [
  {
    id: 'accounts',
    label: 'Accounts',
    color: '#7f5af0',
    x: 60,
    z: -230,
    intro: 'Your accounts, orbiting this hub. Walk the rings or call one by name.',
    keywords: ['account', 'balance', 'checking', 'savings', 'credit', 'card'],
    subFeatures: [
      { id: 'checking', label: 'Checking', keywords: ['checking'] },
      { id: 'savings', label: 'Savings', keywords: ['savings'] },
      { id: 'credit', label: 'Credit Card', keywords: ['credit'] },
    ],
  },
  {
    id: 'spending',
    label: 'Spending',
    color: '#2cb1bc',
    x: -190,
    z: -90,
    intro: 'Where your money went this month, broken into categories orbiting here.',
    keywords: ['spending', 'spend', 'spent', 'expenses', 'category', 'categories'],
    subFeatures: [
      { id: 'food', label: 'Food & Dining', keywords: ['food', 'dining', 'restaurant'] },
      { id: 'transport', label: 'Transport', keywords: ['transport', 'ride', 'fuel'] },
      { id: 'data', label: 'Data & Airtime', keywords: ['data', 'airtime', 'phone bill'] },
      { id: 'entertainment', label: 'Entertainment', keywords: ['entertainment', 'netflix', 'movie'] },
    ],
  },
  {
    id: 'goals',
    label: 'Goals',
    color: '#f2b84c',
    x: 255,
    z: 30,
    intro: 'Everything you\u2019re saving toward, each goal a moon on these rings.',
    keywords: ['goal', 'saving for', 'progress'],
    subFeatures: [
      { id: 'new-laptop', label: 'New Laptop', keywords: ['laptop'] },
      { id: 'emergency-fund', label: 'Emergency Fund', keywords: ['emergency'] },
      { id: 'japan-trip', label: 'Japan Trip', keywords: ['japan', 'trip'] },
    ],
  },
  {
    id: 'budget',
    label: 'Budget',
    color: '#9b7bff',
    x: -70,
    z: 220,
    intro: 'How much you\u2019ve allowed yourself in each category, and what\u2019s left.',
    keywords: ['budget', 'limit', 'allowance'],
    subFeatures: [
      { id: 'food', label: 'Food & Dining', keywords: ['food'] },
      { id: 'transport', label: 'Transport', keywords: ['transport'] },
      { id: 'entertainment', label: 'Entertainment', keywords: ['entertainment'] },
      { id: 'savings', label: 'Savings Contribution', keywords: ['savings contribution'] },
    ],
  },
  {
    id: 'investments',
    label: 'Investments',
    color: '#4fd6c8',
    x: -275,
    z: 120,
    intro: 'Your portfolio, each holding a moon of its own \u2014 the richest hub here.',
    keywords: ['invest', 'investment', 'portfolio', 'stocks'],
    subFeatures: [
      { id: 'index', label: 'Index Fund', keywords: ['index'] },
      { id: 'bonds', label: 'Bonds', keywords: ['bonds'] },
      { id: 'reserve', label: 'Cash Reserve', keywords: ['reserve', 'cash'] },
    ],
  },
  {
    id: 'bills',
    label: 'Bills',
    color: '#ff8fa3',
    x: 150,
    z: 260,
    intro: 'What\u2019s due, and when \u2014 walk up to any bill to see it.',
    keywords: ['bill', 'bills', 'due'],
    subFeatures: [
      { id: 'electricity', label: 'Electricity', keywords: ['electricity', 'power'] },
      { id: 'internet', label: 'Internet', keywords: ['internet', 'wifi'] },
      { id: 'phone', label: 'Phone', keywords: ['phone bill'] },
    ],
  },
  {
    id: 'transfers',
    label: 'Transfers',
    color: '#ffcf7f',
    x: 300,
    z: -150,
    intro: 'Money you\u2019ve sent recently, each transfer a moon in its own right.',
    keywords: ['transfer', 'send money', 'sent'],
    subFeatures: [
      { id: 't1', label: 'To Chidinma', keywords: ['chidinma'] },
      { id: 't2', label: 'To Landlord', keywords: ['landlord'] },
      { id: 't3', label: 'To Emeka', keywords: ['emeka'] },
    ],
  },
]

// Distances range roughly 33-67 units, angles irregular — a scattered
// landscape, not a ring. Kept as explicit x/z rather than angle/distance
// so placement stays exactly hand-tuned.
export const LANDMARKS = RAW

export function landmarkPosition(lm) {
  return [lm.x, 0, lm.z]
}

export function getLandmark(id) {
  return LANDMARKS.find((l) => l.id === id) || null
}

// Ring adjacency for feature-to-feature travel. The 7 landmarks are
// treated as sitting around one irregular ring in array order — not
// evenly spaced, but each has exactly two neighbors along that ring.
// This is a traversal relationship, not a claim about visual placement:
// the landmarks stay hand-scattered in the Void as they already are.
export function neighborsOf(id) {
  const idx = LANDMARKS.findIndex((l) => l.id === id)
  if (idx === -1) return []
  const prev = LANDMARKS[(idx - 1 + LANDMARKS.length) % LANDMARKS.length]
  const next = LANDMARKS[(idx + 1) % LANDMARKS.length]
  return [prev, next]
}
