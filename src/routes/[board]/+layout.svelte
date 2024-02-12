<script lang="ts">
   import Menu from '$lib/ui/Menu.svelte'
   import { menu, icons } from '$lib/stores'
   import Icon from '@iconify/svelte'
   import { fade } from 'svelte/transition'
   import { flip } from 'svelte/animate'
   import { keyboardClick } from '$lib/misc'
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
      class="text-neutral-content blout hover:text-secondary flex gap-1 text-xl"
   >
      <span class="flex items-center">
         <span class:translate-y-[2px]={board.icon}>/</span>
         <span style:color={board.color}
            >{#if board.icon}<Icon
                  icon={board.icon}
                  width="22"
                  height="22"
               />{:else}{board.name}{/if}</span
         ><span class:-translate-y-1={board.icon}>/</span>
      </span>
      - {board.description}
   </a>

   {#if $menu.length > 0}
      <Menu add="gap-2">
         {#each $icons as icon, i (i)}
            <button
               animate:flip={{ duration: 300 }}
               in:fade|local={{ duration: 200 }}
               class="outline-none"
               on:click={() => ($menu[i] = !$menu[i])}
               tabindex="0"
            >
               <div style:transition="color 200ms ease" class:text-primary={$menu[i]}>
                  <Icon class="p-1" {icon} width="32" height="32" />
               </div>
            </button>
         {/each}
      </Menu>
   {/if}
</div>
