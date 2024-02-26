import { pb, cleanup } from '$lib/pocketbase'
import type { Session, Starred, Thread, User } from '$lib/types'
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

         const starred: Starred[] = await pb.collection('starred').getFullList({
            filter: `user = "${(session.expand.user as User).id}"`,
            expand: 'thread'
         })

         return json({
            ...session.expand.user,
            valid: true,
            // prettier-ignore
            starred: starred.map(s => new Object({
               board: s.board,
               threadNumber: s.threadNumber,
               thread: {
                  title: (s.expand.thread as Thread).title,
                  postCount: (s.expand.thread as Thread).postCount,
               }
             }))
         })
      } catch {
         cookies.delete('session', { path: '/' })
         return json({ valid: false }, { status: 401 })
      }
   }

   return json({ valid: false }, { status: 401 })
}
