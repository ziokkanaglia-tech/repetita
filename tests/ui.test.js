// Controlli sull'interfaccia senza browser: ogni pulsante ha la sua azione, e l'elenco offline è completo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { html, raw, data, registered } from '../src/ui/dom.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const uiFiles = walk(path.join(root, 'src/ui')).filter(f => f.endsWith('.js'));

test('html`` rende sicuro il testo inserito', () => {
  assert.equal(String(html`<b>${'<script>"x"&'}</b>`), '<b>&lt;script&gt;&quot;x&quot;&amp;</b>');
  assert.equal(String(html`${[html`<i>a</i>`, 'b<']}${null}${false}${0}`), '<i>a</i>b&lt;0');
  assert.equal(String(html`<a ${data({ id: 'a"b', i: 2 })}>${raw('<br>')}</a>`), '<a data-id="a&quot;b" data-i="2"><br></a>');
});

test('ogni pulsante e ogni campo delle schermate ha la sua azione registrata', async () => {
  for (const f of uiFiles) await import(pathToFileURL(f).href);
  const { actions, inputs } = registered();
  const src = uiFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const find = re => [...src.matchAll(re)].map(m => m[1]);
  const usedA = new Set([
    ...find(/data-a="([a-zA-Z.]+)"/g),            // pulsanti scritti nell'HTML
    ...find(/\ba: '([a-zA-Z.]+)'/g),               // voci di menu e attributi costruiti
    ...find(/action: '([a-zA-Z.]+)'/g),            // elenchi di consigli
    ...find(/(?:seg|chips)\('([a-zA-Z.]+)'/g)      // selettori
  ]);
  const usedIn = new Set(find(/data-in="([a-zA-Z.]+)"/g));
  assert.deepEqual([...usedA].filter(a => !actions.includes(a)), [], 'pulsanti senza azione');
  assert.deepEqual([...usedIn].filter(a => !inputs.includes(a)), [], 'campi senza gestione');
  assert.deepEqual(actions.filter(a => !usedA.has(a)), [], 'azioni mai usate');
  assert.deepEqual(inputs.filter(a => !usedIn.has(a)), [], 'gestioni di campi mai usate');
});

test('l\'elenco dei file offline (sw.js) contiene tutti i file dell\'app', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/'((?:src|css|icons)\/[^']+)'/g)].map(m => m[1]));
  const real = ['src', 'css', 'icons'].flatMap(d => walk(path.join(root, d))).map(f => path.relative(root, f).split(path.sep).join('/')).filter(f => !f.endsWith('.DS_Store'));
  assert.deepEqual(real.filter(f => !listed.has(f)), [], 'file mancanti in sw.js');
  assert.deepEqual([...listed].filter(f => !real.includes(f)), [], 'file in sw.js che non esistono');
});
