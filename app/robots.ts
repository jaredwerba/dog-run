import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.rundog.boston';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard', '/runs', '/messages', '/profile/', '/p/'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
