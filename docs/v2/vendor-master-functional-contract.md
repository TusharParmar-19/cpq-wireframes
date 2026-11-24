# V2 Vendor / Supplier Master — Phase 1 functional contract

Scope: SRS 11.6, AC-P1-009, PG-050–052. This is the connected V2 browser prototype, not a production application.

- Full-width vendor register, search and company/status/preferred filters; select a vendor for compact table plus right-side details; expand to return to table.
- Only vendor name and at least one of our legal entities are required. Status defaults Active; preferred is a sourcing preference, not approval. One record can be shared with selected internal entities. Inactive suppliers remain in history.
- Optional contacts (multiple, first shown in table), GSTIN/PAN, address, website, internal notes, product categories, exact SKU/model IDs, service/sub-service IDs, document filename/type metadata. Company and association pickers use existing master records and Quick Create; inactive/draft models and services cannot be newly linked. A separately saved master remains saved on cancel.
- Stable generated VEN identifier; case/whitespace-normalized name and GSTIN duplicate checks; contact and document IDs; edits preserve history; no hard-delete.
- Manufacturer, vendor, internal selling company and customer are separate identities. Vendor associations suggest sources; they do not change catalog prices, auto-charge a BOM or imply rate verification. Vendor quotation history will use the vendor ID when its workspace is implemented.
- Actual authorization, branch and tenant policy, confidential costs, private file upload/download, concurrent transactions and audit actor identity require Laravel + React + MySQL on the approved hosting plan. No real data in public wireframes.

Acceptance checks: create minimal vendor; reject duplicate; add two contacts, multiple companies, category, SKU and service; save and reopen; filter by name/company/status/preferred; edit, mark inactive and preserve existing links/history; attach metadata only; test Quick Create from product commercial supplier selector and back; verify original form fields survive. Vendor quotation capture, rate verification, supplier offer links to pricing and historical rate snapshots are next, not implemented by this master.

Product-side preferred supplier is a stable vendor ID; supplier details also display products which reference that ID. This is distinct from the vendor's manually maintained supply associations. Legacy supplier reference text remains preserved. Existing browser custom-role grants are not overwritten; grant the new page/action rights deliberately in MA-003.
