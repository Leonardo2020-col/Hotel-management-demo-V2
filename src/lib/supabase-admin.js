// src/lib/supabase-admin.js - SERVICIOS PARA FUNCIONES DE ADMINISTRADOR
import { supabase } from './supabase'

// =====================================================
// 👥 SERVICIOS DE GESTIÓN DE USUARIOS
// =====================================================
export const adminService = {
  
  // ✅ Obtener todos los usuarios con información completa
  async getAllUsers() {
    try {
      console.log('👥 Fetching all users for admin...')
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          is_active,
          last_login,
          created_at,
          updated_at,
          role:role_id(
            id,
            name,
            description,
            permissions
          ),
          user_branches(
            branch_id,
            is_primary,
            branch:branch_id(
              id,
              name,
              address,
              is_active
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching users:', error)
        throw error
      }

      // Enriquecer datos para mejor visualización
      const enrichedUsers = (data || []).map(user => ({
        ...user,
        full_name: `${user.first_name} ${user.last_name}`,
        role_name: user.role?.name === 'administrador' ? 'Administrador' : 'Recepción',
        primary_branch: user.user_branches?.find(ub => ub.is_primary)?.branch,
        total_branches: user.user_branches?.length || 0,
        can_edit: true // TODO: Implementar lógica de permisos
      }))

      console.log('✅ Users fetched successfully:', enrichedUsers.length)
      return { data: enrichedUsers, error: null }
    } catch (error) {
      console.error('❌ Error in getAllUsers:', error)
      return { data: [], error }
    }
  },

  // ✅ Crear nuevo usuario
  async createUser(userData) {
    try {
      console.log('➕ Creating new user:', userData.email)
      
      // Validaciones básicas
      if (!userData.email?.trim()) {
        throw new Error('El email es requerido')
      }
      
      if (!userData.first_name?.trim()) {
        throw new Error('El nombre es requerido')
      }
      
      if (!userData.role_id) {
        throw new Error('El rol es requerido')
      }

      if (!userData.branch_ids?.length) {
        throw new Error('Debe seleccionar al menos una sucursal')
      }

      // Verificar si el email ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', userData.email.trim())
        .single()

      if (existingUser) {
        throw new Error('Ya existe un usuario con este email')
      }

      // 1. Crear usuario en la tabla users
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: userData.email.trim().toLowerCase(),
          first_name: userData.first_name.trim(),
          last_name: userData.last_name.trim(),
          phone: userData.phone?.trim() || null,
          role_id: userData.role_id,
          is_active: true
        })
        .select(`
          id,
          email,
          first_name,
          last_name,
          role:role_id(name)
        `)
        .single()

      if (userError) {
        console.error('❌ Error creating user:', userError)
        throw userError
      }

      // 2. Crear relaciones con sucursales
      const branchRelations = userData.branch_ids.map(branchId => ({
        user_id: newUser.id,
        branch_id: branchId,
        is_primary: branchId === userData.primary_branch_id
      }))

      const { error: branchError } = await supabase
        .from('user_branches')
        .insert(branchRelations)

      if (branchError) {
        console.error('❌ Error creating branch relations:', branchError)
        
        // Limpiar usuario creado si falla la relación
        await supabase.from('users').delete().eq('id', newUser.id)
        throw branchError
      }

      // 3. TODO: Crear usuario en Supabase Auth (opcional)
      // Esto normalmente se haría a través de la función de invitación
      // o el usuario se registraría por su cuenta

      console.log('✅ User created successfully:', newUser.email)
      return { data: newUser, error: null }
      
    } catch (error) {
      console.error('❌ Error in createUser:', error)
      return { data: null, error }
    }
  },

  // ✅ Actualizar usuario existente
  async updateUser(userId, updateData) {
    try {
      console.log('🔄 Updating user:', userId, updateData)
      
      // Validar que el usuario existe
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('id', userId)
        .single()

      if (checkError || !existingUser) {
        throw new Error('Usuario no encontrado')
      }

      // Si se está actualizando el email, verificar que no exista
      if (updateData.email && updateData.email !== existingUser.email) {
        const { data: emailCheck } = await supabase
          .from('users')
          .select('id')
          .eq('email', updateData.email.trim().toLowerCase())
          .neq('id', userId)
          .single()

        if (emailCheck) {
          throw new Error('Ya existe otro usuario con este email')
        }
      }

      // Preparar datos de actualización
      const updateFields = {}
      
      if (updateData.email) {
        updateFields.email = updateData.email.trim().toLowerCase()
      }
      
      if (updateData.first_name) {
        updateFields.first_name = updateData.first_name.trim()
      }
      
      if (updateData.last_name) {
        updateFields.last_name = updateData.last_name.trim()
      }
      
      if (updateData.phone !== undefined) {
        updateFields.phone = updateData.phone?.trim() || null
      }
      
      if (updateData.role_id) {
        updateFields.role_id = updateData.role_id
      }
      
      if (updateData.is_active !== undefined) {
        updateFields.is_active = updateData.is_active
      }

      updateFields.updated_at = new Date().toISOString()

      // Actualizar usuario
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', userId)
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          is_active,
          role:role_id(name)
        `)
        .single()

      if (updateError) {
        console.error('❌ Error updating user:', updateError)
        throw updateError
      }

      // Actualizar relaciones con sucursales si se especifican
      if (updateData.branch_ids) {
        // Eliminar relaciones existentes
        await supabase
          .from('user_branches')
          .delete()
          .eq('user_id', userId)

        // Crear nuevas relaciones
        const branchRelations = updateData.branch_ids.map(branchId => ({
          user_id: userId,
          branch_id: branchId,
          is_primary: branchId === updateData.primary_branch_id
        }))

        const { error: branchError } = await supabase
          .from('user_branches')
          .insert(branchRelations)

        if (branchError) {
          console.warn('⚠️ Warning updating branch relations:', branchError)
        }
      }

      console.log('✅ User updated successfully:', updatedUser.email)
      return { data: updatedUser, error: null }
      
    } catch (error) {
      console.error('❌ Error in updateUser:', error)
      return { data: null, error }
    }
  },

  // ✅ Eliminar usuario (soft delete)
  async deleteUser(userId) {
    try {
      console.log('🗑️ Soft deleting user:', userId)
      
      // Verificar que el usuario existe y no es el último administrador
      const { data: userToDelete, error: checkError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role:role_id(name)
        `)
        .eq('id', userId)
        .single()

      if (checkError || !userToDelete) {
        throw new Error('Usuario no encontrado')
      }

      // Si es administrador, verificar que no sea el último
      if (userToDelete.role?.name === 'administrador') {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('role_id', userToDelete.role_id)

        if (count <= 1) {
          throw new Error('No se puede eliminar el último administrador del sistema')
        }
      }

      // Desactivar usuario en lugar de eliminar (soft delete)
      const { error: deleteError } = await supabase
        .from('users')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (deleteError) {
        console.error('❌ Error deactivating user:', deleteError)
        throw deleteError
      }

      console.log('✅ User deactivated successfully:', userToDelete.email)
      return { error: null }
      
    } catch (error) {
      console.error('❌ Error in deleteUser:', error)
      return { error }
    }
  },

  // ✅ Obtener usuario por ID con información completa
  async getUserById(userId) {
    try {
      console.log('👤 Fetching user by ID:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          phone,
          is_active,
          last_login,
          created_at,
          updated_at,
          role:role_id(
            id,
            name,
            description,
            permissions
          ),
          user_branches(
            branch_id,
            is_primary,
            branch:branch_id(
              id,
              name,
              address,
              is_active
            )
          )
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Error fetching user:', error)
        throw error
      }

      console.log('✅ User fetched successfully:', data?.email)
      return { data, error: null }
      
    } catch (error) {
      console.error('❌ Error in getUserById:', error)
      return { data: null, error }
    }
  },

  // =====================================================
  // 🏢 SERVICIOS DE GESTIÓN DE SUCURSALES
  // =====================================================
  
  async getAllBranches() {
    try {
      console.log('🏢 Fetching all branches...')
      
      const { data, error } = await supabase
        .from('branches')
        .select(`
          id,
          name,
          address,
          phone,
          email,
          manager_name,
          is_active,
          settings,
          created_at,
          updated_at
        `)
        .order('name')

      if (error) {
        console.error('❌ Error fetching branches:', error)
        throw error
      }

      console.log('✅ Branches fetched successfully:', data?.length || 0)
      return { data: data || [], error: null }
      
    } catch (error) {
      console.error('❌ Error in getAllBranches:', error)
      return { data: [], error }
    }
  },

  async createBranch(branchData) {
    try {
      console.log('➕ Creating new branch:', branchData.name)
      
      const { data, error } = await supabase
        .from('branches')
        .insert({
          name: branchData.name.trim(),
          address: branchData.address?.trim() || null,
          phone: branchData.phone?.trim() || null,
          email: branchData.email?.trim() || null,
          manager_name: branchData.manager_name?.trim() || null,
          is_active: true,
          settings: branchData.settings || {}
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating branch:', error)
        throw error
      }

      console.log('✅ Branch created successfully:', data.name)
      return { data, error: null }
      
    } catch (error) {
      console.error('❌ Error in createBranch:', error)
      return { data: null, error }
    }
  },

  async updateBranch(branchId, updateData) {
    try {
      console.log('🔄 Updating branch:', branchId)
      
      const { data, error } = await supabase
        .from('branches')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', branchId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating branch:', error)
        throw error
      }

      console.log('✅ Branch updated successfully:', data.name)
      return { data, error: null }
      
    } catch (error) {
      console.error('❌ Error in updateBranch:', error)
      return { data: null, error }
    }
  },

  // =====================================================
  // 🔐 SERVICIOS DE GESTIÓN DE ROLES
  // =====================================================
  
  async getAllRoles() {
    try {
      console.log('🔐 Fetching all roles...')
      
      const { data, error } = await supabase
        .from('roles')
        .select(`
          id,
          name,
          description,
          permissions,
          created_at,
          updated_at
        `)
        .order('name')

      if (error) {
        console.error('❌ Error fetching roles:', error)
        throw error
      }

      console.log('✅ Roles fetched successfully:', data?.length || 0)
      return { data: data || [], error: null }
      
    } catch (error) {
      console.error('❌ Error in getAllRoles:', error)
      return { data: [], error }
    }
  },

  async updateRolePermissions(roleId, permissions) {
    try {
      console.log('🔄 Updating role permissions:', roleId)
      
      const { data, error } = await supabase
        .from('roles')
        .update({
          permissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating role permissions:', error)
        throw error
      }

      console.log('✅ Role permissions updated successfully')
      return { data, error: null }
      
    } catch (error) {
      console.error('❌ Error in updateRolePermissions:', error)
      return { data: null, error }
    }
  },

  // =====================================================
  // 📊 SERVICIOS DE REPORTES ADMINISTRATIVOS
  // =====================================================
  
  async getSystemStats() {
    try {
      console.log('📊 Fetching system statistics...')
      
      // Ejecutar consultas en paralelo
      const [
        usersCount,
        branchesCount,
        activeUsersCount,
        adminCount,
        receptionCount
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('branches').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('users').select('*, role:role_id(name)', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('users').select('*, role:role_id(name)', { count: 'exact', head: true }).eq('is_active', true)
      ])

      // Contar administradores y recepcionistas manualmente
      const { data: allActiveUsers } = await supabase
        .from('users')
        .select('role:role_id(name)')
        .eq('is_active', true)

      const adminUsers = allActiveUsers?.filter(u => u.role?.name === 'administrador').length || 0
      const receptionUsers = allActiveUsers?.filter(u => u.role?.name === 'recepcion').length || 0

      const stats = {
        totalUsers: usersCount.count || 0,
        totalBranches: branchesCount.count || 0,
        activeUsers: activeUsersCount.count || 0,
        adminUsers,
        receptionUsers,
        inactiveUsers: (usersCount.count || 0) - (activeUsersCount.count || 0)
      }

      console.log('✅ System stats calculated:', stats)
      return { data: stats, error: null }
      
    } catch (error) {
      console.error('❌ Error in getSystemStats:', error)
      return { data: null, error }
    }
  },

  async getUserActivity(limit = 50) {
    try {
      console.log('👥 Fetching user activity...')
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          table_name,
          action,
          created_at,
          user:user_id(
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Error fetching user activity:', error)
        throw error
      }

      console.log('✅ User activity fetched:', data?.length || 0, 'records')
      return { data: data || [], error: null }
      
    } catch (error) {
      console.error('❌ Error in getUserActivity:', error)
      return { data: [], error }
    }
  },

  // =====================================================
  // 🔧 SERVICIOS DE CONFIGURACIÓN DEL SISTEMA - CORREGIDO
  // =====================================================
  
  async getSystemSettings(branchId = null) {
    try {
      console.log('⚙️ Fetching system settings...', branchId ? `for branch ${branchId}` : 'global')
      
      let query = supabase
        .from('hotel_settings')
        .select(`
          id,
          setting_key,
          setting_value,
          description,
          updated_at,
          branch:branch_id(name),
          updated_by_user:updated_by(first_name, last_name)
        `)
        .order('setting_key')

      if (branchId) {
        query = query.eq('branch_id', branchId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Error fetching settings:', error)
        throw error
      }

      console.log('✅ Settings fetched:', data?.length || 0, 'settings')
      return { data: data || [], error: null }
      
    } catch (error) {
      console.error('❌ Error in getSystemSettings:', error)
      return { data: [], error }
    }
  },

  // ✅ FUNCIÓN AGREGADA: getHotelSettings (alias para getSystemSettings)
  async getHotelSettings(branchId = null) {
    try {
      console.log('🏨 Fetching hotel settings...', branchId ? `for branch ${branchId}` : 'global')
      
      // Simplemente llamar a getSystemSettings ya que hacen lo mismo
      return await this.getSystemSettings(branchId)
      
    } catch (error) {
      console.error('❌ Error in getHotelSettings:', error)
      return { data: [], error }
    }
  },

  async updateSystemSetting(branchId, settingKey, settingValue, userId) {
    try {
      console.log('⚙️ Updating system setting:', settingKey, '=', settingValue)
      
      const { data, error } = await supabase
        .from('hotel_settings')
        .upsert({
          branch_id: branchId,
          setting_key: settingKey,
          setting_value: settingValue,
          updated_by: userId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'branch_id,setting_key'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating setting:', error)
        throw error
      }

      console.log('✅ Setting updated successfully:', settingKey)
      return { data, error: null }
      
    } catch (error) {
      console.error('❌ Error in updateSystemSetting:', error)
      return { data: null, error }
    }
  },

  // ✅ FUNCIÓN AGREGADA: updateHotelSettings (procesar múltiples configuraciones)
  async updateHotelSettings(settingsArray) {
    try {
      console.log('🏨 Updating hotel settings in batch...', settingsArray?.length || 0, 'settings')
      
      if (!settingsArray || !Array.isArray(settingsArray)) {
        throw new Error('Settings array is required')
      }

      const results = []
      const errors = []

      // Procesar configuraciones una por una
      for (const setting of settingsArray) {
        try {
          const result = await this.updateSystemSetting(
            setting.branch_id,
            setting.setting_key,
            setting.setting_value,
            setting.updated_by || null
          )
          
          if (result.error) {
            errors.push({
              setting: setting.setting_key,
              error: result.error
            })
          } else {
            results.push(result.data)
          }
        } catch (err) {
          errors.push({
            setting: setting.setting_key,
            error: err
          })
        }
      }

      if (errors.length > 0) {
        console.warn('⚠️ Some settings failed to save:', errors)
        return { 
          data: results, 
          error: `${errors.length} configuraciones fallaron al guardarse`,
          errors: errors
        }
      }

      console.log('✅ All hotel settings updated successfully:', results.length)
      return { data: results, error: null }
      
    } catch (error) {
      console.error('❌ Error in updateHotelSettings:', error)
      return { data: null, error }
    }
  },

  // =====================================================
  // 🛡️ SERVICIOS DE AUDITORÍA Y SEGURIDAD
  // =====================================================
  
  async getAuditLogs(filters = {}) {
    try {
      console.log('🛡️ Fetching audit logs with filters:', filters)
      
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          table_name,
          record_id,
          action,
          old_values,
          new_values,
          ip_address,
          user_agent,
          created_at,
          user:user_id(
            first_name,
            last_name,
            email
          )
        `)

      // Aplicar filtros
      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name)
      }

      if (filters.action) {
        query = query.eq('action', filters.action)
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date)
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(filters.limit || 100)

      if (error) {
        console.error('❌ Error fetching audit logs:', error)
        throw error
      }

      console.log('✅ Audit logs fetched:', data?.length || 0, 'records')
      return { data: data || [], error: null }
      
    } catch (error) {
      console.error('❌ Error in getAuditLogs:', error)
      return { data: [], error }
    }
  },

  async createAuditLog(logData) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          table_name: logData.table_name,
          record_id: logData.record_id,
          action: logData.action,
          old_values: logData.old_values || null,
          new_values: logData.new_values || null,
          user_id: logData.user_id,
          ip_address: logData.ip_address || null,
          user_agent: logData.user_agent || null
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
      
    } catch (error) {
      console.error('❌ Error creating audit log:', error)
      return { data: null, error }
    }
  },

  // =====================================================
  // 💾 SERVICIOS DE RESPALDO Y MANTENIMIENTO
  // =====================================================
  
  async generateBackupReport() {
    try {
      console.log('💾 Generating backup report...')
      
      // Obtener estadísticas de las tablas principales
      const tables = [
        'users', 'branches', 'rooms', 'guests', 
        'reservations', 'quick_checkins', 'supplies'
      ]

      const tableStats = await Promise.all(
        tables.map(async (tableName) => {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })

          return {
            table: tableName,
            records: error ? 0 : count,
            status: error ? 'error' : 'ok'
          }
        })
      )

      const report = {
        generated_at: new Date().toISOString(),
        tables: tableStats,
        total_records: tableStats.reduce((sum, table) => sum + table.records, 0),
        database_size: 'N/A', // Esto requeriría permisos especiales
        last_backup: 'N/A', // Esto dependería de la configuración de respaldos
        status: tableStats.every(t => t.status === 'ok') ? 'healthy' : 'issues'
      }

      console.log('✅ Backup report generated')
      return { data: report, error: null }
      
    } catch (error) {
      console.error('❌ Error generating backup report:', error)
      return { data: null, error }
    }
  },

  async cleanupOldData(options = {}) {
    try {
      console.log('🧹 Starting data cleanup...', options)
      
      const results = []
      
      // Limpiar logs de auditoría antiguos (más de 6 meses)
      if (options.cleanup_audit_logs !== false) {
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
        
        const { count, error } = await supabase
          .from('audit_logs')
          .delete()
          .lt('created_at', sixMonthsAgo.toISOString())

        results.push({
          operation: 'cleanup_audit_logs',
          records_affected: error ? 0 : count,
          status: error ? 'error' : 'success',
          error: error?.message
        })
      }

      // Limpiar alertas resueltas antiguas
      if (options.cleanup_resolved_alerts !== false) {
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
        
        const { count, error } = await supabase
          .from('inventory_alerts')
          .delete()
          .eq('is_resolved', true)
          .lt('resolved_at', oneMonthAgo.toISOString())

        results.push({
          operation: 'cleanup_resolved_alerts',
          records_affected: error ? 0 : count,
          status: error ? 'error' : 'success',
          error: error?.message
        })
      }

      console.log('✅ Data cleanup completed:', results)
      return { data: results, error: null }
      
    } catch (error) {
      console.error('❌ Error in cleanupOldData:', error)
      return { data: null, error }
    }
  },

  // =====================================================
  // 📈 SERVICIOS DE ANÁLISIS DE DATOS
  // =====================================================
  
  async getUsageAnalytics(startDate, endDate) {
    try {
      console.log('📈 Fetching usage analytics...', { startDate, endDate })
      
      // Análisis de actividad de usuarios
      const { data: userActivity, error: userError } = await supabase
        .from('audit_logs')
        .select('user_id, action, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (userError) throw userError

      // Análisis de operaciones del sistema
      const { data: systemOps, error: opsError } = await supabase
        .from('audit_logs')
        .select('table_name, action, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (opsError) throw opsError

      // Procesar datos para análisis
      const analytics = {
        period: { start: startDate, end: endDate },
        user_activity: this.processUserActivity(userActivity || []),
        system_operations: this.processSystemOperations(systemOps || []),
        total_operations: (userActivity?.length || 0) + (systemOps?.length || 0),
        most_active_users: this.getMostActiveUsers(userActivity || []),
        operation_trends: this.getOperationTrends(systemOps || [])
      }

      console.log('✅ Usage analytics processed')
      return { data: analytics, error: null }
      
    } catch (error) {
      console.error('❌ Error in getUsageAnalytics:', error)
      return { data: null, error }
    }
  },

  // =====================================================
  // 📈 ELIMINACION DE DATOS EN GENERAL
  // =====================================================

  async deleteBranchData(branchId, options = {}) {
  try {
    console.log('🗑️ Deleting data for branch:', branchId, options);
    
    const results = {
      rooms: 0,
      reservations: 0,
      quick_checkins: 0,
      supplies: 0,
      snack_items: 0,
      expenses: 0,
      daily_reports: 0,
      errors: []
    };

    // 1. Eliminar daily_reports (no tiene dependencias)
    if (options.includeDailyReports !== false) {
      const { error: reportsError, count } = await supabase
        .from('daily_reports')
        .delete()
        .eq('branch_id', branchId);
      
      if (reportsError) results.errors.push({ table: 'daily_reports', error: reportsError });
      else results.daily_reports = count || 0;
    }

    // 2. Eliminar expenses (no tiene dependencias)
    if (options.includeExpenses !== false) {
      const { error: expensesError, count } = await supabase
        .from('expenses')
        .delete()
        .eq('branch_id', branchId);
      
      if (expensesError) results.errors.push({ table: 'expenses', error: expensesError });
      else results.expenses = count || 0;
    }

    // 3. Eliminar quick_checkins (tiene checkin_orders como dependencia CASCADE)
    if (options.includeQuickCheckins !== false) {
      const { error: quickError, count } = await supabase
        .from('quick_checkins')
        .delete()
        .eq('branch_id', branchId);
      
      if (quickError) results.errors.push({ table: 'quick_checkins', error: quickError });
      else results.quick_checkins = count || 0;
    }

    // 4. Eliminar reservations (tiene CASCADE en payments, checkin_orders)
    if (options.includeReservations !== false) {
      const { error: reservationsError, count } = await supabase
        .from('reservations')
        .delete()
        .eq('branch_id', branchId);
      
      if (reservationsError) results.errors.push({ table: 'reservations', error: reservationsError });
      else results.reservations = count || 0;
    }

    // 5. Eliminar supplies (tiene CASCADE en supply_movements, inventory_alerts)
    if (options.includeSupplies !== false) {
      const { error: suppliesError, count } = await supabase
        .from('supplies')
        .delete()
        .eq('branch_id', branchId);
      
      if (suppliesError) results.errors.push({ table: 'supplies', error: suppliesError });
      else results.supplies = count || 0;
    }

    // 6. Eliminar snack_items (no tiene dependencias directas)
    if (options.includeSnacks !== false) {
      const { error: snacksError, count } = await supabase
        .from('snack_items')
        .delete()
        .eq('branch_id', branchId);
      
      if (snacksError) results.errors.push({ table: 'snack_items', error: snacksError });
      else results.snack_items = count || 0;
    }

    // 7. Eliminar rooms (debe ser último, tiene referencias en muchas tablas)
    if (options.includeRooms !== false) {
      const { error: roomsError, count } = await supabase
        .from('rooms')
        .delete()
        .eq('branch_id', branchId);
      
      if (roomsError) results.errors.push({ table: 'rooms', error: roomsError });
      else results.rooms = count || 0;
    }

    console.log('✅ Branch data deletion completed:', results);
    return { data: results, error: results.errors.length > 0 ? results.errors : null };
    
  } catch (error) {
    console.error('❌ Error deleting branch data:', error);
    return { data: null, error };
  }
},

async deleteAllBranchesData(excludeBranchIds = []) {
  try {
    console.log('🗑️ Deleting data for ALL branches except:', excludeBranchIds);
    
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name')
      .not('id', 'in', `(${excludeBranchIds.join(',')})`)
      .eq('is_active', true);

    if (branchesError) throw branchesError;

    const results = [];
    
    for (const branch of branches) {
      console.log(`Processing branch: ${branch.name}`);
      const result = await this.deleteBranchData(branch.id);
      results.push({
        branchId: branch.id,
        branchName: branch.name,
        ...result
      });
    }

    return { data: results, error: null };
  } catch (error) {
    console.error('❌ Error deleting all branches data:', error);
    return { data: null, error };
  }
},

async getBranchDataCount(branchId) {
  try {
    console.log('📊 Counting data for branch:', branchId);
    
    const counts = await Promise.all([
      supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('branch_id', branchId),
      supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('branch_id', branchId),
      supabase.from('quick_checkins').select('*', { count: 'exact', head: true }).eq('branch_id', branchId),
      supabase.from('supplies').select('*', { count: 'exact', head: true }).eq('branch_id', branchId),
      supabase.from('snack_items').select('*', { count: 'exact', head: true }).eq('branch_id', branchId),
      supabase.from('expenses').select('*', { count: 'exact', head: true }).eq('branch_id', branchId),
      supabase.from('daily_reports').select('*', { count: 'exact', head: true }).eq('branch_id', branchId)
    ]);

    return {
      data: {
        rooms: counts[0].count || 0,
        reservations: counts[1].count || 0,
        quick_checkins: counts[2].count || 0,
        supplies: counts[3].count || 0,
        snack_items: counts[4].count || 0,
        expenses: counts[5].count || 0,
        daily_reports: counts[6].count || 0,
        total: counts.reduce((sum, c) => sum + (c.count || 0), 0)
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Error counting branch data:', error);
    return { data: null, error };
  }
},

  // =====================================================
  // 🔧 FUNCIONES AUXILIARES
  // =====================================================
  
  processUserActivity(activities) {
    const activityByUser = {}
    activities.forEach(activity => {
      if (!activityByUser[activity.user_id]) {
        activityByUser[activity.user_id] = 0
      }
      activityByUser[activity.user_id]++
    })
    return activityByUser
  },

  processSystemOperations(operations) {
    const opsByTable = {}
    operations.forEach(op => {
      if (!opsByTable[op.table_name]) {
        opsByTable[op.table_name] = { CREATE: 0, UPDATE: 0, DELETE: 0 }
      }
      opsByTable[op.table_name][op.action] = (opsByTable[op.table_name][op.action] || 0) + 1
    })
    return opsByTable
  },

  getMostActiveUsers(activities) {
    const userCounts = {}
    activities.forEach(activity => {
      userCounts[activity.user_id] = (userCounts[activity.user_id] || 0) + 1
    })
    
    return Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, activities: count }))
  },

  getOperationTrends(operations) {
    const trends = {}
    operations.forEach(op => {
      const date = new Date(op.created_at).toISOString().split('T')[0]
      if (!trends[date]) {
        trends[date] = 0
      }
      trends[date]++
    })
    return trends
  },

  // =====================================================
  // 🔄 FUNCIONES DE UTILIDAD
  // =====================================================
  
  formatUserName(user) {
    return user ? `${user.first_name} ${user.last_name}` : 'Usuario desconocido'
  },

  formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }
}

export default adminService