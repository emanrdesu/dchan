import schema from '$lib/schema'
import { minify } from '$lib/misc'
import { superValidate } from 'sveltekit-superforms/server'
import type { User } from '$lib/types'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ request, fetch }) => {
   const user = await fetch('/api/user')
      .then((res) => res.json())
      .catch(() => {
         return {
            valid: false
         }
      })

   const form = await superValidate(request, schema.login)
   return { user: minify(user, ['expand', 'id']) as User, form }
}
