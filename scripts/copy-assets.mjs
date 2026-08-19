import { cpSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const copies = [
  ['nodes/Klinky/klinky.svg', 'dist/nodes/Klinky/klinky.svg'],
];

for (const [source, destination] of copies) {
  const targetPath = resolve(destination);
  mkdirSync(dirname(targetPath), { recursive: true });
  cpSync(resolve(source), targetPath);
}
