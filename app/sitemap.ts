import { baseUrl } from '@/lib/base-url';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = baseUrl();
  return [{ url: base, changeFrequency: 'weekly', priority: 1 }];
}
