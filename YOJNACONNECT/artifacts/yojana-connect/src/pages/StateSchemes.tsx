import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function StateSchemes() {
  const { t } = useTranslation();

  const states = [
    "Andhra Pradesh", "Bihar", "Gujarat", "Karnataka", 
    "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", 
    "Rajasthan", "Tamil Nadu", "Uttar Pradesh", "West Bengal"
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl text-center">
      <div className="mb-12 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">{t('state.title')}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('state.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {states.map((state) => (
          <Card key={state} className="relative overflow-hidden border-2 bg-muted/10">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2">
              <div className="bg-background/90 p-2 rounded-full shadow-sm">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                {t('state.coming_soon')}
              </span>
            </div>
            
            <CardContent className="p-8 flex items-center justify-center min-h-[140px]">
              <span className="font-semibold text-lg text-muted-foreground">{state}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-16 max-w-md mx-auto p-6 bg-primary/5 rounded-xl border border-primary/10">
        <h3 className="font-bold text-lg mb-2">Why isn't my state here yet?</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          We are actively working with state governments to integrate their welfare portals and digitize their scheme catalogs. We prioritize accuracy and verified links over speed. Check back soon!
        </p>
      </div>
    </div>
  );
}
