import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdminSettings() {
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const [siteTitle, setSiteTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");

  useEffect(() => {
    if (settings) {
      setSiteTitle(settings.siteTitle || "");
      setHeroSubtitle(settings.heroSubtitle || "");
    }
  }, [settings]);

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("הגדרות האתר עודכנו בהצלחה");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בעדכון הגדרות");
    },
  });

  const handleSave = () => {
    updateSettings.mutate({ siteTitle, heroSubtitle });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="font-display font-bold text-3xl text-foreground mb-8">הגדרות האתר</h1>

      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">שם האתר</label>
          <Input
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            placeholder="רוּחַ"
            dir="rtl"
            className="text-right"
          />
          <p className="text-xs text-muted-foreground mt-1">שם האתר המוצג בעמוד הבית</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">תיאור בעמוד הבית</label>
          <Textarea
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            placeholder="מרחב לעומק, לשקט ולחיפוש הפנימי — מאמרים ברוחניות, פילוסופיה וריפוי"
            dir="rtl"
            className="text-right resize-none min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground mt-1">השורה מתחת לשם האתר בעמוד הבית</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="gap-2"
          >
            {updateSettings.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            שמור שינויים
          </Button>
        </div>
      </div>
    </div>
  );
}
