import { supabase } from '../../lib/utils'
import { getServerSession } from "next-auth/next"
import { authOptions } from './auth/[...nextauth]'

export default async function handler(req, res) {
  try {
    // 检查用户是否登录
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: '请先登录' })
    }

    // 从数据库获取用户的所有报价（按时间倒序）
    const { data, error } = await supabase.from('quotes')
      .select('*')
      .eq('user_email', session.user.email)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    res.status(200).json(data || [])
  } catch (err) {
    console.error('Get quotes error:', err)
    res.status(500).json({ error: '获取报价失败' })
  }
}