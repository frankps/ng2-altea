import { BaseComponent } from "./base.component"

export abstract class BasicForm<T> extends BaseComponent {   //  extends CommonTs.ModelBase

    object: T | null = null

    /** Used when edit is canceled */
    objectUiOriginal: T | null = null

    isNew = false

    /** some forms have multiple sections, that can be edited separatly */
    editSection = ""

}