import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

try {
  await client.connect();

  console.log('Conexão com Supabase estabelecida!');

  const resultado = await client.query(`
    SELECT current_database(), current_user, version();
  `);

  console.log(resultado.rows[0]);

} catch (erro) {
  console.error('Erro ao conectar:', erro.message);

} finally {
  await client.end();
}