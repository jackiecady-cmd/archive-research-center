import { Router } from "express";
import { requireUser } from "../auth/middleware";

const router = Router();

// Unpriced descriptions of the service. They do not unlock license-restricted, link-only, or catalogue-only holdings.
const PLANS = [
  {
    id: "researcher",
    name: "Researcher",
    features: [
      "Archive search",
      "Up to 5 Research Projects",
      "Claim Cards and evidence trails",
      "Research Commons participation",
      "Translation Center (read)",
    ],
    recommended: false,
  },
  {
    id: "scholar",
    name: "Scholar",
    features: [
      "Everything in Researcher",
      "Unlimited Research Projects",
      "Private discussion rooms",
      "Priority Research Concierge",
      "Translation Center (annotate)",
    ],
    recommended: true,
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
