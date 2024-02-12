<script lang="ts">
   import Icon from '@iconify/svelte'
   import Window from '$lib/ui/Window.svelte'
   import Captcha from '$lib/ui/Captcha.svelte'
   import IconToggle from '$lib/ui/IconToggle.svelte'
   import { fade, slide } from 'svelte/transition'
   import { flip } from 'svelte/animate'
   import { tick } from 'svelte'
   import { superForm } from 'sveltekit-superforms/client'
   import { menu, setMenu } from '$lib/stores'
   import { bool, format, icons, keyboardClick, regex, mininfo } from '$lib/misc'

   export let data

   setMenu('gridicons:create', 'clarity:settings-line')

   const input = {
      name: '',
      subject: '',
      comment: '',
      gender: 'none',
      race: 'none',
      captcha: '',
      mile: 4,
      file: undefined as unknown as HTMLInputElement,
      url: false,
      filename: ''
   }

   let expandHover = false
   let fileGiven = false
   let fileOk = false
   let stopTime = false

   $: canSubmit =
      fileOk &&
      input.name.length <= 50 &&
      input.subject.length <= 100 &&
      input.comment.length > 0 &&
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
      onResult: async ({ result }) => {
         if (result.type == 'success') {
            $menu[0] = false
            input.comment = ''
            input.gender = 'none'
            input.race = 'none'
            input.name = ''
            input.subject = ''
            if (input.file) input.file.value = ''
         } else {
            showMessage(getError(result.data.form.errors), 'error')
         }
      }
   })

   function getError(errors: object) {
      return Object.entries(errors)[0][1]
   }

   function onFileChange() {
      const file = input.file.files ? input.file.files[0] : null

      fileGiven = bool(file)
      if (file)
         fileOk =
            bool(file.type.match(regex.media)) && file.size <= 4194304 && file.name.length <= 250
      else fileOk = false
   }

   async function showMessage(text: string, color: string) {
      message.text = text
      message.color = color
      message.show = true
      await tick()
      setTimeout(() => {
         message.show = false
      }, 3000)
   }
</script>

<div
   on:click={() => (expandHover = !expandHover)}
   on:keydown={() => null}
   class="grid gap-2 ml-2 auto-rows-[250px] min-[490px]:auto-rows-[300px] grid-cols-2 min-[490px]:grid-cols-3 sm:grid-cols-4 min-[867px]:grid-cols-5 lg:grid-cols-6"
>
   {#each data.ops as op (op.id)}
      {@const onHover =
         'hover:h-[120%] hover:w-[130%] hover:-mx-[15%] hover:-translate-x-[0%] hover:z-10'}
      <div
         animate:flip={{ duration: 300 }}
         in:fade={{ delay: 200 }}
         style:box-shadow="0 0 10px 0 rgba(0,0,0,.2)"
         style:transition="background-color 200ms ease"
         class:cursor-zoom-out={expandHover}
         class="p-2 hover:bg-neutral w-auto cursor-zoom-in
                {expandHover ? onHover : ''}
                form-control items-center bg-base-100 rounded-md"
      >
         <span class="self-start w-full flex items-center justify-stretch gap-1 mb-1 flex-wrap">
            {#each [['post', 'ic:sharp-reply', 'success'], ['image', 'material-symbols:image', 'warning']] as [prop, icon, style]}
               {@const count = op.thread[prop + 'Count']}
               <span
                  class="flex tooltip tooltip-bottom items-center"
                  data-tip="{count} {prop}{count == 1 ? '' : 's'}"
               >
                  <div class="text-{style}">
                     <Icon {icon} width={14} height={14} />
                  </div>
                  <small
                     class:text-primary-focus={count >= data.board.bumpLimit}
                     class:text-neutral-content={count < data.board.bumpLimit}
                     class="text-xs">{count}</small
                  >
               </span>
            {/each}

            {#if op.thread.sticky || op.thread.closed}
               {#each icons.status as { status, icon, color }}
                  {#if op.thread[status]}
                     <span class="tooltip tooltip-bottom" data-tip={status}>
                        <div class={color}>
                           <Icon {icon} width={15} height={15} />
                        </div>
                     </span>
                  {/if}
               {/each}
            {/if}

            <div class="ml-auto" />

            {#if op.thread.verified}
               <div class="tooltip tooltip-bottom" data-tip="only verified posters">
                  <Icon class="text-info" icon="material-symbols:verified" width={14} height={14} />
               </div>
            {/if}

            {#if op.thread.genders.length < data.board.genders.length}
               {@const { exclude, array } = mininfo(op.thread.genders, data.board.genders)}
               {#each icons.gender as { gender, icon, color }}
                  {#if array.includes(gender)}
                     <div
                        class="tooltip tooltip-bottom"
                        data-tip="{exclude ? 'no' : 'only'} {gender} posters"
                     >
                        <Icon class={color} {icon} width={15} height={15} />
                     </div>
                  {/if}
               {/each}
            {/if}

            {#if op.thread.races.length < data.board.races.length}
               {@const { exclude, array } = mininfo(op.thread.races, data.board.races)}
               {#each icons.race as { race, icon }}
                  {#if array.includes(race)}
                     <div
                        class="tooltip tooltip-bottom"
                        data-tip="{exclude ? 'no ' : 'only'} {race} posters"
                     >
                        <Icon
                           class={exclude ? 'border border-red-400 rounded-sm' : ''}
                           {icon}
                           width={15}
                           height={15}
                        />
                     </div>
                  {/if}
               {/each}
            {/if}
         </span>

         <a
            on:keydown={keyboardClick}
            class="flex outline-neutral justify-center"
            href="/{data.board.name}/{op.no}"
         >
            <img
               style:max-height="150px"
               style:max-width="min(100%, 180px)"
               class="rounded-sm mb-1"
               src="/media/{op.id}/{op.media}?thumb=250x0"
               alt="op"
            />
         </a>

         <small
            style:line-height="14px"
            class="text-primary text-center break-words whitespace-break-spaces font-bold w-full"
         >
            {op.subject}
         </small>

         <small
            class="w-full leading-4 overflow-hidden {expandHover
               ? 'hover:overflow-y-scroll'
               : ''} text-center"
         >
            {@html format.comment(op.comment)}
         </small>

         {#if op.race || op.gender}
            <small class="text-xs italic text-neutral-content mt-auto self-end"
               >t. {op.race} {op.gender}
            </small>
         {/if}
      </div>
   {/each}
</div>

<Window
   on:close={() => ($menu[0] = !$menu[0])}
   add="top-32 right-20"
   py={34}
   bind:show={$menu[0]}
   bind:message
   title="New Thread"
>
   <form method="POST" use:enhance class="form-control gap-2">
      <div class="flex gap-1">
         <input
            tabindex={$menu[0] ? 0 : -1}
            placeholder="Name"
            name="name"
            class:input-error={input.name.length > 50}
            bind:value={input.name}
            class="input w-2/5 input-xs"
         />
         <input
            tabindex={$menu[0] ? 0 : -1}
            name="subject"
            bind:value={input.subject}
            placeholder="Subject"
            class:input-error={input.subject.length > 100}
            class="input w-3/5 input-xs"
         />
      </div>

      <textarea
         tabindex={$menu[0] ? 0 : -1}
         style:height="100px"
         style:max-height="150px"
         required
         style:line-height="1.1"
         name="comment"
         bind:value={input.comment}
         placeholder="Comment"
         class:text-error={input.comment.length > 2000}
         class="textarea textarea-xs"
      />

      <!-- gender + race -->
      {#if data.board.genders.length > 0 || data.board.races.length > 0}
         <div class="flex">
            {#if data.board.genders.length > 0}
               <label class="flex items-center">
                  <div class="badge cursor- font-bold badge-info badge-sm mr-1">Gender</div>

                  <input
                     tabindex={-1}
                     checked
                     class="hidden"
                     type="radio"
                     name="gender"
                     bind:group={input.gender}
                     value="none"
                  />

                  {#each icons.gender as { gender, color, icon }}
                     {#if data.board.genders.includes(gender)}
                        <div class="flex {color} items-center">
                           <input
                              tabindex={$menu[0] ? 0 : -1}
                              type="radio"
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

            {#if data.board.races.length > 0}
               <div class="flex items-center">
                  <div class="badge font-bold badge-warning badge-sm mr-2">Race</div>
                  <select
                     tabindex={$menu[0] ? 0 : -1}
                     name="race"
                     bind:value={input.race}
                     class="select select-xs"
                  >
                     <option value="none">None</option>
                     {#each data.board.races as race}
                        <option value={race}>{race.titleCase()}</option>
                     {/each}
                  </select>
               </div>
            {/if}

            {#if data.user.valid}
               <div transition:fade|local class="ml-auto">
                  <IconToggle
                     bind:interact={$menu[0]}
                     icon="icon-park-outline:message-sent"
                     name="DMs"
                     tip="allow DMs"
                  />
               </div>
            {/if}
         </div>
      {/if}

      <!-- requirements + sticky/closed -->
      <div class="form-control gap-1">
         <!-- requirements -->
         <div class="flex items-center gap-1 flex-wrap">
            <div class="tooltip" data-tip="who can post in the thread">
               <div class="badge badge-sm font-bold">require</div>
            </div>

            {#if data.user.valid && (data.user.verified || ['mod', 'founder'].includes(data.user.role))}
               <IconToggle
                  bind:interact={$menu[0]}
                  icon="material-symbols:verified"
                  name="require"
                  tip="verified gender/race"
                  color="text-info"
                  value="verified"
               />
            {/if}

            {#each icons.gender as { gender, color, icon }}
               {#if data.board.genders.includes(gender)}
                  <IconToggle
                     bind:interact={$menu[0]}
                     {icon}
                     {color}
                     name="require"
                     tip={gender}
                     value={gender}
                  />
               {/if}
            {/each}

            {#each icons.race as { race, icon }}
               {#if data.board.races.includes(race)}
                  <IconToggle
                     bind:interact={$menu[0]}
                     {icon}
                     value={race}
                     name="require"
                     tip={race}
                  />
               {/if}
            {/each}
         </div>

         <!-- sticky/closed -->
         {#if data.user.valid && ['founder', 'mod'].includes(data.user.role)}
            <div class="flex gap-1 items-center">
               <div class="badge font-bold badge-sm">thread</div>
               {#each icons.status as { status, icon, color }}
                  <IconToggle {icon} name={status} {color} bind:interact={$menu[0]} tip={status} />
               {/each}
            </div>
         {/if}
      </div>

      <div class="flex gap-1 justify-stretch items-center">
         {#if !input.url}
            <input
               in:slide|local={{ axis: 'x', delay: 0 }}
               tabindex={$menu[0] ? 0 : -1}
               required
               type="file"
               name="file"
               on:change={onFileChange}
               class:input-error={fileGiven && !fileOk}
               bind:this={input.file}
               class="input input-xs bg-transparent px-0"
            />
         {/if}

         {#if input.url}
            <div class="flex flex-1 gap-1">
               <input
                  in:slide|local={{ axis: 'x' }}
                  type="url"
                  tabindex={$menu[0] ? 0 : -1}
                  required
                  name="url"
                  placeholder="Link"
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
               class="outline-neutral"
               on:click={() => (input.url = !input.url)}
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
               bind:stopTime
            />
         </div>
      {/if}

      <button
         type={$menu[0] && canSubmit ? 'submit' : 'button'}
         tabindex={$menu[0] && canSubmit ? 0 : -1}
         class:btn-disabled={!canSubmit}
         disabled={!canSubmit}
         on:click={() => (stopTime = true)}
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