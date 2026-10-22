import LoginForm from "./login-form";

export const metadata = {
  title: "Sign in",
  description: "Sign in to contribute to the Khayargoli Family Tree.",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-16">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Family contributions
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
          Sign in to contribute
        </h1>
        <p className="mt-4 leading-7 text-stone-600">
          Sign in with Google to request membership and contribute family
          information. An admin reviews membership before contributions are
          enabled.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
