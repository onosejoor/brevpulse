import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { cn } from "@repo/ui/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accentColor?: string;
}

export default function FeatureCard  ({
  icon: Icon,
  title,
  description,
  accentColor = "text-primary",
}: FeatureCardProps)  {
  return (
    <Card
      className={cn(
        "p-6 bg-card border-2 border-border hover:border-primary/50",
        "transition-all hover:shadow-lg hover:scale-105",
        "animate-slide-up"
      )}
    >
      <CardContent>
        <div className={cn("mb-4 p-3 rounded-xl bg-secondary w-fit")}>
          <Icon className={cn("h-6 w-6", accentColor)} />
        </div>
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};
