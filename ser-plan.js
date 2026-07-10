import { supabase } from '../../lib/utils'
import { getServerSession } from "next-auth/next"
import { authOptions } from './auth/[...nextauth]'

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: '请先登录' })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('user_email', session.user.email)
      .single()

    if (error) {
      throw error
    }

    res.status(200).json({ plan: profile?.plan || 'free' })
  } catch (err) {
    console.error('Get user plan error:', err)
    res.status(500).json({ error: '获取套餐信息失败' })
  }
}