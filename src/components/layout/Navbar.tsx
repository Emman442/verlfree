
"use client";

import Link from "next/link";
import { Shield, Bell, Menu, X, User } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Job Verified", description: "Your submission for 'NFT Market' was approved.", time: "2m ago" },
    { id: 2, title: "New Job Posted", description: "A client posted a job matching your skills.", time: "1h ago" },
    { id: 3, title: "Payment Received", description: "450 GEN has been released to your wallet.", time: "3h ago" },
  ]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "How it Works", href: "/#how-it-works" },
    { name: "For Freelancers", href: "/freelancers" },
    { name: "For Clients", href: "/clients" },
    { name: "Leaderboard", href: "/leaderboard" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-navbar py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 10 }}
            className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <Shield className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            VeriFree
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b border-border">
                <h4 className="font-bold">Notifications</h4>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className="p-4 border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-default">
                      <p className="text-sm font-bold">{n.title}</p>
                      <p className="text-xs text-muted-foreground mb-1">{n.description}</p>
                      <p className="text-[10px] text-primary/70">{n.time}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No new notifications
                  </div>
                )}
              </div>
              <div className="p-2 text-center border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs hover:text-primary" 
                  onClick={() => setNotifications([])}
                >
                  Clear all
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {connected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto rounded-full">
                  <Avatar className="w-8 h-8 border border-border">
                    <AvatarImage src="https://picsum.photos/seed/user/100/100" />
                    <AvatarFallback>VF</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">Public Portfolio</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setConnected(false)}>
                  Disconnect Wallet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => setConnected(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6"
            >
              Connect Wallet
            </Button>
          )}

          <button
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-card border-b border-border p-4 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-foreground py-2"
                >
                  {link.name}
                </Link>
              ))}
              {!connected && (
                <Button className="w-full" onClick={() => {
                  setConnected(true);
                  setMobileMenuOpen(false);
                }}>
                  Connect Wallet
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
