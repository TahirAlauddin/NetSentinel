import {
  User,
  Cpu,
  Tag,
  FileText,
  Bell,
  History,
  Settings,
  Zap,
  DollarSign,
  Shield,
  Link2,
  LucideIcon,
} from "lucide-react"; 

export interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const SECTIONS: Section[] = [
  { id: "usage-status", label: "Usage Status", icon: User },
  { id: "system-details", label: "System Details", icon: Cpu },
  { id: "software", label: "Software", icon: FileText },
  { id: "cost-depreciation", label: "Cost & Depreciation", icon: DollarSign },
  { id: "warranty", label: "Warranty & Acquisition", icon: Shield },
  { id: "related-items", label: "Related Items", icon: Link2 },
  { id: "custom-details", label: "Custom Details", icon: Tag },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "sources", label: "Sources", icon: Settings },
  { id: "history", label: "History", icon: History },
  { id: "automation-history", label: "Automation History", icon: Zap },
];

// TODO: Replace with actual deprecation calculation logic
export const deprecationData = [
  { year: "2024", value: 10000 },
  { year: "2025", value: 8500 },
  { year: "2026", value: 7000 },
  { year: "2027", value: 5500 },
  { year: "2028", value: 4000 },
];

