-- CockroachDB index creation script for Altea
-- Run as a single batch; all statements use IF NOT EXISTS for idempotency

-- =============================
-- 1/ Absolutely required
-- =============================

-- Orders: time-window filters, branch scoping, contact history
CREATE INDEX IF NOT EXISTS idx_order_branch_start ON public."Order" ("branchId", start);
CREATE INDEX IF NOT EXISTS idx_order_contact_start ON public."Order" ("contactId", start DESC);

-- ResourcePlanning: overlapping range checks by resource and branch
CREATE INDEX IF NOT EXISTS idx_rp_resource_start_end ON public."ResourcePlanning" ("resourceId", start, "end");
CREATE INDEX IF NOT EXISTS idx_rp_branch_start_end   ON public."ResourcePlanning" ("branchId", start, "end");

-- OrderLine: load lines per order, keep UI ordering by idx
CREATE INDEX IF NOT EXISTS idx_orderline_order_idx ON public."OrderLine" ("orderId", idx);

-- Payment: payments per order and time-sliced extracts
CREATE INDEX IF NOT EXISTS idx_payment_order_date ON public."Payment" ("orderId", date);

-- Product: category listings per branch, sorted by name
CREATE INDEX IF NOT EXISTS idx_product_branch_cat_name ON public."Product" ("branchId", "catId", name);

-- Contact: branch contact lists, name ordering
CREATE INDEX IF NOT EXISTS idx_contact_branch_name ON public."Contact" ("branchId", name);

-- Task: staff app filters by hrIds array
CREATE INVERTED INDEX IF NOT EXISTS idx_task_hrIds ON public."Task" ("hrIds");

-- Gift: lookups by code at redemption time (unique per branch)
CREATE UNIQUE INDEX IF NOT EXISTS uk_gift_code_branch ON public."Gift" (code, "branchId");

-- LoyaltyCard: one card per contact/program
CREATE UNIQUE INDEX IF NOT EXISTS uk_loyaltycard_contact_program ON public."LoyaltyCard" ("contactId", "programId");


-- =============================
-- 2/ Advised to have
-- =============================

-- Orders: fast “to invoice” / “invoiced” lists; creation-time reporting
CREATE INDEX IF NOT EXISTS idx_order_branch_start_toInvoice ON public."Order" ("branchId", start DESC) WHERE "toInvoice";
CREATE INDEX IF NOT EXISTS idx_order_branch_start_invoiced  ON public."Order" ("branchId", start DESC) WHERE invoiced;
CREATE INDEX IF NOT EXISTS idx_order_branch_cre             ON public."Order" ("branchId", cre);

-- ResourcePlanning: auxiliary lookups
CREATE INDEX IF NOT EXISTS idx_rp_resourceGroup_start_end ON public."ResourcePlanning" ("resourceGroupId", start, "end");
CREATE INDEX IF NOT EXISTS idx_rp_orderId                 ON public."ResourcePlanning" ("orderId");
CREATE INDEX IF NOT EXISTS idx_rp_scheduleId              ON public."ResourcePlanning" ("scheduleId");
CREATE INDEX IF NOT EXISTS idx_rp_taskId                  ON public."ResourcePlanning" ("taskId");

-- Payment: foreign-key navigations
CREATE INDEX IF NOT EXISTS idx_payment_bankTxId ON public."Payment" ("bankTxId");
CREATE INDEX IF NOT EXISTS idx_payment_giftId   ON public."Payment" ("giftId");
CREATE INDEX IF NOT EXISTS idx_payment_subsId   ON public."Payment" ("subsId");

-- Contact: user linkage, email/mobile exact matches used in matching flows
CREATE INDEX IF NOT EXISTS idx_contact_userId         ON public."Contact" ("userId");
CREATE INDEX IF NOT EXISTS idx_contact_branch_email   ON public."Contact" ("branchId", email);
CREATE INDEX IF NOT EXISTS idx_contact_branch_mobile  ON public."Contact" ("branchId", mobile);

-- Product: list/grid filters
CREATE INDEX IF NOT EXISTS idx_product_branch_type ON public."Product" ("branchId", type);

-- Message: send queue and per-order history
CREATE INDEX IF NOT EXISTS idx_message_branch_state_notSent ON public."Message" ("branchId", state) WHERE state = 'notSent';
CREATE INDEX IF NOT EXISTS idx_message_orderId              ON public."Message" ("orderId");

-- Subscription: per-branch/per-contact access
CREATE INDEX IF NOT EXISTS idx_subs_branch_contact ON public."Subscription" ("branchId", "contactId");
CREATE INDEX IF NOT EXISTS idx_subs_unit_product   ON public."Subscription" ("unitProductId");

-- Reporting
CREATE UNIQUE INDEX IF NOT EXISTS uk_report_month_branch_period ON public."ReportMonth" ("branchId", year, month);
CREATE INDEX IF NOT EXISTS idx_reportline_branch_type_period    ON public."ReportLine" ("branchId", type, year, month);

-- BankTransaction: reconciliation views
CREATE INDEX IF NOT EXISTS idx_banktx_account_execDate ON public."BankTransaction" ("accountId", "execDate");
CREATE INDEX IF NOT EXISTS idx_banktx_providerRef      ON public."BankTransaction" ("providerRef");

-- Schedule: defaults per branch/resource
CREATE INDEX IF NOT EXISTS idx_schedule_resource       ON public."Schedule" ("resourceId");
CREATE INDEX IF NOT EXISTS idx_schedule_branch_default ON public."Schedule" ("branchId", "default");

-- Product relations: typical include chains
CREATE INDEX IF NOT EXISTS idx_productresource_product  ON public."ProductResource" ("productId");
CREATE INDEX IF NOT EXISTS idx_productresource_resource ON public."ProductResource" ("resourceId");
CREATE INDEX IF NOT EXISTS idx_productoption_product    ON public."ProductOption" ("productId");
CREATE INDEX IF NOT EXISTS idx_productoptionvalue_opt   ON public."ProductOptionValue" ("optionId");
CREATE INDEX IF NOT EXISTS idx_productitem_parent       ON public."ProductItem" ("parentId");
CREATE INDEX IF NOT EXISTS idx_productitem_product      ON public."ProductItem" ("productId");

-- Task: common dashboards
CREATE INDEX IF NOT EXISTS idx_task_schedule_status_prio ON public."Task" ("schedule", status, prio DESC);
CREATE INDEX IF NOT EXISTS idx_task_branch_status         ON public."Task" ("branchId", status);


-- =============================
-- 3/ Optional
-- =============================

-- Orders: global time slices
CREATE INDEX IF NOT EXISTS idx_order_start ON public."Order" (start);

-- Contacts: faster equality matching without branch filter
CREATE INDEX IF NOT EXISTS idx_contact_email  ON public."Contact" (email);
CREATE INDEX IF NOT EXISTS idx_contact_mobile ON public."Contact" (mobile);

-- Messages: sent-time cleanup/reporting
CREATE INDEX IF NOT EXISTS idx_message_branch_sent ON public."Message" ("branchId", sent);

-- ResourcePlanning: active records only
CREATE INDEX IF NOT EXISTS idx_rp_resource_start_end_active
  ON public."ResourcePlanning" ("resourceId", start, "end") WHERE act AND NOT del;

-- Price and analytics
CREATE INDEX IF NOT EXISTS idx_price_product         ON public."Price" ("productId");
CREATE INDEX IF NOT EXISTS idx_price_product_periods ON public."Price" ("productId", start, "end");

-- Order invoicing flows
CREATE INDEX IF NOT EXISTS idx_order_invoiceId  ON public."Order" ("invoiceId");
CREATE INDEX IF NOT EXISTS idx_order_invoiceNum ON public."Order" ("invoiceNum");



-- =============================
-- Availability context focused indexes
-- =============================

-- ResourcePlanning: range by resource within [from,to], filter to active and exclude staff presence/holiday requests
CREATE INDEX IF NOT EXISTS idx_rp_resource_period_active
  ON public."ResourcePlanning" ("resourceId", start, "end")
  WHERE act AND NOT del AND type <> 'pres' AND type <> 'holReq';

-- ResourcePlanning: range by resource group within [from,to], only active
CREATE INDEX IF NOT EXISTS idx_rp_group_period_active
  ON public."ResourcePlanning" ("resourceGroupId", start, "end")
  WHERE act AND NOT del;

-- ResourcePlanning: group-only masks/overrides (resourceId IS NULL), time-windowed and active
CREATE INDEX IF NOT EXISTS idx_rp_nullresource_period_active
  ON public."ResourcePlanning" (start, "end")
  WHERE act AND NOT del AND "resourceId" IS NULL;

-- ResourceLink: expand groups to children quickly
CREATE INDEX IF NOT EXISTS idx_reslink_group ON public."ResourceLink" ("groupId", pref DESC);
CREATE INDEX IF NOT EXISTS idx_reslink_child ON public."ResourceLink" ("childId");

-- Schedule: fetch all schedules per resource and prefer the default
CREATE INDEX IF NOT EXISTS idx_schedule_resource_default ON public."Schedule" ("resourceId", "default");

-- Product relations loaded during attach/includes (ordered lists)
CREATE INDEX IF NOT EXISTS idx_pr_product_idx  ON public."ProductResource" ("productId", idx);
CREATE INDEX IF NOT EXISTS idx_po_product_idx  ON public."ProductOption" ("productId", idx);
CREATE INDEX IF NOT EXISTS idx_pov_option_idx  ON public."ProductOptionValue" ("optionId", idx);
CREATE INDEX IF NOT EXISTS idx_pi_parent_idx   ON public."ProductItem" ("parentId", idx);

