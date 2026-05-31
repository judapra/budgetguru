'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl flex justify-start mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </div>

      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="border-b bg-muted/20 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold font-headline">Política de Privacidade</CardTitle>
          </div>
          <CardDescription>
            Como protegemos e tratamos suas informações no Budget Guru.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 text-foreground/90 leading-relaxed text-sm">
          <p className="font-semibold text-muted-foreground">
            Data de vigência: 29 de maio de 2026
          </p>

          <p>
            O aplicativo <strong>Budget Guru</strong> está comprometido em proteger a sua privacidade. Esta Política de Privacidade explica como coletamos, usamos e protegemos suas informações quando você utiliza nosso aplicativo.
          </p>

          <div className="space-y-2">
            <h3 className="text-lg font-bold font-headline text-foreground">1. Informações que Coletamos</h3>
            <p>
              Para fornecer nossos serviços de controle financeiro, podemos coletar os dados que você insere voluntariamente no aplicativo, como registros de receitas, despesas e categorias de orçamento.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold font-headline text-foreground">2. Como Usamos Suas Informações</h3>
            <p>Utilizamos as informações coletadas exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fornecer, operar e manter o aplicativo;</li>
              <li>Melhorar, personalizar e expandir nossos serviços;</li>
              <li>Compreender e analisar como você usa o aplicativo.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold font-headline text-foreground">3. Compartilhamento de Dados</h3>
            <p>
              Não vendemos, trocamos ou alugamos suas informações pessoais para terceiros. O aplicativo pode utilizar serviços de terceiros (como provedores de nuvem ou analytics) que possuem suas próprias políticas de privacidade.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold font-headline text-foreground">4. Segurança</h3>
            <p>
              Valorizamos a confiança que você deposita em nós ao fornecer suas informações. Empregamos medidas de segurança comercialmente aceitáveis para protegê-las. No entanto, nenhum método de transmissão pela internet ou armazenamento eletrônico é 100% seguro e confiável.
            </p>
          </div>

          <div className="space-y-2 border-t pt-4">
            <h3 className="text-lg font-bold font-headline text-foreground">5. Contato</h3>
            <p>
              Se você tiver dúvidas ou sugestões sobre nossa Política de Privacidade, não hesite em nos contatar através do e-mail:{' '}
              <a href="mailto:contato@studiocompass.com.br" className="text-primary hover:underline font-medium">
                contato@studiocompass.com.br
              </a>.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Studio Compass. Todos os direitos reservados.
      </div>
    </div>
  );
}
