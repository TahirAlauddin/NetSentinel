import { BaseApiClient, BaseApiResponse } from "./index";
/**
 * Assets API Methods
 */
export class AssetsApiClient extends BaseApiClient {
  /**
   * Get all assets
   */
  async getAssets<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets${queryString}`);
  }

  /**
   * Get a specific asset by ID
   */
  async getAsset<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/${id}/`);
  }

  /**
   * Get all asset tags
   */
  async getAssetTags<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/tags${queryString}`);
  }

  /**
   * Get a specific asset tag by ID
   */
  async getAssetTag<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/tags/${id}/`);
  }

  /**
   * Get all custom lifecycles
   */
  async getLifecycles<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/lifecycles${queryString}`);
  }

  /**
   * Get a specific lifecycle by ID
   */
  async getLifecycle<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/lifecycles/${id}/`);
  }

  /**
   * Get all vendors
   */
  async getVendors<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/vendors${queryString}`);
  }

  /**
   * Get a specific vendor by ID
   */
  async getVendor<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/vendors/${id}/`);
  }

  /**
   * Get all tech specs (TechSpecsViewSet)
   */
  async getTechSpecs<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/tech-specs${queryString}`);
  }

  /**
   * Get a specific tech spec by ID (TechSpecsViewSet)
   */
  async getTechSpec<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/tech-specs/${id}/`);
  }

  /**
   * Get all asset categories
   */
  async getAssetCategories<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/categories${queryString}`);
  }

  /**
   * Get a specific asset category by ID
   */
  async getAssetCategory<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/categories/${id}/`);
  }

  /**
   * Get all asset attachments
   */
  async getAssetAttachments<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/attachments${queryString}`);
  }

  /**
   * Get a specific asset attachment by ID
   */
  async getAssetAttachment<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/attachments/${id}/`);
  }

  /**
   * Get all asset relations
   */
  async getAssetRelations<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/relations${queryString}`);
  }

  /**
   * Get a specific asset relation by ID
   */
  async getAssetRelation<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/relations/${id}/`);
  }

  /**
   * Get all computer details
   */
  async getComputerDetails<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/computer-details${queryString}`);
  }

  /**
   * Get a specific computer detail by ID
   */
  async getComputerDetail<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/computer-details/${id}/`);
  }

  /**
   * Get all network details
   */
  async getNetworkDetails<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/network-details${queryString}`);
  }

  /**
   * Get a specific network detail by ID
   */
  async getNetworkDetail<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/network-details/${id}/`);
  }

  /**
   * Get all display details
   */
  async getDisplayDetails<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/display-details${queryString}`);
  }

  /**
   * Get a specific display detail by ID
   */
  async getDisplayDetail<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/display-details/${id}/`);
  }

  /**
   * Get all phone details
   */
  async getPhoneDetails<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/phone-details${queryString}`);
  }

  /**
   * Get a specific phone detail by ID
   */
  async getPhoneDetail<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/phone-details/${id}/`);
  }

  /**
   * Get all peripheral details
   */
  async getPeripheralDetails<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/peripheral-details${queryString}`);
  }

  /**
   * Get a specific peripheral detail by ID
   */
  async getPeripheralDetail<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/peripheral-details/${id}/`);
  }

  /**
   * Get all asset basic details (AssetBasicDetailsViewSet)
   */
  async getAssetBasicDetails<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/basic-details${queryString}`);
  }

  /**
   * Get a specific asset basic detail by ID (AssetBasicDetailsViewSet)
   */
  async getAssetBasicDetail<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/basic-details/${id}/`);
  }

  /**
   * Get all asset tech specs (AssetTechSpecsViewSet)
   */
  async getAssetTechSpecs<T = any>(params?: Record<string, any>): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/tech-specs${queryString}`);
  }

  /**
   * Get a specific asset tech spec by ID (AssetTechSpecsViewSet)
   * Note: This endpoint conflicts with TechSpecsViewSet. Use getAssetTechSpecs() for list.
   */
  async getAssetTechSpec<T = any>(id: number | string): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/tech-specs/${id}/`);
  }

  /**
   * Get all images for a specific asset (nested endpoint)
   */
  async getAssetImages<T = any>(
    assetId: number | string,
    params?: Record<string, any>
  ): Promise<BaseApiResponse<T>> {
    const queryString = this.buildQueryString(params);
    return this.get<T>(`/assets/${assetId}/images${queryString}`);
  }

  /**
   * Get a specific asset image by ID (nested endpoint)
   */
  async getAssetImage<T = any>(
    assetId: number | string,
    imageId: number | string
  ): Promise<BaseApiResponse<T>> {
    return this.get<T>(`/assets/${assetId}/images/${imageId}/`);
  }
}
