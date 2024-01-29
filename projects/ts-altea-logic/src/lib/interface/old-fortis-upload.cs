    
    
        public bool LoadFile(string fileName, bool stopLoadingWhenExisting, StringBuilder sbLog)
        {

            bool ok = true;
            int lineNum = -1;
            int newTransactions = 0;
            decimal newTransactionsAmount = 0;

            bool isOldUploadFile = false;


            foreach (string line in File.ReadLines(fileName))
            {
                lineNum++;

                if (lineNum == 0)
                {
                    var elements = SplitLine(line);

                    /* The old upload contained "JAAR + REFERTE" as first column,
                     * the new has "Volgnummer" as first column
                     */
                    string firstCol = elements[0];

                    if (firstCol != "JAAR + REFERTE" && firstCol != "Volgnummer")
                    {
                        sbLog.AppendLine("Geen geldig bestand! Op de 1ste lijn wordt de tekst 'JAAR + REFERTE' verwacht.");
                        return false;
                    }

                    if (firstCol == "JAAR + REFERTE")
                        isOldUploadFile = true;
                    

                    continue;
                }

                BankTransaction tx;

                if (isOldUploadFile)
                    tx = ParseLineOld(line);
                else
                    tx = ParseLineFrom202207(line);

                if (!tx.IsValidTransactionNum())
                    continue;

                tx.TransactionNumInt = ConvertransactionNum(tx.TransactionNum);

                /*
                if (lineNum == 1)
                {
                    string account = tx.Account.Replace(" ", "");

                    if (account !=  "BE12001328191492")
                    {
                        sbLog.AppendFormat("Ongeldig rekening nummer: '{0}' (we verwachten 'BE12001328191492')", account).AppendLine();
                        return false;
                    }
                }
                */
                
                
                if (CheckIfExisting(tx))
                {
                    if (stopLoadingWhenExisting)
                        break;
                    else
                        continue;
                    
                }

                var txType = GetBankTransactionType(tx);

                if (txType != null)
                {
                    tx.Type = txType.Type.ToString();
                    tx.RefDate = txType.ForDate;

                    if (txType.Type == BankTxType.TerminalCredit || txType.Type == BankTxType.OnlineCredit || txType.Type == BankTxType.UnidentifiedCredit)
                    {
                        tx.AmountOriginal = txType.AmountOriginal;
                        tx.AmountCost = txType.AmountCost;
                    }
                }


                Ctx.BankTransaction.Add(tx);

                try
                {
                    Ctx.SaveChanges();
                }
                catch (Exception ex)
                {
                    sbLog.AppendFormat("Er is een probleem opgetreden voor lijn nr {0} = transactie {1}:", lineNum, tx.TransactionNum).AppendLine();
                    sbLog.AppendLine(ex.ToString());
                    ok = false;
                    break;
                }

                newTransactions++;
                newTransactionsAmount += tx.Amount;
            }

            sbLog.AppendFormat("{0} nieuwe transacties geladen voor een totaal van € {1:0.0}.", newTransactions, newTransactionsAmount);
            return ok;
        }

    public enum BankTxType
    {
        Unknown,
        AquasenseVoorschot,
        TerminalBC,
        TerminalCredit,
        OnlineBC,
        OnlineCredit,
        UnidentifiedCredit, // normally not used: if it was not terminal or online
        Stripe
    }

    public class BankTransactionType
    {
        public BankTxType Type { get; set; }
        public DateTime? ForDate { get; set; }
        public decimal AmountOriginal { get; set; }
        public decimal AmountCost { get; set; }

        public BankTransactionType()
        {
            this.ForDate = null;
        }
    }


        public BankTransactionType GetBankTransactionType(BankTransaction tx)
        {
            // Stripe

            if (tx.Details.ToLower().Contains("stripe"))
            {
                return new BankTransactionType()
                {
                    Type = BankTxType.Stripe
                };

            }

            // Aquasense voorschotten

            Regex aquasenseVoorschot = new Regex(@"MEDEDELING\s:\s(\d{12})", RegexOptions.IgnoreCase);

            Match aquasenseVoorschotMatch = aquasenseVoorschot.Match(tx.Details);

            if (aquasenseVoorschotMatch.Success)
            {
                string dateTimeString = aquasenseVoorschotMatch.Groups[1].Value;

                DateTime reservationStart;

                bool res = DateTime.TryParseExact(dateTimeString, "yyyyMMddHHmm", CultureInfo.InvariantCulture, DateTimeStyles.None, out reservationStart);

                if (res && reservationStart >= new DateTime(2000, 1, 1) && reservationStart <= new DateTime(2100, 1, 1))
                {
                    BankTransactionType txType = new BankTransactionType()
                    {
                        Type = BankTxType.AquasenseVoorschot,
                        ForDate = reservationStart
                    };

                    return txType;
                }
            }


            BankTxType checkType = BankTxType.Unknown;

            if (tx.Details.Contains("TERMINAL"))
            {
                if (tx.Details.Contains("NR.244665") || tx.Details.Contains("NR.884543"))
                    checkType = BankTxType.TerminalBC;
                else if (tx.Details.Contains("NR.418264"))
                    checkType = BankTxType.OnlineBC;
            }


            if (checkType == BankTxType.TerminalBC || checkType == BankTxType.OnlineBC)
            {
                // It used to be 11-01-2018, format changed to 11/01/2018

                Regex datum = new Regex(@"DATUM : (\d+[-/]\d+[-/]\d+)", RegexOptions.IgnoreCase);

                Match datumMatch = datum.Match(tx.Details);

                if (datumMatch.Success)
                {
                    string dateTimeString = datumMatch.Groups[1].Value;

                    DateTime transactionsDate;

                    bool res = DateTime.TryParseExact(dateTimeString, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out transactionsDate);

                    if (!res)
                        res = DateTime.TryParseExact(dateTimeString, "dd-MM-yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out transactionsDate);

                    if (res)
                    {
                        BankTransactionType txType = new BankTransactionType()
                        {
                            Type = checkType,
                            ForDate = transactionsDate
                        };

                        return txType;
                    }
                }
            }

            Regex regex = new Regex(@"6660.?0000.?0483");

            if (regex.IsMatch(tx.Details))  // Atos World Online
            {
                if (tx.Details.Contains("81986244"))
                    checkType = BankTxType.TerminalCredit;
                else if (tx.Details.Contains("82098696"))
                    checkType = BankTxType.OnlineCredit;
                else
                    checkType = BankTxType.UnidentifiedCredit;

                Regex datum = new Regex(@"(\d+/\d+) BANKREFERENTIE", RegexOptions.IgnoreCase);
                Match datumMatch = datum.Match(tx.Details);

                Regex amounts = new Regex(@"BRT:(\d+,\d+)EUR\s*C:0\s*(\d+,\d+)", RegexOptions.IgnoreCase);
                Match amountsMatch = amounts.Match(tx.Details);

                if (datumMatch.Success && amountsMatch.Success)
                {
                    string dateTimeString = datumMatch.Groups[1].Value + "/" + DateTime.Now.Year.ToString();

                    DateTime transactionsDate;

                    bool res = DateTime.TryParseExact(dateTimeString, "dd/MM/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out transactionsDate);

                    decimal origAmount = decimal.Parse(amountsMatch.Groups[1].Value, CultureInfo.GetCultureInfo("nl-BE"));
                    decimal costAmount = decimal.Parse(amountsMatch.Groups[2].Value, CultureInfo.GetCultureInfo("nl-BE"));

                    if (res)
                    {
                        BankTransactionType txType = new BankTransactionType()
                        {
                            Type = checkType,
                            ForDate = transactionsDate,
                            AmountOriginal = origAmount,
                            AmountCost = costAmount
                        };

                        return txType;
                    }
                }

            }



            return null;
        }





    
        public BankTransaction ParseLineFrom202207(string line)
        {
            string[] elements = SplitLine(line);

            DateTime execDate, valDate;
            DateTime.TryParseExact(elements[1], "d/M/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out execDate);
            DateTime.TryParseExact(elements[2], "d/M/yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out valDate);

            string txtAmount = elements[3];

            // on 1/12/17 Fortis suddenly used '.' as decimal separator
            int dotIdx = txtAmount.LastIndexOf('.');

            if (dotIdx == txtAmount.Length - 3)  // then they used dot as decimal separator
            {
                txtAmount = txtAmount.Replace(',', '|');
                txtAmount = txtAmount.Replace('.', ',');
                txtAmount = txtAmount.Replace('|', '.');
            }
                
            decimal amount;
            decimal.TryParse(txtAmount, NumberStyles.Any, CultureInfo.GetCultureInfo("nl-BE"), out amount);

            BankTransaction tx = null;

            try
            {
                string details = "", info = "", counterpartName = "";

                if (elements.Length > 9)
                    info = elements[9];   // was 6

                if (elements.Length > 10)
                    details = elements[10];   // was 6

                if (elements.Length > 8)
                    counterpartName = elements[8];   // was 6


                tx = new BankTransaction()
                {
                    BankTransactionId = Guid.NewGuid(),
                    TransactionNum = elements[0],
                    ExecutionDate = execDate,
                    ValueDate = valDate,
                    Amount = amount,
                    Currency = elements[4],
                    CounterpartAccount = elements[7],   // was 5
                    Details = details,
                    Account = elements[5],  // was 7
                    AmountCheck = 0,
                    CheckOk = false,
                    CreatedOn = DateTime.Now,
                    Info = info,
                    CounterpartName = counterpartName
                };
            } catch (Exception ex)
            {                
                throw ex;
            }

            /** Fortis added an extra decimal on postion 5*/
            if (tx.TransactionNum != null)
            {
                if (tx.TransactionNum.Length > 9 && tx.TransactionNum[5] == '0')
                {
                    StringBuilder sb = new StringBuilder(tx.TransactionNum);
                    sb.Remove(5, 1);
                    tx.TransactionNum = sb.ToString();
                }
                   
            }

            return tx;
        }


        Regex allExceptDigitsRegex = new Regex(@"[^\d]*");


                public int? ConvertransactionNum(string transactionNum)
        {
            // Convert transaction number to integer: 2013.0125 -> 20130125
            if (!string.IsNullOrWhiteSpace(transactionNum))
            {
                transactionNum = allExceptDigitsRegex.Replace(transactionNum, "");

                int transactionNumInt = 0;

                if (int.TryParse(transactionNum, out transactionNumInt))
                {
                    return transactionNumInt;
                }
            }

            return null;
        }








                public bool LoadFile(string fileName, bool stopLoadingWhenExisting, StringBuilder sbLog)
        {

            bool ok = true;
            int lineNum = -1;
            int newTransactions = 0;
            decimal newTransactionsAmount = 0;

            bool isOldUploadFile = false;


            foreach (string line in File.ReadLines(fileName))
            {
                lineNum++;

                if (lineNum == 0)
                {
                    var elements = SplitLine(line);

                    /* The old upload contained "JAAR + REFERTE" as first column,
                     * the new has "Volgnummer" as first column
                     */
                    string firstCol = elements[0];

                    if (firstCol != "JAAR + REFERTE" && firstCol != "Volgnummer")
                    {
                        sbLog.AppendLine("Geen geldig bestand! Op de 1ste lijn wordt de tekst 'JAAR + REFERTE' verwacht.");
                        return false;
                    }

                    if (firstCol == "JAAR + REFERTE")
                        isOldUploadFile = true;
                    

                    continue;
                }

                BankTransaction tx;

                if (isOldUploadFile)
                    tx = ParseLineOld(line);
                else
                    tx = ParseLineFrom202207(line);

                if (!tx.IsValidTransactionNum())
                    continue;

                tx.TransactionNumInt = ConvertransactionNum(tx.TransactionNum);

                /*
                if (lineNum == 1)
                {
                    string account = tx.Account.Replace(" ", "");

                    if (account !=  "BE12001328191492")
                    {
                        sbLog.AppendFormat("Ongeldig rekening nummer: '{0}' (we verwachten 'BE12001328191492')", account).AppendLine();
                        return false;
                    }
                }
                */
                
                
                if (CheckIfExisting(tx))
                {
                    if (stopLoadingWhenExisting)
                        break;
                    else
                        continue;
                    
                }

                var txType = GetBankTransactionType(tx);

                if (txType != null)
                {
                    tx.Type = txType.Type.ToString();
                    tx.RefDate = txType.ForDate;

                    if (txType.Type == BankTxType.TerminalCredit || txType.Type == BankTxType.OnlineCredit || txType.Type == BankTxType.UnidentifiedCredit)
                    {
                        tx.AmountOriginal = txType.AmountOriginal;
                        tx.AmountCost = txType.AmountCost;
                    }
                }


                Ctx.BankTransaction.Add(tx);

                try
                {
                    Ctx.SaveChanges();
                }
                catch (Exception ex)
                {
                    sbLog.AppendFormat("Er is een probleem opgetreden voor lijn nr {0} = transactie {1}:", lineNum, tx.TransactionNum).AppendLine();
                    sbLog.AppendLine(ex.ToString());
                    ok = false;
                    break;
                }

                newTransactions++;
                newTransactionsAmount += tx.Amount;
            }

            sbLog.AppendFormat("{0} nieuwe transacties geladen voor een totaal van € {1:0.0}.", newTransactions, newTransactionsAmount);
            return ok;
        }

        
        public int? ConvertransactionNum(string transactionNum)
        {
            // Convert transaction number to integer: 2013.0125 -> 20130125
            if (!string.IsNullOrWhiteSpace(transactionNum))
            {
                transactionNum = allExceptDigitsRegex.Replace(transactionNum, "");

                int transactionNumInt = 0;

                if (int.TryParse(transactionNum, out transactionNumInt))
                {
                    return transactionNumInt;
                }
            }

            return null;
        }