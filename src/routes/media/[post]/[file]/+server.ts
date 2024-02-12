import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, fetch, url }) => {
   const base = 'http://127.0.0.1:8090/api/files/post'
   return await fetch(`${base}/${params.post}/${params.file}${url.search}`)
}
