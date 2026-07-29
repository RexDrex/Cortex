import { LANDMARKS } from './landmarks'

// Matches a stated intent to {categoryId, subFeatureId | null}. subFeatureId
// is null when the user named a category generally ("show my spending")
// without naming a specific moon — in that case the hub is reached but
// nothing specific fills it yet, leaving the moons free to explore.

export function matchVoidIntent(text) {
  const lower = text.toLowerCase()

  for (const lm of LANDMARKS) {
    // Check sub-features first — more specific match wins even if the
    // category keyword isn't also present ("show me my laptop goal").
    for (const sf of lm.subFeatures) {
      if (sf.keywords.some((k) => lower.includes(k))) {
        return { categoryId: lm.id, subFeatureId: sf.id }
      }
    }
  }

  for (const lm of LANDMARKS) {
    if (lm.keywords.some((k) => lower.includes(k))) {
      return { categoryId: lm.id, subFeatureId: null }
    }
  }

  return null
}
