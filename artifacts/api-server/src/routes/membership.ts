import { Router } from "express";

const router = Router();

const PLANS = [
  {
    id: "researcher-monthly",
    name: "Researcher",
    billingPeriod: "monthly",
    priceUsd: 9.99,
    features: [
      "Full archive search access",
      "Up to 5 Research Projects",
      "Claim Cards & evidence trails",
      "Research Commons participation",
      "Translation Center (read)",
    ],
    recommended: false,
  },
  {
    id: "scholar-monthly",
    name: "Scholar",
    billingPeriod: "monthly",
    priceUsd: 19.99,
    features: [
      "Everything in Researcher",
      "Unlimited Research Projects",
      "Genealogy & DNA pathway",
      "Priority Research Concierge",
      "Translation Center (annotate)",
      "Early access to new collections",
    ],
    recommended: true,
  },
  {
    id: "researcher-annual",
    name: "Researcher (Annual)",
    billingPeriod: "annual",
    priceUsd: 99.99,
    features: [
      "Full archive search access",
      "Up to 5 Research Projects",
      "Claim Cards & evidence trails",
      "Research Commons participation",
      "Translation Center (read)",
      "2 months free vs monthly",
    ],
    recommended: false,
  },
  {
    id: "scholar-annual",
    name: "Scholar (Annual)",
    billingPeriod: "annual",
    priceUsd: 199.99,
    features: [
      "Everything in Researcher",
      "Unlimited Research Projects",
      "Genealogy & DNA pathway",
      "Priority Research Concierge",
      "Translation Center (annotate)",
      "Early access to new collections",
      "2 months free vs monthly",
    ],
    recommended: false,
  },
];

// GET /membership/plans
router.get("/membership/plans", async (_req, res): Promise<void> => {
  res.json(PLANS);
});

// GET /membership/current
router.get("/membership/current", async (_req, res): Promise<void> => {
  // Return free tier for now; real auth would look up the user
  res.json({ tier: "free", billingPeriod: null, status: "free", renewsAt: null, cancelledAt: null });
});

// POST /membership/subscribe
router.post("/membership/subscribe", async (req, res): Promise<void> => {
  const { planId } = req.body;
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) { res.status(400).json({ error: "Invalid planId" }); return; }
  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + (plan.billingPeriod === "annual" ? 12 : 1));
  res.json({ tier: plan.name, billingPeriod: plan.billingPeriod, status: "active", renewsAt: renewsAt.toISOString(), cancelledAt: null });
});

// POST /membership/cancel
router.post("/membership/cancel", async (_req, res): Promise<void> => {
  res.json({ tier: "free", billingPeriod: null, status: "cancelled", renewsAt: null, cancelledAt: new Date().toISOString() });
});

export default router;
