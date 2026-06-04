import { useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { 
  useGetScheme, 
  getGetSchemeQueryKey,
  useRelatedSchemes,
  getRelatedSchemesQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SchemeCard } from "@/components/SchemeCard";
import { Building, Calendar, CheckCircle2, Copy, ExternalLink, FileText, Share2, Info, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";

export default function SchemeDetail() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [, params] = useRoute("/schemes/:id");
  const id = params?.id || "";

  const { data: scheme, isLoading } = useGetScheme(id, { 
    query: { enabled: !!id, queryKey: getGetSchemeQueryKey(id) } 
  });
  
  const { data: relatedSchemes } = useRelatedSchemes(id, {
    query: { enabled: !!id, queryKey: getRelatedSchemesQueryKey(id) }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!scheme) return <div className="text-center py-20">Scheme not found.</div>;

  const isHi = i18n.language === 'hi';
  const title = isHi && scheme.nameHindi ? scheme.nameHindi : scheme.name;

  const handleShareWhatsApp = () => {
    const text = `Check out this government scheme: ${title}\n${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Link has been copied to your clipboard.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header Section */}
      <div className="space-y-6 mb-8">
        <div className="flex flex-wrap gap-2">
          {scheme.isState && scheme.state ? (
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">{scheme.state}</Badge>
          ) : (
            <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">Central Scheme</Badge>
          )}
          {scheme.sectors?.map(s => (
            <Badge key={s} variant="outline">{s}</Badge>
          ))}
        </div>

        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{title}</h1>
          {isHi && scheme.nameHindi && <p className="text-xl text-muted-foreground">{scheme.name}</p>}
          {!isHi && scheme.nameHindi && <p className="text-xl text-muted-foreground">{scheme.nameHindi}</p>}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center text-sm text-muted-foreground pb-6 border-b">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span className="font-medium">{scheme.ministry}</span>
          </div>
          {scheme.deadline && (
            <div className="flex items-center gap-2 text-destructive font-medium">
              <Calendar className="w-4 h-4" />
              <span>{t('detail.deadline')} {new Date(scheme.deadline).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200">
              <Share2 className="w-4 h-4 mr-2" /> WhatsApp
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full flex justify-start overflow-x-auto rounded-none border-b bg-transparent p-0 mb-6 h-auto">
              <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium">
                {t('detail.overview')}
              </TabsTrigger>
              <TabsTrigger value="eligibility" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium">
                {t('detail.eligibility')}
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium">
                {t('detail.documents')}
              </TabsTrigger>
              <TabsTrigger value="apply" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 font-medium">
                {t('detail.apply')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-2 text-primary flex items-center gap-2">
                  <Info className="w-5 h-5" /> Main Benefit
                </h3>
                <p className="text-lg leading-relaxed">{scheme.benefit}</p>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="leading-relaxed text-muted-foreground">{scheme.description}</p>
              </div>
            </TabsContent>

            <TabsContent value="eligibility" className="space-y-4">
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" /> Eligibility Criteria
                </h3>
                <ul className="space-y-4">
                  {(((scheme as any).eligibility ?? []) as any[]).map(
                    (item: any, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 shrink-0 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full p-0.5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    )
                  )}
                </ul>

                {(((scheme as any).income_limit ?? (scheme as any).incomeLimit) ?? 0) !==
                  0 && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                    <div className="font-medium">Maximum Income Limit:</div>
                    <Badge variant="secondary" className="text-sm">
                      ₹
                      {String(
                        ((scheme as any).income_limit ??
                          (scheme as any).incomeLimit) as any
                      )}
                    </Badge>
                  </div>
                )}

              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" /> Required Documents
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(((scheme as any).documents ?? []) as any[]).map(
                    (doc: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium">{doc}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="apply" className="space-y-6">
              <div className="bg-card border rounded-xl p-6">
                <h3 className="font-bold text-xl mb-6">Application Process</h3>
                <div className="prose dark:prose-invert max-w-none mb-8">
                  <p className="whitespace-pre-wrap">
                    {(scheme as any).how_to_apply ?? (scheme as any).howToApply}
                  </p>

                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 gap-2" asChild>
                    <a href={(scheme as any).official_link ?? (scheme as any).officialLink} target="_blank" rel="noopener noreferrer">
                      {t('detail.apply_now')} <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {(((scheme as any).terms_and_conditions ?? (scheme as any).termsAndConditions ?? []) as any[]).length >
            0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="font-bold text-lg mb-4">{t('detail.terms')}</h3>
              <Accordion type="single" collapsible className="w-full">
                {(((scheme as any).terms_and_conditions ??
                  (scheme as any).termsAndConditions ??
                  []) as any[]).map((term: any, i: number) => (
                  <AccordionItem key={i} value={`term-${i}`}>
                    <AccordionTrigger className="text-left font-medium">
                      Term {i + 1}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-sm">
                      {term}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2 text-center">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Official Portal</div>
                <div className="font-semibold line-clamp-2">{scheme.ministry}</div>
              </div>
              <Button className="w-full text-base h-12 gap-2" asChild>
                    <a href={(scheme as any).official_link ?? (scheme as any).officialLink} target="_blank" rel="noopener noreferrer">
                      {t('detail.apply_now')} <ArrowRight className="w-4 h-4" />
                    </a>
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                You will be redirected to the official government website.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" /> Quick Info
              </h3>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Target Age Groups</div>
                  <div className="flex flex-wrap gap-1">
                    {(((scheme as any).age_groups ?? (scheme as any).ageGroups ?? []) as any[]).map(
                      (ag: any) => (
                        <Badge key={ag} variant="secondary" className="text-xs">
                          {ag}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
                {(((scheme as any).categories ?? []) as any[]).length > 0 && (
                  <div>
                    <div className="text-muted-foreground mb-1">Special Categories</div>
                    <div className="flex flex-wrap gap-1">
                      {(((scheme as any).categories ?? []) as any[]).map((c: any) => (
                        <Badge key={c} variant="outline" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Schemes */}
      {relatedSchemes && relatedSchemes.length > 0 && (
        <div className="mt-16 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">{t('detail.related')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedSchemes.map(s => (
              <SchemeCard key={s.id} scheme={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
