import { SessionProvider } from "next-auth/react"

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    // 这就是那件“保护服”，它让整个项目都能识别登录状态
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  )
}