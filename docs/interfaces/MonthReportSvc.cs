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
using Dvit.OpenBiz.Model;
using Dvit.OpenBiz.Database;
using Dvit.OpenBiz.Pcl;
/*
using Sandlight.Data;
using SandData = Sandlight.Data;*/


namespace Sukosan.Services.Reporting
{
    public class MonthReportSvc
    {
        SukosanEntities _SukCtx = new SukosanEntities();

        OpenBizContext _ObCtx = new OpenBizContext();
        

        public void GetNegativeCash(int year, int month, string orgId)
        {
            DateTime from = new DateTime(year, month, 1);
            DateTime to = from.AddMonths(1);   // from.AddDays(8); //

            var paysForMonth = this._ObCtx.Payment.Include("Order.Party").Where(p => p.Order.OrganisationId == orgId
              //  && p.PaymentType == PaymentType.Cash
                 && p.Date >= from
                        && p.Date < to && (p.Amount == 276 || p.Amount == -276)).ToList();
            
            foreach (var pay in paysForMonth)
            {
                Console.Out.WriteLine($"{pay.Date.ToString("dd/MM/yy")} {pay.Amount} {pay.PaymentType.ToString()}   Tx:{pay.BankTransactionNum}");

                if (pay.Order != null && pay.Order.Date.HasValue)
                    Console.Out.WriteLine($"{pay.Order.Date.Value.ToString("dd/MM/yy")}");

                if (pay.Order.Party != null)
                    Console.Out.WriteLine($"{pay.Order.Party.Name}");


                var taxes = this._ObCtx.OrderTax.Where(ot => ot.OrderId == pay.OrderId);

                if (taxes != null)
                {
                    foreach (var tax in taxes)
                    {
                        Console.Out.WriteLine($" tax: {tax.DeclaredInPeriod}: {tax.Declared}");
                    }
                }

            } 


            /*
                        && !p.Order.IsGift
                        && !p.Order.IsInvoiced
                        && p.Order.OrderSubType != OrderSubType.CreditUpload
                        && p.Date >= from
                        && p.Date < to
                        && (short)p.PaymentType >= 100 && (short)p.PaymentType < 200); */
        }


        public string Create(int year, int month, string orgId)
        {
            DateTime from = new DateTime(year, month, 1);
            DateTime to = from.AddMonths(1);   // from.AddDays(8); //

            var paysForMonth = this._ObCtx.Payment.Where(p => p.Order.OrganisationId == orgId
                        && !p.Order.IsGift
                        && !p.Order.IsInvoiced
                        && p.Order.OrderSubType != OrderSubType.CreditUpload
                        && p.Date >= from
                        && p.Date < to
                        && (short)p.PaymentType >= 100 && (short)p.PaymentType < 200);


            int taxPeriod = (year - 2000) * 100 + month;
            var orderTaxes = this._ObCtx.OrderTax.Where(ot => ot.TaxPeriod == taxPeriod).ToList();


            string minTxNumTxt = paysForMonth.Min(p => p.BankTransactionNum);
            string maxTxNumTxt = paysForMonth.Max(p => p.BankTransactionNum);

            int minTxNum = int.Parse(minTxNumTxt.Replace("-", ""));
            int maxTxNum = int.Parse(maxTxNumTxt.Replace("-", ""));
            List<string> bankTxId = paysForMonth.Select(p => p.BankTransactionId).Distinct().ToList();

            List<BankTransaction> txs = this._SukCtx.BankTransaction.Where(t => t.TransactionNumInt >= minTxNum && t.TransactionNumInt <= maxTxNum)
                .OrderBy(t => t.TransactionNumInt).ToList();

            List<string> txIds = txs.Select(t => t.BankTransactionId.ToString()).ToList();


            var paysForTransactions = this._ObCtx.Payment.Where(p => txIds.Contains(p.BankTransactionId));

            TxReport report = new TxReport(this._ObCtx);

            foreach (BankTransaction tx in txs)
            {
                string txId = tx.BankTransactionId.ToString();

                List<OB.Payment> txPaysForMonth = paysForMonth.Where(p => p.BankTransactionId == txId).ToList();

                if (txPaysForMonth == null || txPaysForMonth.Count == 0)
                    continue;

                List<OB.Payment> allPays = paysForTransactions.Where(p => p.BankTransactionId == txId).ToList();

                var orderIds = txPaysForMonth.Select(pays => pays.OrderId).ToList();
                var orderTaxesForTx = orderTaxes.Where(ot => orderIds.Contains(ot.OrderId)).ToList();

                TxReportLine reportLine = new TxReportLine(tx, txPaysForMonth, allPays, orderIds, orderTaxesForTx);
                report.Add(reportLine);
            }

            decimal totalForMonth = paysForMonth.Sum(p => p.Amount);

            StringBuilder sb = new StringBuilder();


            /* Introduced in nov 2020:  */
            var nonLinkedPayments = paysForMonth.Where(p => p.BankTransactionId == null || !txIds.Contains(p.BankTransactionId)).ToList();

            if (nonLinkedPayments.Count() >= 0)
            {
                nonLinkedPayments.ForEach(pay =>
                {
                    sb.AppendLine($"??? Not linked: {pay.Amount} <br/>");
                });
            }



            sb.AppendLine($"Total for month: {totalForMonth} <br/>");
            sb.AppendLine(report.ToString());

            return sb.ToString();
        }

        public class TxReport
        {
            OpenBizContext _ObCtx = new OpenBizContext();

            public TxReport(OpenBizContext obCtx)
            {
                this._ObCtx = obCtx;
            }

            public List<TxReportLine> Lines { get; set; }


            public void Add(TxReportLine reportLine)
            {
                if (this.Lines == null)
                    this.Lines = new List<TxReportLine>();

                this.Lines.Add(reportLine);
            }

            public string CheckOrderTaxes(TxReportLine reportLine)
            {
                StringBuilder sb = new StringBuilder();

                foreach (string orderId in reportLine.OrderIds)
                {
                    var pays = reportLine.PaysInMonth.Where(p => p.OrderId == orderId);
                    var paysSum = pays.Sum(p => p.Amount);

                    var taxes = reportLine.OrderTaxes.Where(ot => ot.OrderId == orderId);
                    var taxesSum = taxes.Sum(t => t.DeclaredInPeriod);

                    if (paysSum != taxesSum)
                    {
                        sb.AppendLine($"     Tax prob? {orderId}: pays={paysSum} taxes={taxesSum} <br/>");
                    }

                }

                return sb.ToString();
            }


            public override string ToString()
            {
                if (Lines == null || Lines.Count == 0)
                    return "Report is empty";

                StringBuilder sb = new StringBuilder();

                decimal totalSumOfPays = 0;

                foreach (var line in Lines.OrderBy(l => l.Tx.TransactionNumInt))
                {
                    bool ok = line.CrossCheckPaymentsOk();

                    decimal sumOfPays = line.SumOfPaysInMonth();
                    totalSumOfPays += sumOfPays;

                    string msg = "OK";

                    if (!ok)
                    {
                        
                        msg = $"Problem? Diff with payments {line.TxAmount - sumOfPays}";
                    }

                    sb.AppendLine($"{line.Tx.TransactionNum}: Betalingen={sumOfPays} - Bank tx total: {line.TxAmount}  {msg} <br/>");


                    decimal sumOfOrderTax = line.SumOfOrderTax();
                    if (line.TxAmount > sumOfOrderTax)
                    {
                        sb.AppendLine($"      OrderTax problem?: total order tax={sumOfOrderTax} => diff={line.TxAmount - sumOfOrderTax} (tx > payments > orders > ordertax) <br/>");

                        sb.AppendLine(this.CheckOrderTaxes(line));
                    }

                    if (!ok)
                    {
                        /*
                        foreach (OB.Payment pay in line.DeclaratedPays)
                        {
                            sb.AppendLine($"      {pay.Date.ToString("dd/MM")}: {pay.Amount}");
                        }   */

                        sb.AppendLine($"    Ontbrekende betalingen: <br/>");

                        foreach (OB.Payment pay in line.MissingPays)
                        {
                            var order = this._ObCtx.Order.Include("Party").FirstOrDefault(o => o.Id == pay.OrderId);

                            String extraInfo = "";

                            if (order != null) {
                                if (order.IsInvoiced)
                                {
                                    extraInfo += $" Factuur: {order.InvoiceNumber}";
                                }

                                if (order.IsGift)
                                {
                                    extraInfo += $" Cadeaubon: {order.GiftCode}";
                                }

                                if (order.Party != null)
                                {
                                    extraInfo += " " + order.Party.Name;
                                }

                                if (order.Date.HasValue)
                                {
                                    extraInfo += " Datum:" + order.Date.Value.ToString("dd/MM/yyyy HH:mm");
                                }

                                extraInfo += $" >> {order.Id}";
                            }


                            sb.AppendLine($"      {pay.Date.ToString("dd/MM")}: {pay.Amount} >> {extraInfo} <br/>");
                        }
                    }
                }

                sb.AppendLine($"Sum of all payments: <b>{totalSumOfPays}</b> </br>");

                return sb.ToString();
            }

        }

        public class TxReportLine
        {
            public BankTransaction Tx { get; set; }

            public List<OB.Payment> PaysInMonth { get; set; }

            public List<OB.Payment> AllPays { get; set; }

            public List<string> OrderIds { get; set; }

            public List<OB.OrderTax> OrderTaxes { get; set; }

            public TxReportLine()
            {
            }




            public TxReportLine(BankTransaction tx, List<OB.Payment> paysInMonthDeclaration, List<OB.Payment> allPays, List<string> orderIds, List<OB.OrderTax> orderTaxes)
            {
                if (paysInMonthDeclaration == null)
                    paysInMonthDeclaration = new List<OB.Payment>();

                if (allPays == null)
                    allPays = new List<OB.Payment>();

                this.Tx = tx;
                this.PaysInMonth = paysInMonthDeclaration;
                this.AllPays = allPays;
                this.OrderIds = orderIds;
                this.OrderTaxes = orderTaxes;
            }


            public decimal TxAmount
            {
                get
                {
                    if (Tx == null)
                        return 0;

                    return Tx.AmountOriginal.HasValue ? Tx.AmountOriginal.Value : Tx.Amount;
                }
            }


            public List<OB.Payment> MissingPays
            {
                get
                {
                    if (AllPays == null)
                        return new List<OB.Payment>();

                    List<string> payIdsInMonth = null;

                    if (PaysInMonth == null)
                        payIdsInMonth = new List<string>();
                    else
                        payIdsInMonth = PaysInMonth.Select(dp => dp.Id).ToList();
                    
                    return AllPays.Where(p => !payIdsInMonth.Contains(p.Id)).ToList();
                }
            }

            public decimal SumOfPaysInMonth()
            {
                if (this.PaysInMonth == null)
                    return 0;

                return this.PaysInMonth.Sum(p => p.Amount);
            }

            public bool CrossCheckPaymentsOk()
            {
                decimal sumPays = this.SumOfPaysInMonth();
                if (this.TxAmount - sumPays == 0)
                    return true;
                else
                    return false;
            }

            public decimal SumOfOrderTax()
            {
                if (this.OrderTaxes == null)
                    return 0;

                return this.OrderTaxes.Sum(ot => ot.DeclaredInPeriod);
            }


            public bool OrderTaxCheckOk()
            {
                var declaredInPeriod = this.OrderTaxes.Sum(ot => ot.DeclaredInPeriod);

                return (this.TxAmount > declaredInPeriod);
                   
            }


            /*
                         


            public bool Add(OB.Payment pay)
            {
                TxReportLine line = Lines.FirstOrDefault(t => t.Tx.TransactionNum == pay.BankTransactionNum);

                if (line == null)
                    return false;

                line.Add(pay);
                return true;
            }
            
            
             
            public int NumOfPays()
            {
                if (Pays == null)
                    return 0;

                return Pays.Count;
            }

            public void Add(OB.Payment pay)
            {
                if (this.Pays == null)
                    this.Pays = new List<OB.Payment>();

                this.Pays.Add(pay);
            }

            public decimal SumOfPays()
            {
                if (this.Pays == null)
                    return 0;

                return this.Pays.Sum(p => p.Amount);
            }
            */
        }
    }
}
