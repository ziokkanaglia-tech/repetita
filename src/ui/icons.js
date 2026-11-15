// Icone a tratto, tutte nello stesso stile.
import { raw } from './dom.js';
const i = (path, extra = '') => raw(`<svg class="ic" viewBox="0 0 24 24" ${extra}>${path}</svg>`);
export const IC = {
  back: i('<path d="M15 5l-7 7 7 7"/>'),
  chev: i('<path d="M9 5l7 7-7 7"/>', 'data-s="chev"'),
  more: i('<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>'),
  x: i('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: i('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  plus: i('<path d="M12 5v14M5 12h14"/>'),
  up: i('<path d="M6 15l6-6 6 6"/>'),
  down: i('<path d="M6 9l6 6 6-6"/>'),
  play: i('<path d="M7 4.5v15l12.5-7.5z"/>', 'data-s="fill"'),
  spark: i('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>'),
  star: on => i('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>', on ? 'data-s="on"' : ''),
  dumbbell: i('<path d="M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12"/>'),
  list: i('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
  clock: i('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  chart: i('<path d="M4 19h16M6 15l4-5 4 3 5-7"/>'),
  user: i('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>'),
  gear: i('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
  edit: i('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>'),
  camera: i('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  trophy: i('<path d="M8 4h8v5a4 4 0 01-8 0zM8 6H5a3 3 0 003 4M16 6h3a3 3 0 01-3 4M12 13v4M9 20h6"/>')
};
