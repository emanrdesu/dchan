import { pb, cleanup } from '$lib/pocketbase'
import type { Session } from '$lib/types'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ cookies }) => {
   cleanup.session()

   const cookie = { session: cookies.get('session') }

   if (cookie.session) {
      try {
         const session: Session = await pb
            .collection('session')
            .getFirstListItem(`uuid = "${cookie.session}"`, { expand: 'user' })

         return json({
            valid: true,
            ...session.expand.user
         })
      } catch {
         cookies.delete('session', { path: '/' })
         return json({ valid: false }, { status: 401 })
      }
   }

   return json({ valid: false }, { status: 401 })
}
