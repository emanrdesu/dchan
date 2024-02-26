import { noop } from 'lodash'
import { writable } from 'svelte/store'

export const menu = writable([] as boolean[])
export const menuIcons = writable([] as string[])
export const menuClick = writable([] as { on: Function; off: Function }[])

export function setMenu(...list: string[]) {
   let omenu0: boolean // ugly hack
   menu.subscribe((m) => (omenu0 = m[0]))()

   menu.set(new Array(list.length).fill(false))

   menu.update((m) => {
      m[0] = omenu0
      return m
   })

   menuIcons.set(list)
   menuClick.set(new Array(list.length).fill({ on: noop, off: noop }))
}
