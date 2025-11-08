"use client";

import { useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Mail } from "lucide-react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");

  return (
    <form
      method="POST"
      action={"https://app.proforms.top/f/pr104a2c81"}
      className="w-full max-w-md mx-auto"
    >
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12 text-base bg-card border-2 focus:border-primary transition-colors"
          />
        </div>
        <Button
          disabled={!email}
          type="submit"
          size="lg"
          className="h-12 px-8 text-base font-semibold bg-primary hover:bg-primary/90 transition-all hover:scale-105"
        >
          Join Waitlist
        </Button>
      </div>
      <p className="text-sm text-muted-foreground text-center mt-3">
        Join early adopters, to recieve an instant mail once we launch.
      </p>
    </form>
  );
}
