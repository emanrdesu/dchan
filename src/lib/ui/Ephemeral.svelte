<script lang="ts">
   import { onMount } from 'svelte'
   import { fly } from 'svelte/transition'

   export let duration: number
   let show = true

   onMount(() => {
      setTimeout(() => {
         show = false
      }, Math.round(duration * 1000))
   })
</script>

{#if show}
   <div transition:fly>
      <slot />
   </div>
{/if}
