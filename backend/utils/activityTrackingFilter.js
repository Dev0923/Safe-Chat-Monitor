const NON_WEB_PROTOCOLS = new Set([
  'about:',
  'blob:',
  'chrome:',
  'chrome-extension:',
  'data:',
  'devtools:',
  'edge:',
  'file:',
  'javascript:',
  'moz-extension:',
]);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);
const LOCAL_APP_PORTS = new Set(['3000', '4173', '5173', '8080']);

export const INTERNAL_TRACKING_DOMAINS = Object.freeze(Array.from(LOCAL_HOSTS));

const normalizeOriginKey = (origin) => {
  try {
    const parsed = new URL(origin);
    const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
    return `${parsed.hostname.toLowerCase()}:${port}`;
  } catch {
    return null;
  }
};

const getFirstPartyOriginKeys = () => {
  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaults = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
  ];

  return new Set(
    [...configuredOrigins, ...defaults]
      .map(normalizeOriginKey)
      .filter(Boolean)
  );
};

/**
 * Returns true when a URL should be ignored for child browsing telemetry.
 * This prevents first-party dashboard pages (typically parent usage) from
 * polluting child activity logs.
 */
export const shouldSkipActivityTracking = (rawUrl) => {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return true;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return true;
  }

  const protocol = parsedUrl.protocol.toLowerCase();
  if (NON_WEB_PROTOCOLS.has(protocol)) {
    return true;
  }

  if (protocol !== 'http:' && protocol !== 'https:') {
    return true;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const port = parsedUrl.port || (protocol === 'https:' ? '443' : '80');
  const originKey = `${hostname}:${port}`;

  if (LOCAL_HOSTS.has(hostname) && LOCAL_APP_PORTS.has(port)) {
    return true;
  }

  const firstPartyOriginKeys = getFirstPartyOriginKeys();
  if (firstPartyOriginKeys.has(originKey)) {
    return true;
  }

  return false;
};
