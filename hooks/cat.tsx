// The cat's own region of the band: it keeps its frame clock and reads the
// pointer here, on the drawing thread, so the band is not redrawn every tick.
import type { ClientModule } from 'claude-code'

import { CAPTION_INK, MASCOT_TICK_MS, MASCOT_WIDTH, PLAY, cells, frameAt, react, settle } from './mascot'
import type { Mood, Play } from './mascot'

// `isStill` is `/hud still`: the clock stops and the cat ignores the pointer.
export type CatProps = { mood: Mood; activeAt: number; isStill: boolean }
// `quietSince` is the tick the last turn was seen, so a new turn wakes the cat.
type Local = { t: number; play: Play; activeAt: number; quietSince: number; isStill: boolean }

const Cat: ClientModule<CatProps, Local> = (props, surface) => {
  const { Box, Text } = surface.elements
  const local = surface.state ?? { t: 0, play: PLAY, activeAt: props.activeAt, quietSince: 0, isStill: props.isStill }
  if (surface.state === undefined) {
    surface.setState(local)
    surface.every(MASCOT_TICK_MS, () => {
      const s = surface.state
      if (s !== undefined && !s.isStill) surface.setState({ ...s, t: s.t + 1 })
    })
    surface.onPointer(e => {
      const s = surface.state
      if (s !== undefined && !s.isStill) surface.setState({ ...s, play: react(s.play, e, s.t) })
    })
  } else if (props.activeAt !== local.activeAt || props.isStill !== local.isStill) {
    const quietSince = props.activeAt === local.activeAt ? local.quietSince : local.t
    surface.setState({ ...local, activeAt: props.activeAt, isStill: props.isStill, quietSince })
  }

  const mood = settle(props.mood, local.t, local.quietSince, local.play)
  const pose = frameAt(mood, local.t, local.play)

  return (
    <Box flexDirection="column" width={MASCOT_WIDTH}>
      {cells(pose.pixels).map(runs => (
        <Text>
          {runs.map(run => (
            <Text color={run.color} backgroundColor={run.backgroundColor}>{run.text}</Text>
          ))}
        </Text>
      ))}
      <Box justifyContent="center" width={MASCOT_WIDTH}>
        <Text italic color={CAPTION_INK} wrap="truncate-end">{pose.caption === '' ? ' ' : pose.caption}</Text>
      </Box>
    </Box>
  )
}

export default Cat
