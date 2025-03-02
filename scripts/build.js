const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const AdmZip = require('adm-zip');

const isProduction = process.env.NODE_ENV === 'production';

const pkg = require("../package.json");

const DIST_DIR = 'dist';
const BROWSERS = ['Chrome', 'Firefox'];
const SRC_DIR = 'src';

const excludeFileList = ['__MACOSX', '.DS_Store', 'Thumbs.db'];

const getDistName = (browser) => {
  return `${pkg.namespace}_${browser.toLowerCase()}_${pkg.version}`;
}

const getFileConfig = (filePath) => {
  const targetBrowser = BROWSERS.find(browser => filePath.includes(`/${browser}/`)) || 'Unknown';
  const relativeFilePath = path.relative(path.join(SRC_DIR, targetBrowser), filePath);
  const destBrowserDir = path.join(DIST_DIR, getDistName(targetBrowser));
  const destFilePath = path.join(destBrowserDir, relativeFilePath);

  return { targetBrowser, relativeFilePath, destBrowserDir, srcFilePath: filePath, destFilePath }
}

async function pack() {
  for (const browser of BROWSERS) {
    const zip = new AdmZip();

    const targetBrowserDir = path.join(DIST_DIR, getDistName(browser));
    const files = await fs.readdir(targetBrowserDir, { recursive: true });

    for (const file of files) {
      const filePath = path.join(targetBrowserDir, file);
      const stats = await fs.stat(filePath);

      if (stats.isFile()) {
        const relativeFilePath = path.relative(targetBrowserDir, filePath);
        const fileContent = await fs.readFile(filePath);
        zip.addFile(relativeFilePath, fileContent);
      }
    }

    const distFilePath = path.join(DIST_DIR, `${getDistName(browser)}.zip`);
    zip.writeZip(distFilePath);
    console.log(`Created ${distFilePath}`);
  }
}

async function build() {
  try {
    // Clean dist directory
    await fs.emptyDir(DIST_DIR);

    const files = (await fs.readdir(SRC_DIR, { recursive: true }))
      .filter(file => !excludeFileList.some(excluded => file.includes(excluded)));

    for (const file of files) {
      const srcFilePath = path.join(SRC_DIR, file);
      if ((await fs.stat(srcFilePath)).isFile()) {
        await copyFile(srcFilePath);
      }
    }

    console.log('Initial build completed');

    if (isProduction) {
      await pack();
    }

    // Pack for distribution
  } catch (error) {
    console.error('Build error:', error);
  }
}

async function copyFile(srcFilePath) {
  const { targetBrowser, relativeFilePath, destFilePath } = getFileConfig(srcFilePath);

  if (path.basename(srcFilePath) === 'manifest.json') {
    const manifestJSON = JSON.parse(await fs.readFile(srcFilePath, 'utf8'));

    manifestJSON.version = pkg.version;
    if (isProduction) {
      manifestJSON.name = pkg.namespace;
    }

    await fs.writeFile(destFilePath, JSON.stringify(manifestJSON, null, 2));

    console.log(`Modified and copied manifest.json to ${destFilePath}`);

    return;
  }

  await fs.ensureDir(path.dirname(destFilePath));
  await fs.copy(srcFilePath, destFilePath);

  console.log(`Copied ${relativeFilePath} to ${targetBrowser}`);
}

async function removeFile(srcFilePath) {
  const { targetBrowser, relativeFilePath, destFilePath } = getFileConfig(srcFilePath);

  await fs.remove(destFilePath);

  console.log(`Removed ${relativeFilePath} from ${targetBrowser}`);
}

// Watch for changes
function watchFiles() {
  const watcher = chokidar.watch(SRC_DIR, {
    ignored: [
      /(^|[\/\\])\../, // ignore dotfiles
      '**/.__MACOSX/**',
      '**/.DS_Store',
      '**/Thumbs.db',
    ],
    persistent: true
  });

  watcher
    .on('add', path => copyFile(path))
    .on('change', path => copyFile(path))
    .on('unlink', path => removeFile(path))
    .on('error', error => console.error(`Watcher error: ${error}`));

  console.log('Watching for changes...');
}

async function run() {
  await build();

  // Only watch for changes in development mode
  if (!isProduction) {
    watchFiles();
  }
}

run();