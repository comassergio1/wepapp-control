import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Product } from '../types';
import {
  CalculatorIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

const Calculadora: React.FC = () => {
  const { user } = useAuth();
  const { products } = useData();
  const { currency, formatCurrency, dolarBlue } = useCurrency();
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deliveryAmount, setDeliveryAmount] = useState<string>('');
  const [installments, setInstallments] = useState<number>(1);
  const [copyGenerated, setCopyGenerated] = useState<boolean>(false);

  // Cálculos
  const totalCost = selectedProduct ? selectedProduct.price : 0;
  const delivery = parseFloat(deliveryAmount) || 0;
  const remainingAmount = totalCost - delivery;
  const interestRate = 0.18; // 18% por cuota
  const totalInterestRate = interestRate * installments; // Interés total según cuotas
  const totalWithInterest = remainingAmount * (1 + totalInterestRate);
  const installmentAmount = installments > 0 ? totalWithInterest / installments : 0;
  const totalFinanced = delivery + totalWithInterest;

  // Validaciones
  const isValidDelivery = delivery <= totalCost && delivery >= 0;
  const isValidInstallments = installments >= 1 && installments <= 12;
  const canCalculate = selectedProduct && isValidDelivery && isValidInstallments;

  // Generar copy
  const generateCopy = () => {
    if (!canCalculate) return '';
    
    const productName = selectedProduct?.name || '';
    const formattedDelivery = formatCurrency(delivery);
    const formattedInstallment = formatCurrency(installmentAmount);
    const currencySymbol = currency === 'ARS' ? 'ARS' : 'USD';
    
    return `Entregando ${formattedDelivery} por ${productName} te quedan ${installments} de ${formattedInstallment} ${currencySymbol}.`;
  };

  const handleCopyToClipboard = async () => {
    const copy = generateCopy();
    try {
      await navigator.clipboard.writeText(copy);
      setCopyGenerated(true);
      setTimeout(() => setCopyGenerated(false), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
    }
  };

  const handleRealizarVenta = () => {
    if (!canCalculate) return;
    
    // Crear los datos de la cuenta
    const accountData = {
      productId: selectedProduct!.id,
      totalAmount: totalFinanced,
      deliveryAmount: delivery,
      installmentAmount: installmentAmount,
      totalInstallments: installments
    };
    
    // Guardar en localStorage para que Cuentas pueda acceder
    localStorage.setItem('pendingAccountData', JSON.stringify(accountData));
    
    // Redirigir a cuentas con parámetro para abrir el formulario
    window.location.href = '/cuentas?addAccount=true';
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setDeliveryAmount('');
    setInstallments(1);
    setCopyGenerated(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Calculadora de Cuotas
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Calcula el monto de las cuotas para cualquier producto del inventario
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulario de cálculo */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Configuración del Financiamiento
            </h3>
            
            {/* Selección de producto */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Seleccionar Producto
                </label>
                <select
                  className="input-field w-full"
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const product = products.find(p => p.id === e.target.value);
                    setSelectedProduct(product || null);
                  }}
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Producto seleccionado */}
              {selectedProduct && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CalculatorIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-medium text-blue-900">Producto Seleccionado</h4>
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-blue-800">
                    <p><strong>Nombre:</strong> {selectedProduct.name}</p>
                    <p><strong>Descripción:</strong> {selectedProduct.description}</p>
                    <p><strong>Categoría:</strong> {selectedProduct.category}</p>
                    <p><strong>Ubicación:</strong> {selectedProduct.location}</p>
                  </div>
                </div>
              )}

              {/* Costo total */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Costo Total del Producto
                </label>
                <div className="text-lg font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {formatCurrency(totalCost)}
                </div>
              </div>

              {/* Monto de entrega */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3. Monto de Entrega
                </label>
                <input
                  type="number"
                  className={`input-field w-full ${!isValidDelivery && deliveryAmount ? 'border-red-300' : ''}`}
                  value={deliveryAmount}
                  onChange={(e) => setDeliveryAmount(e.target.value)}
                  placeholder="Ej: 300000"
                  min="0"
                  max={totalCost}
                />
                {!isValidDelivery && deliveryAmount && (
                  <p className="text-red-600 text-sm mt-1">
                    El monto de entrega no puede ser mayor al costo total
                  </p>
                )}
              </div>

              {/* Monto restante */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  4. Monto Restante
                </label>
                <div className="text-lg font-semibold text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {formatCurrency(remainingAmount)}
                </div>
              </div>

              {/* Cantidad de cuotas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  5. Cantidad de Cuotas (máximo 12)
                </label>
                <select
                  className={`input-field w-full ${!isValidInstallments ? 'border-red-300' : ''}`}
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'cuota' : 'cuotas'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Resultados del Cálculo
            </h3>
            
            {canCalculate ? (
              <div className="space-y-4">
                {/* Monto por cuota */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">Monto por Cuota</h4>
                      <p className="text-sm text-green-700">Cuota mensual calculada</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-900">
                        {formatCurrency(installmentAmount)}
                      </div>
                      <div className="text-sm text-green-600">
                        por {installments} {installments === 1 ? 'cuota' : 'cuotas'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumen financiero */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3">Resumen Financiero</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Costo sin financiar:</span>
                      <span className="font-medium">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Entrega:</span>
                      <span className="font-medium">{formatCurrency(delivery)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Monto a financiar:</span>
                      <span className="font-medium">{formatCurrency(remainingAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Costo financiamiento:</span>
                      <span className="font-medium">{formatCurrency(remainingAmount * totalInterestRate)}</span>
                    </div>
                    <hr className="border-blue-200" />
                    <div className="flex justify-between font-semibold">
                      <span className="text-blue-900">Total financiado:</span>
                      <span className="text-blue-900">{formatCurrency(totalFinanced)}</span>
                    </div>
                  </div>
                </div>

                {/* Botón para generar copy */}
                <button
                  onClick={handleCopyToClipboard}
                  className="w-full btn-primary flex items-center justify-center mb-3"
                  disabled={!canCalculate}
                >
                  {copyGenerated ? (
                    <>
                      <CheckIcon className="h-5 w-5 mr-2" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                      Generar Copy
                    </>
                  )}
                </button>

                {/* Botón para realizar venta */}
                <button
                  onClick={handleRealizarVenta}
                  className="w-full btn-secondary flex items-center justify-center"
                  disabled={!canCalculate}
                >
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  Realizar Venta
                </button>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800">
                    Completa todos los campos para ver los resultados
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Copy generado */}
          {canCalculate && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Copy Generado
              </h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {generateCopy()}
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Este copy incluye el producto, monto de cuota y divisa seleccionada
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Botón de reset */}
      <div className="flex justify-end">
        <button
          onClick={resetForm}
          className="btn-secondary"
        >
          Reiniciar Calculadora
        </button>
      </div>
    </div>
  );
};

export default Calculadora; 