import { minify } from '$lib/misc'
import { Bread } from '$lib/pocketbase'
import type { Thread } from '$lib/types'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, url }) => {
   let thread: Thread

   const bread = await Bread(params.board, params.thread)
   if (bread) thread = await bread.thread()
   else throw error(404, 'This thread does not exist')

   const posts = await bread.posts()

   if (url.search.length == 0) {
      return json({
         thread: minify(thread, ['updated']),
         posts: minify(posts, ['created', 'id'])
      })
   }

   const query = (param: string) => url.searchParams.has(param)

   if (query('update')) {
      return json(thread.updated)
   }

   if (query('posts')) {
      return json(minify(posts, ['created', 'id']))
   }

   if (query('thread')) {
      return json(minify(thread, ['updated']))
   }

   throw error(400)
}
