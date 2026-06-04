import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scheme } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Building, ShieldCheck, Users } from "lucide-react";

interface SchemeCardProps {
  scheme: Scheme;
}

export function SchemeCard({ scheme }: SchemeCardProps) {
  const { t, i18n } = useTranslation();
  const isHi = i18n.language === 'hi';

  const title = isHi ? scheme.nameHindi || scheme.name : scheme.name;
  const subtitle = isHi ? scheme.name : scheme.nameHindi;

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 flex-none">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="font-bold text-lg leading-tight line-clamp-2" title={title}>{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{subtitle}</p>
            )}
          </div>
          {scheme.popularityScore >= 80 && (
            <Badge variant="secondary" className="shrink-0 bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300">
              Popular
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1" title={scheme.ministry}>{scheme.ministry}</span>
        </div>
        
        <div className="bg-muted/50 p-3 rounded-md text-sm">
          <span className="font-medium text-foreground mb-1 block">{t('scheme.benefit')}:</span>
          <span className="line-clamp-2">{scheme.benefit}</span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {scheme.isState && scheme.state ? (
            <Badge variant="outline" className="text-xs border-primary/20 text-primary">{scheme.state}</Badge>
          ) : (
            <Badge variant="outline" className="text-xs border-primary/20 text-primary">Central</Badge>
          )}
          {scheme.sectors?.slice(0, 2).map(s => (
            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
          ))}
          {scheme.sectors && scheme.sectors.length > 2 && (
            <Badge variant="outline" className="text-xs">+{scheme.sectors.length - 2}</Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-4 border-t flex-none">
        <Link href={`/schemes/${scheme.id}`} className="w-full">
          <Button variant="default" className="w-full group">
            {t('scheme.view_details')}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
