import { z } from 'zod'
import { races, genders, avatarStyles } from './misc'

function a2rx(arr: string[]) {
   const regex = '^(' + arr.join('|') + ')$'
   return new RegExp(regex)
}

function rxa(...rxs: RegExp[]): RegExp {
   return new RegExp(rxs.map((rx) => rx.source).join('|'))
}

const rx = {
   races: a2rx(races),
   genders: a2rx(genders),
   styles: a2rx(avatarStyles)
}

const base = {
   user: {
      username: z.string().toLowerCase().min(4).max(20),
      password: z.string().min(6)
   },

   post: {
      name: z.string().trim().max(50, 'Name too large.'),
      comment: z.string().trim().max(2000, 'Comment too large.'),
      gender: z.string().regex(rxa(rx.genders, /^none$/), 'Gender invalid.'),
      race: z.string().regex(rxa(rx.races, /^none$/), 'Race invalid.'),
      DMs: z.boolean().optional(),
      file: z.any().optional(),
      url: z.string().url().optional(),
      filename: z.string().max(200, 'Filename too big.').optional(),
      captcha: z.string().length(6).optional()
   }
}

export default {
   login: z.object({ ...base.user }),

   registration: z.object({
      ...base.user,
      confirm: z.string().min(1),
      gender: z.string().regex(rx.genders),
      race: z.string().regex(rx.races),
      avatarStyle: z.string().regex(rx.styles),
      avatarSeed: z.string().max(16),
      captcha: z.string().length(6)
   }),

   post: z.object({
      ...base.post,
      sage: z.boolean()
   }),

   thread: z.object({
      ...base.post,
      subject: z.string().trim().max(100, 'Subject too large.'),
      require: z.array(z.string().regex(rxa(rx.races, rx.genders, /^verified$/))).optional(),

      sticky: z.boolean().optional(),
      closed: z.boolean().optional()
   })
}
