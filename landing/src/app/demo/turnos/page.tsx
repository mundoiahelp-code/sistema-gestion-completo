export default function TurnosDemoPage() {
  return (
    <div className="bg-gray-50 dark:bg-zinc-950 p-6">
      <div className="space-y-6 max-w-7xl mx-auto">
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
              <tr className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
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
