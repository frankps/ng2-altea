


In: projects/ng-altea-common/src/lib/order-mgr/order/order.component.html
next to the print button, we need a new button 'Export UBL'


Important remark: the Angular startup project for this functionality is: projects/altea-velzon-admin
The URL/route for this functionality is: http://localhost:4200/aqua/orders/manage/ed59a11d-db6a-4cdc-ac10-6cf921380587



When this button is pressed, we need to export the invoice is currently shown by edit-invoice.component as an UBL file, this file is then downloaded into the 'Downloads' folder by the browser.
Include all essential info of the invoice (needed for bookkeeping). Will be used to upload into Peppol.


Therefor we already installed the npm package 'ubl-builder'


Make sure this library ('ubl-builder') is not included in our initial ANgular install package, but later on async loaded (so that initial package is not too big).


The invoice component is currently rendered by;
projects/ng-altea-common/src/lib/order-mgr/edit-invoice/edit-invoice.component.html



Try to put logic (UBL generation code) into the library: projects/ts-altea-logic/src/lib
This library can be both used client or server side. (this containes no UI code)