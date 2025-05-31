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
  run,
  getPackageManager,
  isLinuxDistroFedoraLike,
} from './platform.js';

const debug_log = debug('puppeteer:browsers:install-deps');

export async function installDeps(browser: InstalledBrowser): Promise<void> {
  if (!isLinux()) {
    throw new Error('only Linux are supported for now');
  }

  if (isLinuxDistroDebianLike() || isLinuxDistroFedoraLike()) {
    return await installLinuxDeps(browser);
  }

  throw new Error(
    'only Debian-like and Fedora-Like distributions are supported for now',
  );
}

export async function installLinuxDeps(
  browser: InstalledBrowser,
): Promise<void> {
  const packageManager = getPackageManager();

  if (!packageManager) {
    throw new Error(
      'Failed to install system dependencies: no package manager found',
    );
  }

  const check = run('command', ['-v', packageManager.name]);

  if (!check.success) {
    throw new Error(
      `Failed to install system dependencies: ${packageManager.name} does not seem to be available`,
    );
  }

  const depsPath = path.join(
    path.dirname(browser.executablePath),
    packageManager.deps.file,
  );

  if (!existsSync(depsPath)) {
    throw new Error(
      `Failed to install system dependencies: deps file was not found at ${depsPath}`,
    );
  }

  const deps = packageManager.deps.parse(readFileSync(depsPath, 'utf-8'));

  debug_log(
    `Trying to install with ${packageManager.name} these dependencies : ${deps}`,
  );

  const install = run(packageManager.name, [
    ...packageManager.installCommand,
    deps,
  ]);

  if (!install.success) {
    throw new Error(
      `Failed to install system dependencies: status=${install.status},error=${install.error},stdout=${install.stdout},stderr=${install.stderr}`,
    );
  }

  debug_log(`Installed dependencies ${deps} successfully`);
}
