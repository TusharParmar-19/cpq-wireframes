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

- **Service Management** — `service-master.html` (independent Service Master; **full-width table is the default**, with an optional full-page detail view)
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
   - Confirm the full-width register table is shown first (not the old split-pane tree + details).
   - Search and filter by main/sub-service and status; confirm counts match visible rows.
   - Click **View Details** and **Back to Services**; editing a row should keep the register open.
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
