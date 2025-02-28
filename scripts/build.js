const chokidar = require('chokidar');
const fs = require('fs-extra');
const path = require('path');
const AdmZip = require('adm-zip');

const BROWSERS = ['chrome', 'firefox'];
const SRC_DIR = 'src';
const DIST_DIR = 'dist';

function getManifestJSON(config, browser, isProduction = false) {
  // Delete developer settings
  delete config.browser_specific_settings;

  const manifest = { ...config };

  if (isProduction) {
    manifest.name = "AutoPurge-Cookie";
  }

  if (browser === 'firefox') {
    manifest.manifest_version = 2;
    manifest.permissions = config.permissions.filter(permission => permission !== 'tabs');
    delete manifest.background.service_worker;
  } else if (browser === 'chrome') {
    manifest.manifest_version = 3;
    manifest.permissions = config.permissions
      .filter(permission => permission !== "<all_urls>")
      .filter(permission => permission !== "<activeTab>");
    manifest.host_permissions = ["<all_urls>"];
    manifest.action = config.browser_action;
    delete manifest.browser_action;
    delete manifest.background.scripts;
  }

  return manifest;
}

function shouldIgnorePath(filePath) {
  const ignoredFiles = ['.DS_Store', 'Thumbs.db'];
  const ignoredDirs = ['__MACOSX'];

  // Check if the file/directory name is in the ignored list
  const fileName = path.basename(filePath);
  if (ignoredFiles.includes(fileName)) return true;

  // Check if any parent directory is in the ignored directories list
  const pathParts = filePath.split(path.sep);
  return pathParts.some(part => ignoredDirs.includes(part));
}

function getOutputDir(browser, version) {
  return path.join(DIST_DIR, `AutoPurge-Cookies_${browser}_${version}`);
}

// Copy a file to all browser directories
async function copyFile(filePath) {
  if (shouldIgnorePath(filePath)) {
    console.log(`Skipping ignored file/directory: ${filePath}`);
    return;
  }

  // First read the manifest to get the version
  const configPath = path.join(SRC_DIR, 'manifest.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  const version = config.version;

  const relativePath = path.relative(SRC_DIR, filePath);

  for (const browser of BROWSERS) {
    const browserDir = getOutputDir(browser, version);
    const destPath = path.join(browserDir, relativePath);

    // Handle manifest.json specially
    if (path.basename(filePath) === 'manifest.json') {
      const currentManifest = JSON.parse(await fs.readFile(filePath, 'utf8'));
      const isProduction = process.env.NODE_ENV === 'production';
      const modifiedManifest = getManifestJSON(currentManifest, browser, isProduction);
      await fs.ensureDir(path.dirname(destPath));
      await fs.writeFile(destPath, JSON.stringify(modifiedManifest, null, 2));
      console.log(`Modified and copied manifest.json to ${destPath}`);
    } else {
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(filePath, destPath);
      console.log(`Copied ${relativePath} to ${browser}`);
    }
  }
}

// Remove a file from all browser directories
async function removeFile(filePath) {
  const configPath = path.join(SRC_DIR, 'manifest.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  const version = config.version;

  const relativePath = path.relative(SRC_DIR, filePath);

  for (const browser of BROWSERS) {
    const browserDir = getOutputDir(browser, version);
    const destPath = path.join(browserDir, relativePath);
    await fs.remove(destPath);
    console.log(`Removed ${relativePath} from ${browser}`);
  }
}

async function zipBrowserBuilds(version) {
  for (const browser of BROWSERS) {
    const zip = new AdmZip();
    const browserDir = getOutputDir(browser, version);

    // Read all files in the browser directory
    const files = await fs.readdir(browserDir, { recursive: true });

    for (const file of files) {
      const filePath = path.join(browserDir, file);
      const stats = await fs.stat(filePath);

      if (stats.isFile()) {
        // Calculate relative path to maintain directory structure
        const relativePath = path.relative(browserDir, filePath);
        const fileContent = await fs.readFile(filePath);
        zip.addFile(relativePath, fileContent);
      }
    }

    const zipPath = path.join(DIST_DIR, `AutoPurge-Cookie_${browser}_${version}.zip`);
    zip.writeZip(zipPath);
    console.log(`Created ${zipPath}`);
  }
}

// Modify the initialBuild function
async function initialBuild(isProduction = false) {
  try {
    // Clean dist directory
    await fs.emptyDir(DIST_DIR);

    // Get version from manifest
    const configPath = path.join(SRC_DIR, 'manifest.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    const version = config.version;

    // Copy all files from src
    const files = await fs.readdir(SRC_DIR, { recursive: true });
    for (const file of files) {
      const filePath = path.join(SRC_DIR, file);
      if ((await fs.stat(filePath)).isFile()) {
        await copyFile(filePath);
      }
    }
    console.log('Initial build completed');

    // Create zip files if in production mode
    if (isProduction) {
      await zipBrowserBuilds(version);
    }
  } catch (error) {
    console.error('Build error:', error);
  }
}

// Watch for changes
function watchFiles() {
  const watcher = chokidar.watch(SRC_DIR, {
    ignored: [
      /(^|[\/\\])\../, // ignore dotfiles
      '**/.__MACOSX/**',
      '**/.DS_Store',
      '**/Thumbs.db'
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

// Modify the run function
async function run() {
  const isProduction = process.env.NODE_ENV === 'production';
  await initialBuild(isProduction);

  // Only watch for changes in development mode
  if (!isProduction) {
    watchFiles();
  }
}

run();