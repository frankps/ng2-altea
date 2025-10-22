using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Globalization;
using System.Data;
using System.Threading.Tasks;
using Sukosan.Data;
using Data = Sukosan.Data;
using OB = Dvit.OpenBiz.Model;
using Pcl = Dvit.OpenBiz.Pcl;
using Dvit.OpenBiz.Model;
using Dvit.OpenBiz.Database;
using Dvit.OpenBiz.Pcl;
using System.Xml.Linq;
using System.Xml;

namespace Sukosan.Services.Reporting
{
    public class GiftDeclareSvc
    {
        // SukosanEntities _SukCtx = new SukosanEntities();

        const string wingsDagontvangstenCustomerId = "00000022";
        //const string defaultWingsSupplierId = "00000534";
        const string overTeDragenOpbrengstenId = "493000";


        OpenBizContext _ObCtx; // = new OpenBizContext();
        DateTimeOffset newRules = new DateTimeOffset(new DateTime(2015, 1, 1));

        public GiftDeclareSvc()
        {
            this._ObCtx = new OpenBizContext();
        }

        public GiftDeclareSvc(OpenBizContext ctx)
        {
            this._ObCtx = ctx;
        }

        public string GetGiftReport(int year, int month)
        {
            DateTime from = new DateTime(year, month, 1);
            DateTime to = from.AddYears(1);

            var giftOrders = this._ObCtx.Order.Include("Gifts").Include("Party").Where(o => o.IsGift == true
            && o.OrganisationId == "66E77BDB-A5F5-4D3D-99E0-4391BDED4C6C"
            && o.Date >= from && o.Date < to).ToList();

            StringBuilder sbLog = new StringBuilder();

            giftOrders.ForEach(o =>
            {
                string party = "";

                if (o.Party != null)
                    party = o.Party.Name;

                if (o.Gifts == null || o.Gifts.Count == 0)
                    return;

                var g = o.Gifts.First();

                if (g == null)
                    return;
               
                sbLog.AppendLine($"{g.GiftCode};{g.Value};{g.AmountConsumed};{party}");
            });

            string fileName = $@"C:\Temp\{year}_{month}_{Guid.NewGuid().ToString().Substring(0,4)}.csv";

            System.IO.File.WriteAllText(fileName, sbLog.ToString());

            return $"Created: {fileName}";
        }


        public string Create(int year, int month, string orgId)
        {
            StringBuilder sb = new StringBuilder();

            XmlBookingDetails bookings = this.GetRecords(year, month, orgId);

            string dir = @"C:\WingsImport";

            StringBuilder sbLog = new StringBuilder();

            sbLog.AppendLine(this.CreateWingsInterfaceToFile(year, month, "1", bookings, dir));
            sbLog.AppendLine("<br/><br/>");
            sbLog.AppendLine($"For a total of: {bookings.TotalAmount} <br/>");

            return sbLog.ToString();
        }


        public XmlBookingDetails GetRecords(int year, int month, string orgId)
        {
            XmlBookingDetails bookings = new XmlBookingDetails();
            
            DateTime from = new DateTime(year, month, 1);
            DateTime to = from.AddMonths(1);

            var paysForMonth = this._ObCtx.Payment.Include("Order").Include("Gift.Order").Where(p => p.Order.OrganisationId == orgId
            && !p.Order.IsGift && !p.Order.IsInvoiced            
            && p.Date >= from && p.Date < to
            && (
            (p.PaymentType == PaymentType.Gift && p.Gift != null && p.Gift.CreatedAt >= newRules && !p.Gift.Order.IsInvoiced)
            || (p.PaymentType == PaymentType.AccountWithdrawal)
            )).OrderBy(p => p.Date).ToList();

            decimal totalAmount = 0;

            foreach (OB.Payment pay in paysForMonth)
            {
                bool addToTotal = true;
                string comment = "";

                switch (pay.PaymentType)
                {
                    case PaymentType.Gift:
                        comment = $"{pay.Date.ToString("dd/MM")} cadeaubon '{pay.Gift.GiftCode}'";

                        bookings.Details.Add(new XmlBookingDetail()
                        {
                            Amount = pay.Amount,
                            Comment = comment,
                            OrderId = pay.OrderId,
                            PaymentId = pay.Id
                        });

                        break;

                    case PaymentType.AccountWithdrawal:

                        DateTimeOffset? lastCreditUpload = this.LastCreditUploadBefore(pay.Order.PartyId, pay.Date);

                        if (lastCreditUpload != null && lastCreditUpload >= newRules)
                        {
                            comment = $"{pay.Date.ToString("dd/MM")}: {pay.Amount} van rekening";

                            bookings.Details.Add(new XmlBookingDetail()
                            {
                                Amount = pay.Amount,
                                Comment = comment,
                                OrderId = pay.OrderId,
                                PaymentId = pay.Id
                            });
                        }
                        else
                        {
                            Console.Out.WriteLine($"Niet aangeven (van voor 2015) {pay.Date.ToString("dd/MM")}: {pay.Amount} van rekening");
                            addToTotal = false;
                        }

                        /*
                        else
                        {
                            sb.AppendLine($"Niet aangeven (van voor 2015) {pay.Date.ToString("dd/MM")}: {pay.Amount} van rekening");
                            addToTotal = false;
                        }*/

                        break;
                }

                if (addToTotal)
                    totalAmount += pay.Amount;
            }

            bookings.TotalAmount = totalAmount;
            return bookings;
        }


        public XmlBookingDetails GetRecordsCheck(int year, int month, string orgId)
        {
            XmlBookingDetails bookings = new XmlBookingDetails();


            DateTime from = new DateTime(year, month, 1);
            DateTime to = from.AddMonths(1);

            var paysForMonth = this._ObCtx.Payment.Include("Order").Include("Gift").Where(p => p.Order.OrganisationId == orgId
            && p.Date >= from && p.Date < to
            && (
           // (p.PaymentType == PaymentType.Gift && (p.Gift == null || p.Gift.CreatedAt < newRules))
             (p.PaymentType == PaymentType.AccountWithdrawal)
            )).OrderBy(p => p.Date).ToList();

            decimal totalAmount = 0;

            foreach (OB.Payment pay in paysForMonth)
            {
                Console.Out.WriteLine(ShowOrderDetails(pay.OrderId));

                bool addToTotal = true;
                string comment = "";

                switch (pay.PaymentType)
                {
                    case PaymentType.Gift:
                        comment = $"{pay.Date.ToString("dd/MM")} cadeaubon '{pay.Gift.GiftCode}'";

                        bookings.Details.Add(new XmlBookingDetail()
                        {
                            Amount = pay.Amount,
                            Comment = comment
                        });

                        break;



                        break;
                }

                if (addToTotal)
                    totalAmount += pay.Amount;
            }

            bookings.TotalAmount = totalAmount;
            return bookings;
        }


        public string ShowOrderDetails(string orderId)
        {
            StringBuilder sb = new StringBuilder();

            OB.Order order = this._ObCtx.Order.Include("Party").Include("Payments").Include("OrderTaxes").FirstOrDefault(o => o.Id == orderId);
            
            if (order == null)
                sb.AppendLine("Order not found!");

            sb.AppendLine($"Order Total={order.GrandTotal} Gift={order.IsGift} Party={order.Party.Name}");

            sb.AppendLine("Payments:");
            foreach (OB.Payment pay in order.Payments)
            {
                sb.AppendLine($"  {pay.Amount}  {pay.PaymentType}");
            }

            sb.AppendLine("Taxes:");
            foreach (OB.OrderTax tax in order.OrderTaxes)
            {
                sb.AppendLine($"  {tax.DeclaredInPeriod}:  {tax.Declared}");
            }

            return sb.ToString();
        }



        public string CreateWingsInterfaceToFile(int year, int month, string dossierId, XmlBookingDetails bookings, string directory = @"C:\Temp\")
        {
            var xmlContent = CreateWingsInterface(year, month, dossierId, bookings);

            string fileName = string.Format(@"{0}\WingsGiftAndCredit_{1}_{2}.xml", directory, year, month);

            System.IO.File.WriteAllText(fileName, xmlContent);

            return $"Interface file created: {fileName}";
        }


        public string CreateWingsInterface(int year, int month, string dossierId, XmlBookingDetails bookings)
        {
            DateTime start = new DateTime(year, month, 1);

            int opYear = year;
            if (month > 9)
                opYear++;

            DateTime opDate = new DateTime(opYear, 9, 30);
            

            XElement bookingNode = CreateBookingXml("D01", opDate, overTeDragenOpbrengstenId, bookings.TotalAmount);
            bookingNode.Add(bookings.GetXml("2", wingsDagontvangstenCustomerId));

            XElement xmlRoot = CreateWingsInterfaceXml(dossierId, bookingNode);

            return xmlRoot.ToString();
        }

        private XElement CreateWingsInterfaceXml(string dossierId, XElement booking)
        {
            XNamespace ns = "http://www.w3.org/2001/XMLSchema-instance";

            var xml = new XElement("WingsAccounting",
                    new XAttribute(XNamespace.Xmlns + "xsi", ns),
                    new XElement("Session",
                        new XElement("Connection",
                            new XElement("RootPath", @"C:\Program Files\Wings"),
                            new XElement("DossierID", dossierId)
                            ),
                            new XElement("BookingBatch",
                            booking
                            )
                        )
                        );

            return xml;
        }

        private XElement CreateBookingXml(string bookCode, DateTime opDate, string accountID, decimal totalAmount)
        {
            var booking = new XElement("Booking",
                new XElement("Header",
                    new XElement("Action", "1"),
                    new XElement("BookCode", bookCode),

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




    }


    public class XmlBookingDetails
    {
        public decimal TotalAmount { get; set; }

        public List<XmlBookingDetail> Details { get; set; }

        public XmlBookingDetails()
        {
            this.Details = new List<XmlBookingDetail>();
        }


        public ICollection<XElement> GetXml(string accountType, string accountId)
        {
            List<XElement> nodes = new List<XElement>();

            Details.ForEach(d => nodes.Add(d.GetXml(accountType, accountId)));

            return nodes;
        }
    }

    public class XmlBookingDetail
    {
        public decimal Amount { get; set; }

        public string Comment { get; set; }

        // for checking
        public string OrderId { get; set; }
        public string PaymentId { get; set; }

        public XElement GetXml(string accountType, string accountId)
        {
            return new XElement("Detail",
        new XElement("AccountType", accountType),
        new XElement("AccountID", accountId),
        new XElement("Comment", this.Comment),
        new XElement("LineAmountDC", -this.Amount),
        new XElement("LineAmountHC", -this.Amount)
        );

        }

    }
}
