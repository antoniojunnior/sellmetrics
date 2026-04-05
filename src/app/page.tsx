import { redirect } from 'next/navigation'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export default function RootPage() {
  // Redirecionamento de servidor
  redirect('/dashboard/period')
  
  // Fallback de segurança (caso o redirect de servidor falhe no Edge)
  return (
    <script dangerouslySetInnerHTML={{ __html: 'window.location.href = "/dashboard/period"' }} />
  )
}
