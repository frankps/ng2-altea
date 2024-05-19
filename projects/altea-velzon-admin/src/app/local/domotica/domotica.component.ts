import { Component, OnInit } from '@angular/core';
import { plainToInstance } from 'class-transformer';
import { LocalService } from 'ng-altea-common';
import { Action, ActionType, Event, LuxomAddress, LuxomState, LuxomGetState } from 'ts-altea-model';

@Component({
  selector: 'app-domotica',
  templateUrl: './domotica.component.html',
  styleUrls: ['./domotica.component.scss']
})
export class DomoticaComponent implements OnInit {

  luxomStates: LuxomState[]

  events: Event[]

  event: Event


  constructor(protected localSvc: LocalService) {

  }

  async ngOnInit(): Promise<void> {

    this.luxomStates = LuxomAddress.getAllAddressStates()
    console.log(this.luxomStates)


    this.events = await this.localSvc.getEvents$()

    console.error(this.events)

    //await this.getLuxomState()
  }



  async getLuxomState() {

    const addresses = LuxomAddress.getAllAddresses()
    const luxomState = new LuxomGetState(addresses)

    const action = new Action(ActionType.luxomState, luxomState)

    const res = await this.localSvc.executeAction$(action)

    if (res.status != 'ok' || !res.object?.data)
      return

    var states: LuxomState[] = plainToInstance(LuxomState, res.object.data as any[])

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

  toggleEvent(event: Event) {

    if (!this.event)
      this.event = event
    else
      this.event = undefined


  }


}
