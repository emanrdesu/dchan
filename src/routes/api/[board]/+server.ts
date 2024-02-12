import { minify } from '$lib/misc'
import { Boarb } from '$lib/pocketbase'
import type { Board } from '$lib/types'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, url }) => {
   let board: Board

   const boarb = await Boarb(params.board)
   if (boarb) board = await boarb.board()
   else throw error(400)

   const query = (param: string) => url.searchParams.has(param)

   if (query('update')) {
      return json({ date: board.updated })
   }

   if (query('catalog')) {
      const ops = await boarb.catalog.threads().then((ts) => ts.ops())
      return json({ ops: ops })
   }

   return json(minify(board, ['updated'], ['category']))
}
