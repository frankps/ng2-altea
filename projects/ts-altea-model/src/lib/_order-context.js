"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*

export class OrderContext {

    order?: Order

    products: Product[] = []
    resources: Resource[] = []

    constructor(order?: Order) {

        this.order = order
    }

    // moved to order.
    getOrderLinesWithPersonSelect(): OrderLine[] {

        if (!this.order || !this.order.lines || !this.products || this.products.length == 0)
            return []

        const personSelectProducts = this.products.filter(p => p.personSelect === true)

        const orderLines: OrderLine[] = []

        this.order.lines.forEach(ol => {

            const product = _.find(personSelectProducts, p => p.id == ol.productId);  ///['id', ol.productId]

            if (product && product.personSelect === true) {
                orderLines.push(ol);
            }
        });

        return orderLines;
    }

    // moved to order.
    getPersonLines(): PersonLine[] {

        const orderLines = this.getOrderLinesWithPersonSelect()

        if (!orderLines)
            return [];

        const personLines = [];

        for (const ol of orderLines) {
            for (let i = 0; i < ol.qty; i++) {

                const personLine = new PersonLine();

                personLine.orderLineId = ol.id;
                personLine.descr = ol.descr;
                personLine.orderLine = ol;

                let personId: string | null = null

                if (ol.persons && ol.persons.length > i)
                    personId = ol.persons[i];
                // else if (this.order && this.order.persons.length > 0) {
                //     let person = personHelper.getPerson(ol, i);
                //     personId = person.id; //   this.order.persons[0].id;
                // }

                if (personId != null)
                    personLine.personId = personId;

                personLines.push(personLine);
            }

        }

        return personLines;

    }
}

*/ 
