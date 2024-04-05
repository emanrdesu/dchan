import { escape } from 'html-escaper'
import type { gender, race, status } from '$lib/types'
import { difference, intersection, take } from 'lodash'
import des3 from 'crypto-js/tripledes'
import CryptoJS from 'crypto-js'
import { setError } from 'sveltekit-superforms/server'
import { fail } from '@sveltejs/kit'

export function minify(o: object, except = [] as string[], remove = [] as string[]): object {
   const useless = ['collectionId', 'collectionName', 'expand', 'id', 'updated', 'created']

   if (typeof o !== 'object' || o === null) {
      return o
   }

   if (Array.isArray(o)) {
      return o.map((y) => minify(y, except, remove))
   }

   const copy = {}

   for (const [key, value] of Object.entries(o)) {
      if ((useless.includes(key) || remove.includes(key)) && !except.includes(key)) continue
      // @ts-ignore
      copy[key] = minify(value, except, remove)
   }

   return copy
}

export function show<T>(o: T) {
   console.log(o)
   return o
}

// @ts-ignore
export function errorer(form) {
   return (field: any, message: string, status = 400) => {
      setError(form, field, message)
      return fail(status, { form })
   }
}

export const icons = {
   race: {
      white: 'emojione:glass-of-milk',
      black: 'fluent-emoji-flat:watermelon',
      latino: 'twemoji:taco',
      asian: 'noto:rice-ball',
      indian: 'emojione:pile-of-poo',
      arabic: 'fluent-emoji-flat:camel',
      jewish: 'emojione:star-of-david'
   },

   gender: {
      male: { color: 'text-blue-300', icon: 'material-symbols:male' },
      female: { color: 'text-pink-300', icon: 'material-symbols:female' }
   },

   status: {
      sticky: { icon: 'pajamas:thumbtack-solid', color: 'text-info' },
      closed: { icon: 'foundation:lock', color: 'text-primary' }
   }
}

export const races = Object.keys(icons.race) as race[]
export const genders = Object.keys(icons.gender) as gender[]
export const stati = Object.keys(icons.status) as status[]
export const avatarStyles = ['lorelei', 'notionists', 'micah', 'open-peeps', 'croodles']

export const keyboardClick = (e: KeyboardEvent) => {
   if (e.code == 'Space' || e.code == 'Enter') {
      if (e.target) (e.target as HTMLButtonElement).click()
   }

   if (e.code != 'Tab') e.preventDefault()
}

export const format = {
   title(t: string) {
      return take(t.split('\n\r')[0].split(' '), 10).join(' ').slice(0, 50)
   },

   date(d: string) {
      const date = new Date(d)
      const options = [{ year: '2-digit', month: '2-digit', day: '2-digit' }, { weekday: 'short' }]

      return (
         // @ts-ignore
         options.map((o) => date.toLocaleDateString('en-US', o)).join(' ') +
         ' ' +
         date.toTimeString().split(' ')[0]
      )
   },

   name(name: string) {
      if (name.match(/#/g)?.length != 1) return [name, '']

      const r = /^([^#]+)#([^#]+)$/
      const eman = name.replace(r, '$1')
      const trip = name.replace(r, '$2')

      const length = 8
      return [
         eman,
         des3
            .encrypt(eman, trip)
            .toString()
            .slice(-length)
            .replace(/\+/, 'P')
            .replace(/=/g, 'Z')
            .replace(/\//, 'S')
      ]
   },

   // prettier-ignore
   timeago(date: string) {
      const now = new Date();
      const diff = now.getTime() - (new Date(date)).getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      const months = Math.floor(days / 30)
      const years = Math.floor(months / 12)

      if (years > 0) {
         return `${years} year${years > 1 ? 's' : ''}, ${months % 12} month${months % 12 > 1 ? 's' : ''}, ${days % 30} day${days % 30 > 1 ? 's' : ''} ago`;
      } else if (months > 0) {
         return `${months} month${months > 1 ? 's' : ''}, ${days % 30} day${days % 30 > 1 ? 's' : ''} ago`;
      } else if (days > 0) {
         return `${days} day${days > 1 ? 's' : ''} ago`;
      } else if (hours > 0) {
         return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else if (minutes > 0) {
         return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else {
         return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
      }
    },

   comment(c: string, op = 0) {
      const klass = 'link blout link-neutral hover:link-secondary text-neutral-content'

      return escape('\n' + c)
         .replace(
            /[\n\r]&gt;&gt;&gt;\/([a-zA-Z]+)\/([\d#]*)/g,
            `\n<a class="${klass}" href="/$1/$2">&gt;&gt;&gt;/$1/$2</a>`
         ) // redirect
         .replace(new RegExp(`[\\n\\r]&gt;&gt;${op}`, 'g'), `\n&gt;&gt;${op}${op ? ' (OP)' : ''}`)
         .replace(
            /[\n\r]&gt;&gt;(\d+)(\s\(OP\))?/g,
            `\n<a class="quote ${klass}" data-quote="$1" href="#$1">&gt;&gt;$1$2</a>`
         ) // quote
         .replace(
            /((http|https|ftp):\/\/[^\s/$.?#].[^\s]*)/gi,
            `<a class="${klass}" href="$1">$1</a>`
         ) // link
         .replace(/[\n\r]&gt;(.*)/g, `\n<span class="text-success">&gt;$1</span>`) // greentext
         .replace(/[\n\r]&lt;(.*)/g, `\n<span class="text-info">&lt;$1</span>`) // bluetext
         .replace(/##([^#\n\r]+)##/g, `<span class="text-lg leading-4">$1</span>`) // header
         .replace(/~~([^~\n\r]+)~~/g, `<span class="spoiler">$1</span>`) // spoiler
         .replace(/\*\*([^\*\n\r]+)\*\*/g, `<span class="font-bold">$1</span>`) // bold
         .replace(/==([^=\n\r]+)==/g, `<span class="font-mono">$1</span>`) // mono
         .trim()
         .replace(/[\n\r]{3,}/g, '\n\n') // delete extraneous newline
         .replace(/[\n]/g, '<br>') // newline
   },

   filename(name: string | File) {
      return (name as string).replace(/_[^_]+\.(png|jpg|gif|jpeg)/g, '.$1').replace(/_/g, ' ')
   }
}

export const regex = {
   media: /^(image\/(png|jpeg|jpg|gif))$/
}

const choices = {
   contempt: ['🤦🏿', '😒', '🙄', '😐'],
   hi: [
      "Oh no, it's you again",
      'Not you again',
      'Back for more?',
      "Don't shitpost too hard",
      "Don't be racist today",
      "Don't be sexist today",
      'Why do you keep coming back?',
      'Please go away sometime',
      "It's actually free to stop coming here",
      'One chance at life and you spend it here',
      'Why are you back?'
   ],

   bye: [
      'Yes get out!!',
      'Good riddance.',
      "Don't come back today.",
      'Decided to finally touch grass?',
      'Finally, no more of you.',
      'Also, try deleting your account.',
      `Go do your homework ${'n' + 'i' + 'g' + 'g' + 'a'}.`,
      'Go do your laundry, swine.',
      "I'm too good for you anyways.",
      'If you could also not come back, ever.'
   ],

   success: ['Success.', 'Deed = Done.', 'Done.', "All's good.", 'Finished.']
}

export const random = {
   desire(n = 0.5) {
      return Math.random() < n
   },

   filename(n = 20) {
      let result = ''
      for (let i = 0; i < n; i++) {
         result += Math.floor(Math.random() * 10)
      }
      return result
   },

   welcome() {
      const suffix = this.desire(0.2) ? ` ${choices.contempt.randelt()}` : '.'
      return (choices.hi.randelt() + suffix).replace(/\?\./, '?')
   },

   goodbye() {
      return choices.bye.randelt()
   },

   success() {
      return choices.success.randelt()
   }
}

// @ts-ignore
export function bool(x) {
   return x ? true : false
}

export function deleteReturn(formData: FormData, field: string): void {
   const value = formData.get(field) as string | null
   if (value && !((value as any) instanceof Blob)) {
      formData.set('value', value.replace(/[\r]/g, ''))
   }
}

export function mininfo(arrayA: string[], arrayB: string[]) {
   const diff = difference(arrayB, arrayA)
   const int = intersection(arrayB, arrayA)

   const test = diff.length < int.length
   return {
      exclude: test,
      array: test ? diff : int
   }
}

export function copyToClipboard(text: string) {
   const textarea = document.createElement('textarea')
   textarea.value = text
   document.body.appendChild(textarea)
   textarea.select()
   document.execCommand('copy')
   document.body.removeChild(textarea)
}

export async function calculateMD5(file: File) {
   // @ts-ignore
   const wordArray = CryptoJS.lib.WordArray.create(await file.arrayBuffer())
   return CryptoJS.MD5(wordArray).toString(CryptoJS.enc.Hex)
}
