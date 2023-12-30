import { Injectable } from '@angular/core';
import { ScheduleService } from './schedule.service';
import { DbQuery, QueryOperator } from 'ts-common';
import { Branch } from 'ts-altea-model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  formats = {
    date: 'dd/MM/yyyy',
    dateShort: 'dd/MM'
  }

  public currency = 'EUR'
  public currencySymbol = ' €'  
  public idxStep = 100

  public orgId?: string = "66e77bdb-a5f5-4d3d-99e0-4391bded4c6c"
  public branch = "aqua"
  public branchId?: string = "66e77bdb-a5f5-4d3d-99e0-4391bded4c6c"

  //public backend = "http://192.168.5.202:8080"
  //public backend = "https://altea-1.ew.r.appspot.com"

  // public backend = "https://dvit-477c9.uc.r.appspot.com"
   public backend = "http://localhost:8080"

   


}
