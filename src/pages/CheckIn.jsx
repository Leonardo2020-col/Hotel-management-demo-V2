// src/pages/CheckIn/CheckIn.jsx - VERSIÓN HÍBRIDA MEJORADA
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { 
  RefreshCw, 
  Sparkles, 
  User, 
  CreditCard, 
  AlertTriangle,
  ArrowLeft,
  Search,
  Phone,
  Calendar,
  Bed,
  Users,
  DollarSign,
  CheckCircle,
  Plus,
  Calculator,
  Receipt,
  Clock
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import Button from '../components/common/Button'
import RoomGrid from '../components/checkin/RoomGrid'
import SnackSelection from '../components/checkin/SnackSelection'
import QuickCheckoutModal from '../components/checkin/QuickCheckoutModal'
import { useQuickCheckins } from '../hooks/useQuickCheckins'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import classNames from 'classnames'

// ✅ Componente de debug temporal (solo en desarrollo)
const AuthDebug = () => {
  const { userInfo, getPrimaryBranch, getUserBranches } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const primaryBranch = getPrimaryBranch();
  const allBranches = getUserBranches();

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg max-w-md text-xs overflow-auto max-h-96 z-50">
      <h3 className="font-bold text-yellow-400 mb-2">🐛 AUTH DEBUG</h3>
      
      <div className="space-y-2">
        <div>
          <strong className="text-green-400">User Info:</strong>
          <pre className="text-xs overflow-auto">
            {userInfo ? JSON.stringify({
              id: userInfo.id,
              name: `${userInfo.first_name} ${userInfo.last_name}`,
              email: userInfo.email,
              role: userInfo.role?.name,
              branches_count: userInfo.user_branches?.length || 0
            }, null, 2) : 'null'}
          </pre>
        </div>

        <div>
          <strong className="text-blue-400">Primary Branch:</strong>
          <pre className="text-xs overflow-auto">
            {primaryBranch ? JSON.stringify({
              id: primaryBranch.id,
              name: primaryBranch.name,
              isActive: primaryBranch.is_active,
              isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(primaryBranch.id)
            }, null, 2) : 'null'}
          </pre>
        </div>

        <div>
          <strong className="text-purple-400">All Branches:</strong>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(allBranches?.map(b => ({
              id: b.id,
              name: b.name,
              isActive: b.is_active
            })) || [], null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

// ✅ Schema de validación mejorado
const checkinSchema = yup.object().shape({
  // Datos del huésped
  guest_first_name: yup.string().required('Nombre es requerido').min(2, 'Mínimo 2 caracteres'),
  guest_last_name: yup.string().required('Apellido es requerido').min(2, 'Mínimo 2 caracteres'),
  guest_phone: yup.string().required('Teléfono es requerido').min(7, 'Mínimo 7 dígitos'),
  guest_document_type: yup.string().required('Tipo de documento requerido'),
  guest_document_number: yup.string().required('Número de documento requerido').min(6, 'Mínimo 6 caracteres'),
  guest_email: yup.string().email('Email inválido').nullable(),
  
  // Datos de la reserva (solo para flujo completo)
  check_in_date: yup.date().required('Fecha de entrada requerida'),
  check_out_date: yup.date()
    .required('Fecha de salida requerida')
    .min(yup.ref('check_in_date'), 'La fecha de salida debe ser posterior a la entrada'),
  
  // Datos de pago
  payment_method: yup.string().required('Método de pago requerido'),
  payment_amount: yup.number().min(0, 'El monto debe ser mayor a 0')
})

const CheckIn = () => {
  const { userInfo, getPrimaryBranch } = useAuth()
  const navigate = useNavigate()
  
  // ✅ Estados principales
  const [mode, setMode] = useState('grid') // 'grid' | 'form' | 'guest-search'
  const [flowType, setFlowType] = useState('quick') // 'quick' | 'complete'
  const [step, setStep] = useState(1) // Para flujo completo: 1-4
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedFloor, setSelectedFloor] = useState(1)
  const [orderStep, setOrderStep] = useState(0) // Para flujo rápido
  const [selectedSnackType, setSelectedSnackType] = useState(null)
  const [selectedSnacks, setSelectedSnacks] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)
  const [processingRoom, setProcessingRoom] = useState(null)
  const [showQuickCheckout, setShowQuickCheckout] = useState(false)
  const [quickCheckoutData, setQuickCheckoutData] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // ✅ Estados para búsqueda de huéspedes
  const [selectedGuest, setSelectedGuest] = useState(null)
  const [isNewGuest, setIsNewGuest] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [mockGuests] = useState([
    { id: 1, first_name: 'Juan', last_name: 'Pérez', phone: '555-0001', document_number: '12345678', email: 'juan@email.com' },
    { id: 2, first_name: 'María', last_name: 'García', phone: '555-0002', document_number: '87654321', email: 'maria@email.com' },
    { id: 3, first_name: 'Carlos', last_name: 'López', phone: '555-0003', document_number: '11223344', email: 'carlos@email.com' }
  ])
  
  // ✅ Estado para huésped (compatible con ambos flujos)
  const [guestData, setGuestData] = useState({
    fullName: '',
    documentType: 'DNI',
    documentNumber: '',
    phone: '',
    email: ''
  })

  // ✅ Usar hook de quick check-ins
  const {
    roomsByFloor,
    activeCheckins,
    snackTypes,
    snackItems,
    roomPrices,
    loading,
    error,
    processQuickCheckIn,
    processQuickCheckOut,
    cleanRoom,
    refreshData
  } = useQuickCheckins()

  // ✅ Form para flujo completo
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(checkinSchema),
    defaultValues: {
      check_in_date: format(new Date(), 'yyyy-MM-dd'),
      check_out_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      guest_document_type: 'cedula'
    }
  })

  const watchCheckInDate = watch('check_in_date')
  const watchCheckOutDate = watch('check_out_date')
  const watchRoomId = watch('room_id')

  // ✅ Métodos de pago y tipos de documento
  const paymentMethods = [
    { id: 'cash', name: 'Efectivo', icon: DollarSign },
    { id: 'card', name: 'Tarjeta', icon: CreditCard },
    { id: 'digital', name: 'Digital (Yape/Plin)', icon: CreditCard }
  ]

  const documentTypes = [
    { value: 'DNI', label: 'DNI' },
    { value: 'pasaporte', label: 'Pasaporte' },
    { value: 'carnet_extranjeria', label: 'Carnet de Extranjería' }
  ]

  // ✅ Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (mode === 'grid' && orderStep === 0) {
        refreshData()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [mode, orderStep, refreshData])

  // ✅ Seleccionar piso automáticamente
  useEffect(() => {
    if (roomsByFloor && typeof roomsByFloor === 'object') {
      const availableFloors = Object.keys(roomsByFloor).map(f => parseInt(f)).filter(f => !isNaN(f))
      if (availableFloors.length > 0 && !availableFloors.includes(selectedFloor)) {
        const firstFloor = Math.min(...availableFloors)
        setSelectedFloor(firstFloor)
      }
    }
  }, [roomsByFloor, selectedFloor])

  // ✅ Calcular noches y total (para flujo completo)
  const calculateStay = () => {
    if (!watchCheckInDate || !watchCheckOutDate || !selectedRoom) return { nights: 0, total: 0 }
    
    const checkIn = new Date(watchCheckInDate)
    const checkOut = new Date(watchCheckOutDate)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
    const floor = Math.floor(parseInt(selectedRoom.number) / 100)
    const roomPrice = roomPrices && roomPrices[floor] ? roomPrices[floor] : selectedRoom.base_price || 100
    const total = nights * roomPrice
    
    return { nights: Math.max(0, nights), total: Math.max(0, total) }
  }

  const { nights, total } = calculateStay()

  // ✅ Buscar huéspedes existentes
  const filteredGuests = mockGuests.filter(guest => 
    guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone.includes(searchTerm) ||
    guest.document_number.includes(searchTerm)
  )

  // ✅ HANDLERS PRINCIPALES

  const handleFloorChange = (floor) => {
    setSelectedFloor(floor)
    setSelectedRoom(null)
  }

  // ✅ FUNCIÓN PRINCIPAL: Manejo inteligente de clicks en habitaciones
  const handleRoomClick = async (room) => {
    if (loading || processingRoom === room.number) {
      return
    }

    setProcessingRoom(room.number)
    console.log('🔘 Room clicked:', room, 'Mode:', mode, 'Flow:', flowType)

    try {
      if (room.status === 'available' && room.cleaning_status === 'clean') {
        // ✅ HABITACIÓN DISPONIBLE
        if (flowType === 'quick') {
          await handleQuickWalkInCheckIn(room)
        } else {
          // Flujo completo: ir a búsqueda de huésped
          setSelectedRoom(room)
          setMode('guest-search')
          setStep(1)
        }
        
      } else if (room.status === 'occupied' && room.quickCheckin) {
        // 🚪 HABITACIÓN OCUPADA POR QUICK CHECK-IN - PROCESAR CHECK-OUT
        await handleQuickCheckOutFlow(room)
        
      } else if (room.cleaning_status === 'dirty' || room.status === 'cleaning') {
        // 🧹 HABITACIÓN SUCIA - LIMPIAR AUTOMÁTICAMENTE
        await handleQuickClean(room.id || room.room_id)
        
      } else {
        // ⚠️ OTROS ESTADOS
        toast.warning(`Habitación ${room.number} no disponible (Estado: ${room.status})`)
      }
      
    } catch (error) {
      console.error('❌ Error processing room click:', error)
      toast.error('Error inesperado al procesar la habitación')
    } finally {
      setProcessingRoom(null)
    }
  }

  // ✅ QUICK WALK-IN CHECK-IN (flujo rápido)
  const handleQuickWalkInCheckIn = async (room) => {
    console.log('🚶‍♂️ Starting quick walk-in check-in for room:', room.number)
    
    const floor = Math.floor(parseInt(room.number) / 100)
    const roomPrice = roomPrices && roomPrices[floor] ? roomPrices[floor] : 100
    
    // Resetear datos del huésped
    setGuestData({
      fullName: '',
      documentType: 'DNI',
      documentNumber: '',
      phone: '',
      email: ''
    })
    
    setSelectedRoom(room)
    setCurrentOrder({
      room: room,
      roomPrice: roomPrice,
      snacks: [],
      total: roomPrice,
      isWalkIn: true,
      isQuick: true
    })
    setMode('form')
    setOrderStep(1)
    
    toast.success(`Iniciando registro rápido para habitación ${room.number}`, {
      icon: '🚶‍♂️',
      duration: 2000
    })
  }

  // ✅ BÚSQUEDA DE HUÉSPED (flujo completo)
  const handleGuestSelect = (guest) => {
    setSelectedGuest(guest)
    setIsNewGuest(false)
    setValue('guest_first_name', guest.first_name)
    setValue('guest_last_name', guest.last_name)
    setValue('guest_phone', guest.phone)
    setValue('guest_document_number', guest.document_number)
    setValue('guest_email', guest.email || '')
    setMode('form')
    setStep(2)
  }

  const handleNewGuest = () => {
    setSelectedGuest(null)
    setIsNewGuest(true)
    reset({
      check_in_date: format(new Date(), 'yyyy-MM-dd'),
      check_out_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      guest_document_type: 'DNI'
    })
    setMode('form')
    setStep(2)
  }

  // ✅ QUICK CHECK-OUT FLOW
  const handleQuickCheckOutFlow = async (room) => {
    console.log('🚪 Starting quick check-out for room:', room.number)
    
    try {
      const activeCheckin = room.quickCheckin || activeCheckins[room.number]
      
      if (!activeCheckin) {
        toast.error(`No se encontró check-in activo para la habitación ${room.number}`)
        return
      }

      // Configurar datos para check-out con servicios adicionales
      setGuestData({
        fullName: activeCheckin.guest_name || 'Huésped',
        documentType: activeCheckin.document_type || 'DNI',
        documentNumber: activeCheckin.document_number || '',
        phone: activeCheckin.phone || '',
        email: activeCheckin.email || ''
      })
      
      setSelectedSnacks(activeCheckin.snacks_consumed || [])
      setSelectedSnackType(null)
      
      setSelectedRoom(room)
      setCurrentOrder({
        id: activeCheckin.id,
        room: room,
        roomPrice: activeCheckin.room_rate || 0,
        snacks: activeCheckin.snacks_consumed || [],
        total: activeCheckin.total_amount || 0,
        originalTotal: activeCheckin.total_amount || 0,
        guestName: activeCheckin.guest_name,
        checkInDate: activeCheckin.check_in_date,
        confirmationCode: activeCheckin.confirmation_code,
        isCheckout: true,
        isQuickCheckin: true
      })
      setMode('form')
      setOrderStep(1)
      
      toast.success(`Preparando check-out para habitación ${room.number}`, {
        icon: '🛒',
        duration: 2000
      })
      
    } catch (error) {
      console.error('❌ Error in quick check-out flow:', error)
      toast.error('Error al preparar check-out: ' + error.message)
    }
  }

  // ✅ LIMPIEZA RÁPIDA
  const handleQuickClean = async (roomId) => {
    try {
      const roomData = Object.values(roomsByFloor)
        .flat()
        .find(room => room.id === roomId || room.room_id === roomId)
      
      const roomNumber = roomData?.number || 'desconocida'
      
      const { data, error } = await cleanRoom(roomId)
      
      if (error) {
        toast.error(`Error al limpiar habitación: ${error.message}`)
        return
      }
      
      toast.success(`Habitación ${roomNumber} limpia y disponible`, {
        icon: '✨',
        duration: 3000
      })
      
    } catch (error) {
      console.error('❌ Error in handleQuickClean:', error)
      toast.error('Error inesperado al limpiar habitación')
    }
  }

  // ✅ SUBMIT PARA FLUJO COMPLETO
  const onSubmit = async (data) => {
    try {
      setIsProcessing(true)
      
      console.log('✅ Processing complete check-in with form data:', data)
      
      // Convertir datos del form al formato esperado por el hook
      const guestFormData = {
        fullName: `${data.guest_first_name} ${data.guest_last_name}`,
        documentType: data.guest_document_type,
        documentNumber: data.guest_document_number,
        phone: data.guest_phone,
        email: data.guest_email || ''
      }
      
      const orderData = {
        room: selectedRoom,
        roomPrice: total / nights, // precio por noche
        snacks: selectedSnacks,
        total: total,
        checkInDate: data.check_in_date,
        checkOutDate: data.check_out_date,
        paymentMethod: data.payment_method,
        paymentAmount: data.payment_amount,
        isComplete: true // Flag para distinguir del quick check-in
      }
      
      // ✅ Usar función de quick check-in pero con datos completos
      const { data: result, error } = await processQuickCheckIn(orderData, guestFormData, selectedSnacks)
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-in')
        return
      }

      toast.success('Check-in procesado exitosamente')
      setStep(4) // Ir a confirmación
      
    } catch (error) {
      console.error('Error en check-in completo:', error)
      toast.error('Error al procesar el check-in')
    } finally {
      setIsProcessing(false)
    }
  }

  // ✅ HANDLERS PARA SNACK SELECTION (flujo rápido)
  const handleGuestDataChange = (newGuestData) => {
    setGuestData(newGuestData)
  }

  const handleSnackTypeSelect = (typeId) => {
    setSelectedSnackType(typeId)
  }

  const handleSnackSelect = (snack) => {
    const existingSnack = selectedSnacks.find(s => s.id === snack.id)
    if (existingSnack) {
      setSelectedSnacks(selectedSnacks.map(s => 
        s.id === snack.id 
          ? { ...s, quantity: s.quantity + 1 }
          : s
      ))
    } else {
      setSelectedSnacks([...selectedSnacks, { ...snack, quantity: 1 }])
    }
  }

  const handleSnackRemove = (snackId) => {
    setSelectedSnacks(selectedSnacks.filter(s => s.id !== snackId))
  }

  const handleQuantityUpdate = (snackId, newQuantity) => {
    if (newQuantity <= 0) {
      handleSnackRemove(snackId)
    } else {
      setSelectedSnacks(selectedSnacks.map(s => 
        s.id === snackId 
          ? { ...s, quantity: newQuantity }
          : s
      ))
    }
  }

  // ✅ CONFIRMAR ORDEN (check-in rápido o check-out con servicios)
  const handleConfirmOrder = async () => {
    if (!currentOrder) {
      toast.error('No hay orden actual')
      return
    }

    // Verificar si es check-out o check-in
    if (currentOrder.isCheckout) {
      // ✅ Es un check-out con servicios adicionales
      if (!guestData.fullName?.trim()) {
        toast.error('Información del huésped incompleta')
        return
      }

      // Actualizar la orden con los nuevos snacks
      const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      const updatedOrder = {
        ...currentOrder,
        snacks: selectedSnacks,
        total: (currentOrder.originalTotal || currentOrder.roomPrice || 0) + snacksTotal
      }

      // Ir al modal de confirmación de check-out
      showCheckOutConfirmation(updatedOrder)
      return
    }

    // ✅ Es un walk-in check-in rápido
    if (!guestData.fullName?.trim()) {
      toast.error('El nombre completo es obligatorio')
      return
    }

    if (!guestData.documentNumber?.trim()) {
      toast.error('El documento de identidad es obligatorio')
      return
    }

    if (guestData.documentNumber.length < 6) {
      toast.error('El documento debe tener al menos 6 caracteres')
      return
    }

    try {
      console.log('✅ Processing quick walk-in check-in')
      
      // ✅ Usar función de quick check-in
      const { data, error } = await processQuickCheckIn(currentOrder, guestData, selectedSnacks)
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-in')
        return
      }

      const snacksTotal = selectedSnacks.reduce((total, snack) => total + (snack.price * snack.quantity), 0)
      
      toast.success(
        `¡Check-in rápido completado!\n👤 ${guestData.fullName}\n🏨 Habitación ${currentOrder.room.number}\n💰 S/ ${(currentOrder.roomPrice + snacksTotal).toFixed(2)}`,
        { duration: 5000, icon: '✅' }
      )
      
      resetToGrid()
    } catch (error) {
      console.error('Error in handleConfirmOrder:', error)
      toast.error('Error inesperado al procesar check-in')
    }
  }

  // ✅ CONFIRMAR SOLO HABITACIÓN (sin snacks)
  const handleConfirmRoomOnly = async () => {
    if (!currentOrder || currentOrder.isCheckout) {
      return handleConfirmOrder()
    }

    // Validación mínima
    if (!guestData.fullName?.trim()) {
      toast.error('El nombre completo es obligatorio')
      return
    }

    if (!guestData.documentNumber?.trim()) {
      toast.error('El documento de identidad es obligatorio')
      return
    }

    try {
      // ✅ Usar función de quick check-in sin snacks
      const { data, error } = await processQuickCheckIn(currentOrder, guestData, [])
      
      if (error) {
        toast.error(error.message || 'Error al procesar check-in')
        return
      }

      toast.success(
        `¡Check-in rápido completado!\n👤 ${guestData.fullName}\n🏨 Habitación ${currentOrder.room.number}\n💰 S/ ${currentOrder.roomPrice.toFixed(2)}`,
        { duration: 5000, icon: '✅' }
      )
      
      resetToGrid()
    } catch (error) {
      console.error('Error in handleConfirmRoomOnly:', error)
      toast.error('Error inesperado al procesar check-in')
    }
  }

  // ✅ CONFIRMAR CHECK-OUT
  const showCheckOutConfirmation = (order) => {
    console.log('📝 Showing quick checkout confirmation:', order)
    
    if (!order.room || !order.room.number) {
      toast.error('Error: Información de habitación faltante')
      return
    }
    
    if (!order.id) {
      toast.error('Error: ID de check-in faltante')
      return
    }
    
    setQuickCheckoutData(order)
    setShowQuickCheckout(true)
  }

  const handleQuickCheckoutConfirm = async (paymentMethod) => {
    if (!quickCheckoutData) {
      toast.error('No hay datos de check-out')
      return
    }
    
    try {
      setProcessingRoom(quickCheckoutData.room.number)
      
      const { data, error } = await processQuickCheckOut(quickCheckoutData.room.number, paymentMethod)
      
      if (error) {
        throw error
      }
      
      setShowQuickCheckout(false)
      setQuickCheckoutData(null)
      resetToGrid()
      
      toast.success(
        `¡Check-out completado!\n🏨 Habitación: ${quickCheckoutData.room.number}\n👤 ${quickCheckoutData.guestName}\n💰 S/ ${quickCheckoutData.total.toFixed(2)}\n💳 ${getPaymentMethodName(paymentMethod)}`,
        { duration: 4000, icon: '✅' }
      )
      
    } catch (error) {
      console.error('❌ Error in quick checkout:', error)
      toast.error('Error al procesar check-out: ' + error.message)
    } finally {
      setProcessingRoom(null)
    }
  }

  // ✅ RESET FUNCTIONS
  const resetToGrid = () => {
    setMode('grid')
    setFlowType('quick')
    setOrderStep(0)
    setStep(1)
    setSelectedSnackType(null)
    setSelectedSnacks([])
    setCurrentOrder(null)
    setSelectedRoom(null)
    setSelectedGuest(null)
    setSearchTerm('')
    setGuestData({
      fullName: '',
      documentType: 'DNI',
      documentNumber: '',
      phone: '',
      email: ''
    })
    reset({
      check_in_date: format(new Date(), 'yyyy-MM-dd'),
      check_out_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      guest_document_type: 'DNI'
    })
  }

  const handleNewCheckIn = () => {
    resetToGrid()
  }

  const getPaymentMethodName = (method) => {
    const methods = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'digital': 'Digital (Yape/Plin)'
    }
    return methods[method] || method
  }

  const handleCloseQuickCheckout = () => {
    setShowQuickCheckout(false)
    setQuickCheckoutData(null)
  }

  // ✅ MANEJO DE ERRORES
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar datos</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              variant="primary"
              onClick={refreshData}
              icon={RefreshCw}
              disabled={loading}
            >
              {loading ? 'Recargando...' : 'Reintentar'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ✅ LOADING INICIAL
  if (loading && mode === 'grid') {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Panel de Check-in</h1>
            <p className="text-gray-600">Sistema híbrido de check-in rápido y completo</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando panel de check-in...</p>
          </div>
        </div>
      </div>
    )
  }

  const needsCleaningCount = Object.values(roomsByFloor).flat()
    .filter(r => r.cleaning_status === 'dirty' || r.status === 'cleaning').length

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* ✅ HEADER PRINCIPAL */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Panel de Check-in</h1>
                <div className="flex items-center space-x-3 mb-2">
                  <p className="text-gray-600">
                    {mode === 'form' && orderStep === 1 && currentOrder?.isCheckout 
                      ? `Check-out con servicios - Habitación ${currentOrder.room.number}`
                      : mode === 'form' && orderStep === 1 && flowType === 'quick'
                        ? 'Check-in rápido (Walk-in)'
                        : mode === 'form' && flowType === 'complete'
                          ? `Check-in completo - Paso ${step} de 4`
                        : mode === 'guest-search'
                          ? 'Búsqueda de huésped'
                          : 'Sistema híbrido: Check-in rápido y completo'
                    }
                  </p>
                  
                  {/* ✅ Selector de modo */}
                  {mode === 'grid' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setFlowType('quick')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          flowType === 'quick' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        🚀 Rápido
                      </button>
                      <button
                        onClick={() => setFlowType('complete')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          flowType === 'complete' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        📋 Completo
                      </button>
                    </div>
                  )}
                </div>
                
                {/* ✅ Indicador de progreso para flujo completo */}
                {mode === 'form' && flowType === 'complete' && (
                  <div className="flex items-center space-x-2 mt-2">
                    {[1, 2, 3, 4].map((stepNumber) => (
                      <div
                        key={stepNumber}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          stepNumber <= step
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {stepNumber}
                      </div>
                    ))}
                    <span className="text-sm text-gray-500 ml-2">
                      {step === 1 && 'Buscar Huésped'}
                      {step === 2 && 'Seleccionar Habitación'}
                      {step === 3 && 'Detalles y Pago'}
                      {step === 4 && 'Confirmación'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* ✅ Botones de acción en header */}
            <div className="flex items-center space-x-3">
              {mode !== 'grid' && (
                <button
                  onClick={resetToGrid}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  ← Volver al Grid
                </button>
              )}
              
              <Button
                variant="outline"
                onClick={refreshData}
                icon={RefreshCw}
                disabled={loading}
                className="shadow-lg bg-white"
              >
                {loading ? 'Actualizando...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        {/* ✅ Información de diferenciación */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800">Panel Híbrido de Check-in</h3>
              <p className="text-sm text-blue-700 mt-1">
                <strong>🚀 Modo Rápido:</strong> Check-in inmediato para huéspedes walk-in (sin reserva). 
                <strong>📋 Modo Completo:</strong> Proceso detallado con búsqueda de huéspedes, validaciones y múltiples opciones de pago.
              </p>
              <div className="mt-2 text-xs text-blue-600">
                Actual: <span className="font-semibold">{flowType === 'quick' ? '🚀 Modo Rápido' : '📋 Modo Completo'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ CONTENIDO PRINCIPAL */}
        <div className="bg-white rounded-lg shadow-lg p-6">

          {/* =============== MODO GRID: VISTA DE HABITACIONES =============== */}
          {mode === 'grid' && (
            <RoomGrid
              floorRooms={roomsByFloor}
              selectedFloor={selectedFloor}
              selectedRoom={selectedRoom}
              savedOrders={activeCheckins || {}}
              onFloorChange={handleFloorChange}
              onRoomClick={handleRoomClick}
              processingRoom={processingRoom}
              onCleanRoom={handleQuickClean}
            />
          )}

          {/* =============== MODO GUEST-SEARCH: BÚSQUEDA DE HUÉSPEDES =============== */}
          {mode === 'guest-search' && step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Buscar Huésped Existente
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Habitación {selectedRoom?.number} seleccionada)
                </span>
              </h2>
              
              {/* Búsqueda */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, teléfono o documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Resultados de búsqueda */}
              {searchTerm && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Resultados encontrados:</h3>
                  <div className="space-y-2">
                    {filteredGuests.map((guest) => (
                      <div
                        key={guest.id}
                        onClick={() => handleGuestSelect(guest)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {guest.first_name} {guest.last_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Tel: {guest.phone} | Doc: {guest.document_number}
                            </p>
                            {guest.email && (
                              <p className="text-sm text-gray-500">Email: {guest.email}</p>
                            )}
                          </div>
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                    {filteredGuests.length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        No se encontraron huéspedes con ese criterio
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Botón para nuevo huésped */}
              <div className="text-center">
                <button
                  onClick={handleNewGuest}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Registrar Nuevo Huésped
                </button>
              </div>
            </div>
          )}

          {/* =============== MODO FORM: FORMULARIOS =============== */}
          {mode === 'form' && (
            <>
              {/* FLUJO RÁPIDO: SnackSelection */}
              {flowType === 'quick' && orderStep === 1 && (
                <SnackSelection
                  currentOrder={currentOrder}
                  guestData={guestData}
                  selectedSnackType={selectedSnackType}
                  selectedSnacks={selectedSnacks}
                  snackTypes={snackTypes}
                  snackItems={snackItems}
                  onBack={resetToGrid}
                  onGuestDataChange={handleGuestDataChange}
                  onSnackTypeSelect={handleSnackTypeSelect}
                  onSnackSelect={handleSnackSelect}
                  onSnackRemove={handleSnackRemove}
                  onQuantityUpdate={handleQuantityUpdate}
                  onConfirmOrder={handleConfirmOrder}
                  onConfirmRoomOnly={handleConfirmRoomOnly}
                  onCancelOrder={resetToGrid}
                  loading={loading}
                  isCheckout={currentOrder?.isCheckout || false}
                />
              )}

              {/* FLUJO COMPLETO: Paso 2 - Selección de habitación y fechas */}
              {flowType === 'complete' && step === 2 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Seleccionar Habitación y Fechas
                    {selectedGuest && (
                      <span className="text-sm font-normal text-green-600 ml-2">
                        (Huésped: {selectedGuest.first_name} {selectedGuest.last_name})
                      </span>
                    )}
                  </h2>
                  
                  {/* Fechas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Entrada *
                      </label>
                      <input
                        {...register('check_in_date')}
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.check_in_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.check_in_date.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Salida *
                      </label>
                      <input
                        {...register('check_out_date')}
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.check_out_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.check_out_date.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Grid de habitaciones disponibles */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Habitaciones Disponibles</h3>
                    <RoomGrid
                      floorRooms={roomsByFloor}
                      selectedFloor={selectedFloor}
                      selectedRoom={selectedRoom}
                      savedOrders={{}}
                      onFloorChange={handleFloorChange}
                      onRoomClick={(room) => {
                        if (room.status === 'available' && room.cleaning_status === 'clean') {
                          setSelectedRoom(room)
                          setValue('room_id', room.id?.toString() || room.room_id?.toString())
                          setStep(3)
                        } else {
                          toast.warning(`Habitación ${room.number} no disponible`)
                        }
                      }}
                      processingRoom={null}
                      onCleanRoom={() => {}}
                      compact={true}
                    />
                  </div>

                  {/* Botones de navegación */}
                  <div className="flex justify-between">
                    <button
                      onClick={() => setMode('guest-search')}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ← Volver a Huéspedes
                    </button>
                    <button
                      onClick={() => selectedRoom && setStep(3)}
                      disabled={!selectedRoom}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Continuar →
                    </button>
                  </div>
                </div>
              )}

              {/* FLUJO COMPLETO: Paso 3 - Detalles del huésped y pago */}
              {flowType === 'complete' && step === 3 && (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-6">
                    {/* Información del huésped */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Información del Huésped</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre *
                          </label>
                          <input
                            {...register('guest_first_name')}
                            type="text"
                            className={classNames(
                              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                              errors.guest_first_name ? "border-red-300" : "border-gray-300"
                            )}
                          />
                          {errors.guest_first_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.guest_first_name.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Apellido *
                          </label>
                          <input
                            {...register('guest_last_name')}
                            type="text"
                            className={classNames(
                              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                              errors.guest_last_name ? "border-red-300" : "border-gray-300"
                            )}
                          />
                          {errors.guest_last_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.guest_last_name.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono *
                          </label>
                          <input
                            {...register('guest_phone')}
                            type="tel"
                            className={classNames(
                              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                              errors.guest_phone ? "border-red-300" : "border-gray-300"
                            )}
                          />
                          {errors.guest_phone && (
                            <p className="mt-1 text-sm text-red-600">{errors.guest_phone.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            {...register('guest_email')}
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {errors.guest_email && (
                            <p className="mt-1 text-sm text-red-600">{errors.guest_email.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Documento *
                          </label>
                          <select
                            {...register('guest_document_type')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {documentTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número de Documento *
                          </label>
                          <input
                            {...register('guest_document_number')}
                            type="text"
                            className={classNames(
                              "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                              errors.guest_document_number ? "border-red-300" : "border-gray-300"
                            )}
                          />
                          {errors.guest_document_number && (
                            <p className="mt-1 text-sm text-red-600">{errors.guest_document_number.message}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Resumen de la reserva */}
                    {selectedRoom && (
                      <div className="bg-blue-50 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Resumen de la Reserva</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-medium text-gray-900 mb-3">Detalles de la Habitación</h3>
                            <div className="space-y-2 text-sm">
                              <p><span className="font-medium">Habitación:</span> {selectedRoom.number}</p>
                              <p><span className="font-medium">Tipo:</span> {selectedRoom.description || 'Estándar'}</p>
                              <p><span className="font-medium">Piso:</span> {Math.floor(parseInt(selectedRoom.number) / 100)}</p>
                              <p><span className="font-medium">Precio por noche:</span> S/ {(total / Math.max(nights, 1)).toFixed(2)}</p>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-medium text-gray-900 mb-3">Cálculo de Costos</h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Entrada:</span>
                                <span>{watchCheckInDate && format(new Date(watchCheckInDate), 'dd/MM/yyyy')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Salida:</span>
                                <span>{watchCheckOutDate && format(new Date(watchCheckOutDate), 'dd/MM/yyyy')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Noches:</span>
                                <span>{nights}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                <span>Total:</span>
                                <span>S/ {total.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Método de pago */}
                        <div className="mt-6">
                          <h3 className="font-medium text-gray-900 mb-3">Método de Pago *</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {paymentMethods.map((method) => {
                              const Icon = method.icon
                              return (
                                <label
                                  key={method.id}
                                  className={classNames(
                                    "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                                    watch('payment_method') === method.id
                                      ? "border-blue-500 bg-blue-50"
                                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                  )}
                                >
                                  <input
                                    {...register('payment_method')}
                                    type="radio"
                                    value={method.id}
                                    className="sr-only"
                                  />
                                  <Icon className="h-5 w-5 text-gray-400 mr-2" />
                                  <span className="text-sm font-medium text-gray-900">{method.name}</span>
                                </label>
                              )
                            })}
                          </div>
                          {errors.payment_method && (
                            <p className="mt-1 text-sm text-red-600">{errors.payment_method.message}</p>
                          )}
                        </div>

                        {/* Monto del pago */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Monto a Pagar (S/)
                          </label>
                          <input
                            {...register('payment_amount')}
                            type="number"
                            step="0.01"
                            defaultValue={total}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {errors.payment_amount && (
                            <p className="mt-1 text-sm text-red-600">{errors.payment_amount.message}</p>
                          )}
                        </div>

                        {/* Selección de snacks */}
                        <div className="mt-6">
                          <h3 className="font-medium text-gray-900 mb-3">Servicios Adicionales (Opcional)</h3>
                          <p className="text-sm text-gray-600 mb-4">Agregue snacks o servicios que el huésped desee consumir</p>
                          
                          {/* Mini selector de snacks */}
                          <div className="border border-gray-200 rounded-lg p-4 bg-white">
                            {snackTypes && snackTypes.length > 0 && (
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                                <select
                                  value={selectedSnackType || ''}
                                  onChange={(e) => setSelectedSnackType(e.target.value || null)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">Seleccionar categoría...</option>
                                  {snackTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                      {type.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                            
                            {selectedSnackType && snackItems && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {snackItems
                                  .filter(item => item.snack_type_id?.toString() === selectedSnackType?.toString())
                                  .map((snack) => (
                                    <button
                                      key={snack.id}
                                      type="button"
                                      onClick={() => handleSnackSelect(snack)}
                                      className="p-2 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                                    >
                                      <div className="text-sm font-medium text-gray-900">{snack.name}</div>
                                      <div className="text-xs text-gray-600">S/ {snack.price}</div>
                                    </button>
                                  ))}
                              </div>
                            )}
                            
                            {/* Snacks seleccionados */}
                            {selectedSnacks.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Servicios Seleccionados:</h4>
                                <div className="space-y-2">
                                  {selectedSnacks.map((snack) => (
                                    <div key={snack.id} className="flex items-center justify-between text-sm">
                                      <span>{snack.name} x{snack.quantity}</span>
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium">S/ {(snack.price * snack.quantity).toFixed(2)}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleSnackRemove(snack.id)}
                                          className="text-red-600 hover:text-red-800"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="pt-2 border-t border-gray-200 flex justify-between font-medium">
                                    <span>Total Servicios:</span>
                                    <span>S/ {selectedSnacks.reduce((sum, s) => sum + (s.price * s.quantity), 0).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        ← Volver
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isProcessing ? (
                          <span className="flex items-center">
                            <Clock className="animate-spin h-4 w-4 mr-2" />
                            Procesando...
                          </span>
                        ) : (
                          'Procesar Check-in'
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* FLUJO COMPLETO: Paso 4 - Confirmación */}
              {flowType === 'complete' && step === 4 && (
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">¡Check-in Completado!</h2>
                  <p className="text-gray-600 mb-6">
                    El huésped ha sido registrado exitosamente
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                    <h3 className="font-medium text-gray-900 mb-2">Detalles del Check-in:</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Huésped:</span> {watch('guest_first_name')} {watch('guest_last_name')}</p>
                      <p><span className="font-medium">Habitación:</span> {selectedRoom?.number}</p>
                      <p><span className="font-medium">Entrada:</span> {watchCheckInDate && format(new Date(watchCheckInDate), 'dd/MM/yyyy')}</p>
                      <p><span className="font-medium">Salida:</span> {watchCheckOutDate && format(new Date(watchCheckOutDate), 'dd/MM/yyyy')}</p>
                      <p><span className="font-medium">Noches:</span> {nights}</p>
                      <p><span className="font-medium">Total:</span> S/ {(total + selectedSnacks.reduce((sum, s) => sum + (s.price * s.quantity), 0)).toFixed(2)}</p>
                      <p><span className="font-medium">Método de Pago:</span> {getPaymentMethodName(watch('payment_method'))}</p>
                      {selectedSnacks.length > 0 && (
                        <p><span className="font-medium">Servicios:</span> {selectedSnacks.map(s => `${s.name} x${s.quantity}`).join(', ')}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-x-4">
                    <button
                      onClick={() => window.print()}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Receipt className="h-4 w-4 mr-2 inline" />
                      Imprimir Comprobante
                    </button>
                    <button
                      onClick={handleNewCheckIn}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Nuevo Check-in
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ✅ MODAL DE CHECK-OUT RÁPIDO */}
        <QuickCheckoutModal
          isOpen={showQuickCheckout}
          onClose={handleCloseQuickCheckout}
          orderData={quickCheckoutData}
          onConfirm={handleQuickCheckoutConfirm}
          onViewDetails={() => {
            if (quickCheckoutData) {
              setCurrentOrder(quickCheckoutData)
              setMode('form')
              setOrderStep(1)
              setShowQuickCheckout(false)
              setQuickCheckoutData(null)
            }
          }}
        />

        {/* ✅ INFORMACIÓN DE ESTADO EN EL FOOTER */}
        {mode === 'grid' && (
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <div className="flex space-x-6">
                <span>📊 Total: {Object.values(roomsByFloor).flat().length} habitaciones</span>
                <span>🟢 Disponibles: {Object.values(roomsByFloor).flat().filter(r => r.status === 'available' && r.cleaning_status === 'clean').length}</span>
                <span>🔴 Ocupadas: {Object.values(roomsByFloor).flat().filter(r => r.status === 'occupied').length}</span>
                <span>🟡 Por limpiar: {needsCleaningCount}</span>
              </div>
              <div className="text-xs text-gray-400">
                Modo: {flowType === 'quick' ? '🚀 Rápido' : '📋 Completo'} • Actualización automática cada 30s
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
              <div className="flex justify-between items-center">
                <div>
                  💡 <strong>{flowType === 'quick' ? 'Modo Rápido:' : 'Modo Completo:'}</strong> 
                  {flowType === 'quick' 
                    ? ' Click directo en habitación para check-in inmediato de walk-ins'
                    : ' Proceso detallado con búsqueda de huéspedes y validaciones completas'
                  }
                </div>
                <div className="text-right">
                  {processingRoom && (
                    <span className="text-blue-600 font-medium">
                      Procesando habitación {processingRoom}...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ Estadísticas híbridas */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                <div className="bg-blue-50 rounded p-2 text-center">
                  <div className="font-bold text-blue-600">{Object.keys(activeCheckins || {}).length}</div>
                  <div className="text-blue-700">Check-ins Activos</div>
                </div>
                <div className="bg-green-50 rounded p-2 text-center">
                  <div className="font-bold text-green-600">
                    {Object.values(roomsByFloor).flat().filter(r => r.status === 'available' && r.cleaning_status === 'clean').length}
                  </div>
                  <div className="text-green-700">Disponibles</div>
                </div>
                <div className="bg-yellow-50 rounded p-2 text-center">
                  <div className="font-bold text-yellow-600">{needsCleaningCount}</div>
                  <div className="text-yellow-700">Necesitan Limpieza</div>
                </div>
                <div className="bg-purple-50 rounded p-2 text-center">
                  <div className="font-bold text-purple-600">
                    S/ {Object.values(activeCheckins || {})
                      .reduce((sum, checkin) => sum + (checkin.total_amount || 0), 0)
                      .toFixed(0)}
                  </div>
                  <div className="text-purple-700">Ingresos Pendientes</div>
                </div>
                <div className="bg-indigo-50 rounded p-2 text-center">
                  <div className="font-bold text-indigo-600">
                    {flowType === 'quick' ? '🚀' : '📋'}
                  </div>
                  <div className="text-indigo-700">
                    {flowType === 'quick' ? 'Modo Rápido' : 'Modo Completo'}
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ Acciones rápidas */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Acciones disponibles:</span> 
                  {flowType === 'quick' 
                    ? ' Click en habitación disponible para check-in inmediato'
                    : ' Click en habitación disponible para proceso completo'
                  }
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFlowType(flowType === 'quick' ? 'complete' : 'quick')}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  >
                    Cambiar a {flowType === 'quick' ? 'Completo' : 'Rápido'}
                  </button>
                  <button
                    onClick={refreshData}
                    disabled={loading}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                  >
                    {loading ? '...' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Información contextual para otros modos */}
        {mode !== 'grid' && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600">
              {mode === 'guest-search' && (
                <>
                  🔍 <strong>Búsqueda de Huésped</strong> - Habitación {selectedRoom?.number} seleccionada
                </>
              )}
              {mode === 'form' && flowType === 'quick' && (
                <>
                  🚀 <strong>Check-in Rápido</strong> - {currentOrder?.isCheckout ? 'Agregando servicios para check-out' : 'Registro inmediato de walk-in'}
                </>
              )}
              {mode === 'form' && flowType === 'complete' && (
                <>
                  📋 <strong>Check-in Completo</strong> - Paso {step} de 4 | {selectedRoom ? `Habitación ${selectedRoom.number}` : 'Seleccionando habitación'}
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* ✅ Debug component temporal */}
      <AuthDebug />
    </div>
  )
}

export default CheckIn