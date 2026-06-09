import { leadService } from "../api/dev/Service/LeadService.js";
export function createContactLeadsPanel() {
    const wrapper = document.createElement("section");
    wrapper.className = "contacts-shell";
    wrapper.setAttribute("aria-label", "Leads från extern API");

    const panel = document.createElement("div");
    panel.className = "contacts-master";
    panel.style.width = "100%";

    const title = document.createElement("h2");
    title.textContent = "Leads";

    const description = document.createElement("p");
    description.style.color = "var(--text-dim)";
    description.textContent = "Hämta leads via Features API → Hunter.io.";

    const formRow = document.createElement("div");
    formRow.className = "contacts-actions";
    formRow.style.display = "flex";
    formRow.style.gap = "8px";
    formRow.style.flexWrap = "wrap";

    const input = document.createElement("input");
    input.className = "contacts-search";
    input.placeholder = "Exempel: stripe.com";
    input.value = "stripe.com";
    input.style.maxWidth = "260px";

    const enrichBtn = document.createElement("button");
    enrichBtn.textContent = "Hämta från Hunter";

    const loadSavedBtn = document.createElement("button");
    loadSavedBtn.textContent = "Ladda sparade leads";

    const status = document.createElement("div");
    status.className = "contacts-count";
    status.textContent = "";

    const result = document.createElement("div");
    result.className = "contacts-list";

    enrichBtn.onclick = async () => {
        const domain = input.value.trim();
        if (!domain) return;

        status.textContent = "Hämtar leads från extern API...";
        result.innerHTML = "";

        try {
            const data = await leadService.enrichDomain(domain);
            renderHunterResult(result, data);
            status.textContent = "Extern API-träff lyckades.";
        } catch (error) {
            console.error(error);
            status.textContent = "Kunde inte hämta leads.";
            result.innerHTML = `<div class="contacts-empty-state">Kunde inte hämta data från Hunter.</div>`;
        }
    };

    loadSavedBtn.onclick = async () => {
        status.textContent = "Laddar sparade leads...";
        result.innerHTML = "";

        try {
            const leads = await leadService.loadLeads({ page: 1, pageSize: 50 });
            renderSavedLeads(result, leads);
            status.textContent = `${leads.length} sparade leads hämtade.`;
        } catch (error) {
            console.error(error);
            status.textContent = "Kunde inte ladda sparade leads.";
            result.innerHTML = `<div class="contacts-empty-state">Kunde inte ladda sparade leads.</div>`;
        }
    };

    formRow.append(input, enrichBtn, loadSavedBtn);
    panel.append(title, description, formRow, status, result);
    wrapper.append(panel);

    return wrapper;
}

function renderHunterResult(container, data) {
    container.innerHTML = "";

    const emails = Array.isArray(data?.emails) ? data.emails : [];

    if (emails.length === 0) {
        container.innerHTML = `<div class="contacts-empty-state">Inga leads hittades.</div>`;
        return;
    }

    const header = document.createElement("div");
    header.className = "contacts-letter-header";
    header.textContent = data.organization || data.domain || "Hunter-resultat";
    container.append(header);

    emails.forEach(email => {
        const item = document.createElement("div");
        item.className = "contact-item";

        const avatar = document.createElement("div");
        avatar.className = "contact-item-avatar";
        avatar.textContent = (email.firstName || email.first_name || email.value || "?").charAt(0).toUpperCase();

        const info = document.createElement("div");
        info.className = "contact-item-info";

        const name = document.createElement("div");
        name.className = "contact-item-name";

        const firstName = email.firstName ?? email.first_name ?? "";
        const lastName = email.lastName ?? email.last_name ?? "";
        const fullName = `${firstName} ${lastName}`.trim();

        name.textContent = fullName || email.value || "Okänt namn";

        const meta = document.createElement("div");
        meta.className = "contact-item-role";
        meta.textContent = [
            email.position,
            email.department,
            email.confidence ? `${email.confidence}% confidence` : null,
            email.value
        ].filter(Boolean).join(" • ");

        info.append(name, meta);
        item.append(avatar, info);
        container.append(item);
    });
}

function renderSavedLeads(container, leads) {
    container.innerHTML = "";

    if (!Array.isArray(leads) || leads.length === 0) {
        container.innerHTML = `<div class="contacts-empty-state">Inga sparade leads hittades.</div>`;
        return;
    }

    const header = document.createElement("div");
    header.className = "contacts-letter-header";
    header.textContent = "Sparade leads";
    container.append(header);

    leads.forEach(lead => {
        const item = document.createElement("div");
        item.className = "contact-item";

        const avatar = document.createElement("div");
        avatar.className = "contact-item-avatar";
        avatar.textContent = (lead.firstName || lead.email || "?").charAt(0).toUpperCase();

        const info = document.createElement("div");
        info.className = "contact-item-info";

        const name = document.createElement("div");
        name.className = "contact-item-name";
        name.textContent = `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || lead.email || "Namnlös lead";

        const meta = document.createElement("div");
        meta.className = "contact-item-role";
        meta.textContent = [
            lead.position,
            lead.organization,
            lead.email,
            lead.assignedToName
        ].filter(Boolean).join(" • ");

        info.append(name, meta);
        item.append(avatar, info);
        container.append(item);
    });
}