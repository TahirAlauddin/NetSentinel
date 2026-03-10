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
  Network,
} from "lucide-react";
import { NavigationItem, SubmenuColumn } from "../types/navigation";

// Settings submenu links
export const settingsMainSubmenuLinks = [
  { label: "Overview", href: "/settings" },
  { label: "Locations", href: "/settings/locations" },
  { label: "Departments", href: "/settings/departments" },
  { label: "Categories", href: "/settings/categories" },
];

export const settingsPeopleSubmenuLinks = [
  { label: "People", href: "/settings/people" },
  { label: "Groups", href: "/settings/groups" },
];

export const settingsAdditionalSubmenuLinks = [
  { label: "Child Company Management", href: "/settings/company" },
  { label: "Feature Requests", href: "/settings/requests" },
  { label: "Logs", href: "/settings/logs" },
];

export const settingsDataSubmenuLinks = [
  { label: "Export Data", href: "/settings/export" },
  { label: "Import Data", href: "/settings/import" },
];

// Telecom Expense Management submenu links
export const telecomManagementSubmenuLinks = [
  { label: "Overview", href: "/telecom-management" },
  { label: "Providers", href: "/telecom-management/providers" },
  { label: "Services", href: "/telecom-management/services" },
  { label: "Phone Numbers", href: "/telecom-management/phone-numbers" },
  { label: "Data Circuits", href: "/telecom-management/data-circuits" },
];

export const telecomExpenseCategoriesSubmenuLinks = [
  { label: "Voice Services", href: "/telecom-management/voice-services" },
  { label: "Data Services", href: "/telecom-management/data-services" },
  { label: "Internet Services", href: "/telecom-management/internet-services" },
  { label: "Mobile Services", href: "/telecom-management/mobile-services" },
  { label: "Equipment Costs", href: "/telecom-management/equipment-costs" },
  { label: "Service Fees", href: "/telecom-management/service-fees" },
];

export const telecomReportsSubmenuLinks = [
  { label: "Reports", href: "/telecom-management/reports" },
];

// Phone Management submenu links
export const phoneManagementSubmenuLinks = [
  { label: "Overview", href: "/phone-management" },
  { label: "Managed Numbers", href: "/phone-management/numbers" },
  { label: "Number Blocks", href: "/phone-management/blocks" },
];

// Notifications submenu links — channels and preferences
export const notificationsChannelsSubmenuLinks = [
  { label: "Email", href: "/notifications/email" },
  { label: "Slack", href: "/notifications/slack" },
  { label: "Discord", href: "/notifications/discord" },
  { label: "SMS", href: "/notifications/sms" },
];

export const notificationsSettingsSubmenuLinks = [
  { label: "Preferences", href: "/notifications/preferences" },
];

// Monitoring submenu links
export const monitoringSubmenuLinks = [
  { label: "SNMP", href: "/monitoring/snmp" },
  { label: "Notifications", href: "/monitoring/notifications" },
  { label: "Service", href: "/monitoring/service" },
  { label: "Wallboard", href: "/monitoring/wallboard" },
  { label: "Synthetic User", href: "/monitoring/synthetic-user" },
  { label: "Sensors", href: "/monitoring/sensors" },
  { label: "Alarms", href: "/monitoring/alarms" },
  { label: "Syslog(Data Hub)", href: "/monitoring/syslog" },
  { label: "Reports", href: "/monitoring/reports" },
  { label: "Config Backup", href: "/monitoring/config-backup" },
  { label: "Logs", href: "/monitoring/logs" },
  { label: "SQL Query Monitoring", href: "/monitoring/sql-query" },
  { label: "Website Monitoring", href: "/monitoring/website" },
  { label: "Email Monitoring", href: "/monitoring/email" },
  { label: "Distributed Monitoring", href: "/monitoring/distributed" },
];

export const monitoringSubmenuColumns: SubmenuColumn[] = [
  {
    title: "Category One",
    links: monitoringSubmenuLinks.slice(0, 6),
  },
  {
    title: "Category Two",
    links: monitoringSubmenuLinks.slice(6, 12),
  },
  {
    title: "Category 3",
    links: monitoringSubmenuLinks.slice(12),
  },
];

// Contracts submenu links (list and overview are the same page at /contracts)
export const contractsMainSubmenuLinks = [
  { label: "Contracts", href: "/contracts" },
];

// Assets submenu links
export const assetsMainSubmenuLinks = [
  { label: "Overview", href: "/assets" },
  { label: "All Assets", href: "/assets/list" },
  { label: "Reporting", href: "/assets/reporting" },
];

export const assetsReportingSubmenuLinks = [
  { label: "Operating System", href: "/assets/reporting/operating-system" },
  { label: "Applications", href: "/assets/reporting/applications" },
  { label: "Availability", href: "/assets/reporting/availability" },
  { label: "Location", href: "/assets/reporting/location" },
  { label: "Warranty", href: "/assets/reporting/warranty" },
  { label: "Model", href: "/assets/reporting/model" },
  { label: "Asset Type", href: "/assets/reporting/asset-type" },
  { label: "Department", href: "/assets/reporting/department" },
  { label: "Cost", href: "/assets/reporting/cost" },
  { label: "Firmware", href: "/assets/reporting/firmware" },
];

// IPAM submenu links
export const ipamMainSubmenuLinks = [
  { label: "Dashboard", href: "/ipam" },
  { label: "Subnets", href: "/ipam/subnets" },
  { label: "Subnet Groups", href: "/ipam/subnet-groups" },
  { label: "Customers", href: "/ipam/customers" },
  { label: "VLAN", href: "/ipam/vlans" },
  { label: "VRF", href: "/ipam/vrfs" },
  { label: "Devices", href: "/ipam/devices" },
  { label: "IP Requests", href: "/ipam/ip-requests" },
];

export const ipamSubnetManagementSubmenuLinks = [
  { label: "Favourite Subnets", href: "/ipam/favourite-subnets" },
  // { label: "Scanned Networks", href: "/ipam/scanned-networks" },
  { label: "Subnet Masks", href: "/ipam/subnet-masks" },
  { label: "Temporary Shares", href: "/ipam/temporary-shares" },
  { label: "Inactive Hosts", href: "/ipam/inactive-hosts" },
  { label: "Duplicates", href: "/ipam/duplicates" },
  { label: "Threshold Monitoring", href: "/ipam/thresholds" },
  { label: "IP Tags", href: "/ipam/ip-tags" },
  { label: "Audit Logs", href: "/ipam/audit-logs" },
];

export const ipamNetworkServicesSubmenuLinks = [
  { label: "DHCP Scopes", href: "/ipam/dhcp-scopes" },
  { label: "DHCP Leases", href: "/ipam/dhcp-leases" },
  { label: "DHCP Reservations", href: "/ipam/dhcp-reservations" },
  { label: "IP Pools", href: "/ipam/ip-pools" },
  { label: "NAT", href: "/ipam/nat" },
  { label: "Routing", href: "/ipam/routing" },
  { label: "Firewall Zones", href: "/ipam/firewall-zones" },
];

export const ipamInfrastructureSubmenuLinks = [
  { label: "Racks", href: "/ipam/racks" },
  { label: "Circuits", href: "/ipam/circuits" },
  { label: "Locations", href: "/ipam/locations" },
];

export const ipamToolsSubmenuLinks = [
  { label: "Search", href: "/ipam/search" },
  { label: "Documentation", href: "/ipam/documentation" },
];

/******************************************************************************************************************
 * Navigation items are the main navigation items that are displayed in the sidebar.
 * They are used to navigate to the different pages in the application.
 * They are also used to display the submenu items.
 ******************************************************************************************************************/
export const navigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Site Surveys", icon: Map, href: "/site-surveys" },
  {
    label: "Assets",
    icon: Boxes,
    href: "/assets",
    hasSubmenu: true,
    submenuColumns: [
      {
        title: "Main",
        links: assetsMainSubmenuLinks,
      },
      {
        title: "Reporting",
        links: assetsReportingSubmenuLinks,
      },
    ],
  },
  {
    label: "Contracts",
    icon: FileText,
    href: "/contracts",
    hasSubmenu: true,
    submenuColumns: [
      {
        title: "Main",
        links: contractsMainSubmenuLinks,
      },
    ],
  },
  { label: "Vendors/SaaS", icon: Building2, href: "/vendors-saas" },
  {
    label: "Telecom Expense Management",
    icon: CreditCard,
    href: "/telecom-management",
    hasSubmenu: true,
    submenuColumns: [
      {
        title: "Management",
        links: telecomManagementSubmenuLinks,
      },
      {
        title: "Expense Categories",
        links: telecomExpenseCategoriesSubmenuLinks,
      },
      {
        title: "Reports",
        links: telecomReportsSubmenuLinks,
      },
    ],
  },
  {
    label: "Monitoring",
    icon: Activity,
    href: "/monitoring",
    hasSubmenu: true,
    submenuColumns: monitoringSubmenuColumns,
  },
  {
    label: "Notifications",
    icon: Bell,
    href: "/notifications",
    hasSubmenu: true,
    submenuColumns: [
      {
        title: "Channels",
        links: notificationsChannelsSubmenuLinks,
      },
      {
        title: "Settings",
        links: notificationsSettingsSubmenuLinks,
      },
    ],
  },
  { label: "VM Management", icon: Server, href: "#" },
  {
    label: "Phone Management",
    icon: Phone,
    href: "/phone-management",
    hasSubmenu: true,
    submenuColumns: [
      {
        title: "Management",
        links: phoneManagementSubmenuLinks,
      },
    ],
  },
  { label: "API Management", icon: Api, href: "#" },
  {
    label: "IPAM",
    icon: Network,
    href: "/ipam",
    hasSubmenu: true,
    submenuColumns: [
      {
        title: "Main",
        links: ipamMainSubmenuLinks,
      },
      {
        title: "Subnet Management",
        links: ipamSubnetManagementSubmenuLinks,
      },
      {
        title: "Network Services",
        links: ipamNetworkServicesSubmenuLinks,
      },
      {
        title: "Infrastructure",
        links: ipamInfrastructureSubmenuLinks,
      },
      {
        title: "Tools",
        links: ipamToolsSubmenuLinks,
      },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    hasSubmenu: true,
    submenuColumns: [
      {
        title: "Main",
        links: settingsMainSubmenuLinks,
      },
      {
        title: "People",
        links: settingsPeopleSubmenuLinks,
      },
      {
        title: "Additional",
        links: settingsAdditionalSubmenuLinks,
      },
      {
        title: "Data",
        links: settingsDataSubmenuLinks,
      },
    ],
  },
  { label: "Help Desk", icon: LifeBuoy, href: "#" },
];

export const brandConfig = {
  logo: Gauge,
  name: "NetSentinel",
  subtitle: "Network Tools",
  logoColor: "bg-[oklch(0.62_0.25_27.3)]",
  activeBarColor: "bg-[oklch(0.62_0.25_27.3)]",
} as const;
