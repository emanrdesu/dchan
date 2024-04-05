import schema from '$lib/schema'
import { pb, Boarb } from '$lib/pocketbase'
import { intersection } from 'lodash'
import { error, fail } from '@sveltejs/kit'
import { deleteReturn, format, calculateMD5, errorer, bool } from '$lib/misc'
import { setError, superValidate } from 'sveltekit-superforms/server'
import type { Actions } from './$types'
import type { Board, Filter, Post, User } from '../../lib/types'
import type { PageServerLoad } from './$types'
import validate from '$lib/validate'

export const load: PageServerLoad = async ({ params, parent, fetch, depends }) => {
   await parent()
   depends('board')

   let link = `/api/${params.board}?catalog`
   const form = await superValidate(schema.thread)

   let { message, ops } = await fetch(link).then((r) => r.json())
   if (message) throw error(404, 'This board does not exist.')

   return { ops: ops as Post[], form }
}

export const actions: Actions = {
   deleteFilter: async ({ request, fetch }) => {
      const formData = await request.formData()
      const id = formData.get('id')

      const form = await superValidate(formData, schema.empty)
      const user: User = await fetch('/api/user')
         .then((res) => res.json())
         .catch(() => {
            valid: false
         })

      if (!user.valid) return fail(400, { form })
      const err = errorer(form)
      if (!id) return err('foo', 'No filter ID given')

      try {
         const filter = (await pb
            .collection('filter')
            .getOne(id as string, { expand: 'user' })) as Filter

         if ((filter.expand.user as User).id != user.id) {
            return fail(401, { form })
         }

         try {
            await pb.collection('filter').delete(filter.id)
         } catch {
            return err('foo', 'Failted to delete filter')
         }
      } catch {
         return err('foo', 'Invalid ID')
      }

      return { form }
   },

   saveFilter: async ({ request, fetch, params }) => {
      const formData = await request.formData()
      const form = await superValidate(formData, schema.filter)
      const user: User = await fetch('/api/user')
         .then((res) => res.json())
         .catch(() => {
            valid: false
         })

      const board: Board | null = await fetch(`/api/${params.board}`)
         .then((res) => res.json())
         .catch(() => null)

      if (!user.valid || !board) return fail(400, { form })

      const err = errorer(form)

      const op = formData.get('op')
      const post = formData.get('post')
      const genders = formData.getAll('gender')
      const races = formData.getAll('race')

      const regex = {
         name: formData.get('name') || '',
         subject: formData.get('subject') || '',
         comment: formData.get('comment') || '',
         media: formData.get('media') || ''
      }

      // VALIDATION
      if (
         genders.length == 0 &&
         races.length == 0 &&
         regex.name == '' &&
         regex.subject == '' &&
         regex.comment == '' &&
         regex.media == ''
      )
         return err('op', 'Empty filter')

      if (!op && !post) return err('op', 'Must set filter type(s).')

      for (const key of Object.keys(regex) as ('name' | 'subject' | 'comment' | 'media')[])
         if (regex[key] != '') {
            try {
               new RegExp(regex[key] as string, 'g')
            } catch {
               return err(key, 'Invalid regular expression')
            }
         }

      // CREATION
      try {
         await pb.collection('filter').create({
            user: user.id,
            board: board.id,
            op: bool(op),
            post: bool(post),
            gender: genders,
            race: races,
            ...regex
         })
      } catch (e) {
         return err('op', 'Failed to save filter.')
      }

      return { form }
   },

   post: async ({ request, fetch, params }) => {
      const formData = await request.formData()

      // delete duplicate newlines
      deleteReturn(formData, 'comment')

      const form = await superValidate(formData, schema.thread)

      let board: Board, boarb
      let user, genders, races, file: File | null, hash: string | null
      hash = null

      const err = errorer(form)

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

         // file
         {
            file = formData.get('file') as File | null
            const { valid, message, field, zile } = await validate.file(file)
            if (valid) file = zile
            else return err(field, message)

            if (file) {
               try {
                  hash = await calculateMD5(file)
                  const ops = await boarb.catalog.threads()
                  const hashList = await ops.hashList()

                  if (hashList.includes(hash)) {
                     return err('file', 'File already exists')
                  }
               } catch {
                  return err('file', 'Error calculating MD5 hash')
               }
            }
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
            title: format.title(form.data.subject ? form.data.subject : form.data.comment),
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
            mediaHash: hash,
            replies: ' '
         }

         const postFormData = new FormData()

         for (const [key, value] of Object.entries(postData)) {
            if (value) {
               postFormData.append(key, value)
            }
         }

         try {
            if (user.valid) {
               await pb.collection('starred').create({
                  user: user.id,
                  board: params.board,
                  thread: thread.id,
                  threadNumber: postData.no
               })
            }

            await pb.collection('post').create(postFormData)
         } catch {
            await pb.collection('thread').delete(thread.id)
            await boarb.updateCount(-1)
            await boarb.catalog.shift(-1)
            return err('file', 'Invalid file')
         }

         await boarb.catalog.archive()

         return { form, threadNO: postData.no }
      }
   }
}
