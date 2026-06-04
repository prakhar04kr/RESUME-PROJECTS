import { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAgeGroup } from "@/hooks/use-age-group";
import { ListSchemesAgeGroup } from "@workspace/api-client-react";

export default function Home() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { setAgeGroup } = useAgeGroup();
  const [age, setAge] = useState<number[]>([25]);

  const getAgeGroup = (age: number): ListSchemesAgeGroup => {
    if (age <= 19) return "teen";
    if (age <= 35) return "youngAdult";
    if (age <= 55) return "middleAge";
    return "senior";
  };

  const getAgeGroupLabel = (group: ListSchemesAgeGroup) => {
    switch(group) {
      case "teen": return "Teen (13-19)";
      case "youngAdult": return "Young Adult (20-35)";
      case "middleAge": return "Middle Age (36-55)";
      case "senior": return "Senior Citizen (56+)";
    }
  };

  const handleContinue = () => {
    const group = getAgeGroup(age[0]);
    setAgeGroup(group);
    setLocation("/schemes");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 bg-muted/30">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            {t('home.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            {t('home.subtitle')}
          </p>
        </div>

        <Card className="border-2 shadow-lg max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{t('home.select_age')}</CardTitle>
            <CardDescription>We'll show you schemes that match your life stage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pb-8">
            <div className="text-6xl font-bold text-primary tabular-nums">
              {age[0]} <span className="text-2xl text-muted-foreground font-medium">years</span>
            </div>
            
            <div className="px-4">
              <Slider
                value={age}
                onValueChange={setAge}
                max={100}
                min={13}
                step={1}
                className="my-8"
              />
            </div>

            <div className="bg-secondary/5 p-4 rounded-lg border border-border">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Your Age Group</div>
              <div className="text-lg font-semibold text-foreground">
                {getAgeGroupLabel(getAgeGroup(age[0]))}
              </div>
            </div>

            <Button size="lg" className="w-full text-lg h-14" onClick={handleContinue}>
              {t('home.continue')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
