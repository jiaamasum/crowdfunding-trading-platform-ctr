import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MOCK_PROJECTS } from '../src/lib/mockData';

const outputPath = resolve(process.cwd(), '..', 'backend', 'seed', 'projects.json');
const payload = JSON.stringify(MOCK_PROJECTS, null, 2);

writeFileSync(outputPath, payload);
console.log(`Wrote ${MOCK_PROJECTS.length} projects to ${outputPath}`);
