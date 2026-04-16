export const RP_NAME = 'Dog Run';
export const RP_ID =
  process.env.NODE_ENV === 'production'
    ? (process.env.RP_ID ?? 'dog-run-woad.vercel.app')
    : 'localhost';
export const ORIGIN =
  process.env.NODE_ENV === 'production'
    ? `https://${RP_ID}`
    : 'http://localhost:3000';
