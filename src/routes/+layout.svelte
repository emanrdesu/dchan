<script lang="ts">
   import '../app.postcss'
   import {} from '$lib/stdplus'
   import { onMount } from 'svelte'
   import { themeChange } from 'theme-change'

   import Menu from '$lib/ui/Menu.svelte'
   import IconText from '$lib/ui/IconText.svelte'
   import { notifications, notify, workLoad } from '$lib/stores'
   import { random } from '$lib/misc'
   import Busy from '$lib/ui/part/Busy.svelte'

   import type { LayoutServerData } from './$types'
   import { afterNavigate, goto, invalidate } from '$app/navigation'
   import { fade } from 'svelte/transition'
   import Icon from '@iconify/svelte'
   import { navigating } from '$app/stores'
   import { superForm } from 'sveltekit-superforms/client'

   export let data: LayoutServerData

   const { enhance } = superForm(data.form, {
      taintedMessage: null,
      onResult: async ({ result }) => {
         if (result.type == 'success') {
            notify(result.data ? random.welcome() : random.goodbye())
         } else {
            notify('Try again.')
         }

         $workLoad--
      }
   })

   onMount(() => {
      themeChange(false)
   })

   afterNavigate(() => {
      $workLoad = 0
   })
</script>

<div class="navbar sticky top-0 px-0 py-[2px] z-20 justify-center bg-base-300 min-h-8">
   <div class="ml-2 start">
      <div class="dropdown">
         <div tabindex="0" class="btn blout btn-ghost btn-sm px-1">
            <Icon icon="ic:round-color-lens" width={20} height={20} />
         </div>
         <Menu add="dropdown-content bg-base-300 shadow-lg">
            {#each ['dracula', 'mars'] as theme}
               <button tabindex="0" data-set-theme={theme} data-act-class="active-theme">
                  <span class="px-2"> {theme}</span>
               </button>
            {/each}
         </Menu>
      </div>
   </div>

   <div class="navbar-center mx-auto">
      <Busy>
         <button class="btn blout btn-ghost text-lg btn-sm px-1" on:click={() => goto('/')}>
            <IconText text="dchan">
               <Icon icon="ion:home" width={16} />
            </IconText>
         </button>
      </Busy>
   </div>

   <div class="end flex gap-3 mr-2">
      {#if data.user.valid}
         {@const user = data.user}

         <div class="tooltip -mr-2 tooltip-bottom" data-tip="your points">
            {#key user.points}
               <small
                  in:fade={{ delay: 200, duration: 200 }}
                  class="badge badge-sm px-[3px] badge-secondary font-bold"
               >
                  {user.points}
               </small>
            {/key}
         </div>

         <div in:fade={{ duration: 500 }} class="dropdown dropdown-bottom dropdown-end">
            <button
               tabindex="0"
               style:transition="padding 200ms ease"
               class="w-8 active:p-[2px] outline-none btn-ghost flex justify-center rounded-md hover:cursor-pointer"
            >
               <img
                  src="https://api.dicebear.com/6.x/{user.avatarStyle}/svg?scale=120&seed={user.avatarSeed}"
                  alt="avatar"
               />
            </button>
            <form tabindex="-1" method="POST" use:enhance action="/?/logout">
               <Menu vertical add="dropdown-content rounded-md shadow-lg bg-base-300 translate-y-1">
                  <a href="/settings" tabindex="0">
                     <IconText add="font-bold px-2" text="settings">
                        <Icon icon="ant-design:setting-filled" />
                     </IconText>
                  </a>
                  <button on:click={() => $workLoad++} tabindex="0" type="submit">
                     <span class="font-bold">logout</span>
                  </button>
               </Menu>
            </form>
         </div>
      {:else}
         <div in:fade class="dropdown dropdown-bottom dropdown-end">
            <div
               tabindex="0"
               class="btn btn-ghost blout rounded-md normal-case text-xl btn-sm px-1"
            >
               <Icon icon="fa-solid:user-slash" />
            </div>

            <div
               class="card-body dropdown-content border border-neutral-focus translate-y-1 bg-neutral rounded-md p-4"
            >
               <h1 class="text-center text-xl">Login</h1>
               <form use:enhance method="POST" action="/?/login" class="form-control gap-2">
                  <input
                     required
                     placeholder="username"
                     name="username"
                     class="input input-sm input-bordered"
                  />

                  <input
                     required
                     placeholder="password"
                     type="password"
                     name="password"
                     class="input input-sm input-bordered"
                  />

                  <button
                     type="submit"
                     on:click={() => $workLoad++}
                     on:submit={() => invalidate('/api/user')}
                     class="btn btn-secondary btn-xs mt-2">Submit</button
                  >
                  <small>
                     <span>No account?</span>
                     <a class="badge link badge-sm font-bold badge-primary" href="/register"
                        >Register</a
                     >
                  </small>
               </form>
            </div>
         </div>
      {/if}
   </div>
</div>

<slot />

{#if $navigating}
   <progress
      style:animation="progress-loading 500ms infinite ease-in"
      class="top-[98vh] progress fixed"
   />
{/if}

{#if $notifications.length > 0}
   <div class="toast">
      {#each $notifications as { message, color }}
         <div style:box-shadow="0 0 10px 0 rgba(0,0,0,.2)" class="alert bg-neutral p-2 rounded-md">
            <span class="text-sm font-bold text-{color}">{message}</span>
         </div>
      {/each}
   </div>
{/if}
