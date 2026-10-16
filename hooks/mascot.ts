// Pixel-art frames for the cat drawn in the panel. Pure: no imports, so the
// panel and a plain node check can both load it.
//
// A sprite is a grid of ink letters ('.' is see-through). Frames are drawn on a
// canvas MASCOT_WIDTH pixels across and MASCOT_ROWS * 2 down; `cells` folds each
// pair of pixel rows into one terminal row of half blocks, top pixel in the
// foreground and bottom pixel in the background, so every pixel is square.
export type Mood = 'idle' | 'working' | 'sleeping' | 'alarm'
export const MASCOT_WIDTH = 24
export const MASCOT_ROWS = 6
export const MASCOT_TICK_MS = 300
export type Pose = { pixels: string[]; caption: string }
export type Run = { text: string; color?: string; backgroundColor?: string }

export const INK: Record<string, string> = {
  O: '#E8924A', // fur
  D: '#B5612B', // stripes, closed eyes
  L: '#F7DDB8', // cream muzzle, chest, paws
  P: '#F49AB0', // nose, inner ears, tongue
  G: '#9BE564', // iris
  K: '#1E1A17', // pupil
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

type Sprite = string[]
type Part = [Sprite, number, number]
// A step is a pose that depends on the global tick, so the tail keeps swishing between acts.
type Step = (t: number) => Pose
type Eyes = 'open' | 'left' | 'right' | 'blink' | 'happy' | 'wide'
type Paws = 'sit' | 'stepA' | 'stepB' | 'wave' | 'lick' | 'bat'
type Look = { eyes?: Eyes; paws?: Paws; twitch?: boolean; tail?: number | 'none' | 'puff'; tongue?: boolean }

const H = MASCOT_ROWS * 2

// Sitting, facing front: 15 across, 12 down. The tail is a separate sprite.
const BODY: Sprite = [
  '..D.........D..',
  '..OD.......DO..',
  '..OPO.....OPO..',
  '..OOOODODOOOO..',
  '.OOOOOOOOOOOOO.',
  '.OO..OOOOO..OO.',
  '.OO..OOPOO..OO.',
  'WWWOLLLLLLLOWWW',
  '...OOLLLLLOO...',
  '...OOOLLLOOOD..',
  '...ODOLLLODOOO.',
  '...O..OOO..OOO.',
]

// Two pixels across, two down, per eye; the left eye sits at x3, the right at x10.
const EYES: Record<Eyes, [string, string, string, string]> = {
  open: ['GK', 'GK', 'KG', 'KG'],
  left: ['KG', 'KG', 'KG', 'KG'],
  right: ['GK', 'GK', 'GK', 'GK'],
  blink: ['OO', 'DD', 'OO', 'DD'],
  happy: ['DD', 'OO', 'DD', 'OO'],
  wide: ['GG', 'GK', 'GG', 'KG'],
}

const PAWS: Record<Paws, Part[]> = {
  sit: [[['LL...LL'], 4, 11]],
  stepA: [[['LL'], 4, 10], [['.....LL'], 4, 11]],
  stepB: [[['LL'], 4, 11], [['LL'], 9, 10]],
  wave: [[['LL', 'LL', 'DO', '.D'], -2, 3], [['.....LL'], 4, 11]],
  lick: [[['LL.', 'OOD', '.OO', '..O'], 8, 6], [['LL'], 4, 11]],
  bat: [[['LL'], 4, 11], [['LL', 'O.'], 14, 9]],
}

// Tail frames, drawn from the body's right hip; index 1 is the resting curl.
const TAILS: Sprite[] = [
  ['....OO', '....O.', '...OO.', 'OOO...'],
  ['.....', '...OO', '...O.', 'OOOO.'],
  ['...O..', '...O..', '...O..', 'OOO...'],
  ['.....O', '....O.', '...O..', 'OOO...'],
]
// Bristled straight up in fright, from the hip.
const TAIL_PUFF: Sprite = ['.O.O', '..O.', '.OOO', '..O.', '.OOO', '..O.', '..O.', 'OO..']
const SWISH = [1, 0, 1, 2, 1, 3]
// The left ear folded flat, in place of the body's top two rows.
const EAR_FOLD: Sprite = ['............D..', '...O.......DO..']

const HEART: Sprite = ['R.R', 'RRR', '.R.']
const NOTE: Sprite = ['.NN', '.N.', 'NN.', 'NN.']
const YARN: Sprite = ['.YY.', 'YyYY', 'YYyY', '.YY.']
// A diagonal one pixel thick reads as an I at this size; these are two thick.
const Z_BIG: Sprite = ['ZZZZ', '..ZZ', '.ZZ.', 'ZZ..', 'ZZZZ']
const Z_SMALL: Sprite = ['ZZZ', '..Z', '.Z.', 'Z..', 'ZZZ']
const BANG: Sprite = ['R', 'R', 'R', '.', 'R']

const LAPTOP: Sprite = [
  'mmmmmmm',
  'msssssm',
  'msssssm',
  'msssssm',
  'mmmmmmm',
  '.MMMMMMM',
  'MMMMMMMM',
]
// Lines of code scrolling on the screen, three rows of five pixels.
const CODE = ['SSS..', '.SS.S', 'S....', '.SSS.', 'SS...', '.S.SS']

// Curled up, chin on its paws, tail wrapped along the floor: 21 across, 7 down.
const LOAF: Sprite = [
  '..D.....D............',
  '..OD...DO.....OOOO...',
  '.OOPOOOPOO.OOOOOOOOO.',
  '.OOODODOOOOODOODOOOOO',
  'WODDOOODDOOODOODOOOOO',
  '.OOOOPOOOOOOOOOOOOOOO',
  'LLLLLLLLLOOOOOOOOOOOO',
]
// Breathing in: the back rises a pixel above the loaf's line.
const BREATH: Sprite = ['..............OOOO...']

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
  const { eyes = 'open', paws = 'sit', twitch = false, tail = SWISH[(t >> 1) % SWISH.length] ?? 1 } = o
  const [l1, l2, r1, r2] = EYES[eyes]
  const body: Part[] = [
    [twitch ? [...EAR_FOLD, ...BODY.slice(2)] : BODY, x, 0],
    [[l1, l2], x + 3, 5],
    [[r1, r2], x + 10, 5],
    ...PAWS[paws].map(([s, px, py]): Part => [s, x + px, py]),
  ]
  if (o.tongue) body.push([['P'], x + 7, 8])
  if (tail === 'puff') body.unshift([TAIL_PUFF, x + 12, 2])
  else if (tail !== 'none') body.unshift([TAILS[tail] ?? [], x + 12, 8])
  return body
}

const pose = (x: number, o: Look = {}, caption = '', ...extra: Part[]): Step =>
  t => scene(caption, ...cat(t, x, o), ...extra)

const stand = (x: number, ticks: number, caption = ''): Step[] =>
  Array.from({ length: ticks }, () => pose(x, {}, caption))

const blink = (x: number): Step[] => [pose(x, { eyes: 'blink' }), pose(x)]

const twitch = (x: number): Step[] => [pose(x, { twitch: true }), pose(x), pose(x, { twitch: true }), pose(x)]

const look = (x: number): Step[] =>
  (['left', 'left', 'left', 'open', 'right', 'right', 'right', 'open'] as const).map(eyes => pose(x, { eyes }))

// One pixel a tick, paws alternating, eyes on where it is going.
const walk = (from: number, to: number): Step[] => {
  const dir = Math.sign(to - from)
  return Array.from({ length: Math.abs(to - from) }, (_, i) =>
    pose(from + dir * (i + 1), { eyes: dir > 0 ? 'right' : 'left', paws: i % 2 === 0 ? 'stepA' : 'stepB' }),
  )
}

const wave = (x: number): Step[] =>
  Array.from({ length: 6 }, (_, i) => pose(x, { eyes: 'happy', paws: i % 2 === 0 ? 'wave' : 'sit' }, 'hi!'))

const groom = (x: number): Step[] =>
  Array.from({ length: 6 }, (_, i) => pose(x, { eyes: 'blink', paws: 'lick', tongue: i % 2 === 0 }, '*lick lick*'))

const love = (x: number): Step[] =>
  [8, 6, 4, 2, 0, -2].map(y => pose(x, { eyes: 'happy' }, 'purr...', [HEART, x + 16, y], [HEART, x + 19, y + 4]))

// Bobs a pixel on the beat while two notes float up beside it.
const dance = (x: number, ticks: number): Step[] =>
  Array.from({ length: ticks }, (_, i) => {
    const up = i % 2 === 0
    return pose(x, { eyes: 'happy', paws: up ? 'stepA' : 'stepB' }, '~ la la ~', [NOTE, x + 17, up ? 1 : 2], [NOTE, x + 20, up ? 5 : 4])
  })

// The yarn rolls in from the right; the cat watches it, then bats it away.
const yarn = (x: number): Step[] => [
  ...[24, 23, 22, 21, 20, 19, 18].map(yx => pose(x, { eyes: 'right' }, '', [YARN, yx, 8])),
  ...Array.from({ length: 3 }, () => pose(x, { eyes: 'right' }, '...!', [YARN, 18, 8])),
  pose(x, { eyes: 'right', paws: 'bat', tail: 'none' }, '*bat!*', [YARN, 18, 8]),
  ...[19, 20, 22, 24].map(yx => pose(x, { eyes: 'happy', paws: 'bat', tail: 'none' }, '*bat!*', [YARN, yx, 8])),
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

const working: Pose[] = Array.from({ length: 48 }, (_, i) =>
  scene(
    DOTS[(i >> 1) % 4] ?? '',
    ...cat(i, 0, { eyes: i % 16 >= 14 ? 'blink' : 'right', paws: i % 2 === 0 ? 'stepA' : 'stepB', tail: 'none' }),
    [LAPTOP, 15, 5],
    [[0, 1, 2].map(r => CODE[(i + r) % CODE.length] ?? '')
      .map(row => row.replace(/\./g, 's')), 16, 6],
    [['LL'], i % 2 === 0 ? 14 : 16, 10],
  ),
)

// A z grows as it drifts up and right; a second trails two stages behind.
const DRIFT: Part[] = [[Z_SMALL, 11, 1], [Z_SMALL, 14, 0], [Z_BIG, 17, 0], [Z_BIG, 20, 0]]

// Breathes every 4 ticks.
const sleeping: Pose[] = Array.from({ length: 48 }, (_, i) => {
  const stage = Math.floor((i % 12) / 3)
  const zs = [stage, stage - 2].map(s => DRIFT[s]).filter((z): z is Part => z !== undefined)
  const breath: Part[] = Math.floor(i / 4) % 2 === 1 ? [[BREATH, 2, 5]] : []
  return scene('zzz...', [LOAF, 2, 5], ...breath, ...zs)
})

// Fur up, eyes wide, shaking side to side under a flashing warning.
const SHAKE = [0, 1, 0, -1]

const alarm: Pose[] = Array.from({ length: 16 }, (_, i) => {
  const x = 2 + (SHAKE[i % 4] ?? 0)
  const bang: Part[] = i % 4 < 2 ? [[BANG, 20, 1]] : []
  return scene((i >> 1) % 2 === 0 ? '!! LIMIT !!' : '', ...cat(i, x, { eyes: 'wide', tail: 'puff' }), ...bang)
})

const scripts: Record<Mood, Pose[]> = { idle, working, sleeping, alarm }
const fallback = scene('', ...cat(0, 0))

export const mascot = (mood: Mood, frame: number): Pose => {
  const script = scripts[mood]
  return script[frame % script.length] ?? fallback
}

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
