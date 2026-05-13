"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Por ahora solo redirige al dashboard.
    // Después conectamos aquí la autenticación real con usuario/contraseña.
    router.push("/dashboard");
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="logo">
          T
        </div>

        <h1>Gestión de Proyectos</h1>
        <p>Inicia sesión con una cuenta autorizada</p>

        <form onSubmit={handleLogin} className="login-form">
          <label>
            <span>Correo electrónico</span>
            <input
              type="email"
              placeholder="admin@admin.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Contraseña</span>
            <input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit">
            Iniciar sesión
          </button>
        </form>

        <p className="access-note">
          El acceso es creado únicamente por un administrador del sistema.
        </p>
      </section>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 35%),
            linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: Arial, Helvetica, sans-serif;
          color: #020617;
        }

        .login-card {
          width: 100%;
          max-width: 470px;
          background: #ffffff;
          border-radius: 28px;
          padding: 38px 34px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.2);
          border: 1px solid #e5e7eb;
          text-align: center;
        }

        .logo {
          width: 56px;
          height: 56px;
          margin: 0 auto 20px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2563eb;
          color: #ffffff;
          font-size: 24px;
          font-weight: 900;
        }

        .login-card h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.2;
          font-weight: 900;
          color: #020617;
        }

        .login-card p {
          margin: 12px 0 34px;
          color: #475569;
          font-size: 16px;
        }

        .login-form {
          display: grid;
          gap: 18px;
          text-align: left;
        }

        .login-form label {
          display: grid;
          gap: 8px;
        }

        .login-form span {
          color: #0f172a;
          font-size: 14px;
          font-weight: 700;
        }

        .login-form input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 14px 15px;
          font-size: 16px;
          color: #020617;
          background: #ffffff;
          outline: none;
        }

        .login-form input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16);
        }

        .login-form input::placeholder {
          color: #94a3b8;
        }

        .login-form button {
          margin-top: 4px;
          width: 100%;
          border: 0;
          border-radius: 16px;
          background: #2563eb;
          color: #ffffff;
          padding: 14px 18px;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .login-form button:hover {
          background: #1d4ed8;
        }

        .access-note {
          margin: 24px 0 0 !important;
          padding: 14px 16px;
          border-radius: 16px;
          background: #f8fafc;
          color: #64748b !important;
          font-size: 13px !important;
          line-height: 1.5;
        }

        @media (max-width: 520px) {
          .login-card {
            padding: 30px 22px;
          }

          .login-card h1 {
            font-size: 27px;
          }
        }
      `}</style>
    </main>
  );
}