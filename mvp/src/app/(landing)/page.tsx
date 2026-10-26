import HeroSection from '@/components/hero-section';
import InteractiveCliShowcase from '@/components/interactive-cli-showcase';
import CSuiteAndRoiSection from '@/components/csuite-and-roi-section';
import PricingSection from '@/components/pricing-section';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <InteractiveCliShowcase />
      <CSuiteAndRoiSection />
      <PricingSection />
    </>
  );
}
