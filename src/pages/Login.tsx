import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import typographyLogo from "../assets/logos/snack-robots-text.png";
import candyWallpaper from "../assets/wallpapers/snack-robots-pattern.png";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const { error } = await signIn(email, password);

    setIsLoading(false);

    if (error) {
      setErrorMessage("Correo o contraseña incorrectos.");
      return;
    }

    navigate("/portal");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white font-sans flex flex-col justify-center items-center relative overflow-hidden selection:bg-yellow-400 selection:text-blue-900 px-6">
      <div
        className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay"
        style={{
          backgroundImage: `url(${candyWallpaper})`,
          backgroundSize: "150px",
        }}
      />

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-[48px] p-10 border border-white/20 shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <img
            src={typographyLogo}
            alt="Snack Robots"
            className="h-12 mx-auto mb-2 object-contain"
          />
          <p className="text-yellow-300 font-black italic uppercase tracking-widest text-sm opacity-90 drop-shadow">
            Sweet Treats, Great Taste!
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-blue-200 mb-2 uppercase tracking-wider">
                Correo
              </label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 font-bold text-white focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-blue-200 mb-2 uppercase tracking-wider">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-4 font-bold text-white focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 placeholder:text-white/30"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-2xl bg-red-500/20 border border-red-300/30 px-4 py-3 text-sm font-bold text-red-100">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 text-white py-4 rounded-[24px] font-black uppercase tracking-tight text-lg hover:bg-orange-400 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-orange-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="text-sm font-bold text-blue-200 hover:text-white transition-colors opacity-80 uppercase tracking-wider"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
