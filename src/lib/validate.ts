import { regex } from '$lib/misc'
import { pb } from '$lib/pocketbase'
import type { Board, Thread, User } from './types'

export default {
   ok(change = {}) {
      const def = { valid: true, message: '', field: '', zile: new File([], '') }
      // @ts-ignore
      for (const p in change) def[p] = change[p]
      return def
   },

   err(message: string, field = '', zile = new File([], '')) {
      return { valid: false, message, field, zile }
   },

   attr(attr: 'gender' | 'race', value: string, source: Board | Thread) {
      if (value != 'none' && !source[attr + 's'].includes(value)) {
         return this.err(`Invalid ${attr}`, attr)
      }

      return this.ok()
   },

   async captcha(text: string | undefined, user: User) {
      if (text) {
         try {
            const captcha = await pb.collection('captcha').getFirstListItem(`text="${text}"`)
            await pb.collection('captcha').delete(captcha.id)
         } catch {
            return this.err('Invalid captcha')
         }
      } else {
         if (!(user.valid && ['mod', 'founder'].includes(user.role))) {
            return this.err('Missing captcha')
         }
      }

      return this.ok()
   },

   async file(file: File | null, mode = 'thread') {
      if (file && file instanceof File && file.size > 0) {
         if (file.size > 4194304) return this.err('File too big', 'file')
         if (!file.type.match(regex.media)) return this.err('Invalid file type', 'file')
         if (file.name.length > 200) return this.err('Filename too big', 'file')
      } else {
         if (mode == 'post') return this.ok({ zile: null })
         else return this.err('No file given', 'file')
      }

      return this.ok({ zile: file })
   }
}
