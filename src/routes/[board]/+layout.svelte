<script lang="ts">
   import Menu from '$lib/ui/Menu.svelte'
   import { menuActive, menuClick, menuIcons } from '$lib/stores'
   import { keyboardClick } from '$lib/misc'
   import Icon from '@iconify/svelte'
   import { fade } from 'svelte/transition'
   import { flip } from 'svelte/animate'
   import { page } from '$app/stores'
   import { invalidate } from '$app/navigation'
   import type { LayoutServerData } from './$types'

   export let data: LayoutServerData

   $: board = data.board
</script>

<div style:width="93%" class="px-6 pt-2">
   <slot />
</div>

<div
   class="fixed top-1/2 right-2 flex items-center justify-center gap-4"
   style:writing-mode="vertical-lr"
   style:transform="translateY(-50%)"
   in:fade
>
   <a
      href="/{board.name}"
      on:keydown={keyboardClick}
      on:click={() => {
         if ($page.route.id == '/[board]') invalidate('board')
      }}
      class="text-neutral-content blout hover:text-secondary flex gap-1 text-xl"
   >
      <span class="flex items-center">
         <span class:translate-y-[2px]={board.icon}>/</span>
         <span style:color={board.color}>
            {#if board.icon}
               <Icon icon={board.icon} width="22" height="22" />{:else}{board.name}{/if}
         </span>
         <span class:-translate-y-1={board.icon}>/</span>
      </span>
      - {board.description}
   </a>

   {#if $menuActive.length > 0}
      {@const size = 30}

      <Menu add="gap-1">
         {#each $menuIcons as icon, i (i)}
            <button
               animate:flip={{ duration: 300 }}
               in:fade|local={{ duration: 200 }}
               class="outline-none"
               on:click={() => {
                  if ($menuActive[i]) $menuClick[i].off()
                  else $menuClick[i].on()

                  $menuActive[i] = !$menuActive[i]
               }}
               tabindex="0"
            >
               <div style:transition="color 200ms ease" class:text-primary={$menuActive[i]}>
                  <Icon class="px-1" {icon} width={size} height={size} />
               </div>
            </button>
         {/each}
      </Menu>
   {/if}
</div>
