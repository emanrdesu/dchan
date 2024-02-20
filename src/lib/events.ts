import { goto } from '$app/navigation'

function canSeeHalf(element: HTMLElement): boolean {
   const r = element.getBoundingClientRect()

   const halfHeight = r.height / 2
   const top = r.top + halfHeight
   const bottom = r.bottom - halfHeight
   return top >= 0 && bottom <= window.innerHeight
}

function flashPost(id: string): void {
   const post = document.getElementById(id) as HTMLElement

   setTimeout(() => {
      post.classList.add('bg-neutral-focus')

      setTimeout(() => {
         post.classList.remove('bg-neutral-focus')
      }, 200)
   }, 150)
}

export function onReplyHover(id: string) {
   return (e: MouseEvent) => {
      const d = document.documentElement
      const reply = document.getElementById(id) as HTMLElement
      const r = { w: reply.clientWidth, h: reply.clientHeight }

      if (reply) {
         if (canSeeHalf(reply)) {
            reply.classList.add('bg-neutral-focus')
            return
         }

         const copy = reply.cloneNode(true) as HTMLElement
         copy.id = `copy${id}`
         copy.style.position = 'fixed'
         copy.style.zIndex = '20'

         const px = { nav: 35, pad: 30 }

         const left = d.clientWidth - e.clientX < e.clientX

         if (left) copy.style.left = Math.max(e.clientX - (px.pad - 10) - r.w, 5) + 'px'
         else copy.style.left = e.clientX + px.pad + 'px'

         copy.style.top = Math.max(px.nav, e.clientY - Math.floor(r.h / 2)) + 'px'
         copy.style.maxHeight = '93vh'

         if (left) copy.style.maxWidth = `${e.clientX - (px.pad - 10)}px`
         else copy.style.maxWidth = `calc(95vw - ${e.clientX + px.pad}px)`

         copy.style.overflow = 'hidden'
         copy.className = `${copy.className} border border-neutral-focus`
         d.append(copy)
      }
   }
}

export function onReplyMove(id: string) {
   return (e: MouseEvent) => {
      const copy = document.getElementById(`copy${id}`)

      if (copy) {
         // @ts-ignore
         const copyLeft = +copy.style.left.match(/[\d\.]+/)[0]
         // @ts-ignore
         const copyTop = +copy.style.top.match(/[\d\.]+/)[0]

         copy.style.left = `${copyLeft + e.movementX}px`
         copy.style.top = `${Math.max(copyTop + e.movementY, 40)}px`
      }
   }
}

export function scrollToID(id: string) {
   return async (e: Event) => {
      e.preventDefault()

      await goto(`#${id}`, {
         keepFocus: false,
         noScroll: true
      })

      const target = document.getElementById(id) as HTMLElement

      const [w, d] = [window, document.documentElement]
      const r = target.getBoundingClientRect()

      const actualTop = r.top + w.scrollY
      const middle = actualTop - d.clientHeight / 2 + r.height / 2

      window.scrollTo(0, middle)
      flashPost(id)
   }
}

export function onReplyLeave(id: string) {
   return () => {
      const reply = document.getElementById(id)
      const target = document.getElementById(`copy${id}`)

      reply?.classList.remove('bg-neutral-focus')
      if (target) target.remove()
   }
}
