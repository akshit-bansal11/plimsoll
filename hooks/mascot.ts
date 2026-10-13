// Animation frames for the kitten drawn in the panel. Pure: no imports, so the
// panel and a plain node check can both load it.
export type Mood = 'idle' | 'working' | 'sleeping' | 'alarm'
export const MASCOT_WIDTH = 16
export const MASCOT_ROWS = 5
export const MASCOT_TICK_MS = 300
export type Pose = { lines: string[]; caption: string }

type Sprite = string[]
type Part = [Sprite, number, number]
// A step is a pose that depends on the global tick, so the tail keeps swishing between acts.
type Step = (t: number) => Pose
type Look = { ears?: string; eyes?: string; l?: string; r?: string; paws?: string; tail?: string; tailLeft?: boolean; y?: number }

const EARS = ' /\\_/\\ '
const EARS_TICK_R = ' /\\_/| '
const EARS_TICK_L = ' _\\_/\\ '

// Five cells between the brackets; the shifted ones look sideways without moving the head.
const E_OPEN = ' o.o '
const E_BLINK = ' -.- '
const E_HAPPY = ' ^.^ '
const E_WIDE = ' O.O '
const E_LEFT = 'o.o  '
const E_RIGHT = '  o.o'
const E_LICK_A = ' -.-/'
const E_LICK_B = ' -.-\\'

const PAWS = '(")(")'
const STEP_A = '(_)(")'
const STEP_B = '(")(_)'
const TAIL_R = ['~ ', ' ~', ' _', '/ ']
const TAIL_L = [' ~', '~ ', '_ ', ' \\']

const STRETCH_A: Sprite = ['  /\\_/\\    ', ' (-.-)====/', '  "      "   ']
const STRETCH_B: Sprite = ['  /\\_/\\   ~', ' (^.^)====/', '  "       " ']
const AIR: Sprite = ['      /\\_/\\', '~=====(^.^)']
const crouch = (t: number): Sprite => ['      /\\_/\\', `${t % 2 === 0 ? '~~ ' : ' ~~'}___(o.o)`]
const loaf = (high: boolean, ears: string, tail: string): Sprite => [ears + (high ? ' __ ' : '    '), `(-.-)___)${tail}`]

const blank = (): string[] => Array.from({ length: MASCOT_ROWS }, () => ' '.repeat(MASCOT_WIDTH))

// Writes the sprite's non-space cells onto the canvas; anything off the edge is
// clipped, so a sprite can walk out of view without breaking the width rule.
const stamp = (canvas: string[], sprite: Sprite, x: number, y: number): string[] =>
  canvas.map((line, r) => {
    const s = sprite[r - y]
    if (s === undefined) return line
    return [...line].map((ch, c) => {
      const t = s[c - x]
      return t === undefined || t === ' ' ? ch : t
    }).join('')
  })

const scene = (caption: string, ...parts: Part[]): Pose => ({
  lines: parts.reduce((canvas, [s, x, y]) => stamp(canvas, s, x, y), blank()),
  caption,
})

const swish = (tails: string[], t: number): string => tails[(t >> 1) % tails.length] ?? ''

// The 3 x 11 kitten: ears, face, paws, with a tail slot on each side of which only one is used.
// tailLeft is for a kitten facing right; its face stays frontal and only the eyes shift.
const kit = (t: number, x: number, o: Look = {}): Part => {
  const { ears = EARS, eyes = E_OPEN, l = '(', r = ')', paws = PAWS, tailLeft = false, y = 2 } = o
  const tail = o.tail ?? swish(tailLeft ? TAIL_L : TAIL_R, t)
  const [tl, tr] = tailLeft ? [tail.padStart(3), '  '] : ['   ', tail.padEnd(2)]
  return [['  ' + ears + '  ', '  ' + l + eyes + r + '  ', tl + paws + tr], x, y]
}

const pose = (x: number, o: Look = {}, caption = '', ...extra: Part[]): Step =>
  t => scene(caption, kit(t, x, o), ...extra)

const stand = (x: number, ticks: number, caption = ''): Step[] =>
  Array.from({ length: ticks }, () => pose(x, {}, caption))

const blink = (x: number): Step[] => [pose(x, { eyes: E_BLINK }, '*blink*'), pose(x)]

const twitch = (x: number): Step[] =>
  [pose(x, { ears: EARS_TICK_R }), pose(x), pose(x, { ears: EARS_TICK_L }), pose(x)]

const look = (x: number): Step[] => [E_LEFT, E_LEFT, E_RIGHT, E_RIGHT].map(eyes => pose(x, { eyes }))

// One column per tick, paws alternating, tail trailing behind.
const walk = (from: number, to: number): Step[] => {
  const dir = Math.sign(to - from)
  return Array.from({ length: Math.abs(to - from) }, (_, i) =>
    pose(from + dir * (i + 1), { eyes: dir > 0 ? E_RIGHT : E_LEFT, paws: i % 2 === 0 ? STEP_A : STEP_B, tailLeft: dir > 0 }),
  )
}

const wave = (x: number): Step[] => {
  const up = (paw: string) => pose(x, { eyes: E_HAPPY }, '*waves*', [[paw], x + 9, 3])
  const down = pose(x, { eyes: E_HAPPY }, '*waves*')
  return [up('/'), down, up('/'), down, up('|'), down]
}

const groom = (x: number): Step[] =>
  Array.from({ length: 6 }, (_, i) => pose(x, { eyes: i % 2 === 0 ? E_LICK_A : E_LICK_B }, '*lick lick*'))

// Wings flap every tick while the eyes follow it across the headroom.
const flutter = (x: number): Step[] =>
  Array.from({ length: 7 }, (_, i) => {
    const bx = i * 2
    const d = bx + 1 - (x + 5)
    return pose(x, { eyes: d < -1 ? E_LEFT : d > 1 ? E_RIGHT : E_OPEN }, 'ooh...', [[i % 2 === 0 ? '\\v/' : '-v-'], bx, 1 - (i % 2)])
  })

const stretch = (x: number): Step[] =>
  [STRETCH_A, STRETCH_A, STRETCH_B, STRETCH_B].map(s => () => scene('*streeetch*', [s, x, 2]))

const dance = (x: number, ticks: number): Step[] =>
  Array.from({ length: ticks }, (_, i) => {
    const cx = x + ([1, 0, -1, 0][i % 4] ?? 0)
    const up = i % 2 === 0
    return pose(cx, { eyes: E_HAPPY, paws: up ? STEP_A : STEP_B }, '♪ ♪ ♪', [['♪'], cx + 1, up ? 1 : 0], [['♪'], cx + 9, up ? 0 : 1])
  })

const love = (x: number): Step[] => [
  ...[1, 1, 0, 0].map(row => pose(x, { eyes: E_HAPPY }, 'purr', [['♥'], x + 5, row])),
  ...Array.from({ length: 2 }, () => pose(x, { eyes: E_HAPPY }, 'purr')),
]

const roll = (x: number, y = 4): Part => [['@'], x, y]

// The yarn stays one kitten-length ahead, hits the right edge, hops and rolls back.
const chase = (): Step[] => {
  const o: Look = { eyes: E_RIGHT, tailLeft: true }
  const cap = '*chases yarn*'
  return [
    ...[1, 2, 3].map(x => pose(x, { ...o, paws: x % 2 === 0 ? STEP_A : STEP_B }, cap, roll(x + 11))),
    pose(3, o, cap, roll(15)),
    pose(3, o, cap, roll(15, 3)),
    pose(3, o, cap, roll(14)),
  ]
}

// Crouch and wiggle, leap in an arc over the yarn, land on it.
const ARC: [number, number][] = [[4, 2], [4, 1], [5, 0], [5, 1], [5, 2]]
const pounce = (): Step[] => [
  ...Array.from({ length: 4 }, () => (t: number) => scene('', [crouch(t), 3, 3], roll(14))),
  ...ARC.map(([x, y]) => () => scene('*pounce!*', [AIR, x, y], roll(14))),
  (t: number) => scene('*pounce!*', [crouch(t), 5, 3]),
]

const acts: Step[] = [
  ...stand(0, 4), ...blink(0), ...stand(0, 2), ...twitch(0), ...stand(0, 2), ...look(0), ...stand(0, 2),
  ...walk(0, 3), ...stand(3, 2), ...wave(3), ...stand(3, 2), ...walk(3, 0), ...stand(0, 2),
  ...chase(), ...pounce(), ...stand(5, 3), ...groom(5), ...stand(5, 2), ...flutter(5), ...stand(5, 2),
  ...stretch(5), ...stand(5, 2), ...walk(5, 0), ...stand(0, 3),
  ...walk(0, 4), ...dance(4, 12), ...stand(4, 2), ...love(4), ...stand(4, 2), ...twitch(4), ...look(4), ...blink(4),
  ...stand(4, 3), ...walk(4, 0),
  ...stand(0, 2), ...flutter(0), ...stand(0, 2), ...stretch(0), ...stand(0, 2), ...groom(0), ...stand(0, 2),
  ...walk(0, 5), ...wave(5), ...stand(5, 2), ...look(5), ...walk(5, 0), ...stand(0, 2),
  ...chase(), ...pounce(), ...stand(5, 3), ...twitch(5), ...stand(5, 2), ...love(5), ...stand(5, 2), ...walk(5, 0),
]

// Padded to a multiple of the 8-tick tail cycle so the loop closes on a standing kitten at the start.
const idle: Pose[] = [...acts, ...stand(0, 8 - (acts.length % 8))].map((step, t) => step(t))

const SCREEN = ['   ', '.  ', '.. ', '...']
const DOTS = ['working', 'working.', 'working..', 'working...']

const working: Pose[] = Array.from({ length: 48 }, (_, i) =>
  scene(
    DOTS[(i >> 1) % 4] ?? '',
    kit(i, 0, { eyes: i % 12 >= 10 ? E_BLINK : E_RIGHT, paws: i % 2 === 0 ? STEP_A : STEP_B, tailLeft: true }),
    [['.---.', `|${SCREEN[i % 4] ?? '   '}|`, "'==='"], 10, 2],
  ),
)

// Breathes every 4 ticks; two z's drift up and right, offset so they never line up.
const sleeping: Pose[] = Array.from({ length: 48 }, (_, i) => {
  const zs: Part[] = [i, i + 3].flatMap((t): Part[] => {
    const step = Math.floor((t % 8) / 2)
    return step > 2 ? [] : [[[step === 0 ? 'z' : 'Z'], 9 + step, 2 - step]]
  })
  const body = loaf(Math.floor(i / 4) % 2 === 1, i % 16 === 11 ? EARS_TICK_R : EARS, i % 8 >= 6 ? ' ~' : '~ ')
  return scene('zzz', [body, 2, 3], ...zs)
})

// Left to right then back, two columns a tick; the kitten is clipped at the left edge, never the right.
const RUN = [0, 2, 4, 6, 4, 2, 0, -2]

const alarm: Pose[] = Array.from({ length: 16 }, (_, i) => {
  const x = RUN[i % 8] ?? 0
  const right = i % 8 < 4
  const fur: Look = { eyes: E_WIDE, l: '<', r: '>', paws: i % 2 === 0 ? STEP_A : STEP_B, tail: right ? ' |' : '| ', tailLeft: right }
  const pop: Part[] = i % 2 === 0 ? [[['!'], x + 5, 1]] : []
  return scene((i >> 1) % 2 === 0 ? '!! LIMIT !!' : '', kit(i, x, fur), ...pop)
})

const scripts: Record<Mood, Pose[]> = { idle, working, sleeping, alarm }
const fallback = scene('', kit(0, 0))

export const mascot = (mood: Mood, frame: number): Pose => {
  const script = scripts[mood]
  return script[frame % script.length] ?? fallback
}
