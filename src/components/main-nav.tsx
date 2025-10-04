'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import React from "react"
import { Briefcase, CircleDollarSign } from "lucide-react"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  const personalRoutes = [
    { href: '/expenses', label: 'Despesas Pessoais' },
    { href: '/incomes', label: 'Receitas Pessoais' },
    { href: '/categories', label: 'Categorias Pessoais' },
  ]

  const businessRoutes = [
    { href: '/business/expenses', label: 'Despesas de Negócios' },
    { href: '/business/incomes', label: 'Receitas de Negócios' },
    { href: '/business/categories', label: 'Categorias de Negócios' },
  ]

  return (
    <NavigationMenu className={cn("hidden md:flex", className)} {...props}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href="/" legacyBehavior passHref>
            <NavigationMenuLink active={pathname === '/'} className={navigationMenuTriggerStyle()}>
              Dashboard
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <CircleDollarSign className="mr-2 h-4 w-4" /> Pessoal
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {personalRoutes.map((component) => (
                <ListItem
                  key={component.label}
                  title={component.label}
                  href={component.href}
                >
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
       
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <Briefcase className="mr-2 h-4 w-4" /> Negócios
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
              {businessRoutes.map((component) => (
                <ListItem
                  key={component.label}
                  title={component.label}
                  href={component.href}
                >
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}


const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
