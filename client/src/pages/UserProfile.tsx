import { useRoute } from "wouter";
import { Loader2, MessageSquare, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

export default function UserProfile() {
  const [match, params] = useRoute("/profile/:userId");
  const userId = params?.userId ? parseInt(params.userId) : null;

  const { data: profileData, isLoading } = trpc.profiles.get.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  if (!userId) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">משתמש לא נמצא</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { profile, commentCount } = profileData || {};

  return (
    <div className="container max-w-2xl py-12">
      <div className="bg-card border border-border rounded-xl p-8 mb-8">
        <div className="flex items-start gap-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl text-foreground mb-2">פרופיל משתמש</h1>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>{commentCount || 0} תגובות</span>
              </div>
              {profile?.joinedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    הצטרף {formatDistanceToNow(new Date(profile.joinedAt), { locale: he, addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {profile?.bio && (
          <div className="border-t border-border pt-4">
            <h2 className="text-sm font-medium text-foreground mb-2">אודות</h2>
            <p className="text-foreground text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}
      </div>

      {commentCount === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>משתמש זה עדיין לא הוסיף תגובות</p>
        </div>
      )}
    </div>
  );
}
