// Regenerates src/data/chunks.json from src/data/schemes.json. Run after editing schemes:
//   npx tsx scripts/build-chunks.ts
// A test fails if chunks.json is out of date.
import { writeFileSync } from 'node:fs';
import { buildChunks } from '../src/data/buildChunks';
import schemes from '../src/data/schemes.json';
import type { Scheme } from '../src/engine/types';

const chunks = buildChunks(schemes as unknown as Scheme[]);
writeFileSync(new URL('../src/data/chunks.json', import.meta.url), JSON.stringify(chunks, null, 2) + '\n');
console.log(`chunks.json: ${chunks.length} chunks`);
