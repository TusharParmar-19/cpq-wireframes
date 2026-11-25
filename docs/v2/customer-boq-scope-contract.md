# V2 Phase 1 — Customer BOQ, documents and scope of work

## User workflow
1. MA-005: New or Edit Enquiry, expand optional Customer BOQ, documents & scope of work. The linked quotations/evidence tab opens the existing edit form through Manage requirements.
2. Record included work, exclusions, internal technical instructions and fictional sample document references. Document types: customer BOQ, technical drawing, customer specification/RFP, site/survey document, other requirement document. Existing sample evidence retains its original category and status.
3. Save the enquiry. Prepare Quotation can open Configuration (MA-006A) or Direct Pricing/Quotation (MA-006).
4. MA-006A: the same optional section is in Project Details. The saved enquiry's data is copied when creating from an enquiry or explicitly changing the source enquiry. Save the configuration and use the saved configuration reference to continue to the quotation.
5. MA-006: Products & BOQ contains the same optional section. It supports direct entry and independent copies from an enquiry or saved configuration. Final Quotation shows scope and exclusions; the existing exclusions field is synchronized through the same stored field.
6. Saved detail views display internal metadata and scope. Existing history and draft-copy behavior remain in place. Changes to quotation scope, exclusions or requirement metadata reset a previously completed demo review under the existing material-change rule.

## Data and boundaries
The optional requirementPack holds scope, instructions, document metadata and an origin reference. Exclusions remain the existing top-level field. Existing records without requirementPack remain valid. Legacy opportunity document references are used as a fallback until a requirement pack is saved.
Each source transfer copies data by value. Saved configuration requirements take precedence over later changes to the source enquiry. No requirement-pack data is accepted from the legacy URL payload. Changing customer/buyer or source prompts before clearing or replacing captured data. Reusable configurations may contain generic scope but not customer file references.
Demo limits: up to 20 references per record, filename up to 180 characters, scope/exclusions/instructions up to 4,000 characters each. Exact customer and buyer are needed to save document references. Duplicate filename/type/size combinations are suppressed. No contents are read, uploaded or stored, and no download or spreadsheet/PDF line import occurs. Filenames and internal instructions are deliberately absent from the customer preview. User-entered scope and exclusions are escaped and shown as entered; employees must not paste confidential content there.
No changes to pricing, tax, discount, catalog records or supplier matching. Production requires authorized file storage, access, malware scanning, document versions, audit, engineering review and explicit import/mapping if desired.

## Verification
Use fictional sample filenames. Save an enquiry, then test both handoff routes. Modify the copied scope in configuration/quotation and confirm the original stays unchanged. Add/remove document references, save/reopen, check no duplicates and validate customer changes. Inspect the customer preview for scope and exclusions but no internal technical instructions or filenames. Verify old drafts without the new fields still open.
