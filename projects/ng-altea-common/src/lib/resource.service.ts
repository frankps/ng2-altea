import { Injectable } from '@angular/core';
import { Product, Resource, ResourceType } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';
import { DbQuery, QueryOperator } from 'ts-common';

@Injectable({
  providedIn: 'root'
})
export class ResourceService extends BackendHttpServiceBase<Resource> {

  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Resource, sessionSvc.backend, sessionSvc.branchUnique + '/resources', http)
  }


  async getByType$(type: ResourceType, isGroup: boolean = false): Promise<Resource[]> {

    const query = new DbQuery()

    query.and('type', QueryOperator.equals, type)
    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
    query.and('active', QueryOperator.equals, true)

    query.and('isGroup', QueryOperator.equals, isGroup)

    return await this.query$(query)

  }


  async getByType(type: ResourceType, includes?: string[]): Promise<Resource[]> {
    const query = new DbQuery()

    if (includes)
      query.includes = includes

    query.and('type', QueryOperator.equals, type)

    return this.query$(query)
  }

  async getHumanResources(includes?: string[]): Promise<Resource[]> {
    return this.getByType(ResourceType.human, includes)
  }

  override async export(): Promise<Resource[]> {

    const query = new DbQuery()
    query.includes = 'children,products,schedules'.split(',')
    query.take = 1000

    const objects = await this.query$(query)

    return objects
  }

}

