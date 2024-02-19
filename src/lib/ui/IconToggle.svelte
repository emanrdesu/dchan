<script lang="ts">
   import { keyboardClick } from '$lib/misc'
   import Icon from '@iconify/svelte'
   import { fade } from 'svelte/transition'

   export let name: string
   export let icon: string
   export let size = 22
   export let tip = ''
   export let add = ''
   export let color = ''
   export let interact = false
   export let value = 'true'

   let active = false
</script>

<div transition:fade|local class="{add} tooltip" data-tip={tip}>
   <div
      tabindex={interact ? 0 : -1}
      class:opacity-30={!active}
      class:opacity-100={active}
      style:transition="opacity 300ms ease"
      on:click={() => (active = !active)}
      on:keydown={keyboardClick}
      class="cursor-pointer outline-neutral"
   >
      {#if active}<input type="hidden" {name} {value} />{/if}
      <Icon class={color} {icon} width={size} height={size} />
   </div>
</div>
