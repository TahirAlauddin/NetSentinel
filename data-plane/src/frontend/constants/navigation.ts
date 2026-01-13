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
  { label: "Email Format", href: "/settings/email-format" },
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
  { label: "Providers", href: "/telecom-management/providers" },
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

// Notifications submenu links
export const notificationsAlertTypesSubmenuLinks = [
  { label: "System Alerts", href: "/notifications/system-alerts" },
  { label: "Performance Warnings", href: "/notifications/performance-warnings" },
  { label: "Security Notifications", href: "/notifications/security" },
  { label: "Maintenance Alerts", href: "/notifications/maintenance" },
  { label: "Error Reports", href: "/notifications/error-reports" },
  { label: "Status Updates", href: "/notifications/status-updates" },
];

export const notificationsChannelsSubmenuLinks = [
  { label: "Email Notifications", href: "/notifications/email" },
  { label: "SMS Alerts", href: "/notifications/sms" },
  { label: "Push Notifications", href: "/notifications/push" },
  { label: "Webhook Integration", href: "/notifications/webhook" },
  { label: "Slack Integration", href: "/notifications/slack" },
  { label: "Teams Integration", href: "/notifications/teams" },
];

export const notificationsSettingsSubmenuLinks = [
  { label: "Notification Preferences", href: "/notifications/preferences" },
  { label: "Alert Thresholds", href: "/notifications/thresholds" },
  { label: "Schedule Management", href: "/notifications/schedule" },
  { label: "Escalation Rules", href: "/notifications/escalation" },
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
  { label: "Phone Numbers", href: "/ipam/phone-numbers" },
];

export const ipamSubnetManagementSubmenuLinks = [
  { label: "Favourite Subnets", href: "/ipam/favourite-subnets" },
  { label: "Scanned Networks", href: "/ipam/scanned-networks" },
  { label: "Subnet Masks", href: "/ipam/subnet-masks" },
  { label: "Temporary Shares", href: "/ipam/temporary-shares" },
  { label: "Inactive Hosts", href: "/ipam/inactive-hosts" },
  { label: "Duplicates", href: "/ipam/duplicates" },
  { label: "Threshold", href: "/ipam/threshold" },
];

export const ipamNetworkServicesSubmenuLinks = [
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
        title: "Alert Types",
        links: notificationsAlertTypesSubmenuLinks,
      },
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
  { label: "Phone Management", icon: Phone, href: "#" },
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
