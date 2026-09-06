import type { MetadataRoute } from 'next';

/** The app on a home screen: the name, the icon set, the paper (ROUND_9 Task 8). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ExtraLesson',
    short_name: 'ExtraLesson',
    description: 'CSEC Mathematics practice, marked the way an examiner marks.',
    start_url: '/study',
    display: 'standalone',
    background_color: '#FBF7EE',
    theme_color: '#FBF7EE',
    icons: [512, 180, 96, 60, 32].map((px) => ({ src: `/icon-${px}.png`, sizes: `${px}x${px}`, type: 'image/png' })),
  };
}
