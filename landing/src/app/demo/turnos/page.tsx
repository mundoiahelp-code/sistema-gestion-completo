export default function TurnosDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Turnos</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Gestión de turnos agendados</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-8 px-3 border border-zinc-200 bg-white shadow-sm hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
              Actualizar
            </button>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-9 px-4 py-2 bg-zinc-900 text-zinc-50 shadow hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              Nuevo
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-zinc-800">
          <div className="flex gap-6">
            <button className="px-4 py-3 text-sm font-medium border-b-2 border-black text-black dark:border-white dark:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-2 h-4 w-4"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
              Turnos Activos
            </button>
            <button className="px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700">
              Historial (0)
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o producto..."
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 pl-10 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
            />
          </div>
          <select className="flex h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300">
            <option>Todas las sucursales</option>
          </select>
          <select className="flex h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:focus-visible:ring-zinc-300">
            <option>Todos</option>
          </select>
        </div>

        {/* Cards de contadores */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border dark:border-zinc-800">
            <div className="text-sm text-gray-500 dark:text-zinc-400 mb-1">Total</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">1</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">Pendientes</div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">1</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-700 dark:text-blue-400 mb-1">Atendidos</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">0</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-700 dark:text-red-400 mb-1">Cancelados</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-500">0</div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border dark:border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
              <tr>
                <th className="w-12 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">FECHA</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">HORA</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">NOMBRE</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">TELÉFONO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">PRODUCTO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">PAGO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">TIPO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">SUCURSAL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              <tr className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer">
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded opacity-0 pointer-events-none" />
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">09/02/2026</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">09:00</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Cristofer ched</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-zinc-400">+54 9 11 2345-6789</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">iPhone 17 Pro 512gb Blue Titanium</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Efectivo USD</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Minorista</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Adrogue</td>
                <td className="px-4 py-3">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Pendiente
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
