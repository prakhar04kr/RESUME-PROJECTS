import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
          <span className="text-2xl">🇮🇳</span> YojanaConnect
        </Link>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">{t('nav.home')}</Link>
          <Link href="/central-schemes" className="hover:text-foreground transition-colors">{t('nav.central')}</Link>
          <Link href="/state-schemes" className="hover:text-foreground transition-colors">{t('nav.state')}</Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={toggleLanguage} className="font-semibold">
            {i18n.language === 'en' ? 'हिन्दी' : 'English'}
          </Button>
        </div>
      </div>
    </nav>
  );
}
