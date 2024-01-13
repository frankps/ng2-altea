import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { ResourceRequest } from 'ts-altea-model';

@Component({
  selector: 'order-mgr-debug-resource-request',
  templateUrl: './debug-resource-request.component.html',
  styleUrls: ['./debug-resource-request.component.scss'],
})
export class DebugResourceRequestComponent {

  @Input() request: ResourceRequest
}
