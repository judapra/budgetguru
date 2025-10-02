'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  const routes = [
    { href: '/', label: 'Dashboard', active: pathname === '/' },
    { href: '/expenses', label: 'Despesas', active: pathname === '/expenses' },
    { href: '/incomes', label: 'Receitas', active: pathname === '/incomes' },
    { href: '/categories', label: 'Categorias', active: pathname === '/categories' },
  ]

  return (
    <nav
      className={cn("hidden md:flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            route.active ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  )
}