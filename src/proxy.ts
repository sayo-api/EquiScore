import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

/*
 * Checagem rápida antes de renderizar: sem sessão válida, /painel manda para o
 * login. A verificação definitiva continua em cada página (exigirSessao).
 */
export async function proxy(req: NextRequest) {
  const token = req.cookies.get("eqs_sessao")?.value;
  const segredo = process.env.SESSION_SECRET;
  if (token && segredo) {
    try {
      await jwtVerify(token, new TextEncoder().encode(segredo), { algorithms: ["HS256"] });
      return NextResponse.next();
    } catch {
      /* cai no redirect */
    }
  }
  return NextResponse.redirect(new URL("/entrar", req.url));
}

export const config = { matcher: ["/painel/:path*"] };
