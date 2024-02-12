import { writable } from 'svelte/store'

export const menu = writable([] as boolean[])
export const icons = writable([] as string[])

export function setMenu(...list: string[]) {
   menu.set(new Array(list.length).fill(false))
   icons.set(list)
}
