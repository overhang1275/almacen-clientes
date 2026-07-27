import { signIn } from "./actions";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
  };
};

const messages: Record<string, string> = {
  "credenciales-invalidas": "Revisa email y password.",
  "no-se-pudo-iniciar-sesion": "No se pudo iniciar sesion.",
  "registro-invalido": "Completa nombre, email y password.",
  "no-se-pudo-registrar": "No se pudo registrar el usuario.",
  "perfil-no-encontrado": "Tu sesion existe, pero falta tu perfil.",
  "revisa-tu-correo": "Revisa tu correo para confirmar la cuenta."
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const feedback = searchParams?.error ?? searchParams?.message;

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-md gap-5 px-5 py-8 md:place-content-center">
      <AuthCard title="Iniciar sesion" action={signIn} button="Entrar" />
      {feedback ? (
        <p className="rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
          {messages[feedback] ?? feedback}
        </p>
      ) : null}
    </main>
  );
}

function AuthCard({
  action,
  button,
  title
}: {
  action: (formData: FormData) => Promise<void>;
  button: string;
  title: string;
}) {
  return (
    <form action={action} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
      <div className="mt-5 grid gap-4">
        <Field label="Email" name="email" type="email" />
        <Field label="Password" name="password" type="password" />
        <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white" type="submit">
          {button}
        </button>
      </div>
    </form>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      <input
        className="rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-600"
        minLength={type === "password" ? 6 : undefined}
        name={name}
        required
        type={type}
      />
    </label>
  );
}
