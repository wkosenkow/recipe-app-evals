import { Link } from "react-router-dom";

import Footer from "../components/Footer";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        {/* Silkscreen carries the numeral, the same pixel face the cuisine
            labels and counters use. */}
        <div className="font-pixel text-sm text-neutral-600">404</div>
        <h1 className="m-0 font-heading text-[20px] font-medium text-text">That page doesn&apos;t exist</h1>
        <div className="text-sm text-neutral-500">
          The link may be broken, or the page may have moved.{" "}
          <Link to="/" className="font-semibold">
            Browse recipes
          </Link>
        </div>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}

export default NotFoundPage;
