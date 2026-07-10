import { useEffect, useMemo, type MutableRefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJoyride, type ButtonType, type Step } from 'react-joyride'
import { usePermissions } from '../lib/permissions'
import { buildTourSteps } from './buildTourSteps'

type GuidedTourProps = {
  prepareShell: () => void
  startRef: MutableRefObject<(() => void) | null>
}

const tourOptions = {
  skipBeacon: true,
  showProgress: true,
  buttons: ['back', 'skip', 'primary'] as ButtonType[],
  targetWaitTimeout: 4000,
  primaryColor: '#14352f',
  textColor: '#14352f',
  backgroundColor: '#fffdf8',
  arrowColor: '#fffdf8',
  overlayColor: 'rgba(20, 53, 47, 0.55)',
  zIndex: 12000,
}

function stepVisible(step: Step, can: (feature: string, permission: string) => boolean) {
  const target = String(step.target)
  const featureMatch = target.match(/nav-([a-z0-9-]+)/)
  if (featureMatch) {
    const feature = featureMatch[1]
    if (feature === 'chat' || feature === 'conversations') return true
    return can(feature, 'read')
  }
  if (target.includes('kb-page')) return can('knowledge-base', 'read')
  if (target.includes('chat-')) return true
  return true
}

export default function GuidedTour({ prepareShell, startRef }: GuidedTourProps) {
  const navigate = useNavigate()
  const { can, user } = usePermissions()

  const steps = useMemo(
    () =>
      buildTourSteps({ navigate, prepareShell }).filter((step) => stepVisible(step, can)),
    // user identity drives which nav targets exist
    // eslint-disable-next-line react-hooks/exhaustive-deps -- can is stable enough via user
    [navigate, prepareShell, user?.id, user?.role?.id],
  )

  const { controls, Tour } = useJoyride({
    steps,
    continuous: true,
    scrollToFirstStep: true,
    options: tourOptions,
    locale: {
      back: 'Back',
      close: 'Close',
      last: 'Finish',
      next: 'Next',
      skip: 'Skip',
    },
  })

  useEffect(() => {
    startRef.current = () => {
      prepareShell()
      controls.reset(true)
    }
    return () => {
      startRef.current = null
    }
  }, [controls, prepareShell, startRef])

  return Tour
}
