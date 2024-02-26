<script lang="ts">
   import { onMount } from 'svelte'

   export let url: string

   let full = false

   let image: HTMLImageElement
   let loaded = false

   async function onImageClick(e: MouseEvent) {
      if (e.ctrlKey) {
         window.open(url, '_blank')
      } else {
         loaded = false
         full = !full
      }
   }

   onMount(() => {
      image.onload = () => (loaded = true)
      return () => {
         image.onload = null
      }
   })
</script>

<img
   src="{url}{full ? '' : '?thumb=250x0'}"
   bind:this={image}
   class:max-w-[85vw]={full}
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
