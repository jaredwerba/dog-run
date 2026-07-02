export const RP_NAME = 'Go Dogs Boston';

export function getRpId(host: string): string {
  // Strip port, and strip a leading "www." so the passkey relying-party ID is
  // the registrable domain — valid for both www.rundog.boston and rundog.boston
  return host.split(':')[0].replace(/^www\./, '');
}

export function getOrigin(host: string): string {
  const isDev = host.startsWith('localhost') || host.startsWith('127.');
  return isDev ? `http://${host}` : `https://${host}`;
}
