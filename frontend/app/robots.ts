import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neetisaarthi.gov.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/courses',
          '/quiz',
          '/debate',
          '/support',
          '/privacy-policy',
          '/terms',
          '/login',
          '/register',
        ],
        disallow: [
          '/dashboard/',
          '/admin-dashboard/',
          '/admin/',
          '/candidate/',
          '/profile/',
          '/api/',
          '/reset-password',
          '/verify-email',
          '/verify-email-notice',
        ],
      },
    ],
    sitemap: `${siteUrl.replace(/\/+$/, '')}/sitemap.xml`,
  };
}
