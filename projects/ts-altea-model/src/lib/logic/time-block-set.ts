import { TimeBlock } from "./time-block";




export class TimeBlockSet {
    blocks: TimeBlock[] = []

    addBlock(block: TimeBlock) {
        this.blocks.push(block)
    }

    addBlockByDates(from: Date, to: Date) {

        const block = new TimeBlock(from, to)
        this.addBlock(block)

    }
}