using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Globalization;
using System.Xml.Linq;
using System.Xml;
using SukData = Sukosan.Data;
using DoclData = Docl.Data;
using OpenBizData = Dvit.OpenBiz.Model;
using Dvit.OpenBiz.Model;
using Dvit.OpenBiz.Database;
using Dvit.OpenBiz.Pcl;

namespace Sukosan.WinTools.Interfaces
{
    public class BankToWingsResponse
    {
        public string Message { get; set; }
        public string XmlResult { get; set; }
    }

    public class BankToWings
    {

        public void SetMissingBankTransactionNums()
        {
            SukData.SukosanEntities sukCtx = new SukData.SukosanEntities();
            OpenBizContext openBizCtx = new OpenBizContext();

            List<Payment> payments = openBizCtx.Payment.Where(p => p.BankTransactionId != null && p.BankTransactionNum == null).ToList();

            if (payments != null && payments.Count() > 0)
            {
                List<Guid> bankTxIds = payments.Select(p => new Guid(p.BankTransactionId)).Distinct().ToList();

                List<Data.BankTransaction> bankTxs = sukCtx.BankTransaction.Where(tx => bankTxIds.Contains(tx.BankTransactionId)).ToList();

                foreach (var bankTx in bankTxs)
                {
                    string bankTxId = bankTx.BankTransactionId.ToString();
                    List<Payment> paymentsToUpdate = payments.Where(p => p.BankTransactionId == bankTxId).ToList();

                    foreach (Payment pay in paymentsToUpdate)
                    {
                        pay.BankTransactionNum = bankTx.TransactionNum;
                    }
                }

                openBizCtx.SaveChanges();
            }

        }


        //DateTime from, DateTime to

        /// <summary>
        /// 
        /// </summary>
        /// <param name="startTransactionNum">Format: yyyymm</param>
        /// <param name="endTransactionNum"></param>
        /// <param name="rootPath"></param>
        /// <param name="opDate"></param>
        /// <param name="runningNumber"></param>
        /// <param name="dossierId"></param>
        /// <param name="dagBoek"></param>
        /// <param name="rekening"></param>
        /// <param name="defaultWingsSupplierId"></param>
        /// <param name="defaultWingsCustomerId"></param>
        /// <returns></returns>
        public BankToWingsResponse Export(int startTransactionNum, int endTransactionNum, string rootPath, DateTime? opDate, string runningNumber, string dossierId, string dagBoek, string rekening, string defaultWingsSupplierId, string defaultWingsCustomerId)
        {
            const string daVinciBankAccount = "BE12001328191492";

            SukData.SukosanEntities sukCtx = new SukData.SukosanEntities();
            DoclData.DocumentSolutionsEntities doclCtx = new DoclData.DocumentSolutionsEntities();
            OpenBizContext openBizCtx = new OpenBizContext();
            //  SandData.SandlightEntities sandCtx = new SandData.SandlightEntities();
            
            /*
             Specifieke voorbeelden van financiële verrichtingen zitten er niet bij de documentatie, denk ik.  
             * Je kan deze echter gewoon doorsturen via de YBooking interface.  Als dagboek dien je het 
             *      financieel dagboek = "BANK"
             *  te gebruiken en de eerste detaillijn is verplicht de 
             *      financiële rekening die overeenstemt met dit dagboek 
             * en waarop je het verschil tussen 
             * begin- en eindsaldo boekt.  Als het saldo-verschil 0 is, moet je dat ook boeken.
            * Verduidelijkt dat al iets?
            */

            var txs = sukCtx.BankTransaction.Include("BankTxDocLink").Where(t =>
                t.Account == daVinciBankAccount
                && t.TransactionNumInt.HasValue
                && t.TransactionNumInt.Value >= startTransactionNum
                && t.TransactionNumInt.Value <= endTransactionNum
                )
                .OrderBy(t => t.TransactionNum)
                .ToList();

            List<string> bankTransactionIds = txs.Select(tx => tx.BankTransactionId.ToString()).Distinct().ToList();

            List<Payment> txPayments = openBizCtx.Payment.Include("Order.Gifts").Where(p => bankTransactionIds.Contains(p.BankTransactionId)).ToList();
            
            SukData.BankTransaction first = txs.FirstOrDefault(t => t.TransactionNumInt.Value == startTransactionNum);
            SukData.BankTransaction last = txs.FirstOrDefault(t => t.TransactionNumInt.Value == endTransactionNum);

            StringBuilder sb = new StringBuilder();

            StringBuilder sbMessage = new StringBuilder();

            sbMessage.AppendFormat("Aantal transacties: {0}", txs.Count()).AppendLine();

            if (first != null)
                sbMessage.AppendFormat("Van: {0} -> {1:dd/MM/yyyy}", first.TransactionNum, first.ValueDate).AppendLine();
            else
                sbMessage.AppendFormat("Begin transactie '{0}' niet gevonden!", startTransactionNum.ToString()).AppendLine();

            if (last != null)
                sbMessage.AppendFormat("Tot: {0} -> {1:dd/MM/yyyy}", last.TransactionNum, last.ValueDate).AppendLine();
            else
                sbMessage.AppendFormat("Eind transactie '{0}' niet gevonden!", endTransactionNum.ToString()).AppendLine();

            if (last != null  && (opDate == null || !opDate.HasValue))
            {
                opDate = last.ValueDate;
            }

            sbMessage.AppendFormat("opDate: {0:dd/MM/yyyy}", opDate.Value).AppendLine();

            if (string.IsNullOrWhiteSpace(runningNumber))
            {
                runningNumber = last.ValueDate.Month.ToString().PadLeft(3, '0');
            }

            sbMessage.AppendFormat("runningNumber: {0}", runningNumber).AppendLine();

            foreach (var tx in txs)
            {
                sb.AppendFormat("{0}: {1}  {2}", tx.ExecutionDate, decimal.Round(tx.Amount, 2).ToString().PadLeft(10), tx.TransactionNum);
                sb.AppendLine();
            }

            Console.WriteLine(sb.ToString());

            XNamespace ns = "http://www.w3.org/2001/XMLSchema-instance";

            decimal totalAmount = txs.Sum(t => t.Amount);

            //  DateTime opDate = new DateTime(2013, 3, 10);

            var booking = new XElement("Booking",
                new XElement("Header",
                    new XElement("Action", "1"),
                    new XElement("BookCode", dagBoek),
                    new XElement("RunningNumber", runningNumber),
                        new XElement("OpDate", opDate.Value.ToString("yyyyMMdd")),

                     new XElement("HdrCurrencyID", "EUR")),
                new XElement("Detail",
                     new XElement("AccountType", "1"),
                        new XElement("AccountID", rekening),
                        new XElement("LineAmountDC", totalAmount),
                        new XElement("LineAmountHC", totalAmount)
                        )
                    );


            string wingsDagontvangstenCustomerId = "00000022";

            StringBuilder balanceLog = new StringBuilder();

            decimal balance = totalAmount;

            int txNum = startTransactionNum;
            foreach (var tx in txs)
            {
                decimal lineAmountDC = 0;
                XElement extraCost = null;


                if (txNum != tx.TransactionNumInt.Value)
                {
                    sbMessage.AppendFormat("Probleem? Transactie nummer {0} werd verwacht, maar is blijkbaar {1}!", txNum, tx.TransactionNumInt.Value).ToString();
                    txNum = tx.TransactionNumInt.Value;
                }

                string accountType = "";  // supplier account
                string accountId = "";
                string extraInfo = "";

                decimal txAmount = tx.Amount;
                decimal invoicedAmount = 0;
                decimal giftAmount = 0;

                int nrOfInvoicesForTx = 0;

                string txId = tx.BankTransactionId.ToString();

                // var payments = openBizCtx.Payment.Include("Order.Gifts").Where(p => p.BankTransactionId == txId).ToList();
                List<Payment> paymentsForTx = txPayments.Where(p => p.BankTransactionId == txId).ToList();

                if (paymentsForTx != null && paymentsForTx.Count() > 0) //txAmount > 0)
                {


                    accountType = "2"; // customer account: Daginkomsten, etc ...

                    accountId = wingsDagontvangstenCustomerId;
                    

                        int nrOfInvoices = paymentsForTx.Count(p => p.Order.IsInvoiced);

                        if (nrOfInvoices > 0)
                        {
                            // accountId = defaultWingsCustomerId;

                            /*
                            var payInvoiced = payments.FirstOrDefault(p => p.Order.IsInvoiced);                            
                            extraInfo = string.Format("factuur:{0}", payInvoiced.Order.InvoiceCode);
                            */

                            foreach (var payment in paymentsForTx.Where(p => p.Order.IsInvoiced))
                            {

                                invoicedAmount += payment.Amount;
                                txAmount -= payment.Amount;
                                lineAmountDC = -payment.Amount;
                                balance += lineAmountDC;

                                string giftInfo = "";
                                if (payment.Order.IsGift)  // || (payment.Order.Gifts != null && payment.Order.Gifts.Count() > 0)
                                    giftInfo = "en cadeau:" + (payment.Order.GiftCode != null ? payment.Order.GiftCode : "null");

                                string invoiceDetails = string.Format("factuur:{0} {1}", payment.Order.InvoiceNumber, giftInfo);

                                booking.Add(CreateDetail(accountType, defaultWingsCustomerId, lineAmountDC, tx.TransactionNum, tx.ExecutionDate, invoiceDetails, tx.RefDate));

                                nrOfInvoicesForTx++;
                            }
                        }

                        int nrOfGifts = paymentsForTx.Count(p => p.Order.IsGift || p.Order.OrderSubType == OrderSubType.CreditUpload);  //  || (p.Order.Gifts != null && p.Order.Gifts.Count() > 0)

                        if (nrOfGifts > 0)
                        {
                            // gifts that are NO invoices
                            foreach (var payment in paymentsForTx.Where(p => !p.Order.IsInvoiced
                                && (p.Order.IsGift || p.Order.OrderSubType == OrderSubType.CreditUpload))) // || (p.Order.Gifts != null && p.Order.Gifts.Count() > 0)
                            {
                                giftAmount += payment.Amount;
                                txAmount -= payment.Amount;
                                lineAmountDC = -payment.Amount;
                                balance += lineAmountDC;

                                string giftDetails = "";

                                if (payment.Order.IsGift)
                                    giftDetails = string.Format("cadeau:{0}", payment.Order.GiftCode != null ? payment.Order.GiftCode : "null");
                                else
                                    giftDetails = "credit upload";

                                booking.Add(CreateDetail(accountType, defaultWingsCustomerId, lineAmountDC, tx.TransactionNum, tx.ExecutionDate, giftDetails, tx.RefDate));

                                nrOfInvoicesForTx++;
                            }

                        }
                    
                    
                    if (!string.IsNullOrWhiteSpace(tx.Type))
                    {
                        string txType = tx.Type.ToLower();

                        /* een kredietkaart betaling wordt gesplitst in 2 lijnen:
                         *     bedrag excl kost
                         *     kost v/h gebruik v/d kredietkaart
                         */
                        if ((txType == "kredietkaart" || txType.Contains("credit") || txType == "stripe")
                            && tx.AmountOriginal.HasValue
                            && tx.AmountCost.HasValue)
                        {
                            txAmount = tx.AmountOriginal.Value - invoicedAmount - giftAmount;
                            
                            lineAmountDC = tx.AmountCost.Value;
                            balance += lineAmountDC;

                           switch (txType)
                            {
                                case "stripe":
                                    // create record for supplier Stripe
                                    extraCost = CreateDetail("3", "00000672", lineAmountDC, tx.TransactionNum, tx.ExecutionDate, "kost Stripe", tx.RefDate);

                                    break;

                                default:
                                    extraCost = CreateDetail("1", "656100", lineAmountDC, tx.TransactionNum, tx.ExecutionDate, "kosten kaart", tx.RefDate);
                                    break;
                            }

                     }
                    }
                }  
                else   // not linked to orders (payments) => suppliers
                {
                    accountType = "3";  // supplier account
                    accountId = defaultWingsSupplierId;

                    SukData.BankTxDocLink txDocLink = tx.BankTxDocLink.FirstOrDefault();

                    if (txDocLink != null)
                    {
                        DoclData.Doc doc = doclCtx.Doc.Include("FromParty").FirstOrDefault(d => d.DocId == txDocLink.DocId);

                        if (!string.IsNullOrWhiteSpace(doc.FromParty.AccountingSupplierId))
                        {
                            accountId = doc.FromParty.AccountingSupplierId;
                        }
                    }
                }

                lineAmountDC = -txAmount;
                balance += lineAmountDC;

                //string comment = string.Format("{0} {2} {1:dd/MM/yy}", tx.TransactionNum, tx.ExecutionDate, extraInfo);
                if (lineAmountDC != 0)
                {
                    if (!string.IsNullOrWhiteSpace(tx.Type))
                        extraInfo = tx.Type;

                    booking.Add(CreateDetail(accountType, accountId, lineAmountDC, tx.TransactionNum,
                        tx.RefDate.HasValue ? tx.RefDate.Value : tx.ExecutionDate,
                        extraInfo));
                }


                if (extraCost != null)
                    booking.Add(extraCost);

                txNum++;
            }

            sbMessage.Append("Balance check: ");

            if (balance == 0)
                sbMessage.AppendLine("OK, balance is 0.");
            else
                sbMessage.AppendFormat("niet OK: balance is {0} (maar zou 0 moeten zijn!)", balance).AppendLine();


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

            //  xml.Add(new XAttribute("http://www.w3.org/2001/XMLSchema-instance"));

            StringBuilder sbContent = new StringBuilder();

            sbContent.AppendLine(@"<?xml version=""1.0"" encoding=""UTF-8""?>");
            sbContent.Append(xml.ToString());

            BankToWingsResponse resp = new BankToWingsResponse()
            {
                Message = sbMessage.ToString(),
                XmlResult = sbContent.ToString()
            };

            return resp;
        }

        private XElement CreateDetail(string accountType, string accountId, decimal lineAmountDC, string transactionNum, DateTime executionDate, string extraInfo, DateTime? refDate = null)
        {
            string prefix = "";
            string suffix = "";

            if (refDate.HasValue && refDate.Value.Month != executionDate.Month)
            {
                prefix = "*";
                suffix = string.Format("*{0:dd/MM}", refDate.Value);
            }

            string comment = string.Format("{3}{0} {1:dd/MM/yy} {2} {4}", transactionNum, executionDate, extraInfo, prefix, suffix);
            return CreateDetail(accountType, accountId, lineAmountDC, comment);
        }

        private XElement CreateDetail(string accountType, string accountId, decimal lineAmountDC, string comment)
        {
            return new XElement("Detail",
                    new XElement("AccountType", accountType),
                    new XElement("AccountID", accountId),
                    new XElement("LineAmountDC", lineAmountDC),
                    new XElement("LineAmountHC", lineAmountDC),
                    new XElement("Comment", comment)
                    );
        }

        public void GenerateTransactionNumInt(Data.SukosanEntities ctx = null)
        {
            Regex allExceptDigitsRegex = new Regex(@"[^\d]*");

            if (ctx == null)
                ctx = new SukData.SukosanEntities();

            var txs = ctx.BankTransaction.Where(t => !t.TransactionNumInt.HasValue);

            foreach (var tx in txs)
            {


                string transactionNum = allExceptDigitsRegex.Replace(tx.TransactionNum, "");

                int transactionNumInt = 0;

                if (int.TryParse(transactionNum, out transactionNumInt))
                {
                    tx.TransactionNumInt = transactionNumInt;
                }
            }

            ctx.SaveChanges();
        }

    }

    /* An example:
     * 
      <?xml version="1.0" encoding="UTF-8" ?>
  <WingsAccounting>
    <Session>
      <Connection>
        <RootPath>C:\Program Files\Wings</RootPath>
        <DossierID>9999</DossierID>
      </Connection>
      <BookingBatch>
        <Booking>
          <Header>
            <Action>1</Action>
            <BookCode>BANK</BookCode>
            <RunningNumber>003</RunningNumber>
            <OpDate>20130310</OpDate>
            <HdrCurrencyID>EUR</HdrCurrencyID>
          </Header>
          <Detail>
            <AccountType>1</AccountType>
            <AccountID>550000</AccountID>
            <LineAmountDC>1002.50</LineAmountDC>
          </Detail>
          <Detail>
            <AccountType>2</AccountType>
            <AccountID>00000022</AccountID>
            <LineAmountDC>-699.50</LineAmountDC>
            <Comment>2013-0307: 01/03/13</Comment>
          </Detail>
          <Detail>
            <AccountType>2</AccountType>
            <AccountID>00000022</AccountID>
            <LineAmountDC>-303.00</LineAmountDC>
            <Comment>2013-0308: 01/03/13</Comment>
          </Detail>
        </Booking>
      </BookingBatch>
    </Session>
  </WingsAccounting>

     */


}
