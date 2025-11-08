import WaitlistForm from "./_components/form";
import { Badge } from "@repo/ui/components/ui/badge";
import Img from "@repo/ui/components/Img";
import logoImage from "@repo/shared/images/brevpulse_logo.svg";
import { brevpulseFeatures } from "./_components/consts";
import { DigestTemplate } from "./_components/digest-template";
import Navbar from "./_components/navbar";
import HeroSection from "./_components/hero";
import { Button } from "@repo/ui/components/ui/button";
import { Twitter } from "lucide-react";

export default function WaitlistPage() {
  return (
    <div className="min-h-screen space-y-12.5 px-4">
      <Navbar />
      <HeroSection />

      {/* What Brevpulse Does Section */}
      <section className="container mx-auto py-20 relative rounded-3xl overflow-hidden">
        <div
          className="absolute inset-0 -z-1"
          style={{
            background:
              "radial-gradient(125% 125% at 50% 90%, #fff 40%, #7c3aed 100%)",
          }}
        />
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            What Brevpulse Delivers
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A daily digest that&apos;s more than just a list, it&apos;s your
            productivity command center.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 max-w-6xl p-2.5 mx-auto">
          {brevpulseFeatures.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <Icon className="size-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Example Output */}
      <section className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              This Is What You&apos;ll Get
            </h2>
            <p className="text-xl text-muted-foreground">
              A beautifully crafted email digest that lands in your inbox
              exactly when you need it. We cut through the clutter to bring you
              a summary that&apos;s scannable, actionable, and actually useful.
            </p>
            <p className="text-muted-foreground">
              No more notification fatigue—just pure, prioritized signal. See
              your day at a glance with a unified view, smart summaries, and
              one-click actions that take you right where you need to be.
            </p>
          </div>
          <div className="lg:scale-90 lg:-mr-12">
            <DigestTemplate />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto py-20">
        <div className="max-w-4xl mx-auto text-center bg-card border-2 border-primary/20 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">
            Ready to reclaim your time?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the waitlist for early access. Freemium model, premium features
            coming soon.
          </p>
          <WaitlistForm />
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="px-3 py-1">
              Free Forever
            </Badge>
            <span>•</span>
            <Badge
              variant="outline"
              className="px-3 py-1 border-pro/30 text-pro"
            >
              Pro: $3/mo
            </Badge>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Img
            src={logoImage}
            alt="logo"
            className="w-full max-h-[75px] max-w-[150px]"
          />

          <div className="grid gap-2.5 justify-items-center sm:justify-items-end">
            <p className="text-sm text-muted-foreground">
              © 2025 Brevpulse. Made for busy makers.
            </p>
            <Button size={"icon"}>
              <a href="https://x.com/brevpulse">
                <Twitter className="size-5" />
              </a>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
