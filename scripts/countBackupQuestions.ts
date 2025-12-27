import * as fs from 'fs';
import * as path from 'path';

const backupDirs = [
  'lib/data/questions/takkengyouhou/_backup_copyrighted',
  'lib/data/questions/minpou/_backup_copyrighted',
  'lib/data/questions/hourei/_backup_copyrighted',
  'lib/data/questions/zeihou/_backup_copyrighted',
];

let totalCount = 0;

for (const dir of backupDirs) {
  const fullPath = path.join(process.cwd(), dir);
  const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.ts'));
  
  let dirCount = 0;
  for (const file of files) {
    const content = fs.readFileSync(path.join(fullPath, file), 'utf-8');
    const matches = content.match(/question:/g);
    if (matches) {
      dirCount += matches.length;
    }
  }
  
  console.log(`${path.basename(path.dirname(fullPath))}: ${dirCount}問`);
  totalCount += dirCount;
}

console.log(`\n合計: ${totalCount}問`);
