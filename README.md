# Gerenciador de Tarefas

Aplicação simples de tarefas feita com **Next.js 15 (App Router)** e **tRPC v11**.
O backend mantém as tarefas em memória e o frontend consome os endpoints via tRPC + React Query.

## Como executar

Requisitos: Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

Build de produção:

```bash
npm run build
npm start
```

Ao iniciar, a aplicação já tem 25 tarefas de exemplo para demonstrar a paginação.
Como o armazenamento é em memória, os dados são perdidos ao reiniciar o servidor.

## Funcionalidades

- **CRUD via tRPC**: criar, listar (paginado), buscar por id, atualizar e excluir tarefas.
- **Validação**: título obrigatório (até 100 caracteres) e descrição opcional (até 500), com o mesmo schema zod no backend e no formulário.
- **Erros significativos**: operações em tarefa inexistente retornam `NOT_FOUND` ("Tarefa 5 não encontrada"); erros de validação retornam `BAD_REQUEST` com as mensagens por campo.
- **Listagem com SSR**: a primeira página é buscada no servidor e chega pronta no HTML.
- **Exclusão na listagem** com confirmação e mensagem de sucesso/erro (toast).
- **Formulário de criação/edição** com validação no client, erros por campo e estados de carregamento.
- **Infinite scroll** (bônus): novas páginas carregam automaticamente ao rolar.

## Estrutura

```
src/
├── app/
│   ├── page.tsx                 # Listagem (SSR + prefetch)
│   ├── task-list.tsx            # Lista, exclusão e infinite scroll (client)
│   ├── tarefas/
│   │   ├── task-form.tsx        # Formulário compartilhado (criar/editar)
│   │   ├── nova/page.tsx
│   │   └── [id]/editar/page.tsx
│   └── api/trpc/[trpc]/route.ts # Endpoint HTTP do tRPC
├── server/
│   ├── trpc.ts                  # Inicialização do tRPC e formatação de erros
│   ├── task-store.ts            # "Banco" em memória
│   └── routers/                 # Procedures de tarefas
├── trpc/
│   ├── client.tsx               # Provider do tRPC/React Query para o browser
│   └── server.tsx               # Chamadas diretas ao router em Server Components
├── lib/                         # Schema zod e helpers de erro (compartilhados)
└── components/toast.tsx         # Feedback visual global
```

## Decisões

- **SSR com hidratação**: a página da listagem faz `prefetchInfiniteQuery` chamando o router direto no servidor (sem HTTP) e repassa o cache ao client via `HydrationBoundary`. Assim o HTML já vem com as tarefas e o client continua com React Query para paginação e invalidação. A página usa `force-dynamic` porque os dados mudam a cada request.
- **Paginação por cursor**: o id é numérico e incremental, então ele mesmo serve de cursor (`id < cursor`). Diferente de um offset, não pula nem repete itens quando tarefas são criadas ou removidas entre uma página e outra.
- **Schema único**: `src/lib/task-schema.ts` é usado como input do tRPC e na validação do formulário, então as regras não divergem.
- **Erros**: o `errorFormatter` do tRPC envia os erros do zod por campo, e `src/lib/errors.ts` traduz qualquer erro (servidor, validação ou rede) em uma mensagem amigável.
- **superjson**: permite trafegar `Date` (`dataCriacao`) entre servidor e client sem conversão manual.
- **Store em `globalThis`**: evita que o hot reload do `next dev` apague as tarefas a cada alteração de código.
- **Sem bibliotecas de UI/formulário**: CSS simples e `useState`, seguindo o "menos é mais" do desafio.
