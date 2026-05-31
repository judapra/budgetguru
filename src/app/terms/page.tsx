'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
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
            <FileText className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold font-headline">Termos de Uso</CardTitle>
          </div>
          <CardDescription>
            Regras e condições para utilização do aplicativo Budget Guru.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 text-foreground/90 leading-relaxed text-sm">
          <p className="font-semibold text-muted-foreground">
            Última atualização: 29 de maio de 2026
          </p>

          <div className="space-y-2">
            <h3 className="text-lg font-bold font-headline text-foreground">1. Aceitação dos Termos</h3>
            <p>
              Ao baixar ou usar o aplicativo <strong>Budget Guru</strong>, estes termos se aplicarão automaticamente a você. Portanto, certifique-se de lê-los atentamente antes de usar o aplicativo.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold font-headline text-foreground">2. Uso do Aplicativo</h3>
            <p>
              O Budget Guru é uma ferramenta de auxílio ao controle financeiro pessoal. As informações e cálculos fornecidos pelo aplicativo não substituem aconselhamento financeiro, contábil ou legal profissional. O usuário é o único responsável pelas decisões financeiras tomadas com base no uso do app.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold font-headline text-foreground">3. Propriedade Intelectual</h3>
            <p>
              O aplicativo, incluindo todas as marcas registradas, direitos autorais, direitos de banco de dados e outros direitos de propriedade intelectual relacionados, pertence à <strong>Studio Compass</strong>.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold font-headline text-foreground">4. Limitação de Responsabilidade</h3>
            <p>
              O Budget Guru é fornecido "no estado em que se encontra", sem garantias de qualquer tipo. Não nos responsabilizamos por perdas financeiras, erros de inserção de dados ou quaisquer danos diretos ou indiretos decorrentes do uso do aplicativo.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold font-headline text-foreground">5. Alterações nos Termos</h3>
            <p>
              Podemos atualizar nossos Termos e Condições de tempos em tempos. É recomendável que você revise esta página periodicamente para quaisquer alterações.
            </p>
          </div>

          <div className="space-y-2 border-t pt-4">
            <h3 className="text-lg font-bold font-headline text-foreground">6. Contato</h3>
            <p>
              Para qualquer dúvida sobre estes Termos, entre em contato pelo e-mail:{' '}
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
