"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border py-3" : "bg-transparent",
      )}
    >
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-serif font-bold text-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
            س
          </div>
          <span className="text-3xl font-serif font-bold tracking-tight text-foreground">سكينة</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-12">
          {["الرئيسية", "الجلسات", "قصتنا", "تواصل معنا"].map((item) => (
            <Link
              key={item}
              href="#"
              className="text-base font-bold text-foreground/60 hover:text-primary transition-colors relative group/item"
            >
              {item}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/30 transition-all group-hover/item:w-full" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/login" className="text-base font-bold text-foreground/70 hover:text-primary transition-colors">
            دخول
          </Link>
          <Link href="/signup" className="btn-primary py-2.5 px-8 text-base shadow-md hover:shadow-lg">
            انضم إلينا
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
          {["الرئيسية", "الجلسات", "قصتنا", "تواصل معنا"].map((item) => (
            <Link key={item} href="#" className="block text-lg font-bold text-foreground">
              {item}
            </Link>
          ))}
          <hr className="border-border" />
          <Link href="/signup" className="block bg-primary text-white text-center py-3 rounded-full font-bold">
            انضم إلينا
          </Link>
        </div>
      )}
    </header>
  )
}
