import { error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import type { Board } from '$lib/types'

export const load: LayoutServerLoad = async ({ params, fetch }) => {
   const board: Board = await fetch(`/api/${params.board}`)
      .then((r) => r.json())
      .catch(() => {
         throw error(404, 'This board does not exist.')
      })

   return { board }
}
