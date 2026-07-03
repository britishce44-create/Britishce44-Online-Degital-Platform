import { useEffect } from 'react'
import { useAppState } from './app-provider'
import { requestNotificationPermission } from '@/lib/pwa-utils'

/* This component manages class alarms.
   It checks the schedule every 30s and fires a notification 5 min before each class.
   The service worker handles offline alarms via postMessage. */

export function AppAlarmManager() {
  const { classes, online } = useAppState()

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  useEffect(() => {
    if (classes.length === 0) return

    const check = () => {
      const now = Date.now()
      for (const cls of classes) {
        const classTime = new Date(`${cls.date}T${cls.startTime}`).getTime()
        const alertTime = classTime - 5 * 60 * 1000
        const diff = alertTime - now
        if (diff > 0 && diff < 35000) {
          /* Fire notification */
          const key = `alarm_fired_${cls.id}`
          if (localStorage.getItem(key)) continue
          localStorage.setItem(key, 'true')

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Class Starting Soon!', {
              body: `${cls.name} with ${cls.teacher} in 5 minutes · Room ${cls.room}`,
              icon: '/favicon.svg',
              tag: `alarm-${cls.id}`,
              vibrate: [300, 150, 300, 150, 300],
              requireInteraction: true,
            })
          }

          /* Also schedule via service worker for offline reliability */
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'schedule-alarm',
              payload: {
                id: cls.id,
                time: alertTime,
                title: '⏰ Class Starting Soon!',
                body: `${cls.name} with ${cls.teacher} in 5 minutes`,
              },
            })
          }
        }
        /* If class already passed, clear the fired flag for next occurrence */
        if (now > classTime + 60 * 60 * 1000) {
          localStorage.removeItem(`alarm_fired_${cls.id}`)
        }
      }
    }

    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [classes])

  return null
}
