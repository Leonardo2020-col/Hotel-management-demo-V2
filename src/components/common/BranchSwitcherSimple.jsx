// src/components/common/BranchSwitcherSimple.jsx - SIN HOOKS COMPLEJOS
import React, { useState } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';

const BranchSwitcherSimple = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Mock data - SIN llamadas a Supabase que puedan causar errores
  const mockBranches = [
    { id: 1, name: 'Hotel Paraíso - Centro', location: 'Lima Centro', code: 'HPC' },
    { id: 2, name: 'Hotel Paraíso - Miraflores', location: 'Miraflores', code: 'HPM' },
    { id: 3, name: 'Hotel Paraíso - Aeropuerto', location: 'Callao', code: 'HPA' }
  ];

  const [selectedBranch, setSelectedBranch] = useState(mockBranches[0]);

  // Función ultra-simple para toggle - SIN useCallback, SIN useEffect
  const handleToggle = () => {
    console.log('🔄 Simple toggle clicked');
    if (switching) return;
    setIsOpen(!isOpen);
  };

  // Función ultra-simple para cambio de sucursal - SIN async, SIN hooks complejos
  const handleBranchSelect = (branch) => {
    console.log('🏢 Simple branch select:', branch.name);
    
    if (switching) return;
    
    setSwitching(true);
    
    // Simular cambio SIN promises, SIN async/await
    setTimeout(() => {
      setSelectedBranch(branch);
      setIsOpen(false);
      setSwitching(false);
      console.log('✅ Branch changed successfully to:', branch.name);
    }, 300);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal - COMPLETAMENTE SIMPLE */}
      <div
        onClick={handleToggle}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer min-w-[200px]"
        style={{ userSelect: 'none' }}
      >
        <Building2 className="w-4 h-4 text-gray-600" />
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-gray-900">
            {selectedBranch.name}
          </div>
          <div className="text-xs text-gray-500">
            {selectedBranch.location}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown simple - SIN complicaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              🧪 Branch Switcher Simplificado (Test)
            </h3>
            <p className="text-xs text-gray-500">
              Versión sin hooks complejos - Si esto funciona, el problema está en los hooks
            </p>
          </div>
          
          <div className="py-2">
            {mockBranches.map((branch) => {
              const isSelected = selectedBranch.id === branch.id;
              
              return (
                <div
                  key={branch.id}
                  onClick={() => handleBranchSelect(branch)}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  style={{ userSelect: 'none' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {branch.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {branch.location} • {branch.code}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="p-3 border-t border-gray-100 bg-green-50">
            <p className="text-xs text-green-700 text-center">
              ✅ Si ESTO funciona sin refresh, el problema está en useBranch/AuthContext
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSwitcherSimple;