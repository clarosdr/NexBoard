import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuración de Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

// Función para verificar una tabla
async function verifyTable(tableName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return { success: true, status: response.status };
    } else {
      const error = await response.text();
      return { success: false, status: response.status, error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Función para probar operaciones CRUD básicas
async function testCRUDOperations() {
  console.log('🧪 Probando operaciones CRUD básicas...');
  
  // Probar inserción en service_orders
  try {
    const testData = {
      client_name: 'Cliente de Prueba',
      service_type: 'Desarrollo Web',
      description: 'Prueba de inserción',
      status: 'pending',
      price: 100.00
    };

    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/service_orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testData)
    });

    if (insertResponse.ok) {
      const insertedData = await insertResponse.json();
      console.log('✅ Inserción exitosa en service_orders');
      
      // Probar actualización
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/service_orders?id=eq.${insertedData[0].id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'completed' })
      });

      if (updateResponse.ok) {
        console.log('✅ Actualización exitosa en service_orders');
      } else {
        console.log('❌ Error en actualización:', updateResponse.status);
      }

      // Probar eliminación
      const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/service_orders?id=eq.${insertedData[0].id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });

      if (deleteResponse.ok) {
        console.log('✅ Eliminación exitosa en service_orders');
      } else {
        console.log('❌ Error en eliminación:', deleteResponse.status);
      }

    } else {
      const error = await insertResponse.text();
      console.log('❌ Error en inserción:', insertResponse.status, error);
    }

  } catch (error) {
    console.log('❌ Error en pruebas CRUD:', error.message);
  }
}

// Función principal
async function main() {
  console.log('🔍 Verificando configuración de Supabase...');
  console.log(`📡 URL: ${SUPABASE_URL}`);
  
  const tables = [
    'service_orders',
    'passwords', 
    'licenses',
    'server_credentials',
    'budget_expenses',
    'casual_expenses'
  ];

  let allTablesExist = true;

  console.log('\n📋 Verificando tablas...');
  for (const table of tables) {
    const result = await verifyTable(table);
    
    if (result.success) {
      console.log(`✅ Tabla '${table}' existe y es accesible`);
    } else {
      console.log(`❌ Tabla '${table}' no accesible: ${result.status} - ${result.error || 'Error desconocido'}`);
      allTablesExist = false;
    }
  }

  if (allTablesExist) {
    console.log('\n🎉 ¡Todas las tablas están configuradas correctamente!');
    await testCRUDOperations();
    console.log('\n🎯 Verificación completada exitosamente!');
  } else {
    console.log('\n⚠️  Algunas tablas no están disponibles.');
    console.log('💡 Ejecuta el archivo supabase-setup.sql en el SQL Editor de Supabase.');
  }
}

// Ejecutar
main().catch(console.error);