
export function MarketingPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-navy">📢 Marketing Suite</h2>
      <p className="text-sm text-gray-500">Campaign management and promotional tools.</p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow">
          <h3 className="font-semibold text-navy">📧 Email Campaigns</h3>
          <div className="mt-3 space-y-2 text-sm">
            {[
              { name: 'Welcome Series', sent: 1240, open: 68 },
              { name: 'Enrollment Drive', sent: 890, open: 72 },
              { name: 'Newsletter Q2', sent: 2100, open: 45 },
            ].map((c, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="font-medium">{c.name}</span>
                <span className="text-xs text-gray-400">{c.sent} sent · {c.open}% open</span>
              </div>
            ))}
          </div>
          <button className="mt-3 bg-navy text-white px-4 py-1.5 rounded-full text-xs">+ New Campaign</button>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <h3 className="font-semibold text-navy">📱 Social Media</h3>
          <div className="mt-3 space-y-3 text-sm">
            {[
              { platform: 'WhatsApp Groups', count: 12, active: '230 members' },
              { platform: 'Telegram Channel', count: 1, active: '560 subscribers' },
              { platform: 'Facebook Page', count: 1, active: '1.2K followers' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between py-2 border-b last:border-0">
                <span>{s.platform}</span>
                <span className="text-xs text-gray-400">{s.count} · {s.active}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-gold/10 rounded-xl p-4 border border-gold">
        <p className="text-sm">📊 Total Reach: <strong className="text-gold">4,230</strong> · Conversion Rate: <strong className="text-gold">12.5%</strong></p>
      </div>
    </div>
  )
}
