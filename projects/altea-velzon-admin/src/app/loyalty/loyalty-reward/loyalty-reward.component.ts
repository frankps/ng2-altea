import { Component, Input, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { LoyaltyReward, Product, LoyaltyRewardType, LoyaltyOptionCondition, ProductOption, ProductOptionValue, LoyaltyRewardOption, LoyaltyRewardOptionValue } from 'ts-altea-model';
import { SearchProductComponent } from '../../product/search-product/search-product.component';
import { TranslationService } from 'ng-common'
import { Translation } from 'ts-common'
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductService } from 'ng-altea-common';
import * as _ from "lodash";

@Component({
  selector: 'app-loyalty-reward',
  templateUrl: './loyalty-reward.component.html',
  styleUrls: ['./loyalty-reward.component.scss']
})
export class LoyaltyRewardComponent implements OnInit {

  //@Input() 
  reward: LoyaltyReward
  @Output() save: EventEmitter<LoyaltyReward> = new EventEmitter<LoyaltyReward>();

  @ViewChild('rewardModal') public rewardModal?: NgbModal;
  @ViewChild('searchProductModal') public searchProductModal: SearchProductComponent;
  loyaltyRewardType: Translation[] = []

  condition = LoyaltyOptionCondition.eql   // selected condition
  loyaltyOptionCondition: Translation[] = []

  initialized = false

  product: Product

  constructor(protected translationSvc: TranslationService, private modalService: NgbModal, private productSvc: ProductService) {

  }


  async ngOnInit() {
    await this.translationSvc.translateEnum(LoyaltyRewardType, 'enums.loyalty-reward-type.', this.loyaltyRewardType)
    await this.translationSvc.translateEnum(LoyaltyOptionCondition, 'enums.loyalty-option-condition.', this.loyaltyOptionCondition)
    this.initialized = true
  }

  saveReward(modal: any) {
    this.save.emit(this.reward)
    modal.close()
  }

  selectProduct() {
    this.searchProductModal.show()

  }


  /** currently selected option */
  selectedOption
  option: ProductOption
  optionValues = undefined

  productSelected(product: Product) {

    this.product = product
    /* 
        const options = {}
    
        if (product.hasOptions()) {
    
    
          product.options.forEach(option => {
    
            let allValues = []
    
            if (option.hasValues()) {
              allValues = option.values.map(value => { return { id: value.id, name: value.name } })
            }
    
            this.optionValues[option.id] = allValues
    
    
            options[option.id] = {
              name: option.name,
              values: [],
             
              cond: undefined
            }
          })
    
          console.warn('Option values', this.optionValues)
        } */

    this.reward.product = { id: product.id, name: product.name, options: [] }
    this.optionValues = undefined

  }


  optionSelected(option: ProductOption) {

    this.option = option
    /* 
        if (option.hasValues()) {
          this.optionValues = option.values.map(value => { return { id: value.id, name: value.name } })
        } else {
          this.optionValues = undefined
        } */

  }

  optionValueSelected(value: ProductOptionValue) {

    console.error(value)

    const rewardOption = new LoyaltyRewardOption()  //{ id: value.id, name: value.name, idx: value.idx }
    rewardOption.id = this.option.id
    rewardOption.name = this.option.name
    rewardOption.idx = this.option.idx
    
    if (this.reward.type == LoyaltyRewardType.productDiscount)
      rewardOption.cond = this.condition

    rewardOption.values.push(new LoyaltyRewardOptionValue(value.id, value.name, value.idx))



    const idx = this.reward.product.options.findIndex(o => o.id == this.option.id)

    if (idx >= 0)
      this.reward.product.options.splice(idx, 1)

    this.reward.product.options.push(rewardOption)

    this.reward.product.options = _.sortBy(this.reward.product.options, 'idx')

    this.clear()

  }

  clear() {
    this.selectedOption = undefined
    this.option = undefined
    this.optionValues = undefined
  }

  deleteOption(option: LoyaltyRewardOption, idx: number) {

    this.reward.product.options.splice(idx, 1)

  }


  async show(reward: LoyaltyReward) {

    this.product = undefined
    this.reward = reward

    this.clear()

    console.error('SHOW REWARD', this.reward)

    if (this.reward?.product?.id) {
      this.product = await this.productSvc.get$(this.reward.product.id)

      console.error(this.product)
    }

    this.modalService.open(this.rewardModal)
  }


  hasProductSelection() {

    if (!this.reward)
      return false

    return [LoyaltyRewardType.freeProduct, LoyaltyRewardType.productDiscount].indexOf(this.reward.type) >= 0

  }
}
