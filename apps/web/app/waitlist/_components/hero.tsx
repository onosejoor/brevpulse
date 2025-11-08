import { Badge } from "@repo/ui/components/ui/badge";
import WaitlistForm from "./form";
import { badgesArray } from "./consts";

export default function HeroSection() {
  return (
    <section className="container relative mx-auto px-4">
      <div
        className="absolute inset-0 -z-1"
        style={{
          backgroundImage: `
        linear-gradient(to right, #d1d5db 1px, transparent 1px),
        linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
      `,
          backgroundSize: "32px 32px",
          WebkitMaskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
          maskImage:
            "radial-gradient(ellipse 60% 60% at 50% 50%, #000 30%, transparent 70%)",
        }}
      />
      <div className="text-center max-w-4xl mx-auto">
        <Badge
          variant="outline"
          className="mb-6 px-4 py-1.5 border-2 border-primary/20 animate-pulse-subtle"
        >
          Launching Soon
        </Badge>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in leading-tight">
          Your Daily Digest,
          <br />
          <span className="text-primary">Actually Smart</span>
        </h1>

        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in leading-relaxed">
          Brevpulse pulls what matters from Gmail, Calendar, Slack, GitHub &
          Figma.
          <span className="font-semibold text-foreground">
            {" "}
            No noise, just insights + actions.
          </span>
        </p>

        <div className="mb-12">
          <WaitlistForm />
        </div>

        {/* Integration Badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {badgesArray.map((badge, index) => (
            <Badge variant={"secondary"} className="px-5 py-1.5" key={index}>
              <badge.icon className="size-5" /> {badge.name}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
