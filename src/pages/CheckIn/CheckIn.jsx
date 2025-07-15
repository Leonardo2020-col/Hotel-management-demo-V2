// src/pages/CheckIn/CheckIn.jsx - REFACTORIZADO
import React, { useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import Button from '../../components/common/Button';
import RoomGrid from '../../components/checkin/RoomGrid';
import SnackSelection from '../../components/checkin/SnackSelection';
import CheckoutSummary from '../../components/checkin/CheckoutSummary';
import { useCheckInData } from '../../hooks/useCheckInData';

const CheckIn = () => {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [orderStep, setOrderStep] = useState(0); // 0: rooms, 1: snack selection, 2: checkout summary
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [selectedSnackType, setSelectedSnackType] = useState(null);
  const [selectedSnacks, setSelectedSnacks] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Hook personalizado para datos
  const {
    floorRooms,
    snackTypes,
    snackItems,
    roomPrices,
    savedOrders,
    setSavedOrders
  } = useCheckInData();

  // Handlers para RoomGrid
  const handleFloorChange = (floor) => {
    setSelectedFloor(floor);
    setSelectedRoom(null);
  };

  const handleRoomClick = (room) => {
    if (checkoutMode) {
      if (room.status === 'occupied') {
        setSelectedRoom(room);
        // Ir directamente al checkout sin botón "siguiente"
        if (savedOrders[room.number]) {
          setCurrentOrder(savedOrders[room.number]);
          setOrderStep(2);
        }
      }
    } else {
      if (room.status !== 'occupied') {
        setSelectedRoom(room);
        // Ir directamente a selección de snacks sin botón "siguiente"
        setCurrentOrder({
          room: room,
          roomPrice: roomPrices[selectedFloor],
          snacks: [],
          total: roomPrices[selectedFloor]
        });
        setOrderStep(1);
      }
    }
  };

  const handleCheckOutClick = () => {
    setCheckoutMode(true);
    setSelectedRoom(null);
    setOrderStep(0);
  };

  const handleCheckInClick = () => {
    setCheckoutMode(false);
    setSelectedRoom(null);
    setOrderStep(0);
  };

  // Eliminar handlers innecesarios ya que ahora es automático
  // const handleNext = () => { ... }
  // const handleStartOrder = () => { ... }
  // const handleStartCheckout = () => { ... }

  // Handlers para SnackSelection - Restaurados
  const handleSnackTypeSelect = (typeId) => {
    setSelectedSnackType(typeId);
  };

  const handleSnackSelect = (snack) => {
    const existingSnack = selectedSnacks.find(s => s.id === snack.id);
    if (existingSnack) {
      setSelectedSnacks(selectedSnacks.map(s => 
        s.id === snack.id 
          ? { ...s, quantity: s.quantity + 1 }
          : s
      ));
    } else {
      setSelectedSnacks([...selectedSnacks, { ...snack, quantity: 1 }]);
    }
  };

  const handleSnackRemove = (snackId) => {
    setSelectedSnacks(selectedSnacks.filter(s => s.id !== snackId));
  };

  const handleQuantityUpdate = (snackId, newQuantity) => {
    if (newQuantity <= 0) {
      handleSnackRemove(snackId);
    } else {
      setSelectedSnacks(selectedSnacks.map(s => 
        s.id === snackId 
          ? { ...s, quantity: newQuantity }
          : s
      ));
    }
  };
  const handleConfirmOrder = () => {
    const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0);
    const finalOrder = {
      ...currentOrder,
      snacks: selectedSnacks,
      total: currentOrder.roomPrice + snacksTotal
    };
    
    console.log('Orden confirmada:', finalOrder);
    alert(`Orden confirmada para habitación ${finalOrder.room.number}\nPrecio habitación: ${finalOrder.roomPrice.toFixed(2)}\nSnacks: ${snacksTotal.toFixed(2)}\nTotal: ${finalOrder.total.toFixed(2)}`);
    resetOrder();
  };

  // Nueva función para confirmar solo la habitación sin snacks
  const handleConfirmRoomOnly = () => {
    const finalOrder = {
      ...currentOrder,
      snacks: [],
      total: currentOrder.roomPrice
    };
    
    console.log('Habitación confirmada sin snacks:', finalOrder);
    alert(`Check-in completado!\nHabitación: ${finalOrder.room.number}\nTotal: ${finalOrder.total.toFixed(2)}`);
    resetOrder();
  };

  // Handlers para CheckoutSummary
  const handleProcessPayment = (paymentMethod) => {
    if (currentOrder) {
      alert(`Pago procesado exitosamente!\nHabitación: ${currentOrder.room.number}\nHuésped: ${currentOrder.guestName}\nTotal: $${currentOrder.total.toFixed(2)}\nMétodo: ${paymentMethod}\n\nCheck-out completado.`);
      
      // Remover la orden guardada
      const newSavedOrders = { ...savedOrders };
      delete newSavedOrders[currentOrder.room.number];
      setSavedOrders(newSavedOrders);
      
      resetOrder();
    }
  };

  const resetOrder = () => {
    setOrderStep(0);
    setSelectedSnackType(null);
    setSelectedSnacks([]);
    setCurrentOrder(null);
    setSelectedRoom(null);
    setCheckoutMode(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Reception Panel</h1>
        </div>

        {/* Action Buttons - Solo mostrar en paso 0 */}
        {orderStep === 0 && (
          <div className="flex justify-center space-x-4 mb-8">
            <Button
              variant={!checkoutMode ? "primary" : "outline"}
              size="lg"
              icon={LogIn}
              onClick={handleCheckInClick}
              className="px-8 py-4 text-lg"
            >
              Check In
            </Button>
            
            <Button
              variant={checkoutMode ? "danger" : "outline"}
              size="lg"
              icon={LogOut}
              onClick={handleCheckOutClick}
              className="px-8 py-4 text-lg"
            >
              Check Out
            </Button>
          </div>
        )}

        {/* Contenido Principal */}
        <div className="bg-white rounded-lg shadow-lg p-6">

          {/* Paso 0: Grid de Habitaciones */}
          {orderStep === 0 && (
            <RoomGrid
              floorRooms={floorRooms}
              selectedFloor={selectedFloor}
              selectedRoom={selectedRoom}
              checkoutMode={checkoutMode}
              savedOrders={savedOrders}
              onFloorChange={handleFloorChange}
              onRoomClick={handleRoomClick}
              onNext={() => {}} // No se usa más, pero mantenemos para compatibilidad
            />
          )}

          {/* Paso 1: Selección de Snacks */}
          {orderStep === 1 && !checkoutMode && (
            <SnackSelection
              currentOrder={currentOrder}
              selectedSnackType={selectedSnackType}
              selectedSnacks={selectedSnacks}
              snackTypes={snackTypes}
              snackItems={snackItems}
              onBack={() => setOrderStep(0)}
              onSnackTypeSelect={handleSnackTypeSelect}
              onSnackSelect={handleSnackSelect}
              onSnackRemove={handleSnackRemove}
              onQuantityUpdate={handleQuantityUpdate}
              onConfirmOrder={handleConfirmOrder}
              onConfirmRoomOnly={handleConfirmRoomOnly}
              onCancelOrder={resetOrder}
            />
          )}

          {/* Paso 2: Resumen de Check Out */}
          {orderStep === 2 && checkoutMode && (
            <CheckoutSummary
              currentOrder={currentOrder}
              onBack={() => setOrderStep(0)}
              onProcessPayment={handleProcessPayment}
              onCancel={resetOrder}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default CheckIn;