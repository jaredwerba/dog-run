import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Go Dogs Boston',
    short_name: 'Go Dogs',
    description:
      'Go Dogs Boston matches local runners with high-energy dogs and their owners.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6eedd',
    theme_color: '#2f4f38',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
