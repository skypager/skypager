import { ILazyInjectInterface } from './types';
export const shortcut: string = 'assetLoader';

export const featureMethods: string[] = ['image', 'stylesheet', 'script', 'lazyInject'];

/**
 * Injects an image file into a project
 * @param url the url/path to the image
 * @example
 * image('path/to/image.jpg || png || etc.')
 */
export const image = (url: string) =>
  // @ts-ignore
  this.inject.img(url);

/**
 * Injects the css file into a project
 * @param url the url/path to the stylesheet
 * @example
 * stylesheet('path/to/stylesheet.css')
 */
export const stylesheet = (url: string) =>
  // @ts-ignore
  this.inject.css(url);

export const script = (url: string) =>
  // @ts-ignore
  this.inject.js(url);

/**
 * @function
 */
export const lazyInject = (): ILazyInjectInterface => {
  /**
   * Function which returns a function:
   * @see
   * [this link for more information](https://davidwalsh.name/javascript-functions)
   * @param tag the html element
   */
  const load = (tag: string) => {
    return (url: string) => {
      /**
       * This promise will be used by Promise.all to determine success or failure
       */
      return new Promise(
        (resolve: CallableFunction, reject: CallableFunction): void => {
          /**
           * @todo
           * type better 'const element: any = document.createElement(tag)'
           */
          const element: any | Document = document.createElement(tag);
          let parent: string = 'body';
          let attr: string = 'src';

          // Important success and error for the promise
          element.onload = (): void => {
            resolve(url);
          };

          element.onerror = (): void => {
            reject(url);
          };

          /**
           * @todo
           * Need to set different attributes depending on tag type
           */
          switch (tag) {
            case 'script':
              element.async = true;
              break;
            case 'link':
              element.type = 'text/css';
              element.rel = 'stylesheet';
              attr = 'href';
              parent = 'head';
          }

          // Inject into document to kick off loading
          element[attr] = url;
          // @ts-ignore
          document[parent].appendChild(element);
        }
      );
    };
  };

  return {
    css: load('link'),
    img: load('img'),
    js: load('script'),
  };
};
