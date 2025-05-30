/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';

import type {InstalledBrowser} from './Cache.js';
import {debug} from './debug.js';
import {
  isLinuxDistroDebianLike,
  isLinux,
  setUserToRoot,
  run,
} from './platform.js';

const debug_log = debug('puppeteer:browsers:install-deps');

export async function installDeps(browser: InstalledBrowser): Promise<void> {
  if (!isLinux()) {
    throw new Error('only Linux are supported');
  }

  if (isLinuxDistroDebianLike()) {
    return await installDebianLikeDeps(browser);
  }

  throw new Error('only Debian-like distributions are supported');
}

export async function installDebianLikeDeps(
  browser: InstalledBrowser,
): Promise<void> {
  setUserToRoot();

  const packageManager = run('apt-get', ['-v']);

  if (packageManager.success) {
    throw new Error('apt-get not found');
  }

  const depsPath = path.join(path.dirname(browser.executablePath), 'deb.deps');

  if (!existsSync(depsPath)) {
    debug_log(`deb.deps file was not found at ${depsPath}`);
    return;
  }

  const deps = readFileSync(depsPath, 'utf-8').split('\n').join(',');

  debug_log(`Trying to install dependencies: ${deps}`);

  const install = run('apt-get', [
    'satisfy',
    '-y',
    deps,
    '--no-install-recommends',
  ]);

  if (!install.success) {
    throw new Error(
      `Failed to install system dependencies: status=${install.status},error=${install.error},stdout=${install.stdout},stderr=${install.stderr}`,
    );
  }

  debug_log(`Installed system dependencies ${deps} successfully`);
}
