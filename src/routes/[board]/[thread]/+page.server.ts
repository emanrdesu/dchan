import schema from '$lib/schema'
import { pb, Boarb, Bread } from '$lib/pocketbase'
import { error, fail } from '@sveltejs/kit'
import { deleteReturn, format, calculateMD5 } from '$lib/misc'
import { setError, superValidate } from 'sveltekit-superforms/server'
import validate from '$lib/validate'

import type { Actions } from './$types'
import type { PageServerLoad } from './$types'
import type { Board, Post, Thread, User } from '$lib/types'
import { find } from 'lodash'

export const load: PageServerLoad = async ({ params, fetch }) => {
   const form = await superValidate(schema.post)

   const link = `/api/${params.board}/${params.thread}`
   const { message, thread, posts } = await fetch(link).then((r) => r.json())

   if (message) throw error(404, 'This thread does not exist')
   const board = (await fetch(`/api/${params.board}`).then((r) => r.json())) as Board

   return {
      slug: { board: params.board, thread: params.thread },
      form,
      board,
      thread: thread as Thread,
      posts: posts as Post[]
   }
}

export const actions: Actions = {
   star: async ({ request, params, fetch }) => {
      const form = await superValidate(await request.formData(), schema.empty)
      const user: User = await fetch('/api/user')
         .then((res) => res.json())
         .catch(() => ({ valid: false }))

      if (!user.valid) return fail(400, { form })

      // prettier-ignore
      if (find(user.starred, (s) => s.board == params.board && s.threadNumber == +params.thread))
         return fail(409, { form })

      let threadID

      try {
         threadID = await fetch(`/api/${params.board}/${params.thread}?id`).then((r) => r.json())
      } catch {
         return fail(400, { form })
      }

      await pb.collection('starred').create({
         user: user.id,
         board: params.board,
         thread: threadID,
         threadNumber: params.thread
      })

      return { form }
   },

   unstar: async ({ request, params, fetch }) => {
      const form = await superValidate(await request.formData(), schema.empty)
      const user: User = await fetch('/api/user')
         .then((res) => res.json())
         .catch(() => ({ valid: false }))

      if (!user.valid) return fail(400, { form })

      try {
         const filter = `user = "${user.id}" && board = "${params.board}" && threadNumber = "${params.thread}"`
         const star = await pb.collection('starred').getFirstListItem(filter)
         await pb.collection('starred').delete(star.id)
         return { form }
      } catch {
         return fail(400, { form })
      }
   },

   post: async ({ request, params, fetch }) => {
      const formData = await request.formData()

      // delete duplicate newlines
      deleteReturn(formData, 'comment')

      const form = await superValidate(formData, schema.post)

      let board: Board, boarb, thread: Thread, bread
      let user: User, quotes: number[] | undefined, file: File | null, hash: string | null

      hash = null

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

         if (thread.verified) {
            if (user.valid) {
               if (user.verified) {
                  if (!thread.genders.includes(user.gender))
                     return err('gender', `${user.gender.titleCase()}s not allowed`)

                  if (!thread.races.includes(user.race))
                     return err('race', `${user.race.titleCase()} people not allowed`)
               } else {
                  if (!['mod', 'founder'].includes(user.role))
                     return err('name', 'Must be verified to post')
               }
            } else {
               return err('name', 'Must be logged in to post')
            }
         }

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

         // file
         {
            file = formData.get('file') as File | null

            const { valid, message, field, zile } = await validate.file(file, 'post')

            if (valid) file = zile
            else return err(field, message)

            if (file) {
               try {
                  hash = await calculateMD5(file)
                  const hashList = await bread.hashList()

                  if (hashList.includes(hash)) {
                     return err('file', 'File already exists')
                  }
               } catch {
                  return err('file', 'Error calculating MD5 hash')
               }
            } else {
               if (form.data.comment.trim().length == 0)
                  return err('comment', "Post can't be empty")
            }
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
            mediaHash: hash,
            replies: ' '
         }

         const postFormData = new FormData()

         for (const [key, value] of Object.entries(postData)) {
            // @ts-ignore
            if (value) postFormData.append(key, value)
         }

         const checkpoint = {
            postCreate: false,
            countUpdate: false
         }

         try {
            const post = await pb.collection('post').create<Post>(postFormData)
            checkpoint.postCreate = true

            if (user.valid) {
               await pb.collection('user').update(user.id, {
                  points: user.points + 1
               })
            }

            await bread.updateCount(1, file ? 1 : 0)
            await boarb.updateCount(1)
            checkpoint.countUpdate = true

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
            if (checkpoint.countUpdate) {
               await bread.updateCount(-1, file ? -1 : 0)
               await boarb.updateCount(-1)
            }

            return err('file', 'Invalid file')
         }
      }

      return { form }
   }
}
