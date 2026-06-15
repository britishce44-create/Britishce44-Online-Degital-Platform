
export function AiDevPage() {
  const tools = [
    { name: '🧠 AI Code Assistant', desc: 'Generate and review code with AI', status: 'online' },
    { name: '🔍 Bug Detector', desc: 'Static analysis and vulnerability scanning', status: 'online' },
    { name: '📝 Auto-Documentation', desc: 'Generate docs from code comments', status: 'online' },
    { name: '⚡ Performance Profiler', desc: 'Identify bottlenecks and optimize', status: 'beta' },
    { name: '🧪 Test Generator', desc: 'Auto-create unit and integration tests', status: 'online' },
    { name: '🔗 API Schema Builder', desc: 'Design and validate API schemas', status: 'online' },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-navy">🤖 AI Dev Assistant</h2>
      <p className="text-sm text-gray-500">Developer tools powered by artificial intelligence.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((t, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow hover:shadow-md transition">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-navy text-lg">{t.name}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span>
            </div>
            <p className="text-xs text-gray-500">{t.desc}</p>
            <button className="mt-3 text-gold text-sm underline">Launch →</button>
          </div>
        ))}
      </div>
      <div className="bg-royal-blue/5 rounded-xl p-4 border border-royal-blue/20">
        <p className="text-sm">💡 Tip: Use natural language to describe features, and AI Dev will generate the code.</p>
      </div>
    </div>
  )
}
