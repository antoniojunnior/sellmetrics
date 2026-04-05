export default function RootPage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Sellmetrics Root</h1>
      <p>Redirecionando para o dashboard...</p>
      <script dangerouslySetInnerHTML={{ __html: 'window.location.href = "/dashboard/period"' }} />
    </div>
  )
}
