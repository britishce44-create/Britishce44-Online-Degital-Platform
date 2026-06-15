
export function AutoMessagingPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-navy">🤖 Auto-Messaging AI</h2>
      <p className="text-sm text-gray-500">Intelligent automated messaging and notifications.</p>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow">
          <h3 className="font-semibold text-navy">📨 Triggered Messages</h3>
          <div className="mt-3 space-y-3 text-sm">
            {[
              { trigger: 'New Student Enrollment', to: 'Parent, Teacher', status: 'active' },
              { trigger: 'Exam Score Published', to: 'Student, Parent', status: 'active' },
              { trigger: 'Homework Missing (3 days)', to: 'Parent', status: 'active' },
              { trigger: 'Class Cancellation', to: 'All enrolled', status: 'active' },
              { trigger: 'Payment Reminder', to: 'Parent', status: 'inactive' },
            ].map((msg, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{msg.trigger}</p>
                  <p className="text-[10px] text-gray-400">To: {msg.to}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${msg.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{msg.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow">
          <h3 className="font-semibold text-navy">🧠 AI Composer</h3>
          <div className="mt-3">
            <textarea className="w-full border rounded-xl p-3 text-sm h-28 resize-none" placeholder="Describe the message you want to send... e.g., 'Remind parents about upcoming parent-teacher meeting next Tuesday at 5pm'" />
            <button className="mt-2 bg-gold text-navy px-5 py-2 rounded-full text-sm font-bold">Generate Message</button>
          </div>
        </div>
      </div>
      <div className="bg-royal-blue/5 rounded-xl p-4 border border-royal-blue/20">
        <p className="text-sm">📬 Messages sent today: <strong className="text-royal-blue">47</strong> · Delivery rate: <strong className="text-royal-blue">98%</strong></p>
      </div>
    </div>
  )
}
