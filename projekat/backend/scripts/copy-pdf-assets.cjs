const { copyFileSync, mkdirSync } = require('node:fs');
const { dirname, join } = require('node:path');

const fonts = [
  {
    source: '@fontsource/dejavu-sans/files/dejavu-sans-latin-400-normal.woff',
    target: 'dejavu-sans-latin-400-normal.woff',
  },
  {
    source: '@fontsource/dejavu-sans/files/dejavu-sans-latin-700-normal.woff',
    target: 'dejavu-sans-latin-700-normal.woff',
  },
];

for (const font of fonts) {
  const sourcePath = require.resolve(font.source);
  const targetPath = join(__dirname, '..', 'dist', 'shared', 'fonts', font.target);

  mkdirSync(dirname(targetPath), { recursive: true });
  copyFileSync(sourcePath, targetPath);
}
