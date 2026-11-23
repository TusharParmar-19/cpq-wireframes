# Separate Service Master — CPQ V2 Wireframe Contract

**Status:** Browser-only wireframe; first of the pre-development updates. **No production authentication, database, approvals, customer selection, or quotation issuing.**

## Agreed structure

- **Service Master is independent** of the Product Master. A service can exist without a product.
- A service can have **zero, one or multiple child sub-services**. Sub-services use an optional `parentId`. Nested levels are supported, while the UI presents the hierarchy as one register.
- A service can have **zero or multiple suggested product links**. The link is to an **exact manufacturer/model/SKU variant ID**, not only the product family.
- The same product model can be suggested by multiple services. One manufacturer can provide models in multiple product families. Existing catalog families and manufacturer/model records are not changed.
- Linking a product **never automatically adds it to a configuration or BOQ and never approves or charges for it**.
- Main services can be selected directly; child services may be selected individually. Customer enquiry selection, quotation imports and package/line billing will be wired in the next step.
- Draft/Active/Inactive and demo change history are **design examples**, not real permissions or technical approval.
- Service codes are unique, and changing a parent cannot create a circular hierarchy.
- No deletion is offered; retain historical references and use Inactive when appropriate.

## Current wireframe screens

- **Service Management** — `service-master.html` (independent Service Master; **main-service table is the default with sub-services collapsed**. Expand a row to reveal children. **View Details** shrinks the table to the left and shows the detail panel on the right; **Expand Table** restores full width.)
- **Product Catalog & Configuration** — `ma-006a-configuration.html` (unchanged product group/model behavior)
- **MA-005 Opportunities & Enquiries** — existing; service selection wiring is **next**
- **MA-006 Quotations & BOQ** — existing; mixed service/product BOQ and packages will be wired **after enquiry selection**

## Minimal service fields

Service `id` (demo-generated); unique `code`; `name`; optional `parentId`; `domain`; `workType`; `unit`; `status`; `description`; `scope`; `deliverables`; `notes`; optional `productIds[]`; `updatedAt`; demo `history[]`.

Seed data includes the seven previously discussed main offerings with illustrative sub-services. **It is demonstration data, not an approved final business catalog.**

## Legacy compatibility

Existing MA-006A `FAM-004` service item and MA-006 `SRV-*` example quotation lines are intentionally **not deleted**. They stay for backward compatibility with the current browser demo. Do not treat those legacy lines as a second production Service Master. During Laravel development, convert them to proper Service Master references without losing existing quotations or snapshots.

## Browser persistence

The new `services` module is registered in `cpq-demo-store.js` and uses the existing V2 localStorage document. No schema bump: older browser demo state without `services` uses the sample default data on the new page; saving services adds only that module.

## Manual acceptance checks

1. Open `service-master.html` from MA-001, MA-003, MA-005 and MA-006A navigation.
   - On first load, confirm only seven main-service rows are visible; their sub-services are collapsed behind accessible expand arrows.
   - Expand Residential Solar and confirm its four children appear directly below. Collapse it and confirm they are hidden again.
   - Expand All and Collapse All should work for the visible hierarchy; nested children can be expanded individually.
   - Search for a sub-service in a collapsed group; the matched child and its ancestor service should become visible.
   - Search and filter by main/sub-service and status; compare counts with the visible table rows.
   - Click **View Details**: the table should remain on the left in a compact layout, and the selected service's full details appear on the right.
   - Select a different service from the compact table without leaving the detail view.
   - Click **Expand Table** (from table header or details); full-width table returns with prior expanded rows preserved.
   - Edit from the full-width table and from details; confirm data changes persist and existing product links are not removed.
   - On narrower devices, the list and details stack and tables remain horizontally scrollable rather than overflowing.
2. Verify seven main service offerings, plus nested sub-services, appear separately from Products.
3. Create a main service as Draft with a unique code; select it and edit its details.
4. Add a sub-service under the selected main service; confirm parent label and child list.
5. Create an additional nested sub-service; verify tree indentation and ancestry.
6. Try to assign a service below its own child; the UI must prevent circular parenting.
7. Try a duplicate service code; save must be rejected.
8. Link one or more Active exact SKU models; verify SKU/manufacturer/model display.
9. Remove all product mappings from a service; it must still save correctly.
10. Reload the page and verify changes are retained in this browser. Reset demo storage to restore defaults.
11. Visit Product Catalog and Quotation demo; existing variants and quote examples must remain available.
12. Confirm there is no claim that demo product links create billable BOQ lines or represent real permissions.

## Next wireframe changes before Laravel

1. Connect MA-005 Enquiry to one or more active Service Master services and optional child services.
2. Support product-only, service-only, and combined paths to MA-006A Configuration and MA-006 Quotation.
3. Prevent double charging of package/parent and included children.
4. Expand Product Master fields, document-upload UX, metadata and versions without losing manufacturer-model variants.
5. Reflect service and product permissions in MA-003 design.
6. Freeze the approved wireframe and translate these relationships into Laravel/MySQL migrations, policies and tests.

## Usability refinement — 23 November 2026

- Use a single **Expand Table** control in the **right-side details header**; do not duplicate it in the compact left register.
- When choosing a nested sub-service from the detail panel or table, reveal its ancestor chain, highlight the matching left-table row and scroll that row into view within the compact register.
- The compact register gets its own height-limited scroll region with a sticky heading; no data or parent-child links are discarded.
