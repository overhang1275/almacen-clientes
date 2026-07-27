import Link from "next/link";

type SearchParams = Record<string, string | undefined>;

export function getPage(searchParams: SearchParams) {
  return Math.max(1, Number(searchParams.page ?? 1) || 1);
}

export function getPageSize(searchParams: SearchParams) {
  const size = Number(searchParams.page_size ?? 20) || 20;
  return Math.min(100, Math.max(10, size));
}

export function pageRange(page: number, pageSize: number) {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function Pagination({
  basePath,
  page,
  pageSize,
  searchParams,
  total
}: {
  basePath: string;
  page: number;
  pageSize: number;
  searchParams: SearchParams;
  total: number;
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Paginacion" className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm md:flex-row md:items-center md:justify-between">
      <p className="text-slate-600">Mostrando {start}-{end} de {total}</p>
      <div className="flex items-center gap-2">
        <PageLink basePath={basePath} disabled={page <= 1} page={page - 1} searchParams={searchParams}>
          Anterior
        </PageLink>
        <span className="px-2 font-medium">Pagina {page} de {lastPage}</span>
        <PageLink basePath={basePath} disabled={page >= lastPage} page={page + 1} searchParams={searchParams}>
          Siguiente
        </PageLink>
      </div>
    </nav>
  );
}

function PageLink({
  basePath,
  children,
  disabled,
  page,
  searchParams
}: {
  basePath: string;
  children: React.ReactNode;
  disabled: boolean;
  page: number;
  searchParams: SearchParams;
}) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== "material") params.set(key, value);
  });
  params.set("page", String(page));

  if (disabled) {
    return <span className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-slate-400">{children}</span>;
  }

  return (
    <Link className="inline-flex items-center rounded-md border border-slate-300 px-3 py-2 font-medium hover:border-slate-500" href={`${basePath}?${params.toString()}`}>
      {children}
    </Link>
  );
}
