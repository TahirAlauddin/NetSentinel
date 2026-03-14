import { BaseApiClient } from "./index";
import type { BaseApiResponse } from "../../types/api-client";

/**
 * Company/settings payload for update (matches backend when implemented).
 * Backend endpoint: PATCH /api/v1/settings/company/ (or equivalent).
 */
export interface CompanyUpdateDto {
  company_name?: string;
  subdomain?: string;
  company_url?: string;
  main_contact?: string;
  phone_country?: string;
  phone_number?: string;
  phone_extension?: string;
  time_zone?: string;
  fiscal_year_month?: string;
  fiscal_year_day?: string;
  isolate_workspaces?: boolean;
  show_free_modules?: boolean;
  enable_chat_support?: boolean;
}

/**
 * Settings API client (company and other tenant settings).
 * Endpoints may be added as backend is implemented.
 */
class SettingsApiClient extends BaseApiClient {
  /**
   * Update company settings.
   * Calls PATCH /settings/company/ when backend is available.
   */
  async updateCompany<T = unknown>(data: CompanyUpdateDto): Promise<BaseApiResponse<T>> {
    return this.patch<T>("/settings/company/", data);
  }
}

export const settingsApiClient = new SettingsApiClient();
