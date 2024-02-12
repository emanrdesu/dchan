<script lang="ts">
   import Icon from '@iconify/svelte'

   type IconSwap = {
      icon: string
      color: string
      tip: string
   }

   export let one: IconSwap
   export let two: IconSwap
   export let size = 22
   export let add = ''
   export let state = false
</script>

<div on:click={() => (state = !state)} class="{add} tooltip" data-tip={state ? two.tip : one.tip}>
   {#if state}
      <Icon class="text-{two.color}" icon={two.icon} width={size} height={size} />
   {:else}
      <Icon class="text-{one.color}" icon={one.icon} width={size} height={size} />
   {/if}
</div>
