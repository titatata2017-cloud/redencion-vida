import { NavLink, Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarDays, BookOpen, MessageSquareQuote, Video, Music2, ClipboardList, Users, Settings, LogOut, MapPin, Heart, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const go = useNavigate();
  const location = useLocation();

  const navigation = [
    ["/admin", "Dashboard", LayoutDashboard],
    ["/admin/activities", "Actividades", CalendarDays],
    ["/admin/studies", "Estudios", BookOpen],
    ["/admin/testimonies", "Testimonios", MessageSquareQuote],
    ["/admin/videos", "Videos", Video],
    ["/admin/songs", "Alabanzas", Music2],
    ["/admin/quizzes", "Cuestionarios", ClipboardList],
    ["/admin/settings", "Configuración", Settings],
    ["/admin/users", "Usuarios", Users],
  ];

  const visibleNavigation = navigation.filter(
    ([to]) => user?.role === "ADMIN" || to !== "/admin/users"
  );

  const current = visibleNavigation.find(([to]) =>
    to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(to)
  );

  const signOut = () => {
    logout();
    go("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white md:flex">
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-40 md:w-72 md:flex-col bg-slate-900 border-r border-white/10 p-5">
        <Link to="/" aria-label="Volver al sitio público">
          <Logo compact />
        </Link>

        <nav className="mt-8 grid gap-1 overflow-y-auto pr-1" aria-label="Administración">
          {visibleNavigation.map(([to, label, Icon]) => (
            <NavLink
              end={to === "/admin"}
              key={to}
              to={to}
              className={({ isActive }) =>
                `p-3 rounded-xl flex gap-3 items-center font-bold transition-colors ${
                  isActive
                    ? "bg-white text-slate-900"
                    : "text-slate-300 hover:bg-white/10"
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-5 border-t border-white/10 pt-4 grid gap-3">
          <Link to="/" className="text-slate-300 hover:text-white flex gap-2 items-center">
            <MapPin size={16} /> Ver sitio público
          </Link>
          <Link to="/donate" className="text-slate-300 hover:text-white flex gap-2 items-center">
            <Heart size={16} /> Ver donaciones
          </Link>
        </div>

        <div className="mt-auto text-sm border-t border-white/10 pt-4">
          <b className="block truncate">{user?.name}</b>
          <div className="text-slate-500">{user?.role}</div>
          <button onClick={signOut} className="mt-3 text-red-300 flex gap-2 items-center">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 md:ml-72">
        <header className="md:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-white/10 px-4 py-3 safe-area-top">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="shrink-0" aria-label="Sitio público">
              <Logo compact />
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <Menu size={18} className="text-slate-400 shrink-0" />
              <select
                aria-label="Sección de administración"
                value={current?.[0] || "/admin"}
                onChange={(event) => go(event.target.value)}
                className="min-w-0 max-w-[62vw] bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none"
              >
                {visibleNavigation.map(([to, label]) => (
                  <option key={to} value={to}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {visibleNavigation.map(([to, label, Icon]) => (
              <NavLink
                key={to}
                end={to === "/admin"}
                to={to}
                className={({ isActive }) =>
                  `shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold border ${
                    isActive
                      ? "bg-white text-slate-900 border-white"
                      : "border-white/10 text-slate-300 bg-white/5"
                  }`
                }
              >
                <Icon size={14} /> {label}
              </NavLink>
            ))}
          </div>
        </header>

        <main className="min-w-0 p-4 sm:p-5 md:p-8 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
