import { Injectable } from '@angular/core';
import { Product, Resource, ResourcePlannings, ResourceType } from 'ts-altea-model'
import { BackendHttpServiceBase } from 'ng-common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from '../../session.service';
import { DateHelper, DbQuery, QueryOperator } from 'ts-common';
import * as _ from "lodash";
import * as dateFns from 'date-fns'

@Injectable({
  providedIn: 'root'
})
export class ResourceService extends BackendHttpServiceBase<Resource> {



  constructor(http: HttpClient, protected sessionSvc: SessionService) {
    super(Resource, 'Resource', sessionSvc.backend, sessionSvc.branchUnique + '/resources', http)
  }




  override async getAllForBranch$(): Promise<Resource[]> {

    const query = new DbQuery()
    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
    query.take = 1000
    return await this.query$(query)

  }

  async getByType$(type: ResourceType, isGroup: boolean = false): Promise<Resource[]> {

    const query = new DbQuery()

    query.and('type', QueryOperator.equals, type)
    query.and('branchId', QueryOperator.equals, this.sessionSvc.branchId)
    query.and('act', QueryOperator.equals, true)

    query.and('isGroup', QueryOperator.equals, isGroup)

    return await this.query$(query)

  }


  async getByType(type: ResourceType, isGroup: boolean = null, posOnly: boolean | null = null, includes?: string[]): Promise<Resource[]> {
    const query = new DbQuery()


    query.and('type', QueryOperator.equals, type)

    if (isGroup !== null)
      query.and('isGroup', QueryOperator.equals, isGroup)

    if (posOnly !== null)
      query.and('pos', QueryOperator.equals, posOnly)

    if (includes)
      query.includes = includes


    query.orderBy('name')

    return this.query$(query)
  }

  async getHumanResources(includes?: string[]): Promise<Resource[]> {
    return this.getByType(ResourceType.human, false, true, includes)
  }

  async getHumanResourcesInclGroups(includes?: string[]): Promise<Resource[]> {
    return this.getByType(ResourceType.human, null, null, includes)
  }

  override async export(): Promise<Resource[]> {

    const query = new DbQuery()
    query.includes = 'children,products,schedules'.split(',')
    query.take = 1000

    const objects = await this.query$(query)

    return objects
  }

}

