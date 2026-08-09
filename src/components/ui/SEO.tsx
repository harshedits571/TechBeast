import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  schema?: Record<string, any>;
}

export default function SEO({
  title = "TECH BEAST | Hubli’s Ultimate Tech Destination",
  description = "TECH BEAST: Hubli’s Ultimate Tech Destination for Gaming PCs, Laptops, Desktops, Upgrades & Repairs. Smart technology, honest pricing, and expert support. Built for Performance. Trusted by Hubli.",
  keywords = "tech beast, tech beast hubli, gaming pcs hubli, laptops hubli, desktops, upgrades, computer repairs hubli, second hand laptops",
  canonical = "https://www.techbeasthubli.in/",
  ogImage = "https://www.techbeasthubli.in/logo2.jpeg", // using logo2.jpeg as a fallback OG image
  schema
}: SEOProps) {
  
  // Default Organization Schema
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Tech Beast Hubli",
    "image": "https://www.techbeasthubli.in/logo.png",
    "@id": "https://www.techbeasthubli.in/",
    "url": "https://www.techbeasthubli.in/",
    "telephone": "",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Hubli",
      "addressRegion": "Karnataka",
      "addressCountry": "IN"
    },
    "description": "Hubli’s Ultimate Tech Destination for Gaming PCs, Laptops, Desktops, Upgrades & Repairs. Built for Performance. Trusted by Hubli."
  };

  const finalSchema = schema || defaultSchema;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify(finalSchema)}
      </script>
    </Helmet>
  );
}
