interface PageSEO {
  title: string;
  description: string;
  lang: 'tr' | 'en';
  canonicalPath: string;
}

const ORIGIN = 'https://playcambio.com';

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function applyPageSEO({ title, description, lang, canonicalPath }: PageSEO) {
  const url = `${ORIGIN}${canonicalPath}`;
  document.documentElement.lang = lang;
  document.title = title;

  setMeta('name', 'description', description);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'twitter:title', title);
  setMeta('property', 'twitter:description', description);
  setMeta('property', 'twitter:url', url);

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}
