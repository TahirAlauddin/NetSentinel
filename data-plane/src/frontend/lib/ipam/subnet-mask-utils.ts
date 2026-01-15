/**
 * Subnet Mask Utilities
 * 
 * Pure mathematical calculations for subnet mask reference information.
 * These values are deterministic and don't require backend API calls.
 */

export interface SubnetMaskInfo {
  bitmask: number;
  netmask: string;
  wildcard_mask: string;
  binary: string;
  subnets: number | string;
  hosts: number | string;
  subnet_bits: number;
  host_bits: number;
  is_ipv6?: boolean;
}

/**
 * Calculate subnet mask information for a given prefix length
 */
export function getSubnetMaskInfo(
  prefixLength: number,
  isIpv6: boolean = false
): SubnetMaskInfo {
  const maxPrefix = isIpv6 ? 128 : 32;

  if (prefixLength < 0 || prefixLength > maxPrefix) {
    throw new Error(`Prefix length must be between 0 and ${maxPrefix}`);
  }

  const hostBits = maxPrefix - prefixLength;
  const subnetBits = prefixLength;

  // Calculate number of hosts (2^host_bits)
  let totalHosts: number | string;
  if (hostBits > 64) {
    totalHosts = "Unlimited";
  } else {
    totalHosts = Math.pow(2, hostBits);
  }

  // For IPv4, exclude network and broadcast addresses
  let usableHosts: number | string;
  if (isIpv6) {
    usableHosts = totalHosts;
  } else {
    if (typeof totalHosts === "number") {
      usableHosts = Math.max(0, totalHosts - 2);
    } else {
      usableHosts = totalHosts;
    }
  }

  // Calculate number of subnets
  let subnets: number | string;
  if (isIpv6) {
    subnets = prefixLength < 128 ? Math.pow(2, 128 - prefixLength) : 1;
  } else {
    subnets = prefixLength < 32 ? Math.pow(2, 32 - prefixLength) : 1;
  }

  // Generate netmask
  let netmask: string;
  let wildcardMask: string;
  let binary: string;

  if (isIpv6) {
    // For IPv6, show prefix length notation (standard format)
    // e.g., /64, /48, etc.
    netmask = `/${prefixLength}`;
    
    // For IPv6, we can also show the mask in hex format
    // Calculate the mask value
    const maskParts: string[] = [];
    const fullHextets = Math.floor(prefixLength / 16);
    const partialBits = prefixLength % 16;
    
    for (let i = 0; i < fullHextets; i++) {
      maskParts.push("ffff");
    }
    
    if (partialBits > 0 && fullHextets < 8) {
      const maskValue = 0xffff << (16 - partialBits);
      maskParts.push(maskValue.toString(16).padStart(4, "0"));
    }
    
    // Fill remaining with zeros
    while (maskParts.length < 8) {
      maskParts.push("0000");
    }
    
    const hexMask = maskParts.join(":");
    wildcardMask = "Not applicable for IPv6";
    binary = hexMask; // Use hex for IPv6 (binary too long)
  } else {
    // For IPv4, calculate netmask from prefix length
    const maskValue = 0xffffffff << (32 - prefixLength);
    const maskBytes = [
      (maskValue >>> 24) & 0xff,
      (maskValue >>> 16) & 0xff,
      (maskValue >>> 8) & 0xff,
      maskValue & 0xff,
    ];
    netmask = maskBytes.join(".");

    // Calculate wildcard mask (inverse)
    const wildcardValue = 0xffffffff ^ maskValue;
    const wildcardBytes = [
      (wildcardValue >>> 24) & 0xff,
      (wildcardValue >>> 16) & 0xff,
      (wildcardValue >>> 8) & 0xff,
      wildcardValue & 0xff,
    ];
    wildcardMask = wildcardBytes.join(".");

    // Binary representation
    binary = maskBytes
      .map((b) => b.toString(2).padStart(8, "0"))
      .join(".");
  }

  return {
    bitmask: prefixLength,
    netmask,
    wildcard_mask: wildcardMask,
    binary,
    subnets,
    hosts: usableHosts,
    subnet_bits: subnetBits,
    host_bits: hostBits,
    is_ipv6: isIpv6,
  };
}

/**
 * Get all subnet masks for a given IP version
 */
export function getAllSubnetMasks(
  isIpv6: boolean = false,
  minPrefix?: number,
  maxPrefix?: number
): SubnetMaskInfo[] {
  const defaultMin = 0;
  const defaultMax = isIpv6 ? 128 : 32;

  const min = minPrefix ?? defaultMin;
  const max = maxPrefix ?? defaultMax;

  const masks: SubnetMaskInfo[] = [];
  // Generate from highest to lowest prefix length
  for (let prefix = max; prefix >= min; prefix--) {
    try {
      masks.push(getSubnetMaskInfo(prefix, isIpv6));
    } catch {
      continue;
    }
  }

  return masks;
}

/**
 * Get commonly used subnet masks
 */
export function getCommonSubnetMasks(isIpv6: boolean = false): SubnetMaskInfo[] {
  if (isIpv6) {
    // Common IPv6 prefix lengths
    const commonPrefixes = [
      128, 127, 126, 125, 124, 120, 112, 108, 104, 96, 80, 64, 48, 32, 24, 16, 8, 0,
    ];
    return commonPrefixes
      .map((prefix) => {
        try {
          return getSubnetMaskInfo(prefix, true);
        } catch {
          return null;
        }
      })
      .filter((mask): mask is SubnetMaskInfo => mask !== null);
  } else {
    // Common IPv4 prefix lengths (from /32 to /8)
    const commonPrefixes = [
      32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14,
      13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
    ];
    return commonPrefixes
      .map((prefix) => {
        try {
          return getSubnetMaskInfo(prefix, false);
        } catch {
          return null;
        }
      })
      .filter((mask): mask is SubnetMaskInfo => mask !== null);
  }
}
