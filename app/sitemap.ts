import { baseUrl } from '@/lib/base-url';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl();
  // /welcome is deliberately absent: it is a post-payment landing page and is
  // marked noindex, so listing it here would contradict that.
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
