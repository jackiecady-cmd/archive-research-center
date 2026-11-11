import { useGetCurrentMembership, useListMembershipPlans } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Shield } from "lucide-react";
import { Link } from "wouter";

const ACCESS_LABEL: Record<string, string> = {
  free: "Signed-in research access",
  paid: "Paid access",
  comp: "Comp access — full archive privileges",
};

export function MembershipPage() {
  const { data: membership, isLoading: memLoading } = useGetCurrentMembership();
  const { data: plans, isLoading: plansLoading } = useListMembershipPlans();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      <header className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-serif text-foreground">Archive Membership</h1>
        <p className="text-muted-foreground">
          Sustain the preservation of historical texts and use the research tools and the translation center. A membership fee does not unlock license-restricted, link-only, or catalogue-only holdings.
        </p>
      </header>

      {/* Current Status */}
      <section>
        {memLoading ? (
          <Skeleton className="h-32 w-full max-w-xl mx-auto rounded-xl" />
        ) : (
          <Card className="max-w-xl mx-auto bg-card border-primary/20 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <div className="text-2xl font-serif capitalize font-medium">{membership?.tier ?? "free"}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {ACCESS_LABEL[membership?.tier ?? "free"] ?? "Signed-in research access"}
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/account">Redeem a comp code</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Plans */}
      <section className="pt-8 border-t border-border">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plansLoading ? (
            <>
              <Skeleton className="h-[400px] rounded-xl" />
              <Skeleton className="h-[400px] rounded-xl" />
            </>
          ) : (
            plans?.map(plan => {
              return (
                <Card key={plan.id} className={`relative flex flex-col ${plan.recommended ? 'border-primary shadow-md' : 'bg-secondary/10 border-border'}`}>
                  {plan.recommended && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      Recommended
                    </div>
                  )}
                  <CardHeader className="text-center pb-4 pt-8">
                    <CardTitle className="text-2xl font-serif">{plan.name}</CardTitle>
                    <div className="mt-4 flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold tracking-tight">${plan.priceUsd}</span>
                      <span className="text-sm font-medium text-muted-foreground">/{plan.billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3 text-sm">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex gap-3 text-foreground/80">
                          <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-4 pb-8 px-8">
                    <Button className="w-full" variant="outline" disabled>
                      Billing is not connected yet
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </section>
      
      <div className="text-center text-xs text-muted-foreground max-w-xl mx-auto pt-8">
        Plans are listed for a future billing provider. They do not turn access on. A comp code, redeemed on your account page, grants every paid privilege until an administrator revokes it.
      </div>
    </div>
  );
}
