# MA-006 — Quotations & BOQ: Design and Functional Contract

**Status:** Employee-facing builder redesigned and its browser-only flow validated, 18 November 2026. **Target business logic below requires approval and backend implementation.** This is a co-located page implementation specification, not a second independent CPQ business baseline.

## 1. Purpose and scope

Transform a technically selected product configuration or a directly initiated enquiry into a controlled, commercial customer offer with a clearly identified legal buyer, selling entity, pricing, tax assumptions, commercial terms, approvals, locked revisions, PDF and customer dispatch/response records.

**Do not force employees to configure products twice.** When MA-006A sends a saved configuration, MA-006 should show imported BOQ lines immediately, then permit only necessary changes and additions. Source configuration remains a traceable, immutable **revision reference**, not an editable shared live object.

## 2. Four employee steps

1. **Customer & Project**: confirm customer, exact legal buyer/bill-to, our selling legal entity and branch, owner, linked contact/site/project/enquiry, quotation title. Auto-suggest only unambiguous relationships. Cross-check MA-004 and MA-005. A quotation can start directly or from an enquiry/configuration.
2. **Products & BOQ**: list imported exact SKUs/models and services first; show quantity/unit, technical descriptions, project overrides and line sample rates. Add an **Active** catalog product or service on demand; flag changes requiring technical review. A Draft/inactive model is not eligible for live quotations. Item-level price changes require authorization and audit in production. Do not automatically overwrite the MA-006A master.
3. **Price & Terms**: calculate item totals, subtotal, controlled discounts, taxes and final payable amount. Collect valid-until date, currency, payment/delivery terms and optional warranty, exclusions, freight, local taxes, notes, attachments and supplier evidence under expandable or restricted sections. Company/branch-specific price lists and tax engine are authoritative; prototype values are never approved.
4. **Review & Save**: show short meaningful statuses for draft data completeness, commercial terms needing confirmation, pending technical/commercial approvals and disabled issuance. Keep full checklist accessible. Actions: Save Draft and customer-layout preview. Actual Submit for Approval, Approve, Generate/Issue and Dispatch must be separate authorized production actions.

## 3. Data relationships

**Quotation** has stable record ID, customer/buyer, internal company/branch, owner, project/site/contact/opportunity, created and updated times, state and source configuration/revision (if imported).

**Quotation Revision** has R0/R1/... label, author, reason, effective date, approval status, frozen product/technical/item descriptions, exact product model/SKU references, unit/quantity, rate source/version, discount, tax, currency, terms, generated PDF hash/reference and issue metadata. Issued revisions must not be silently edited.

**Quotation Line** stores product/service ID, optional source configuration line, manufacturer/model/SKU snapshot, unit, quantity, technical options/overrides, unit price, discount/tax classification, tax amount, total, exceptions and technical/pricing approval flags. Repeating the same SKU may be intentional across installations; line identity must remain stable.

**Approval Decision**, **Issued Document**, **Dispatch Record**, **Customer Response** and **Order Conversion** are distinct auditable records. A customer saying "accepted" is not the same operation as registering an order.

## 4. Calculation and commercial rules

The wireframe currently demonstrates:
- per-line extended amount = positive integer quantity × nonnegative illustrative unit selling rate;
- subtotal = sum of line extended values;
- sample discount = percentage of subtotal;
- illustration taxable base = subtotal minus discount;
- illustration tax = flat demo rate × taxable base;
- illustration total = taxable base + illustration tax.

**These are not production tax or pricing algorithms.** The production engine must define HSN/SAC, customer/seller location, applicable tax jurisdiction, GST treatment and exemptions, item-level tax, price basis, inclusive/exclusive mode, freight, rounding, discounts, effective-dated price lists, currency exchange where allowed, and potential retention/advance or additional charges. Finance/Tax owners must approve the exact rules.

- List price, approved price, manual override, supplier cost and margin are different values. Restricted internal costs and margins must not appear on any customer-facing PDF.
- Price overrides and discounts require MA-003 action grants plus approval-matrix checks, not just a numeric field.
- Pricing must be frozen on a revision, with historical price-list and tax-policy version references.
- Commercial placeholders such as "To be agreed" or "To be confirmed" do not count as finalized terms for issuance, even when draft saving is permitted.
- Validity must be a real calendar date; the issue workflow should reject an expired offer unless the policy explicitly allows a controlled exception.

## 5. Separate review gates and status transitions

- **Draft**: editable within permitted scope; structurally incomplete drafts can exist. Only a nonempty title is necessary for an initial demo draft save; supplied buyer/scope references, BOQ numbers and percentages must still be internally valid. Validity date, payment/delivery terms and even unselected BOQ lines are allowed to remain unfinished. Saving does not send a PDF or obtain permission.
- **Ready for Review**: customer/buyer/seller and BOQ structurally valid, required documents and relevant checks assembled.
- **Pending Approval / Returned / Approved**: governed by technical, discount, margin, tax, customer and company/branch policies; approver eligibility, delegation, comments and escalation are recorded.
- **Issued/Sent**: only approved immutable revision may generate/issue a signed/controlled PDF and be dispatched to correct recipient with channel, timestamp and proof.
- **Responded/Negotiation/Accepted/Won/Lost/Expired**: customer response captured with evidence and revision. Distinguish acceptance from order registration.
- **Revision R1+**: changes to issued or approval-impacting content make a new draft revision with traceable reason. Earlier issued PDFs and replies remain intact.
- **Order creation**: a separate permissioned action from an eligible accepted/approved quotation revision; prevent duplicate conversion and preserve source identifiers.

Actual state graph and exception thresholds must be signed off by Sales, Finance, Technical and Operations stakeholders before backend development.

## 6. Product Configuration → Quotation handoff

- Import source configuration ID + revision, customer/buyer/site/project/company/branch/owner where valid, exact selected variant IDs/SKUs, quantities, units, approved options, project overrides and note.
- The current public wireframe uses encoded, fictional selection data in the URL and seeded catalog rates. It validates the fields for a demo but is **not trusted data or security**. In production, pass only an authenticated configuration ID/revision; fetch and authorize server-side.
- Invalid buyer/site relationships, unauthorized company/branch, inactive models, nonexistent SKUs, invalid quantities and incomplete solar system readiness must show actionable errors.
- After import, the editor must **not** display unrelated legacy demo products in the primary area. Additional catalog products appear only through an on-demand picker.
- A custom model created in MA-006A needs a shared database and approved model state before it can be used across pages. Current in-memory demo edits do not persist across page navigation/refresh.

## 7. Permissions and data protection

Use MA-003 page/action permissions plus company/branch and record-level scope for reading, creating/editing draft, adding catalog products, seeing restricted costs/margins, overriding prices, requesting approvals, approving, generating final PDFs, issuing/dispatching, recording responses, changing status and order conversion. Enforcement is server-side with audit logs.

No secrets or real buyer, supplier pricing, tax identifiers or customer attachments should be put in query strings on public demonstration pages. Permissions, scopes and policy approvals must be verified again during every write and state transition.

## 8. Development/QA acceptance cases

1. Start quote from MA-005 enquiry; exact customer/buyer/project and internal company/branch/owner populate only when validated.
2. Start quote from MA-006A solar configuration CF-2026-003/C0: imported 4 lines: 118 PV modules, 1 inverter, 118 mounting sets, 1 commissioning service.
3. On Products & BOQ, imported lines show first; generic electrical demo picker is not presented by default. Additional Active catalog model can be added on demand.
4. Draft/inactive catalog variant cannot be added to issued quotation or bypass approval.
5. Quantity, unit rate and discount change recalculates all totals deterministically; invalid quantities, missing lines, percentage outside approved bounds and currency discrepancies are rejected.
6. Price & Terms uses a real date picker, optional payment term templates and editable terms. "To be agreed" does not pass issue-readiness.
7. Save Draft preserves data and creates a new draft record with a title even when validity/payment/delivery terms or BOQ are incomplete; it rejects invalid linked records and malformed numbers. No PDF issued, email sent, approval granted or order created.
8. Restricted prices, costs and margins stay protected for non-privileged roles; server scope cannot be bypassed by client UI.
9. Approval actions enforce role+scope+approval matrix, record approver and decision, and stop self-approval where policy requires segregation.
10. Issued revision cannot be edited; new revision starts with preserved previous document, pricing, tax, buyer identity, approvals and correspondence.
11. Dispatch captures recipient/method/time and returned failures; customer response tied to exact issued revision. Acceptance is distinct from order.
12. Server handoff re-fetches authorized immutable configuration/revision and rejects forged source payload or inactive model.
13. PDF contains permitted customer-facing specifications, taxes, totals, seller/buyer legal addresses and terms, but never confidential vendor costs or internal margin notes.
14. Accessible employee-first layout works with long BOQs, keyboard navigation, meaningful validation messages and responsive screens.

## 9. Current implementation vs required production work

**Implemented in GitHub browser demonstration:** four-step builder, MA-006A seeded configuration handoff, source configuration ID/revision, imported-BOQ-first layout, Active model picker, quantity/rate editing and arithmetic preview, sample terms/date picker, final draft review and browser-only Save Draft. Simulated workflow checks passed using fictional data.

**Not implemented:** server persistence, MA-003 enforcement, genuine price/discount/tax engine, engineering compatibility or BOM approval, role-separated approval workflow, immutable issued revision store, real PDF issuance, dispatch, customer replies, source-of-truth product catalog shared across browsers, order conversion and production-grade integration tests.

**BA status:** New quotation UI flow and representative rules are specified; MA-006 still requires business approval of pricing/tax/term/approval policies and further visual workflow review before design sign-off.


## 10. Quotation register view modes (admin/employee UX)

The register supports two explicit, reversible display modes without changing its underlying quotation data or permissions:

- **Split / Details (default):** a compact left quotation picker and right quotation details, including Summary, Configuration & BOQ, Commercial, Review & Approvals, Versions and PDF & Response tabs.
- **Expanded List (on demand):** the split detail panel is replaced by a full-width quotation table. Each row displays quotation ID/revision/title, customer and exact buyer, internal legal entity/branch, owner, status, last updated, indicative total and a **View Details** action. Latest quotation ID appears first in the current demo.
- **Switching:** "View All Quotations (Table)" in the page header or "Expand as Table" at the register switches to the full-width list; "Return to Quotation Details"/"Show Details" switches back. "View Details" on a table row selects that quotation and restores the split view. The header table action must remain visible in the quotation editor. Its "Back to Quotation Table" action always returns to the full-width list, not the split editor/detail view. If editing has changed or a new prefilled draft would be lost, confirm abandonment first; Cancel keeps the editor and its state.
- **Shared controls:** company/branch, search, status and owner filters apply to both modes; changing views must preserve filters. In expanded view, the explanatory CPQ cards and summary cards are hidden to focus on quotation rows; the company/branch scope filter remains accessible.
- **Small screens:** the wide table scrolls horizontally within its own container rather than shrinking its important columns. The compact view remains accessible.
- **Data governance:** the current demo permits all seeded sample records and does not authorize server access. Production must enforce MA-003 company/branch and record scope on every query, individual quotation open, edit, approval action and export. A UI filter is not security.

**Post-save quotation detail UX**: show the key records first and hide optional fields under "More customer, project & record details". A Draft should show **Continue Editing** and a concise list of missing mandatory issue-readiness information, while still allowing incomplete Draft saves. BOQ shows its source configuration and subtotal. Commercial separates customer-facing terms from collapsed internal notes. Review & Approvals and PDF & Response explicitly state when no actual approval, issue or dispatch record exists. Versions must distinguish a new quote copy from a revision of the same quotation.

**Additional acceptance checks:** switch list→details→list without losing status/owner/scope/search filters; verify freshly saved drafts appear in both views; verify an empty filter result; verify desktop/mobile table scrolling; verify that viewing a quotation never grants access outside permitted company/branch scope in production; verify no draft preview is mistaken for an issued PDF.

### Customer-to-selling-company scope clarification
Preserve the existing MA-004 customer-to-internal-company/branch relationship; the dropdown must not offer unrelated entities. The quotation header now explains the filtered options and links to the selected customer in a separate tab. Use the existing authorized Link internal scope workflow and return to Refresh links; refresh merges shared customer, entity and staff master records without replacing the working quotation draft. Any selected scope/owner that is no longer valid is cleared; item/rate snapshots are not silently changed, and existing validation remains in force. These are demo controls, not backend authorization. Pricing validation hints respect their conditional hidden state.

### Quick selling-scope selection
The quotation header provides **+ Use another company / branch**. Reuses the existing MA-004 scope-link form in the Quick Create dialog. Choose an active existing internal legal entity and branch, then explicitly Link & Select. Save the relationship on the same customer and select the exact persisted scope in the working quote. Already-linked combinations can be selected without duplication. No new company/customer, automatic access grant or draft overwrite. Clear the previous responsible employee when scope changes; preserve draft BOQ/prices and flag supplier-cost scope mismatches using existing pricing checks. Customer linking and employee authorization remain separate production permissions.
