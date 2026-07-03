import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.rundog.boston';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    { path: '/', changeFrequency: 'weekly' as const, priority: 1 },
    { path: '/browse', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/register', changeFrequency: 'yearly' as const, priority: 0.8 },
    { path: '/login', changeFrequency: 'yearly' as const, priority: 0.4 },
    { path: '/about', changeFrequency: 'yearly' as const, priority: 0.6 },
    { path: '/contact', changeFrequency: 'yearly' as const, priority: 0.5 },
    { path: '/careers', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/routes/castle-island', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/routes/charles-river', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/routes/boston-common', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/routes/jamaica-pond', changeFrequency: 'monthly' as const, priority: 0.6 },
  ];

  return paths.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
