import { registerSW } from 'virtual:pwa-register'

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'current'
  | 'available'
  | 'updating'
  | 'unavailable'
  | 'error'

type Listener = (status: UpdateStatus) => void

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined
let needRefresh = false
let initialized = false
const listeners = new Set<Listener>()

function emit(status: UpdateStatus) {
  for (const listener of listeners) listener(status)
}

export function subscribeUpdateStatus(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function initPwa() {
  if (initialized) return
  initialized = true

  if (!('serviceWorker' in navigator)) return

  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      needRefresh = true
      emit('available')
    },
    onRegisteredSW(_swUrl, registration) {
      if (registration?.waiting) {
        needRefresh = true
        emit('available')
      }
    },
  })
}

export async function checkForAppUpdate(): Promise<UpdateStatus> {
  if (!('serviceWorker' in navigator)) {
    emit('unavailable')
    return 'unavailable'
  }

  emit('checking')
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) {
      emit('unavailable')
      return 'unavailable'
    }

    await registration.update()

    if (registration.waiting || needRefresh) {
      needRefresh = true
      emit('available')
      return 'available'
    }

    emit('current')
    return 'current'
  } catch {
    emit('error')
    return 'error'
  }
}

export async function applyAppUpdate(): Promise<void> {
  if (!updateSW) {
    emit('unavailable')
    return
  }
  emit('updating')
  needRefresh = false
  await updateSW(true)
}
