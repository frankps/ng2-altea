export class Translation {
  /** can be used to associate values to enum items */
  public value = 0
  public help = ''

  constructor(public key : string | number = '', public trans = '') { }
}