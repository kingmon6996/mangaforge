export interface PricingTier {
  id: 'free' | 'creator' | 'studio';
  name: string;
  audienceLabel: string;
  monthlyPrice: string;
  annualPrice: string;
  description: string;
  highlighted?: boolean;
  ctaLabel: string;
  features: {
    label: string;
    limit: string;
  }[];
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    audienceLabel: 'For trying your first chapter',
    monthlyPrice: '$0',
    annualPrice: '$0',
    description: 'Explore AI storyboarding, panel editing, and character sheets with starter monthly credits.',
    ctaLabel: 'Start Free',
    features: [
      { label: 'Manga projects', limit: 'Up to 2 active (placeholder)' },
      { label: 'AI generated pages', limit: '12 pages / month (placeholder)' },
      { label: 'Saved character sheets', limit: '3 characters (placeholder)' },
      { label: 'Export resolution', limit: 'Standard PNG / Web PDF' },
      { label: 'Panel editor access', limit: 'Full layout & dialogue tools' },
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    audienceLabel: 'For independent manga authors',
    monthlyPrice: '$24',
    annualPrice: '$19',
    description: 'Built for serialized webtoons and indie chapters requiring consistent casts and print-ready exports.',
    highlighted: true,
    ctaLabel: 'Get Started',
    features: [
      { label: 'Manga projects', limit: 'Unlimited projects (placeholder)' },
      { label: 'AI generated pages', limit: '160 pages / month (placeholder)' },
      { label: 'Saved character sheets', limit: '30 consistent characters (placeholder)' },
      { label: 'Export resolution', limit: '300 DPI Print PDF & PNG' },
      { label: 'AI Director camera controls', limit: 'All 5 cinematic angles + retries' },
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    audienceLabel: 'For publishing teams & studios',
    monthlyPrice: '$79',
    annualPrice: '$64',
    description: 'High-volume chapter production, shared style bibles, and master 600 DPI press exports.',
    ctaLabel: 'Choose Studio',
    features: [
      { label: 'Team seats', limit: 'Up to 5 editors (placeholder)' },
      { label: 'AI generated pages', limit: '600 pages / month (placeholder)' },
      { label: 'Saved character sheets', limit: 'Unlimited studio library (placeholder)' },
      { label: 'Export resolution', limit: '600 DPI CMYK & Grayscale Master' },
      { label: 'Priority queue & API hooks', limit: 'Dedicated generation lane' },
    ],
  },
];
