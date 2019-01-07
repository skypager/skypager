/**
 * @interface
 * declare an interface definition to be used across the file/function,
 *
 * all interface should start with capital 'I'
 * which is a standard convention
 */
export interface IElement extends HTMLElement {
  onload: () => any;
  onerror: () => any;
  async: boolean;
  type: string;
  rel: string;
}

/**
 * @property
 * Combined Type definitions to be used across the file/function, avoids multiple
 * imports of multiple types
 *
 * all interface should start with capital 'T'
 * which is a standard convention
 */
export type TElement = HTMLElement & IElement;
