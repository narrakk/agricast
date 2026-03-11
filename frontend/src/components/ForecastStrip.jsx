const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ForecastStrip({ plantingWindows }) {
  if (!plantingWindows) return null;

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">7-Day Planting Window</h2>
      <div className="grid grid-cols-7 gap-1.5">
        {plantingWindows.map((day, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i);
          return (
            <div
              key={i}
              className={`rounded-xl p-2 text-center text-xs shadow-sm border ${
                day.suitable
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <p className="font-bold">{i === 0 ? 'Today' : DAYS[date.getDay()]}</p>
              <p className="text-lg mt-0.5">{day.suitable ? '✅' : '❌'}</p>
              <p className="mt-1 leading-tight">{day.rainProb}% rain</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}