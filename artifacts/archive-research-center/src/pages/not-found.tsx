import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="h-16 w-16 text-muted-foreground mb-6 opacity-20" />
      <h1 className="text-6xl font-serif font-bold text-foreground mb-4">404</h1>
      <h2 className="text-2xl font-serif text-foreground/80 mb-6">Record Not Found</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
        The manuscript or page you are looking for cannot be located in the archive. It may have been restricted, moved, or incorrectly cataloged.
      </p>
      <Link href="/" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
        Return to the Main Desk
      </Link>
    </div>
  );
}
