// Grafici disegnati in SVG, senza librerie. I colori arrivano dal tema (css/app.css).
import { html, raw } from './dom.js';
import { fmt, dShort } from '../core/util.js';

export function lineChart(pts, { unit = '' } = {}) {
  if (pts.length < 2) return html`<div class="chart-empty">Servono almeno due rilevazioni per il grafico.</div>`;
  const W = 340, H = 170, L = 36, R = 10, T = 14, B = 22;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs); if (x1 === x0) x1 = x0 + 1;
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = (y1 - y0) * 0.15 || Math.max(1, y1 * 0.1); y0 = Math.max(0, y0 - pad); y1 += pad;
  const X = x => +(L + (x - x0) / (x1 - x0) * (W - L - R)).toFixed(1), Y = y => +(T + (1 - (y - y0) / (y1 - y0)) * (H - T - B)).toFixed(1);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + X(p.x) + ' ' + Y(p.y)).join('');
  const last = pts[pts.length - 1];
  const grid = [0, 1, 2].map(i => { const v = y0 + (y1 - y0) * i / 2, y = Y(v); return `<line class="gl" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text x="${L - 6}" y="${y + 3}" text-anchor="end">${fmt(v, v < 10 ? 1 : 0)}</text>`; }).join('');
  const dots = pts.length <= 30 ? pts.map(p => `<circle class="dot" cx="${X(p.x)}" cy="${Y(p.y)}" r="2.8"/>`).join('') : '';
  return raw(`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Andamento: ultimo valore ${fmt(last.y)} ${unit}">
    <defs><linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop class="st" offset="0" stop-opacity=".28"/><stop class="st" offset="1" stop-opacity="0"/></linearGradient></defs>
    ${grid}<path d="${d}L${X(last.x)} ${H - B}L${X(pts[0].x)} ${H - B}Z" fill="url(#gf)"/><path class="ln" d="${d}"/>${dots}
    <circle class="dot-last" cx="${X(last.x)}" cy="${Y(last.y)}" r="5"/>
    <text x="${L}" y="${H - 6}">${dShort(pts[0].x)}</text><text x="${W - R}" y="${H - 6}" text-anchor="end">${dShort(last.x)}</text>
    <text class="val" x="${W - R}" y="${Math.max(10, Y(last.y) - 10)}" text-anchor="end">${fmt(last.y)} ${unit}</text></svg>`);
}

export function barChart(vals, labels, { compact = false } = {}) {
  const W = 340, H = 140, B = 20, T = 14, n = vals.length, top = Math.max(1, ...vals), bw = (W - 8) / n;
  const bars = vals.map((v, i) => {
    const h = v / top * (H - B - T), x = 4 + i * bw, last = i === n - 1;
    const txt = compact && v >= 1000 ? fmt(v / 1000) + 'k' : fmt(v, 0);
    return `<rect class="b ${last ? 'last' : v ? '' : 'zero'}" x="${(x + bw * 0.18).toFixed(1)}" y="${(H - B - Math.max(h, v ? 2 : 1)).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${Math.max(h, v ? 2 : 1).toFixed(1)}" rx="4"/>`
      + (v ? `<text x="${(x + bw / 2).toFixed(1)}" y="${(H - B - h - 4).toFixed(1)}" text-anchor="middle">${txt}</text>` : '')
      + (i % 3 === 2 || last ? `<text x="${(x + bw / 2).toFixed(1)}" y="${H - 5}" text-anchor="middle">${labels[i]}</text>` : '');
  }).join('');
  return raw(`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${bars}</svg>`);
}

export function hbars(entries) {
  const top = entries.length ? Math.max(...entries.map(e => e[1])) : 1;
  return html`${entries.map(([label, v]) => html`<div class="hbar"><span class="lab">${label}</span><div class="track"><div class="fill" style="width:${(v / top * 100).toFixed(1)}%"></div></div><span class="val">${v}</span></div>`)}`;
}
