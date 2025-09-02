const fetch = require('node-fetch');

const SUPABASE_URL = 'https://dzztwymgrunzzuactlvp.supabase.co/rest/v1/';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6enR3eW1ncnVuenp1YWN0bHZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUxODkwNSwiZXhwIjoyMDcyMDk0OTA1fQ.DH4NI67E2IiyVzHdzfkI8tK7UNQOqFZPDmRpFmLL5hI';

const headers = {
  apikey: API_KEY,
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

const tables = ['server_credentials', 'users', 'logs', 'settings'];

async function syncAll() {
  for (const table of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}${table}`, { headers });
      const data = await res.json();
      console.log(`✅ Datos de ${table}:`, data);
    } catch (err) {
      console.error(`❌ Error en ${table}:`, err.message);
    }
  }
}

async function insertServerCredential() {
  const payload = {
    server_name: 'VPN-LLANTAS&LLANTAS',
    ip_address: '26.230.156.144',
    vpn_password: 'LLantas*+.2024',
    local_name: 'LLANTAS:2468',
    notes: 'Actualizado desde TRAÉ',
    username: 'SOPORTE TECNICOMPUTO',
  };

  try {
    const res = await fetch(`${SUPABASE_URL}server_credentials`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    console.log('🆕 Registro insertado:', result);
  } catch (err) {
    console.error('❌ Error al insertar:', err.message);
  }
}

// Ejecutar sincronización e inserción
(async () => {
  await syncAll();
  await insertServerCredential();
})();
