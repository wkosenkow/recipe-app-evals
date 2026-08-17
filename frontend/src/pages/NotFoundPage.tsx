import { Link } from "react-router-dom";

import Footer from "../components/Footer";
import Header from "../components/Header";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <Header />
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="font-mono text-sm text-gray-600">404</div>
        <div className="text-lg font-semibold text-gray-100">That page doesn&apos;t exist</div>
        <div className="text-sm text-gray-500">
          The link may be broken, or the page may have moved.{" "}
          <Link to="/" className="font-semibold text-blue-400 hover:underline">
            Browse recipes
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default NotFoundPage;
