// The card is a client component: outside the app router these are enough to render it.
export const useRouter = () => ({ refresh() {}, push() {}, replace() {} });
export const usePathname = () => '/study/session/s1';
export const useSearchParams = () => new URLSearchParams();
export const redirect = () => {};
