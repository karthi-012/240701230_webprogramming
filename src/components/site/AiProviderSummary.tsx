import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2 } from "lucide-react";
import { summarizeProvider } from "@/lib/ai.functions";

type Props = {
  providerId: string;
  name: string;
  category: string;
  headline?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  avgRating?: number | null;
  totalReviews?: number | null;
  reviewComments: string[];
};

export function AiProviderSummary(props: Props) {
  const summarize = useServerFn(summarizeProvider);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ai-summary", props.providerId, props.totalReviews ?? 0],
    queryFn: () => summarize({ data: {
      name: props.name,
      category: props.category,
      headline: props.headline,
      bio: props.bio,
      experienceYears: props.experienceYears,
      avgRating: props.avgRating,
      totalReviews: props.totalReviews,
      reviewComments: props.reviewComments,
    }}),
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  if (isError) return null;

  return (
    <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide">
        <Sparkles className="h-3.5 w-3.5" /> AI summary
      </div>
      <p className="mt-2 text-sm leading-relaxed min-h-[2.5rem]">
        {isLoading ? (
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading reviews…
          </span>
        ) : (
          data?.summary
        )}
      </p>
    </div>
  );
}
