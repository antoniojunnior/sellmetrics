export default function RootPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-10 text-center">
      <h1 className="text-4xl font-black text-text-primary mb-4">Sellmetrics está Online</h1>
      <p className="text-text-secondary mb-8">O build foi concluído e a aplicação está sendo servida.</p>
      <a 
        href="/dashboard/period" 
        className="bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-accent-hover transition-all"
      >
        Acessar Dashboard
      </a>
    </div>
  )
}
