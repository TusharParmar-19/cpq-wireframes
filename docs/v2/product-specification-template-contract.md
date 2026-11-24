# Product specification templates and model-independent identity

## Workflow

Product Catalog → Add Product → Product Specification Template → Product Group → manufacturer / brand / source → optional manufacturer model and part number → technical values → optional BOM, document references and prices → Save Draft. Leave Internal SKU / Product Code blank to generate a unique PRD-###### code. Manual existing codes are permitted in the browser demo, duplicate-checked case-insensitively; the production permission is product.sku.manual. Existing codes and variant IDs remain unchanged.

Manage Masters → Product Specification Templates opens a shared list/editor. The same new-template editor opens from + Add New Specification Template in the product/group dropdown, using the existing Quick Create popup and saved record callback. New definitions store stable template IDs and versioned technical field keys, labels, number/text/dropdown types, optional units, choices, required rules and essential/advanced placement. Existing field types/units/options and keys are preserved; create a new template for an incompatible schema. Model number is optional unless explicitly required by the selected template. Technical required fields may be incomplete in Draft; complete them before demo-enable. Existing solar calculation keys remain intact. Legacy Solar EPC / Service is readable but cannot be used to create new service products; use Service Management.

## Cable Jointing & Termination Kit

Built-in template includes joint/termination type, technology, voltage grade (kV), cable type, cores, conductor cross-section (mm²), package quantity, connector/ferrule and standards/test evidence. Default unit Kit. The supplied meeting example can be entered with Heat Shrink, Straight Through Joint (STJ), 11 kV, XLPE(E), 3 cores, 185 mm² and quantity per package 1. Model and manufacturer part number can be blank. Enter actual manufacturer only when known, otherwise select Generic, In-house assembled or Unknown. No actual commercial product records, price, warranty, certification or customer data are pre-seeded from the meeting. Manufacturing date belongs to a stock/batch record when inventory is built, not the timeless product model.

The existing Parts & Accessories master remains independent. Assign exact component records with quantities, units, Required/Optional and an optional BOM group. Document types include packaging photo and BOM sheet. Only metadata is stored in this public wireframe.

## Connection and safeguards

Each model/SKU stores its template snapshot and technical values; model-free descriptions use explicit variant description or template values, with SKU fallback. Product, service suggestion, configuration and quotation selectors use readable names even if manufacturer model is absent. Configuration and quote snapshots retain the template, original specifications, manufacturer source, manufacturer part number and BOM. BOM references never auto-add extra priced lines. Pricing still captures rates from the exact variant; unknown rates use manual pricing / future RFQ. Master changes do not rewrite saved quotation snapshots. Existing product families with variants keep their template/type; new groups and manufacturers have explicit simulated enable actions before model demo review.

Master Admin permission definitions include product.templates.manage and product.sku.manual. Actual roles, unique SKU generation under concurrent requests, activation, engineering validation, private files, stable template version tables and immutable quote revisions require the Laravel backend. Browser demo is not real authorization or technical approval.

## Acceptance

1. Create a template through Manage Masters; add text, number with unit, and dropdown fields. Save, reopen, revise the label and add another field; prior captured specifications remain unchanged.
2. In Add Product choose + Add New Specification Template, create one, and confirm it is selected without discarding other basic data. Select cable-kit and verify the seven essential fields and default Kit unit.
3. Save a kit with blank manufacturer model/part number/SKU. Confirm generated PRD code, meaningful description, exact technical values, preserved manufacturer choice and saved group. Create another variant to verify unique code. Enter an existing manual code and check duplicate rejection.
4. Add parts and BOM groups, attach metadata-only files. Review existing SKU (read-only), missing/required field behavior and new group/manufacturer demo enable. Verify legacy records remain.
5. Select active demo kit in Configuration, save, Continue to Pricing. Confirm quantity, automatic catalog price, original SKU and captured technical/BOM references. Check final quote description, no extra component revenue, and saved quote retains data after later master edits.
