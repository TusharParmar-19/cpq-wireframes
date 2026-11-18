# MA-006A — Product Catalog & Configuration: Design and Functional Contract

**Status:** Design/flow and prototype business checks baselined for initial development handoff, 18 November 2026. **NOT a production-ready implementation.** This contract sits with the MA-006A HTML prototype; consolidate its approved requirements into the project's main CPQ documentation before implementation.

## 1. Employee-facing principle

An employee should be able to add a model and create a solar configuration in three clear steps without understanding the data schema.

- Main navigation: **Product Catalog** and **Solar Configurations**.
- Secondary **Manage Masters**: manufacturers and reusable parts. Catalog Settings/field templates are an **admin-only planned capability**.
- UI language: **Product Groups** (internal entity: product family), **Models**, **Add Another Model**. Keep internal IDs and technical classifications out of normal decisions.
- Show only product-type-specific essential fields. Collapse advanced technical, dimensional, commercial and part-assignment sections by default.
- Show *what is missing*, not a wall of warnings. Do not claim a green demo check equals engineering approval.
- Draft creation must be possible with limited information; approval, quotation readiness, and issuance are separate gates.

## 2. Core entities and relationships

1. **Product Category** → many **Product Groups** (admin-maintained tree/taxonomy).
2. **Product Group / Family** → many **Product Models / Variants**. Family stores shared type, unit, defaults, equipment-field schema and category; *wattage, size, manufacturer and SKU belong to an exact variant*, not a new family by default.
3. **Manufacturer/Brand** → many **Models**. Manufacturer is **not** our internal selling entity and is **not necessarily** the commercial supplier.
4. **Exact Model** → SKU (unique), manufacturer, manufacturer model number, capacity/rating, dimensions and mass, type-specific electrical/structural/service attributes, documents, warranty/compliance references, lifecycle status and effective-dated commercial data.
5. **Parts/Accessories** → model-to-part assignments with quantity, unit, required/optional and future compatibility dependencies. A model's component references are not automatically a certified, generated system BOM.
6. **Commercial prices** are a separate protected price-list/version relationship: variant, currency, company/branch applicability, effective dates, tax classification, internal supplier cost, selling rate and approval history. An employee-visible catalog price is only a preview.
7. **Configuration** → header (type, purpose, customer/buyer, enquiry, customer site/project, internal selling company/branch, owner, notes) + **Configuration Lines** (exact active model/SKU or service, quantity/unit, selected approved options, project overrides, line notes).
8. **Configuration Revision** → immutable historical snapshot when a new revision is saved; later edits must not mutate a prior linked quotation's original source snapshot.
9. **Quote** → references a precise configuration revision and snapshots its source customer/buyer, items, descriptions, technical options, units and project context; quotation rates, discounts, taxes, terms and commercial approvals are owned by MA-006.

## 3. Add Product / Model (employee workflow)

**Step 1 — Basic Details**
- Choose equipment type (solar module/inverter/battery/mounting/cable/BOS/metering/service/general).
- System suggests matching **existing Product Group**; default to reuse. Explicit **Create new product group** only for a genuinely different group, never merely a different Wp or brand.
- New group creation collects name and optional advanced category/type/unit/attributes. Reject duplicates for normalized group name + equipment type.
- Choose manufacturer, exact model number, global-unique SKU and model/rating. Quick-add manufacturer creates **Draft** manufacturer to be reviewed, never instantly approved.
- A group or manufacturer change must not silently change an existing model's technical certification or original source identity.

**Step 2 — Specifications**
- Render only relevant type-specific fields (PV module power, Voc/Isc/Vmp/Imp, efficiency, construction; inverter AC/MPPT/DC ranges; battery kWh/chemistry/BMS; structure/roof/material; cable cross-section/voltage; BOS/protection; service scope).
- Advanced properties: temperature coefficients, physical dimensions/weight, datasheets, warranties, applicable IEC/BIS/ALMM/DCR references, optional associated components.
- Unknown data can remain blank for Draft; entered numeric fields must be valid. Prototype enforces PV Pmax/Voc/Vmp/Isc/Imp positive, Vmp below Voc, Imp not exceeding Isc, efficiency within 0–100%, and battery usable kWh not above nominal kWh.
- Production technical checks must be formally specified and approved by qualified engineers. No universal hard-coded rules based on illustrative data.

**Step 3 — Price & Save**
- Optional sample selling rate, availability, supplier reference, lead time, currency, effective dates, documents and notes.
- New group + model, new variant and quick-added manufacturer start as **Draft**. An Edit Model form **cannot** activate a product. Changes to Active product specifications should require technical review/controlled master revision.
- Separate permissions for seeing cost, editing prices, approving exceptions and editing master attributes.
- Save Draft never implies "price approved," "compliant," "stock available" or "ready to issue."

## 4. Solar Configuration workflow

**Step 1 — Project Details**: name, solar system type, target DC/AC capacities, roof and site. Optional expandable sections: site survey (roof, tilt, shade, setbacks, structural evidence), electricity/utility (DISCOM, sanctioned load, monthly kWh, tariff), engineering (strings, MPPT, storage, backup, generation assumptions, compliance), and linked customer context. If only one valid customer buyer/company/branch exists, suggest/default it; never silently choose from multiple legal buyers.

**Step 2 — Choose Equipment**: search/select exact **Active** catalog variants, set whole-number quantities, add line notes or project-specific overrides. Show selected lines and allow quantity updates and removal. A project-specific override is stored on the configuration line; it must **not** overwrite the shared manufacturer/SKU master. Duplicate line, substitutions, editing selected line and generated technical BOM are further developer requirements; avoid unintended duplicates in the production BOM.

**Step 3 — Review & Save**: show selected products, target vs selected DC capacity, inverter AC, DC/AC ratio, missing required links, technical follow-ups and separate engineering sign-off status. The prototype computes: DC kWp = SUM(PV module Pmax Wp × quantity) / 1000; AC kW = SUM(inverter rated AC kW × quantity); DC/AC ratio = selected DC / selected AC where AC > 0. This is a planning calculation, **not** string-voltage/MPPT validation or a certified solar design.

## 5. Explicit state gates

| Action / Gate | Minimum requirement | What is NOT implied |
| --- | --- | --- |
| **Save Product Draft** | Unique SKU, exact model, valid group/type, manufacturer for physical product; supplied numeric values coherent | No technical, price, brand or compliance approval |
| **Approve/Activate Model (production)** | Authorized technical review, mandatory datasheet/spec/standards evidence for the type, controlled supplier/commercial status and recorded approver/action | Not a simple status dropdown |
| **Save Configuration Draft** | Nonempty configuration name; preserve incomplete state and warnings | Not quote-ready or approved |
| **Use Configuration in Quotation (demo)** | No structural line errors; at least one item; for customer project: valid customer/buyer/internal company/branch/owner; for solar system: target DC, active PV modules and inverter; requested battery implies battery selection | Does not authorize issuance or replace engineering sign-off |
| **Use Reusable Template in Quotation** | Valid technical item selection; customer/buyer/selling entity selected and verified **in MA-006** before saving quote | No customer identity inferred from another project |
| **Issue/Send Quotation (production)** | Customer and legal buyer, permitted selling scope, verified equipment, approved rates/taxes/terms/exceptions, authorized technical/commercial approvals, locked immutable revision, generated PDF and audited dispatch | Never enabled just by sample check or a quote draft save |

Site fit, actual current/voltage/MPPT pairing, roof structural load, cable sizing, protection, yield estimates, certification applicability, supplier availability and installation scope **require independent engineering/commercial validation**.

## 6. Revisions, dependencies and audit

- Saving changes to an existing configuration increments C0 → C1 → C2, etc., preserving prior revisions as snapshots; copying a configuration starts new ID/C0 and clears previous quote association and historical lineage.
- On changing customer, clear buyer/contact/site/project/enquiry/internal scope/owner selections that could no longer be valid. On changing buyer, clear dependent contact/site/project/enquiry. Changing to reusable template clears customer-specific links.
- Verify contact, site, project and enquiry belong to selected customer and legal buyer. Verify branch belongs to internal company, company/branch is linked to customer (when customer-specific), and owner is active/assigned to that scope.
- Preserve master variant ID plus exact SKU and technical selection in configuration line; preserve a snapshot at quotation conversion. Later master edits must not silently rewrite a saved or issued quote.
- Log user/time/reason for activation, model revision, price change, exceptions, configuration revisions and quote conversions. The prototype stores revisions only in in-memory state.

## 7. MA-003 permission design (production)

Use permissions **and** company/branch record scope, not only human-readable role labels:
- Read catalog; create/edit product draft; propose new group; manage manufacturers/parts; change technical fields; view cost; edit price; request approval; approve/activate; archive/retire.
- Create/edit/copy configuration; view by company/branch; use in quotation; technical review/approval.
- Enforce authorization on API/database operations, not merely hide buttons. The user-facing UI presents only permitted actions.
- System admins can configure category/type/field template definitions in a controlled **Catalog Settings** screen (planned; not yet implemented in the browser demo).

## 8. Source integration and production boundaries

**Current browser demonstration**
- MA-006A HTML/JS stores modified catalog models and configuration revisions in JavaScript memory for the open page. A refresh clears changes.
- Hand-off to MA-006 currently passes fictional non-sensitive configuration selections using an encoded query string. MA-006 uses seeded sample catalog rates and creates an unissued demo draft. Do not pass real customer data via public URL or rely on separate in-memory page catalogs.
- Green checks are demo structural checks, not certified engineering or commercial approvals.
- The prototype has no database, server-backed roles, real approval flow, authenticated document storage, authoritative price list/tax engine, stock/supplier integrations or legally issuable quote.

**Production implementation required**
- Server-backed shared data model and APIs linking MA-004/MA-005/MA-006A/MA-006; transaction-safe ID/SKU uniqueness and relationships.
- Role-scoped, audited technical/commercial approvals and immutable revision history; project-level overrides with approval path.
- Authoritative product catalog, manufacturer evidence, compatibility/rules engine, genuine bill-of-material generation and engineering sign-off.
- Company/branch/buyer-specific effective-dated pricing, taxation, stock/supplier lead time and secured internal costs.
- Secure attachment storage and immutable quote snapshots; never trust a client-side query string as an authoritative configuration.
- Catalog Settings administrator UI for categories, field templates, product behavior and product-completeness requirements.

## 9. Acceptance checks for development/QA

1. Add 600 Wp model to existing Solar PV Module group; group count unchanged, model count +1.
2. Select **Create new product group**; a unique new group and first model appear, both Draft. Duplicate group/SKU rejected.
3. Change equipment type; visible essential fields change without inappropriate fields or silently approving data.
4. New/edited Draft remains Draft; status cannot be set Active by a non-approver; approval transitions are audited.
5. Edit one SKU's dimensions/prices; another manufacturer's model remains unchanged.
6. Missing nonessential datasheet/compliance values permitted in Draft, clearly identified before approval.
7. Save customer configuration with only a name; it remains incomplete and cannot hand off to quotation.
8. Configure 118 × 550 Wp PV with one 50 kW inverter: 64.9 kWp DC, 50 kW AC, DC/AC ~1.30; engineering approval still pending.
9. Attempt quotation handoff with mismatched buyer, invalid site, wrong internal branch, inactive model, missing inverter or missing customer: blocked with specific action messages.
10. Reusable customer-neutral technical template can be used for an MA-006 draft only after correct buyer and selling entity are selected there.
11. Edit existing configuration; C1 created, C0 preserved. Duplicate starts new ID/C0 and does not inherit quote link/history.
12. Confirm quote import captures exact model IDs, quantity, options, project overrides and source revision while catalog price/tax approval is separately controlled.
13. Verify mobile/simple employee flows retain all advanced fields accessible by permission, but hide them until requested.
14. Verify active product deactivation/master revision does not retroactively modify saved/issued quote content.

**BA sign-off boundary:** Page structure, guided UX, data entities and the intended rules above are ready for review. Final engineering rule sets, regulatory jurisdiction, approval thresholds, company policy, pricing/tax and server security **must still be approved by responsible owners before production development or go-live**.
