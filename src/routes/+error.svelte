<script lang="ts">
   import { page } from '$app/stores'
</script>

<div style:height="93vh" class="hero bg-base-200">
   <div class="hero-content text-center">
      <div class="max-w-md">
         <h1 class="text-6xl mb-2 text-error font-bold">{$page.status}</h1>
         <p>
            {($page.error && $page.error.message) || 'No message'}
         </p>
      </div>
   </div>
</div>
