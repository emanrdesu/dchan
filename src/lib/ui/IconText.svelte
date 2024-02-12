<script lang="ts">
   export let add = ''
   export let text = ''
   export let width = 4
   export let swap = false
</script>

<div class="flex items-center gap-1 normal-case {add}">
   {#if swap}
      {text}
   {/if}
   <div class="w-{width}">
      <slot />
   </div>
   {#if !swap}
      {text}
   {/if}
</div>
