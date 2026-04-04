import { redirect } from 'next/navigation'

export default function RootPage() {
  // Redireciona a raiz para o dashboard (o middleware cuidará da autenticação)
  redirect('/dashboard/period')
}
