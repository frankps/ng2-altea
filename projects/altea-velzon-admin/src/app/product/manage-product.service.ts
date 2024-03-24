/* eslint-disable @typescript-eslint/no-this-alias */
import { Injectable } from '@angular/core';
import { Product, ProductSubType, ProductType, ProductTypeIcons } from 'ts-altea-model'
import { ApiListResult, DbQuery, ObjectWithId, QueryOperator, Translation } from 'ts-common'
import { ProductService } from 'ng-altea-common'
import * as _ from "lodash";
import { TranslationService } from 'ng-common'


/*
import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslationService } from 'ng-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from "ngx-spinner"
*/

@Injectable({
  providedIn: 'root'
})
export class ManageProductService {

  type: ProductType
  rootPathName = ''
  currentId?: string
  allCategories?: Product[] = []

  public path: any[] = []

  constructor(private productSvc: ProductService, private translationSvc: TranslationService) {

    this.getAllCategories()

  }

  /** This can be used to show the full path of any product */
  getAllCategories() {

    const query = new DbQuery()
    query.and('sub', QueryOperator.equals, ProductSubType.cat)
    query.and('del', QueryOperator.equals, false)
    query.take = 200
    query.select('id', 'catId', 'name', 'type')

    this.productSvc.query(query).subscribe(res => {

      console.warn(query)
      console.error('retrieved all categories!!')

      this.allCategories = res.data

      if (!this.allCategories)
        this.allCategories = []

      console.warn(this.allCategories)

      if (this.currentId)
        this.showPath(this.currentId)
    })
  }






  async isCategory(id: string) {


    if (!this.allCategories || this.allCategories.length == 0) {
      return false
    }

    const match = this.allCategories.findIndex(c => c.id == id)

    return (match >= 0)
  }

  async setRootPathName(type?: ProductType) {

    if (type)
      this.type = type
    else
      type = this.type    // just take over current product type

    if (type)
      this.rootPathName = await this.translationSvc.getTrans('menu.catalog.sub.' + type)
    else
      this.rootPathName = ''
  }

  showRootPathOnly() {
    this.path = [{ id: null, name: this.rootPathName, catId: null }]

  }

  async showPath(id?: string) {

    if (!id) {
      this.path = []
    }


    const temp = []
    let cat: Product = this.allCategories.find(c => c.id == id)

    await this.setRootPathName(cat?.type)


    let count = 0

    while (cat) {

      console.warn('Category FOUND')
      console.warn(cat)

      temp.push(cat)

      if (cat.catId)
        cat = this.allCategories.find(c => c.id == cat.catId)
      else
        cat = null

      if (count++ > 10)
        break
    }


    // 
    this.path = [{ id: null, name: this.rootPathName, catId: null }, ..._.reverse(temp)]  // , type: ProductType.category

  }


  async showPathForProduct(product: Product) {

    if (!product)
      this.path = []

    await this.setRootPathName(product.type)

    const temp = []
    temp.push(product)

    let cat = this.allCategories.find(c => c.id == product.catId)
    let count = 0

    while (cat) {
      console.warn('Category FOUND')
      console.warn(cat)

      temp.push(cat)

      if (cat.catId)
        cat = this.allCategories.find(c => c.id == cat.catId)
      else
        cat = null

      if (count++ > 10)
        break
    }

    this.path = []

    // { id: null, name: 'Catalogus', catId: null },
    this.path = [{ id: null, name: this.rootPathName, catId: null }, ..._.reverse(temp)]  // , type: ProductType.category

  }


}
