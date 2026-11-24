# CPQ V2 — Connected Services, Product Information & Quotation Flow

**Status:** Browser-only wireframe. This contract defines the intended source-to-quotation journey for a Laravel + React + MySQL implementation. It does **not** indicate that any real backend, RBAC, authorization, uploads, approval, PDF issuing, messaging or order creation exists.

## 1. Single workflow, three valid paths

**Source:** MA-004 Customer account / buyer / internal selling company and branch, with optional customer contact, site and project.

### A. Product-only
MA-004 Customer → MA-005 Enquiry (zero Service Master selections allowed) → MA-006A Configuration (optional if an item has no complex configuration) → MA-006 Pricing & Costing → Final Quotation → simulated technical/commercial review → simulated dispatch → recorded demo response.

### B. Service-only
MA-004 Customer → MA-005 Enquiry (one or more Active services/sub-services) → **directly** MA-006 Pricing & Costing → Final Quotation. MA-006A technical equipment configuration is **not mandatory**. Selected active services are imported as initially unpriced BOQ lines, with service IDs and compact service-scope snapshots. Set sample selling prices for billable lines, finalize terms and run the same simulated review/dispatch/response steps.

### C. Combined
MA-004 Customer → MA-005 Enquiry (one or more services/sub-services) → MA-006A Configuration (optional products, manufacturer models, technical project requirements) → MA-006 Pricing & Costing (models plus selected services and additional costs) → Final Quotation → simulated review/dispatch/response.

**Navigation:** MA-005 `Prepare quotation` offers both `Configure Products First` and `Direct Pricing / Quotation`. MA-006A **Continue to Pricing** uses a saved `?configuration=CF-...` identifier to open MA-006 directly at Pricing & Costing; a legacy `?configData=...` demo link remains supported.

## 2. Separate master records

- **Service Master (`service-master.html`):** Independent main services and unlimited-level nested sub-services using `parentId`. A service may exist without any products. Service ↔ product association is optional, many-to-many, and references an **exact** manufacturer/model/SKU variant. These are **suggestions**, not included or automatically billable line items.
- **Product Master (`ma-006a-configuration.html`):** Preserves independent product families, multiple manufacturers per family, multiple model variants per manufacturer, exact SKU, dimensions, electrical and general category-specific attributes, technical notes, warranty and guarantee, photos, blueprints, manuals, datasheets and certifications (file metadata in the demo).
- One internal **selling** company/branch is not assumed to be a manufacturer or a supplier; multi-company and branch associations remain separate.
- Legacy example service variants such as `SRV-TEST-01` and the old `FAM-004` are preserved for historical/configuration demo compatibility. They are **not** the new Service Master, and fresh catalog model pickers exclude legacy service-type items where applicable.

## 3. Selection and persistence

- **MA-005** new/edit enquiry has optional checkboxes for active services and child services. The persisted `opportunity.serviceIds[]` links back to Service Master IDs, independent of physical products.
- **MA-006A** receives customer/buyer/company/branch/contact/site/project and `serviceIds[]` from an enquiry. Its own customer/project form can edit the service selection. Configuration product lines store exact model references, quantities, selected options, project overrides and `modelSnapshot` technical details.
- **MA-006** receives source enquiry information and available service IDs. Direct quotation creates unpriced service BOQ lines; configuration-by-ID quotation imports saved product and service selections. A quotation may have product-only, service-only or mixed lines.
- Service-to-product associations prioritize suggested manufacturer/model/SKU choices but never insert extra products into a quotation.
- Existing shared localStorage demo modules are maintained (service, catalog, customers, opportunities, configurations, quotations). Reload/navigation to another page rehydrates and rebuilds related records.

## 4. Parent-child billing

When both a parent service and its descendant are selected in a quotation, the child has `includedInParent=true` and `unitPrice=0` by default. The quote **does not charge again** for included children.

When selected on its own, a child service is independently billable and needs an explicit selling rate. When a parent is removed, the child becomes eligible for an independent rate; a seller must enter it.

**Production decision to finalize:** Whether a particular child service is always included, optional extra, or independently chargeable must be configurable per service/package/quotation line. The wireframe's included-by-default rule is a safe illustration, not a final business price policy.

## 5. Snapshot integrity

- A service BOQ line carries `serviceSnapshot` (ID, name, code, work type, scope, unit, parent and other model information). Descriptions and scope use the stored line snapshot instead of silently re-reading Service Master each time.
- A configured model line carries `modelSnapshot` (exact SKU, manufacturer, model, dimensions, solar specs, category specs, warranty, and references to current document records).
- `modelSnapshot.documentRefs[]` contains **metadata only** (name/type/version/visibility). The public wireframe does not upload/store actual documents or make them downloadable.
- When importing an existing saved configuration, use that configuration's **previously captured** product snapshot where present, rather than replacing it silently with current Product Master values. If the current catalog changed, flag technical re-review.
- Quotation draft edits, reviews and customer response simulation do **not** constitute legally immutable issued revisions. Laravel must enforce version locks, access policies and audit records server-side.

## 6. Cross-page related records

- **MA-004 Customer** Related Records lists linked Enquiries and Quotations, together with readable selected service names.
- **MA-005 Enquiry** displays selected Services & Sub-services, links the saved quotation, and shows the last simulated response if available.
- **MA-006A Configuration** links back to the source enquiry/quote and carries the service/model selections.
- **MA-006 Quotation** shows service scope, mixed BOQ, technical/document reference summary, quote status and sample review/dispatch/response.
- Simulated `Accepted`, `Rejected` or `Changes Requested` responses can appear in related customer and enquiry records after saved-demo reload; no customer is actually contacted and no order is created.

## 7. Access/permission design

**MA-003** has planned `Service Master` and `Product Documents` pages and action permissions:

- `services.view/create/edit/manage/link_products`
- `product.specs.edit`, `product.warranty.edit`
- `product.documents.view/upload/archive`

These are a **permission matrix preview**, not enforced authentication/authorization. In Laravel, apply role permissions and record-, company-, branch-, sensitive-field- and action-level checks to every server request. Master Admin can configure role templates but is not an automatic independent technical/commercial approver.

## 8. Browser acceptance checklist

### Test A — Product-only
1. Open MA-004 and choose/create a fictional customer with buyer and selling scope.
2. Create a fictional MA-005 enquiry without choosing any Service Master service; save and reopen.
3. Use `Direct Quotation` for simple supply, or create MA-006A Configuration and select one or more **Active** product SKUs.
4. Enter positive fictional selling rates, payment/validity/delivery conditions, save quote.
5. Confirm quote BOQ product model/SKU and quantity match and that MA-004/MA-005 show the link.

### Test B — Service-only
1. Open MA-005; create an enquiry with Active main service **Residential Solar** (`SVC-002`) plus **Site Survey** (`SVC-008`).
2. Save, reopen and choose `Prepare quotation → Direct Quotation`.
3. Confirm service lines import with scope, no required technical product configuration, and child marked **Included in parent package**.
4. Set a positive fictional sample rate **only on the parent billable line**; verify child remains ₹0 and is not double-counted.
5. Save, reopen and confirm selected service IDs and quotation total persist.

### Test C — Combined
1. Create or edit an MA-005 enquiry selecting Active services.
2. Choose `Configure Products First` and verify the service selections and customer context appear in MA-006A.
3. Add Active manufacturer-specific model/SKU and quantity, confirm saved model technical/warranty/document metadata references; save configuration.
4. Click `Use in Quotation`. Verify the configuration ID/revision is linked, the product lines and Service Master services appear, and any included child is not separately priced.
5. Update only fictional sample prices, save; edit the Product Master afterward and verify existing configuration/quotation snapshots do not silently change.

### Test D — Simulated customer response
1. Open a suitable unissued saved draft quote with valid positive sample rates and complete fictional terms.
2. In MA-006, `Submit Demo Review` and record simulated technical and commercial decisions.
3. Open `PDF & Response` and `Simulate dispatch`; no actual PDF/email/WhatsApp is created.
4. `Record demo response: Accepted` with fictional evidence reference.
5. Navigate to MA-005 and MA-004 Related Records; confirm their links reflect simulated response after browser reload.
6. Confirm **no production approval, customer acceptance verification or order creation** is implied.

### Regression tests
- Existing legacy quotes, SKU variants, solar configurations and customer records are preserved.
- Product models from different manufacturers in the same family retain separate specs, pricing and documents.
- No hidden automatic product charges arise from optional service–product mapping.
- A child service can be quoted independently; multiple nested child services remain supported.
- Missing/inactive service IDs cannot be newly selected for new quotations.
- Role page/action catalog contains valid permissions, but wireframe does not claim to enforce them.
- A selected PDF/blueprint/manual contributes **metadata only**, not file bytes.

## 9. Laravel implementation handoff (non-negotiable)

The production system needs a server-side authorization and company/branch scope model; separate `services`, `products`, `product_variants`, `service_products`, `enquiry_services`, `configuration_lines`, and `quotation_lines` relationships; private secured product file storage; secure upload validation and download; company-specific effective prices; pricing/tax calculations; service-package policy; signed technical/commercial decisions; immutable issued quote revisions; auditable dispatch/acceptance; and backup/restore. These are **not** implemented by the static wireframe.

**Freeze criteria:** Run tests A–D and confirm that Sir approves the Service Master and Product Master data relationships before converting the behavior into Laravel migrations, policies, services and integration tests.


## Pricing & Costing extension — November 2026

The MA-006 quotation builder now contains five distinct stages: **Customer & Project → Products & BOQ → Pricing & Costing → Final Quotation → Review & Save**. Valid saved configuration handoffs enter stage 3 with their original context, services and exact model/SKU snapshots. Direct quotes remain supported and can select BOQ lines first. Go back to the BOQ or pricing stages without altering the source configuration or Product Master.

- **Automatic price capture:** New catalog lines copy the sample list selling rate, list name, displayed effective dates, and available estimated purchase cost from the exact variant at draft entry. Unpriced services, unavailable rates and costs remain manual/unknown. The wireframe uses INR only; actual effective-date, company/branch-specific price lists, supplier offers, RFQ, currency, tax and access rules require backend validation. Older saved quotes are not silently repriced.
- **Quotation override:** Retain captured default and editable offered selling rate separately; reset to the captured default, not to a refreshed catalog rate. Changes record previous rate, new rate, reason, timestamp and a fictional employee. Manual or modified positive rates require a reason before simulated review. No change is written back to the catalog.
- **Additional cost rows:** Labour, installation, transportation, loading/unloading, engineering, survey, subcontractor, commission, administrative expenses, overhead, contingency and custom expenses. Methods are fixed amount, quantity × rate, % of direct BOQ cost, and % of net sale before tax (after discount). Internal costs reduce estimated profitability; optional separately offered customer charges are explicit editable amounts. Commission, overhead, administrative and contingency types stay internal. Avoid recording costs already included in direct unit costs.
- **Profit and margin:** Standard/negotiated rates are the default. Cost-plus target is optional and explicitly applied; allocate the target to billable BOQ rates after subtracting separately offered charges. Percentage-of-sale costs are included in the target equation; impossible combinations or unknown unit costs block automatic target application. Actual profit after discounts is net sale excluding tax less estimated direct and additional costs; margin is profit / net sale, markup is profit / cost. No profit is invented for incomplete cost estimates. Unit-rate rounding can cause small target differences.
- **Included services:** Parent-package child lines stay zero additional revenue. Enter their cost separately only when not already counted on the parent; use explicit zero if no additional cost.
- **Final quotation:** Only offered product/service rates, explicitly separated customer charges, discount, illustrative tax, and customer-facing terms are included in the paper layout. Internal purchase cost, expenses, commission, target profit, margin and override history remain in the internal workspace. Final terms can be edited and the preview reflects them. Return to pricing before saving. Quote-specific pricing and original captured rate snapshots persist in the existing browser-only quotation record; no actual issue or dispatch is performed.
- **Review & permissions:** Add MA-003 pricing-workspace action definitions (override rates, edit costs, apply target). Real users, cost/margin visibility, company/branch access, approval limits, effective rates, financial validation, immutable quote revisions and PDFs must be enforced in Laravel; this static demo does not enforce security. Editing a previously reviewed draft resets its sample approval where the material record (including pricing) changes.

### Additional acceptance checks

1. Open a saved valid configuration and click Continue to Pricing. Verify quantities, model snapshots and default rates.
2. Change an offered rate, provide a reason, and verify the master price remains unchanged and Reset restores the captured default. Reopen the saved draft after changing the master catalog: captured rates must remain unchanged.
3. Add labour (fixed), transportation (quantity × rate), and commission (% of net sale). Check internal costs, explicit public freight, tax/discount and margin. Confirm commission and internal-only expenses are not printed in the customer preview.
4. With complete costs, choose cost-plus target, set a markup and apply it explicitly. Verify manual rate editing is still available; unknown costs prevent the target from being applied. Included package children must never add revenue.
5. Continue to Final Quotation, edit terms, preview, Review & Save. Reopen the saved draft and verify retained cost rows, override reasons/history, customer total and public charges. Test product-only, service-only and combined paths; no real approval, issued PDF or actual sending occurs.
