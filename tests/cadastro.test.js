import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar } from '../src/db.js'; // Ajuste o caminho conforme a localização do seu arquivo db.js

const app = criarApp();

// Função auxiliar para gerar datas relativas (ex: hoje, amanhã, daqui a X dias)
function dataDaqui(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().split('T')[0];
}

describe('cadastrar uma doação', () => {
  beforeEach(async () => {
    await migrar(); // Garante que a tabela do banco existe e está limpa antes de cada teste
  });

  it('recusa cadastrar doação com validade igual a hoje', async () => {
    // Dado / Quando
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Pão', quantidade: '5 kg', validade: dataDaqui(0) });

    // Então
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('a validade precisa ser uma data futura');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  it('aceita cadastrar doação com validade de amanhã', async () => {
    // Dado
    const amanha = dataDaqui(1);

    // Quando
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Frutas', quantidade: '3 caixas', validade: amanha });

    // Então
    expect(res.status).toBe(201);
    expect(res.body.validade).toBe(amanha);
  });

  it('registra a doação com tipo, quantidade e validade informados', async () => {
    // Dado
    const validade = dataDaqui(3);

    // Quando
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz', quantidade: '20 kg', validade });

    // Então
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ tipo: 'Arroz', quantidade: '20 kg', validade, status: 'disponivel' });
  });

  it('recusa cadastro sem quantidade e avisa que os campos são obrigatórios', async () => {
    // Dado / Quando
    const res = await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Arroz', validade: dataDaqui(3) });

    // Então
    expect(res.status).toBe(400);
    expect(res.body.erro).toBe('tipo, quantidade e validade são obrigatórios');

    const lista = await request(app).get('/api/doacoes');
    expect(lista.body).toHaveLength(0);
  });

  describe('cadastrar uma doação: limites e erros', () => {
    beforeEach(async () => {
      await migrar();
    });

    it('recusa validade fora do formato AAAA-MM-DD', async () => {
      // Dado / Quando
      const res = await request(app)
        .post('/api/doacoes')
        .send({ tipo: 'Leite', quantidade: '12 litros', validade: '31/12/2099' });

      // Então
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('validade inválida: use uma data real no formato AAAA-MM-DD');

      const lista = await request(app).get('/api/doacoes');
      expect(lista.body).toHaveLength(0);
    });

    it('recusa validade com data que não existe, como 30 de fevereiro', async () => {
      // Dado / Quando
      const res = await request(app)
        .post('/api/doacoes')
        .send({ tipo: 'Leite', quantidade: '12 litros', validade: '2099-02-30' });

      // Então
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('validade inválida: use uma data real no formato AAAA-MM-DD');

      const lista = await request(app).get('/api/doacoes');
      expect(lista.body).toHaveLength(0);
    });

    it('recusa tipo preenchido só com espaços como campo obrigatório vazio', async () => {
      // Dado / Quando
      const res = await request(app)
        .post('/api/doacoes')
        .send({ tipo: '    ', quantidade: '12 litros', validade: dataDaqui(3) });

      // Então
      expect(res.status).toBe(400);
      expect(res.body.erro).toBe('tipo, quantidade e validade são obrigatórios');

      const lista = await request(app).get('/api/doacoes');
      expect(lista.body).toHaveLength(0);
    });

    it('mesma doação enviada duas vezes vira duas doações independentes', async () => {
      const dados = { tipo: 'Feijão', quantidade: '5 kg', validade: dataDaqui(5) };

      // Dado
      const primeira = await request(app).post('/api/doacoes').send(dados);
      // Quando
      const segunda = await request(app).post('/api/doacoes').send(dados);

      // Então
      expect(segunda.status).toBe(201);
      expect(segunda.body.id).not.toBe(primeira.body.id);
    });
  });
});