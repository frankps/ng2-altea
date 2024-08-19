


export class MenuItem {
    constructor(public code: string, public show: 'loggedOn' | 'loggedOff' | 'always') { }


    showLoggedOn() {
        return this.show == 'loggedOn'
    }

    showLoggedOff() {
        return this.show == 'loggedOff'
    }

    showAlways() {
        return this.show == 'always'
    }
  }