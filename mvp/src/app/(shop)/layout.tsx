import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
