import type { Lang } from './i18n'

/**
 * Near-human spoken welcome played once on every successful login.
 * A pool of pre-generated text-to-speech clips lives in /public/welcome.
 * A different clip is chosen each time so users hear varied, inspiring words
 * about the centre, the books, the teachers and success.
 */
const CLIP_COUNT: Record<Lang, number> = { en: 10, ar: 6 }

let lastIndex = -1

export function playWelcomeVoice(lang: Lang): void {
  const count = CLIP_COUNT[lang] ?? CLIP_COUNT.en
  if (count <= 0) return

  let idx = Math.floor(Math.random() * count)
  if (count > 1 && idx === lastIndex) idx = (idx + 1) % count
  lastIndex = idx

  const src = `/welcome/${lang}-${idx + 1}.mp3`
  try {
    const audio = new Audio(src)
    audio.volume = 0.95
    const p = audio.play()
    if (p && typeof p.catch === 'function') p.catch(() => {})
  } catch {
    /* autoplay blocked or asset missing — fail silently */
  }
}
