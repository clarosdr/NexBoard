#!/usr/bin/env node

/**
 * Script de despliegue automatizado para NexBoard
 * Prepara la aplicación para despliegue en Netlify
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} encontrado`, 'green');
    return true;
  } else {
    log(`❌ ${description} no encontrado: ${filePath}`, 'red');
    return false;
  }
}

function runCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completado`, 'green');
    return true;
  } catch (error) {
    log(`❌ Error en ${description}: ${error.message}`, 'red');
    return false;
  }
}

function checkEnvironmentVariables() {
  log('\n📋 Verificando variables de entorno...', 'cyan');
  
  const envFile = '.env';
  if (!fs.existsSync(envFile)) {
    log('❌ Archivo .env no encontrado', 'red');
    log('💡 Crea un archivo .env con las siguientes variables:', 'yellow');
    log('   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co');
    log('   VITE_SUPABASE_ANON_KEY=tu-clave-anonima');
    return false;
  }
  
  const envContent = fs.readFileSync(envFile, 'utf8');
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('VITE_SUPABASE_ANON_KEY');
  
  if (!hasSupabaseUrl || !hasSupabaseKey) {
    log('❌ Variables de Supabase incompletas en .env', 'red');
    return false;
  }
  
  log('✅ Variables de entorno configuradas', 'green');
  return true;
}

function checkProjectStructure() {
  log('\n📁 Verificando estructura del proyecto...', 'cyan');
  
  const requiredFiles = [
    { path: 'package.json', desc: 'package.json' },
    { path: 'vite.config.js', desc: 'Configuración de Vite' },
    { path: 'netlify.toml', desc: 'Configuración de Netlify' },
    { path: 'public/_redirects', desc: 'Redirects para SPA' },
    { path: 'src/App.jsx', desc: 'Componente principal' },
    { path: 'src/lib/supabase.js', desc: 'Cliente de Supabase' }
  ];
  
  let allFilesExist = true;
  requiredFiles.forEach(file => {
    if (!checkFile(file.path, file.desc)) {
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

function buildProject() {
  log('\n🏗️  Construyendo proyecto...', 'cyan');
  return runCommand('npm run build', 'Build de producción');
}

function runTests() {
  log('\n🧪 Ejecutando verificaciones...', 'cyan');
  
  // Type checking
  if (fs.existsSync('tsconfig.json')) {
    if (!runCommand('npm run type-check', 'Type checking')) {
      return false;
    }
  }
  
  // Linting
  if (!runCommand('npm run lint', 'Linting')) {
    log('⚠️  Hay errores de linting. Ejecuta "npm run lint:fix" para corregir automáticamente', 'yellow');
  }
  
  return true;
}

function generateDeploymentInfo() {
  log('\n📊 Generando información de despliegue...', 'cyan');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const buildStats = fs.statSync('dist');
  
  const deployInfo = {
    name: packageJson.name,
    version: packageJson.version,
    buildDate: new Date().toISOString(),
    nodeVersion: process.version,
    buildSize: getBuildSize('dist'),
    environment: 'production'
  };
  
  fs.writeFileSync('dist/deploy-info.json', JSON.stringify(deployInfo, null, 2));
  log('✅ Información de despliegue generada en dist/deploy-info.json', 'green');
}

function getBuildSize(dir) {
  let totalSize = 0;
  
  function calculateSize(dirPath) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        calculateSize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
  }
  
  calculateSize(dir);
  return `${(totalSize / 1024 / 1024).toFixed(2)} MB`;
}

function main() {
  log('🚀 Iniciando proceso de despliegue para NexBoard', 'bright');
  log('================================================', 'bright');
  
  // Verificaciones previas
  if (!checkEnvironmentVariables()) {
    process.exit(1);
  }
  
  if (!checkProjectStructure()) {
    log('\n❌ La estructura del proyecto no es válida', 'red');
    process.exit(1);
  }
  
  // Ejecutar tests y verificaciones
  runTests();
  
  // Build del proyecto
  if (!buildProject()) {
    log('\n❌ Error en el build del proyecto', 'red');
    process.exit(1);
  }
  
  // Generar información de despliegue
  generateDeploymentInfo();
  
  log('\n🎉 ¡Proyecto listo para despliegue!', 'green');
  log('\n📋 Próximos pasos:', 'cyan');
  log('1. Sube el código a tu repositorio Git');
  log('2. Conecta el repositorio en Netlify');
  log('3. Configura las variables de entorno en Netlify');
  log('4. ¡Despliega!');
  log('\n📖 Ver NETLIFY_DEPLOY.md para instrucciones detalladas', 'blue');
}

if (require.main === module) {
  main();
}

module.exports = { main, checkEnvironmentVariables, checkProjectStructure, buildProject };