import schema from '$lib/schema'
import { pb } from '$lib/pocketbase'
import { fail } from '@sveltejs/kit'
import sha256 from 'crypto-js/sha256'
import { setError, superValidate } from 'sveltekit-superforms/server'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
   const form = await superValidate(schema.registration)
   return { form }
}

export const actions = {
   default: async ({ request }) => {
      const formData = await request.formData()
      const form = await superValidate(formData, schema.registration)

      if (!form.valid) return fail(400, { form })

      try {
         const captcha = await pb
            .collection('captcha')
            .getFirstListItem(`text = "${form.data.captcha}"`)

         await pb.collection('captcha').delete(captcha.id)
      } catch {
         setError(form, 'captcha', 'Invalid captcha.')
         return fail(400, { form })
      }

      if (form.data.password != form.data.confirm) {
         setError(form, 'confirm', 'Confirm is not equal to password')
         return fail(400, { form })
      }

      try {
         await pb.collection('user').getFirstListItem(`username = "${form.data.username}"`)
         setError(form, 'username', 'Username already taken.')
         return fail(422, { form })
      } catch {
         try {
            await pb.collection('user').create({
               username: form.data.username,
               password: sha256(form.data.password).toString(),
               role: 'user',
               gender: form.data.gender,
               race: form.data.race,
               verified: false,
               avatarStyle: form.data.avatarStyle,
               avatarSeed: form.data.avatarSeed
            })

            return { form }
         } catch {
            return fail(500, { form })
         }
      }
   }
} satisfies Actions
