import svgCaptcha from 'svg-captcha'
import { pb, cleanup } from '$lib/pocketbase'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async () => {
   cleanup.captcha()

   const captcha = svgCaptcha.create({
      size: 6,
      color: true,
      noise: 4
   })

   pb.collection('captcha').create({
      text: captcha.text.toLowerCase()
   })

   const res = new Response(captcha.data)
   res.headers.set('Content-Type', 'image/svg+xml')

   return res
}
