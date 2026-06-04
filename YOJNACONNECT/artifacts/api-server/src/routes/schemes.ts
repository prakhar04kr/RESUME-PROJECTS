import { Router, type IRouter } from "express";
import { db, schemesTable, sectorsTable } from "@workspace/db";
import {
  ListSchemesQueryParams,
  GetPopularSchemesQueryParams,
  GetSchemeParams,
  RelatedSchemesParams,
  ListSectorsQueryParams,
} from "@workspace/api-zod";
import { eq, and, lte, sql, or, ilike } from "drizzle-orm";

const router: IRouter = Router();

// GET /schemes
router.get("/schemes", async (req, res): Promise<void> => {
  const parsed = ListSchemesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { ageGroup, sector, incomeLimit, category, state, search, limit = 50, offset = 0 } = parsed.data;

  // Fix: zod.coerce.boolean("false") === true, so parse the raw string manually
  const isStateRaw = req.query.isState;
  const isState =
    isStateRaw === undefined
      ? undefined
      : isStateRaw === "true" || isStateRaw === "1";

  const allSchemes = await db.select().from(schemesTable);

  let filtered = allSchemes.filter((scheme) => {
    if (ageGroup && !scheme.ageGroups.includes(ageGroup)) return false;
    if (sector && !scheme.sectors.includes(sector)) return false;
    if (incomeLimit != null && scheme.incomeLimit != null && scheme.incomeLimit > incomeLimit) return false;
    if (category && !scheme.categories.includes(category)) return false;
    if (isState != null && scheme.isState !== isState) return false;
    if (state && scheme.state !== state) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !scheme.name.toLowerCase().includes(q) &&
        !scheme.nameHindi.toLowerCase().includes(q) &&
        !scheme.description.toLowerCase().includes(q) &&
        !scheme.benefit.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));
  res.json(paginated);
});

// GET /schemes/popular
router.get("/schemes/popular", async (req, res): Promise<void> => {
  const parsed = GetPopularSchemesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit = 10, ageGroup } = parsed.data;

  const allSchemes = await db.select().from(schemesTable);
  let filtered = allSchemes;

  if (ageGroup) {
    filtered = filtered.filter((s) => s.ageGroups.includes(ageGroup));
  }

  const sorted = filtered.sort((a, b) => b.popularityScore - a.popularityScore);
  res.json(sorted.slice(0, Number(limit)));
});

// GET /schemes/stats
router.get("/schemes/stats", async (_req, res): Promise<void> => {
  const allSchemes = await db.select().from(schemesTable);

  const byAgeGroup: Record<string, number> = {};
  const bySector: Record<string, number> = {};

  for (const scheme of allSchemes) {
    for (const ag of scheme.ageGroups) {
      byAgeGroup[ag] = (byAgeGroup[ag] || 0) + 1;
    }
    for (const sector of scheme.sectors) {
      bySector[sector] = (bySector[sector] || 0) + 1;
    }
  }

  res.json({
    total: allSchemes.length,
    centralSchemes: allSchemes.filter((s) => !s.isState).length,
    stateSchemes: allSchemes.filter((s) => s.isState).length,
    byAgeGroup,
    bySector,
  });
});

// GET /schemes/:id
router.get("/schemes/:id", async (req, res): Promise<void> => {
  const params = RelatedSchemesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [scheme] = await db
    .select()
    .from(schemesTable)
    .where(eq(schemesTable.id, params.data.id));

  if (!scheme) {
    res.status(404).json({ error: "Scheme not found" });
    return;
  }

  res.json(scheme);
});

// GET /schemes/:id/related
router.get("/schemes/:id/related", async (req, res): Promise<void> => {
  const params = RelatedSchemesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [scheme] = await db
    .select()
    .from(schemesTable)
    .where(eq(schemesTable.id, params.data.id));

  if (!scheme) {
    res.status(404).json({ error: "Scheme not found" });
    return;
  }

  const allSchemes = await db
    .select()
    .from(schemesTable);

  const related = allSchemes
    .filter((s) => s.id !== scheme.id)
    .map((s) => {
      let score = 0;
      const sharedAgeGroups = s.ageGroups.filter((ag) => scheme.ageGroups.includes(ag));
      const sharedSectors = s.sectors.filter((sec) => scheme.sectors.includes(sec));
      score += sharedAgeGroups.length * 3;
      score += sharedSectors.length * 5;
      return { scheme: s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.scheme);

  res.json(related);
});

// GET /sectors
router.get("/sectors", async (req, res): Promise<void> => {
  const parsed = ListSectorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { ageGroup } = parsed.data;

  const allSectors = await db.select().from(sectorsTable);

  let filtered = allSectors;
  if (ageGroup) {
    filtered = filtered.filter((s) => s.ageGroups.includes(ageGroup));
  }

  const mapped = filtered.map((s) => ({
    id: s.sectorId,
    name: s.name,
    nameHindi: s.nameHindi,
    ageGroups: s.ageGroups,
    icon: s.icon,
  }));

  res.json(mapped);
});

export default router;
