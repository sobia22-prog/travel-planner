"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { getUser, clearAuth } from "@/lib/auth";
import { FaSignOutAlt, FaChevronDown, FaPlane } from "react-icons/fa";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState(getUser());
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname(); 

  useEffect(() => {
    setIsClient(true);
    setUser(getUser());

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setDropdownOpen(false);
    window.location.href = "/";
  };

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Destinations", href: "/destinations" },
    { label: "Trip Planner", href: "/planner" },
    // { label: "Map", href: "/map" },
    ...(isClient && user ? [{ label: "My Trips", href: "/trips" }] : []),
  ];

  return (
    <header className="sticky top-0 z-[100] w-full backdrop-blur-xl bg-white/80 border-b border-gray-100 shadow-md">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-2xl flex items-center justify-center 
              bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg 
              group-hover:scale-105 transition-transform duration-300">
              <FaPlane className="text-[15px]" />
            </div>
            <span className="text-2xl font-semibold tracking-tight bg-gradient-to-r 
              from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Travel Planner
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <Link
  key={index}
  href={item.href}
  className={`rounded-xl text-[15px] font-medium transition-all duration-200
    ${isActive 
      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md p-4" 
      : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 hover:shadow-sm"
    }`}
>
  {item.label}
</Link>

              );
            })}
          </nav>

          {/* Auth / User */}
          <div className="flex items-center gap-4">
            {isClient && user ? (
              <div ref={dropdownRef} className="relative">
                {/* User button */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border 
                    border-gray-200 bg-white/80 backdrop-blur-sm 
                    hover:bg-white/90 transition-all shadow-sm"
                >
                  <div className="h-8 w-8 flex items-center justify-center rounded-full
                    bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>

                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.username}
                  </span>

                  <FaChevronDown
                    className={`text-xs text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-xl 
                    border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    
                    <div className="px-4 pb-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>

                    {user.role && (
                      <div className="px-4 py-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium
                          bg-blue-100 text-blue-700">
                          {user.role.name}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm 
                      text-gray-700 hover:bg-red-50 hover:text-red-600
                      transition-all"
                    >
                      <FaSignOutAlt className="text-xs" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
                >
                  Login
                </Link>

                <Link
                  href="/auth/register"
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-md
                    bg-gradient-to-r from-blue-600 to-cyan-500
                    hover:from-blue-700 hover:to-cyan-600 
                    transition-all hover:shadow-lg hover:scale-[1.04]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
