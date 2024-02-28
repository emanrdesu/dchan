import { noop } from 'lodash'
import { writable, type Writable } from 'svelte/store'

export const menu = writable([] as boolean[])
export const menuIcons = writable([] as string[])
export const menuClick = writable([] as { on: Function; off: Function }[])

export function setMenu(list: string[], option = { keep0: false }) {
   let omenu0: boolean // ugly hack
   menu.subscribe((m) => (omenu0 = m[0]))()

   menu.set(new Array(list.length).fill(false))

   if (option.keep0)
      menu.update((m) => {
         m[0] = omenu0
         return m
      })

   menuIcons.set(list)
   menuClick.set(new Array(list.length).fill({ on: noop, off: noop }))
}

export const notifications = writable([] as string[])

function push<X>(x: X, w: Writable<X[]>) {
   w.update((xs) => {
      xs.push(x)
      return xs
   })
}

function pop(w: Writable<any[]>) {
   w.update((xs) => {
      xs.pop()
      return xs
   })
}

export function notify(message: string, type = 'info', duration = 3000) {
   push(message, notifications)

   setTimeout(() => {
      pop(notifications)
   }, duration)
}

export const work = writable([] as null[])
export const busy = {
   now() {
      push(null, work)
   },

   free() {
      pop(work)
   }
}
