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
  'claude-opus-5-5': 37.2,
  'claude-opus-5': 46.75,
  'claude-sonnet-5': 18.7,
  'claude-haiku-4-5-20251001': 9.35,
  'claude-fable-5-1': 92.75,
  'no-such-model': 0,
}
for (const [model, usd] of Object.entries(want)) {
  assert.ok(Math.abs(costOf(model, u) - usd) < 1e-9, `${model}: ${costOf(model, u)} != ${usd}`)
}
assert.equal(costOf('claude-opus-5-5', {}), 0)
console.log('prices ok')
