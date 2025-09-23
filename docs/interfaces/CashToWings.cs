using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using System.Xml;
using Dvit.OpenBiz.Model;
using Dvit.OpenBiz.Database;
using Dvit.OpenBiz.Pcl;
using Sandlight.Data2;

// Calling code:

        private void ctrlExport_Click(object sender, EventArgs e)
        {
            CashBookReport rep = new CashBookReport();

            // int year, int month, string rootPath, string dossierId, string runningNumber, string directory = @"C:\Temp\"

            int year = (int)ctrlYear.Value;
            int month = (int)ctrlMonth.Value;
            string rootPath = @"C:\Program Files\Wings";
            string dossierId = ctrlDossierId.Text;
            string runningNumber = ctrlRunningNumber.Text;
            string exportDir = ctrlDir.Text;

            var response = rep.CreateWingsInterfaceToFile(year, month, rootPath, dossierId, runningNumber, exportDir);
            
            ctrlOutput.Text += response.Message;
        }




namespace Sukosan.Services.Interfaces
{


    public class CashBookReport
    {
        public void CreateReport(int startYear, int startMonth, int? endYear = null, int? endMonth = null)
        {

            if (endYear == null) endYear = startYear;
            if (endMonth == null) endMonth = startMonth;

            OpenBizContext openBizCtx = new OpenBizContext();

            List<CashBookRecord> records = CreateReportRecords(startYear, startMonth, endYear, endMonth);

            StringBuilder sb = new StringBuilder();

            int xlsLine = 1;
            sb.AppendLine("Datum;Info;Bedrag;Kas");

            xlsLine++;

            DateTime start = new DateTime(startYear, startMonth, 1);

            DateTime previousMonth = start.AddMonths(-1);
            /*
            ReportMonthly prevReportMonth = sandCtx.ReportMonthly.Where(r => r.Organisation.Name == "Development" && r.Month == previousMonth).FirstOrDefault();

            if (prevReportMonth != null && prevReportMonth.CashBook.HasValue)
                sb.AppendFormat("{0};;;{1}", prevReportMonth.Month.AddMonths(1).AddDays(-1), prevReportMonth.CashBook.Value).AppendLine();
            else
                sb.AppendLine(";;;");
            */

            foreach (var item in records.OrderBy(l => l.Date))
            {
                xlsLine++;
                sb.AppendFormat("{0};{1};{2};{3};=D{4}+E{5}", item.Date, item.Category, item.Info, item.Amount, xlsLine - 1, xlsLine - 2).AppendLine();
            }

            string fileName = string.Format(@"c:\temp\kasboek{0:yyyyMMddhhmmss}.csv", DateTime.Now);

            System.IO.File.WriteAllText(fileName, sb.ToString());

            System.Diagnostics.Process.Start("excel.exe", fileName);
        }

        const string wingsDagontvangstenCustomerId = "00000022";
        const string defaultWingsSupplierId = "00000534";
        const string overTeDragenOpbrengstenId = "493000";

        public CashBookWingsInterfaceResponse CreateWingsInterfaceToFile(int year, int month, string rootPath, string dossierId, string runningNumber, string directory = @"C:\Temp\")
        {
            var res = CreateWingsInterface(year, month, rootPath, dossierId, runningNumber);

            string fileName = string.Format(@"{0}\WingsCashBook_{1}_{2}.xml", directory, year, month);

            res.Message += string.Format("Bestand: {0}", fileName);

            System.IO.File.WriteAllText(fileName, res.XmlResult);

            return res;
        }

        public string GetDefaultRunningNumber(int year, int month)
        {
            DateTime start = new DateTime(year, month, 1);

            string runningNumber = ((start.Month + 3) % 12).ToString().PadLeft(3, '0');

            return runningNumber;
        }


        public CashBookWingsInterfaceResponse CreateWingsInterface(int year, int month, string rootPath, string dossierId, string runningNumber)
        {

            StringBuilder sbMessage = new StringBuilder();

            DateTime start = new DateTime(year, month, 1);
            DateTime end = start.AddMonths(1);

            /*
            int endYear = end.Year;
            int endMonth = end.Month;
            */

            List<CashBookRecord> records = CreateReportRecords(year, month, year, month);

            //  string runningNumber = ((start.Month + 3) % 12).ToString().PadLeft(3, '0');

            if (runningNumber == null)
                runningNumber = GetDefaultRunningNumber(year, month);

            DateTime opDate = end.AddDays(-1);
            decimal totalAmount = 0;

            totalAmount = records.Sum(r => r.Amount);
            decimal balance = totalAmount;

            XElement booking = CreateBookingXml("KAS", runningNumber, opDate, "570000", totalAmount);

            int count = 0;
            foreach (var record in records)
            {
                string accountType = "";
                string accountId = "";

                switch (record.Type)
                {
                    case CashBookRecordType.DayTotalCashPayments:
                        if (record.Category == "Gift" || record.Category == "CreditUpload")
                        {
                            accountType = "1";
                            accountId = overTeDragenOpbrengstenId;
                        }
                        else
                        {
                            accountType = "2";
                            accountId = wingsDagontvangstenCustomerId;
                        }
                        break;

                    case CashBookRecordType.CashToBank:
                        accountType = "1";
                        accountId = "580000";
                        break;

                    case CashBookRecordType.PurchaseInvoice:
                        accountType = "3";
                        accountId = defaultWingsSupplierId;
                        break;
                }

                decimal lineAmountDC = -record.Amount;
                balance += lineAmountDC;

                string comment = string.Format("{0:dd/MM} {1}", record.Date, record.Info);
                XElement bookingDetail = CreateBookingDetailXml(accountType, accountId, lineAmountDC, comment);
                booking.Add(bookingDetail);
                count++;
            }

            sbMessage.AppendFormat("Nr of detail records: {0}", count).AppendLine();

            if (balance == 0)
                sbMessage.AppendLine("OK, balance is 0.");
            else
                sbMessage.AppendFormat("niet OK: balance is {0} (maar zou 0 moeten zijn!)", balance).AppendLine();

            XElement cashBook = CreateWingsInterfaceXml(rootPath, dossierId, booking);

            return new CashBookWingsInterfaceResponse()
            {
                Message = sbMessage.ToString(),
                XmlResult = cashBook.ToString()
            };

        }

        private XElement CreateWingsInterfaceXml(string rootPath, string dossierId, XElement booking)
        {
            XNamespace ns = "http://www.w3.org/2001/XMLSchema-instance";

            var xml = new XElement("WingsAccounting",
                    new XAttribute(XNamespace.Xmlns + "xsi", ns),
                    new XElement("Session",
                        new XElement("Connection",
                            new XElement("RootPath", rootPath),
                            new XElement("DossierID", dossierId)
                            ),
                            new XElement("BookingBatch",
                            booking
                            )
                        )
                        );

            return xml;
        }


// DONE: createXmlHeader
        private XElement CreateBookingXml(string bookCode, string runningNumber, DateTime opDate, string accountID, decimal totalAmount)
        {
            var booking = new XElement("Booking",
                new XElement("Header",
                    new XElement("Action", "1"),
                    new XElement("BookCode", bookCode),
                    new XElement("RunningNumber", runningNumber),
                        new XElement("OpDate", opDate.ToString("yyyyMMdd")),

                     new XElement("HdrCurrencyID", "EUR")),
                new XElement("Detail",
                     new XElement("AccountType", "1"),
                        new XElement("AccountID", accountID),
                        new XElement("LineAmountDC", totalAmount),
                        new XElement("LineAmountHC", totalAmount)
                        )
                    );

            return booking;
        }

// DONE: createDetail
        private XElement CreateBookingDetailXml(string accountType, string accountId, decimal lineAmountDC, string comment)
        {
            return new XElement("Detail",
                    new XElement("AccountType", accountType),
                    new XElement("AccountID", accountId),
                    new XElement("LineAmountDC", lineAmountDC),
                    new XElement("LineAmountHC", lineAmountDC),
                    new XElement("Comment", comment)
                    );
        }

        public List<CashBookRecord> CreateGiftRecords(int startYear, int startMonth, int? endYear = null, int? endMonth = null)
        {
            OpenBizContext openBizCtx = new OpenBizContext();
            
            if (endYear == null) endYear = startYear;
            if (endMonth == null) endMonth = startMonth;
            
            DateTime start = new DateTime(startYear, startMonth, 1);
            DateTime end = new DateTime(endYear.Value, endMonth.Value, 1).AddMonths(1);

            var giftAndAccountPayments = openBizCtx.Payment.Where(p => p.Order.OrganisationId == aquasenseOrganisationId
    && p.Date >= start && p.Date < end
    && (p.PaymentType == Dvit.OpenBiz.Pcl.PaymentType.Cash)   // || (p.PaymentType >= 100 && p.PaymentType < 200)
    ).GroupBy(p => new { p.Date.Year, p.Date.Month, p.Date.Day, p.Order.IsInvoiced, p.Order.InvoiceNumber, p.Order.IsGift, p.Order.GiftCode, OrderSubType = (int)p.Order.OrderSubType })  // OrderSubType = (int)
    .Select(g => new CashBookRecord()
    {
        Type = CashBookRecordType.DayTotalCashPayments,
                    //Date = g.Key.Date.,
                    CashDate = new CashDate() { Year = g.Key.Year, Month = g.Key.Month, Day = g.Key.Day },
        Category = g.Key.IsInvoiced ? "Fact" :
        (g.Key.IsGift ? "Gift" :
            (g.Key.OrderSubType == 4 ? "CreditUpload" :
                (g.Key.OrderSubType == 0 ? "Algemeen" : "OrderSubType: " + g.Key.OrderSubType
                )
            )
        ),
        Info = (g.Key.IsInvoiced ? "Fact:" + g.Key.InvoiceNumber : "") 
        + (g.Key.IsGift ? "Gift:" + g.Key.GiftCode : "") 
        + (g.Key.OrderSubType == 4 ? "CreditUpload" : "")
        + ((g.Key.OrderSubType == 0 || g.Key.OrderSubType == 4) ? "" : "OrderSubType: " + g.Key.OrderSubType.ToString()), // OrderSubType = 4 => credit upload (not part of wings quarter total)
                    Amount = g.Sum(p => p.Amount)
    }).ToList();

            return null;
        }

        string aquasenseOrganisationId = "66E77BDB-A5F5-4D3D-99E0-4391BDED4C6C";

        public List<CashBookRecord> CreateReportRecords(int startYear, int startMonth, int? endYear = null, int? endMonth = null)
        {
            List<CashBookRecord> records = new List<CashBookRecord>();

            

            OpenBizContext openBizCtx = new OpenBizContext();
          //  AquasenseEntities sandlCtx = new AquasenseEntities();

            if (endYear == null) endYear = startYear;
            if (endMonth == null) endMonth = startMonth;


            DateTime start = new DateTime(startYear, startMonth, 1);
            DateTime end = new DateTime(endYear.Value, endMonth.Value, 1).AddMonths(1);


            //var qryPurchInvOld = from pi in sandlCtx.PurchaseInvoice
            //                  where pi.Organisation.Name == "Development"
            //                  && pi.PaymentDate >= start && pi.PaymentDate < end
            //                  && pi.PaymentType.Name == "CASH"
            //                  orderby pi.PaymentDate
            //                  select new CashBookRecord()
            //                  {
            //                      Type = CashBookRecordType.PurchaseInvoice,
            //                      Category = "PurchaseInvoice",
            //                      CashDate = new CashDate() { Year = pi.PaymentDate.Value.Year, Month = pi.PaymentDate.Value.Month, Day = pi.PaymentDate.Value.Day },
            //                      Info = pi.Supplier,
            //                      Amount = -pi.Amount
            //                  };


            var qryPurchInv = from pi in openBizCtx.Purchase
                              where pi.OrganisationId == aquasenseOrganisationId
                              && pi.PaymentDate >= start && pi.PaymentDate < end
                              && pi.PaymentType == Dvit.OpenBiz.Pcl.PaymentType.Cash //PaymentType.Name == "CASH"
                            //  && pi.Supplier != "InCashDeposit"  
                              orderby pi.PaymentDate
                              select new CashBookRecord()
                              {
                                  Type = pi.Supplier == "InCashDeposit" ? CashBookRecordType.CashToBank : CashBookRecordType.PurchaseInvoice,
                                  Category = pi.Supplier == "InCashDeposit" ? "CashToBank" : "PurchaseInvoice",
                                  CashDate = new CashDate() { Year = pi.PaymentDate.Value.Year, Month = pi.PaymentDate.Value.Month, Day = pi.PaymentDate.Value.Day },
                                  Info = pi.Supplier,
                                  Amount = -pi.Amount
                              };


            records.AddRange(qryPurchInv);


            var cashLines = openBizCtx.Payment.Where(p => p.Order.OrganisationId == aquasenseOrganisationId
                && p.Date >= start && p.Date < end
                && p.PaymentType == Dvit.OpenBiz.Pcl.PaymentType.Cash
                ).GroupBy(p => new { p.Date.Year, p.Date.Month, p.Date.Day, p.Order.IsInvoiced, p.Order.InvoiceNumber, p.Order.IsGift, p.Order.GiftCode, OrderSubType = (int)p.Order.OrderSubType })  // OrderSubType = (int)
                .Select(g => new CashBookRecord()
                {
                    Type = CashBookRecordType.DayTotalCashPayments,
                    //Date = g.Key.Date.,
                    CashDate = new CashDate() { Year = g.Key.Year, Month = g.Key.Month, Day = g.Key.Day },
                    Category = g.Key.IsInvoiced ? "Fact" :
                    (g.Key.IsGift ? "Gift" :
                        (g.Key.OrderSubType == 4 ? "CreditUpload" :
                            (g.Key.OrderSubType == 0 ? "Algemeen" : "OrderSubType: " + g.Key.OrderSubType
                            )
                        )
                    ),
                    Info = (g.Key.IsInvoiced ? "Fact:" + g.Key.InvoiceNumber : "")
                    + (g.Key.IsGift ? "Gift:" + g.Key.GiftCode : "") 
                    + (g.Key.OrderSubType == 4 ? "CreditUpload" : "")
                    + ((g.Key.OrderSubType == 0 || g.Key.OrderSubType == 4) ? "" : "OrderSubType: " + g.Key.OrderSubType.ToString()), // OrderSubType = 4 => credit upload (not part of wings quarter total)
                    Amount = g.Sum(p => p.Amount)
                }).ToList();


            if (cashLines != null)
                records.AddRange(cashLines);

            /*
            var qryCashToBank = from d in sandlCtx.ReportDaily
                                where d.Organisation.Name == "Development"
                         && d.Day >= start && d.Day < end
                                orderby d.Day
                                select new CashBookRecord()
                                {
                                    Type = CashBookRecordType.CashToBank,
                                    Category = "CashToBank",
                                    CashDate = new CashDate() { Year = d.Day.Year, Month = d.Day.Month, Day = d.Day.Day },
                                    Info = "Storting op bankrekening",
                                    Amount = -d.CashToBank
                                };
                                */

            //records.AddRange(qryCashToBank);

            Console.Out.WriteLine(cashLines.Count);

            return records.OrderBy(r => r.Date).ToList();
        }


        public string IsNull(string input)
        {
            if (input == null)
                return "";
            else
                return input;
        }



        public void CreateWingsImport(List<CashBookRecord> records)
        {

        }
    }

    public enum CashBookRecordType
    {
        PurchaseInvoice,
        DayTotalCashPayments,
        CashToBank
    }

    public class CashDate
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int Day { get; set; }

        public DateTime ToDateTime()
        {
            return new DateTime(Year, Month, Day);
        }
    }

    public class CashBookRecord
    {
        public CashBookRecord() { }
        public CashBookRecordType Type { get; set; }
        public DateTime Date { get { return CashDate.ToDateTime(); } }
        public string Category { get; set; }
        public string Info { get; set; }
        public decimal Amount { get; set; }

        public CashDate CashDate { get; set; }
    }

    public class CashBookWingsInterfaceResponse
    {
        public string Message { get; set; }
        public string XmlResult { get; set; }
    }
}
