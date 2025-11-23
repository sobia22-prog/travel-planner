import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Smart Travel Planner | AI-Powered Trip Planning",
  description: "Plan your perfect trip with AI-generated itineraries, budget estimates, and interactive maps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased flex flex-col">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white py-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              {/* Brand Info */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Travel Planner</h3>
                <p className="mt-2 text-sm sm:text-base text-gray-600">
                  Your AI-powered travel companion for planning perfect trips.
                </p>
              </div>

              {/* Explore Links */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Explore</h4>
                <ul className="mt-4 space-y-2 text-sm sm:text-base text-gray-600">
                  <li><a href="/destinations" className="hover:text-blue-600 transition-colors duration-200">Destinations</a></li>
                  <li><a href="/planner" className="hover:text-blue-600 transition-colors duration-200">Trip Planner</a></li>
                  <li><a href="/map" className="hover:text-blue-600 transition-colors duration-200">Interactive Map</a></li>
                </ul>
              </div>

              {/* Account Links */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Account</h4>
                <ul className="mt-4 space-y-2 text-sm sm:text-base text-gray-600">
                  <li><a href="/auth/login" className="hover:text-blue-600 transition-colors duration-200">Login</a></li>
                  <li><a href="/auth/register" className="hover:text-blue-600 transition-colors duration-200">Sign Up</a></li>
                  <li><a href="/trips" className="hover:text-blue-600 transition-colors duration-200">My Trips</a></li>
                </ul>
              </div>

              {/* Powered By */}
              <div>
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Powered By</h4>
                <p className="mt-2 text-sm sm:text-base text-gray-600">
                  Next.js 15 · Strapi V5 · OpenAI · Leaflet
                </p>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-10 border-t border-gray-200 pt-6 text-center text-sm sm:text-base text-gray-600">
              © 2025 Smart Travel Planner. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
