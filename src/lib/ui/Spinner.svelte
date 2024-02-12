<script lang="ts">
   export let size = 6
   export let border = 4
   export let color = ''
</script>

<div
   class="inline-block h-{size} w-{size} border-{border} {color} animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
/>
