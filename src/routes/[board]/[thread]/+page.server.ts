import schema from '$lib/schema'
import { pb, Boarb, Bread } from '$lib/pocketbase'
import { error, fail } from '@sveltejs/kit'
import { deleteReturn, random, format } from '$lib/misc'
import { setError, superValidate } from 'sveltekit-superforms/server'
import validate from '$lib/validate'

import type { Actions } from './$types'
import type { PageServerLoad } from './$types'
import type { Board, Post, Thread } from '$lib/types'

export const load: PageServerLoad = async ({ params, fetch }) => {
   const form = await superValidate(schema.post)

   const link = `/api/${params.board}/${params.thread}`
   const { message, thread, posts } = await fetch(link).then((r) => r.json())

   if (message) throw error(404, 'This thread does not exist')
   const board = (await fetch(`/api/${params.board}`).then((r) => r.json())) as Board

   return { form, board, thread: thread as Thread, posts: posts as Post[] }
}

export const actions: Actions = {
   default: async ({ request, params, fetch }) => {
      const formData = await request.formData()

      // delete duplicate newlines
      deleteReturn(formData, 'comment')

      const form = await superValidate(formData, schema.post)

      let board: Board, boarb, thread: Thread, bread
      let user, quotes: number[] | undefined, file: File | null, filename: string

      const err = (field: any, message: string, status = 400) => {
         setError(form, field, message)
         return fail(status, { form })
      }

      /* DATA GATHER */
      {
         // board
         boarb = await Boarb(params.board)
         if (boarb) board = await boarb.board()
         else throw error(404, 'This board does not exist.')

         // thread
         bread = await Bread(params.board, params.thread)
         if (bread) thread = await bread.thread()
         else throw error(404, 'This thread does not exist')

         user = await fetch('/api/user')
            .then((res) => res.json())
            .catch(() => ({ valid: false }))

         filename = form.data.filename || random.filename()
      }

      /* VALIDATION */
      {
         if (!form.valid) return fail(400, { form })

         // thread status

         if (thread.closed)
            if (!(user.valid && ['mod', 'founder'].includes(user.role)))
               return err('name', 'Thread is closed')

         if (thread.archived)
            if (!(user.valid && ['mod', 'founder'].includes(user.role)))
               return err('name', 'Thread is archived')

         // quotes (not validation)
         quotes = form.data.comment.match(/>>\d+/g)?.map((q) => +q.slice(2))

         // gender + race
         for (const attr of ['gender', 'race'] as ('gender' | 'race')[]) {
            const { valid, message } = validate.attr(attr, form.data[attr], thread)
            if (!valid) return err(attr, message)
         }

         // captcha
         {
            const { valid, message } = await validate.captcha(form.data.captcha, user)
            if (!valid) return err('captcha', message)
         }

         // file & URL
         {
            file = formData.get('file') as File | null

            const { valid, message, field, zile } = await validate.filexURL(
               file,
               form.data.url,
               filename,
               'post'
            )

            if (valid) file = zile
            else return err(field, message)
         }
      }

      /* CREATION */
      {
         const [eman, trip] = format.name(form.data.name)

         const postData = {
            no: await boarb.board().then((b) => b.postCount + 1),
            thread: thread.id,
            user: user.valid && user.id,
            name: eman,
            trip: trip,
            comment: form.data.comment,
            gender: form.data.gender != 'none' && form.data.gender,
            race: form.data.race != 'none' && form.data.race,
            canDM: form.data.DMs,
            media: file,
            replies: ' '
         }

         const postFormData = new FormData()

         for (const [key, value] of Object.entries(postData))
            if (value) postFormData.append(key, value)

         try {
            const post = await pb.collection('post').create<Post>(postFormData)

            await bread.updateCount(1, file ? 1 : 0)
            await boarb.updateCount(1)

            const postCount = await bread.thread().then((t) => t.postCount)
            if (!thread.sticky && !form.data.sage && postCount <= board.bumpLimit)
               await bread.climb()

            if (quotes) {
               const posts = await bread.posts()

               for (const no of quotes) {
                  const quote = posts.find((p) => p.no == no)
                  if (quote)
                     await pb.collection('post').update(quote.id, {
                        replies: `${quote.replies || ''} ${post.no}`
                     })
               }
            }
         } catch (e) {
            return err('file', 'Something went wrong')
         }
      }

      return { form }
   }
}
