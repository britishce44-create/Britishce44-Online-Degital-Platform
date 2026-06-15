
export function VideoArchivePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-navy">🎬 Video Archive</h2>
      <p className="text-sm text-gray-500">Browse recorded lessons and uploaded videos.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="bg-white rounded-xl shadow overflow-hidden">
            <div className="aspect-video bg-gray-200 flex items-center justify-center text-4xl">🎥</div>
            <div className="p-3">
              <p className="font-semibold text-sm truncate text-navy">Lesson Recording #{i + 1}</p>
              <p className="text-[10px] text-gray-400">Grade {Math.floor(i / 3) + 1} · {20 + i} min</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-royal-blue/5 rounded-xl p-4 border border-royal-blue/20">
        <h3 className="font-semibold text-royal-blue">📤 Upload Video</h3>
        <p className="text-xs text-gray-500 mt-1">Supported: MP4, WebM, MOV · Max 500MB</p>
        <button className="mt-2 bg-royal-blue text-white px-4 py-1.5 rounded-full text-sm">Upload</button>
      </div>
    </div>
  )
}
