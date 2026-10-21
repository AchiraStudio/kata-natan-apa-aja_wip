#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSeedComments, GenerateCommentOptions } from '../src/services/commentGenerator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SeedMetaPost {
  id: string;
  category: string;
  city: string;
  urgency: 'CRITICAL' | 'MEDIUM' | 'LOW/VIBE' | string;
  area: string;
  caption: string;
}

const SEED_POSTS: SeedMetaPost[] = [
  {
    id: 'kn-001',
    category: 'Road Damage & Infrastructure',
    city: 'Bekasi',
    urgency: 'CRITICAL',
    area: 'Jl. Ahmad Yani',
    caption: 'Lubang di depan lampu merah Ahmad Yani makin dalem, tadi ada bapak-bapak hasil kopling di situ.',
  },
  {
    id: 'kn-002',
    category: 'Road Damage & Infrastructure',
    city: 'Depok',
    urgency: 'MEDIUM',
    area: 'Jl. Margonda Raya',
    caption: 'Trotoar Margonda depan ruko itu udah kayak jalur slalom, rebar keluar semua.',
  },
  {
    id: 'kn-003',
    category: 'Road Damage & Infrastructure',
    city: 'North Jakarta',
    urgency: 'CRITICAL',
    area: 'Cilincing',
    caption: 'Lampu jalan Cilincing tinggal segini yang nyala, kabel PLN nongol rendah gini.',
  },
  {
    id: 'kn-004',
    category: 'Road Damage & Infrastructure',
    city: 'South Tangerang',
    urgency: 'LOW/VIBE',
    area: 'BSD City, Serpong',
    caption: 'Salfok lihat petugas cat ulang zebra cross di BSD pagi ini, rapi banget hasilnya.',
  },
  {
    id: 'kn-005',
    category: 'Road Damage & Infrastructure',
    city: 'Bogor',
    urgency: 'MEDIUM',
    area: 'Jl. Raya Pajajaran',
    caption: 'Dinding penahan di Pajajaran mulai ambrol abis hujan semaleman, udah dikasih kerucut.',
  },
  {
    id: 'kn-006',
    category: 'Flooding & Weather',
    city: 'East Jakarta',
    urgency: 'CRITICAL',
    area: 'Kampung Melayu',
    caption: 'Banjir Kampung Melayu udah pinggang, gang dalaman pake perahu aja.',
  },
  {
    id: 'kn-007',
    category: 'Flooding & Weather',
    city: 'South Jakarta',
    urgency: 'MEDIUM',
    area: 'Kemang',
    caption: 'Cuma gerimis bentar tapi Kemang genangan segini, sepatu kebasahan semua.',
  },
  {
    id: 'kn-008',
    category: 'Flooding & Weather',
    city: 'Tangerang',
    urgency: 'CRITICAL',
    area: 'Ciledug',
    caption: 'Gerbang kompleks Ciledug kebanjiran, banyak motor mati harus didorong manual.',
  },
  {
    id: 'kn-009',
    category: 'Flooding & Weather',
    city: 'Bogor',
    urgency: 'LOW/VIBE',
    area: 'Kebun Raya area',
    caption: 'Hujan gejer sekitaran Kebun Raya, pedagang buru-buru nutup gerobak pake terpal.',
  },
  {
    id: 'kn-010',
    category: 'Flooding & Weather',
    city: 'North Jakarta',
    urgency: 'MEDIUM',
    area: 'Pluit coastal road',
    caption: 'Rob mulai naik lagi di tepi laut Pluit, ojol pada pake hpungan.',
  },
];

export function runGeneratorCLI(args: string[] = process.argv.slice(2)) {
  console.log('='.repeat(72));
  console.log(' TITIK Civic Feed - Dynamic Smart Civic Comments Generator');
  console.log('='.repeat(72));

  const shouldDumpJson = args.includes('--dump') || args.includes('--json');
  const countArgIdx = args.indexOf('--count');
  const parsed = countArgIdx !== -1 ? parseInt(args[countArgIdx + 1], 10) : 22;
  const requestedCount = Number.isFinite(parsed) ? parsed : 22;

  const results: Record<string, ReturnType<typeof generateSeedComments>> = {};
  let totalComments = 0;

  SEED_POSTS.forEach((meta) => {
    const opts: GenerateCommentOptions = {
      postId: meta.id,
      category: meta.category,
      city: meta.city,
      urgency: meta.urgency,
      count: requestedCount,
      postCaption: meta.caption,
      locationTag: meta.area,
    };

    const comments = generateSeedComments(opts);
    results[meta.id] = comments;
    totalComments += comments.length;

    const threadedReplies = comments.filter((c) => c.parentId);
    const uniqueAuthors = new Set(comments.map((c) => c.authorName));

    console.log(
      `[${meta.id}] ${meta.city.padEnd(16)} | Comments: ${String(comments.length).padStart(2)} | Threaded: ${threadedReplies.length} | Authors: ${uniqueAuthors.size} | ${meta.category}`
    );
  });

  console.log('-'.repeat(72));
  console.log(`Total Posts: ${SEED_POSTS.length} | Total Comments: ${totalComments}`);

  if (shouldDumpJson) {
    const outPath = path.resolve(__dirname, '../generated/seed-civic-comments.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`[DUMP] Seed comments exported to: ${outPath}`);
  }

  return results;
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('generate-civic-comments.ts')) {
  runGeneratorCLI();
}
