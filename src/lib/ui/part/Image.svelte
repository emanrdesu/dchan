<script lang="ts">
   import { workLoad } from '$lib/stores'
   import { createEventDispatcher, onMount } from 'svelte'

   export let url: string
   let full = false

   let image: HTMLImageElement
   let loaded = false

   const dispatch = createEventDispatcher()

   async function onImageClick(e: MouseEvent) {
      if (e.ctrlKey) {
         window.open(url, '_blank')
      } else {
         loaded = false
         $workLoad++
         full = !full

         dispatch('delta', { value: full })
      }
   }

   const complete = () => {
      loaded = true
      if (--$workLoad < 0) $workLoad = 0
   }

   onMount(() => {
      if (image.complete) complete()
      image.onload = complete

      return () => {
         image.onload = null
      }
   })
</script>

<img
   src="{url}{full ? '' : '?thumb=250x0'}"
   bind:this={image}
   class:max-w-[75vw]={full}
   class:max-h-[90vh]={full}
   class:max-h-40={!full}
   class:max-w-[160px]={!full}
   style:transition="all 600ms ease-out, filter 300ms ease-out"
   on:click={onImageClick}
   on:keydown={() => null}
   class:blur-sm={!loaded}
   class="rounded-sm cursor-pointer"
   alt="Post"
   loading="lazy"
/>
