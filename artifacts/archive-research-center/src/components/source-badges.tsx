import { Badge } from "@/components/ui/badge";
import { Source } from "@workspace/api-client-react";
import { ShieldCheck, ShieldAlert, ShieldQuestion, Globe, Lock, Coins, FileText, CheckCircle2, Images, Library, Ban, MapPin } from "lucide-react";

export function SourceTypeBadge({ type }: { type: Source['sourceType'] }) {
  const styles = {
    primary: "bg-blue-900/10 text-blue-900 border-blue-900/20 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/20",
    translation: "bg-teal-900/10 text-teal-900 border-teal-900/20 dark:bg-teal-400/10 dark:text-teal-400 dark:border-teal-400/20",
    scholarship: "bg-amber-900/10 text-amber-900 border-amber-900/20 dark:bg-amber-400/10 dark:text-amber-400 dark:border-amber-400/20",
    interpretation: "bg-purple-900/10 text-purple-900 border-purple-900/20 dark:bg-purple-400/10 dark:text-purple-400 dark:border-purple-400/20",
    conclusion: "bg-green-900/10 text-green-900 border-green-900/20 dark:bg-green-400/10 dark:text-green-400 dark:border-green-400/20"
  };

  const labels = {
    primary: "Primary Source",
    translation: "Translation",
    scholarship: "Scholarship",
    interpretation: "Interpretation",
    conclusion: "Conclusion"
  };

  return (
    <Badge variant="outline" className={`font-mono font-medium tracking-tight ${styles[type]}`}>
      {labels[type]}
    </Badge>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: Source['confidence'] }) {
  const styles = {
    high: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
    medium: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.03)_2px,rgba(0,0,0,0.03)_4px)]",
    low: "bg-transparent text-muted-foreground border-dashed",
    uncertain: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 border-dotted"
  };

  const icons = {
    high: <ShieldCheck className="w-3 h-3 mr-1" />,
    medium: <CheckCircle2 className="w-3 h-3 mr-1" />,
    low: <ShieldAlert className="w-3 h-3 mr-1" />,
    uncertain: <ShieldQuestion className="w-3 h-3 mr-1" />
  };

  return (
    <Badge variant="outline" className={`capitalize ${styles[confidence]}`}>
      {icons[confidence]}
      {confidence} Confidence
    </Badge>
  );
}

export function AvailabilityBadge({ availability }: { availability: Source['availability'] }) {
  const icons = {
    public_domain: <Globe className="w-3 h-3 mr-1" />,
    open_access: <FileText className="w-3 h-3 mr-1" />,
    restricted: <Lock className="w-3 h-3 mr-1" />,
    fee_required: <Coins className="w-3 h-3 mr-1" />
  };

  const labels = {
    public_domain: "Public Domain",
    open_access: "Open Access",
    restricted: "Restricted",
    fee_required: "Fee Required"
  };

  return (
    <Badge variant="secondary" className="font-normal text-muted-foreground bg-muted/50 border-transparent">
      {icons[availability]}
      {labels[availability]}
    </Badge>
  );
}

export function RepositoryAccessBadge({
  status,
}: {
  status: NonNullable<Source["repositoryAccessStatus"]>;
}) {
  const icons = {
    digitized: <Images className="w-3 h-3 mr-1" />,
    catalog_only: <Library className="w-3 h-3 mr-1" />,
    restricted: <Ban className="w-3 h-3 mr-1" />,
    physical_access_required: <MapPin className="w-3 h-3 mr-1" />,
  };
  const labels = {
    digitized: "Digitized Manuscript",
    catalog_only: "Catalog Only",
    restricted: "Repository Restricted",
    physical_access_required: "Physical Access Required",
  };

  return (
    <Badge variant="outline" className="font-normal border-primary/25 bg-primary/5 text-foreground">
      {icons[status]}
      {labels[status]}
    </Badge>
  );
}
