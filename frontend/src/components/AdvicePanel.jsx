export default function AdvicePanel({ advice }) {
  if (!advice) return null;

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {/* Irrigation card */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <h3 className="font-semibold text-agri-green flex items-center gap-1.5">💧 Irrigation</h3>
        <p className={`mt-2 text-sm ${advice.irrigationNeeded.recommended ? 'text-blue-700' : 'text-gray-600'}`}>
          {advice.irrigationNeeded.reason}
        </p>
        {advice.irrigationNeeded.urgency === 'high' && (
          <span className="mt-2 inline-block text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">High urgency</span>
        )}
      </div>

      {/* Spraying card */}
      <div className="bg-white rounded-xl border p-4 shadow-sm">
        <h3 className="font-semibold text-agri-green flex items-center gap-1.5">🌿 Spraying Window</h3>
        <p className={`mt-2 text-sm ${advice.sprayingWindow.suitable ? 'text-green-700' : 'text-orange-700'}`}>
          {advice.sprayingWindow.reason || advice.sprayingWindow.warning || (advice.sprayingWindow.suitable ? 'Suitable' : 'Not suitable')}
        </p>
      </div>

      {/* General advice */}
      {advice.advice.length > 0 && (
        <div className="sm:col-span-2 bg-white rounded-xl border p-4 shadow-sm">
          <h3 className="font-semibold text-agri-green mb-2">📋 Today's Advice</h3>
          <ul className="space-y-1.5">
            {advice.advice.map((item, i) => (
              <li key={i} className="text-sm text-gray-700">{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}