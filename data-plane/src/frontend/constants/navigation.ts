import {
  Gauge,
  LayoutDashboard,
  Map,
  Boxes,
  FileText,
  Building2,
  CreditCard,
  Activity,
  Bell,
  Server,
  Phone,
  Pi as Api,
  LifeBuoy,
  Settings,
  MapPin,
} from "lucide-react"
import { NavigationItem, SubmenuColumn } from "../types/navigation"

export const settingsSubmenuItems = [
  { title: "Overview", url: "/settings" },
  { title: "Locations", url: "/settings/locations" },
  { title: "Circuits", url: "/settings/circuits" },
  { title: "Departments", url: "/settings/departments" },
  { title: "Categories", url: "/settings/categories" },
  { title: "Email Format", url: "/settings/email-format" },
]

export const submenuColumns: SubmenuColumn[] = [
  {
    title: "Category One",
    links: ["SNMP", "Notifications", "Service", "Wallboard", "Synthetic User", "Sensors"],
  },
  {
    title: "Category Two",
    links: ["Alarms", "Syslog(Data Hub)", "Reports", "Config Backup", "Logs", "SQL Query Monitoring"],
  },
  {
    title: "Category 3",
    links: ["Website Monitoring", "Email Monitoring", "Distributed Monitoring"],
  },
]

export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Site Surveys", icon: Map, href: "/site-surveys" },
  { label: "Assets", icon: Boxes, href: "/assets" },
  { label: "Contracts", icon: FileText, href: "/contracts" },
  { label: "Vendors/SaaS", icon: Building2, href: "/vendors-saas" },
  { 
    label: "Telecom Expense Management", 
    icon: CreditCard, 
    href: "/telecom-management",
    hasSubmenu: true,
    submenuColumns: [
      {
        title: "Management",
        links: ["Providers", "Data Circuits"],
      },
      {
        title: "Expense Categories",
        links: ["Voice Services", "Data Services", "Internet Services", "Mobile Services", "Equipment Costs", "Service Fees"],
      },
      {
        title: "Reports",
        links: ["Monthly Reports", "Quarterly Analysis", "Cost Breakdown", "Vendor Comparison", "Usage Reports", "Budget Tracking"],
      },
    ]
  },
  { 
    label: "Monitoring", 
    icon: Activity, 
    href: "/monitoring", 
    hasSubmenu: true,
    submenuColumns: submenuColumns
  },
  { 
    label: "Notifications", 
    icon: Bell, 
    href: "/notifications", 
    hasSubmenu: true,
    submenuColumns: [
      {
        title: "Alert Types",
        links: ["System Alerts", "Performance Warnings", "Security Notifications", "Maintenance Alerts", "Error Reports", "Status Updates"],
      },
      {
        title: "Channels",
        links: ["Email Notifications", "SMS Alerts", "Push Notifications", "Webhook Integration", "Slack Integration", "Teams Integration"],
      },
      {
        title: "Settings",
        links: ["Notification Preferences", "Alert Thresholds", "Schedule Management", "Escalation Rules"],
      },
    ]
  },
  { label: "VM Management", icon: Server, href: "#" },
  { label: "Phone Management", icon: Phone, href: "#" },
  { label: "API Management", icon: Api, href: "#" },
  { label: "Settings", icon: Settings, href: "/settings",
    hasSubmenu: true,
    submenuColumns: [
      {
        links: settingsSubmenuItems.map(item => item.title),
      },
    ]
  },
  { label: "Help Desk", icon: LifeBuoy, href: "#" },
]

export const brandConfig = {
  logo: Gauge,
  name: "NetSentinel",
  subtitle: "Network Tools",
  logoColor: "bg-[oklch(0.62_0.25_27.3)]",
  activeBarColor: "bg-[oklch(0.62_0.25_27.3)]",
} as const
