/* eslint-disable @typescript-eslint/no-this-alias */
import { Injectable } from '@angular/core';
import { Product, ProductType, ProductTypeIcons } from 'ts-altea-model'
import { ApiListResult, DbQuery, QueryOperator, Translation } from 'ts-common'
import { ProductService } from 'ng-altea-common'
import * as _ from "lodash";

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

  currentId?: string
  allCategories?: Product[] = []

  public path: Product[] = []

  constructor(private productSvc: ProductService) {

    this.getAllCategories()

  }

  /** This can be used to show the full path of any product */
  getAllCategories() {

    const query = new DbQuery()
    query.and('isCategory', QueryOperator.equals, true)
    query.and('deleted', QueryOperator.equals, false)
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


  showPath(id: string) {


    const temp = []
    let cat = this.allCategories.find(c => c.id == id)


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

    this.path = [{ id: null, name: 'Catalogus', catId: null }, ..._.reverse(temp)]  // , type: ProductType.category

  }


  showPathForProduct(product: Product) {

    if (!product)
      this.path = []

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

    this.path = [{ id: null, name: 'Catalogus', catId: null }, ..._.reverse(temp)]  // , type: ProductType.category

  }


}
