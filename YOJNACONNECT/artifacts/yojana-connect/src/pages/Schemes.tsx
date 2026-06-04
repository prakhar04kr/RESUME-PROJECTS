import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { 
  useListSchemes, 
  getListSchemesQueryKey,
  useGetSchemesStats,
  useGetPopularSchemes,
  useListSectors
} from "@workspace/api-client-react";
import { useAgeGroup } from "@/hooks/use-age-group";
import { SchemeCard } from "@/components/SchemeCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, X } from "lucide-react";

export default function Schemes({ isCentralOnly = false }: { isCentralOnly?: boolean }) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { ageGroup } = useAgeGroup();

  useEffect(() => {
    if (!ageGroup && !isCentralOnly) {
      setLocation("/");
    }
  }, [ageGroup, isCentralOnly, setLocation]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sector, setSector] = useState<string>("all");
  const [incomeLimit, setIncomeLimit] = useState<string>("all");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const activeAgeGroup = isCentralOnly ? undefined : ageGroup || undefined;

  const numericIncomeLimit = incomeLimit !== "all" ? parseInt(incomeLimit) : undefined;

  const { data: schemes, isLoading } = useListSchemes({
    ageGroup: activeAgeGroup,
    sector: sector !== "all" ? sector : undefined,
    incomeLimit: numericIncomeLimit,
    isState: isCentralOnly ? false : undefined,
    search: debouncedSearch || undefined,
  });

  const { data: stats } = useGetSchemesStats();
  const { data: popularSchemes } = useGetPopularSchemes({ limit: 3, ageGroup: activeAgeGroup });
  const { data: sectors } = useListSectors({ ageGroup: activeAgeGroup });

  const clearFilters = () => {
    setSearch("");
    setSector("all");
    setIncomeLimit("all");
  };

  console.log("schemes =", schemes);
  console.log("schemes.type =", typeof schemes);
  console.log("schemes.isArray =", Array.isArray(schemes));

  console.log("sectors =", sectors);
  console.log("sectors.type =", typeof sectors);
  console.log("sectors.isArray =", Array.isArray(sectors));

  console.log("popularSchemes =", popularSchemes);
  console.log("popularSchemes.type =", typeof popularSchemes);
  console.log("popularSchemes.isArray =", Array.isArray(popularSchemes));

  console.log("stats =", stats);
  console.log("stats.type =", typeof stats);


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Stats Bar */}
      {!isCentralOnly && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm font-medium text-muted-foreground">{t('schemes.stats.total')}</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.centralSchemes}</div>
              <div className="text-sm font-medium text-muted-foreground">{t('schemes.stats.central')}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.stateSchemes}</div>
              <div className="text-sm font-medium text-muted-foreground">{t('schemes.stats.state')}</div>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/50">
            <CardContent className="p-4 text-center flex flex-col justify-center h-full">
              <div className="text-sm font-medium text-orange-800 dark:text-orange-300">
                {ageGroup === 'teen' ? 'Teen' : ageGroup === 'youngAdult' ? 'Young Adult' : ageGroup === 'middleAge' ? 'Middle Age' : 'Senior'} Focus
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="space-y-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Filter className="w-5 h-5" /> Filters
              </h2>
              { (search || sector !== "all" || incomeLimit !== "all") && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
                  <X className="w-3 h-3 mr-1" /> {t('schemes.filters.clear')}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search schemes..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('schemes.filters.sector')}</label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {sectors?.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t('schemes.filters.income')}</label>
                <Select value={incomeLimit} onValueChange={setIncomeLimit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Income" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('income.any')}</SelectItem>
                    <SelectItem value="100000">{t('income.under1L')}</SelectItem>
                    <SelectItem value="300000">{t('income.1to3L')}</SelectItem>
                    <SelectItem value="800000">{t('income.3to8L')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Popular schemes mini list */}
            {popularSchemes && popularSchemes.length > 0 && !isCentralOnly && (
              <div className="pt-6 border-t">
                <h3 className="text-sm font-bold mb-3">{t('schemes.popular')}</h3>
                <div className="space-y-3">
                  {popularSchemes.map(s => (
                    <a key={s.id} href={`/schemes/${s.id}`} className="block group">
                      <div className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                        {t('i18n.language') === 'hi' && s.nameHindi ? s.nameHindi : s.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{s.ministry}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {isCentralOnly ? t('nav.central') : t('schemes.title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isLoading ? "Loading schemes..." : `Found ${schemes?.length || 0} schemes matching your criteria.`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-[200px] w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : schemes?.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
              <h3 className="text-lg font-bold mb-2">No schemes found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Try adjusting your filters or searching with different keywords to find what you're looking for.
              </p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {schemes?.map(scheme => (
                <SchemeCard key={scheme.id} scheme={scheme} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
