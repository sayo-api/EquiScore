import type { SVGProps } from "react";

/* Ícones em traço (sem emojis). Herdam a cor via currentColor. */
const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  "aria-hidden": true, ...p,
});
export const IconTrofeu = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>);
export const IconLista = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>);
export const IconUsuarios = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
export const IconGavel = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10M14 6l4 4M18 2l4 4-4 4-4-4zM9 11l4 4"/></svg>);
export const IconLink = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></svg>);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 5v14M5 12h14"/></svg>);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M20 6 9 17l-5-5"/></svg>);
export const IconX = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M18 6 6 18M6 6l12 12"/></svg>);
export const IconUp = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m18 15-6-6-6 6"/></svg>);
export const IconDown = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m6 9 6 6 6-6"/></svg>);
export const IconDado = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h.01M16 8h.01M8 16h.01M16 16h.01M12 12h.01"/></svg>);
export const IconSalvar = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>);
export const IconPdf = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3zM9 16v2"/></svg>);
export const IconTv = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="2" y="7" width="20" height="13" rx="2"/><path d="m7 3 5 4 5-4"/></svg>);
export const IconCelular = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 18h.01"/></svg>);
export const IconRelogio = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>);
export const IconSair = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>);
export const IconVoltar = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="m15 18-6-6 6-6"/></svg>);
export const IconAlerta = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>);
export const IconCopiar = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
export const IconSom = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/></svg>);
export const IconMudo = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m22 9-6 6M16 9l6 6"/></svg>);
export const IconLixeira = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"/></svg>);
export const IconEscudo = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>);
export const IconChave = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.5 12.5 8-8M17 7l2 2M14 7l2 2"/></svg>);
export const IconLapis = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>);
