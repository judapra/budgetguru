'use client';

import type { Company } from '@/lib/types';
import { CompanyForm } from './company-form';

interface CompanyHeaderProps {
  userId: string;
  company: Company | null;
}

export function CompanyHeader({ userId, company }: CompanyHeaderProps) {
  
  if (!company) {
    return (
      <CompanyForm userId={userId} />
    )
  }

  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold font-headline">{company.name}</h2>
      <CompanyForm userId={userId} company={company} />
    </div>
  );
}
