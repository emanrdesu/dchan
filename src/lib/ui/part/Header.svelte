<script lang="ts">
   import type { Post } from '$lib/types'
   import { format, icons } from '$lib/misc'
   import Icon from '@iconify/svelte'
   import { onReplyHover, onReplyMove, onReplyLeave, scrollToID } from '$lib/events'
   import { menuActive } from '$lib/stores'

   export let post: Post
   export let add = ''

   function addReply(no: number) {
      return () => {
         $menuActive[0] = true
         const textarea = document.querySelector('textarea[name="comment"]') as HTMLInputElement
         textarea.value += `>>${no}\n`
         textarea.focus()
      }
   }
</script>

<div style:font-size="13px" class="flex {add} flex-wrap mb-1 items-center">
   <span class="text-primary-focus font-bold mr-1">
      {post.name || 'Anonymous'}
   </span>

   {#if post.trip}
      <span class="text-accent mr-1">
         !{post.trip}
      </span>
   {/if}

   {#if post.race || post.gender}
      <div class="flex mr-1">
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
      <div class="font-bold text-primary mr-1">{post.subject}</div>
   {/if}

   <div class="tooltip tooltip-bottom" data-tip={format.timeago(post.created)}>
      <span class="mr-1">{format.date(post.created)}</span>
   </div>

   <div class="link link-secondary mr-1">
      <a href="#{post.no}">No.</a><span title="click to reply" on:click={addReply(post.no)}
         >{post.no}</span
      >
   </div>

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
