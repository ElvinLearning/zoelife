/**
 * Build-time integration URLs for Zoe Life.
 *
 * Ordinary builds (no --staging): env vars override; if an env var is absent,
 * keep the existing non-null https value already in js/config.js. A rebuild
 * without env therefore cannot erase the live Apps Script or Google Calendar
 * URLs. FormSubmit is never a default and is never preserved.
 *
 * Staging stays fail-closed when there is nothing to preserve: unset env and
 * no existing https value stay null. Env still overrides when set.
 * Marketplace, giving, and course URLs have no defaults and stay null until
 * supplied.
 */

import { readFileSync } from "node:fs";

export const LIVE_FORM_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbytoV9xN3J79pHvXy67VMONMc8MXwC5vf5DuwdrSyxy8ej0BwUGLe92KMmsjZimQNeu/exec";
export const LIVE_BOOKING_URL = "https://calendar.app.google/Uj9v44HE72kJrKz8A";
export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@zoefamilylife";

export const YOUTUBE_PLAYLISTS = [
  { id: "PL2QfJI8adA_b13X9wl5zwxWDyeO5pCkK2", title: "Conflict Resolution" },
  { id: "PL2QfJI8adA_YXHB-JjLXv7qyP2pbetI0Z", title: "Marriage 101" },
  { id: "PL2QfJI8adA_Zlr6yymbp_MkVfb0tO9cze", title: "Recipes for a Blessed Marriage" },
  { id: "PL2QfJI8adA_YfcMZByFKFitwv59m6iDnP", title: "Recognizing the Right One" },
  {
    id: "PL2QfJI8adA_YOC37FdaYA0rCaTSNbyyk-",
    title: "Dangerous Lies Singles Believe and The Truth that Nullifies Them",
  },
];

export const LIVE_DEFAULTS = {
  formEndpoint: LIVE_FORM_ENDPOINT,
  newsletterEndpoint: LIVE_FORM_ENDPOINT,
  bookingUrl: LIVE_BOOKING_URL,
};

export const PAYMENT_CHANNELS = [
  { key: "amazon", env: (book) => `ZOE_AMAZON_${book.toUpperCase()}_URL` },
  { key: "etsy", env: (book) => `ZOE_ETSY_${book.toUpperCase()}_URL` },
  { key: "gumroad", env: (book) => `ZOE_GUMROAD_${book.toUpperCase()}_URL` },
  { key: "stripe", env: (book) => `ZOE_STRIPE_${book.toUpperCase()}_URL` },
  { key: "paypal", env: (book) => `ZOE_PAYPAL_${book.toUpperCase()}_URL` },
];

export const BOOKS = ["devotional", "journal"];

export function playlistEmbed(id) {
  if (!/^PL[\w-]+$/.test(id)) throw new Error(`Invalid YouTube playlist id: ${id}`);
  return `https://www.youtube-nocookie.com/embed/videoseries?list=${id}`;
}

export function resourceConfig() {
  return {
    channelUrl: YOUTUBE_CHANNEL_URL,
    playlists: YOUTUBE_PLAYLISTS.map((item) => ({
      id: item.id,
      title: item.title,
      embedUrl: playlistEmbed(item.id),
    })),
  };
}

export function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function nonempty(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

export function isFormSubmit(value) {
  return /formsubmit\.co/i.test(String(value || ""));
}

export function httpsOnly(value, name, { invalid = "throw" } = {}) {
  const trimmed = nonempty(value);
  if (!trimmed) return null;

  let url;
  try {
    url = new URL(trimmed);
  } catch {
    if (invalid === "null") return null;
    throw new Error(`${name} is not a valid URL: ${trimmed}`);
  }

  if (url.protocol !== "https:" || url.username || url.password || /[\s<>"']/.test(trimmed)) {
    if (invalid === "null") return null;
    throw new Error(`${name} must be an https URL without credentials or HTML: ${trimmed}`);
  }

  return trimmed;
}

export function loadExistingConfig(configPath) {
  try {
    const text = readFileSync(configPath, "utf8");
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return {};
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return {};
  }
}

/**
 * Env wins when set. Otherwise keep an existing non-null https value.
 * FormSubmit values are dropped, never kept. Staging fail-closed: no env and
 * no existing value → null (skip defaults). Ordinary builds may fall back to
 * the checked-in Apps Script and Google Calendar defaults.
 */
export function pickHttps({ envValue, existingValue, name, failClosed = false, defaultValue = null }) {
  const fromEnv = nonempty(envValue);
  if (fromEnv) {
    if (isFormSubmit(fromEnv)) {
      throw new Error(`${name} must not use FormSubmit. Zoe Life forms use the Google Apps Script endpoint.`);
    }
    return httpsOnly(fromEnv, name);
  }

  const fromExisting = httpsOnly(existingValue, name, { invalid: "null" });
  if (fromExisting && !isFormSubmit(fromExisting)) return fromExisting;

  if (failClosed) return null;
  return httpsOnly(defaultValue, name, { invalid: "null" });
}

function emptyBookPayments() {
  return Object.fromEntries(PAYMENT_CHANNELS.map((ch) => [ch.key, null]));
}

export function resolveBookPayments(book, env, existingBook) {
  const prior = existingBook && typeof existingBook === "object" ? existingBook : {};
  const out = emptyBookPayments();
  for (const channel of PAYMENT_CHANNELS) {
    out[channel.key] = pickHttps({
      envValue: env[channel.env(book)],
      existingValue: prior[channel.key],
      name: channel.env(book),
      failClosed: true,
    });
  }
  return out;
}

export function resolveIntegrations({ env = {}, existing = {}, staging = false } = {}) {
  const failClosed = Boolean(staging);
  const priorGiving = existing.giving && typeof existing.giving === "object" ? existing.giving : {};
  return {
    formEndpoint: pickHttps({
      envValue: env.ZOE_FORM_ENDPOINT,
      existingValue: existing.formEndpoint,
      name: "ZOE_FORM_ENDPOINT",
      failClosed,
      defaultValue: LIVE_DEFAULTS.formEndpoint,
    }),
    newsletterEndpoint: pickHttps({
      envValue: env.ZOE_NEWSLETTER_ENDPOINT,
      existingValue: existing.newsletterEndpoint,
      name: "ZOE_NEWSLETTER_ENDPOINT",
      failClosed,
      defaultValue: LIVE_DEFAULTS.newsletterEndpoint,
    }),
    bookingUrl: pickHttps({
      envValue: env.ZOE_GOOGLE_CALENDAR_BOOKING_URL || env.ZOE_BOOKING_URL,
      existingValue: existing.bookingUrl,
      name: "ZOE_GOOGLE_CALENDAR_BOOKING_URL",
      failClosed,
      defaultValue: LIVE_DEFAULTS.bookingUrl,
    }),
    paidBookingUrl: pickHttps({
      envValue: env.ZOE_PAID_BOOKING_URL,
      existingValue: existing.paidBookingUrl,
      name: "ZOE_PAID_BOOKING_URL",
      failClosed: true,
    }),
    coursesUrl: pickHttps({
      envValue: env.ZOE_COURSES_URL,
      existingValue: existing.coursesUrl,
      name: "ZOE_COURSES_URL",
      failClosed: true,
    }),
    giving: {
      stripe: pickHttps({
        envValue: env.ZOE_GIVING_STRIPE_URL,
        existingValue: priorGiving.stripe,
        name: "ZOE_GIVING_STRIPE_URL",
        failClosed: true,
      }),
      paypal: pickHttps({
        envValue: env.ZOE_GIVING_PAYPAL_URL,
        existingValue: priorGiving.paypal,
        name: "ZOE_GIVING_PAYPAL_URL",
        failClosed: true,
      }),
    },
    payments: {
      devotional: resolveBookPayments("devotional", env, existing.payments?.devotional),
      journal: resolveBookPayments("journal", env, existing.payments?.journal),
    },
    resources: resourceConfig(),
  };
}
