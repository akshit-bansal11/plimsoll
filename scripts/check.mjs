// Self-check for the price table: node scripts/check.mjs
import assert from 'node:assert/strict'

import { costOf } from './prices.mjs'

const u = {
  input_tokens: 1e6,
  output_tokens: 1e6,
  cache_read_input_tokens: 1e6,
  cache_creation_input_tokens: 2e6,
  cache_creation: { ephemeral_1h_input_tokens: 1e6 },
}
const want = {
  'claude-opus-4-5-20251101': 46.75,
  'claude-3-5-haiku-20241022': 7.48,
  'claude-opus-5-5': 37.2,
  'claude-opus-5': 46.75,
  'claude-sonnet-5': 18.7,
  'claude-haiku-4-5-20251001': 9.35,
  'claude-fable-5-1': 92.75,
  'claude-sonnet-5-5': 18.6,
  'claude-haiku-5-5': 4.675,
  'us.anthropic.claude-opus-4-1-20250805-v1:0': 140.25,
  'claude-sonnet-4-5@20250929': 28.05,
  'claude-sonnet-4-20250514': 28.05,
  'no-such-model': 0,
}
for (const [model, usd] of Object.entries(want)) {
  assert.ok(Math.abs(costOf(model, u) - usd) < 1e-9, `${model}: ${costOf(model, u)} != ${usd}`)
}
// under 100,000 prompt tokens Haiku 5.5 stays on its base prices
assert.ok(Math.abs(costOf('claude-haiku-5-5', { input_tokens: 1000, output_tokens: 1000 }) - 0.0006) < 1e-12)
assert.equal(costOf('claude-opus-5-5', {}), 0)
console.log('prices ok')
