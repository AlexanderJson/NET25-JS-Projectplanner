import { leadApi } from "../leadApi.js";

export class LeadService {
    constructor(api = leadApi) {
        this.api = api;
        this.leads = new Map();
        this.lastEnrichment = null;
        this.pageInfo = {
            page: 1,
            pageSize: 20,
            totalCount: 0,
            totalPages: 0
        };
    }

    async loadLeads(options = {}) {
        const result = await this.api.getAll(options);
        const leads = Array.isArray(result?.data) ? result.data : [];

        this.leads.clear();

        leads.forEach(lead => {
            if (!lead?.id) return;
            this.leads.set(String(lead.id), lead);
        });

        this.pageInfo = {
            page: result?.page ?? 1,
            pageSize: result?.pageSize ?? leads.length,
            totalCount: result?.totalCount ?? leads.length,
            totalPages: result?.totalPages ?? 1
        };

        return this.getCachedLeads();
    }

    async enrichDomain(domain) {
        const result = await this.api.enrichDomain(domain);
        this.lastEnrichment = result;
        return result;
    }

    async importDomain(domain) {
        const result = await this.api.importDomain(domain);
        await this.loadLeads();
        return result;
    }

    getCachedLeads() {
        return Array.from(this.leads.values());
    }

    getPageInfo() {
        return { ...this.pageInfo };
    }

    getLastEnrichment() {
        return this.lastEnrichment;
    }
}

export const leadService = new LeadService();