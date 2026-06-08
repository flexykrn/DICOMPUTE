// Type declarations for lucide-react to fix missing icon exports
// These icons exist at runtime but TypeScript definitions are incomplete

declare module "lucide-react" {
  import * as React from "react";
  
  interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  }
  
  type Icon = React.ForwardRefExoticComponent<LucideProps>;
  
  export const Activity: Icon;
  export const ArrowLeft: Icon;
  export const ArrowRight: Icon;
  export const BarChart: Icon;
  export const BarChart3: Icon;
  export const CheckCircle: Icon;
  export const Clock: Icon;
  export const Coins: Icon;
  export const Cpu: Icon;
  export const Database: Icon;
  export const Download: Icon;
  export const ExternalLink: Icon;
  export const Eye: Icon;
  export const FileCheck: Icon;
  export const FileKey: Icon;
  export const Filter: Icon;
  export const Fingerprint: Icon;
  export const Globe: Icon;
  export const Layers: Icon;
  export const Lightning: Icon;
  export const Loader2: Icon;
  export const Lock: Icon;
  export const Moon: Icon;
  export const Network: Icon;
  export const Play: Icon;
  export const QrCode: Icon;
  export const Radio: Icon;
  export const Search: Icon;
  export const Server: Icon;
  export const Shield: Icon;
  export const ShieldCheck: Icon;
  export const Square: Icon;
  export const Star: Icon;
  export const Sun: Icon;
  export const Terminal: Icon;
  export const TrendingUp: Icon;
  export const Upload: Icon;
  export const User: Icon;
  export const UserCircle: Icon;
  export const Users: Icon;
  export const UsersRound: Icon;
  export const Zap: Icon;
}
