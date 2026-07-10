import { supabase, escapeHtml } from '../../lib/utils'
import { PLANS } from '../../lib/plans'
import { getServerSession } from "next-auth/next"
import { authOptions } from './auth/[...nextauth]'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function handler(req, res) {
  try {
    // 第一步：检查用户是否登录
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ error: '请先登录' })
    }

    // 第二步：获取用户输入
    const { jobDescription } = req.body
    if (!jobDescription) {
      return res.status(400).json({ error: '请填写工作描述' })
    }

    const safeJobDesc = escapeHtml(jobDescription)

    // 第三步：查用户的当前套餐
    const { data: profile } = await supabase.from('profiles').select('plan').eq('user_email', session.user.email).single()
    if (!profile) {
      return res.status(404).json({ error: '用户档案不存在' })
    }

    const limit = PLANS[profile.plan]?.dailyLimit || PLANS.free.dailyLimit

    // 第四步：查用户今天生成了多少次报价
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await supabase.from('quotes').select('id', { count: 'exact' })
      .eq('user_email', session.user.email)
      .gte('created_at', today.toISOString())

    // 第五步：检查是否超过今日限额
    if (count >= limit) {
      return res.status(400).json({ error: `今日生成次数已达上限（${limit}次），请升级套餐！` })
    }

    // 第六步：调用 OpenAI 的 ChatGPT 生成报价
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a professional handyman estimator. Write a clear and detailed quote.' },
        { role: 'user', content: safeJobDesc }
      ],
    })
    
    const quoteText = completion.choices[0].message.content
    
    // 第七步：保存报价到数据库
    await supabase.from('quotes').insert({
      user_email: session.user.email,
      job_description: safeJobDesc,
      quote_text: quoteText
    })

    // 第八步：返回成功信息
    res.status(200).json({ success: true, quote: quoteText })
  } catch (err) {
    console.error('Generate quote error:', err)
    res.status(500).json({ error: 'AI 生成失败，请重试' })
  }
}