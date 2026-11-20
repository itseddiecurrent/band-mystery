import { scenes } from '/src/content.mjs';

const byId = id => document.getElementById(id);
const number = value => Number(value ?? 0).toLocaleString();
const duration = ms => ms > 0 ? `${Math.round(ms / 60000)} min` : '—';
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function checkpoint(row) {
  const node = element('div', scenes[row.scene]?.label ?? row.scene ?? row.checkpoint);
  node.append(element('span', row.checkpoint, 'checkpoint-id'));
  return node;
}
function table(id, headers, rows, cells) {
  const container = byId(id);
  container.replaceChildren();
  if (!rows.length) { container.append(element('p', 'No activity recorded yet.', 'no-data')); return; }
  const table = element('table');
  const head = element('thead'), header = element('tr');
  for (const label of headers) { const th = element('th', label); th.scope = 'col'; header.append(th); }
  head.append(header);
  const body = element('tbody');
  for (const row of rows) {
    const tr = element('tr');
    for (const value of cells(row)) {
      const td = element('td');
      td.append(value instanceof Node ? value : document.createTextNode(String(value)));
      tr.append(td);
    }
    body.append(tr);
  }
  table.append(head, body); container.append(table);
}
function reach(value) {
  const node = element('div', undefined, 'reach');
  const track = element('div', undefined, 'track');
  const fill = element('span', undefined, 'fill');
  fill.style.width = `${Math.min(100, Math.max(0, value))}%`;
  track.append(fill); node.append(track, element('span', `${value.toFixed(0)}%`));
  return node;
}
function daily(rows) {
  const chart = byId('daily'); chart.replaceChildren();
  if (!rows.length) { chart.append(element('p', 'Daily activity will appear after the first playthrough.', 'no-data')); return; }
  const peak = Math.max(1, ...rows.map(row => row.starts));
  for (const row of rows) {
    const column = element('div', undefined, 'chart-column');
    column.title = `${row.day}: ${row.starts} started, ${row.finishes} finished`;
    column.setAttribute('aria-label', column.title);
    const bars = element('div', undefined, 'bars');
    for (const [value, cls] of [[row.starts, 'bar'], [row.finishes, 'bar blue']]) {
      const bar = element('div', undefined, cls); bar.style.height = `${100 * value / peak}%`; bars.append(bar);
    }
    column.append(bars, element('small', row.day.slice(5))); chart.append(column);
  }
}
let requestId = 0;
async function load() {
  const current = ++requestId;
  byId('refresh').disabled = true;
  byId('error').hidden = true;
  byId('updated').textContent = 'Loading analytics…';
  try {
    const params = new URLSearchParams({ days: byId('days').value, version: byId('version').value });
    const response = await fetch(`/api/stats?${params}`, { signal: AbortSignal.timeout(25_000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Unable to load analytics');
    if (current !== requestId) return;
    const totals = data.totals;
    byId('starts').textContent = number(totals.starts);
    byId('players').textContent = number(totals.players);
    byId('completion').textContent = `${totals.completion_rate}%`;
    byId('finished').textContent = `${number(totals.finished)} of ${number(totals.starts)} runs reached an ending`;
    byId('duration').textContent = duration(totals.median_active_ms);
    byId('finished-duration').textContent = `Finished runs: ${duration(totals.median_finished_ms)} median`;
    byId('inactive').textContent = `${number(totals.inactive)} inactive runs`;
    byId('empty').hidden = totals.starts > 0;
    const selected = byId('version').value;
    byId('version').replaceChildren(new Option('All versions', ''), ...data.versions.map(v => new Option(v.version, v.version)));
    byId('version').value = selected;
    table('stops', ['Last checkpoint', 'Unfinished', 'Inactive'], data.stops, row => [checkpoint(row), number(row.unfinished), number(row.inactive)]);
    table('checkpoints', ['Checkpoint', 'Runs reached', 'Reach'], data.checkpoints, row => [checkpoint(row), number(row.reached), reach(totals.starts ? 100 * row.reached / totals.starts : 0)]);
    table('endings', ['Ending', 'Runs'], data.endings, row => [row.ending === 'beta-final-silence' ? '最终沉默 · Beta ending' : row.ending, number(row.runs)]);
    table('choices', ['Action / choice', 'Runs'], data.choices, row => [row.choice, number(row.runs)]);
    table('versions', ['Version', 'Description', 'Added'], data.versions, row => [row.version, row.description ?? 'Unregistered build', row.created_at ? new Date(row.created_at).toLocaleDateString() : '—']);
    daily(data.daily);
    byId('updated').textContent = `Updated ${new Date(data.as_of).toLocaleTimeString()}`;
  } catch (error) {
    if (current !== requestId) return;
    byId('error').textContent = `${error.message}. Refresh to try again. Existing figures may be out of date.`;
    byId('error').hidden = false;
    byId('updated').textContent = 'Update failed';
  } finally { if (current === requestId) byId('refresh').disabled = false; }
}
byId('filters').onsubmit = event => { event.preventDefault(); void load(); };
byId('days').onchange = byId('version').onchange = () => { void load(); };
void load();
