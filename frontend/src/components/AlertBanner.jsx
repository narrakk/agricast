const SEVERITY_STYLES = {
  critical: 'bg-red-100 border-red-400 text-red-800',
  warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800'
};

export default function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div key={i} className={`border-l-4 rounded-r-lg p-3 text-sm font-medium ${SEVERITY_STYLES[alert.severity]}`}>
          {alert.message}
        </div>
      ))}
    </div>
  );
}