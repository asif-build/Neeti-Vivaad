import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_URL = 'https://igotkarmayogi.gov.in/assets/jsonfiles/content-list-data.json';
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDirectory, '../public/data/igot-courses.json');

const response = await fetch(SOURCE_URL);

if (!response.ok) {
  throw new Error(`Unable to download the iGOT catalog (${response.status} ${response.statusText})`);
}

const sourceCatalog = await response.json();
const courses = sourceCatalog.content?.filter((item) => item.primaryCategory === 'Course') ?? [];

if (courses.length === 0) {
  throw new Error('The iGOT catalog did not contain any courses. The local catalog was not replaced.');
}

const identifiers = new Set(courses.map((course) => course.identifier));
if (identifiers.size !== courses.length) {
  throw new Error('The iGOT catalog contains duplicate course identifiers. The local catalog was not replaced.');
}

const catalog = {
  sourceUrl: SOURCE_URL,
  importedAt: new Date().toISOString(),
  count: courses.length,
  courses,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(catalog)}\n`, 'utf8');

console.log(`Imported ${courses.length} iGOT courses into ${outputPath}`);
