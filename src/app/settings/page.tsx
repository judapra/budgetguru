
// src/app/settings/page.tsx
'use client';
import { AppHeader } from "@/components/app-header";
import { UpdateProfileForm } from "@/components/settings/update-profile-form";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { UpdateEmailForm } from "@/components/settings/update-email-form";
import { UpdatePasswordForm } from "@/components/settings/update-password-form";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";

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
                    <UpdateEmailForm />
                    <Separator />
                    <UpdatePasswordForm />
                    <Separator />
                    <DeleteAccountSection />
                </div>
            </main>
        </div>
    );
}
