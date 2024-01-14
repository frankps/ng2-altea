import { Component } from '@angular/core';
import { Gift } from 'ts-altea-model';

@Component({
  selector: 'app-use-gift',
  templateUrl: './use-gift.component.html',
  styleUrls: ['./use-gift.component.scss']
})
export class UseGiftComponent {



  useGift(gift: Gift) {

    console.error(gift)

    //gift.l
    
  }
}
