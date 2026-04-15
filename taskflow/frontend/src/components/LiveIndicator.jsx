export default function LiveIndicator({ connected, lastEvent }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
      <span className={connected ? 'text-green-400' : 'text-red-400'}>
        {connected ? 'Live' : 'Reconnecting...'}
      </span>
      {lastEvent && connected && (
        <span className="text-gray-500 hidden sm:inline">· {lastEvent}</span>
      )}
    </div>
  )
}
