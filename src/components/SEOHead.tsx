import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
}

const SITE_NAME = 'M-PESA Foundation Academy Reading Challenge';
const BASE_URL = 'https://mfareadingchallenge.netlify.app';

const SEOHead = ({ title, description, path = '' }: SEOHeadProps) => {
  useEffect(() => {
    const fullTitle = `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', `${BASE_URL}${path}`);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.href = `${BASE_URL}${path}`;

    return () => {
      document.title = 'M-PESA Foundation Academy – 45-Book Reading Challenge';
    };
  }, [title, description, path]);

  return null;
};

export default SEOHead;
