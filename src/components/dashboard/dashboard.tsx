'use client';
import { PersonalTab } from "./personal-tab";
import { CompanyTab } from "./company-tab";
import { RealEstateTab } from "./real-estate-tab";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/firebase";
import { CircleDollarSign, Briefcase, Landmark } from "lucide-react";


export function Dashboard() {
  const { user } = useUser();

  const getFirstName = (displayName: string | null | undefined) => {
    if (!displayName) return 'Guru';
    return displayName.split(' ')[0];
  }

  return (
    <div className="space-y-8">
      {user && (
        <h1 className="text-2xl md:text-3xl font-bold font-headline text-foreground">
          Olá, {getFirstName(user.displayName)}!
        </h1>
      )}
      
      <section id="personal-section" className="space-y-4">
        <div className="flex items-center gap-3">
          <CircleDollarSign className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold font-headline">Finanças Pessoais</h2>
        </div>
        <PersonalTab />
      </section>

      <Separator />

      <section id="company-section" className="space-y-4">
         <div className="flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold font-headline">Finanças da Empresa</h2>
        </div>
        <CompanyTab />
      </section>

      <Separator />

      <section id="real-estate-section" className="space-y-4">
         <div className="flex items-center gap-3">
          <Landmark className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold font-headline">Gestão de Imóveis</h2>
        </div>
        <RealEstateTab />
      </section>
    </div>
  );
}
