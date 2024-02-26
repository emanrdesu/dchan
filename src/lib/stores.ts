import { noop } from 'lodash'
import { writable } from 'svelte/store'

export const menu = writable([] as boolean[])
export const menuIcons = writable([] as string[])
export const menuClick = writable([] as { on: Function; off: Function }[])

export function setMenu(...list: string[]) {
   menu.set(new Array(list.length).fill(false))
   menuIcons.set(list)
   menuClick.set(new Array(list.length).fill({ on: noop, off: noop }))
}
