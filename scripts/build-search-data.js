const fs = require('fs');
const path = require('path');

const versions = ['kjv', 'kjv_ko', 'ko_new', 'ko_old'];
const root = path.join(__dirname, '..', 'bible');
const outputDir = path.join(root, 'search');

fs.mkdirSync(outputDir, { recursive: true });

for (const version of versions) {
  const merged = {};
  let verseCount = 0;

  for (let book = 1; book <= 66; book++) {
    const file = path.join(root, version, `${book}.json`);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    merged[book] = data;

    for (const chapter of Object.values(data)) {
      verseCount += Object.keys(chapter).length;
    }
  }

  const output = path.join(outputDir, `${version}.json`);
  fs.writeFileSync(output, JSON.stringify(merged));
  console.log(`${version}: ${verseCount} verses -> ${output}`);
}
