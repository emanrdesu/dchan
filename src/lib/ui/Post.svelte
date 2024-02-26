<script lang="ts">
   import type { Board, Post, Thread } from '$lib/types'
   import { sign, format, icons, mininfo, races, genders, stati } from '$lib/misc'
   import { fly } from 'svelte/transition'
   import Header from '$lib/ui/part/Header.svelte'

   import Icon from '@iconify/svelte'
   import { cubicInOut } from 'svelte/easing'
   import Image from './part/Image.svelte'

   export let post: Post
   export let op = false
   export let opno = 0
   export let thread = undefined as unknown as Thread
   export let board = undefined as unknown as Board

   const mediaURL = `/media/${post.id}/${post.media}`
   let full = false

   async function onImageClick(e: MouseEvent) {
      if (e.ctrlKey) {
         window.open(mediaURL, '_blank')
      } else {
         full = !full
      }
   }

   function randomLength(base: number, add: number) {
      return sign.flip() * (base + Math.floor(Math.random() * add))
   }
</script>

<div
   in:fly={{ delay: 400, x: randomLength(300, 300), easing: cubicInOut }}
   id={post.no.toString()}
   style:border-radius="4px"
   style:transition="background-color 200ms ease"
   class="relative bg-neutral w-fit p-4 pl-3 {op ? 'py-3' : 'pt-2'}"
   style:box-shadow="0 0 10px 0 rgba(0,0,0,.1)"
>
   {#if op}
      <div class="absolute right-2 z-10 bottom-2">
         <span class="self-start w-full flex items-center justify-stretch gap-1 mb-1 flex-wrap">
            {#each [['post', 'ic:sharp-reply', 'success'], ['image', 'material-symbols:image', 'warning']] as [prop, icon, style]}
               {@const count = thread[prop + 'Count']}
               <span
                  class="flex tooltip tooltip-bottom items-center"
                  data-tip="{count} {prop}{count == 1 ? '' : 's'}"
               >
                  <div class="text-{style}">
                     <Icon {icon} width={14} height={14} />
                  </div>
                  <small class="text-xs">{count}</small>
               </span>
            {/each}

            {#if thread.sticky || thread.closed}
               {#each stati as status}
                  {@const { icon, color } = icons.status[status]}
                  {#if thread[status]}
                     <span class="tooltip tooltip-bottom" data-tip={status}>
                        <div class={color}>
                           <Icon {icon} width={15} height={15} />
                        </div>
                     </span>
                  {/if}
               {/each}
            {/if}

            {#if thread.verified}
               <div class="tooltip tooltip-bottom" data-tip="only verified posters">
                  <Icon class="text-info" icon="material-symbols:verified" width={14} height={14} />
               </div>
            {/if}

            {#if thread.genders.length < board.genders.length}
               {@const { exclude, array } = mininfo(thread.genders, board.genders)}
               {#each genders as gender}
                  {@const { color, icon } = icons.gender[gender]}
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

            {#if thread.races.length < board.races.length}
               {@const { exclude, array } = mininfo(thread.races, board.races)}
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
      </div>
   {/if}

   <!-- header -->
   {#if !op}
      <Header add="mb-2" {post} />
   {/if}

   <div class="overflow-auto leading-4">
      {#if post.media}
         {@const filename = format.filename(post.media)}
         <div class="float-left mr-3 form-control items-center">
            <Image url={mediaURL} />

            <small
               title={filename}
               style:font-size="10px"
               class="overflow-hidden opacity-80 max-w-[158px] whitespace-nowrap"
            >
               <a class="link link-hover" target="_blank" href={mediaURL}>{filename}</a>
            </small>
         </div>
      {/if}

      {#if op}
         <Header {post} />
      {/if}

      <span style:font-size="13px" style:line-height="15px" class="comment">
         {@html format.comment(post.comment, opno)}
      </span>
   </div>
</div>
