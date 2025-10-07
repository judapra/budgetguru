import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PersonalTab } from "./personal-tab";
import { CompanyTab } from "./company-tab";
import { RealEstateTab } from "./real-estate-tab";
import { CircleDollarSign, Briefcase, Landmark } from "lucide-react";

export function Dashboard() {
  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
        <TabsTrigger value="personal" className="font-headline">
          <CircleDollarSign className="mr-2 h-4 w-4" /> Pessoal
        </TabsTrigger>
        <TabsTrigger value="company" className="font-headline">
          <Briefcase className="mr-2 h-4 w-4" /> Empresa
        </TabsTrigger>
        <TabsTrigger value="real-estate" className="font-headline">
          <Landmark className="mr-2 h-4 w-4" /> Imóveis
        </TabsTrigger>
      </TabsList>
      <TabsContent value="personal" className="mt-6">
        <PersonalTab />
      </TabsContent>
      <TabsContent value="company" className="mt-6">
        <CompanyTab />
      </TabsContent>
      <TabsContent value="real-estate" className="mt-6">
        <RealEstateTab />
      </TabsContent>
    </Tabs>
  );
}
