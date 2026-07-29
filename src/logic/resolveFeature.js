import {
  ACCOUNTS,
  SPENDING_CATEGORIES,
  GOALS,
  BUDGET_CATEGORIES,
  INVESTMENT_STRATEGY,
  BILLS,
  RECENT_TRANSFERS,
  formatCurrency,
} from './fintechData'

// Given a landmark category and (optionally) a specific sub-feature id,
// returns the real content to display when that moon "fills the hub".

export function resolveSubFeature(categoryId, subFeatureId) {
  if (categoryId === 'accounts') {
    const acc = ACCOUNTS.find((a) => a.id === subFeatureId)
    if (!acc) return null
    return { title: acc.name, detail: formatCurrency(acc.balance) }
  }

  if (categoryId === 'spending') {
    const cat = SPENDING_CATEGORIES.find((c) => c.id === subFeatureId)
    if (!cat) return null
    const lines = cat.transactions.map((t) => `${t.label} \u00b7 ${formatCurrency(t.amount)}`).join('\n')
    return { title: cat.label, detail: `${formatCurrency(cat.amount)} this month`, extra: lines }
  }

  if (categoryId === 'goals') {
    const goal = GOALS.find((g) => g.id === subFeatureId)
    if (!goal) return null
    const pct = Math.round((goal.current / goal.target) * 100)
    return { title: goal.name, detail: `${formatCurrency(goal.current)} of ${formatCurrency(goal.target)} \u2014 ${pct}%` }
  }

  if (categoryId === 'budget') {
    const b = BUDGET_CATEGORIES.find((c) => c.id === subFeatureId)
    if (!b) return null
    const remaining = b.limit - b.spent
    return { title: b.label, detail: `${formatCurrency(b.spent)} of ${formatCurrency(b.limit)}`, extra: `${formatCurrency(remaining)} left this month` }
  }

  if (categoryId === 'investments') {
    const a = INVESTMENT_STRATEGY.allocations.find((x) => x.id === subFeatureId)
    if (!a) return null
    const pct = (a.growth * 100).toFixed(1)
    return { title: a.label, detail: `${formatCurrency(a.value)} \u00b7 ${a.growth >= 0 ? '+' : ''}${pct}%` }
  }

  if (categoryId === 'bills') {
    const b = BILLS.find((x) => x.id === subFeatureId)
    if (!b) return null
    return { title: b.label, detail: formatCurrency(b.amount), extra: b.dueLabel }
  }

  if (categoryId === 'transfers') {
    const t = RECENT_TRANSFERS.find((x) => x.id === subFeatureId)
    if (!t) return null
    return { title: t.label, detail: formatCurrency(t.amount), extra: t.date }
  }

  return null
}

// A general summary shown when the hub itself is called/entered without
// naming a particular moon.
export function resolveCategorySummary(categoryId) {
  if (categoryId === 'accounts') {
    const total = ACCOUNTS.reduce((sum, a) => sum + a.balance, 0)
    return { title: 'Accounts', detail: `${formatCurrency(total)} total across ${ACCOUNTS.length} accounts` }
  }
  if (categoryId === 'spending') {
    const total = SPENDING_CATEGORIES.reduce((sum, c) => sum + c.amount, 0)
    return { title: 'Spending', detail: `${formatCurrency(total)} this month` }
  }
  if (categoryId === 'goals') {
    return { title: 'Goals', detail: `${GOALS.length} goals in progress` }
  }
  if (categoryId === 'budget') {
    const totalLimit = BUDGET_CATEGORIES.reduce((sum, b) => sum + b.limit, 0)
    const totalSpent = BUDGET_CATEGORIES.reduce((sum, b) => sum + b.spent, 0)
    return { title: 'Budget', detail: `${formatCurrency(totalSpent)} of ${formatCurrency(totalLimit)} allotted` }
  }
  if (categoryId === 'investments') {
    return { title: 'Investments', detail: `${formatCurrency(INVESTMENT_STRATEGY.totalValue)} total portfolio` }
  }
  if (categoryId === 'bills') {
    const total = BILLS.reduce((sum, b) => sum + b.amount, 0)
    return { title: 'Bills', detail: `${formatCurrency(total)} due across ${BILLS.length} bills` }
  }
  if (categoryId === 'transfers') {
    return { title: 'Transfers', detail: `${RECENT_TRANSFERS.length} recent transfers` }
  }
  return null
}
