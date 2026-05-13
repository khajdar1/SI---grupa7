import 'vitest';

declare module 'vitest' {
	interface Assertion<T = unknown> {
		toBeInTheDocument(): void;
		toHaveStyle(style: string | Partial<CSSStyleDeclaration>): void;
		toHaveAttribute(name: string, value?: string): void;
	}
}