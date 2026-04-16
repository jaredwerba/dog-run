export const RP_NAME = 'Dog Run';

export function getRpId(host: string): string {
  // Strip port if present
  return host.split(':')[0];
}

export function getOrigin(host: string): string {
  const isDev = host.startsWith('localhost') || host.startsWith('127.');
  return isDev ? `http://${host}` : `https://${host}`;
}
