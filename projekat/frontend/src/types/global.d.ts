declare module '*.css';

declare module 'lucide-react' {
	import type * as React from 'react';

	export type LucideIcon = React.FC<React.SVGProps<SVGSVGElement>>;

	export const Check: LucideIcon;
	export const ChevronDown: LucideIcon;
	export const ChevronRight: LucideIcon;
	export const ChevronUp: LucideIcon;
	export const Circle: LucideIcon;
	export const CircleCheck: LucideIcon;
	export const Info: LucideIcon;
	export const LoaderCircle: LucideIcon;
	export const OctagonX: LucideIcon;
	export const Pencil: LucideIcon;
	export const Plus: LucideIcon;
	export const Power: LucideIcon;
	export const RefreshCw: LucideIcon;
	export const Save: LucideIcon;
	export const ShieldCheck: LucideIcon;
	export const Trash2: LucideIcon;
	export const TriangleAlert: LucideIcon;
	export const Users: LucideIcon;
	export const X: LucideIcon;
	export const XIcon: LucideIcon;
}