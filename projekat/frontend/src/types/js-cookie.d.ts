declare module "js-cookie" {
  interface CookieAttributes {
    expires?: number | Date;
    path?: string;
  }

  interface CookiesStatic {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: CookieAttributes): string | undefined;
    remove(name: string, options?: CookieAttributes): void;
  }

  const Cookies: CookiesStatic;
  export default Cookies;
}
