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
  { label: "Overview", href: "/settings", requiredPermission: "auth.view_user" },
  { label: "Locations", href: "/settings/locations", requiredPermission: "auth.view_user" },
  { label: "Departments", href: "/settings/departments", requiredPermission: "auth.view_user" },
  { label: "Categories", href: "/settings/categories", requiredPermission: "auth.view_user" },
];

export const settingsPeopleSubmenuLinks = [
  { label: "People", href: "/settings/people", requiredPermission: "auth.view_user" },
  { label: "Groups", href: "/settings/groups", requiredPermission: "auth.view_group" },
];

export const settingsAdditionalSubmenuLinks = [
  { label: "Child Company Management", href: "/settings/company", requiredPermission: "auth.view_user" },
  { label: "Feature Requests", href: "/settings/requests", requiredPermission: "auth.view_user" },
  { label: "Logs", href: "/settings/logs", requiredPermission: "auth.view_user" },
];

export const settingsDataSubmenuLinks = [
  { label: "Export Data", href: "/settings/export", requiredPermission: "auth.view_user" },
  { label: "Import Data", href: "/settings/import", requiredPermission: "auth.view_user" },
];

// Telecom Expense Management submenu links
export const telecomManagementSubmenuLinks = [
  { label: "Overview", href: "/telecom-management", requiredPermission: "telecom.view_provider" },
  { label: "Providers", href: "/telecom-management/providers", requiredPermission: "telecom.view_provider" },
  { label: "Services", href: "/telecom-management/services", requiredPermission: "telecom.view_service" },
  { label: "Phone Numbers", href: "/telecom-management/phone-numbers", requiredPermission: "telecom.view_phonenumber" },
  { label: "Data Circuits", href: "/telecom-management/data-circuits", requiredPermission: "telecom.view_datacircuit" },
];

export const telecomExpenseCategoriesSubmenuLinks = [
  { label: "Voice Services", href: "/telecom-management/voice-services", requiredPermission: "telecom.view_provider" },
  { label: "Data Services", href: "/telecom-management/data-services", requiredPermission: "telecom.view_provider" },
  { label: "Internet Services", href: "/telecom-management/internet-services", requiredPermission: "telecom.view_provider" },
  { label: "Mobile Services", href: "/telecom-management/mobile-services", requiredPermission: "telecom.view_provider" },
  { label: "Equipment Costs", href: "/telecom-management/equipment-costs", requiredPermission: "telecom.view_provider" },
  { label: "Service Fees", href: "/telecom-management/service-fees", requiredPermission: "telecom.view_provider" },
];

export const telecomReportsSubmenuLinks = [
  { label: "Reports", href: "/telecom-management/reports", requiredPermission: "telecom.view_provider" },
];

// Phone Management submenu links
export const phoneManagementSubmenuLinks = [
  { label: "Overview", href: "/phone-management", requiredPermission: "phone_management.view_managedphonenumber" },
  { label: "Managed Numbers", href: "/phone-management/numbers", requiredPermission: "phone_management.view_managedphonenumber" },
  { label: "Number Blocks", href: "/phone-management/blocks", requiredPermission: "phone_management.view_managedphonenumberblock" },
];

// Notifications submenu links — channels and preferences
export const notificationsChannelsSubmenuLinks = [
  { label: "Email", href: "/notifications/email", requiredPermission: "notifications.view_inappnotification" },
  { label: "Slack", href: "/notifications/slack", requiredPermission: "notifications.view_inappnotification" },
  { label: "Discord", href: "/notifications/discord", requiredPermission: "notifications.view_inappnotification" },
  { label: "SMS", href: "/notifications/sms", requiredPermission: "notifications.view_inappnotification" },
];

export const notificationsSettingsSubmenuLinks = [
  { label: "Preferences", href: "/notifications/preferences", requiredPermission: "notifications.view_inappnotification" },
];

// Zabbix monitoring — top secondary bar + sidebar submenu (keep lean).
// Full configuration nav lives in monitoring-header on each page.
export const monitoringSubmenuLinks = [
  { label: "Overview", href: "/monitoring", requiredPermission: "monitoring.view_host" },
  { label: "Dashboard", href: "/monitoring/dashboard", requiredPermission: "monitoring.view_host" },
  { label: "Hosts", href: "/monitoring/hosts", requiredPermission: "monitoring.view_host" },
  { label: "Problems", href: "/monitoring/problems", requiredPermission: "monitoring.view_host" },
  { label: "Events", href: "/monitoring/events", requiredPermission: "monitoring.view_host" },
  // Configuration (implemented; uncomment for secondary bar when needed)
  // { label: "Host Groups", href: "/monitoring/host-groups", requiredPermission: "monitoring.view_host" },
  // { label: "Templates", href: "/monitoring/templates", requiredPermission: "monitoring.view_host" },
  // { label: "Triggers", href: "/monitoring/triggers", requiredPermission: "monitoring.view_host" },
  // { label: "Actions", href: "/monitoring/actions", requiredPermission: "monitoring.view_host" },
];


export const monitoringSubmenuColumns: SubmenuColumn[] = [
  {
    title: "Monitoring",
    links: monitoringSubmenuLinks,
  },
];

// Contracts submenu links (list and overview are the same page at /contracts)
export const contractsMainSubmenuLinks = [
  { label: "Contracts", href: "/contracts", requiredPermission: "contracts.view_contract" },
];

// Assets submenu links (each link can require a permission for RBAC)
export const assetsMainSubmenuLinks = [
  { label: "Overview", href: "/assets", requiredPermission: "assets.view_asset" },
  { label: "All Assets", href: "/assets/list", requiredPermission: "assets.view_asset" },
  { label: "Reporting", href: "/assets/reporting", requiredPermission: "assets.view_asset" },
];

export const assetsReportingSubmenuLinks = [
  { label: "Operating System", href: "/assets/reporting/operating-system", requiredPermission: "assets.view_operating_system" },
  { label: "Applications", href: "/assets/reporting/applications", requiredPermission: "assets.view_applications" },
  { label: "Availability", href: "/assets/reporting/availability", requiredPermission: "assets.view_availability" },
  { label: "Location", href: "/assets/reporting/location", requiredPermission: "assets.view_location" },
  { label: "Warranty", href: "/assets/reporting/warranty", requiredPermission: "assets.view_warranty" },
  { label: "Model", href: "/assets/reporting/model", requiredPermission: "assets.view_model" },
  { label: "Asset Type", href: "/assets/reporting/asset-type", requiredPermission: "assets.view_asset_type" },
  { label: "Department", href: "/assets/reporting/department", requiredPermission: "assets.view_department" },
  { label: "Cost", href: "/assets/reporting/cost", requiredPermission: "assets.view_cost" },
  { label: "Firmware", href: "/assets/reporting/firmware", requiredPermission: "assets.view_firmware" },
];

// IPAM submenu links
export const ipamMainSubmenuLinks = [
  { label: "Dashboard", href: "/ipam", requiredPermission: "ipam.view_subnet" },
  { label: "Subnets", href: "/ipam/subnets", requiredPermission: "ipam.view_subnet" },
  { label: "Subnet Groups", href: "/ipam/subnet-groups", requiredPermission: "ipam.view_subnetgroup" },
  { label: "Customers", href: "/ipam/customers", requiredPermission: "ipam.view_customer" },
  { label: "VLAN", href: "/ipam/vlans", requiredPermission: "ipam.view_vlan" },
  { label: "VRF", href: "/ipam/vrfs", requiredPermission: "ipam.view_vrf" },
  { label: "Devices", href: "/ipam/devices", requiredPermission: "ipam.view_device" },
  { label: "IP Requests", href: "/ipam/ip-requests", requiredPermission: "ipam.view_subnet" },
];

export const ipamSubnetManagementSubmenuLinks = [
  { label: "Favourite Subnets", href: "/ipam/favourite-subnets", requiredPermission: "ipam.view_subnet" },
  // { label: "Scanned Networks", href: "/ipam/scanned-networks" },
  { label: "Subnet Masks", href: "/ipam/subnet-masks", requiredPermission: "ipam.view_subnet" },
  { label: "Temporary Shares", href: "/ipam/temporary-shares", requiredPermission: "ipam.view_subnet" },
  { label: "Inactive Hosts", href: "/ipam/inactive-hosts", requiredPermission: "ipam.view_subnet" },
  { label: "Duplicates", href: "/ipam/duplicates", requiredPermission: "ipam.view_subnet" },
  { label: "Threshold Monitoring", href: "/ipam/thresholds", requiredPermission: "ipam.view_subnet" },
  { label: "IP Tags", href: "/ipam/ip-tags", requiredPermission: "ipam.view_subnet" },
  { label: "Audit Logs", href: "/ipam/audit-logs", requiredPermission: "ipam.view_subnet" },
];

export const ipamNetworkServicesSubmenuLinks = [
  { label: "DHCP Scopes", href: "/ipam/dhcp-scopes", requiredPermission: "ipam.view_dhcpscope" },
  { label: "DHCP Leases", href: "/ipam/dhcp-leases", requiredPermission: "ipam.view_dhcplease" },
  { label: "DHCP Reservations", href: "/ipam/dhcp-reservations", requiredPermission: "ipam.view_dhcpreservation" },
  { label: "IP Pools", href: "/ipam/ip-pools", requiredPermission: "ipam.view_ippool" },
  { label: "NAT", href: "/ipam/nat", requiredPermission: "ipam.view_subnet" },
  { label: "Routing", href: "/ipam/routing", requiredPermission: "ipam.view_subnet" },
  { label: "Firewall Zones", href: "/ipam/firewall-zones", requiredPermission: "ipam.view_subnet" },
];

export const ipamInfrastructureSubmenuLinks = [
  { label: "Racks", href: "/ipam/racks", requiredPermission: "ipam.view_subnet" },
  { label: "Circuits", href: "/ipam/circuits", requiredPermission: "ipam.view_subnet" },
  { label: "Locations", href: "/ipam/locations", requiredPermission: "ipam.view_subnet" },
];

export const ipamToolsSubmenuLinks = [
  { label: "Search", href: "/ipam/search", requiredPermission: "ipam.view_subnet" },
  { label: "Documentation", href: "/ipam/documentation", requiredPermission: "ipam.view_subnet" },
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
    requiredPermission: "assets.view_asset",
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
    requiredPermission: "contracts.view_contract",
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
    requiredPermission: "telecom.view_provider",
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
    requiredPermission: "notifications.view_inappnotification",
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
    requiredPermission: "phone_management.view_managedphonenumber",
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
    requiredPermission: "ipam.view_subnet",
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
