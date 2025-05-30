/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import os from 'node:os';

export function isLinux(): boolean {
  return os.platform() === 'linux';
}

export function isMac(): boolean {
  return os.platform() === 'darwin';
}

export function isWindows(): boolean {
  return os.platform() === 'win32';
}

/*
 * Check if the current Linux distribution is like the given one.
 * @param distro - The name of the distribution to check for.
 * @returns true if the distribution is like the given one, false otherwise.
 */
export function isLinuxDistroLike(distro: string): boolean {
  const regex = new RegExp(
    `(ID_LIKE)|(ID)="?[^"\n]*${distro}\\b[^"\n]*"`,
    'gm',
  );

  try {
    const osRelease = readFileSync('/etc/os-release', 'utf-8');
    return regex.test(osRelease);
  } catch {
    return false;
  }
}

/*
 * Check if the current Linux distribution is Debian-like.
 */
export function isLinuxDistroDebianLike(): boolean {
  return isLinuxDistroLike('debian');
}

/*
 * Check if the current Linux distribution is Fedora-like.
 */
export function isLinuxDistroFedoraLike(): boolean {
  return isLinuxDistroLike('fedora');
}

export type PackageManager = {name: string; installCommand: string[]};

export function getPackageManager(): PackageManager | undefined {
  if (isLinuxDistroDebianLike()) {
    return {name: 'apt', installCommand: ['apt-get', 'install']};
  } else if (isLinuxDistroFedoraLike()) {
    return {name: 'dnf', installCommand: ['dnf', 'install']};
  }

  return undefined;
}

export function setUserToRoot(): void {
  if (process.getuid?.() !== 0) {
    return;
  }

  try {
    process.setuid?.(0);
  } catch {
    throw new Error('Installing system dependencies requires root privileges');
  }
}

export function run(
  command: string,
  args: string[],
): {
  error: Error | undefined;
  status: number | null;
  stderr: string;
  stdout: string;
  success: boolean;
} {
  const result = spawnSync(command, args);

  return {
    error: result.error,
    status: result.status,
    stderr: result.stderr.toString('utf8'),
    stdout: result.stdout.toString('utf8'),
    success: result.status === 0,
  };
}
