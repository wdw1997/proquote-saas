import { useState, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { PLANS } from '../lib/plans'

export default function Home() {
  const { data: session, status } = useSession()
  const [tab, setTab] = useState('create')
  const [jobDesc, setJobDesc] = useState('')
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userPlan, setUserPlan] = useState('free')

  // 获取用户的套餐信息
  useEffect(() => {
    if (session) {
      fetch('/api/user-plan')
        .then(r => r.json())
        .then(data => setUserPlan(data.plan || 'free'))
    }
  }, [session])

  // 每次用户点击"我的报价"标签时，去获取数据
  useEffect(() => {
    if (session && tab === 'quotes') {
      fetch('/api/quotes')
        .then(r => {
          if (!r.ok) throw new Error('获取报价失败')
          return r.json()
        })
        .then(setQuotes)
        .catch(err => setError(err.message))
    }
  }, [session, tab])

  // 还在加载登录状态时，显示这个
  if (status === 'loading') return <div className="p-10 text-center">加载中...</div>

  // 没登录时，显示登录按钮
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-10 rounded-lg shadow-2xl text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">🧰 ProQuote AI</h1>
          <p className="text-gray-600 mb-8 text-lg">超快、超专业的 AI 自动报价系统</p>
          <button 
            onClick={() => signIn('google')} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            使用 Google 账号一键登录
          </button>
          <p className="text-gray-400 text-sm mt-6">使用 Creem 支付，支持全球信用卡</p>
        </div>
      </div>
    )
  }

  // 点击生成报价的逻辑
  const generate = async () => {
    if (!jobDesc.trim()) {
      setError('请填写工作描述')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ jobDescription: jobDesc })
      })
      const data = await res.json()
      setLoading(false)
      if (data.error) {
        setError(data.error)
      } else {
        alert('生成成功！请去"我的报价"查看。')
        setJobDesc('')
      }
    } catch (err) {
      setLoading(false)
      setError('生成失败，请检查网络连接')
    }
  }

  // 升级套餐
  const upgradePlan = (planType) => {
    if (planType === 'solo_pro') {
      window.open(process.env.NEXT_PUBLIC_CREEM_SOLO_PRO_LINK, '_blank')
    } else if (planType === 'team') {
      window.open(process.env.NEXT_PUBLIC_CREEM_TEAM_LINK, '_blank')
    }
  }

  // 登录后的主界面
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">ProQuote AI</h1>
          <div className="space-x-4 text-sm font-medium">
            <span className="text-gray-600">你好, {session.user.name}</span>
            <span className="text-blue-600">当前套餐: {PLANS[userPlan].name}</span>
            <button 
              onClick={() => signOut()} 
              className="text-gray-400 hover:text-red-500 underline"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="max-w-6xl mx-auto px-6 mt-6">
        <div className="flex gap-2 mb-6">
          <button 
            className={`px-6 py-2 rounded-t-lg font-bold transition ${tab==='create'?'bg-blue-600 text-white':'bg-gray-200 text-gray-600 hover:bg-gray-300'}`} 
            onClick={()=>setTab('create')}
          >
            📋 新建报价
          </button>
          <button 
            className={`px-6 py-2 rounded-t-lg font-bold transition ${tab==='quotes'?'bg-blue-600 text-white':'bg-gray-200 text-gray-600 hover:bg-gray-300'}`} 
            onClick={()=>setTab('quotes')}
          >
            📊 我的报价
          </button>
          <button 
            className={`px-6 py-2 rounded-t-lg font-bold transition ${tab==='pricing'?'bg-blue-600 text-white':'bg-gray-200 text-gray-600 hover:bg-gray-300'}`} 
            onClick={()=>setTab('pricing')}
          >
            💳 升级套餐
          </button>
        </div>

        {/* 新建报价标签 */}
        {tab === 'create' && (
          <div className="bg-white p-8 rounded-b-lg rounded-tr-lg shadow border border-gray-100">
            <h2 className="text-lg font-bold mb-4">描述一下客户需要做什么活儿：</h2>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
            <textarea 
              className="w-full border-2 border-gray-200 p-4 mb-4 rounded-lg focus:border-blue-500 outline-none" 
              rows="5" 
              placeholder="例如：客户需要刷一面 10x12 的墙，刷两遍漆，需要补洞..." 
              value={jobDesc} 
              onChange={e=>setJobDesc(e.target.value)} 
            />
            <button 
              onClick={generate} 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg text-lg transition"
            >
              {loading ? 'AI 脑力全开生成中...' : '✨ 一键生成专业报价'}
            </button>
            <p className="text-gray-400 text-sm mt-4">
              当前套餐 {PLANS[userPlan].name}：今天还可生成 <span className="font-bold">{PLANS[userPlan].dailyLimit}</span> 次报价
            </p>
          </div>
        )}

        {/* 我的报价标签 */}
        {tab === 'quotes' && (
          <div className="bg-white p-8 rounded-b-lg rounded-tr-lg shadow border border-gray-100 space-y-6">
            {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}
            {quotes.length === 0 ? <p className="text-gray-500">你还没生成过报价。</p> : null}
            {quotes.map(q => (
               <div key={q.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                 <div className="font-bold text-lg mb-2">描述：{q.job_description}</div>
                 <div className="text-sm text-gray-400 mb-4">时间：{new Date(q.created_at).toLocaleString()}</div>
                 <div className="bg-white p-4 rounded-lg border border-gray-200">
                   <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{q.quote_text}</pre>
                 </div>
               </div>
            ))}
          </div>
        )}

        {/* 升级套餐标签 */}
        {tab === 'pricing' && (
          <div className="bg-white p-8 rounded-b-lg rounded-tr-lg shadow border border-gray-100">
            <h2 className="text-2xl font-bold mb-8">选择你的套餐</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free 套餐 */}
              <div className={`p-6 rounded-lg border-2 ${userPlan === 'free' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                <h3 className="text-xl font-bold mb-2">{PLANS.free.name}</h3>
                <p className="text-gray-600 mb-4">{PLANS.free.description}</p>
                <p className="text-3xl font-bold mb-4">{PLANS.free.price}</p>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>✅ 每天 {PLANS.free.dailyLimit} 次生成</li>
                  <li>✅ 基础功能</li>
                  <li>❌ 高级功能</li>
                </ul>
                {userPlan === 'free' ? (
                  <button className="w-full bg-gray-400 text-white py-2 rounded cursor-default">当前套餐</button>
                ) : (
                  <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded">降级</button>
                )}
              </div>

              {/* Solo Pro 套餐 */}
              <div className={`p-6 rounded-lg border-2 ${userPlan === 'solo_pro' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
                <h3 className="text-xl font-bold mb-2">{PLANS.solo_pro.name}</h3>
                <p className="text-gray-600 mb-4">{PLANS.solo_pro.description}</p>
                <p className="text-3xl font-bold mb-4">{PLANS.solo_pro.price}</p>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>✅ 每天 {PLANS.solo_pro.dailyLimit} 次生成</li>
                  <li>✅ 优先支持</li>
                  <li>✅ 高级功能</li>
                </ul>
                {userPlan === 'solo_pro' ? (
                  <button className="w-full bg-blue-600 text-white py-2 rounded cursor-default">当前套餐</button>
                ) : (
                  <button 
                    onClick={() => upgradePlan('solo_pro')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
                  >
                    升级
                  </button>
                )}
              </div>

              {/* Team 套餐 */}
              <div className={`p-6 rounded-lg border-2 ${userPlan === 'team' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'} relative`}>
                <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold">热销</div>
                <h3 className="text-xl font-bold mb-2">{PLANS.team.name}</h3>
                <p className="text-gray-600 mb-4">{PLANS.team.description}</p>
                <p className="text-3xl font-bold mb-4">{PLANS.team.price}</p>
                <ul className="text-sm text-gray-600 space-y-2 mb-6">
                  <li>✅ 每天 {PLANS.team.dailyLimit} 次生成</li>
                  <li>✅ 团队管理</li>
                  <li>✅ API 访问</li>
                </ul>
                {userPlan === 'team' ? (
                  <button className="w-full bg-blue-600 text-white py-2 rounded cursor-default">当前套餐</button>
                ) : (
                  <button 
                    onClick={() => upgradePlan('team')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
                  >
                    升级
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}