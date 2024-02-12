<script lang="ts">
   import { superForm } from 'sveltekit-superforms/client'
   import type { PageServerData } from './$types'
   import { fly } from 'svelte/transition'
   import Icon from '@iconify/svelte'

   export let data: PageServerData

   superForm(data.form, {
      taintedMessage: null
   })

   const boards = data.boards
   boards.forEach((b) => (b.category = b.expand.category.name))
   const categories = Array.from(new Set(boards.map((b) => b.category))) as string[]
</script>

<div transition:fly class="hero" style:height="93vh">
   <div class="hero-content flex-col justify-center text-center">
      <div class="flex flex-col items-center">
         <h1 class="text-7xl self-end mb-2 font-bold">dchan</h1>
         <div class="max-w-4xl grid grid-cols-2 place-items-end min-[555px]:grid-cols-3">
            {#each categories as category}
               <div class="p-2 flex whitespace-nowrap self-start items-end w-min flex-col">
                  <h2 class="badge badge-secondary mb-1 py-2 badge-xs font-bold">
                     {category}
                  </h2>
                  {#each boards.filter((b) => b.category == category) as board}
                     <a
                        class="hover:text-primary hover:link cursor-pointer flex items-end gap-1 text-lg"
                        class:text-warning={board.nsfw}
                        class:translate-x-1={board.icon}
                        href="/{board.name}"
                     >
                        <span>{board.description + ' ➜ '}</span>
                        <span class="flex items-center"
                           >{#if board.icon}<span class="translate-x-[3px]">/</span><span
                                 style:color={board.color}
                              >
                                 <Icon icon={board.icon} width="22" height="22" /></span
                              ><span class="-translate-x-1">/</span>{:else}/{board.name}/{/if}</span
                        >
                     </a>
                  {/each}
               </div>
            {/each}
         </div>
      </div>
   </div>
</div>
