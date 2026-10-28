import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(__dirname, '../..');

/** Concatenated source of ProfileView.tsx and every file under components/profile. */
export function readProfileFeatureSource(): string {
  const dir = path.join(SRC, 'components/profile');
  const files = [path.join(SRC, 'views/ProfileView.tsx')].concat(
    fs.readdirSync(dir).map((f) => path.join(dir, f))
  );
  return files.map((f) => fs.readFileSync(f, 'utf8')).join('\n').replace(/\r\n/g, '\n');
}
