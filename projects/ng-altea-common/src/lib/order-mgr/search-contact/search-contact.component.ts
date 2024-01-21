import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core'
import { NgForm } from '@angular/forms'
import { SearchContact } from 'ts-altea-model'

@Component({
  selector: 'order-mgr-search-contact',
  templateUrl: './search-contact.component.html',
  styleUrls: ['./search-contact.component.css']
})
export class SearchContactComponent {


	searchContact: SearchContact= new SearchContact()
	css_cls_row= 'mt-3'
	initialized= false
	@ViewChild('searchContactForm')
	searchContactForm: NgForm
	@Output()
	search: EventEmitter<SearchContact>= new EventEmitter<SearchContact>()


	async ngOnInit() {
		this.initialized = true
	}

	doSearch(searchContact) {
		console.warn("Button 'search' clicked: 'doSearch' method triggered!")
		console.warn(this.searchContact)
		this.search.emit(this.searchContact)
	}
  
}
