import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { supabase } from "../../../lib/utils"
import { v4 as uuidv4 } from 'uuid'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // 用户第一次登录时，自动在数据库给他建一个档案
      try {
        const { data } = await supabase.from('profiles').select('id').eq('user_email', user.email).single()
        if (!data) {
          await supabase.from('profiles').insert({
            user_email: user.email,
            name: user.name,
            public_slug: uuidv4().substring(0,8)
          })
        }
      } catch (error) {
        console.error('SignIn callback error:', error)
      }
      return true
    }
  }
}

export default NextAuth(authOptions)