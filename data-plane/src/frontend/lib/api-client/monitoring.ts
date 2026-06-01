// ============================================================================
// Monitoring API Client
// ============================================================================

import { BaseApiClient, BaseApiResponse } from "./index";
import type {
  Action,
  ActionCondition,
  ActionOperation,
  Event,
  Host,
  HostFormData,
  HostGroup,
  HostGroupFormData,
  Item,
  ItemFormData,
  MonitoringStats,
  PaginatedResponse,
  Problem,
  Proxy,
  Template,
  TemplateFormData,
  Trigger,
  TriggerFormData,
  DashboardWidget,
  DashboardWidgetFormData,
  GraphDataResponse,
  MonitoringLookupHost,
  MonitoringLookupItem,
} from "@/types/monitoring";

export class MonitoringApiClient extends BaseApiClient {
  private readonly base = "/monitoring/";

  // ─── Stats ─────────────────────────────────────────────────────────────────

  async getStats(): Promise<BaseApiResponse<MonitoringStats>> {
    return this.get<MonitoringStats>(`${this.base}stats/`);
  }

  // ─── Host Groups ───────────────────────────────────────────────────────────

  async getHostGroups(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<HostGroup[]>> {
    const qs = this.buildQueryString(params);
    return this.get<HostGroup[]>(`${this.base}host-groups/${qs}`);
  }

  async getHostGroup(id: number): Promise<BaseApiResponse<HostGroup>> {
    return this.get<HostGroup>(`${this.base}host-groups/${id}/`);
  }

  async createHostGroup(
    data: HostGroupFormData
  ): Promise<BaseApiResponse<HostGroup>> {
    return this.post<HostGroup>(`${this.base}host-groups/`, data);
  }

  async updateHostGroup(
    id: number,
    data: Partial<HostGroupFormData>
  ): Promise<BaseApiResponse<HostGroup>> {
    return this.patch<HostGroup>(`${this.base}host-groups/${id}/`, data);
  }

  async deleteHostGroup(id: number): Promise<BaseApiResponse<void>> {
    return this.delete<void>(`${this.base}host-groups/${id}/`);
  }

  async getHostGroupHosts(id: number): Promise<BaseApiResponse<Host[]>> {
    return this.get<Host[]>(`${this.base}host-groups/${id}/hosts/`);
  }

  // ─── Hosts ─────────────────────────────────────────────────────────────────

  async getHosts(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<Host[]>> {
    const qs = this.buildQueryString(params);
    return this.get<Host[]>(`${this.base}hosts/${qs}`);
  }

  async getHost(id: number): Promise<BaseApiResponse<Host>> {
    return this.get<Host>(`${this.base}hosts/${id}/`);
  }

  async createHost(data: HostFormData): Promise<BaseApiResponse<Host>> {
    return this.post<Host>(`${this.base}hosts/`, data);
  }

  async updateHost(
    id: number,
    data: Partial<HostFormData>
  ): Promise<BaseApiResponse<Host>> {
    return this.patch<Host>(`${this.base}hosts/${id}/`, data);
  }

  async deleteHost(id: number): Promise<BaseApiResponse<void>> {
    return this.delete<void>(`${this.base}hosts/${id}/`);
  }

  async enableHost(id: number): Promise<BaseApiResponse<{ detail: string }>> {
    return this.post<{ detail: string }>(`${this.base}hosts/${id}/enable/`);
  }

  async disableHost(id: number): Promise<BaseApiResponse<{ detail: string }>> {
    return this.post<{ detail: string }>(`${this.base}hosts/${id}/disable/`);
  }

  async getHostItems(id: number): Promise<BaseApiResponse<Item[]>> {
    return this.get<Item[]>(`${this.base}hosts/${id}/items/`);
  }

  async getHostTriggers(id: number): Promise<BaseApiResponse<Trigger[]>> {
    return this.get<Trigger[]>(`${this.base}hosts/${id}/triggers/`);
  }

  async getHostProblems(id: number): Promise<BaseApiResponse<Problem[]>> {
    return this.get<Problem[]>(`${this.base}hosts/${id}/problems/`);
  }

  // ─── Proxies ───────────────────────────────────────────────────────────────

  async getProxies(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<Proxy[]>> {
    const qs = this.buildQueryString(params);
    return this.get<Proxy[]>(`${this.base}proxies/${qs}`);
  }

  async getProxy(id: number): Promise<BaseApiResponse<Proxy>> {
    return this.get<Proxy>(`${this.base}proxies/${id}/`);
  }

  async createProxy(data: Partial<Proxy>): Promise<BaseApiResponse<Proxy>> {
    return this.post<Proxy>(`${this.base}proxies/`, data);
  }

  async updateProxy(
    id: number,
    data: Partial<Proxy>
  ): Promise<BaseApiResponse<Proxy>> {
    return this.patch<Proxy>(`${this.base}proxies/${id}/`, data);
  }

  async deleteProxy(id: number): Promise<BaseApiResponse<void>> {
    return this.delete<void>(`${this.base}proxies/${id}/`);
  }

  // ─── Templates ─────────────────────────────────────────────────────────────

  async getTemplates(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<Template[]>> {
    const qs = this.buildQueryString(params);
    return this.get<Template[]>(`${this.base}templates/${qs}`);
  }

  async getTemplate(id: number): Promise<BaseApiResponse<Template>> {
    return this.get<Template>(`${this.base}templates/${id}/`);
  }

  async createTemplate(
    data: TemplateFormData
  ): Promise<BaseApiResponse<Template>> {
    return this.post<Template>(`${this.base}templates/`, data);
  }

  async updateTemplate(
    id: number,
    data: Partial<TemplateFormData>
  ): Promise<BaseApiResponse<Template>> {
    return this.patch<Template>(`${this.base}templates/${id}/`, data);
  }

  async deleteTemplate(id: number): Promise<BaseApiResponse<void>> {
    return this.delete<void>(`${this.base}templates/${id}/`);
  }

  async getTemplateItems(id: number): Promise<BaseApiResponse<Item[]>> {
    return this.get<Item[]>(`${this.base}templates/${id}/items/`);
  }

  async getTemplateTriggers(id: number): Promise<BaseApiResponse<Trigger[]>> {
    return this.get<Trigger[]>(`${this.base}templates/${id}/triggers/`);
  }

  // ─── Items ─────────────────────────────────────────────────────────────────

  async getItems(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<Item[]>> {
    const qs = this.buildQueryString(params);
    return this.get<Item[]>(`${this.base}items/${qs}`);
  }

  async getItem(id: number): Promise<BaseApiResponse<Item>> {
    return this.get<Item>(`${this.base}items/${id}/`);
  }

  async createItem(data: ItemFormData): Promise<BaseApiResponse<Item>> {
    return this.post<Item>(`${this.base}items/`, data);
  }

  async updateItem(
    id: number,
    data: Partial<ItemFormData>
  ): Promise<BaseApiResponse<Item>> {
    return this.patch<Item>(`${this.base}items/${id}/`, data);
  }

  async deleteItem(id: number): Promise<BaseApiResponse<void>> {
    return this.delete<void>(`${this.base}items/${id}/`);
  }

  // ─── Triggers ──────────────────────────────────────────────────────────────

  async getTriggers(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<Trigger[]>> {
    const qs = this.buildQueryString(params);
    return this.get<Trigger[]>(`${this.base}triggers/${qs}`);
  }

  async getTrigger(id: number): Promise<BaseApiResponse<Trigger>> {
    return this.get<Trigger>(`${this.base}triggers/${id}/`);
  }

  async createTrigger(
    data: TriggerFormData
  ): Promise<BaseApiResponse<Trigger>> {
    return this.post<Trigger>(`${this.base}triggers/`, data);
  }

  async updateTrigger(
    id: number,
    data: Partial<TriggerFormData>
  ): Promise<BaseApiResponse<Trigger>> {
    return this.patch<Trigger>(`${this.base}triggers/${id}/`, data);
  }

  async deleteTrigger(id: number): Promise<BaseApiResponse<void>> {
    return this.delete<void>(`${this.base}triggers/${id}/`);
  }

  // ─── Problems ──────────────────────────────────────────────────────────────

  async getProblems(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<Problem[]>> {
    const qs = this.buildQueryString(params);
    return this.get<Problem[]>(`${this.base}problems/${qs}`);
  }

  async getProblem(id: number): Promise<BaseApiResponse<Problem>> {
    return this.get<Problem>(`${this.base}problems/${id}/`);
  }

  async createProblem(
    data: Partial<Problem>
  ): Promise<BaseApiResponse<Problem>> {
    return this.post<Problem>(`${this.base}problems/`, data);
  }

  async acknowledgeProblem(
    id: number,
    message?: string
  ): Promise<BaseApiResponse<Problem>> {
    return this.post<Problem>(`${this.base}problems/${id}/acknowledge/`, {
      message,
    });
  }

  async resolveProblem(id: number): Promise<BaseApiResponse<Problem>> {
    return this.post<Problem>(`${this.base}problems/${id}/resolve/`);
  }

  async deleteProblem(id: number): Promise<BaseApiResponse<void>> {
    return this.delete<void>(`${this.base}problems/${id}/`);
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  async getEvents(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<Event[]>> {
    const qs = this.buildQueryString(params);
    return this.get<Event[]>(`${this.base}events/${qs}`);
  }

  async getEvent(id: number): Promise<BaseApiResponse<Event>> {
    return this.get<Event>(`${this.base}events/${id}/`);
  }


  // ─── Actions ───────────────────────────────────────────────────────────────

  async getActions(
    params?: Record<string, unknown>
  ): Promise<BaseApiResponse<Action[]>> {
    const qs = this.buildQueryString(params);
    return this.get<Action[]>(`${this.base}actions/${qs}`);
  }

  async getAction(id: number): Promise<BaseApiResponse<Action>> {
    return this.get<Action>(`${this.base}actions/${id}/`);
  }

  async createAction(data: Partial<Action>): Promise<BaseApiResponse<Action>> {
    return this.post<Action>(`${this.base}actions/`, data);
  }

  async updateAction(
    id: number,
    data: Partial<Action>
  ): Promise<BaseApiResponse<Action>> {
    return this.patch<Action>(`${this.base}actions/${id}/`, data);
  }

  async deleteAction(id: number): Promise<BaseApiResponse<void>> {
    return this.delete<void>(`${this.base}actions/${id}/`);
  }

  async getActionConditions(
    actionId: number
  ): Promise<BaseApiResponse<ActionCondition[]>> {
    return this.get<ActionCondition[]>(
      `${this.base}action-conditions/?action=${actionId}`
    );
  }

  async createActionCondition(
    data: Partial<ActionCondition> & { action: number }
  ): Promise<BaseApiResponse<ActionCondition>> {
    return this.post<ActionCondition>(`${this.base}action-conditions/`, data);
  }

  async deleteActionCondition(id: number): Promise<BaseApiResponse<void>> {
    return this.delete<void>(`${this.base}action-conditions/${id}/`);
  }

  async getActionOperations(
    actionId: number
  ): Promise<BaseApiResponse<ActionOperation[]>> {
    return this.get<ActionOperation[]>(
      `${this.base}action-operations/?action=${actionId}`
    );
  }

  async createActionOperation(
    data: Partial<ActionOperation> & { action: number }
  ): Promise<BaseApiResponse<ActionOperation>> {
    return this.post<ActionOperation>(`${this.base}action-operations/`, data);
  }

  async deleteActionOperation(id: number): Promise<BaseApiResponse<void>> {
    return this.delete<void>(`${this.base}action-operations/${id}/`);
  }


  // ─── Dashboard widgets ─────────────────────────────────────────────────────

  async getDashboardWidgets(): Promise<BaseApiResponse<DashboardWidget[]>> {
    const res = await this.get<PaginatedResponse<DashboardWidget> | DashboardWidget[]>(
      `${this.base}dashboard-widgets/`
    );
    if (res.data && !Array.isArray(res.data) && "results" in res.data) {
      return { ...res, data: res.data.results };
    }
    return res as BaseApiResponse<DashboardWidget[]>;
  }

  async getDashboardWidget(id: number): Promise<BaseApiResponse<DashboardWidget>> {
    return this.get<DashboardWidget>(`${this.base}dashboard-widgets/${id}/`);
  }

  async createDashboardWidget(
    data: DashboardWidgetFormData
  ): Promise<BaseApiResponse<DashboardWidget>> {
    return this.post<DashboardWidget>(`${this.base}dashboard-widgets/`, data);
  }

  async deleteDashboardWidget(id: number): Promise<BaseApiResponse<void>> {
    return this.delete<void>(`${this.base}dashboard-widgets/${id}/`);
  }

  async getGraphData(params: {
    item_id: string | number;
    hours?: number;
  }): Promise<BaseApiResponse<GraphDataResponse>> {
    const qs = this.buildQueryString(params);
    return this.get<GraphDataResponse>(`${this.base}graph-data${qs}`);
  }

  async lookupHosts(
    search?: string
  ): Promise<BaseApiResponse<MonitoringLookupHost[]>> {
    const qs = search ? this.buildQueryString({ search }) : "";
    return this.get<MonitoringLookupHost[]>(`${this.base}lookup/hosts${qs}`);
  }

  async lookupItems(params: {
    host_id: string | number;
    search?: string;
  }): Promise<BaseApiResponse<MonitoringLookupItem[]>> {
    const qs = this.buildQueryString(params);
    return this.get<MonitoringLookupItem[]>(`${this.base}lookup/items${qs}`);
  }
}
