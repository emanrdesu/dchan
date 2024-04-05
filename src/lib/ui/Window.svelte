<script lang="ts">
   import { navigating } from '$app/stores'
   import Icon from '@iconify/svelte'
   import { createEventDispatcher, onMount } from 'svelte'
   import { fly } from 'svelte/transition'

   export let title = ''
   export let px = 0
   export let py = 0
   export let show = false
   export let add = ''
   export let hadd = ''

   export let message = { show: false, text: '', color: '' }

   const dispatch = createEventDispatcher()
   let window: HTMLElement

   onMount(() => {
      const moveCenter = () => {
         const d = document.documentElement
         window.style.left = (d.clientWidth - window.clientWidth) / 2 + 'px'
         window.style.top = (d.clientHeight - window.clientHeight) / 2 + 'px'
      }

      globalThis.addEventListener('resize', moveCenter)

      return () => {
         globalThis.removeEventListener('resize', moveCenter)
      }
   })

   function move(event: MouseEvent) {
      let shiftX = event.clientX - window.getBoundingClientRect().left
      let shiftY = event.clientY - window.getBoundingClientRect().top

      function moveTo(clientX: number, clientY: number) {
         const d = document.documentElement
         const [vw, vh] = [d.clientWidth, d.clientHeight]
         const [ww, wh] = [window.clientWidth, window.clientHeight]

         window.style.left = Math.min(Math.max(clientX - shiftX, px), vw - ww) + 'px'
         window.style.top = Math.min(Math.max(clientY - shiftY, py), vh - wh) + 'px'
      }

      function onMouseMove(event: MouseEvent) {
         moveTo(event.clientX, event.clientY)
      }

      // move the window on mousemove
      document.addEventListener('mousemove', onMouseMove)

      // drop the window, remove unneeded handlers
      window.onmouseup = function () {
         document.removeEventListener('mousemove', onMouseMove)
         window.onmouseup = null
         window.onmouseleave = null
      }

      window.onmouseleave = window.onmouseup
   }
</script>

<div
   class:opacity-0={!show}
   class:opacity-100={show && !$navigating}
   class:pointer-events-none={!show}
   bind:this={window}
   style:transition="opacity 300ms ease-in-out"
   class="w-[328px] p-3 fixed z-10 bg-base-300 rounded-lg shadow-md {add}"
>
   <div class="flex items-center gap-3 mb-3">
      <h1 on:mousedown|preventDefault={move} class="{hadd} cursor-grab whitespace-nowrap font-bold">
         {title}
      </h1>

      {#if message.show}
         <small transition:fly class="font-bold text-xs text-{message.color}">{message.text}</small>
      {/if}

      <button
         tabindex={show ? 0 : -1}
         class="ml-auto hover:text-warning outline-none btn font-bold rounded-3xl px-1 btn-xs btn-ghost"
         on:click={() => {
            dispatch('close')
         }}
      >
         <Icon icon="ep:close-bold" width="16" height="16" />
      </button>
   </div>
   <slot />
</div>
