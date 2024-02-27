<script lang="ts">
   import type { Post } from '$lib/types'
   import { onMount } from 'svelte'
   export let op: Post

   let image: HTMLImageElement
   let loaded = false

   onMount(() => {
      if (image.complete) loaded = true
      image.onload = () => (loaded = true)
      return () => {
         image.onload = null
      }
   })
</script>

<img
   bind:this={image}
   style:max-width="min(100%, 180px)"
   class:blur-sm={!loaded}
   style:transition="filter 300ms ease-out"
   class="rounded-sm max-h-[150px] mb-1"
   src="/media/{op.id}/{op.media}?thumb=250x0"
   alt="op"
/>
