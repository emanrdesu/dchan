import { minify } from '$lib/misc'
import { Bread } from '$lib/pocketbase'
import type { Thread } from '$lib/types'
import { fields } from '$lib/types'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, url }) => {
   let thread: Thread

   const bread = await Bread(params.board, params.thread)
   if (bread) thread = await bread.thread()
   else throw error(404, 'This thread does not exist')

   if (url.search.length == 0) {
      return json({
         thread: minify(thread, ['updated']),
         posts: minify(await bread.posts(), ['created', 'id'])
      })
   }

   const query = (param: string) => url.searchParams.has(param)

   if (query('posts')) {
      return json(minify(await bread.posts(), ['created', 'id']))
   }

   if (query('thread')) {
      return json(minify(thread, ['updated']))
   }

   for (const field of fields.thread) {
      if (query(field)) return json(thread[field])
   }

   throw error(400)
}
