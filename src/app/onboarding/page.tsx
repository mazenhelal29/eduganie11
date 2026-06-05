import { OnboardingForm } from "@/features/auth/components/OnboardingForm";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export default function OnboardingPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:px-0 bg-muted/30">
      <div className="absolute right-4 top-4 md:right-8 md:top-8 z-50">
        <LanguageSwitcher />
      </div>
      <div className="p-8">
        <OnboardingForm />
      </div>
    </div>
  );
}
