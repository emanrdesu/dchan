<script lang="ts">
   import '../app.postcss'
   import { onMount } from 'svelte'
   import { themeChange } from 'theme-change'
   import { enhance } from '$app/forms'

   import Menu from '$lib/ui/Menu.svelte'
   import IconCopy from '$lib/ui/IconCopy.svelte'
   import IconText from '$lib/ui/IconText.svelte'

   import type { LayoutServerData } from './$types'
   import { goto, invalidate } from '$app/navigation'
   import { fade } from 'svelte/transition'
   import Icon from '@iconify/svelte'

   export let data: LayoutServerData

   onMount(() => {
      themeChange(false)
   })

   const monedas = [
      {
         icon: 'logos:monero',
         addr: '42TC9QdYoMrFiY7LjfQ9GQ44XevmYu8KqGLjRhSemrsxetbKoEoAu54RjLGC2VJsSgeiNRt6q1iR3CetbjbRUgcwHv6woT8'
      },
      { icon: 'logos:bitcoin', addr: 'bc1q7h0cvne2286z6sj8d9kkfs40trttcf8tdr0ltv' },
      { icon: 'simple-icons:litecoin', addr: 'Lfah3SLM3aw1EwsCmV763uaRdkS54ye8HS' }
   ]
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

   <div class="navbar-center ml-auto mr-auto">
      <button class="btn blout btn-ghost text-lg btn-sm px-1" on:click={() => goto('/')}>
         <IconText text="dchan">
            <Icon icon="ion:home" width={16} />
         </IconText>
      </button>
   </div>

   <div class="end flex gap-3 mr-2">
      {#if data.user.valid}
         {@const user = data.user}
         <div in:fade class="dropdown dropdown-bottom dropdown-end">
            <div
               tabindex="0"
               style:transition="all 200ms ease"
               class="w-8 active:p-[2px] outline-none flex justify-center rounded-md hover:cursor-pointer"
            >
               <img
                  src="https://api.dicebear.com/6.x/{user.avatarStyle}/svg?scale=120&seed={user.avatarSeed}"
                  alt="avatar"
               />
            </div>
            <form tabindex="-1" method="POST" use:enhance action="/?/logout">
               <Menu vertical add="dropdown-content rounded-md shadow-lg bg-base-300 translate-y-1">
                  <a href="/settings" tabindex="0">
                     <IconText add="font-bold px-2" text="settings">
                        <Icon icon="ant-design:setting-filled" />
                     </IconText>
                  </a>
                  <button tabindex="0" type="submit"><span class="font-bold">logout</span></button>
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

<footer class="mt-10 footer footer-center items-center p-4 gap-3 text-neutral-content">
   <aside class="items-center justify-center grid-flow-col">
      <small class="flex items-center gap-1">
         Copyright
         <Icon icon="ri:copyright-fill" />
         {new Date().getFullYear()}
      </small>

      <small class="mx-6 flex items-center gap-2">
         {#each monedas as { icon, addr }}
            <IconCopy {icon} text={addr} />
         {/each}
      </small>

      <a class="link link-hover" href="mailto:janitor@waifu.club"><small>Contact</small></a>
   </aside>
</footer>
