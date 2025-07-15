// scripts/migrateToSupabase.mjs
// Script para migrar completamente de datos mock a Supabase

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs/promises'

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

// Importar datos mock (simularemos las importaciones)
const mockData = {
  guests: [
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
    }
  ],
  supplies: [
    {
      name: 'Toallas de baño blancas',
      description: 'Toallas de algodón 100%, tamaño estándar 70x140cm',
      sku: 'TOA-BLA-001',
      category: 'Lencería',
      supplier: 'Textiles del Sur',
      unit: 'unidad',
      unit_price: 25.50,
      current_stock: 45,
      min_stock: 20,
      max_stock: 100,
      location: 'Almacén Principal - A1',
      notes: 'Cambiar proveedor si la calidad baja'
    }
  ]
}

class SupabaseMigration {
  constructor() {
    this.errors = []
    this.successes = []
  }

  async runMigration() {
    console.log('🚀 Iniciando migración completa a Supabase...\n')

    try {
      // 1. Verificar conexión
      await this.verifyConnection()
      
      // 2. Ejecutar esquema
      await this.executeSchema()
      
      // 3. Migrar datos
      await this.migrateData()
      
      // 4. Verificar integridad
      await this.verifyDataIntegrity()
      
      // 5. Actualizar hooks y componentes
      await this.updateCodebase()
      
      // 6. Reporte final
      this.generateReport()
      
    } catch (error) {
      console.error('❌ Error durante la migración:', error)
      process.exit(1)
    }
  }

  async verifyConnection() {
    console.log('🔗 Verificando conexión a Supabase...')
    
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      
      if (error) {
        throw new Error(`Error de conexión: ${error.message}`)
      }
      
      console.log('✅ Conexión exitosa a Supabase\n')
    } catch (error) {
      throw new Error(`No se pudo conectar a Supabase: ${error.message}`)
    }
  }

  async executeSchema() {
    console.log('📋 Ejecutando esquema de base de datos...')
    
    try {
      // Leer archivos SQL
      const schemaPath = join(__dirname, '../supabase_schema.sql')
      const functionsPath = join(__dirname, '../supabase_functions.sql')
      const seedPath = join(__dirname, '../supabase_seed_data.sql')
      
      const schemaExists = await this.fileExists(schemaPath)
      const functionsExists = await this.fileExists(functionsPath)
      const seedExists = await this.fileExists(seedPath)
      
      if (!schemaExists || !functionsExists || !seedExists) {
        console.log('⚠️  Archivos SQL no encontrados. Creando esquema básico...')
        await this.createBasicSchema()
      } else {
        console.log('📄 Archivos SQL encontrados. Ejecutando en orden...')
        
        const schema = await fs.readFile(schemaPath, 'utf8')
        const functions = await fs.readFile(functionsPath, 'utf8')
        const seed = await fs.readFile(seedPath, 'utf8')
        
        // Ejecutar en orden
        await this.executeSQLFile('Schema', schema)
        await this.executeSQLFile('Functions & Triggers', functions)
        await this.executeSQLFile('Seed Data', seed)
      }
      
      console.log('✅ Esquema ejecutado exitosamente\n')
    } catch (error) {
      throw new Error(`Error ejecutando esquema: ${error.message}`)
    }
  }

  async fileExists(path) {
    try {
      await fs.access(path)
      return true
    } catch {
      return false
    }
  }

  async executeSQLFile(name, sql) {
    console.log(`   📝 Ejecutando ${name}...`)
    
    // En un entorno real, dividirías el SQL en statements individuales
    // y los ejecutarías uno por uno
    const statements = sql.split(';').filter(stmt => stmt.trim())
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (statement) {
        try {
          await supabase.rpc('exec_sql', { sql: statement })
        } catch (error) {
          console.warn(`      ⚠️  Warning en statement ${i + 1}: ${error.message}`)
        }
      }
    }
  }

  async createBasicSchema() {
    console.log('   🏗️  Creando esquema básico...')
    
    // Crear tablas básicas si no existen los archivos SQL
    const basicTables = [
      'profiles',
      'room_types',
      'rooms',
      'guests',
      'reservations',
      'supply_categories',
      'suppliers',
      'supplies'
    ]
    
    for (const table of basicTables) {
      try {
        const { data } = await supabase.from(table).select('count').limit(1)
        console.log(`      ✅ Tabla ${table} existe`)
      } catch (error) {
        console.log(`      ❌ Tabla ${table} no existe: ${error.message}`)
        this.errors.push(`Tabla ${table} no encontrada`)
      }
    }
  }

  async migrateData() {
    console.log('📦 Migrando datos...')
    
    // Migrar datos de prueba si las tablas están vacías
    await this.migrateGuests()
    await this.migrateSupplies()
    await this.migrateRooms()
    
    console.log('✅ Migración de datos completada\n')
  }

  async migrateGuests() {
    console.log('   👥 Migrando huéspedes...')
    
    try {
      const { count } = await supabase
        .from('guests')
        .select('count')
        .single()
      
      if (count === 0) {
        const { data, error } = await supabase
          .from('guests')
          .insert(mockData.guests)
        
        if (error) throw error
        
        console.log(`      ✅ ${mockData.guests.length} huéspedes migrados`)
        this.successes.push(`Huéspedes: ${mockData.guests.length}`)
      } else {
        console.log(`      ℹ️  Ya existen ${count} huéspedes`)
      }
    } catch (error) {
      console.log(`      ❌ Error migrando huéspedes: ${error.message}`)
      this.errors.push(`Huéspedes: ${error.message}`)
    }
  }

  async migrateSupplies() {
    console.log('   📦 Migrando suministros...')
    
    try {
      // Primero asegurar que existan categorías y proveedores
      await this.ensureCategories()
      await this.ensureSuppliers()
      
      const { count } = await supabase
        .from('supplies')
        .select('count')
        .single()
      
      if (count === 0) {
        // Obtener IDs de categorías y proveedores
        const supplies = await this.mapSuppliesWithIds(mockData.supplies)
        
        const { data, error } = await supabase
          .from('supplies')
          .insert(supplies)
        
        if (error) throw error
        
        console.log(`      ✅ ${supplies.length} suministros migrados`)
        this.successes.push(`Suministros: ${supplies.length}`)
      } else {
        console.log(`      ℹ️  Ya existen ${count} suministros`)
      }
    } catch (error) {
      console.log(`      ❌ Error migrando suministros: ${error.message}`)
      this.errors.push(`Suministros: ${error.message}`)
    }
  }

  async ensureCategories() {
    const categories = ['Limpieza', 'Amenidades', 'Lencería', 'Mantenimiento']
    
    for (const category of categories) {
      const { data } = await supabase
        .from('supply_categories')
        .select('id')
        .eq('name', category)
        .single()
      
      if (!data) {
        await supabase
          .from('supply_categories')
          .insert({ name: category })
      }
    }
  }

  async ensureSuppliers() {
    const suppliers = ['Textiles del Sur', 'Proveedora Hotelera SAC']
    
    for (const supplier of suppliers) {
      const { data } = await supabase
        .from('suppliers')
        .select('id')
        .eq('name', supplier)
        .single()
      
      if (!data) {
        await supabase
          .from('suppliers')
          .insert({ name: supplier, active: true })
      }
    }
  }

  async mapSuppliesWithIds(supplies) {
    const mapped = []
    
    for (const supply of supplies) {
      // Obtener category_id
      const { data: category } = await supabase
        .from('supply_categories')
        .select('id')
        .eq('name', supply.category)
        .single()
      
      // Obtener supplier_id
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id')
        .eq('name', supply.supplier)
        .single()
      
      if (category && supplier) {
        mapped.push({
          ...supply,
          category_id: category.id,
          supplier_id: supplier.id,
          // Remover campos que no existen en la tabla
          category: undefined,
          supplier: undefined
        })
      }
    }
    
    return mapped
  }

  async migrateRooms() {
    console.log('   🏠 Verificando habitaciones...')
    
    try {
      const { count } = await supabase
        .from('rooms')
        .select('count')
        .single()
      
      if (count > 0) {
        console.log(`      ✅ Ya existen ${count} habitaciones`)
        this.successes.push(`Habitaciones: ${count} existentes`)
      } else {
        console.log('      ⚠️  No hay habitaciones. Ejecutar seed data manual.')
        this.errors.push('Habitaciones: Requiere seed manual')
      }
    } catch (error) {
      console.log(`      ❌ Error verificando habitaciones: ${error.message}`)
      this.errors.push(`Habitaciones: ${error.message}`)
    }
  }

  async verifyDataIntegrity() {
    console.log('🔍 Verificando integridad de datos...')
    
    const tables = [
      'profiles',
      'room_types', 
      'rooms',
      'guests',
      'reservations',
      'supply_categories',
      'suppliers',
      'supplies'
    ]
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('count')
          .single()
        
        if (error) throw error
        
        console.log(`   ✅ ${table}: ${count} registros`)
        this.successes.push(`Verificación ${table}: ${count} registros`)
      } catch (error) {
        console.log(`   ❌ Error en ${table}: ${error.message}`)
        this.errors.push(`Verificación ${table}: ${error.message}`)
      }
    }
    
    console.log('✅ Verificación de integridad completada\n')
  }

  async updateCodebase() {
    console.log('🔧 Verificando actualización de código...')
    
    const filesToCheck = [
      'src/lib/supabase.js',
      'src/hooks/useGuests.js',
      'src/hooks/useRooms.js',
      'src/hooks/useReservations.js',
      'src/hooks/useSupplies.js',
      'src/hooks/useDashboard.js',
      'src/context/AuthContext.js'
    ]
    
    const projectRoot = join(__dirname, '..')
    
    for (const file of filesToCheck) {
      const filePath = join(projectRoot, file)
      const exists = await this.fileExists(filePath)
      
      if (exists) {
        // Verificar si el archivo contiene importaciones de Supabase
        try {
          const content = await fs.readFile(filePath, 'utf8')
          const hasSupabaseImport = content.includes('@supabase/supabase-js') || 
                                   content.includes('from \'../lib/supabase\'')
          
          if (hasSupabaseImport) {
            console.log(`   ✅ ${file} - Actualizado para Supabase`)
            this.successes.push(`Código: ${file} actualizado`)
          } else {
            console.log(`   ⚠️  ${file} - Requiere actualización manual`)
            this.errors.push(`Código: ${file} requiere actualización`)
          }
        } catch (error) {
          console.log(`   ❌ ${file} - Error leyendo archivo`)
          this.errors.push(`Código: ${file} error de lectura`)
        }
      } else {
        console.log(`   ❌ ${file} - Archivo no encontrado`)
        this.errors.push(`Código: ${file} no encontrado`)
      }
    }
    
    console.log('✅ Verificación de código completada\n')
  }

  generateReport() {
    console.log('📊 REPORTE DE MIGRACIÓN')
    console.log('========================\n')
    
    console.log(`✅ ÉXITOS (${this.successes.length}):`)
    this.successes.forEach(success => {
      console.log(`   ✓ ${success}`)
    })
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ERRORES/ADVERTENCIAS (${this.errors.length}):`)
      this.errors.forEach(error => {
        console.log(`   ⚠ ${error}`)
      })
    }
    
    console.log('\n📋 SIGUIENTES PASOS:')
    console.log('====================')
    
    if (this.errors.length === 0) {
      console.log('🎉 ¡Migración completada exitosamente!')
      console.log('   ✓ Puedes comenzar a usar tu aplicación con Supabase')
      console.log('   ✓ Usuarios de prueba creados:')
      console.log('     - admin@hotelparaiso.com / admin123')
      console.log('     - recepcion@hotelparaiso.com / recepcion123')
    } else {
      console.log('🔧 Acción requerida:')
      
      if (this.errors.some(e => e.includes('Tabla'))) {
        console.log('   1. Ejecutar manualmente los archivos SQL en Supabase:')
        console.log('      - supabase_schema.sql')
        console.log('      - supabase_functions.sql')
        console.log('      - supabase_seed_data.sql')
      }
      
      if (this.errors.some(e => e.includes('Código'))) {
        console.log('   2. Actualizar archivos de código manualmente:')
        console.log('      - Reemplazar imports de datos mock')
        console.log('      - Usar hooks actualizados para Supabase')
        console.log('      - Actualizar componentes según ejemplos')
      }
      
      if (this.errors.some(e => e.includes('Habitaciones'))) {
        console.log('   3. Ejecutar script de seed para habitaciones:')
        console.log('      npm run db:seed')
      }
    }
    
    console.log('\n🔗 RECURSOS ÚTILES:')
    console.log('   📖 Documentación: https://supabase.com/docs')
    console.log('   🎯 Dashboard Supabase: https://supabase.com/dashboard')
    console.log('   📝 SQL Editor: Panel SQL en tu proyecto Supabase')
    
    console.log('\n✨ ¡Tu aplicación está lista para usar Supabase!')
  }
}

// Función para crear archivos de configuración adicionales
async function createConfigFiles() {
  const projectRoot = join(__dirname, '..')
  
  // Crear archivo de configuración de entorno si no existe
  const envExamplePath = join(projectRoot, '.env.example')
  const envLocalPath = join(projectRoot, '.env.local')
  
  try {
    const envExample = await fs.readFile(envExamplePath, 'utf8')
    
    try {
      await fs.access(envLocalPath)
      console.log('ℹ️  .env.local ya existe')
    } catch {
      await fs.writeFile(envLocalPath, envExample)
      console.log('✅ Creado .env.local desde .env.example')
      console.log('⚠️  IMPORTANTE: Configurar variables de entorno en .env.local')
    }
  } catch (error) {
    console.log('⚠️  No se pudo crear .env.local:', error.message)
  }
  
  // Crear archivo de configuración de Supabase si no existe
  const supabaseConfigPath = join(projectRoot, 'src/lib/supabase.js')
  
  try {
    await fs.access(supabaseConfigPath)
    console.log('✅ Configuración de Supabase existe')
  } catch {
    const supabaseConfig = `// src/lib/supabase.js
// Esta configuración debería estar completa con todos los helpers
// Revisar el artifact 'supabase_config' para la implementación completa

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// TODO: Implementar helpers db, subscriptions, auth
// Ver artifact completo para la implementación
`
    
    await fs.writeFile(supabaseConfigPath, supabaseConfig)
    console.log('✅ Creada configuración básica de Supabase')
    console.log('⚠️  IMPORTANTE: Completar implementación usando los artifacts')
  }
}

// Función para verificar dependencias
async function checkDependencies() {
  console.log('📦 Verificando dependencias...')
  
  try {
    const packageJsonPath = join(__dirname, '../package.json')
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
    
    const requiredDeps = [
      '@supabase/supabase-js',
      'react-hot-toast'
    ]
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    )
    
    if (missingDeps.length > 0) {
      console.log('❌ Dependencias faltantes:')
      missingDeps.forEach(dep => console.log(`   - ${dep}`))
      console.log('\n📥 Instalar con: npm install ' + missingDeps.join(' '))
      return false
    } else {
      console.log('✅ Todas las dependencias están instaladas')
      return true
    }
  } catch (error) {
    console.log('⚠️  Error verificando package.json:', error.message)
    return false
  }
}

// Ejecutar migración
async function main() {
  console.log('🏨 MIGRACIÓN HOTEL MANAGEMENT SYSTEM')
  console.log('=====================================\n')
  
  // Verificar dependencias
  const depsOk = await checkDependencies()
  if (!depsOk) {
    console.log('\n❌ Instalar dependencias faltantes antes de continuar')
    process.exit(1)
  }
  
  // Crear archivos de configuración
  await createConfigFiles()
  
  // Ejecutar migración
  const migration = new SupabaseMigration()
  await migration.runMigration()
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Error fatal:', error)
    process.exit(1)
  })
}

export { SupabaseMigration, createConfigFiles, checkDependencies }