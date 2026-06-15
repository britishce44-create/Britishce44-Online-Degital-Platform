
export function VideoEditorPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-navy">🎞️ AI Video Editor</h2>
      <p className="text-sm text-gray-500">Edit, trim, and enhance videos with AI-powered tools.</p>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-xl p-5 shadow">
          <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center text-6xl text-white/30">🎬</div>
          <div className="mt-3 flex gap-2">
            <button className="bg-navy text-white px-4 py-1.5 rounded-full text-sm">✂️ Trim</button>
            <button className="bg-royal-blue text-white px-4 py-1.5 rounded-full text-sm">🎨 Effects</button>
            <button className="bg-gold text-navy px-4 py-1.5 rounded-full text-sm">🔊 Audio</button>
            <button className="bg-gray-200 text-gray-600 px-4 py-1.5 rounded-full text-sm">💾 Export</button>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow space-y-3">
          <h3 className="font-semibold text-navy">🪄 AI Tools</h3>
          {[
            { tool: 'Auto-Scene Detection', desc: 'Identify and split scenes automatically' },
            { tool: 'Smart Subtitles', desc: 'Generate accurate captions from speech' },
            { tool: 'Background Removal', desc: 'Remove or blur video background' },
            { tool: 'Audio Denoise', desc: 'Clean up background noise' },
            { tool: 'Auto-Enhance', desc: 'AI color grading and lighting fix' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <span className="text-gold text-lg">▸</span>
              <div>
                <p className="text-xs font-medium">{t.tool}</p>
                <p className="text-[10px] text-gray-400">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
