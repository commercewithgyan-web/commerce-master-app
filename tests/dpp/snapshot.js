#!/usr/bin/env node
/**
 * Golden snapshot runner for DPP HTML.
 *   node tests/dpp/snapshot.js            compare against saved snapshots
 *   node tests/dpp/snapshot.js --update   rewrite snapshots (intentional change)
 *   node tests/dpp/snapshot.js --out DIR  also write full HTML previews to DIR
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { makeSandbox, collectFixtures, render } = require('./harness');

const SNAP_DIR = path.join(__dirname, '__snapshots__');
const args = process.argv.slice(2);
const update = args.includes('--update');
const outIdx = args.indexOf('--out');
const outDir = outIdx !== -1 ? args[outIdx + 1] : null;

const sb = makeSandbox();
const fixtures = collectFixtures(sb);
if (!fs.existsSync(SNAP_DIR)) fs.mkdirSync(SNAP_DIR, { recursive: true });
if (outDir && !fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let changed = 0, created = 0, same = 0;
for (const fx of fixtures) {
  for (const side of ['q', 'a']) {
    const res = render(sb, fx.data, side === 'a');
    const file = path.join(SNAP_DIR, fx.name + '.' + side + '.html');
    if (outDir) fs.writeFileSync(path.join(outDir, fx.name + '.' + side + '.html'), res.html);
    if (!fs.existsSync(file) || update) {
      if (!fs.existsSync(file)) created++; else if (fs.readFileSync(file, 'utf8') !== res.html) changed++; else same++;
      fs.writeFileSync(file, res.html);
      continue;
    }
    if (fs.readFileSync(file, 'utf8') === res.html) same++;
    else { changed++; console.log('CHANGED  ' + fx.name + '.' + side + ' (pages=' + res.pageCount + ')'); }
  }
}
console.log(`snapshots: ${same} same, ${changed} changed, ${created} created${update ? ' (updated)' : ''}`);
if (!update && changed) process.exit(1);
