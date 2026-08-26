import fs from 'node:fs';
import path from 'node:path';

const expectedTypeScript = '6.0.3';
const manifests = [
  'package.json',
  'apps/api/package.json',
  'apps/web/package.json',
  'packages/domain/package.json',
  'packages/application/package.json',
  'packages/database/package.json',
];

let failed = false;

for (const manifest of manifests) {
  const json = JSON.parse(fs.readFileSync(path.resolve(manifest), 'utf8'));
  const declared = json.devDependencies?.typescript ?? json.dependencies?.typescript;
  if (declared && declared !== expectedTypeScript) {
    console.error(`${manifest}: expected TypeScript ${expectedTypeScript}, found ${declared}`);
    failed = true;
  }
}

const root = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (root.pnpm?.overrides?.typescript !== expectedTypeScript) {
  console.error('package.json: pnpm override for TypeScript is missing or incorrect');
  failed = true;
}

if (failed) process.exit(1);
console.log(`Version guard OK — TypeScript is pinned to ${expectedTypeScript}.`);
