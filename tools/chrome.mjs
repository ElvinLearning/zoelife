/**
 * Locating and launching Chrome for the CDP-driven tools (qa, qa-forms,
 * build-artifact). Kept in one place so the three cannot drift apart.
 *
 * CHROME_PATH always wins. Otherwise the usual install locations for the
 * current platform are probed, which is what lets the same commands run on a
 * Windows workstation and inside a Linux container.
 */

import { existsSync } from "node:fs";

const CANDIDATES = {
  win32: [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ],
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  linux: [
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ],
};

export function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const found = (CANDIDATES[process.platform] || []).find((p) => existsSync(p));
  return found || CANDIDATES.win32[0];
}

/**
 * Flags every launch shares. Chrome refuses to start as root without
 * --no-sandbox, which is the normal state of affairs in a container; the
 * browser only ever loads 127.0.0.1 here.
 */
export function chromeFlags(port, userDataDir) {
  const asRoot = process.platform === "linux" && process.getuid?.() === 0;
  return [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    ...(asRoot ? ["--no-sandbox"] : []),
    `--remote-debugging-port=${port}`,
    "--user-data-dir=" + userDataDir,
    "about:blank",
  ];
}
