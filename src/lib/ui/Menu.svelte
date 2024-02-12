<script lang="ts">
   export let vertical = false
   export let add = ''
</script>

<div class="menú flex {add} {vertical ? 'flex-col' : 'flex-row'}">
   <slot />
</div>
