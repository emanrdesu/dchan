
## dchan
Is an anoymous imageboard with optional accounts that let you "attach" information about yourself to your post, such as gender, nationality, etc.

> Status: Unfinished but functional.

### Features
1. Optional user accounts
2. Themes
3. No registration with email
4. Modern look and feel

#### Future
- User messaging system
- Local threads (set to a mile radius)
- User verification for and by users

## Stack/Tech
- Svelte + SvelteKit
- PostCSS + DaisyUI
- Zod + SvelteKit Superforms
- Pocketbase for database hosting
- To be hosted in a Linode server

## Screenshots
![Homepage](/static/homepage.png)
![Board](/static/board.png)
![Post](/static/post.png)
![Thread](/static/thread.png)

## Setup
Since it's not hosted yet, to see it in a localhost version. Just run `npm run dev -- --open` and `./pocketbase serve` in the root directory after downloading pocketbase onto the directory and installing packages.
