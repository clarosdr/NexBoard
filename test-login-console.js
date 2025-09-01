// 🧪 Script de prueba para login directo en consola del navegador
// Copia y pega este código en la consola del navegador (F12 -> Console)

// Función para probar login directo
async function TEST_SUPABASE_LOGIN() {
  console.log('🧪 Iniciando prueba de login directo...');
  
  try {
    // Importar supabase desde el módulo global (si está disponible)
    const { supabase } = window;
    
    if (!supabase) {
      console.error('❌ Supabase no está disponible en window. Verifica la configuración.');
      return;
    }
    
    // Probar login con las credenciales
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "clarosdr@gmail.com",
      password: "tu_contraseña" // ⚠️ CAMBIAR POR LA CONTRASEÑA REAL
    });
    
    console.log('🔐 Resultado del login:');
    console.log('Data:', data);
    console.log('Error:', error);
    console.log('User ID:', data?.user?.id);
    console.log('Session:', data?.session);
    
    if (data?.session?.user?.id) {
      console.log('✅ Login exitoso! User ID:', data.session.user.id);
    } else {
      console.log('❌ Login falló o no se obtuvo User ID');
    }
    
  } catch (err) {
    console.error('❌ Error en la prueba:', err);
  }
}

// Función para verificar la sesión actual
async function CHECK_CURRENT_SESSION() {
  console.log('🔍 Verificando sesión actual...');
  
  try {
    const { supabase } = window;
    
    if (!supabase) {
      console.error('❌ Supabase no está disponible en window.');
      return;
    }
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('📋 Sesión actual:');
    console.log('Session:', session);
    console.log('Error:', error);
    console.log('User ID:', session?.user?.id);
    
    if (session?.user?.id) {
      console.log('✅ Hay una sesión activa! User ID:', session.user.id);
    } else {
      console.log('❌ No hay sesión activa');
    }
    
  } catch (err) {
    console.error('❌ Error verificando sesión:', err);
  }
}

// Función para verificar localStorage
function CHECK_LOCAL_STORAGE() {
  console.log('💾 Verificando localStorage...');
  
  const supabaseSession = localStorage.getItem('sb-localhost-auth-token');
  const nexboardUser = localStorage.getItem('nexboard-user');
  
  console.log('Supabase session token:', supabaseSession);
  console.log('NexBoard user:', nexboardUser);
  
  if (nexboardUser) {
    try {
      const userData = JSON.parse(nexboardUser);
      console.log('✅ Usuario en localStorage:', userData);
      console.log('User ID:', userData.id);
    } catch (err) {
      console.error('❌ Error parseando usuario de localStorage:', err);
    }
  }
}

console.log('🧪 Scripts de prueba cargados!');
console.log('Ejecuta: testSupabaseLogin() - para probar login');
console.log('Ejecuta: checkCurrentSession() - para verificar sesión actual');
console.log('Ejecuta: checkLocalStorage() - para verificar localStorage');