'use client'

import { useRef, useEffect, useState } from 'react'
import { Player } from '@lordicon/react'

/**
 * Lordicon animated icon IDs from cdn.lordicon.com
 */
const ICON_MAP: Record<string, string> = {
  search: 'kkvxgpti',
  close: 'vfzqittk',
  menu: 'dqunxlzu',
  settings: 'hwuyodym',
  filter: 'zniqnylq',
  save: 'wwmtsdzf',
  delete: 'jmkrnisz',
  cart: 'slkvcfos',
  tag: 'qjwkmfpn',
  wallet: 'qwsmiitg',
  money: 'mrdiizcb',
  bell: 'psnhyobz',
  check: 'egiwmiit',
  star: 'surjmvno',
  fire: 'gqdnbnwt',
  bolt: 'svtlygqd',
  folder: 'jmkvoaqh',
  chart: 'gqjpawbc',
  globe: 'surcxhka',
  laptop: 'hdfckrxd',
  phone: 'fpmskzsv',
  gamepad: 'emjmczmc',
  car: 'iunedsbs',
  user: 'dxjqoygy',
  lock: 'eouimtdq',
  logout: 'moscwhno',
  mail: 'rhvddzym',
  home: 'cnpvzivt',
  heart: 'pnhskdva',
  info: 'yxczfiyc',
  ai: 'kcitigba',
  clock: 'abgtphux',
  link: 'kgcceqhi',
}

// Cache loaded icons
const iconCache = new Map<string, object>()

interface LordIconProps {
  icon: keyof typeof ICON_MAP | string
  size?: number
  trigger?: 'hover' | 'loop' | 'morph' | 'boomerang'
  colors?: string
  className?: string
  style?: React.CSSProperties
}

export function LordIcon({
  icon,
  size = 24,
  trigger = 'hover',
  colors = `primary:#c4ef16,secondary:#fefeff`,
  className,
  style,
}: LordIconProps) {
  const playerRef = useRef<Player>(null)
  const [iconData, setIconData] = useState<object | null>(null)
  const iconId = ICON_MAP[icon] || icon

  useEffect(() => {
    // Check cache first
    if (iconCache.has(iconId)) {
      setIconData(iconCache.get(iconId)!)
      return
    }

    // Fetch from CDN
    fetch(`https://cdn.lordicon.com/${iconId}.json`)
      .then((res) => res.json())
      .then((data) => {
        iconCache.set(iconId, data)
        setIconData(data)
      })
      .catch(() => {
        // Silently fail — emoji fallback will show
      })
  }, [iconId])

  if (!iconData) {
    // Fallback while loading
    return <span className={className} style={{ fontSize: size * 0.7, ...style }}>●</span>
  }

  return (
    <div
      className={className}
      style={{ display: 'inline-flex', lineHeight: 1, ...style }}
    >
      <Player
        ref={playerRef}
        size={size}
        icon={iconData}
        colors={colors}
      />
    </div>
  )
}
