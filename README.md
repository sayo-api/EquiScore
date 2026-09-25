# EquiScore (EQS)

Sistema de apuração de provas de **adestramento** e **salto** — inscrições,
ordem de entrada, julgamento e resultados. Sucessor do SAHDI, com nova
identidade visual (vermelho e branco) e tecnologia atual.

## Tecnologia

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) + **React 19** | Telas e servidor no mesmo projeto, feito para a Vercel |
| Linguagem | **TypeScript** (strict) | Erros de campo/tipo aparecem antes de ir para o ar |
| Estilo | **Tailwind CSS 4** | Identidade EQS em tokens (`--color-eqs-*`) |
| Banco | **MongoDB Atlas** via Mongoose 9 | Mesmo banco do SAHDI: migração sem exportar dados |
| Sessão | Cookie **httpOnly** assinado (JWT/jose) | O token não fica exposto a scripts da página |
| Validação | **Zod** | Toda entrada de formulário é validada no servidor |
| Testes | **Vitest** | Regras de pontuação cobertas por testes |

## Estrutura

```
src/
  app/                 páginas (App Router)
    page.tsx           início
    entrar/            login (Server Action + useActionState)
    painel/            área do organizador (protegida)
    resultados/        resultados publicados (público)
  proxy.ts             barra /painel sem sessão válida
  lib/domain/          regras puras de apuração + testes
  lib/server/          banco, modelos, senha, sessão (só servidor)
  data/reprises.json   catálogo oficial CBH (21 reprises)
  components/          componentes de interface
public/brand/          logo e escudo EquiScore
```

## Rodando

```bash
cp .env.example .env.local   # preencha MONGODB_URI e SESSION_SECRET
npm install
npm run dev                  # http://localhost:3000
npm run check                # tipos + lint + testes
```

Os logins do SAHDI funcionam no EquiScore (mesmo formato de senha scrypt).

## Deploy (Vercel)

Importe o repositório na Vercel (framework detectado: Next.js) e cadastre
`MONGODB_URI` e `SESSION_SECRET` em *Settings → Environment Variables*.

## Roteiro

- [x] Base: identidade EQS, login seguro, lista e detalhe de provas, resultados publicados
- [x] Regras de apuração do adestramento em TypeScript, com testes
- [ ] Inscrições e aprovação
- [ ] Ordem de entrada (agrupada ou mesclada, com espaço entre montarias)
- [ ] Tela do juiz (offline-first, PWA)
- [ ] Salto: cronômetro, faltas, baremos (Tabela A/C, tempo ideal…)
- [ ] Equipes / Modo Campeonato
- [ ] Telões e resultados ao vivo
- [ ] PDFs oficiais
