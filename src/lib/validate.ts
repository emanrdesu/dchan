import { regex } from '$lib/misc'
import { pb } from '$lib/pocketbase'
import type { Board, Thread, User } from './types'

export default {
   ok(change = {}) {
      const def = { valid: true, message: '', field: '', zile: new File([], '') }
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

   latitude(n: string) {
      const x = +n
      return -90 <= x && x <= 90
   },

   longitude(n: string) {
      const x = +n
      return -180 <= x && x <= 180
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

   async url(link: string) {
      const url = {
         fail: false,
         meta: undefined as unknown as Request
      }

      url.meta = await fetch(link, { method: 'HEAD' })
         .then((r) => r)
         .catch((r) => {
            url.fail = true
            return r
         })

      if (url.fail) return this.err('Failed to fetch URL')

      const content = {
         type: url.meta.headers.get('content-type'),
         length: url.meta.headers.get('content-length')
      }

      if (content.type) {
         if (!content.type.match(regex.media)) {
            return this.err('URL not an image')
         }
      } else {
         return this.err('Missing type header')
      }

      if (content.length) {
         if (+content.length > 4194304) {
            return this.err('Resource too big')
         }
      } else {
         return this.err('Missing length header')
      }

      return this.ok()
   },

   async filexURL(file: File | null, url: string | undefined, filename: string, mode = 'thread') {
      if (file && file instanceof File && file.size > 0) {
         if (file.size > 4194304) return this.err('File too big', 'file')
         if (!file.type.match(regex.media)) return this.err('Invalid file type', 'file')
         if (file.name.length > 200) return this.err('Filename too big', 'file')
      } else if (url) {
         const { valid, message } = await this.url(url)

         if (!valid) return this.err(message, 'url')

         let fail = false
         file = await fetch(url)
            .then((r) => r.blob())
            .then((blob) => new File([blob], filename, { type: blob.type }))
            .catch(() => {
               fail = true
               return new File([], '')
            })

         if (fail) return this.err('Failed to fetch URL', 'url')
      } else {
         if (mode == 'post') return this.ok({ zile: null })
         else return this.err('No file/URL given', 'url')
      }

      return this.ok({ zile: file })
   }
}
