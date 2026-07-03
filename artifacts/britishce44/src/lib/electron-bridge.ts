declare global {
  interface Window {
    b44Desktop?: {
      openMeetingWindow: (roomId: number, userId: string, userName: string) => Promise<void>
      closeMeetingWindow: (roomId?: number) => Promise<void>
      getServerPort: () => Promise<number>
      getServerStatus: () => Promise<{ running: boolean; port: number }>
      showNotification: (title: string, body: string) => Promise<void>
      saveFileDialog: (defaultName?: string) => Promise<string | null>
      getAppVersion: () => Promise<string>
      getPlatform: string
      onServerStatusChange: (callback: (status: { running: boolean; port: number }) => void) => () => void
    }
  }
}

export const isElectron = typeof window !== 'undefined' && !!window.b44Desktop

export function useElectronMeeting() {
  return {
    openInNewWindow: async (roomId: number, userId: string, userName: string) => {
      if (isElectron) {
        await window.b44Desktop!.openMeetingWindow(roomId, userId, userName)
        return true
      }
      return false
    },
    closeMeetingWindow: async (roomId?: number) => {
      if (isElectron) {
        await window.b44Desktop!.closeMeetingWindow(roomId as any)
      }
    },
  }
}
