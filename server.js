// server.js (corrigido)
const express = require('express');
const cors = require('cors');
const db = require('./db'); 
const path = require('path');

const app = express();
// usar porta do ambiente (Render) ou 3000 localmente
const port = process.env.PORT || 3000;

// Se o seu site está na pasta acima, ok — mas verifique no Render qual é a "Publish Directory"
// geralmente usa-se: path.join(_dirname, 'public') ou path.join(_dirname, '..', 'public')
app.use(express.static(path.join(__dirname, '..')));

// Middlewares
app.use(cors());
app.use(express.json());

/* -------------------------
   ROTAS DE PRODUTOS
   ------------------------- */

// Rota GET para listar produtos
app.get('/produtos', async (req, res) => {
  try {
    const resultado = await db.query('SELECT * FROM produtos ORDER BY id DESC');
    res.json(resultado.rows);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
});

// Rota GET para buscar produto por ID
app.get('/produtos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const resultado = await db.query('SELECT * FROM produtos WHERE id = $1', [id]);
    
    if (resultado.rows.length === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar produto por ID:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// Rota POST para adicionar um novo produto
app.post('/produtos', async (req, res) => {
  const { nome, preco, descricao, imagem } = req.body;

  console.log("Dados recebidos:", req.body);

  try {
    const resultado = await db.query(
      'INSERT INTO produtos (nome, preco, descricao, imagem) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, preco, descricao, imagem]
    );
    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    res.status(500).json({ erro: 'Erro ao adicionar produto' });
  }
});

// Rota PUT para editar produto
app.put('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, preco, descricao } = req.body;

  try {
    const resultado = await db.query(
      'UPDATE produtos SET nome = $1, preco = $2, descricao = $3 WHERE id = $4 RETURNING *',
      [nome, preco, descricao, id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.status(200).json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao editar produto:', error);
    res.status(500).json({ erro: 'Erro ao editar produto' });
  }
});

// Rota DELETE para excluir produto
app.delete('/produtos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Usa RETURNING para garantir que realmente excluiu e poder responder apropriadamente
    const resultado = await db.query('DELETE FROM produtos WHERE id = $1 RETURNING *', [id]);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    res.status(200).json({ mensagem: 'Produto excluído com sucesso', produto: resultado.rows[0] });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ erro: 'Erro ao excluir produto' });
  }
});

/* -------------------------
   ROTAS DE PEDIDOS
   ------------------------- */

// Rota para SALVAR pedidos
app.post("/pedidos", async (req, res) => {
  try {
    const { nome, email, celular, formaPagamento, endereco, bairro, cidade, estado, carrinho } = req.body;

    // Insere o pedido e retorna o ID
    const resultado = await db.query(
      `INSERT INTO pedidos (nome, email, celular, forma_pagamento, endereco, bairro, cidade, estado, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING id`,
      [nome, email, celular, formaPagamento, endereco, bairro, cidade, estado]
    );

    const pedidoId = resultado.rows[0].id;

    // Verificação do carrinho
    if (!Array.isArray(carrinho)) {
      console.error("Carrinho inválido:", carrinho);
      return res.status(400).json({ success: false, error: "Carrinho inválido" });
    }

    // Insere os itens do pedido
    for (const item of carrinho) {
      await db.query(
        `INSERT INTO itens_pedido (pedido_id, produto_id, nome, quantidade, preco)
         VALUES ($1, $2, $3, $4, $5)`,
        [pedidoId, item.id, item.nome, item.quantidade, item.preco]
      );
    }

    res.json({ success: true, pedidoId });

  } catch (error) {
    console.error("Erro ao finalizar pedido:", error);
    res.status(500).json({ success: false, error: "Erro ao finalizar pedido" });
  }
});

// Rota de LISTAGEM de pedidos
app.get("/pedidos", async (req, res) => {
  try {
    const resultado = await db.query("SELECT * FROM pedidos ORDER BY id DESC");
    const pedidos = resultado.rows;
    const resultados = [];

    for (const pedido of pedidos) {
      // Busca os produtos do pedido atual
      const produtos = await db.query(
        "SELECT * FROM itens_pedido WHERE pedido_id = $1",
        [pedido.id]
      );

      // Adiciona os produtos ao objeto do pedido
      pedido.produtos = produtos.rows;

      resultados.push(pedido);
    }

    res.json(resultados);
  } catch (error) {
    console.error("Erro ao listar pedidos:", error);
    res.status(500).json({ success: false, error: "Erro ao listar pedidos" });
  }
});

/* -------------------------
   START SERVER
   ------------------------- */
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});