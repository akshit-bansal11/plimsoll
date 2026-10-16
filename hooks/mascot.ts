// Pixel-art frames for the cat, and how it reacts to the pointer. Pure: no
// imports, so the cat's surface module, the hooks module and tests all load it.
//
// A sprite is a grid of ink letters ('.' is see-through). Frames are drawn on a
// canvas MASCOT_WIDTH pixels across and MASCOT_ROWS * 2 down; `cells` folds each
// pair of pixel rows into one terminal row of half blocks, top pixel in the
// foreground and bottom pixel in the background, so every pixel is square.
export type Mood = 'idle' | 'working' | 'sleeping' | 'alarm'
export const MASCOT_WIDTH = 20
export const MASCOT_ROWS = 5
export const MASCOT_TICK_MS = 300
// Ticks with no turn and no touch before an idle cat curls up: five minutes.
export const SLEEP_TICKS = Math.round((5 * 60_000) / MASCOT_TICK_MS)
export type Pose = { pixels: string[]; caption: string }
export type Run = { text: string; color?: string; backgroundColor?: string }

export const INK: Record<string, string> = {
  O: '#E8924A', // fur
  D: '#B5612B', // stripes, closed eyes
  L: '#F7DDB8', // cream muzzle, chest, paws
  P: '#F49AB0', // nose, inner ears, tongue, blush
  G: '#9BE564', // iris
  K: '#1E1A17', // pupil, open mouth
  W: '#9A9A9A', // whiskers
  R: '#F43F5E', // heart, alarm
  Y: '#A78BFA', // yarn
  y: '#7C5CD6', // yarn shade
  Z: '#CBD5E1', // snore
  N: '#7DD3FC', // music note
  M: '#94A3B8', // laptop body
  m: '#475569', // laptop bezel
  S: '#38BDF8', // screen glow
  s: '#0C4A6E', // screen
}
export const CAPTION_INK = '#94A3B8'

type Sprite = string[]
type Part = [Sprite, number, number]
// A step is a pose that depends on the global tick, so the tail keeps swishing between acts.
type Step = (t: number) => Pose
// Each eye is two pixels across and two down: the left eye's rows, then the right eye's.
type Eyes = [string, string, string, string]
type Paws = 'sit' | 'stepA' | 'stepB' | 'wave' | 'lick' | 'bat'
type Look = {
  eyes?: Eyes
  paws?: Paws
  ears?: 'up' | 'twitch' | 'flat'
  tail?: number | 'none' | 'puff'
  mouth?: 'tongue' | 'hiss'
  blush?: boolean
}

const H = MASCOT_ROWS * 2

// Sitting, facing front: 13 across, 10 down, centred on x6. The eyes, paws and
// tail are overlays.
const BODY: Sprite = [
  '..D.......D..',
  '..OP.....PO..',
  '.OOODODODOOO.',
  '.OO..OOO..OO.',
  '.OO..OPO..OO.',
  'WWOLLLLLLLOWW',
  '..OOLLLLLOO..',
  '..OOOLLLOODO.',
  '..ODOLLLODOO.',
  '..O..OOO..OO.',
]
const EAR_TWITCH: Sprite = ['..........D..', '...O.....PO..']
const EAR_FLAT: Sprite = ['.............', 'DOO.......OOD']
const EYE_X = [3, 8] as const
const EYE_Y = 3

const OPEN: Eyes = ['GK', 'GK', 'KG', 'KG']
const LEFT: Eyes = ['KG', 'KG', 'KG', 'KG']
const RIGHT: Eyes = ['GK', 'GK', 'GK', 'GK']
const BLINK: Eyes = ['OO', 'DD', 'OO', 'DD']
const HAPPY: Eyes = ['DD', 'OO', 'DD', 'OO']
const WIDE: Eyes = ['GG', 'GK', 'GG', 'KG']
const SQUINT: Eyes = ['DD', 'GK', 'DD', 'KG']

const PAWS: Record<Paws, Part[]> = {
  sit: [[['LL...LL'], 3, 9]],
  stepA: [[['LL'], 3, 8], [['.....LL'], 3, 9]],
  stepB: [[['LL'], 3, 9], [['LL'], 8, 8]],
  wave: [[['LL', 'DO', '.D'], -1, 1], [['.....LL'], 3, 9]],
  lick: [[['LL.', 'OOD', '.OO'], 7, 4], [['LL'], 3, 9]],
  bat: [[['LL'], 3, 9], [['LL', 'O.'], 12, 7]],
}

// Tail frames, drawn from the right hip; index 1 is the resting curl.
const TAILS: Sprite[] = [
  ['...OO', '...O.', '..OO.', 'OOO..'],
  ['....', '..OO', '..O.', 'OOO.'],
  ['..O.', '..O.', '..O.', 'OOO.'],
  ['....O', '...O.', '..O..', 'OOO..'],
]
// Bristled straight up in fright, from the hip.
const TAIL_PUFF: Sprite = ['.O.O', '..O.', '.OOO', '..O.', '.OOO', '..O.', 'OO..']
const SWISH = [1, 0, 1, 2, 1, 3]

const HEART: Sprite = ['R.R', 'RRR', '.R.']
const NOTE: Sprite = ['.NN', '.N.', 'NN.', 'NN.']
const YARN: Sprite = ['.YY.', 'YyYY', 'YYyY', '.YY.']
// A diagonal one pixel thick reads as an I at this size; these are two thick.
const Z_BIG: Sprite = ['ZZZZ', '..ZZ', '.ZZ.', 'ZZZZ']
const Z_SMALL: Sprite = ['ZZZ', '.ZZ', 'ZZ.', 'ZZZ']
const BANG: Sprite = ['R', 'R', 'R', '.', 'R']

const LAPTOP: Sprite = [
  'mmmmmm',
  'mssssm',
  'mssssm',
  'mmmmmm',
  'MMMMMMM',
]
// Lines of code scrolling on the screen, two rows of four pixels.
const CODE = ['SS.S', '.SSS', 'S...', 'SSS.', 'S.SS', '.S..']

// Curled up, chin down, tail wrapped along the floor: 17 across, 6 down.
const LOAF: Sprite = [
  '.D.....D.........',
  '.OP...PO...OOOO..',
  'OOODODOOOOODOODOO',
  'ODDOOODDOODOODOOO',
  'WOOOPOOOOOOOOOOOO',
  'LLLLLLLOOOOOOOOOO',
]
// Breathing in: the back rises a pixel above the loaf's line.
const BREATH: Sprite = ['...........OOOO..']

const blank = (): string[] => Array.from({ length: H }, () => '.'.repeat(MASCOT_WIDTH))

// Writes the sprite's inked pixels onto the canvas; anything off the edge is
// clipped, so a sprite can walk out of view without breaking the width rule.
const stamp = (canvas: string[], sprite: Sprite, x: number, y: number): string[] =>
  canvas.map((line, r) => {
    const s = sprite[r - y]
    if (s === undefined) return line
    return [...line].map((ch, c) => {
      const p = s[c - x]
      return p === undefined || p === '.' ? ch : p
    }).join('')
  })

const scene = (caption: string, ...parts: Part[]): Pose => ({
  pixels: parts.reduce((canvas, [s, x, y]) => stamp(canvas, s, x, y), blank()),
  caption,
})

const cat = (t: number, x: number, o: Look = {}): Part[] => {
  const { eyes = OPEN, paws = 'sit', ears = 'up', tail = SWISH[(t >> 1) % SWISH.length] ?? 1 } = o
  const [l1, l2, r1, r2] = eyes
  const top = ears === 'flat' ? EAR_FLAT : ears === 'twitch' ? EAR_TWITCH : BODY.slice(0, 2)
  const body: Part[] = [
    [[...top, ...BODY.slice(2)], x, 0],
    [[l1, l2], x + EYE_X[0], EYE_Y],
    [[r1, r2], x + EYE_X[1], EYE_Y],
    ...PAWS[paws].map(([s, px, py]): Part => [s, x + px, py]),
  ]
  if (o.mouth === 'tongue') body.push([['P'], x + 6, 6])
  if (o.mouth === 'hiss') body.push([['LKL'], x + 5, 5])
  if (o.blush) body.push([['P'], x + 2, 4], [['P'], x + 10, 4])
  if (tail === 'puff') body.unshift([TAIL_PUFF, x + 10, 3])
  else if (tail !== 'none') body.unshift([TAILS[tail] ?? [], x + 10, 6])
  return body
}

const pose = (x: number, o: Look = {}, caption = '', ...extra: Part[]): Step =>
  t => scene(caption, ...cat(t, x, o), ...extra)

const stand = (x: number, ticks: number, caption = ''): Step[] =>
  Array.from({ length: ticks }, () => pose(x, {}, caption))

const blink = (x: number): Step[] => [pose(x, { eyes: BLINK }), pose(x)]

const twitch = (x: number): Step[] => [pose(x, { ears: 'twitch' }), pose(x), pose(x, { ears: 'twitch' }), pose(x)]

const look = (x: number): Step[] =>
  [LEFT, LEFT, LEFT, OPEN, RIGHT, RIGHT, RIGHT, OPEN].map(eyes => pose(x, { eyes }))

// One pixel a tick, paws alternating, eyes on where it is going.
const walk = (from: number, to: number): Step[] => {
  const dir = Math.sign(to - from)
  return Array.from({ length: Math.abs(to - from) }, (_, i) =>
    pose(from + dir * (i + 1), { eyes: dir > 0 ? RIGHT : LEFT, paws: i % 2 === 0 ? 'stepA' : 'stepB' }),
  )
}

const wave = (x: number): Step[] =>
  Array.from({ length: 6 }, (_, i) => pose(x, { eyes: HAPPY, paws: i % 2 === 0 ? 'wave' : 'sit' }, 'hi!'))

const groom = (x: number): Step[] =>
  Array.from({ length: 6 }, (_, i) => pose(x, { eyes: BLINK, paws: 'lick', ...(i % 2 === 0 ? { mouth: 'tongue' } : {}) }, '*lick lick*'))

// Two hearts rising beside the cat, out of step with each other.
const hearts = (x: number, i: number): Part[] => {
  const y = 6 - (i % 4) * 2
  return [[HEART, x + 13, y], [HEART, x + 16, (y + 4) % 8]]
}

const love = (x: number): Step[] =>
  Array.from({ length: 6 }, (_, i) => pose(x, { eyes: HAPPY, blush: true }, 'purr...', ...hearts(x, i)))

// Two notes bob beside it on the beat while its paws step in place.
const dance = (x: number, ticks: number): Step[] =>
  Array.from({ length: ticks }, (_, i) => {
    const up = i % 2 === 0
    return pose(x, { eyes: HAPPY, paws: up ? 'stepA' : 'stepB' }, '~ la la ~', [NOTE, x + 14, up ? 0 : 1], [NOTE, x + 17, up ? 4 : 3])
  })

// The yarn rolls in from the right; the cat watches it, then bats it away.
const yarn = (x: number): Step[] => [
  ...[20, 19, 18, 17, 16, 15, 14].map(yx => pose(x, { eyes: RIGHT }, '', [YARN, yx, 6])),
  ...Array.from({ length: 3 }, () => pose(x, { eyes: RIGHT }, '...!', [YARN, 14, 6])),
  pose(x, { eyes: RIGHT, paws: 'bat', tail: 'none' }, '*bat!*', [YARN, 14, 6]),
  ...[15, 16, 18, 20].map(yx => pose(x, { eyes: HAPPY, paws: 'bat', tail: 'none' }, '*bat!*', [YARN, yx, 6])),
]

const acts: Step[] = [
  ...stand(0, 6), ...blink(0), ...stand(0, 4), ...twitch(0), ...stand(0, 3), ...look(0), ...stand(0, 3),
  ...walk(0, 3), ...stand(3, 2), ...wave(3), ...stand(3, 3), ...walk(3, 0), ...stand(0, 3), ...blink(0),
  ...yarn(0), ...stand(0, 3), ...groom(0), ...stand(0, 4), ...blink(0), ...stand(0, 3),
  ...love(0), ...stand(0, 3), ...dance(0, 12), ...stand(0, 3), ...look(0), ...twitch(0), ...stand(0, 4),
]

// Padded to a multiple of the tail's swish cycle so the loop closes on a sitting cat.
const cycle = SWISH.length * 2
const idle: Pose[] = [...acts, ...stand(0, cycle - (acts.length % cycle))].map((step, t) => step(t))

const DOTS = ['working', 'working.', 'working..', 'working...']

const typing = (i: number, eyes: Eyes): Pose =>
  scene(
    DOTS[(i >> 1) % 4] ?? '',
    ...cat(i, 0, { eyes, paws: i % 2 === 0 ? 'stepA' : 'stepB', tail: 'none' }),
    [LAPTOP, 13, 5],
    [[0, 1].map(r => (CODE[(i + r) % CODE.length] ?? '').replace(/\./g, 's')), 14, 6],
    [['LL'], i % 2 === 0 ? 12 : 13, 8],
  )

const working: Pose[] = Array.from({ length: 48 }, (_, i) => typing(i, i % 16 >= 14 ? BLINK : RIGHT))

// A z grows as it drifts up and right; a second trails two stages behind.
const DRIFT: Part[] = [[Z_SMALL, 10, 1], [Z_SMALL, 12, 0], [Z_BIG, 15, 0], [Z_BIG, 16, 0]]

// Breathes every 4 ticks.
const sleeping: Pose[] = Array.from({ length: 48 }, (_, i) => {
  const stage = Math.floor((i % 12) / 3)
  const zs = [stage, stage - 2].map(s => DRIFT[s]).filter((z): z is Part => z !== undefined)
  const breath: Part[] = Math.floor(i / 4) % 2 === 1 ? [[BREATH, 1, 4]] : []
  return scene('zzz...', [LOAF, 1, 4], ...breath, ...zs)
})

// Fur up, eyes wide, shaking side to side under a flashing warning.
const SHAKE = [0, 1, 0, -1]

const alarm: Pose[] = Array.from({ length: 16 }, (_, i) => {
  const x = 1 + (SHAKE[i % 4] ?? 0)
  const bang: Part[] = i % 4 < 2 ? [[BANG, 17, 1]] : []
  return scene((i >> 1) % 2 === 0 ? '!! LIMIT !!' : '', ...cat(i, x, { eyes: WIDE, tail: 'puff' }), ...bang)
})

const scripts: Record<Mood, Pose[]> = { idle, working, sleeping, alarm }
const fallback = scene('', ...cat(0, 0))

export const mascot = (mood: Mood, frame: number): Pose => {
  const script = scripts[mood]
  return script[frame % script.length] ?? fallback
}

// ---- Play: what the pointer is doing to the cat, in pixels and ticks. ----

/** A pointer event over the cat's region, in cells, as the surface reports it. */
export type Touch = { type: 'down' | 'move' | 'up' | 'enter' | 'leave'; x: number; y: number; button?: string }

export type Play = {
  /** Where the hovering pointer is, in pixels; absent while it is away. */
  gaze?: [number, number]
  /** The press in progress and how far it has been dragged, in cells. */
  press?: { x: number; y: number; moved: number }
  petUntil: number
  angryUntil: number
  /** Pokes in a row: each one soon after the last makes the cat crosser. */
  anger: number
  pokedAt: number
  /** The last tick anyone touched the cat: a touch wakes it. */
  touchedAt: number
}

export const PLAY: Play = { petUntil: -1, angryUntil: -1, anger: 0, pokedAt: -99, touchedAt: 0 }

// A drag this many cells long is a stroke, not a poke.
const STROKE = 2
// Pokes closer together than this, in ticks, keep the anger building.
const GRUDGE = 12

export const react = (p: Play, e: Touch, t: number): Play => {
  const gaze: [number, number] = [e.x, e.y * 2 + 1]
  if (e.type === 'leave') return { ...p, gaze: undefined }
  if (e.type === 'down') return { ...p, gaze, press: { x: e.x, y: e.y, moved: 0 }, touchedAt: t }
  if (e.type === 'up') {
    if (p.press === undefined) return p
    if (p.press.moved >= STROKE) return { ...p, press: undefined }
    const anger = t - p.pokedAt <= GRUDGE ? p.anger + 1 : 1
    return { ...p, press: undefined, anger, pokedAt: t, angryUntil: t + 6 + 2 * Math.min(anger, 3), petUntil: -1, touchedAt: t }
  }
  // A move or an enter: held, it strokes; otherwise the cat just watches.
  if (p.press !== undefined && e.button !== undefined) {
    const moved = p.press.moved + Math.abs(e.x - p.press.x) + Math.abs(e.y - p.press.y)
    if (moved < STROKE) return { ...p, gaze, press: { x: e.x, y: e.y, moved } }
    return { ...p, gaze, press: { x: e.x, y: e.y, moved }, petUntil: t + 5, angryUntil: -1, anger: 0, touchedAt: t }
  }
  return { ...p, gaze }
}

// Each pupil sits in the quarter of its eye nearest the pointer; a pointer on
// the face itself leaves the pupils turned in, which makes the cat cross-eyed.
const gazeEyes = (x: number, [gx, gy]: [number, number]): Eyes => {
  const row = gy < EYE_Y ? 0 : 1
  const eye = (ex: number, inward: 0 | 1): [string, string] => {
    const dx = gx - (x + ex + 0.5)
    const pupil = (dx < -1 ? 0 : dx > 1 ? 1 : inward) === 0 ? 'KG' : 'GK'
    return row === 0 ? [pupil, 'GG'] : ['GG', pupil]
  }
  return [...eye(EYE_X[0], 1), ...eye(EYE_X[1], 0)]
}

const ANGER: [string, Look][] = [
  ['hey!', { eyes: SQUINT, ears: 'flat' }],
  ['mrrrow!', { eyes: SQUINT, ears: 'flat', tail: 'puff' }],
  ['HSSSS!', { eyes: SQUINT, ears: 'flat', tail: 'puff', mouth: 'hiss' }],
]

/** The frame for this tick: the cat's own routine, unless someone is handling it. */
export const frameAt = (mood: Mood, t: number, p: Play): Pose => {
  if (t < p.angryUntil) {
    const [caption, look] = ANGER[Math.min(p.anger, ANGER.length) - 1] ?? ['', {}]
    const x = p.anger >= ANGER.length ? 1 + (SHAKE[t % 4] ?? 0) : 1
    return scene(caption, ...cat(t, x, look))
  }
  if (t < p.petUntil) {
    return scene('purrrr...', ...cat(t, 1, { eyes: HAPPY, blush: true, tail: SWISH[t % SWISH.length] ?? 1 }), ...hearts(1, t))
  }
  if (p.gaze !== undefined && mood === 'working') return typing(t, gazeEyes(0, p.gaze))
  // Hovered, an idle cat stops what it is doing and watches the pointer.
  if (p.gaze !== undefined && mood === 'idle') return scene('?', ...cat(t, 1, { eyes: gazeEyes(1, p.gaze) }))
  return mascot(mood, t)
}

/** Idle long enough with nobody about, the cat falls asleep. */
export const settle = (mood: Mood, t: number, quietSince: number, p: Play): Mood =>
  mood === 'idle' && t - Math.max(quietSince, p.touchedAt) > SLEEP_TICKS ? 'sleeping' : mood

/** One terminal row per two pixel rows, adjacent cells of one look merged into a run. */
export const cells = (pixels: string[]): Run[][] =>
  Array.from({ length: Math.ceil(pixels.length / 2) }, (_, r) => {
    const top = pixels[r * 2] ?? ''
    const bottom = pixels[r * 2 + 1] ?? ''
    const runs: Run[] = []
    for (let c = 0; c < top.length; c++) {
      const t = INK[top[c] ?? '.']
      const b = INK[bottom[c] ?? '.']
      const cell: Run =
        t && b ? (t === b ? { text: '█', color: t } : { text: '▀', color: t, backgroundColor: b })
        : t ? { text: '▀', color: t }
        : b ? { text: '▄', color: b }
        : { text: ' ' }
      const last = runs[runs.length - 1]
      if (last && last.color === cell.color && last.backgroundColor === cell.backgroundColor && (cell.text === ' ') === (last.text[0] === ' ')) {
        last.text += cell.text
      } else runs.push(cell)
    }
    return runs
  })
