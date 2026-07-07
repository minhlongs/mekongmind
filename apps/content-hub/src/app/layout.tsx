import type { Metadata } from "next";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mekong Content Hub",
  description: "AI-powered content management platform",
};

async function NavBar() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center px-4 font-semibold text-gray-900">
              Content Hub
            </Link>
            <div className="flex space-x-1">
              <Link href="/submit" className="inline-flex items-center px-4 text-gray-600 hover:text-gray-900">
                Submit
              </Link>
              <Link href="/audit" className="inline-flex items-center px-4 text-gray-600 hover:text-gray-900">
                Audit
              </Link>
              <Link href="/search" className="inline-flex items-center px-4 text-gray-600 hover:text-gray-900">
                Search
              </Link>
              <Link href="/realtime" className="inline-flex items-center px-4 text-gray-600 hover:text-gray-900">
                Realtime
              </Link>
              <Link href="/analytics" className="inline-flex items-center px-4 text-gray-600 hover:text-gray-900">
                Analytics
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                  {user.user_metadata?.full_name ?? user.email}
                </Link>
                <form
                  action={async () => {
                    "use server";
                    const sup = createServerClient();
                    await sup.auth.signOut();
                  }}
                >
                  <button type="submit" className="text-gray-500 hover:text-red-600">
                    Đăng xuất
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
