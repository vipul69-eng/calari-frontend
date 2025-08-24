import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Calari - AI Food Tracker',
    short_name: 'Calari',
    description: 'Calari is an AI-powered food tracker that helps you monitor your calorie intake and provides detailed nutritional analysis.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}