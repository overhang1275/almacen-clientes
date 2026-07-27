# Almacen Clientes

Sistema Next.js para inventario fisico de materiales en consignacion.

## Requisitos

- Node.js 22+
- Proyecto Supabase

## Variables de entorno

Copiar `.env.example` a `.env.local` y llenar:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Comandos

```bash
npm install
npm run dev
npm run build
npm run lint
```

La app local corre en `http://localhost:3000`.

## Supabase

Aplicar la migracion de `supabase/migrations/20260727160000_profiles_auth_roles.sql` en el SQL Editor de Supabase.

Para el primer administrador:

1. Crear el usuario en Supabase Auth.
2. Ejecutar:

```sql
insert into public.profiles (id, email, full_name, role)
values ('<USER_ID>', '<EMAIL>', '<NOMBRE>', 'ADMIN')
on conflict (id) do update
set email = excluded.email,
    full_name = excluded.full_name,
    role = 'ADMIN';
```

Despues de eso, las altas de usuarios se hacen solo desde `/admin`.
