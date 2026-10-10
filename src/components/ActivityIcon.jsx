import { Activity, Bike, Dumbbell, Footprints, Goal, Mountain, Trophy, Waves } from 'lucide-react'

const ICONS = {
  tennis: Trophy,
  running: Footprints,
  cycling: Bike,
  football: Goal,
  gym: Dumbbell,
  swimming: Waves,
  hiking: Mountain,
  other: Activity,
}

export default function ActivityIcon({ activity, size = 22, ...rest }) {
  const Icon = ICONS[activity] ?? Activity
  return <Icon size={size} strokeWidth={2} {...rest} />
}
