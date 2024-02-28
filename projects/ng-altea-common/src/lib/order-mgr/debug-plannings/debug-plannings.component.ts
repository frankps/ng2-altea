import { Component, Input } from '@angular/core';
import { Resource, ResourcePlanning, ResourceSet } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-debug-plannings',
  templateUrl: './debug-plannings.component.html',
  styleUrls: ['./debug-plannings.component.css']
})
export class DebugPlanningsComponent {

  @Input() plannings: ResourcePlanning[]


/*   resourceSet: ResourceSet = new ResourceSet()

  @Input() set resources(value: Resource[]) {

    console.warn(value)

    if (Array.isArray(value)) {

      this.resourceSet.clear()
      this.resourceSet.add(...value)

    }
  }

  get resources(): Resource[] {
    return this.resourceSet.resources
  } */



}
