<script lang="ts">
   import { throttle } from 'lodash'
   import { onMount, tick } from 'svelte'
   import { fade } from 'svelte/transition'
   import { tweened } from 'svelte/motion'

   import { createEventDispatcher } from 'svelte'
   import Icon from '@iconify/svelte'

   const dispatch = createEventDispatcher()

   const timer = tweened(60, {
      delay: 300,
      duration: 1000 * 60
   })

   export let active = false
   export let value = ''
   export let errors
   export let stopTime = false
   export let visible = true
   export let add = ''

   let input: HTMLInputElement

   $: {
      if (stopTime) {
         timer.set($timer, { duration: 0 })
      }
   }

   const unsubscribe = timer.subscribe((n) => {
      if (n == 0) {
         input.disabled = true
      }
   })

   onMount(() => {
      return () => {
         unsubscribe()
      }
   })

   async function getCaptcha() {
      timer.set(60, { duration: 0 })
      active = false
      value = ''
      $errors.captcha = undefined
      stopTime = false
      dispatch('display')
      await tick()
      active = true
      $timer = 0
   }

   function fetchCaptcha() {
      return fetch('/api/captcha')
         .then((res) => res.text())
         .catch(() => "<div class='text-error'>Unable to fetch captcha.</div>")
   }
</script>

<div class="{add} w-[273px] card bg-base-100 shadow-xl">
   <div class="p-3 card-body gap-4 flex-row items-center">
      <span
         tabindex={visible ? 0 : -1}
         on:click={throttle(getCaptcha, 3000)}
         on:keydown={(e) => {
            if (e.target) {
               if (e.code == 'Space' || e.code == 'Enter') {
                  // @ts-ignore
                  e.target.click()
               }
            }
         }}
         style:writing-mode="vertical-lr"
         class="btn btn-accent px-1 py-10 text-xs normal-case"
      >
         captcha
      </span>

      <div class="flex items-center gap-2 flex-col">
         {#if active}
            {#await fetchCaptcha()}
               <div class="flex mr-[2px] items-center justify-center">
                  {#each new Array(5) as _}
                     <Icon icon="eos-icons:three-dots-loading" width={33} />
                  {/each}
               </div>
            {:then svg}
               <div class="tooltip hover:cursor-help tooltip-right" data-tip="case insensitive">
                  {@html svg}
               </div>
               <input
                  required
                  type="text"
                  name="captcha"
                  bind:this={input}
                  bind:value
                  tabindex={visible ? 0 : -1}
                  class:input-disabled={$timer == 0}
                  class:input-error={value.length > 0 && value.length != 6}
                  class="input input-xs w-10/12 input-bordered text-center"
               />
            {:catch error}
               {@html error}
            {/await}
         {/if}
      </div>

      {#if active}
         <div style:writing-mode="vertical-lr">
            {#if $errors.captcha}
               <small in:fade class="text-error text-sm">Invalid</small>
            {:else}
               <small in:fade class="text-sm text-neutral-content">{$timer.toFixed(1)}s</small>
            {/if}
         </div>
      {/if}
   </div>
</div>
