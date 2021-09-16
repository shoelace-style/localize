import fs from 'fs';

// Copy package.json and remove private flag so we can publish from dist
const packageData = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
delete packageData.private;
fs.writeFileSync('./dist/package.json', JSON.stringify(packageData, null, 2), 'utf8');

// Copy readme + license to dist
fs.copyFileSync('./README.md', './dist/README.md');
fs.copyFileSync('./LICENSE.md', './dist/LICENSE.md');
