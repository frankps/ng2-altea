import { Component, ViewChild } from '@angular/core';
import { FortisBankImport } from 'ts-altea-logic';
import { ObjectService } from '../../object.service';
import { DashboardService, ToastType } from 'ng-common'
import { ApiStatus } from 'ts-common';


export class CSVRecord {
  public Volgnr: any;
  public UitvoerDat: any;
  public ValutaDat: any;
  public Bedrag: any;
  public ValutaRek: any;
  public RekNr: any;
  public TypeVer: any;
  public Tegenpartij: any;
  public NaamTegenpartij: any;
  public Mededeling: any;
  public Details: any;
  public Status: any;
  public RedenWeigering: any;
}

@Component({
  selector: 'altea-lib-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {


  constructor(protected backEndSvc: ObjectService, public dashboardSvc: DashboardService) { }


  public records: any[] = [];
  @ViewChild('csvReader') csvReader: any;

  uploadListener($event: any): void {

    console.log('UPLOAD BANK')

    let me = this

    /*     console.error('Start UPLOAD !!')
        return */

    let text = [];
    let files = $event.srcElement.files;

    if (this.isValidCSVFile(files[0])) {

      let input = $event.target;
      let reader = new FileReader();
      reader.readAsText(input.files[0]);

      reader.onload = async () => {
        let csvData = reader.result;
        let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);

        const rowsOfCols = csvRecordsArray.map(row => row.split(';'))

        let fortisImport = new FortisBankImport(this.backEndSvc)

        let importResult = await fortisImport.import(rowsOfCols)

        switch (importResult.status) {
          case ApiStatus.ok:
            me.dashboardSvc.showToastType(ToastType.saveSuccess)
            break
          case ApiStatus.warning:
            me.dashboardSvc.showToastType(ToastType.saveNoChanges)
            break

          default:
            me.dashboardSvc.showToastType(ToastType.saveError)


        }



        /*
                let headersRow = this.getHeaderArray(csvRecordsArray);  
          
                this.records = this.getDataRecordsArrayFromCSVFile(csvRecordsArray, headersRow.length);  
                console.error(this.records)
        */



      };

      reader.onerror = function () {
        console.log('error is occured while reading file!');
      };
    } else {
      alert("Please import valid .csv file.");
      this.fileReset();
    }
  }

  getDataRecordsArrayFromCSVFile(csvRecordsArray: any, headerLength: any) {
    let csvArr = [];

    for (let i = 1; i < csvRecordsArray.length; i++) {
      let curruntRecord = (<string>csvRecordsArray[i]).split(';');

      if (curruntRecord.length == headerLength) {
        let csvRecord: CSVRecord = new CSVRecord();
        csvRecord.Volgnr = curruntRecord[0]?.trim();
        csvRecord.UitvoerDat = curruntRecord[1]?.trim();
        csvRecord.ValutaDat = curruntRecord[2]?.trim();
        csvRecord.Bedrag = curruntRecord[3]?.trim();
        csvRecord.ValutaRek = curruntRecord[4]?.trim();
        csvRecord.RekNr = curruntRecord[5]?.trim();

        csvRecord.TypeVer = curruntRecord[6]?.trim();
        csvRecord.Tegenpartij = curruntRecord[7]?.trim();
        csvRecord.NaamTegenpartij = curruntRecord[8]?.trim();
        csvRecord.Mededeling = curruntRecord[9]?.trim();
        csvRecord.Details = curruntRecord[10]?.trim();
        csvRecord.Status = curruntRecord[11]?.trim();
        csvRecord.RedenWeigering = curruntRecord[12]?.trim();

        csvArr.push(csvRecord);
      }
    }
    return csvArr;
  }


  isValidCSVFile(file: any) {
    return file.name.endsWith(".csv");
  }

  fileReset() {
    this.csvReader.nativeElement.value = "";
    this.records = [];
  }

  getHeaderArray(csvRecordsArr: any) {
    let headers = (<string>csvRecordsArr[0]).split(';');
    let headerArray = [];
    for (let j = 0; j < headers.length; j++) {
      headerArray.push(headers[j]);
    }
    return headerArray;
  }

}
