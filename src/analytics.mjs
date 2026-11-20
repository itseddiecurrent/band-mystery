import { analyticsConfig } from './analytics-config.mjs';

const PREFIX = 'band-mystery.analytics.v1';
const IDLE_MS = 90_000;
const MAX_QUEUE = 300;
const read = (storage, key, fallback) => {
  try { return JSON.parse(storage?.getItem(key)) ?? fallback; } catch { return fallback; }
};
const write = (storage, key, value) => {
  try { storage?.setItem(key, JSON.stringify(value)); } catch { /* Gameplay works without storage. */ }
};

export function checkpointFor(progress) {
  return `${progress.scene}:${progress.dialogue?.id ?? 'investigation'}`;
}

export class PlayAnalytics {
  constructor({ local, session, fetcher, uuid, now = Date.now, config = analyticsConfig } = {}) {
    this.local = local;
    this.session = session;
    this.fetcher = fetcher;
    this.uuid = uuid;
    this.now = now;
    this.config = config;
    this.enabled = read(local, `${PREFIX}.enabled`, true) !== false;
    this.player = read(local, `${PREFIX}.player`, null) ?? uuid();
    write(local, `${PREFIX}.player`, this.player);
    this.queue = read(session, `${PREFIX}.queue`, []);
    if (!Array.isArray(this.queue)) this.queue = [];
    this.queue = this.queue.filter(event => Date.parse(event?.occurred_at) >= now() - 7 * 86400000);
    this.run = null;
    this.playing = false;
    this.visible = true;
    this.lastTick = this.lastInput = now();
  }

  persist() {
    write(this.session, `${PREFIX}.queue`, this.queue);
    if (this.run) write(this.session, `${PREFIX}.run`, this.run);
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    write(this.local, `${PREFIX}.enabled`, this.enabled);
    if (!this.enabled) {
      this.queue = [];
      this.run = null;
      write(this.session, `${PREFIX}.run`, null);
      this.persist();
    }
  }

  begin(game, gameSession, fresh = false) {
    if (!this.enabled) return;
    if (fresh && this.playing) this.stop();
    const stored = read(this.session, `${PREFIX}.run`, null);
    const restored = !fresh && stored?.gameSession === gameSession && stored.version === this.config.version;
    this.run = restored ? stored : {
      id: this.uuid(), gameSession, version: this.config.version, seq: 0,
      active: 0, endings: [], checkpoint: null,
    };
    this.playing = true;
    this.lastTick = this.lastInput = this.now();
    this.progress = game.progress;
    this.emit(restored ? 'resume' : 'start', { choice: !restored && !fresh ? 'existing-save' : null });
    this.update(game);
    void this.flush();
  }

  tick() {
    const time = this.now();
    if (this.playing && this.run && this.visible && !this.progress?.finished) {
      this.run.active += Math.max(0, Math.min(time, this.lastInput + IDLE_MS) - this.lastTick);
    }
    this.lastTick = time;
  }

  touch() { this.tick(); this.lastInput = this.now(); }

  setVisible(visible) {
    this.tick();
    this.visible = visible;
    if (visible) this.lastInput = this.now();
    else { this.emit('heartbeat'); void this.flush(); }
  }

  update(game, action = null) {
    if (!this.run || !this.enabled) return;
    this.tick();
    this.progress = game.progress;
    const checkpoint = checkpointFor(this.progress);
    if (checkpoint !== this.run.checkpoint) {
      this.run.checkpoint = checkpoint;
      this.emit('checkpoint');
    }
    if (action && !['advance', 'forward', 'back', 'rewind', 'dismiss-profiles'].includes(action.type)) {
      const value = action.suspect ?? action.scene ?? action.group ?? action.id ?? action.room;
      this.emit('choice', { choice: action.type + (value ? `:${value}` : '') });
    }
    if (this.progress.finished) {
      const ending = this.progress.endingId ?? 'beta-final-silence';
      if (!this.run.endings.includes(ending)) {
        this.run.endings.push(ending);
        this.emit('ending', { ending });
        void this.flush();
      }
    }
    this.persist();
  }

  emit(kind, extra = {}) {
    if (!this.enabled || !this.run || !this.progress) return;
    this.tick();
    this.queue.push({
      event_id: this.uuid(), run_id: this.run.id, player_id: this.player,
      version: this.run.version, seq: ++this.run.seq, kind,
      scene: this.progress.scene, checkpoint: checkpointFor(this.progress),
      line: this.progress.dialogue?.line ?? null,
      active_ms: Math.round(this.run.active), occurred_at: new Date(this.now()).toISOString(),
      choice: null, ending: null, ...extra,
    });
    // Bound offline storage; preserve starts and endings when trimming heartbeats.
    while (this.queue.length > MAX_QUEUE) {
      const index = this.queue.findIndex(event => !['start', 'ending'].includes(event.kind));
      this.queue.splice(index < 0 ? 0 : index, 1);
    }
    this.persist();
  }

  heartbeat() {
    if (this.playing && this.visible) this.emit('heartbeat');
    void this.flush();
  }

  stop() {
    this.emit('exit');
    this.playing = false;
    void this.flush();
  }

  async flush() {
    if (!this.enabled || this.sending || !this.queue.length || !this.config.endpoint) return;
    this.sending = true;
    try {
      // Retry identical event IDs after network failures; the server deduplicates them.
      for (let batchCount = 0; batchCount < 15 && this.enabled && this.queue.length; batchCount++) {
        const batch = this.queue.slice(0, 20);
        const response = await this.fetcher(this.config.endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: batch }), keepalive: true,
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) break;
        const ids = new Set(batch.map(event => event.event_id));
        this.queue = this.queue.filter(event => !ids.has(event.event_id));
        this.persist();
      }
    } catch { /* Offline/blocked analytics must never interrupt the game. */ }
    finally { this.sending = false; }
  }
}

export function installAnalytics() {
  // Access to browser storage can itself throw (private mode / browser policy).
  let local, session;
  try { local = window.localStorage; } catch {}
  try { session = window.sessionStorage; } catch {}
  const tracker = new PlayAnalytics({
    local, session, fetcher: window.fetch.bind(window), uuid: () => crypto.randomUUID(),
  });
  // Keep developer playthroughs out of beta metrics unless explicitly requested.
  const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const mode = new URLSearchParams(location.search).get('analytics');
  if (mode === 'off' || localHost && mode !== 'on') tracker.enabled = false;
  tracker.visible = document.visibilityState === 'visible';
  for (const type of ['pointerdown', 'keydown', 'pointermove']) {
    document.addEventListener(type, () => tracker.touch(), { passive: true });
  }
  document.addEventListener('visibilitychange', () => tracker.setVisible(document.visibilityState === 'visible'));
  window.addEventListener('pagehide', () => { tracker.emit('heartbeat'); void tracker.flush(); });
  window.addEventListener('online', () => { void tracker.flush(); });
  setInterval(() => tracker.heartbeat(), 30_000);
  void tracker.flush();
  return tracker;
}
