# CPQ V2 — Global Quick Create (Inline Master Creation)

## User experience
On an eligible record-selection field, the last dropdown choice is **+ Add New [record]**. Checkbox-based service scope, product/model pickers, part lists, and employee company-specific role/branch assignments use a corresponding Add New button. Select it to open the original master form in a dialog, without navigating away from the current form. Validation, required fields, identifiers and the normal save operation are reused. A successful save updates the browser's shared demo records, refreshes compatible options and selects the new record when eligible. Cancel does not change the original selection or discard unsaved parent form input. A separately saved master remains saved even if the parent draft is later cancelled.

## Covered controls
| Workspace | Quick Create |
|---|---|
| MA-002 Organizations | Original legal entity and branch forms are reusable; branch context is retained |
| MA-003 Users & Roles | Original Add Employee / Create Custom Role (including confirmation); role and branch creation from employee assignment groups |
| MA-004 Customers | Internal company, branch, relationship owner; group buyer, contact, site and project forms reusable in the correct customer context |
| MA-005 Enquiries | Customer account, group buyer, contact, site, project, internal entity/branch, owner, service/sub-service, editable enquiry source/type |
| Service Management | Parent service, optional linked product model, editable domain/work type/unit |
| MA-006A Product Catalog | Manufacturer, product group, category, parts; existing full Add Product wizard reused from configuration/quotation pickers |
| MA-006A Configuration | Customer/buyer, contact/site/project, entity/branch/owner, enquiry, service/sub-service, product model |
| MA-006 Quotations | Same context selections, product/service BOQ picker, custom expense type and payment terms template |

Product groups can still be created together with a product. A standalone group form uses the existing family fields, not a second schema. The old abbreviated manufacturer wizard shortcut is replaced by the original full Manufacturer form. Editable lists without an earlier standalone form use one reusable simple list-option editor. New values are duplicate-checked. Custom expense types use the existing Other custom cost method, default to internal-only, and do not invent new calculation formulas.

## Business rules
- Do not decorate search/filter dropdowns, system states, approval decisions, yes/no flags, currency, role visibility semantics, calculation methods, product behavior types or technical field templates whose schema must be deliberately designed.
- Buyer companies can only be added to Group customer accounts. Contact/site/project/enquiry selection requires the correct customer/buyer.
- New internal companies/branches remain separate from a customer's authorized selling scope. Do not silently link them to a customer; use the existing Link Internal Company & Branch form where necessary.
- Newly invited employees cannot become active responsible owners automatically. New Draft manufacturer/groups can be referenced during draft product creation, not treated as approved masters. A Draft model saved from a configuration/quotation/service-link picker cannot be selected as an Active model until the existing review rules are satisfied. Services must be Active for new enquiry/quotation scope. A created record that is not eligible remains saved; the prior selection stays unchanged and the reason is displayed.
- Real permissions, company/branch scope, master approval, validation, audit and duplicate protection are server responsibilities. No real authorization or activation is implied by this static demo.
- Supplier/vendor creation, a general-purpose equipment-field-template designer, and other unimplemented masters remain future work. Free-text fields such as designation and department are not represented as fictitious master dropdowns.

## Implementation
`cpq-quick-create.js` handles explicit eligible fields, same-origin popup requests, result token/origin/source checks, in-place shared-master synchronization and the small editable-list form. Each source module exports a creation adapter that opens its existing editor and notifies Quick Create only after its normal validated save. `cpq-quick-create.css` styles the popup and embedded master view. Existing page data, quotation/configuration drafts, approvals, prices and snapshots remain separate. Fixes to hydrated entity, employee and custom role ID generation prevent reuse of existing IDs during repeated creation.

## Acceptance checklist
1. Add a product; enter a model/SKU and choose Manufacturer → + Add New. Fill the original manufacturer form. Save and verify selected manufacturer, unchanged model/SKU fields, and shared manufacturer record after refresh.
2. Open the Product Group dropdown and create a matching-template group. Verify selected group; cancel a second attempt and verify original input/selection remains. Add a new category from Advanced classification, and choose it later on another product.
3. Start a new enquiry. Use Customer → + Add New; create the customer, buyer and internal scope; verify the selected customer and dependent buyer options. Add contact/site/project for that exact buyer. Create an Active service via the service picker, check it is selected and retained on enquiry save.
4. In a customer's create form, add internal company, then branch. Confirm the branch belongs to the correct company. In a scoped quotation/enquiry, verify unrelated internal company/branch is not automatically selected.
5. In Add Employee, create a custom role through its original permission review/confirmation, then add a branch within one company. Confirm role/branch selection and no new active account or real authorization.
6. In configuration and quotation, add a product via the original wizard. Confirm new Draft is saved but not selected until eligible. Existing active model selections remain unchanged. In quotation, add an Active service and check selected BOQ picker entry.
7. In Pricing & Costing, create a reusable cost type. Verify cost defaults to internal-only, existing methods and totals remain correct. In Final Quotation, add payment terms template, confirm it fills payment terms and persists.
8. Cancel a popup, close it with Escape, and repeat after editing other parent fields. Verify no accidental sentinel value is saved. Test duplicate manufacturer/category, incorrect buyer, mismatched group template, inactive records and nested popup creation.
9. Save and refresh the original draft, reopen the relevant master and verify the record persists. Check existing historical quotation pricing, snapshots and service/package rules are unchanged.
10. Run visual and keyboard testing in Chromium/Edge and at narrower viewport widths. The wireframe uses browser-local storage and fictional data only; do not enter confidential or real personal data.

## Production implementation
Laravel + React should replace embedded demo pages with one shared form component per master (dialog or standalone route), a centralized permission-gated creation API, validated scoped foreign keys, transaction-safe unique constraints, server-authoritative IDs and audit, query cache invalidation and automatic selection of eligible returned records. All controlled option lists require explicit management policies. Neither client-side option visibility nor the browser-demo save callback is an authorization boundary.
