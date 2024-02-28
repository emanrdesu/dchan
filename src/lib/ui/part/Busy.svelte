<script lang="ts">
   import Icon from '@iconify/svelte'
   import { workLoad } from '$lib/stores'

   const busyIcons = [
      '3-dots-bounce',
      '3-dots-fade',
      '3-dots-move',
      '3-dots-rotate',
      '3-dots-scale',
      '3-dots-scale-middle',
      'gooey-balls-2',
      'bouncing-ball'
   ]

   const icon = busyIcons.randelt()
   const size = 22

   $: busy = $workLoad > 0
</script>

{#if busy}
   <Icon icon="svg-spinners:{icon}" width={size} />
{/if}

<slot />

{#if busy}
   <Icon icon="svg-spinners:{icon}" width={size} />
{/if}
