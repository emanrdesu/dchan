import PocketBase, { Record } from 'pocketbase'
import type { Board, Captcha, Post, Session, Thread } from './types'
import { minify } from '$lib/misc'
import { noop } from 'lodash'

export const pb = new PocketBase('http://127.0.0.1:8090')

export const cleanup = {
   async captcha() {
      const all = await pb.collection('captcha').getFullList<Captcha>()
      const expired = all.filter((c) => +Date.now() - +new Date(c.created) > 6e4)
      expired.forEach((c) => pb.collection('captcha').delete(c.id))
   },

   async session() {
      const all = await pb.collection('session').getFullList<Session>()
      const expired = all.filter((s) => +Date.now() - +new Date(s.created) > 8.64e7)
      expired.forEach((s) => pb.collection('session').delete(s.id))
   }
}

export async function Boarb(name: string) {
   function board(): Promise<Board> {
      return pb.collection('board').getFirstListItem(`name = "${name}"`)
   }

   try {
      const doarb = await board()

      return {
         board,

         async updateCount(n = 1) {
            const doarb = await board()

            return pb.collection('board').update(doarb.id, {
               postCount: doarb.postCount + n
            })
         },

         catalog: {
            async threads() {
               const breads = await pb.collection('thread').getFullList<Thread>({
                  filter: `board.name = "${name}"`,
                  sort: 'index'
               })

               return {
                  all: breads,
                  archived: breads.filter((t) => t.archived),

                  normal(sticky = false) {
                     return breads
                        .filter((t) => !t.archived)
                        .filter((t) => (sticky ? true : !t.sticky))
                  },

                  async ops(): Promise<Post[]> {
                     const ops = [] as Post[]

                     for (const thread of this.normal(true)) {
                        const op = await pb
                           .collection('post')
                           .getFirstListItem(`thread = "${thread.id}"`)

                        ops.push({
                           ...minify(op, ['id']),
                           thread: minify(thread, [], ['board'])
                        })
                     }

                     return ops
                  }
               }
            },

            async shift(s = 1) {
               const threads = (await this.threads()).normal()
               return threads.promise((t) =>
                  pb.collection('thread').update(t.id, {
                     index: t.index + s
                  })
               )
            },

            async archive() {
               const threads = await this.threads()

               return threads
                  .normal()
                  .filter((t) => t.index > doarb.threadCap)
                  .promise((t) =>
                     pb.collection('thread').update(t.id, {
                        archived: true
                     })
                  )
            }
         }
      }
   } catch {
      return null
   }
}

export async function Bread(board: string, thread: string) {
   function opie() {
      return pb
         .collection('post')
         .getFirstListItem<Post>(`no = "${thread}" && thread.board.name = "${board}"`, {
            expand: 'thread'
         })
   }

   try {
      const op = await opie()
      const bread = op.expand.thread as Record as Thread

      return {
         thread() {
            return pb.collection('thread').getOne<Thread>(bread.id)
         },

         posts() {
            return pb.collection('post').getFullList<Post>({
               filter: `thread = "${bread.id}"`,
               sort: 'created'
            })
         },

         async climb() {
            function index(i: number) {
               return pb
                  .collection('thread')
                  .getFirstListItem<Thread>(`board.name = "${board}" && index = ${i}`)
            }

            function addindex(thread: Thread, n: number) {
               return pb.collection('thread').update(thread.id, {
                  index: Math.max(thread.index + n, 1)
               })
            }

            const thread = await this.thread()

            try {
               const up = await index(thread.index - 1)
               if (!up.sticky) await addindex(up, 1)
            } catch {
               noop()
            }

            if (!thread.sticky) await addindex(thread, -1)
         },

         async updateCount(n = 1, i = 0) {
            const thread = await this.thread()

            pb.collection('thread').update(thread.id, {
               postCount: thread.postCount + n,
               imageCount: thread.imageCount + i
            })
         }
      }
   } catch {
      return null
   }
}
