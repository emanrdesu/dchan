<script lang="ts">
   import { tick } from 'svelte'
   import { superForm } from 'sveltekit-superforms/client'
   import { avatarStyles, icons, keyboardClick } from '$lib/misc'

   import Ephemeral from '$lib/ui/Ephemeral.svelte'
   import FaRegCheckCircle from 'svelte-icons/fa/FaRegCheckCircle.svelte'
   import Icon from '@iconify/svelte'

   import type { PageData } from './$types'
   import { fade } from 'svelte/transition'
   import Captcha from '$lib/ui/Captcha.svelte'

   export let data: PageData
   const { errors, enhance } = superForm(data.form, {
      taintedMessage: null,
      onResult: ({ result }) => {
         if (result.type == 'success') {
            display.success = true
         }
      }
   })

   let stopTime = false

   const display = {
      captcha: false,
      success: false
   }

   const style = {
      input: 'input input-sm input-bordered',
      flex1: 'flex items-center gap-1'
   }

   const input = {
      username: '',
      password: '',
      confirm: '',
      captcha: '',
      gender: 'male',
      race: 'white',
      avatarStyle: 'lorelei',
      avatarSeed: '',
      file: null
   }

   $: canSubmit =
      display.captcha &&
      input.username.length >= 4 &&
      input.username.length <= 20 &&
      input.password == input.confirm &&
      input.password.length >= 6 &&
      input.captcha.length == 6 &&
      input.avatarSeed.length <= 16
</script>

<div class="hero mt-4">
   <div class="hero-content rounded-md p-4 bg-base-300 gap-2 text-center">
      <form class="form-control gap-2" use:enhance method="POST">
         <h1 class="text-2xl flex justify-center items-center mb-2">
            <span class="mr-auto">Registration</span>
            {#if display.success}
               <Ephemeral duration={3}>
                  <div class="ml-auto alert rounded-lg p-2 py-1 alert-success shadow-lg">
                     <span class="{style.flex1} text-sm">
                        <div class="w-4"><FaRegCheckCircle /></div>
                        Registration successful!
                     </span>
                  </div>
               </Ephemeral>
            {/if}
         </h1>

         <input
            required
            class="{style.input} w-full"
            bind:value={input.username}
            class:input-error={(input.username.length > 0 && input.username.length < 4) ||
               input.username.length > 20}
            name="username"
            placeholder="username"
         />

         {#if $errors.username}
            <small transition:fade class="text-left text-error">{$errors.username}</small>
         {/if}

         <div class="flex gap-2">
            <input
               class="{style.input} w-full"
               bind:value={input.password}
               class:input-error={input.password.length > 0 && input.password.length < 6}
               name="password"
               type="password"
               required
               placeholder="password"
            />

            <input
               class="{style.input} w-full"
               class:input-error={input.password != input.confirm}
               bind:value={input.confirm}
               name="confirm"
               type="password"
               required
               placeholder="confirm"
            />
         </div>

         <div class="flex flex-col min-[500px]:flex-row">
            <div class="{style.flex1} mr-4 gap-2">
               <div class="badge badge-info font-bold">gender</div>

               <div class={style.flex1}>
                  <input type="hidden" name="gender" bind:value={input.gender} />

                  {#each icons.gender as { gender, color, icon }}
                     <div class="tooltip" data-tip={gender}>
                        <div
                           on:click={() => {
                              input.gender = gender
                           }}
                           on:keydown={keyboardClick}
                           tabindex="0"
                           style:transition="opacity 300ms ease"
                           class:opacity-100={input.gender == gender}
                           class:opacity-30={input.gender != gender}
                           class="cursor-pointer {color}"
                        >
                           <Icon {icon} width="24" height="24" />
                        </div>
                     </div>
                  {/each}
               </div>
            </div>

            <div class="{style.flex1} gap-2">
               <div class="badge badge-warning font-bold">race</div>

               <div class="{style.flex1} gap-3">
                  <input type="hidden" name="race" bind:value={input.race} />

                  {#each icons.race as { race, icon }}
                     <div class="tooltip" data-tip={race}>
                        <div
                           tabindex="0"
                           style:transition="opacity 300ms ease"
                           class:opacity-100={input.race == race}
                           class:opacity-30={input.race != race}
                           class="cursor-pointer"
                           on:keydown={(e) => {
                              if (e.code == 'Space' || e.code == 'Enter') {
                                 e.target.click()
                              }
                           }}
                           on:click={() => {
                              input.race = race
                           }}
                        >
                           <Icon {icon} width="24" height="24" />
                        </div>
                     </div>
                  {/each}
               </div>
            </div>
         </div>

         <div class="max-w-2xl grid max-[640px]:grid-rows-2 min-[640px]:grid-cols-[4fr_3fr] gap-2">
            <div class="card bg-base-200 p-3 gap-3 max-[600px]:w-fit flex-row items-center">
               <h1
                  class="badge font-bold badge-secondary px-0 py-10"
                  style:writing-mode="vertical-lr"
               >
                  Avatar
               </h1>

               <div class="form-control gap-2 justify-start">
                  <input
                     name="avatarSeed"
                     bind:value={input.avatarSeed}
                     placeholder="avatar seed"
                     class="{style.input} w-full"
                     style:min-width="10ch"
                     class:input-error={input.avatarSeed.length > 22}
                  />
                  <select
                     bind:value={input.avatarStyle}
                     required
                     style:min-width="10ch"
                     name="avatarStyle"
                     class="select select-sm w-full font-normal select-bordered"
                  >
                     <option disabled>Select style.</option>
                     {#each avatarStyles as avatarStyle}
                        <option value={avatarStyle}>{avatarStyle}</option>
                     {/each}
                  </select>
               </div>
               <img
                  style:width="70px"
                  src="https://api.dicebear.com/6.x/{input.avatarStyle}/svg?scale=120&seed={input.avatarSeed}"
                  alt="avatar style"
               />
               <h1 class="text-neutral-content" style:writing-mode="vertical-lr">preview</h1>
            </div>

            <Captcha
               on:display={() => (display.success = false)}
               bind:active={display.captcha}
               bind:value={input.captcha}
               bind:stopTime
               {errors}
            />
         </div>

         <button
            type={canSubmit ? 'submit' : 'button'}
            tabindex={canSubmit ? 0 : -1}
            class:btn-disabled={!canSubmit}
            on:click={() => (stopTime = true)}
            class="btn mt-2 btn-sm btn-secondary"
         >
            Submit
         </button>
      </form>
   </div>
</div>
