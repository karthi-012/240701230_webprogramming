import {
  Wrench, Droplets, Zap, Hammer, Car, PaintBucket, Wind, Flame, Sparkles, ChefHat,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Wrench, Droplets, Zap, Hammer, Car, PaintBucket, Wind, Flame, Sparkles, ChefHat,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = map[name] ?? Sparkles;
  return <Icon className={className} />;
}
