<script lang="ts">
   import Icon from '@iconify/svelte'
   import Window from '$lib/ui/Window.svelte'
   import Captcha from '$lib/ui/Captcha.svelte'
   import IconToggle from '$lib/ui/IconToggle.svelte'
   import OpImage from '$lib/ui/part/OpImage.svelte'
   import { workLoad, menuActive, setMenu, menuClick, notify } from '$lib/stores'

   import { fade, slide } from 'svelte/transition'
   import { flip } from 'svelte/animate'
   import { tick } from 'svelte'

   import { superForm } from 'sveltekit-superforms/client'
   import {
      bool,
      format,
      icons,
      keyboardClick,
      regex,
      mininfo,
      genders,
      races,
      stati,
      random
   } from '$lib/misc'
   import { find, throttle } from 'lodash'
   import { invalidate } from '$app/navigation'
   import type { Filter, Post } from '$lib/types.js'

   export let data

   let userValid = data.user.valid

   const getLocalStars = () => {
      return data.user.starred.reverse().filter((s) => s.board == data.board.name)
   }

   const getLocalFilters = () => {
      return data.user.filters.filter((f) => f.board == data.board.name)
   }

   $: filtersLocal = data.user.valid ? getLocalFilters() : []
   $: starredLocal = data.user.valid ? getLocalStars() : []

   function filteredp(op: Post) {
      function filterRequisites(f: Filter) {
         return [
            f.gender.length > 0,
            f.race.length > 0,
            f.name.length > 0,
            f.op && f.subject.length > 0,
            f.comment.length > 0,
            f.media.length > 0
         ].filter((x) => x).length
      }

      return (
         filtersLocal.filter((f) => {
            if (f.op) {
               const frn = filterRequisites(f)
               let met = 0

               if (op.gender && f.gender.includes(op.gender)) met++
               if (op.race && f.race.includes(op.race)) met++

               for (const key of ['name', 'subject', 'comment', 'media'])
                  if (op[key] && f[key] && f[key].toRegex().test(op[key])) met++

               return met == frn
            } else return false
         }).length > 0
      )
   }

   const modalToggle = () =>
      (document.getElementById('settingsModal') as HTMLDialogElement).showModal()

   function menuSetup(option: { keep: number[] } | null = null) {
      let menu = ['gridicons:create']

      if (data.user.valid) {
         if (getLocalStars().length > 0) menu.push('bytesize:eye')
         menu.push('clarity:settings-line')
      }

      setMenu(menu, option)

      if (data.user.valid) {
         $menuClick[getLocalStars().length > 0 ? 2 : 1] = {
            on: modalToggle,
            off: modalToggle
         }
      }
   }

   menuSetup()

   // @ts-ignore
   const checkUserValidity = (..._) => {
      if (userValid != data.user.valid) {
         userValid = data.user.valid
         menuSetup({ keep: [0] })
      }

      if (userValid && data.user.starred.length == 0) {
         menuSetup({ keep: [0] })
      }
   }

   $: checkUserValidity(data.user.valid, data.user.starred)

   const input = {
      name: '',
      subject: '',
      comment: '',
      captcha: '',
      file: undefined as unknown as HTMLInputElement
   }

   let expandHover = false
   let fileGiven = false
   let fileOk = false
   let stopTime = false
   let formSucess = 0

   $: canSubmit =
      fileOk &&
      input.name.length <= 50 &&
      input.subject.length <= 100 &&
      input.comment.trim().length > 0 &&
      input.comment.trim().length <= 2000 &&
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
            $menuActive[0] = false
            input.comment = ''
            input.name = ''
            input.subject = ''
            if (input.file) input.file.value = ''

            notify(random.success(), 'success')
            formSucess++
         } else {
            // @ts-ignore
            const message = Object.entries(result.data.form.errors)[0][1] as string
            showWindowMessage(message, 'error')
            notify(message, 'error')
         }

         if (data.user.valid) {
            await invalidate('/api/user')
            menuSetup({ keep: [0, 1] })
         }

         $workLoad--
      }
   })

   function onFileChange() {
      const file = input.file.files ? input.file.files[0] : null

      fileGiven = bool(file)
      if (file)
         fileOk =
            bool(file.type.match(regex.media)) && file.size <= 4194304 && file.name.length <= 250
      else fileOk = false
   }

   async function showWindowMessage(text: string, color: string) {
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
   class="grid gap-2 mb-10 ml-2 auto-rows-[250px] min-[490px]:auto-rows-[300px] grid-cols-2 min-[490px]:grid-cols-3 sm:grid-cols-4 min-[867px]:grid-cols-5 lg:grid-cols-6"
>
   {#each data.ops.filter((op) => !filteredp(op)) as op (op.id)}
      {@const onHover =
         'hover:h-[120%] hover:w-[130%] hover:-mx-[15%] hover:-translate-x-[0%] hover:z-10'}
      <div
         animate:flip={{ duration: 300 }}
         in:fade={{ delay: 400 }}
         style:box-shadow="0 0 10px 0 rgba(0,0,0,.2)"
         style:transition="background-color 200ms ease"
         class:cursor-zoom-out={expandHover}
         class="p-2 hover:bg-neutral cursor-zoom-in
                {expandHover ? onHover : ''}
                form-control items-center bg-base-100 rounded-md relative"
      >
         <span class="self-start w-full flex items-center justify-stretch gap-1 mb-1 flex-wrap">
            {#if true}
               {@const postInfo = [
                  ['post', 'ic:sharp-reply', 'success'],
                  ['image', 'material-symbols:image', 'warning']
               ]}

               {#each postInfo as [prop, icon, style]}
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
            {/if}

            {#if op.thread.sticky || op.thread.closed}
               {#each stati as status}
                  {@const { icon, color } = icons.status[status]}

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
               {#each genders as gender}
                  {@const { icon, color } = icons.gender[gender]}

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
               {#each races as race}
                  {@const icon = icons.race[race]}

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
            <OpImage {op} />
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

         {#if true}
            {@const starred = find(
               starredLocal,
               (s) => s.board == data.board.name && s.threadNumber == op.no
            )}
            {#if data.user.valid && starred}
               <div
                  transition:fade={{ duration: 200 }}
                  class="absolute text-primary left-[10px] bottom-[10px]"
               >
                  <Icon icon="mingcute:star-fill" width={14} />
               </div>
            {/if}
         {/if}

         {#if op.race || op.gender}
            <small class="text-xs mt-auto italic text-neutral-content self-end"
               >t. {op.race} {op.gender}
            </small>
         {/if}
      </div>
   {/each}
</div>

<!-- Thread Creation -->
<Window
   on:close={() => ($menuActive[0] = !$menuActive[0])}
   add="top-32 right-32"
   py={34}
   bind:show={$menuActive[0]}
   bind:message
   title="New Thread"
>
   <form method="POST" action="?/post" use:enhance class="form-control gap-2">
      <div class="flex gap-1">
         <input
            tabindex={$menuActive[0] ? 0 : -1}
            placeholder="Name"
            name="name"
            class:input-error={input.name.length > 50}
            bind:value={input.name}
            class="input w-2/5 input-xs"
         />
         <input
            tabindex={$menuActive[0] ? 0 : -1}
            name="subject"
            bind:value={input.subject}
            placeholder="Subject"
            class:input-error={input.subject.length > 100}
            class="input flex-1 input-xs"
         />

         {#if data.user.valid}
            <div transition:fade|local class="ml-auto">
               <IconToggle
                  bind:interact={$menuActive[0]}
                  icon="icon-park-outline:message-sent"
                  name="DMs"
                  tip="allow DMs"
               />
            </div>
         {/if}
      </div>

      <textarea
         tabindex={$menuActive[0] ? 0 : -1}
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
                     class="hidden"
                     type="radio"
                     checked={!data.user.valid}
                     name="gender"
                     value="none"
                  />

                  {#each genders as gender}
                     {@const { color, icon } = icons.gender[gender]}

                     {#if data.board.genders.includes(gender)}
                        <div class="flex {color} items-center">
                           <input
                              tabindex={$menuActive[0] ? 0 : -1}
                              type="radio"
                              name="gender"
                              checked={data.user.valid && data.user.gender == gender}
                              value={gender}
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
                  <select tabindex={$menuActive[0] ? 0 : -1} name="race" class="select select-xs">
                     <option selected={!data.user.valid} value="none">None</option>
                     {#each data.board.races as race}
                        <option selected={data.user.valid && data.user.race == race} value={race}>
                           {race.titleCase()}
                        </option>
                     {/each}
                  </select>
               </div>
            {/if}
         </div>
      {/if}

      <!-- requirements + sticky/closed -->
      <div class="form-control gap-1">
         <!-- requirements -->
         <div class="flex items-center gap-1 flex-wrap">
            {#if data.board.genders.length > 0 || data.board.races.length > 0}
               <div class="tooltip" data-tip="what genders or races can be seen">
                  <div class="badge badge-sm font-bold">limit</div>
               </div>

               {#if data.user.valid && (data.user.verified || ['mod', 'founder'].includes(data.user.role))}
                  <IconToggle
                     bind:interact={$menuActive[0]}
                     icon="material-symbols:verified"
                     name="require"
                     tip="verified gender/race"
                     color="text-info"
                     value="verified"
                  />
               {/if}
            {/if}

            {#each genders as gender}
               {@const { color, icon } = icons.gender[gender]}

               {#if data.board.genders.includes(gender)}
                  <IconToggle
                     bind:interact={$menuActive[0]}
                     {icon}
                     {color}
                     name="require"
                     tip={gender}
                     value={gender}
                  />
               {/if}
            {/each}

            {#each races as race}
               {@const icon = icons.race[race]}

               {#if data.board.races.includes(race)}
                  <IconToggle
                     bind:interact={$menuActive[0]}
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
               {#each stati as status}
                  {@const { icon, color } = icons.status[status]}
                  <IconToggle
                     {icon}
                     name={status}
                     {color}
                     bind:interact={$menuActive[0]}
                     tip={status}
                  />
               {/each}
            </div>
         {/if}
      </div>

      <div class="flex gap-1 justify-stretch items-center">
         <input
            in:slide|local={{ axis: 'x', delay: 0 }}
            tabindex={$menuActive[0] ? 0 : -1}
            required
            type="file"
            name="file"
            on:change={onFileChange}
            class:input-error={fileGiven && !fileOk}
            bind:this={input.file}
            class="input input-xs bg-transparent px-0"
         />
      </div>

      {#if $menuActive[0] && !(data.user.valid && ['founder', 'mod'].includes(data.user.role))}
         <div transition:slide|local>
            <Captcha
               bind:value={input.captcha}
               add="rounded-lg"
               {errors}
               bind:visible={$menuActive[0]}
               bind:stopTime
            />
         </div>
      {/if}

      <button
         type={$menuActive[0] && canSubmit ? 'submit' : 'button'}
         tabindex={$menuActive[0] && canSubmit ? 0 : -1}
         class:btn-disabled={!canSubmit}
         disabled={!canSubmit}
         on:click={throttle(() => {
            stopTime = true
            $workLoad++
         }, 5000)}
         class="btn outline-none btn-primary btn-xs text-xs normal-case"
      >
         Submit
      </button>
   </form>
</Window>

<!-- Thread Watcher -->
{#if data.user.valid && starredLocal.length > 0}
   <Window
      title="Thread Watcher"
      on:close={() => ($menuActive[1] = !$menuActive[1])}
      add="top-32 min-w-[295px] max-h-[50vh] overflow-y-scroll max-w-[310px] right-20"
      hadd="text-sm"
      py={34}
      bind:show={$menuActive[1]}
   >
      <nav>
         {#each starredLocal as { board, thread, threadNumber }}
            {@const { title, postCount } = thread}
            <div class="flex items-center gap-1">
               <form
                  class="hidden"
                  method="POST"
                  use:enhance
                  id="unstar"
                  action="/{board}/{threadNumber}/?/unstar"
               >
                  <input
                     on:click={throttle(() => {
                        $workLoad++
                     }, 5000)}
                     hidden
                     type="submit"
                  />
               </form>
               <button
                  on:click={() => {
                     const input = document.querySelector('#unstar input')
                     // @ts-ignore
                     input.click()
                  }}
               >
                  <Icon class="hover:text-warning hover:cursor-pointer" icon="typcn:delete" />
               </button>
               <a
                  class="link link-hover overflow-hidden whitespace-nowrap text-xs link-secondary"
                  href="/{board}/{threadNumber}"
               >
                  ({postCount}) /{board}/{threadNumber} - {title}
               </a>
            </div>
         {/each}
      </nav>
   </Window>
{/if}

<!-- Settings Modal -->
{#if data.user.valid}
   <dialog
      on:close={() => ($menuActive[starredLocal.length > 0 ? 2 : 1] = false)}
      class="bg-base-100 w-3/4 max-w-sm rounded-lg"
      id="settingsModal"
   >
      <form method="dialog">
         <button tabindex={-1} class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
            ✕
         </button>
      </form>

      <h3 class="font-bold text-lg mx-auto">
         <span class="text-primary">/{data.board.name}/</span> filters
      </h3>

      <!-- Accordion -->
      <div class="w-full mt-2 text-sm rounded-lg">
         {#if filtersLocal.length > 0}
            <div class="collapse collapse-arrow">
               <input type="checkbox" name="filterAccordion" />
               <div class="collapse-title font-bold">My Filters</div>
               <div class="collapse-content">
                  {#each filtersLocal as filter}
                     <div class="overflow-y-scroll">
                        <form class="inline" method="POST" use:enhance action="?/deleteFilter">
                           <input name="id" type="hidden" value={filter.id} />

                           <button class="translate-y-[3px]" type="submit">
                              <Icon
                                 class="hover:text-warning hover:cursor-pointer"
                                 icon="typcn:delete"
                              />
                           </button>
                        </form>

                        {#each ['op', 'post'] as type}
                           {#if filter[type]}
                              <div class="badge badge-xs">{type}</div>
                           {/if}
                        {/each}

                        {#each filter.gender as gender}
                           {@const { color, icon } = icons.gender[gender]}
                           <Icon class="inline {color}" {icon} width={16} />
                        {/each}

                        {#each filter.race as race}
                           {@const icon = icons.race[race]}
                           <Icon class="inline mr-1" {icon} width={16} />
                        {/each}

                        {#each [['name', 'primary'], ['subject', 'error'], ['comment', 'success'], ['media', 'warning']] as [key, color]}
                           {#if filter[key]}
                              <div class="badge badge-xs text-{color}">
                                 {filter[key]}
                              </div>
                           {/if}
                        {/each}
                     </div>
                  {/each}
               </div>
            </div>
         {/if}
         {#key formSucess}
            <div class="collapse collapse-arrow">
               <input type="checkbox" name="filterAccordion" />
               <div class="collapse-title font-bold">Add filter</div>
               <div class="collapse-content">
                  <form method="POST" action="?/saveFilter" use:enhance class="form-control gap-3">
                     <div class="flex gap-1 flex-wrap">
                        {#each ['OP', 'Post'] as bool}
                           <div class="badge whitespace-nowrap badge-sm">{bool}</div>
                           <input
                              name={bool.toLowerCase()}
                              class="checkbox checkbox-xs mr-2"
                              type="checkbox"
                           />
                        {/each}
                     </div>

                     <!-- Gender -->
                     <div class="flexy flex-wrap">
                        <div class="badge badge-info font-bold badge-sm">Gender</div>
                        {#each data.board.genders as gender}
                           {@const { icon, color } = icons.gender[gender]}

                           <IconToggle
                              interact={true}
                              tip={gender}
                              {icon}
                              {color}
                              name="gender"
                              value={gender}
                           />
                        {/each}
                     </div>

                     <!-- Race -->
                     <div class="flexy flex-wrap">
                        <div class="badge badge-warning font-bold badge-sm">Race</div>
                        {#each data.board.races as race}
                           {@const icon = icons.race[race]}
                           <IconToggle
                              interact={true}
                              size={20}
                              tip={race}
                              {icon}
                              name="race"
                              value={race}
                           />
                        {/each}
                     </div>

                     <small>Note: For the filters below, you may leave any empty.</small>

                     {#each ['name', 'subject', 'comment', 'media'] as name}
                        <input
                           type="text"
                           {name}
                           placeholder="{name.titleCase()} filter"
                           class="input input-bordered input-xs w-full"
                        />
                     {/each}

                     <button type="submit" class="btn btn-primary btn-xs w-full">Save</button>
                  </form>
               </div>
            </div>
         {/key}
      </div>
   </dialog>
{/if}

<style>
   textarea {
      height: 200;
   }
</style>
