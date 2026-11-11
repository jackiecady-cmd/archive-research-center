import { Router } from "express";
import { requireUser } from "../auth/middleware";

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
      "Private discussion rooms",
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
      "Private discussion rooms",
      "Priority Research Concierge",
      "Translation Center (annotate)",
      "Early access to new collections",
      "2 months free vs monthly",
    ],
    recommended: false,
  },
];

router.get("/membership/plans", async (_req, res): Promise<void> => {
  res.json(PLANS);
});

router.get("/membership/current", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  const entitlement = user.entitlement;
  res.json({
    tier: entitlement,
    billingPeriod: null,
    status: entitlement === "free" ? "free" : "active",
    renewsAt: null,
    cancelledAt: null,
  });
});

router.post("/membership/subscribe", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  res.status(501).json({ error: "Billing is not connected yet" });
});

router.post("/membership/cancel", async (req, res): Promise<void> => {
  const user = requireUser(req, res);
  if (!user) return;
  res.status(501).json({ error: "Billing is not connected yet" });
});

export default router;
