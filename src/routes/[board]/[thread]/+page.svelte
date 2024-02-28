<script lang="ts">
   import Icon from '@iconify/svelte'
   import { superForm } from 'sveltekit-superforms/client'
   import { menuActive, menuClick, setMenu, workLoad } from '$lib/stores'
   import { regex, bool, icons, keyboardClick, sign, genders } from '$lib/misc'

   import Window from '$lib/ui/Window.svelte'
   import Captcha from '$lib/ui/Captcha.svelte'
   import Post from '$lib/ui/Post.svelte'
   import IconToggle from '$lib/ui/IconToggle.svelte'

   import { afterUpdate, onMount, tick } from 'svelte'
   import { fly, slide } from 'svelte/transition'

   import { onReplyHover, onReplyLeave, onReplyMove, scrollToID } from '$lib/events'
   import { invalidate } from '$app/navigation'
   import { browser } from '$app/environment'
   import { throttle } from 'lodash'

   export let data

   let userValid = data.user.valid

   function menuSetup(option: { keep: number } | null = null) {
      if (data.user.valid) {
         setMenu(['gridicons:create', 'mingcute:star-fill'], option)
         const submitStar = () => {
            const submit = document.querySelector('#star input') as HTMLInputElement
            submit.click()
         }

         $menuClick[1] = { on: submitStar, off: submitStar }

         for (const star of data.user.starred) {
            if (star.board == data.slug.board && star.threadNumber == +data.slug.thread) {
               $menuActive[1] = true
               break
            }
         }
      } else setMenu(['gridicons:create'], option)

      if (browser) invalidate('/api/user')
   }

   menuSetup()

   // @ts-ignore
   const checkValidity = (_) => {
      if (userValid != data.user.valid) {
         userValid = data.user.valid
         menuSetup({ keep: 0 })
      }
   }

   $: checkValidity(data.user.valid)

   const listeners = new Map<Element, object>()

   function addQuoteListeners() {
      document.querySelectorAll('a.quote').forEach((q) => {
         if (!listeners.get(q)) {
            const p = q as HTMLElement
            const id = p.dataset.quote as string

            const qlisteners = {
               mouseenter: onReplyHover(id),
               click: scrollToID(id),
               mouseleave: onReplyLeave(id),
               mousemove: onReplyMove(id),
               keydown: keyboardClick
            }

            listeners.set(q, qlisteners)

            // prettier-ignore
            for (const [listener, action] of Object.entries(qlisteners))
            // @ts-ignore
               q.addEventListener(listener, action)
         }
      })
   }

   onMount(() => {
      addQuoteListeners()

      return () => {
         for (const [q, entry] of listeners)
            for (const [listener, action] of Object.entries(entry))
               q.removeEventListener(listener, action)

         listeners.clear()
      }
   })

   afterUpdate(addQuoteListeners)

   const input = {
      name: '',
      comment: '',
      captcha: '',
      file: undefined as unknown as HTMLInputElement
   }

   let fileGiven = false
   let fileOk = false
   let stopTime = false

   $: canSubmit =
      (!fileGiven || (fileGiven && fileOk)) &&
      input.name.length <= 50 &&
      (fileGiven || input.comment.trim().length > 0) &&
      input.comment.length <= 2000 &&
      ((data.user.valid && ['mod', 'founder'].includes(data.user.role)) ||
         input.captcha.length == 6)

   let message = {
      show: false,
      text: '',
      color: ''
   }

   const { errors, enhance } = superForm(data.form, {
      taintedMessage: null,
      onResult: ({ result }) => {
         if (result.type == 'success') {
            $menuActive[0] = false
            input.comment = ''
            input.name = ''
            input.captcha = ''
            input.file.value = ''
            fileGiven = false
            data.user.points++
         } else {
            // @ts-ignore
            const message = Object.entries(result.data.form.errors)[0][1] as string
            showWindowMessage(message, 'error')
         }

         $workLoad--
      }
   })

   function onFileChange() {
      const file = input.file.files ? input.file.files[0] : null

      fileGiven = bool(file)
      if (file)
         fileOk =
            bool(file.type.match(regex.media)) && file.size <= 4194304 && file.name.length <= 200
      else fileOk = false
   }

   async function showWindowMessage(text: string, color: string) {
      message = { text, color, show: true }
      await tick()

      setTimeout(() => {
         message = { text, color, show: false }
      }, 3000)
   }

   sign.reset()
</script>

{#if data.user.valid}
   {@const addWork = throttle(() => $workLoad++, 5000)}
   {#if $menuActive[1]}
      <form class="hidden" method="POST" use:enhance id="star" action="?/unstar">
         <input on:click={addWork} hidden type="submit" />
      </form>
   {:else}
      <form class="hidden" method="POST" use:enhance id="star" action="?/star">
         <input on:click={addWork} hidden type="submit" />
      </form>
   {/if}
{/if}

<div out:fly class="ml-3 mb-10">
   <Post post={data.posts[0]} thread={data.thread} board={data.board} op opno={data.posts[0].no} />

   <div class="ml-3 mt-2 form-control gap-2">
      {#each data.posts.slice(1) as post (post.id)}
         <Post {post} opno={data.posts[0].no} />
      {/each}
   </div>
</div>

<Window
   on:close={() => ($menuActive[0] = !$menuActive[0])}
   add="top-32 w-[300px] right-20"
   py={34}
   bind:show={$menuActive[0]}
   bind:message
   title="New Post"
>
   <form action="?/post" method="POST" use:enhance class="form-control gap-2">
      <div class="flex gap-2">
         <input
            tabindex={$menuActive[0] ? 0 : -1}
            placeholder="Name"
            name="name"
            class:input-error={input.name.length > 50}
            bind:value={input.name}
            class="input flex-1 input-xs"
         />

         {#if data.user.valid}
            <IconToggle
               icon="icon-park-outline:message-sent"
               name="DMs"
               tip="Allow DMs"
               bind:interact={$menuActive[0]}
            />
         {/if}

         <IconToggle
            icon="bxs:leaf"
            name="sage"
            color="text-success"
            tip="sage"
            bind:interact={$menuActive[0]}
         />
      </div>

      <textarea
         tabindex={$menuActive[0] ? 0 : -1}
         style:height="100px"
         style:max-height="150px"
         style:line-height="1.1"
         name="comment"
         bind:value={input.comment}
         placeholder="Comment"
         class:text-error={input.comment.length > 2000}
         class="textarea textarea-xs"
      />

      <!-- gender + race -->
      {#if data.thread.genders.length > 0 || data.thread.races.length > 0}
         <div class="flex">
            {#if data.thread.genders.length > 0}
               <label class="flex items-center">
                  <div class="badge cursor- font-bold badge-info badge-sm mr-1">Gender</div>

                  <input
                     tabindex={-1}
                     checked={!data.user.valid}
                     class="hidden"
                     type="radio"
                     name="gender"
                     value="none"
                  />

                  {#each genders as gender}
                     {@const { color, icon } = icons.gender[gender]}

                     {#if data.thread.genders.includes(gender)}
                        <div class="flex {color} items-center">
                           <input
                              tabindex={$menuActive[0] ? 0 : -1}
                              checked={data.user.valid && data.user.gender == gender}
                              type="radio"
                              name="gender"
                              value={gender}
                              class="radio outline-none radio-xs"
                           />
                           <Icon {icon} width="22" height="22" />
                        </div>
                     {/if}
                  {/each}
               </label>
            {/if}

            {#if data.thread.races.length > 0}
               <div class="flex items-center">
                  <div class="badge font-bold badge-warning badge-sm mr-2">Race</div>
                  <select tabindex={$menuActive[0] ? 0 : -1} name="race" class="select select-xs">
                     <option selected={!data.user.valid} value="none">None</option>
                     {#each data.thread.races as race}
                        <option selected={data.user.valid && data.user.race == race} value={race}>
                           {race.titleCase()}
                        </option>
                     {/each}
                  </select>
               </div>
            {/if}
         </div>
      {/if}

      <div class="flex gap-1 justify-stretch items-center">
         <input
            in:slide|local={{ axis: 'x', delay: 0 }}
            tabindex={$menuActive[0] ? 0 : -1}
            type="file"
            name="file"
            bind:this={input.file}
            on:change={onFileChange}
            class="input input-xs bg-transparent px-0"
         />
      </div>

      {#if $menuActive[0] && !(data.user.valid && ['founder', 'mod'].includes(data.user.role))}
         <div transition:slide|local>
            <Captcha
               bind:stopTime
               bind:value={input.captcha}
               add="rounded-lg"
               {errors}
               bind:visible={$menuActive[0]}
            />
         </div>
      {/if}

      <button
         class="btn outline-none btn-primary btn-xs text-xs normal-case"
         type={$menuActive[0] && canSubmit ? 'submit' : 'button'}
         tabindex={$menuActive[0] && canSubmit ? 0 : -1}
         class:btn-disabled={!canSubmit}
         disabled={!canSubmit}
         on:click={throttle(() => {
            stopTime = true
            $workLoad++
         }, 5000)}
      >
         Submit
      </button>
   </form>
</Window>

<style>
   textarea {
      height: 200;
   }
</style>
