import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { 
  ArrowUpTrayIcon, 
  ArrowDownTrayIcon, 
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';

interface ImportResult {
  success: number;
  errors: number;
  details: {
    success: string[];
    errors: { row: number; message: string }[];
  };
}

const ImportExport: React.FC = () => {
  const { products, clients, updateProduct, addProduct, addClient, updateClient } = useData();
  const [activeTab, setActiveTab] = useState<'products' | 'clients'>('products');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función para exportar productos
  const exportProducts = () => {
    setIsExporting(true);
    
    try {
      const data = products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category,
        location: product.location,
        is_active: 'TRUE' // Product no tiene is_active, siempre exportamos como activo
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');
      
      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 5 },   // id
        { wch: 30 },  // name
        { wch: 50 },  // description
        { wch: 15 },  // price
        { wch: 10 },  // stock
        { wch: 20 },  // category
        { wch: 15 },  // location
        { wch: 10 }   // is_active
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `productos_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setTimeout(() => setIsExporting(false), 1000);
    } catch (error) {
      console.error('Error exportando productos:', error);
      setIsExporting(false);
    }
  };

  // Función para exportar clientes
  const exportClients = () => {
    setIsExporting(true);
    
    try {
      const data = clients.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        revendedor_id: client.revendedorId,
        is_active: client.isActive ? 'TRUE' : 'FALSE'
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
      
      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 5 },   // id
        { wch: 30 },  // name
        { wch: 25 },  // email
        { wch: 15 },  // phone
        { wch: 40 },  // address
        { wch: 10 },  // revendedor_id
        { wch: 10 }   // is_active
      ];
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `clientes_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setTimeout(() => setIsExporting(false), 1000);
    } catch (error) {
      console.error('Error exportando clientes:', error);
      setIsExporting(false);
    }
  };

  // Función para crear plantilla de productos
  const downloadProductTemplate = () => {
    const templateData = [
      {
        id: '',
        name: 'Ejemplo Producto',
        description: 'Descripción del producto',
        price: '1500000',
        stock: '10',
        category: 'Electrónicos',
        location: 'Central',
        is_active: 'TRUE'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Productos');
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 5 },   // id
      { wch: 30 },  // name
      { wch: 50 },  // description
      { wch: 15 },  // price
      { wch: 10 },  // stock
      { wch: 20 },  // category
      { wch: 15 },  // location
      { wch: 10 }   // is_active
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'plantilla_productos.xlsx');
  };

  // Función para crear plantilla de clientes
  const downloadClientTemplate = () => {
    const templateData = [
      {
        id: '',
        name: 'Ejemplo Cliente',
        email: 'cliente@ejemplo.com',
        phone: '+54 11 1234-5678',
        address: 'Av. Ejemplo 123, CABA',
        revendedor_id: '1',
        is_active: 'TRUE'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Clientes');
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 5 },   // id
      { wch: 30 },  // name
      { wch: 25 },  // email
      { wch: 15 },  // phone
      { wch: 40 },  // address
      { wch: 10 },  // revendedor_id
      { wch: 10 }   // is_active
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'plantilla_clientes.xlsx');
  };

  // Función para importar productos
  const importProducts = async (file: File) => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const data = await readExcelFile(file);
      const result: ImportResult = {
        success: 0,
        errors: 0,
        details: { success: [], errors: [] }
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // +2 porque Excel empieza en 1 y la primera fila son headers

        try {
          // Validar datos requeridos
          if (!row.name || !row.price || !row.stock) {
            result.errors++;
            result.details.errors.push({
              row: rowNumber,
              message: 'Faltan campos requeridos (name, price, stock)'
            });
            continue;
          }

          const productData = {
            name: row.name,
            description: row.description || '',
            price: parseFloat(row.price),
            stock: parseInt(row.stock),
            category: row.category || 'Sin categoría',
            location: row.location || 'Central'
          };

          if (row.id && row.id !== '') {
            // Actualizar producto existente
            const existingProduct = products.find(p => p.id === row.id);
            if (existingProduct) {
              await updateProduct({
                ...existingProduct,
                ...productData
              });
              result.success++;
              result.details.success.push(`Producto actualizado: ${row.name} (ID: ${row.id})`);
            } else {
              result.errors++;
              result.details.errors.push({
                row: rowNumber,
                message: `Producto con ID ${row.id} no encontrado`
              });
            }
          } else {
            // Crear nuevo producto
            await addProduct(productData);
            result.success++;
            result.details.success.push(`Producto creado: ${row.name}`);
          }
        } catch (error) {
          result.errors++;
          result.details.errors.push({
            row: rowNumber,
            message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
          });
        }
      }

      setImportResult(result);
    } catch (error) {
      console.error('Error importando productos:', error);
      setImportResult({
        success: 0,
        errors: 1,
        details: {
          success: [],
          errors: [{ row: 0, message: 'Error leyendo el archivo' }]
        }
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Función para importar clientes
  const importClients = async (file: File) => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const data = await readExcelFile(file);
      const result: ImportResult = {
        success: 0,
        errors: 0,
        details: { success: [], errors: [] }
      };

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;

        try {
          // Validar datos requeridos
          if (!row.name || !row.revendedor_id) {
            result.errors++;
            result.details.errors.push({
              row: rowNumber,
              message: 'Faltan campos requeridos (name, revendedor_id)'
            });
            continue;
          }

          const clientData = {
            name: row.name,
            email: row.email || '',
            phone: row.phone || '',
            address: row.address || '',
            revendedorId: row.revendedor_id ? row.revendedor_id.toString() : '',
            revendedorName: '', // Se llenará automáticamente
            isActive: row.is_active === 'TRUE'
          };

          if (row.id && row.id !== '') {
            // Actualizar cliente existente
            const existingClient = clients.find(c => c.id === row.id);
            if (existingClient) {
              await updateClient({
                ...existingClient,
                ...clientData
              });
              result.success++;
              result.details.success.push(`Cliente actualizado: ${row.name} (ID: ${row.id})`);
            } else {
              result.errors++;
              result.details.errors.push({
                row: rowNumber,
                message: `Cliente con ID ${row.id} no encontrado`
              });
            }
          } else {
            // Crear nuevo cliente
            await addClient(clientData);
            result.success++;
            result.details.success.push(`Cliente creado: ${row.name}`);
          }
        } catch (error) {
          result.errors++;
          result.details.errors.push({
            row: rowNumber,
            message: `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
          });
        }
      }

      setImportResult(result);
    } catch (error) {
      console.error('Error importando clientes:', error);
      setImportResult({
        success: 0,
        errors: 1,
        details: {
          success: [],
          errors: [{ row: 0, message: 'Error leyendo el archivo' }]
        }
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Función para leer archivo Excel
  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Función para manejar la selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (activeTab === 'products') {
      importProducts(file);
    } else {
      importClients(file);
    }

    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Importar/Exportar Datos
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona la importación y exportación masiva de productos y clientes
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'clients'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Clientes
          </button>
        </nav>
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exportar */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Exportar Datos
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Descarga los datos actuales en formato Excel
          </p>
          
          <button
            onClick={activeTab === 'products' ? exportProducts : exportClients}
            disabled={isExporting}
            className="btn-primary w-full flex items-center justify-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            {isExporting ? 'Exportando...' : `Exportar ${activeTab === 'products' ? 'Productos' : 'Clientes'}`}
          </button>
        </div>

        {/* Plantilla */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Descargar Plantilla
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Descarga una plantilla con el formato correcto
          </p>
          
          <button
            onClick={activeTab === 'products' ? downloadProductTemplate : downloadClientTemplate}
            className="btn-secondary w-full flex items-center justify-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Descargar Plantilla {activeTab === 'products' ? 'Productos' : 'Clientes'}
          </button>
        </div>
      </div>

      {/* Importar */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Importar Datos
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Sube un archivo Excel con los datos a importar
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className={`btn-primary ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {isImporting ? 'Importando...' : 'Seleccionar Archivo Excel'}
              </span>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={isImporting}
                className="sr-only"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Solo archivos .xlsx o .xls
            </p>
            {isImporting && (
              <p className="text-sm text-blue-600 mt-2">
                Procesando archivo, por favor espera...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Resultados de importación */}
      {importResult && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Resultados de la Importación
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  Exitosos: {importResult.success}
                </span>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-sm font-medium text-red-800">
                  Errores: {importResult.errors}
                </span>
              </div>
            </div>
          </div>

          {/* Detalles de éxito */}
          {importResult.details.success.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Operaciones Exitosas:
              </h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                {importResult.details.success.map((success, index) => (
                  <div key={index} className="text-sm text-green-700 mb-1">
                    ✅ {success}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detalles de errores */}
          {importResult.details.errors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Errores Encontrados:
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                {importResult.details.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-700 mb-1">
                    ❌ Fila {error.row}: {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Información adicional */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Información Importante
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Los archivos deben tener el formato exacto de las plantillas</li>
              <li>• Para actualizar productos/clientes existentes, incluye el ID</li>
              <li>• Para crear nuevos registros, deja el campo ID vacío</li>
              <li>• Los precios deben estar en centavos (ej: 1500000 = $15,000.00)</li>
              <li>• Los campos is_active deben ser 'TRUE' o 'FALSE'</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExport; 