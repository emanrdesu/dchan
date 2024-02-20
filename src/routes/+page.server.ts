import { pb } from '$lib/pocketbase'
import { fail } from '@sveltejs/kit'
import schema from '$lib/schema'
import { minify } from '$lib/misc'
import sha256 from 'crypto-js/sha256'
import { setError, superValidate } from 'sveltekit-superforms/server'
import type { Actions, PageServerLoad } from './$types'
import type { Board } from '$lib/types'

export const load: PageServerLoad = async ({ parent, request }) => {
   const { user } = await parent()

   const form = await superValidate(request, schema.login, { id: 'loginForm' })

   const boards = await pb
      .collection('board')
      .getFullList<Board>({ sort: 'name', expand: 'category' })

   return { user, form, boards: minify(boards, ['expand']) as Board[] }
}

export const actions: Actions = {
   login: async ({ request, cookies }) => {
      const form = await superValidate(request, schema.login)

      if (!form.valid) return fail(400, { form })

      const passwordHash = sha256(form.data.password).toString()
      const query = `username = "${form.data.username}" && password = "${passwordHash}"`

      try {
         const uuid = crypto.randomUUID()
         const user = await pb.collection('user').getFirstListItem(query)

         const otherSessions = await pb
            .collection('session')
            .getFullList({ filter: `user = "${user.id}"` })
         for (const s of otherSessions) await pb.collection('session').delete(s.id)

         await pb.collection('session').create({
            user: user.id,
            uuid: uuid
         })

         cookies.set('session', uuid)
      } catch {
         setError(form, 'password', 'Invalid username or password.')
         return fail(400, { form })
      }

      return { form }
   },

   logout: async ({ cookies }) => {
      cookies.delete('session', { path: '/' })
   }
}
