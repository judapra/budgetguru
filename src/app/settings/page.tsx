
// src/app/settings/page.tsx
'use client';
import { AppHeader } from "@/components/app-header";
import { UpdateProfileForm } from "@/components/settings/update-profile-form";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Wrench } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { UpdateEmailForm } from "@/components/settings/update-email-form";
import { UpdatePasswordForm } from "@/components/settings/update-password-form";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // We can only allow email/password changes if the user is a password provider
    const isPasswordProvider = user.providerData.some(
        (provider) => provider.providerId === 'password'
    );

    return (
        <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-2xl font-bold font-headline">Configurações da Conta</h1>
                        <p className="text-muted-foreground">Gerencie as informações da sua conta e preferências.</p>
                    </div>
                    <Separator />
                    <UpdateProfileForm />
                    <Separator />
                    
                    {isPasswordProvider ? (
                        <>
                            <UpdateEmailForm />
                            <Separator />
                            <UpdatePasswordForm />
                        </>
                    ) : (
                        <Card className="bg-muted/50 border-dashed">
                            <CardHeader className="flex-row items-center gap-4 space-y-0">
                                <div className="p-2 bg-muted rounded-full">
                                    <Wrench className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <CardTitle className='font-headline'>Gerenciamento de Login</CardTitle>
                                    <CardDescription>
                                        Você está logado com um provedor social.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                 <p className="text-sm text-muted-foreground">
                                    A alteração de e-mail e senha não está disponível, pois seu login é gerenciado através do Google.
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <Separator />
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Informações Legais</CardTitle>
                            <CardDescription>
                                Visualize os termos legais e políticas de privacidade do Budget Guru.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row gap-4">
                            <Button variant="outline" asChild className="flex-1">
                                <Link href="/privacy">
                                    Política de Privacidade
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="flex-1">
                                <Link href="/terms">
                                    Termos de Uso
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Separator />
                    <DeleteAccountSection />
                </div>
            </main>
        </div>
    );
}
