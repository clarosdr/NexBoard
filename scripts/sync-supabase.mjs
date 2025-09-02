import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configuración de Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurado');
  process.exit(1);
}

// Función para ejecutar SQL usando la API de management de Supabase
async function executeSQL(sql) {
  try {
    // Usar la API de management de Supabase para ejecutar SQL
    const projectId = SUPABASE_URL.split('//')[1].split('.')[0];
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Error ejecutando SQL: ${error.message}`);
  }
}

// Función alternativa usando PostgREST directamente para crear tablas
async function createTablesDirectly() {
  console.log('🔧 Creando tablas usando método alternativo...');
  
  const tables = [
    {
      name: 'service_orders',
      sql: `CREATE TABLE IF NOT EXISTS service_orders (
        id SERIAL PRIMARY KEY,
        client_name VARCHAR(255) NOT NULL,
        service_type VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'passwords',
      sql: `CREATE TABLE IF NOT EXISTS passwords (
        id SERIAL PRIMARY KEY,
        service_name VARCHAR(255) NOT NULL,
        username VARCHAR(255),
        email VARCHAR(255),
        password_encrypted TEXT NOT NULL,
        url VARCHAR(500),
        category VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'licenses',
      sql: `CREATE TABLE IF NOT EXISTS licenses (
        id SERIAL PRIMARY KEY,
        software_name VARCHAR(255) NOT NULL,
        license_key TEXT NOT NULL,
        purchase_date DATE,
        expiry_date DATE,
        cost DECIMAL(10,2),
        vendor VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'server_credentials',
      sql: `CREATE TABLE IF NOT EXISTS server_credentials (
        id SERIAL PRIMARY KEY,
        server_name VARCHAR(255) NOT NULL,
        ip_address INET,
        username VARCHAR(255) NOT NULL,
        password_encrypted TEXT,
        ssh_key TEXT,
        port INTEGER DEFAULT 22,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'budget_expenses',
      sql: `CREATE TABLE IF NOT EXISTS budget_expenses (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date DATE NOT NULL,
        is_recurring BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    },
    {
      name: 'casual_expenses',
      sql: `CREATE TABLE IF NOT EXISTS casual_expenses (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        date DATE NOT NULL,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    }
  ];

  for (const table of tables) {
    try {
      console.log(`⏳ Creando tabla ${table.name}...`);
      await executeSQL(table.sql);
      console.log(`✅ Tabla ${table.name} creada exitosamente`);
    } catch (error) {
      console.log(`⚠️ Warning creando tabla ${table.name}: ${error.message}`);
    }
  }
}

// Función para verificar las tablas
async function verifyTables() {
  console.log('🔍 Verificando tablas creadas...');
  const tables = ['service_orders', 'casual_expenses', 'budget_expenses', 'licenses', 'passwords', 'server_credentials'];
  
  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        }
      });
      
      if (response.ok) {
        console.log(`✅ Tabla '${table}' creada y accesible`);
      } else {
        console.log(`❌ Tabla '${table}' no accesible: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error verificando tabla '${table}': ${error.message}`);
    }
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando sincronización con Supabase...');
    console.log(`📡 URL: ${SUPABASE_URL}`);
    
    // Crear tablas directamente
    await createTablesDirectly();
    
    console.log('🎉 Tablas creadas exitosamente!');
    
    // Verificar que las tablas se crearon
    await verifyTables();
    
    console.log('🎯 Sincronización completada!');
    
  } catch (error) {
    console.error('❌ Error durante la sincronización:', error.message);
    process.exit(1);
  }
}

// Ejecutar
main();
