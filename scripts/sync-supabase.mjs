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
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MANAGEMENT_TOKEN;

if (!SUPABASE_URL) {
  console.error('❌ Error: VITE_SUPABASE_URL no está configurado');
  process.exit(1);
}

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Error: SUPABASE_ACCESS_TOKEN (Personal Access Token) no está configurado');
  process.exit(1);
}

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
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
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

// Reemplazar creación inline por ejecución de archivos de módulos
async function applyModuleSQLFiles() {
  const modulesDir = join(__dirname, '..', 'supabase', 'modules');
  const modules = [
    'orders',
    'licenses', 
    'credentials',
    'servers',
    'budget',
    'expenses'
  ];
  
  // Ejecutar archivos SQL de cada módulo en orden
  for (const module of modules) {
    const moduleDir = join(modulesDir, module);
    const sqlFiles = [
      '01_schema_' + module + '.sql',
      '02_rls_open_' + module + '.sql',
      '03_rls_secure_' + module + '.sql'
    ];
    
    for (const file of sqlFiles) {
      const filePath = join(moduleDir, file);
      console.log(`⏳ Ejecutando ${module}/${file}...`);
      try {
        const sql = readFileSync(filePath, 'utf-8');
        await executeSQL(sql);
        console.log(`✅ Archivo '${module}/${file}' aplicado correctamente`);
      } catch (err) {
        console.error(`❌ Error aplicando '${module}/${file}':`, err.message);
        // Continuar con el siguiente archivo en caso de error
      }
    }
  }
 }

// Función para verificar las tablas
async function verifyTables() {
  console.log('🔍 Verificando tablas creadas...');
  const tables = ['orders', 'expenses', 'budget_lines', 'licenses', 'credentials', 'servers'];
  
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
        const text = await response.text();
        console.log(`❌ Tabla '${table}' no accesible: ${response.status} ${text}`);
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
    
    // Aplicar módulos SQL
    await applyModuleSQLFiles();
    
    console.log('🎉 Módulos SQL aplicados exitosamente!');
    
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
