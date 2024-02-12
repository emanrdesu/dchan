import schema from '$lib/schema'
import { pb, Boarb } from '$lib/pocketbase'
import { intersection } from 'lodash'
import { error, fail } from '@sveltejs/kit'
import { random, deleteReturn, format } from '$lib/misc'
import { setError, superValidate } from 'sveltekit-superforms/server'
import type { Actions } from './$types'
import type { Board, Post } from '../../lib/types'
import type { PageServerLoad } from './$types'
import validate from '$lib/validate'

export const load: PageServerLoad = async ({ params, parent, fetch, url }) => {
   await parent()

   const query = (param: string) => url.searchParams.has(param)
   const get = (param: string) => url.searchParams.get(param)

   let link = `/api/${params.board}?catalog`

   let { message, ops } = await fetch(link).then((r) => r.json())
   if (message) throw error(404, 'This board does not exist.')

   const form = await superValidate(schema.thread)

   return { ops: ops as Post[], form }
}

export const actions: Actions = {
   default: async ({ request, fetch, params }) => {
      const formData = await request.formData()

      // delete duplicate newlines
      deleteReturn(formData, 'comment')

      const form = await superValidate(formData, schema.thread)

      let board: Board, boarb
      let user, genders, races, file: File | null, filename: string

      const err = (field: any, message: string, status = 400) => {
         setError(form, field, message)
         return fail(status, { form })
      }

      /* DATA GATHER */
      {
         boarb = await Boarb(params.board)
         if (boarb) board = await boarb.board()
         else throw error(404, 'This board does not exist.')

         user = await fetch('/api/user')
            .then((res) => res.json())
            .catch(() => ({ valid: false }))

         genders = form.data.require
            ? intersection(form.data.require, board.genders)
            : board.genders
         if (genders.length == 0) genders = board.genders

         races = form.data.require ? intersection(form.data.require, board.races) : board.races
         if (races.length == 0) races = board.races

         filename = form.data.filename || random.filename()
      }

      /* VALIDATION */
      {
         if (!form.valid) return fail(400, { form })

         // gender + race

         for (const attr of ['gender', 'race'] as ('gender' | 'race')[]) {
            const { valid, message } = validate.attr(attr, form.data[attr], board)
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
               filename
            )

            if (valid) file = zile
            else return err(field, message)
         }

         // sticky/closed
         if (form.data.sticky || form.data.closed)
            if (!user.valid || (user.valid && !['founder', 'mod'].includes(user.role)))
               return err('sticky', 'User is not a mod or founder', 401)
      }

      /* CREATION */
      {
         // thread

         if (!form.data.sticky) {
            await boarb.catalog.shift()
         }

         const thread = await pb.collection('thread').create({
            board: board.id,
            index: form.data.sticky ? 0 : 1,
            sticky: form.data.sticky ? true : false,
            closed: form.data.closed ? true : false,
            archived: false,
            genders,
            races,
            verified: form.data.require ? form.data.require.includes('verified') : false
         })

         // post
         await boarb.updateCount(1)

         const [eman, trip] = format.name(form.data.name)

         const postData = {
            no: board.postCount + 1,
            thread: thread.id,
            user: user.valid && user.id,
            name: eman,
            trip: trip,
            subject: form.data.subject,
            comment: form.data.comment,
            gender: form.data.gender != 'none' && form.data.gender,
            race: form.data.race != 'none' && form.data.race,
            canDM: form.data.DMs,
            media: file,
            replies: ' '
         }

         const postFormData = new FormData()

         for (const [key, value] of Object.entries(postData)) {
            if (value) {
               postFormData.append(key, value)
            }
         }

         try {
            await pb.collection('post').create(postFormData)
         } catch {
            await pb.collection('thread').delete(thread.id)
            await boarb.updateCount(-1)
            await boarb.catalog.shift(-1)
            return err('file', 'Invalid file/URL')
         }

         await boarb.catalog.archive()

         return { form, threadNO: postData.no }
      }
   }
}