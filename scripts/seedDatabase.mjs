// scripts/seedDatabase.mjs
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.error('Required: REACT_APP_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedDatabase() {
  console.log('🌱 Starting database seeding...')

  try {
    // 1. Create admin user
    console.log('👤 Creating admin user...')
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@hotelparaiso.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Administrador del Sistema',
        role: 'admin'
      }
    })

    if (adminError && !adminError.message.includes('already registered')) {
      throw adminError
    }

    // 2. Create reception user
    console.log('👤 Creating reception user...')
    const { data: receptionUser, error: receptionError } = await supabase.auth.admin.createUser({
      email: 'recepcion@hotelparaiso.com',
      password: 'recepcion123',
      email_confirm: true,
      user_metadata: {
        name: 'Personal de Recepción',
        role: 'reception'
      }
    })

    if (receptionError && !receptionError.message.includes('already registered')) {
      throw receptionError
    }

    // 3. Create profiles
    console.log('📝 Creating user profiles...')
    if (adminUser?.user) {
      await supabase.from('profiles').upsert({
        id: adminUser.user.id,
        name: 'Administrador del Sistema',
        email: 'admin@hotelparaiso.com',
        role: 'admin'
      })
    }

    if (receptionUser?.user) {
      await supabase.from('profiles').upsert({
        id: receptionUser.user.id,
        name: 'Personal de Recepción',
        email: 'recepcion@hotelparaiso.com',
        role: 'reception'
      })
    }

    // 4. Seed room types
    console.log('🏨 Seeding room types...')
    const roomTypes = [
      {
        name: 'Habitación Estándar',
        description: 'Habitación cómoda y funcional con todas las comodidades básicas.',
        base_rate: 150.00,
        capacity: 2,
        size: 25,
        bed_options: ['Doble', 'Individual x2'],
        features: ['WiFi Gratis', 'TV Smart', 'Aire Acondicionado', 'Minibar'],
        total_rooms: 20,
        color: '#3B82F6'
      },
      {
        name: 'Habitación Deluxe',
        description: 'Habitación espaciosa con balcón y amenidades premium.',
        base_rate: 220.00,
        capacity: 3,
        size: 35,
        bed_options: ['King + Sofá', 'Queen + Individual'],
        features: ['WiFi Gratis', 'TV Smart', 'Aire Acondicionado', 'Minibar', 'Balcón', 'Caja Fuerte'],
        total_rooms: 15,
        color: '#10B981'
      },
      {
        name: 'Suite Ejecutiva',
        description: 'Suite de lujo con sala de estar separada y amenidades exclusivas.',
        base_rate: 350.00,
        capacity: 4,
        size: 60,
        bed_options: ['King + Sofá Cama'],
        features: ['WiFi Gratis', 'TV Smart', 'Aire Acondicionado', 'Minibar', 'Jacuzzi', 'Vista al Mar', 'Zona de Trabajo'],
        total_rooms: 8,
        color: '#8B5CF6'
      },
      {
        name: 'Junior Suite',
        description: 'Suite compacta con kitchenette y área de estar.',
        base_rate: 280.00,
        capacity: 3,
        size: 45,
        bed_options: ['Queen + Sofá Cama'],
        features: ['WiFi Gratis', 'TV Smart', 'Aire Acondicionado', 'Minibar', 'Balcón', 'Cocina'],
        total_rooms: 6,
        color: '#F59E0B'
      }
    ]

    const { data: insertedRoomTypes } = await supabase
      .from('room_types')
      .upsert(roomTypes, { onConflict: 'name' })
      .select()

    // 5. Seed rooms
    console.log('🚪 Seeding rooms...')
    const rooms = []
    const roomTypeMap = insertedRoomTypes.reduce((acc, rt) => {
      acc[rt.name] = rt.id
      return acc
    }, {})

    // Generate rooms based on room types
    let roomNumber = 101
    for (const roomType of roomTypes) {
      for (let i = 0; i < roomType.total_rooms; i++) {
        const floor = Math.floor(roomNumber / 100)
        rooms.push({
          number: roomNumber.toString(),
          floor: floor,
          room_type_id: roomTypeMap[roomType.name],
          status: Math.random() < 0.3 ? 'occupied' : 'available',
          cleaning_status: Math.random() < 0.7 ? 'clean' : 'dirty',
          beds: roomType.bed_options.map(bed => ({ type: bed, count: 1 })),
          size: roomType.size,
          features: roomType.features,
          last_cleaned: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
          cleaned_by: ['María García', 'Ana López', 'Pedro Martín'][Math.floor(Math.random() * 3)],
          description: `Habitación ${roomType.name}`
        })
        roomNumber++
        if (roomNumber % 100 === 21) roomNumber += 79 // Skip to next floor
      }
    }

    await supabase.from('rooms').upsert(rooms, { onConflict: 'number' })

    // 6. Seed supply categories
    console.log('📦 Seeding supply categories...')
    const categories = [
      { name: 'Limpieza', description: 'Productos y materiales de limpieza', color: '#EF4444' },
      { name: 'Amenidades', description: 'Productos para huéspedes', color: '#3B82F6' },
      { name: 'Lencería', description: 'Ropa de cama y toallas', color: '#10B981' },
      { name: 'Mantenimiento', description: 'Herramientas y materiales de mantenimiento', color: '#F59E0B' },
      { name: 'Oficina', description: 'Materiales de oficina y administración', color: '#8B5CF6' },
      { name: 'Cocina', description: 'Utensilios y productos de cocina', color: '#EC4899' },
      { name: 'Seguridad', description: 'Equipos de seguridad', color: '#6B7280' },
      { name: 'Jardinería', description: 'Materiales para jardinería', color: '#22C55E' }
    ]

    const { data: insertedCategories } = await supabase
      .from('supply_categories')
      .upsert(categories, { onConflict: 'name' })
      .select()

    // 7. Seed suppliers
    console.log('🏪 Seeding suppliers...')
    const suppliers = [
      {
        name: 'Proveedora Hotelera SAC',
        contact_person: 'Juan Pérez',
        email: 'ventas@provehotel.com',
        phone: '+51 1 234-5678',
        address: 'Av. Industrial 123, Lima'
      },
      {
        name: 'Distribuidora Lima Norte',
        contact_person: 'María González',
        email: 'contacto@dislimanorte.com',
        phone: '+51 1 987-6543',
        address: 'Calle Comercio 456, Los Olivos'
      },
      {
        name: 'Textiles del Sur',
        contact_person: 'Carmen López',
        email: 'textiles@texsur.com',
        phone: '+51 1 333-4444',
        address: 'Av. Textil 555, San Juan de Miraflores'
      },
      {
        name: 'Química Nacional',
        contact_person: 'Roberto Silva',
        email: 'quimica@quinacional.com',
        phone: '+51 1 666-7777',
        address: 'Parque Industrial 222, Lurín'
      }
    ]

    const { data: insertedSuppliers } = await supabase
      .from('suppliers')
      .upsert(suppliers, { onConflict: 'name' })
      .select()

    // 8. Seed supplies
    console.log('📋 Seeding supplies...')
    const categoryMap = insertedCategories.reduce((acc, cat) => {
      acc[cat.name] = cat.id
      return acc
    }, {})

    const supplierMap = insertedSuppliers.reduce((acc, sup) => {
      acc[sup.name] = sup.id
      return acc
    }, {})

    const supplies = [
      {
        name: 'Toallas de baño blancas',
        description: 'Toallas de algodón 100%, tamaño estándar 70x140cm',
        sku: 'TOA-BLA-001',
        category_id: categoryMap['Lencería'],
        supplier_id: supplierMap['Textiles del Sur'],
        unit: 'unidad',
        unit_price: 25.50,
        current_stock: 45,
        min_stock: 20,
        max_stock: 100,
        location: 'Almacén Principal - A1',
        notes: 'Cambiar proveedor si la calidad baja'
      },
      {
        name: 'Shampoo premium 30ml',
        description: 'Shampoo en botella individual para huéspedes',
        sku: 'SHA-PRE-030',
        category_id: categoryMap['Amenidades'],
        supplier_id: supplierMap['Proveedora Hotelera SAC'],
        unit: 'unidad',
        unit_price: 1.80,
        current_stock: 320,
        min_stock: 100,
        max_stock: 500,
        location: 'Almacén Principal - B2',
        notes: 'Revisar fecha de vencimiento'
      },
      {
        name: 'Detergente multiusos 5L',
        description: 'Detergente concentrado para limpieza general',
        sku: 'DET-MUL-005',
        category_id: categoryMap['Limpieza'],
        supplier_id: supplierMap['Química Nacional'],
        unit: 'litros',
        unit_price: 45.00,
        current_stock: 8,
        min_stock: 10,
        max_stock: 50,
        location: 'Almacén Químicos - C1',
        notes: 'Stock bajo - reabastecer urgente'
      },
      {
        name: 'Sábanas queen blancas',
        description: 'Juego de sábanas algodón percal 200 hilos',
        sku: 'SAB-QUE-200',
        category_id: categoryMap['Lencería'],
        supplier_id: supplierMap['Textiles del Sur'],
        unit: 'juego',
        unit_price: 89.90,
        current_stock: 0,
        min_stock: 12,
        max_stock: 36,
        location: 'Almacén Principal - A2',
        notes: 'AGOTADO - Reorden inmediato'
      }
    ]

    await supabase.from('supplies').upsert(supplies, { onConflict: 'sku' })

    // 9. Seed guests
    console.log('👥 Seeding guests...')
    const guests = [
      {
        first_name: 'Carlos Eduardo',
        last_name: 'Mendoza',
        email: 'carlos.mendoza@email.com',
        phone: '+51 987-654-321',
        document_type: 'DNI',
        document_number: '12345678',
        birth_date: '1985-03-15',
        gender: 'male',
        nationality: 'Peruana',
        country: 'Perú',
        city: 'Lima',
        address: 'Av. Javier Prado 1234, San Isidro',
        zip_code: '15036',
        vip_level: 'gold',
        total_visits: 8,
        total_spent: 4500.00,
        rating: 5,
        last_visit: '2025-06-20T10:00:00Z',
        preferences: ['Habitación silenciosa', 'Cama king', 'Vista al mar'],
        special_requests: 'Alérgico al gluten',
        emergency_contact: {
          name: 'María Mendoza',
          phone: '+51 987-654-322',
          relationship: 'Esposa'
        }
      },
      {
        first_name: 'Ana Sofía',
        last_name: 'García',
        email: 'ana.garcia@email.com',
        phone: '+51 976-543-210',
        document_type: 'DNI',
        document_number: '87654321',
        birth_date: '1990-07-22',
        gender: 'female',
        nationality: 'Peruana',
        country: 'Perú',
        city: 'Arequipa',
        address: 'Calle Santa Catalina 567',
        zip_code: '04001',
        vip_level: 'silver',
        total_visits: 3,
        total_spent: 1800.00,
        rating: 4,
        last_visit: '2025-05-10T14:30:00Z',
        preferences: ['Almohadas extra', 'Servicio a la habitación'],
        emergency_contact: {
          name: 'Luis García',
          phone: '+51 976-543-211',
          relationship: 'Hermano'
        }
      },
      {
        first_name: 'Michael',
        last_name: 'Johnson',
        email: 'michael.johnson@email.com',
        phone: '+1 555-123-4567',
        document_type: 'Pasaporte',
        document_number: 'US123456789',
        birth_date: '1978-11-08',
        gender: 'male',
        nationality: 'Estadounidense',
        country: 'Estados Unidos',
        city: 'New York',
        address: '123 Fifth Avenue, Manhattan',
        zip_code: '10001',
        vip_level: 'platinum',
        total_visits: 12,
        total_spent: 8900.00,
        rating: 5,
        last_visit: '2025-06-22T16:00:00Z',
        preferences: ['Suite ejecutiva', 'Gimnasio 24h', 'Desayuno continental'],
        special_requests: 'Vegetariano estricto',
        emergency_contact: {
          name: 'Sarah Johnson',
          phone: '+1 555-123-4568',
          relationship: 'Esposa'
        }
      }
    ]

    await supabase.from('guests').upsert(guests, { onConflict: 'email' })

    console.log('✅ Database seeding completed successfully!')
    console.log('\n📧 Test Users Created:')
    console.log('Admin: admin@hotelparaiso.com / admin123')
    console.log('Reception: recepcion@hotelparaiso.com / recepcion123')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Execute seeding
seedDatabase()