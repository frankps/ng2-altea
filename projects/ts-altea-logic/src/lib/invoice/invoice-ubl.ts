import { Branch, Invoice as AlteaInvoice } from 'ts-altea-model'


function parseAddressString(addressStr: string | undefined): { street: string; postalZone: string; city: string } {
  if (!addressStr) return { street: '', postalZone: '', city: '' }

  const lines = addressStr.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const street = lines[0] || ''
  const postalCityLine = lines[1] || ''
  const postalCityMatch = postalCityLine.match(/^(\d+)\s+(.+)$/)

  return {
    street,
    postalZone: postalCityMatch ? postalCityMatch[1] : postalCityLine,
    city: postalCityMatch ? postalCityMatch[2] : ''
  }
}

function formatDateNum(dateNum: number | undefined): string {
  if (!dateNum) return new Date().toISOString().split('T')[0]
  const s = String(dateNum)
  return `${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`
}

/** Wraps a numeric string as an amount object with currencyID so the XML attribute is emitted. */
function amt(value: string, currencyCode: string): any {
  return { content: value, attributes: { currencyID: currencyCode } }
}

/**
 * Returns the Belgian enterprise number (ondernemingsnummer) from a VAT string.
 * PEPPOL scheme 0208 requires the 10-digit number WITHOUT the 'BE' country prefix.
 * e.g. "BE0465371059" → "0465371059"
 */
function enterpriseNum(vatNum: string): string {
  return vatNum.replace(/^[A-Za-z]{2}/, '')
}

/** Wraps an identifier with a schemeID attribute (required for PEPPOL EndpointID and CompanyID). */
function ident(value: string, schemeID: string): any {
  return { content: value, attributes: { schemeID } }
}

/**
 * Builds a PEPPOL BIS 3.0 compliant UBL XML string from an Altea invoice and branch.
 *
 * @param invoice  The Altea invoice object
 * @param branch   The branch (supplier) object
 * @param ublMain  Dynamically imported 'ubl-builder' module
 * @param ublCac   Dynamically imported 'ubl-builder/lib/ubl21/CommonAggregateComponents' module
 * @returns UBL XML string
 */
export function buildInvoiceUbl(
  invoice: AlteaInvoice,
  branch: Branch,
  ublMain: any,
  ublCac: any
): string {

  const {
    AccountingSupplierParty,
    AccountingCustomerParty,
    Party,
    PartyName,
    PartyTaxScheme,
    PartyLegalEntity,
    PostalAddress,
    Country,
    TaxScheme,
    TaxCategory,
    TaxSubtotal,
    TaxTotal,
    LegalMonetaryTotal,
    InvoiceLine,
    Item,
    Price,
    ClassifiedTaxCategory
  } = ublCac

  const UblInvoice = ublMain.Invoice
  const currency = branch.cur || 'EUR'
  const invoiceDate = formatDateNum(invoice.date)

  // --- UBL invoice document ---
  const ublInvoice = new UblInvoice(invoice.num || 'UNKNOWN', {} as any)

  ublInvoice.addProperty('xmlns', 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2')
  ublInvoice.addProperty('xmlns:cac', 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2')
  ublInvoice.addProperty('xmlns:cbc', 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2')

  ublInvoice.setUBLVersionID('2.1')
  ublInvoice.setCustomizationID('urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0')
  ublInvoice.setProfileID('urn:fdc:peppol.eu:2017:poacc:billing:01:1.0')
  // ID must be set explicitly (constructor has this commented out) and before IssueDate
  ublInvoice.setID(invoice.num || 'UNKNOWN')
  ublInvoice.setIssueDate(invoiceDate)
  ublInvoice.setInvoiceTypeCode('380')  // Commercial invoice
  ublInvoice.setDocumentCurrencyCode(currency)
  // PEPPOL-EN16931-R003 (fatal): buyer reference or order reference MUST be provided
  ublInvoice.setBuyerReference(invoice.num || 'N/A')
  // BR-CO-25 (fatal): when PayableAmount > 0, Payment due date (BT-9) or Payment terms (BT-20) MUST be present
  // addPaymentTerm() is not implemented in ubl-builder — use setDueDate (BT-9) instead
  const dueDateObj = new Date(invoiceDate)
  dueDateObj.setDate(dueDateObj.getDate() + 30)
  const dueDate = dueDateObj.toISOString().split('T')[0]
  ublInvoice.setDueDate(dueDate)

  // --- Supplier party (branch) ---
  // PEPPOL BIS 3.0 (BR-62): EndpointID MUST have schemeID.
  // Belgium uses scheme 0208 (ondernemingsnummer) — the 10-digit number WITHOUT the 'BE' prefix.
  const branchStreet = `${branch.str || ''} ${branch.strNr || ''}`.trim()
  const branchEntNum = enterpriseNum(branch.vatNr || '')
  const supplierParty = new Party({
    EndpointID: ident(branchEntNum, '0208'),
    partyNames: [new PartyName({ name: 'Da Vinci IT bv (Aquasense)' })],
    postalAddress: new PostalAddress({
      streetName: branchStreet || 'Unknown',
      cityName: branch.city || '',
      postalZone: branch.postal || '',
      country: new Country({ identificationCode: 'BE' })
    }),
    partyTaxSchemes: [
      new PartyTaxScheme({
        companyID: branch.vatNr || '',
        taxScheme: new TaxScheme({ id: 'VAT' })
      })
    ],
    partyLegalEntities: [
      new PartyLegalEntity({
        registrationName: 'Da Vinci IT bv',
        companyID: ident(branchEntNum, '0208')
      })
    ]
  })

  ublInvoice.setAccountingSupplierParty(
    new AccountingSupplierParty({ party: supplierParty })
  )

  // --- Customer party (invoice recipient) ---
  const customerAddr = parseAddressString(invoice.address)
  const customerName = invoice.company || invoice.to?.name || ''
  const customerVat = invoice.vatNum || ''

  const customerEntNum = customerVat ? enterpriseNum(customerVat) : ''
  const customerParty = new Party({
    EndpointID: customerEntNum
      ? ident(customerEntNum, '0208')
      : ident(invoice.email || customerName, '0009'),  // fallback: private person
    partyNames: [new PartyName({ name: customerName })],
    postalAddress: new PostalAddress({
      streetName: customerAddr.street || 'Unknown',
      cityName: customerAddr.city || '',
      postalZone: customerAddr.postalZone || '',
      country: new Country({ identificationCode: 'BE' })
    }),
    partyTaxSchemes: [
      new PartyTaxScheme({
        companyID: customerVat || 'CONSUMER',
        taxScheme: new TaxScheme({ id: 'VAT' })
      })
    ],
    partyLegalEntities: [
      new PartyLegalEntity({
        registrationName: customerName,
        companyID: customerEntNum
          ? ident(customerEntNum, '0208')
          : customerName
      })
    ]
  })

  ublInvoice.setAccountingCustomerParty(
    new AccountingCustomerParty({ party: customerParty })
  )

  // --- Tax totals (one TaxTotal with subtotals per VAT rate) ---
  if (invoice.vatLines && invoice.vatLines.length > 0) {
    const taxSubtotals = invoice.vatLines.map(vl =>
      new TaxSubtotal({
        taxableAmount: amt(vl.excl.toFixed(2), currency),
        taxAmount: amt(vl.vat.toFixed(2), currency),
        taxCategory: new TaxCategory({
          id: vl.pct > 0 ? 'S' : 'Z',
          percent: String(vl.pct),
          taxScheme: new TaxScheme({ id: 'VAT' })
        })
      })
    )

    const totalVat = invoice.totals?.vat ?? 0
    ublInvoice.addTaxTotal(new TaxTotal({
      taxAmount: amt(totalVat.toFixed(2), currency),
      taxSubtotals
    }))
  }

  // --- Legal monetary total ---
  const totals = invoice.totals
  if (totals) {
    const allLines = invoice.orders?.flatMap(o => o.lines ?? []) ?? []
    const lineExtensionTotal = allLines.reduce((sum, l) => sum + (l.excl ?? 0), 0)

    ublInvoice.setLegalMonetaryTotal(new LegalMonetaryTotal({
      lineExtensionAmount: amt(lineExtensionTotal.toFixed(2), currency),
      taxExclusiveAmount: amt(totals.excl.toFixed(2), currency),
      taxInclusiveAmount: amt(totals.incl.toFixed(2), currency),
      payableAmount: amt(totals.incl.toFixed(2), currency)
    }))
  }

  // --- Invoice lines ---
  let lineIdx = 1
  if (invoice.orders) {
    for (const order of invoice.orders) {
      if (!order.lines) continue

      for (const line of order.lines) {
        const vatPct = line.vatPct ?? 0
        const qty = line.qty ?? 1
        const lineExcl = (line.excl ?? 0).toFixed(2)
        // BR-CO-10: PriceAmount MUST be the net unit price (excl. VAT) so that
        // LineExtensionAmount = InvoicedQuantity × PriceAmount holds.
        // line.unit is the gross price incl. VAT; use excl / qty instead.
        const netUnitPrice = ((line.excl ?? 0) / qty).toFixed(2)

        const descr = invoice.useAlter ? (invoice.alter || '') : (line.descr || '')

        ublInvoice.addInvoiceLine(new InvoiceLine({
          id: String(lineIdx++),
          // BR-CL-23 (fatal): unitCode is mandatory on InvoicedQuantity; C62 = piece/unit
          invoicedQuantity: { content: String(qty), attributes: { unitCode: 'C62' } },
          lineExtensionAmount: amt(lineExcl, currency),
          // cac:TaxTotal is NOT part of PEPPOL BIS 3.0 InvoiceLine — tax info goes in Item/ClassifiedTaxCategory
          item: new Item({
            name: descr,
            classifiedTaxCategory: new ClassifiedTaxCategory({
              id: vatPct > 0 ? 'S' : 'Z',
              percent: String(vatPct),
              taxScheme: new TaxScheme({ id: 'VAT' })
            })
          }),
          price: new Price({
            priceAmount: amt(netUnitPrice, currency)
          })
        }))
      }
    }
  }

  return ublInvoice.getXml(true)
}
