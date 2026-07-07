const TEMPLATE_SLUGS = ['fnb-cloud-kitchen', 'dropship-hub', 'saas-launchpad', 'agency-os', 'creator-economy', 'freelance-stack'];

export function generateStaticParams() {
  return TEMPLATE_SLUGS.map((slug) => ({ slug }));
}

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
