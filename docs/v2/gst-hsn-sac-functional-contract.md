# V2: GST and HSN/SAC — browser wireframe contract

## Scope

- Product groups can store configurable HSN, category, rate, purchase basis and selling basis. Exact models inherit the group by default or explicitly override it. A blank or unconfigured rate is not treated as an approved zero rate.
- Services and sub-services store individual SAC/category/rate. The service master does not contain a selling price; enter service/manual BOQ/extra charge rates excluding GST in Pricing & Costing.
- Fresh quotation items capture independent tax snapshots from masters. Imported technical configurations capture current commercial data at quotation creation; later master changes do not reprice existing quotes. Inclusive catalog prices and costs are converted to net unit rates at capture. Supplier rates already captured before GST remain unchanged.
- New quotations use item-wise tax. Legacy records retain their original single percentage and totals. An editable draft may explicitly opt in; existing entered rates are retained as net. Old dispatched revisions are not silently migrated.
- Choose intra-state or inter-state treatment manually. The prototype does not determine place of supply or assert correct legal classifications. GST rates and HSN/SAC examples are fictional for testing; verify actual codes, rates, exemptions, composite supply and jurisdiction in production.
- Apply the existing quotation-wide percentage discount proportionally to each billable line and separate customer charge; allocate rounding by cumulative share. Calculate GST on the resulting base per line. Exclude bundled child service revenue and private/internal-only costs. Unknown classifications show pending tax and provisional totals; demo review requires all billable tax data and a GST treatment.
- Quote-specific tax overrides never change master records. Pricing, cost, margin and vendor data remain internal. Customer preview displays captured tax details, rate breakdown and GST split.
- Item/fixed discounts, subsidies, automated statutory tax treatment, rounding policy, production approval/permission enforcement, real PDF dispatch and direct orders remain subsequent Phase 1 work.

## Manual acceptance tests

1. Edit an existing active product model; choose Model-specific GST, use fictional HSN 1234, category Taxable, rate 5, price basis Excluding GST. Save; any existing model review/reset behavior remains unchanged.
2. Set a second product to fictional HSN 123456, GST 18%; test a group default and inherited model, then override the model. Add one service with fictional SAC 123456, rate 18%.
3. Create a new quote, add the products and service, proceed to Pricing & Costing. Use exclusive net amounts 50,000 / 20,000 / 10,000 (qty 1). Choose intra-state: net 80,000; tax 7,900; CGST 3,950; SGST 3,950; total 87,900. Choose inter-state: IGST 7,900, same total. With 10% overall discount: net 72,000; GST 7,110; total 79,110.
4. For a model with configured 18% demo GST, set inclusive selling rate 1,180 and inclusive purchase cost 590. New quote must capture net selling 1,000 and cost 500; without discounts the total is 1,180.
5. Add a manual item or separate customer charge. Missing classification must be flagged; complete GST/SAC fields, then check totals. Change exempt to taxable and enter a positive percentage. Bundled child service must contribute zero separate GST.
6. Save a draft, change the product tax master, reopen original quote: saved snapshot/totals stay unchanged. Add the product to a new draft: latest settings are captured. Older single-rate records retain their calculation unless an editable draft is explicitly migrated.
7. Confirm Final Quotation customer preview displays tax information and excludes internal supplier cost/margin. Confirm incomplete tax blocks demo approval, not saving a draft.

## Verification limits

Syntax and deterministic pricing/capture tests can run without a browser; visual interaction and localStorage persistence require testing in GitHub Pages with the user's browser.
