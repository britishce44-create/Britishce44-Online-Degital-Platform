// Feature-flag configuration.
// Online features gracefully degrade when their env vars are not set.
// Set VITE_ONLINE_MODE=true in .env to enable video classrooms (requires a mediasoup signaling server).

export const FEATURES = {
  // AI Learning Hub (OpenAI API key required)
  get ai() {
    return !!import.meta.env.VITE_OPENAI_API_KEY
      || !!import.meta.env.VITE_AI_INTEGRATIONS_OPENAI_API_KEY
  },

  // AI-generated reports (uses same OpenAI key)
  get aiReports() {
    return this.ai
  },

  // Google integrations (Gmail, Drive, Calendar)
  get google() {
    return import.meta.env.VITE_ONLINE_MODE === 'true'
  },

  // Video classrooms (requires mediasoup signaling server)
  get videoClassrooms() {
    return import.meta.env.VITE_ONLINE_MODE === 'true'
  },

  // Whether we're in full online mode or local-only mode
  get onlineMode() {
    return import.meta.env.VITE_ONLINE_MODE === 'true'
  },

  get localMode() {
    return !this.onlineMode
  },
} as const

export function modeLabel(): string {
  return FEATURES.onlineMode ? 'Online Mode' : 'Local Mode'
}
