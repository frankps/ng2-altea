import { Component, Input, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { LoyaltyReward, Product, LoyaltyRewardType } from 'ts-altea-model';
import { SearchProductComponent } from '../../product/search-product/search-product.component';
import { TranslationService } from 'ng-common'
import { Translation } from 'ts-common'

@Component({
  selector: 'app-loyalty-reward',
  templateUrl: './loyalty-reward.component.html',
  styleUrls: ['./loyalty-reward.component.scss']
})
export class LoyaltyRewardComponent implements OnInit {

  @Input() reward: LoyaltyReward
  @Output() save: EventEmitter<LoyaltyReward> = new EventEmitter<LoyaltyReward>();

  @ViewChild('searchProductModal') public searchProductModal: SearchProductComponent;
	loyaltyRewardType: Translation[]= []

  initialized= false

	constructor(protected translationSvc: TranslationService) {

	}


	async ngOnInit() {
		await this.translationSvc.translateEnum(LoyaltyRewardType, 'enums.loyalty-reward-type.', this.loyaltyRewardType)
		this.initialized = true
	}

  saveReward() {
    this.save.emit(this.reward)
  }

  selectProduct() {
    this.searchProductModal.show()

  }

  productSelected(product: Product) {

    this.reward.product = { id: product.id, name: product.name }

  }
}
