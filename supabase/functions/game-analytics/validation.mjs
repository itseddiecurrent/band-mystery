const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS = new Set(['start', 'resume', 'checkpoint', 'choice', 'ending', 'heartbeat', 'exit']);
const string = (value, max) => typeof value === 'string' && value.length > 0 && value.length <= max;
export function validBatch(events, now = Date.now()) {
  return Array.isArray(events) && events.length > 0 && events.length <= 20 && events.every(e =>
    e && ['event_id', 'run_id', 'player_id'].every(key => typeof e[key] === 'string' && UUID.test(e[key])) &&
    string(e.version, 64) && KINDS.has(e.kind) && Number.isInteger(e.seq) && e.seq > 0 && e.seq <= 2147483647 &&
    string(e.scene, 100) && string(e.checkpoint, 200) &&
    (e.line === null || Number.isInteger(e.line) && e.line >= 0 && e.line <= 10000) &&
    (e.choice === null || string(e.choice, 200)) && (e.ending === null || string(e.ending, 100)) &&
    (e.kind !== 'ending' || string(e.ending, 100)) &&
    Number.isInteger(e.active_ms) && e.active_ms >= 0 && e.active_ms <= 604800000 &&
    typeof e.occurred_at === 'string' && Number.isFinite(Date.parse(e.occurred_at)) &&
    Date.parse(e.occurred_at) >= now - 7 * 86400000 && Date.parse(e.occurred_at) <= now + 300000
  );
}

export function cleanBatch(events) {
  const keys = ['event_id','run_id','player_id','version','seq','kind','scene','checkpoint','line','choice','ending','active_ms','occurred_at'];
  return events.map(e => Object.fromEntries(keys.map(key => [key, e[key]])));
}
