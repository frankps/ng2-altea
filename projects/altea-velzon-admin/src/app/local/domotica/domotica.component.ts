import { Component, OnInit } from '@angular/core';
import { plainToInstance } from 'class-transformer';
import { LocalService } from 'ng-altea-common';
import { Action, ActionType, Event, LuxomAddress, LuxomState, LuxomGetState } from 'ts-altea-model';
import { ApiListResult } from 'ts-common';

@Component({
  selector: 'app-domotica',
  templateUrl: './domotica.component.html',
  styleUrls: ['./domotica.component.scss']
})
export class DomoticaComponent implements OnInit {

  luxomStates: LuxomState[]



  constructor(protected localSvc: LocalService) {

  }

  async ngOnInit(): Promise<void> {

    this.luxomStates = LuxomAddress.getAllAddressStates()
    console.log(this.luxomStates)


    //await this.getLuxomState()
  }

  test() {
    console.error('test')
  }

  async getSaunaState() {


    const luxomState = new LuxomGetState([LuxomAddress.saunaStoombad])

    const action = new Action(ActionType.luxomState, luxomState)

    const res = await this.localSvc.executeAction$(action)

    console.warn(res)
  }


  async getLuxomState() {

    const addresses = LuxomAddress.getAllAddresses()
    const luxomState = new LuxomGetState(addresses)

    const action = new Action(ActionType.luxomState, luxomState)

    let res: ApiListResult<any>

    try {
      res = await this.localSvc.executeAction$(action)
    } catch (error) {
      console.error(error)
    }
     

    console.warn(res)

    if (res.status != 'ok' || !res.data)
      return

    var states: LuxomState[] = plainToInstance(LuxomState, res.data as any[])

    for (let state of states) {

      if (!state.cmd)
        continue

      const luxomState = this.luxomStates.find(s => s.addr.grp == state.addr.grp && s.addr.addr == state.addr.addr)

      if (luxomState) {
        luxomState.cmd = state.cmd

        if (state.hex)
          luxomState.hex = state.hex
        else
          luxomState.hex = undefined
        //luxomState.hex = stat

      }


    }

    //    plainToInstance()

    console.error(res)
  }


  async clickLuxom(address: LuxomAddress) {

    const luxomCmd = new LuxomState("T", address)

    const action = new Action(ActionType.luxom, luxomCmd)

    const res = await this.localSvc.executeAction$(action)

    console.error(res)

  }



}
