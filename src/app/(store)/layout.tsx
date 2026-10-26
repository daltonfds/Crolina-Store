import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import BottomNav from "@/components/store/BottomNav";
import CartDrawer from "@/components/store/CartDrawer";
import CookieBanner from "@/components/store/CookieBanner";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-6xl px-4 pb-24 pt-5 md:pb-8">{children}</main>
      <Footer />
      <BottomNav />
      <CartDrawer />
      <CookieBanner />
    </>
  );
}