import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { LandingPageConfig } from '../models/landing-page.model';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);

  /**
   * Updates all page SEO tags and structured JSON-LD data for a landing page.
   */
  updateLandingPageSeo(config: LandingPageConfig): void {
    if (!config) return;

    const pageTitle = config.seo?.pageTitle || `${config.lmsName} — Official Learning Portal`;
    const description = config.seo?.metaDescription || `${config.lmsName} Enterprise Learning Academy and Courses`;
    const keywords = config.seo?.metaKeywords?.join(', ') || `${config.lmsName}, LMS, Courses, Training`;
    const ogImage = config.seo?.ogImageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200';
    const canonical = config.seo?.canonicalUrl || (typeof window !== 'undefined' ? window.location.href : '');

    // 1. Standard HTML Head Metadata
    this.title.setTitle(pageTitle);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ name: 'author', content: config.seo?.author || config.lmsName });
    this.meta.updateTag({ name: 'robots', content: 'index, follow' });

    // 2. OpenGraph Protocol Meta Tags
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: config.lmsName });
    if (canonical) {
      this.meta.updateTag({ property: 'og:url', content: canonical });
    }

    // 3. Twitter Card Meta Tags
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    // 4. Schema.org JSON-LD Structured Data
    this.injectJsonLd(config);
  }

  /**
   * Injects or updates Schema.org JSON-LD script in document head
   */
  private injectJsonLd(config: LandingPageConfig): void {
    if (!this.document) return;

    const schemaId = 'landing-page-jsonld';
    let script = this.document.getElementById(schemaId) as HTMLScriptElement | null;

    if (!script) {
      script = this.document.createElement('script');
      script.id = schemaId;
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': config.seo?.schemaType || 'EducationalOrganization',
      'name': config.lmsName,
      'description': config.seo?.metaDescription,
      'url': config.seo?.canonicalUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
      'logo': config.navbar?.logoOverride || '',
      'sameAs': config.footer?.socialLinks?.map(s => s.url) || [],
      'offers': {
        '@type': 'AggregateOffer',
        'category': 'Online Education & Certifications',
        'priceCurrency': 'USD'
      }
    };

    script.text = JSON.stringify(structuredData, null, 2);
  }
}
