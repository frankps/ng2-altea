export enum ModalSize {
    small = 'sm',
    large = 'lg',
    extraLarge = 'xl'
  }
  
  export class Modal {
  
    title = ''
  
    /** sm, lg, xl */
    size: string | ModalSize = 'lg'
  }
  