<script lang="ts">
   import Icon from '@iconify/svelte'
   import { superForm } from 'sveltekit-superforms/client'
   import { menu, setMenu } from '$lib/stores'
   import { regex, bool, icons, keyboardClick, sign } from '$lib/misc'

   import Window from '$lib/ui/Window.svelte'
   import Captcha from '$lib/ui/Captcha.svelte'
   import Post from '$lib/ui/Post.svelte'
   import IconToggle from '$lib/ui/IconToggle.svelte'

   import { afterUpdate, onMount, tick } from 'svelte'
   import { slide } from 'svelte/transition'

   import { onReplyHover, onReplyLeave, onReplyMove, scrollToID } from '$lib/events'

   export let data

   setMenu('gridicons:create')

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

            for (const [listener, action] of Object.entries(qlisteners))
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

   const subset = {
      genders: data.thread.genders.length < data.board.genders.length,
      races: data.thread.races.length < data.board.races.length
   }

   const input = {
      name: '',
      comment: '',
      gender: subset.genders ? undefined : 'none',
      race: subset.races ? undefined : 'none',
      captcha: '',
      sage: false,
      file: undefined as unknown as HTMLInputElement,
      url: false,
      link: '',
      filename: ''
   }

   let fileGiven = false
   let fileOk = false

   $: canSubmit =
      (!fileGiven || (fileGiven && fileOk)) &&
      input.name.length <= 50 &&
      (fileGiven ||
         (input.url && (input.link.trim().length > 0 || input.comment.trim().length > 0))) &&
      input.comment.length <= 2000 &&
      (!input.url || input.filename.length <= 200) &&
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
            $menu[0] = false
            input.comment = ''
            input.name = ''
            // input.gender = 'none'
            // input.race = 'none'
            if (input.file) input.file.value = ''
         } else {
            showMessage(getError(result.data.form.errors), 'error')
         }
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

   function getError(errors: object) {
      return Object.entries(errors)[0][1]
   }

   async function showMessage(text: string, color: string) {
      message = { text, color, show: true }
      await tick()

      setTimeout(() => {
         message = { text, color, show: false }
      }, 3000)
   }

   sign.reset()
</script>

<div class="ml-3 mb-20">
   <Post post={data.posts[0]} thread={data.thread} board={data.board} op opno={data.posts[0].no} />

   <div class="ml-3 mt-2 form-control gap-2">
      {#each data.posts.slice(1) as post (post.id)}
         <Post {post} opno={data.posts[0].no} />
      {/each}
   </div>
</div>

<Window
   on:close={() => ($menu[0] = !$menu[0])}
   add="top-32 right-20"
   py={34}
   bind:show={$menu[0]}
   bind:message
   title="New Post"
>
   <form method="POST" use:enhance class="form-control gap-2">
      <div class="flex gap-2">
         <input
            tabindex={$menu[0] ? 0 : -1}
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
               bind:interact={$menu[0]}
            />
         {/if}

         <IconToggle
            icon="bxs:leaf"
            name="sage"
            color="text-success"
            tip="sage"
            bind:interact={$menu[0]}
         />
      </div>

      <textarea
         tabindex={$menu[0] ? 0 : -1}
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

                  {#if !subset.genders}
                     <input
                        tabindex={-1}
                        checked
                        class="hidden"
                        type="radio"
                        name="gender"
                        bind:group={input.gender}
                        value="none"
                     />
                  {/if}

                  {#each icons.gender as { gender, color, icon }}
                     {#if data.thread.genders.includes(gender)}
                        <div class="flex {color} items-center">
                           <input
                              tabindex={$menu[0] ? 0 : -1}
                              type="radio"
                              required={subset.genders}
                              name="gender"
                              value={gender}
                              bind:group={input.gender}
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
                  <select
                     tabindex={$menu[0] ? 0 : -1}
                     bind:value={input.race}
                     name="race"
                     class="select select-xs"
                  >
                     {#if !subset.races}<option value="none">None</option>{/if}
                     {#each data.thread.races as race}
                        <option value={race}>{race.titleCase()}</option>
                     {/each}
                  </select>
               </div>
            {/if}
         </div>
      {/if}

      <div class="flex gap-1 justify-stretch items-center">
         {#if !input.url}
            <input
               in:slide|local={{ axis: 'x', delay: 0 }}
               tabindex={$menu[0] ? 0 : -1}
               type="file"
               name="file"
               bind:this={input.file}
               on:change={onFileChange}
               class="input input-xs bg-transparent px-0"
            />
         {/if}

         {#if input.url}
            <div class="flex flex-1 gap-1">
               <input
                  in:slide|local={{ axis: 'x' }}
                  type="url"
                  tabindex={$menu[0] ? 0 : -1}
                  name="url"
                  placeholder="Link"
                  bind:value={input.link}
                  class="input input-xs w-1/2"
               />

               <input
                  in:slide|local={{ axis: 'x' }}
                  type="text"
                  tabindex={$menu[0] ? 0 : -1}
                  name="filename"
                  bind:value={input.filename}
                  placeholder="Filename"
                  class:input-error={input.filename.length > 100}
                  class="input input-xs w-1/2"
               />
            </div>
         {/if}

         <label class="ml-auto flex-grow-0 swap">
            <input
               on:click={() => {
                  input.url = !input.url
                  fileGiven = false
               }}
               type="checkbox"
            />
            <div class="swap-on">
               <Icon icon="mdi:file" width={22} height={22} />
            </div>
            <div class="swap-off">
               <Icon class="text-secondary" icon="pajamas:link" width={22} height={22} />
            </div>
         </label>
      </div>

      {#if $menu[0] && !(data.user.valid && ['founder', 'mod'].includes(data.user.role))}
         <div transition:slide|local>
            <Captcha
               bind:value={input.captcha}
               add="w-full rounded-lg"
               {errors}
               bind:visible={$menu[0]}
            />
         </div>
      {/if}

      <button
         type={$menu[0] && canSubmit ? 'submit' : 'button'}
         tabindex={$menu[0] && canSubmit ? 0 : -1}
         class:btn-disabled={!canSubmit}
         disabled={!canSubmit}
         class="btn outline-none btn-primary btn-xs text-xs normal-case"
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
