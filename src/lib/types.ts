import type { Record } from 'pocketbase'

export type race = 'white' | 'black' | 'latino' | 'asian' | 'indian' | 'arabic' | 'jewish'
export type gender = 'male' | 'female'
export type role = 'user' | 'mod' | 'janitor' | 'founder'
export type status = 'sticky' | 'closed'
export type avatarStyle = 'lorelei' | 'notionists' | 'micah' | 'open-peeps' | 'croodles'

const base = ['id', 'created', 'updated']
export const fields = {
   thread: [
      ...base,
      'board',
      'index',
      'title',
      'sticky',
      'closed',
      'archived',
      'genders',
      'races',
      'verified',
      'postCount',
      'imageCount'
   ]
}

export interface Captcha extends Record {
   text: string
}

export interface Session extends Record {
   user: string | User
   uuid: string
}

export interface Board extends Record {
   name: string
   icon: string
   color: string
   description: string
   category: string
   genders: gender[]
   races: race[]
   nsfw: boolean
   imageOnly: boolean
   threadCap: number
   bumpLimit: number
   postCount: number
}

export interface Thread extends Record {
   board: string
   index: number
   title: string
   sticky: boolean
   closed: boolean
   archived: boolean
   verified: boolean
   genders: gender[]
   races: race[]
   postCount: number
   imageCount: number
}

export interface Post extends Record {
   no: number
   thread: Thread
   user: string
   name: string
   trip: string
   subject: string
   comment: string
   media: File | string
   mediaHash: string
   country: string
   gender: gender | null
   race: race | null
   replies: string
   canDM: boolean
}

export interface User extends Record {
   valid: boolean
   starred: Starred[]
   filters: Filter[]

   username: string
   password: string
   role: role
   gender: gender
   race: race
   points: number
   verified: boolean
   avatarStyle: avatarStyle
   avatarSeed: string
}

export interface Starred extends Record {
   user: string
   board: string
   thread: Thread
   threadNumber: number
}

export interface Filter extends Record {
   user: string // id
   board: string // id
   op: boolean
   post: boolean
   gender: gender[]
   race: race[]
   name: string
   subject: string
   comment: string
   media: string
}
