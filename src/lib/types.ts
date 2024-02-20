import type { Record } from 'pocketbase'

export type race = 'white' | 'black' | 'latino' | 'asian' | 'indian' | 'arabic' | 'jewish'
export type gender = 'male' | 'female'
export type role = 'user' | 'mod' | 'janitor' | 'founder'
export type status = 'sticky' | 'closed'
export type avatarStyle = 'lorelei' | 'notionists' | 'micah' | 'open-peeps' | 'croodles'

export interface Captcha extends Record {
   text: string
}

export interface Session extends Record {
   user: string | User
   uuid: string
}

export interface Category extends Record {
   name: string
}

export interface Board extends Record {
   name: string
   icon: string
   color: string
   description: string
   category: string
   genders: string[]
   races: string[]
   nsfw: boolean
   imageOnly: boolean
   threadCap: number
   bumpLimit: number
   postCount: number
}

export interface Thread extends Record {
   board: string
   index: number
   sticky: boolean
   closed: boolean
   archived: boolean
   verified: boolean
   genders: string[]
   races: string[]
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
   username: string
   password: string
   role: role
   gender: gender
   race: race
   verified: boolean
   avatarStyle: avatarStyle
   avatarSeed: string
}

export interface Category extends Record {
   name: string
}
