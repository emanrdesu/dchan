<script lang="ts">
   import Icon from '@iconify/svelte'
   import { copyToClipboard } from '$lib/misc'

   export let icon: string
   export let text: string

   let showMessage = false
</script>

<div
   class="tooltip hover:cursor-copy"
   data-tip={text}
   on:click={() => {
      copyToClipboard(text)
      showMessage = true

      setTimeout(() => {
         showMessage = false
      }, 1500)
   }}
>
   <Icon {icon} />
</div>

{#if showMessage}
   <div class="toast text-sm">
      <div class="alert alert-info">
         <span>Address copied.</span>
      </div>
   </div>
{/if}
