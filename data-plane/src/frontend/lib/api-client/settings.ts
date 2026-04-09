import { BaseApiClient } from "./index";
import type { BaseApiResponse } from "../../types/api-client";

/**
 * Company/settings payload for update (matches backend when implemented).
 * Backend endpoint: PATCH /api/v1/core/company-profile/
 */
export interface CompanyUpdateDto {
  company_name?: string;
  subdomain?: string;
  company_url?: string;
  main_contact?: string;
  phone_country?: string;
  phone_number?: string;
  phone_extension?: string;
}

/**
 * Settings API client (company and other tenant settings).
 * Endpoints may be added as backend is implemented.
 */
class SettingsApiClient extends BaseApiClient {
  /**
   * Update company settings.
   * Calls PATCH /core/company-profile/.
   */
  async updateCompany<T = unknown>(data: CompanyUpdateDto): Promise<BaseApiResponse<T>> {
    return this.patch<T>("/core/company-profile/", data);
  }
}

export const settingsApiClient = new SettingsApiClient();
