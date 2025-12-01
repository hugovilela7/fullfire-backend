const express = require("express");
const cors = require("cors");
const db = require("./db");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/* -------------------------
   PRODUTOS
------------------------- */
app.get("/produtos", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM produtos ORDER BY id DESC");
    res.json(rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao buscar produtos" });
  }
});

app.post("/produtos", async (req, res) => {
  const { nome, preco, descricao, imagem } = req.body;
  try {
    const { rows } = await db.query(
      "INSERT INTO produtos (nome, preco, descricao, imagem) VALUES ($1,$2,$3,$4) RETURNING *",
      [nome, preco, descricao, imagem]
    );
    res.json(rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao adicionar produto" });
  }
});

app.put("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, preco, descricao, imagem } = req.body;
  try {
    const { rows } = await db.query(
      "UPDATE produtos SET nome=$1, preco=$2, descricao=$3, imagem=$4 WHERE id=$5 RETURNING *",
      [nome, preco, descricao, imagem, id]
    );
    res.json(rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao editar produto" });
  }
});

app.delete("/produtos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM produtos WHERE id=$1", [id]);
    res.json({ mensagem: "Produto excluído com sucesso" });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao excluir produto" });
  }
});

/* -------------------------
   PEDIDOS
------------------------- */
app.post("/pedidos", async (req, res) => {
  try {
    const { nome, email, celular, endereco, bairro, cidade, estado, formaPagamento, carrinho } = req.body;

    const { rows } = await db.query(
      "INSERT INTO pedidos (nome,email,celular,endereco,bairro,cidade,estado,forma_pagamento,data) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING id",
      [nome,email,celular,endereco,bairro,cidade,estado,formaPagamento]
    );

    const pedidoId = rows[0].id;

    for (const item of carrinho) {
      await db.query(
        "INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco) VALUES ($1,$2,$3,$4)",
        [pedidoId, item.id, item.quantidade, item.preco]
      );
    }

    res.json({ success: true, pedidoId });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ success: false, erro: "Erro ao criar pedido" });
  }
});

app.get("/pedidos", async (req, res) => {
  try {
    const { rows: pedidos } = await db.query("SELECT * FROM pedidos ORDER BY id DESC");
    const resultados = [];

    for (const pedido of pedidos) {
      const { rows: itens } = await db.query("SELECT * FROM itens_pedido WHERE pedido_id=$1", [pedido.id]);
      pedido.itens = itens;
      resultados.push(pedido);
    }

    res.json(resultados);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro ao listar pedidos" });
  }
});

app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));