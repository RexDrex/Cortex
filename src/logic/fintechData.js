// Mock financial data for the hackathon demo. No real accounts, no real
// money — realistic enough (Naira-scale, real merchant flavor) that
// whatever a judge asks for, something rich and real-feeling appears.

export const CURRENCY = '\u20a6'

export function formatCurrency(n) {
  const sign = n < 0 ? '-' : ''
  return `${sign}${CURRENCY}${Math.abs(n).toLocaleString('en-NG')}`
}

export const ACCOUNTS = [
  { id: 'checking', name: 'Everyday Checking', balance: 84217 },
  { id: 'savings', name: 'High-Yield Savings', balance: 312050 },
  { id: 'credit', name: 'Rewards Card', balance: -18642 },
]

export const SPENDING_CATEGORIES = [
  {
    id: 'food',
    label: 'Food & Dining',
    amount: 73350,
    transactions: [
      { id: 't1', label: 'Jollof Spot', amount: 1850, date: 'Jul 21' },
      { id: 't2', label: 'Market Run', amount: 4210, date: 'Jul 18' },
      { id: 't3', label: 'Chicken Republic', amount: 1275, date: 'Jul 14' },
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    amount: 24700,
    transactions: [
      { id: 't4', label: 'Bolt Rides', amount: 6120, date: 'Jul 20' },
      { id: 't5', label: 'Fuel', amount: 3500, date: 'Jul 12' },
    ],
  },
  {
    id: 'data',
    label: 'Data & Airtime',
    amount: 12800,
    transactions: [
      { id: 't6', label: 'MTN Data Plan', amount: 2800, date: 'Jul 19' },
      { id: 't7', label: 'Airtime Top-up', amount: 2000, date: 'Jul 9' },
    ],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    amount: 15900,
    transactions: [
      { id: 't8', label: 'Netflix', amount: 1599, date: 'Jul 15' },
      { id: 't9', label: 'Cinema', amount: 2200, date: 'Jul 10' },
      { id: 't10', label: 'Spotify', amount: 900, date: 'Jul 3' },
    ],
  },
]

export const GOAL = {
  name: 'New Laptop',
  target: 450000,
  current: 268000,
}

export const GOALS = [
  { id: 'new-laptop', name: 'New Laptop', target: 450000, current: 268000 },
  { id: 'emergency-fund', name: 'Emergency Fund', target: 600000, current: 210000 },
  { id: 'japan-trip', name: 'Japan Trip', target: 1800000, current: 540000 },
]

export const BUDGET_CATEGORIES = [
  { id: 'food', label: 'Food & Dining', spent: 73350, limit: 85000 },
  { id: 'transport', label: 'Transport', spent: 24700, limit: 30000 },
  { id: 'data', label: 'Data & Airtime', spent: 12800, limit: 15000 },
  { id: 'entertainment', label: 'Entertainment', spent: 15900, limit: 20000 },
  { id: 'savings', label: 'Savings Contribution', spent: 50000, limit: 50000 },
]

export const BILLS = [
  { id: 'electricity', label: 'Electricity', amount: 12400, dueLabel: 'Due in 4 days' },
  { id: 'internet', label: 'Internet', amount: 8500, dueLabel: 'Due in 9 days' },
  { id: 'phone', label: 'Phone', amount: 4200, dueLabel: 'Due in 12 days' },
]

export const RECENT_TRANSFERS = [
  { id: 't1', label: 'To Chidinma', amount: 15000, date: 'Jul 22' },
  { id: 't2', label: 'To Landlord', amount: 85000, date: 'Jul 18' },
  { id: 't3', label: 'To Emeka', amount: 5000, date: 'Jul 11' },
]

export const INVESTMENT_STRATEGY = {
  totalValue: 485000,
  allocations: [
    { id: 'index', label: 'Index Fund', value: 260000, growth: 0.084 },
    { id: 'bonds', label: 'Bonds', value: 120000, growth: 0.031 },
    { id: 'savings', label: 'High-Yield Savings', value: 85000, growth: 0.045 },
    { id: 'reserve', label: 'Cash Reserve', value: 20000, growth: 0 },
  ],
}
