<script lang="ts">
   import type { Post } from '$lib/types'
   import { format, icons } from '$lib/misc'
   import Icon from '@iconify/svelte'
   import { onReplyHover, onReplyMove, onReplyLeave, scrollToID } from '$lib/events'
   import { menu } from '$lib/stores'

   export let post: Post
   export let add = ''

   function addReply(no: number) {
      return () => {
         $menu[0] = true
         const textarea = document.querySelector('textarea[name="comment"]') as HTMLInputElement
         textarea.value += `>>${no}\n`
         textarea.focus()
      }
   }
</script>

<div style:font-size="13px" class="flex {add} flex-wrap gap-1 mb-1 items-center">
   <span class="text-primary-focus font-bold">
      {post.name || 'Anonymous'}
   </span>

   {#if post.trip}
      <span class="text-accent">
         !{post.trip}
      </span>
   {/if}

   {#if post.race || post.gender}
      <div class="flex">
         {#if post.race}
            {@const size = 15}
            {@const icon = icons.race[post.race]}
            <div class="tooltip tooltip-bottom" data-tip={post.race}>
               <Icon {icon} width={size} height={size} />
            </div>
         {/if}

         {#if post.gender}
            {@const size = 15}
            {@const { icon, color } = icons.gender[post.gender]}
            <div class="tooltip tooltip-bottom" data-tip={post.gender}>
               <Icon class={color} {icon} width={size} height={size} />
            </div>
         {/if}
      </div>
   {/if}

   {#if post.subject}
      <div class="font-bold text-primary">{post.subject}</div>
   {/if}

   <div class="tooltip tooltip-bottom" data-tip={format.timeago(post.created)}>
      <span>{format.date(post.created)}</span>
   </div>

   <div class="link link-secondary mr-1">
      <a href="#{post.no}">No.</a><span title="click to reply" on:click={addReply(post.no)}
         >{post.no}</span
      >
   </div>

   <div class="flex flex-wrap">
      {#each post.replies.match(/\d+/g) || [] as reply}
         {@const size = 18}
         {@const icon = 'basil:reply-solid'}
         <span
            class="cursor-pointer"
            on:mouseenter={onReplyHover(reply)}
            on:click={scrollToID(reply)}
            on:mouseleave={onReplyLeave(reply)}
            on:mousemove={onReplyMove(reply)}
         >
            <Icon
               class="r{reply} opacity-70 hover:opacity-100 transition-opacity text-success"
               {icon}
               width={size}
               height={size}
            />
         </span>
      {/each}
   </div>
</div>
