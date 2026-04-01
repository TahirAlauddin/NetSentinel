"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { serverApi } from "@/lib/server-api";

export type CompanyProfile = {
  companyName: string;
  subdomain: string;
  mainContact: string;
  phoneNumber: string;
  timeZone: string;
};

// todo: remove this fallback profile (this is a temporary solution to avoid errors)
const fallbackProfile: CompanyProfile = {
  companyName: "NetSentinel Corp",
  subdomain: "netsentinel.app",
  mainContact: "admin@netsentinel.com",
  phoneNumber: "No phone number set",
  timeZone: "Eastern Time (US & Canada)",
};

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return fallbackProfile;

  const response = await serverApi.get<{
    company_name?: string;
    subdomain?: string;
    main_contact?: string;
    phone_number?: string;
    time_zone?: string;
  }>("/core/company-profile/");

  if (response.error || !response.data) return fallbackProfile;

  return {
    companyName: response.data.company_name || fallbackProfile.companyName,
    subdomain: response.data.subdomain || fallbackProfile.subdomain,
    mainContact: response.data.main_contact || fallbackProfile.mainContact,
    phoneNumber: response.data.phone_number || fallbackProfile.phoneNumber,
    timeZone: response.data.time_zone || fallbackProfile.timeZone,
  };
}
