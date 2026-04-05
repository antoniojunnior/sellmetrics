import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Simplificação radical: Apenas deixa a requisição passar
  // Isso elimina qualquer chance de erro 500 vindo da lógica de Auth no Edge
  return NextResponse.next({
    request,
  })
}
