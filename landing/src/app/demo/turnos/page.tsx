export default function TurnosDemoPage() {
  return (
    <div className="bg-white p-0 m-0">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FECHA</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HORA</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NOMBRE</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TELÉFONO</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRODUCTO</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAGO</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TIPO</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SUCURSAL</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ESTADO</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="px-4 py-4 text-sm text-gray-900">09/02/2026</td>
            <td className="px-4 py-4 text-sm font-medium text-gray-900">09:00</td>
            <td className="px-4 py-4 text-sm text-gray-900">Cristofer ched</td>
            <td className="px-4 py-4 text-sm text-gray-500">+54 9 11 2345-6789</td>
            <td className="px-4 py-4 text-sm text-gray-900">iPhone 17 Pro 512gb Blue Titanium</td>
            <td className="px-4 py-4 text-sm text-gray-900">Efectivo USD</td>
            <td className="px-4 py-4 text-sm text-gray-900">Minorista</td>
            <td className="px-4 py-4 text-sm text-gray-900">Adrogue</td>
            <td className="px-4 py-4">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                Pendiente
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
