import logoImage from "@repo/shared/images/brevpulse_logo.svg";
import Img from "@repo/ui/components/Img";
import { Badge } from "@repo/ui/components/ui/badge";
import { Shield } from "lucide-react";

export default function Navbar() {
  return (
    <header className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <Img src={logoImage} alt="logo" className="w-full max-h-[75px] max-w-[150px]" />
        <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
          <Shield className="h-3.5 w-3.5 mr-1.5" />
          Privacy-First
        </Badge>
      </div>
    </header>
  );
}
