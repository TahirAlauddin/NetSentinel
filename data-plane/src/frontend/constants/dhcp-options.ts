/**
 * DHCP Option Constants.
 *
 * Contains all standard DHCP options with their codes, names, and descriptions.
 * Based on RFC standards and common DHCP implementations.
 */

// Essential IPv4 DHCP Options (Simple Mode)
export const ESSENTIAL_OPTIONS = [1, 3, 6, 15, 42, 51, 12, 44, 46, 60, 66, 67];

export interface DHCPOptionDefinition {
  code: number;
  name: string;
  description: string;
  type: "ip_address" | "string" | "integer" | "boolean";
  format: "single" | "multiple";
}

// All DHCP Options
export const DHCP_OPTIONS: Record<number, DHCPOptionDefinition> = {
  1: {
    code: 1,
    name: "Subnet Mask",
    description:
      "The subnet mask option specifies the client's subnet mask as per RFC 950. If no subnet mask option is provided, the DHCP server uses the subnet mask from the subnet declaration for the network on which an address is being assigned.",
    type: "ip_address",
    format: "single",
  },
  2: {
    code: 2,
    name: "Time Offset",
    description:
      "Specifies the offset time of client's subnet in seconds. This is expressed as a two's complement 32-bit integer preference value. Two types of offset can be set: positive and negative. A positive offset indicates a location to the east of the zero meridian and a negative offset indicates a location to the west of the zero meridian.",
    type: "integer",
    format: "single",
  },
  3: {
    code: 3,
    name: "Router",
    description:
      "Specifies the routers on the client's subnet as a list of IP addresses. The routers should be listed in the order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  4: {
    code: 4,
    name: "Time Server",
    description:
      "Specifies a list of RFC time servers available to the client. The servers should be listed in the order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  5: {
    code: 5,
    name: "Name Server",
    description:
      "Specifies a list of IEN 116 name servers available to the client. The name servers should be listed in the order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  6: {
    code: 6,
    name: "Domain Name Server",
    description:
      "Specifies a list of DNS name servers available to the client. The DNS servers should be listed in the order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  7: {
    code: 7,
    name: "Log Server",
    description:
      "Specifies a list of MIT-LCS UDP log servers available to the client. The log servers should be listed in the order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  8: {
    code: 8,
    name: "Cookie Server",
    description:
      "Specifies a list of RFC 865 cookie servers available to the client. The cookie servers should be listed in the order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  9: {
    code: 9,
    name: "LPR Server",
    description:
      "Specifies a list of RFC 1179 line printer servers available to the client. The LPR servers should be listed in the order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  10: {
    code: 10,
    name: "Impress Server",
    description:
      "Specifies a list of Imagen Impress servers available to the client. The impress servers should be listed in the order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  11: {
    code: 11,
    name: "Resource Location Server",
    description:
      "Specifies a list of RFC 887 resource location servers available to the client. The resource location servers should be listed in the order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  12: {
    code: 12,
    name: "Host Name",
    description:
      "The Host object represents a client in the network with a statically assigned IP address and is identified by a host name.",
    type: "string",
    format: "single",
  },
  13: {
    code: 13,
    name: "Boot File Size",
    description:
      "Specifies the length of the boot image for the client, in 512-octet blocks. The length is specified as an unsigned 16-bit integer.",
    type: "integer",
    format: "single",
  },
  14: {
    code: 14,
    name: "Merit Dump File",
    description:
      "Specifies the location of a file where the core image of the client should be dumped if the client crashes.",
    type: "string",
    format: "single",
  },
  15: {
    code: 15,
    name: "Domain Name",
    description: "The domain name (e.g., example.com) for the client.",
    type: "string",
    format: "single",
  },
  16: {
    code: 16,
    name: "Swap Server",
    description: "Specifies the IP address of the swap server for the client.",
    type: "ip_address",
    format: "single",
  },
  17: {
    code: 17,
    name: "Root Path",
    description: "Specifies the path name for the client's root disk.",
    type: "string",
    format: "single",
  },
  18: {
    code: 18,
    name: "Extension Paths",
    description: "Extension paths for the client.",
    type: "string",
    format: "single",
  },
  19: {
    code: 19,
    name: "IP Forwarding Enable/Disable",
    description:
      "Specifies whether the client should forward an IP address. Values can be either True or False. True indicates that IP forwarding should be enabled and False indicates that IP forwarding should be disabled.",
    type: "boolean",
    format: "single",
  },
  20: {
    code: 20,
    name: "Non-Local Source Routing",
    description:
      "Specifies whether the client should forward datagrams with non-local source routing. Values can be either True or False. True indicates to enable datagram forwarding and False indicates to disable datagram forwarding.",
    type: "boolean",
    format: "single",
  },
  21: {
    code: 21,
    name: "Policy Filter",
    description:
      "Specifies the policy filters for non-local source routing. The policy filters consist of a list of IP addresses and masks that filter the incoming source routes.",
    type: "ip_address",
    format: "multiple",
  },
  22: {
    code: 22,
    name: "Maximum Datagram Re-assembly size",
    description: "Specifies the maximum size of the datagram that the client should reassemble.",
    type: "integer",
    format: "single",
  },
  23: {
    code: 23,
    name: "Default IP Time-to-live",
    description: "Specifies the time-to-live used by the client on outgoing datagrams.",
    type: "integer",
    format: "single",
  },
  24: {
    code: 24,
    name: "Path MTU Aging Time-out",
    description:
      "Specifies the time-out (in seconds) used when the aging path MTU values are discovered by the mechanism defined in RFC 1191.",
    type: "integer",
    format: "single",
  },
  25: {
    code: 25,
    name: "Path MTU Plateau Table",
    description:
      "Specifies a table of MTU sizes used when performing path MTU discovery as defined in RFC 1191.",
    type: "integer",
    format: "multiple",
  },
  26: {
    code: 26,
    name: "Interface MTU",
    description: "Specifies the MTU used on this interface. The minimum value for the MTU is 68.",
    type: "integer",
    format: "single",
  },
  27: {
    code: 27,
    name: "All subnets are local",
    description:
      "Specifies whether the client can assume that all subnets of IP network connected to the client use the same MTU as the subnet of the network to which the client is directly connected. Values can be either True or False. True indicates that all subnets share the same MTU. False indicates that some subnets of the network that is directly connected have smaller MTU values.",
    type: "boolean",
    format: "single",
  },
  28: {
    code: 28,
    name: "Broadcast Address",
    description: "Specifies the broadcast address being used on the client's subnet.",
    type: "ip_address",
    format: "single",
  },
  29: {
    code: 29,
    name: "Perform Mask Discovery",
    description:
      "Specifies whether the client should perform subnet mask discovery by using ICMP. Values can be either True or False. True indicates that the client should perform subnet mask discovery. False indicates that the client should not perform subnet mask discovery.",
    type: "boolean",
    format: "single",
  },
  30: {
    code: 30,
    name: "Mask Supplier",
    description:
      "Specifies whether the client should respond to subnet mask requests by using ICMP. Values can be either True or False. True indicates that the client should respond and False indicates that the client should not respond.",
    type: "boolean",
    format: "single",
  },
  31: {
    code: 31,
    name: "Perform Router Discovery",
    description:
      "Specifies whether the client should solicit routers by using the Router Discovery mechanism as defined in RFC 1256. Values can be either True or False. True indicates that the client should perform router discovery and False indicates that the client should not perform router discovery.",
    type: "boolean",
    format: "single",
  },
  32: {
    code: 32,
    name: "Router Solicitation Address",
    description: "Specifies the IP address to which the client can send router solicitation requests.",
    type: "ip_address",
    format: "single",
  },
  33: {
    code: 33,
    name: "Static Route",
    description:
      "Specifies a list of static routes that the client can install in its routing cache. Multiple routes to the same destination are listed in descending order. Static routes consists of a list of IP address in pairs. The first address in the pair is the destination address and the second is the router for the destination.",
    type: "ip_address",
    format: "multiple",
  },
  34: {
    code: 34,
    name: "Trailer Encapsulation",
    description:
      "Specifies whether the client can negotiate encapsulating trailers when using the ARP protocol. Values can be either True or False. True indicates that the client should use trailers and False indicates that the client should not use trailers.",
    type: "boolean",
    format: "single",
  },
  35: {
    code: 35,
    name: "ARP Cache Time-out",
    description: "Specifies the time-out (in seconds) for ARP cache entries.",
    type: "integer",
    format: "single",
  },
  36: {
    code: 36,
    name: "Ethernet Encapsulation",
    description:
      "Specifies whether the client can use Ethernet version 2.0 (RFC 894) or IEE 802.3 (RFC 1042) encapsulation if it is an Ethernet interface. Values can be either True or False. True indicates that the client should use RFC 1042 encapsulation and False indicates that the client should use RFC 894 encapsulation.",
    type: "boolean",
    format: "single",
  },
  37: {
    code: 37,
    name: "TCP Default TTL",
    description: "Specifies the default TTL that the client should use when sending TCP segments.",
    type: "integer",
    format: "single",
  },
  38: {
    code: 38,
    name: "TCP Keep-alive interval",
    description:
      "Specifies the interval (in seconds) that the TCP client should wait before sending a keep-alive message on a TCP connection.",
    type: "integer",
    format: "single",
  },
  39: {
    code: 39,
    name: "TCP Keep-alive garbage",
    description:
      "Specifies whether the client should send TCP keep-alive messages with a garbage octet for compatibility with older implementations. Values can be either True or False. True indicates that a garbage octet should be sent and False indicates that a garbage octet should not be sent.",
    type: "boolean",
    format: "single",
  },
  40: {
    code: 40,
    name: "NIS Domain",
    description: "Specifies the NIS domain name of the client.",
    type: "string",
    format: "single",
  },
  41: {
    code: 41,
    name: "NIS Servers",
    description:
      "Specifies a list of the NIS server's IP addresses available to the client. The NIS servers should be listed in the order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  42: {
    code: 42,
    name: "Network Time Protocol Servers",
    description:
      "Specifies a list of IP addresses indicating Network Time Protocol Servers (NTP servers) available to the client. The NTP servers should be listed in the order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  43: {
    code: 43,
    name: "Vendor Specific Option",
    description:
      "Specifies the vendor-specific information that can be used by the clients and servers.",
    type: "string",
    format: "single",
  },
  44: {
    code: 44,
    name: "NetBIOS over TCP/IP options-name server",
    description:
      "Specifies a list of RFC 1001 and RFC 1002 NetBIOS over TCP/IP name servers listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  45: {
    code: 45,
    name: "NetBIOS over TCP/IP options-datagram distribution server",
    description:
      "Specifies a list of RFC 1001 and RFC 1002 NetBIOS over Datagram Distribution servers listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  46: {
    code: 46,
    name: "NetBIOS over TCP/IP options-node type",
    description:
      "Allows NetBIOS over TCP/IP clients that can be configured as described in RFC 1001 and RFC 1002. Node types include B-node, P-node, M-node, and H-node.",
    type: "integer",
    format: "single",
  },
  47: {
    code: 47,
    name: "NetBIOS over TCP/IP options-Scope",
    description:
      "Specifies the NetBIOS over TCP/IP scope parameter for the client as specified in RFC 1001 and RFC 1002.",
    type: "string",
    format: "single",
  },
  48: {
    code: 48,
    name: "X Window System Font Server",
    description:
      "Specifies a list of X Window System Font servers available to the client. These servers should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  49: {
    code: 49,
    name: "X Window System Display Manager",
    description:
      "Specifies a list of IP addresses of systems that use the X Window System Display Manager and are available to the client. The IP addresses should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  51: {
    code: 51,
    name: "Lease Time",
    description: "Duration an IP address is valid before renewal.",
    type: "integer",
    format: "single",
  },
  58: {
    code: 58,
    name: "Renewal (T1) Time",
    description:
      "Specifies the time interval from the address assignment until the client reaches the renewing state.",
    type: "integer",
    format: "single",
  },
  59: {
    code: 59,
    name: "Renewal (T2) Time",
    description:
      "Specifies the time interval from the address assignment until the client reaches the rebinding state.",
    type: "integer",
    format: "single",
  },
  60: {
    code: 60,
    name: "Vendor Class Identifier",
    description: "Specifies the vendor type and configuration of a DHCP client.",
    type: "string",
    format: "single",
  },
  62: {
    code: 62,
    name: "NWIP Domain Name",
    description:
      "Enables the server to convey the NetWare/IP domain name used by the NetWare/IP product.",
    type: "string",
    format: "single",
  },
  63: {
    code: 63,
    name: "NetWare/IP Options",
    description: "NetWare/IP related options (sub-options 63-05 through 63-11).",
    type: "string",
    format: "single",
  },
  64: {
    code: 64,
    name: "NIS+ Domain",
    description: "Specifies the name of the client's NIS+ domain.",
    type: "string",
    format: "single",
  },
  65: {
    code: 65,
    name: "NIS Servers",
    description:
      "Specifies a list of IP addresses indicating Network Information Service (NIS)+ servers available to the client. The NIS+ servers should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  66: {
    code: 66,
    name: "TFTP Server Name",
    description: "Specifies the name of the TFTP server for the client.",
    type: "string",
    format: "single",
  },
  67: {
    code: 67,
    name: "Boot File Name",
    description: "Specifies the name of the boot file for the client.",
    type: "string",
    format: "single",
  },
  68: {
    code: 68,
    name: "Mobile IP Home Agent",
    description:
      "Specifies a list of IP addresses that indicates the mobile IP home agents available to the client. These agents should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  69: {
    code: 69,
    name: "SMTP Server",
    description:
      "Specifies a list of Simple Mail Transport Protocol (SMTP) servers available to the client. The SMTP servers should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  70: {
    code: 70,
    name: "POP3 Server",
    description:
      "Specifies a list of POP3 servers available to the client. The POP3 servers should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  71: {
    code: 71,
    name: "NNTP Server",
    description:
      "Specifies a list of Network News Transport Protocol (NNTP) servers available to the client. The NNTP servers should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  72: {
    code: 72,
    name: "WWW Server",
    description:
      "Specifies a list of World Wide Web (WWW) servers available to the client. The WWW servers should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  73: {
    code: 73,
    name: "Default Finger Server",
    description:
      "Specifies a list of Finger servers available to the client. The Finger servers should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  74: {
    code: 74,
    name: "Default IRC Server",
    description:
      "Specifies a list of Internet Relay Chat (IRC) servers available to the client. The IRC servers should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  75: {
    code: 75,
    name: "Street Talk Server",
    description:
      "Specifies a list of StreetTalk servers available to the client. The StreetTalk servers should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  76: {
    code: 76,
    name: "Street Talk Directory Assistance server",
    description:
      "Specifies a list of StreetTalk Directory Assistance (STDA) servers available to the client. The STDA servers should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  78: {
    code: 78,
    name: "SLP Directory Agent",
    description:
      "Specifies a list of IP addresses for Directory Agents. The Directory Agents should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  79: {
    code: 79,
    name: "SLP Service Scope",
    description: "Specifies the scope that an agent is configured to use.",
    type: "string",
    format: "single",
  },
  82: {
    code: 82,
    name: "DHCP Relay Agent Information",
    description: "DHCP relay agent information option (sub-options 82-01, 82-02, 82-04).",
    type: "string",
    format: "single",
  },
  85: {
    code: 85,
    name: "NDS Servers",
    description:
      "Specifies one or more NDS servers for the client to contact to access the NDS database. The NDS servers should be listed in order of preference.",
    type: "ip_address",
    format: "multiple",
  },
  86: {
    code: 86,
    name: "NDS Tree Name",
    description: "Specifies the name of the NDS tree that the client contacts.",
    type: "string",
    format: "single",
  },
  87: {
    code: 87,
    name: "NDS Context",
    description: "Specifies the initial NDS context that the client should use.",
    type: "string",
    format: "single",
  },
};

export function getAllOptions(): Record<number, DHCPOptionDefinition> {
  return DHCP_OPTIONS;
}

export function getEssentialOptions(): Record<number, DHCPOptionDefinition> {
  const essential: Record<number, DHCPOptionDefinition> = {};
  ESSENTIAL_OPTIONS.forEach((code) => {
    if (DHCP_OPTIONS[code]) {
      essential[code] = DHCP_OPTIONS[code];
    }
  });
  return essential;
}

export function getOptionByCode(code: number): DHCPOptionDefinition | undefined {
  return DHCP_OPTIONS[code];
}

export function isEssentialOption(code: number): boolean {
  return ESSENTIAL_OPTIONS.includes(code);
}
