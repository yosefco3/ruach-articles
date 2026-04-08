import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Feather } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center px-4">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Feather className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
        <h1 className="font-display font-bold text-6xl text-primary mb-3">404</h1>
        <div className="divider-gold max-w-[120px] mx-auto mb-4" />
        <h2 className="font-display font-bold text-2xl text-foreground mb-2">הדף לא נמצא</h2>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          נראה שהדף שחיפשתם אינו קיים. אולי הכתובת שגויה, או שהדף הוסר.
        </p>
        <Button asChild>
          <Link href="/">חזרה לדף הבית</Link>
        </Button>
      </div>
    </div>
  );
}
