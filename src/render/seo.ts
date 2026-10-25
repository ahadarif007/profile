import { education, profile } from '../content/profile';
import { featuredPaper } from '../content/research';
import { site } from '../content/site';
import { html, raw } from './html';

const absolute = (path: string) => new URL(path, site.url).href;

/**
 * Structured data (schema.org JSON-LD) for a personal profile page: who the
 * person is, the site, and the published paper. Built from the content files
 * so it never drifts from what the page says.
 */
function structuredData(): string {
  const person = `${site.url}#person`;
  const [msc, bsc] = education;
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${site.url}#website`,
      url: site.url,
      name: profile.brand,
      description: site.description,
      inLanguage: 'en',
      publisher: { '@id': person },
    },
    {
      '@type': 'ProfilePage',
      '@id': `${site.url}#page`,
      url: site.url,
      name: site.title,
      isPartOf: { '@id': `${site.url}#website` },
      mainEntity: { '@id': person },
    },
    {
      '@type': 'Person',
      '@id': person,
      name: profile.name,
      url: site.url,
      image: absolute(site.image.path),
      email: `mailto:${profile.email}`,
      jobTitle: 'Software Engineer',
      description: site.shareDescription,
      address: { '@type': 'PostalAddress', addressLocality: 'Dublin', addressCountry: 'IE' },
      ...(msc ? { affiliation: { '@type': 'CollegeOrUniversity', name: msc.institution } } : {}),
      ...(bsc ? { alumniOf: { '@type': 'CollegeOrUniversity', name: bsc.institution } } : {}),
      knowsAbout: site.knowsAbout,
      sameAs: profile.links.map((l) => l.href),
    },
    {
      '@type': 'ScholarlyArticle',
      headline: featuredPaper.title,
      datePublished: '2023',
      author: { '@id': person },
      publisher: { '@type': 'Organization', name: 'IEEE' },
      url: featuredPaper.links[0]?.href,
      sameAs: featuredPaper.doi ? `https://doi.org/${featuredPaper.doi}` : undefined,
      identifier: featuredPaper.doi ? { '@type': 'PropertyValue', propertyID: 'DOI', value: featuredPaper.doi } : undefined,
    },
  ];
  // "<" is escaped so the JSON can never close the script tag early.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

/** Title, description, canonical, social cards and structured data for <head>. */
export function renderHead(): string {
  const image = absolute(site.image.path);
  return html`<title>${site.title}</title>
    <meta name="description" content="${site.description}" />
    <meta name="author" content="${profile.name}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${site.url}" />
    <meta property="og:type" content="profile" />
    <meta property="og:site_name" content="${profile.brand}" />
    <meta property="og:locale" content="${site.locale}" />
    <meta property="og:url" content="${site.url}" />
    <meta property="og:title" content="${site.shareTitle}" />
    <meta property="og:description" content="${site.shareDescription}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="${site.image.width}" />
    <meta property="og:image:height" content="${site.image.height}" />
    <meta property="og:image:alt" content="${site.image.alt}" />
    <meta property="profile:first_name" content="Abdul" />
    <meta property="profile:last_name" content="Ahad" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${site.shareTitle}" />
    <meta name="twitter:description" content="${site.shareDescription}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${site.image.alt}" />
    <script type="application/ld+json">${raw(structuredData())}</script>`.value;
}

/** A one-page sitemap, dated at build time, for Google Search Console. */
export function renderSitemap(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site.url}</loc>
    <lastmod>${today}</lastmod>
  </url>
</urlset>
`;
}
