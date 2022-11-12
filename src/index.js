const express = require("express");
const server = express();
server.use(express.json());

const { v4: uuid } = require("uuid");
const customers = [];

function verificarSeUsuarioExiste(req,res,next){
  const { cpf } = req.headers;
  const customer = customers.find( data => data.cpf === cpf )

  if(!customer){
    return res.status(400).json({error: "Não existe uma conta com esse CPF"})
  }

  req.customer = customer;

  return next();
}

function pegarSaldo(statement){
  const saldo = statement.reduce((acc, operation) => {
      if(operation.type === "credit"){
        return acc + operation.amount
      }else {
        return acc - operation.amount
      }
  }, 0)

  return saldo;
}

server.post("/usuario", (req, res) => {
  const { cpf,name }= req.body;

  const contaJaExiste = customers.some( data => data.cpf === cpf )

  if(contaJaExiste){
    return res.status(400).json({error:"Uma conta com esse CPF já existe."})
  }

  customers.push({
    cpf,
    name,
    ID: uuid(),
    statement: []
  });

  return res.status(201).json({OK: "conta criada"})
})

server.use(verificarSeUsuarioExiste);

server.get("/extrato", (req, res) => {
  const { customer } = req;
  return res.json(customer.statement);
})

server.post("/fazerDeposito", (req,res) => {
  const { description, amount } = req.body;
  const { customer } = req;

  const depositoOperacao = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(depositoOperacao);

  return res.status(201).send();
})

server.post("/fazerSaque", (req, res ) => {
  const { amount } = req.body;
  const { customer } = req;

  const saldo = pegarSaldo(customer.statement);

  if(saldo < amount) {
    return res.status(400).json({error: "saldo insuficiente"})
  }

  const depositoOperacao = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(depositoOperacao)

  return res.status(201).send()
})

server.get("/extrato/data", (req, res) => {
  const { customer } = req;
  const { date } = req.query;
  
  const dateFormat = new Date( date + " 00:00" );

  const extrato = customer.statement.filter(data => 
  data.created_at.toDateString() === new Date(dateFormat).toDateString());

  return res.json(extrato)
})

server.put("/usuario", (req, res) => {
  const { customer } = req;
  const { name } = req.body;

  if(name === "" || name === undefined){
    return res.status(400).json({error: "Coloque um nome válido"})
  }

  customer.name = name;

  return res.status(201).send();
})

server.get("/usuario", (req, res) => {
  const { customer } = req;

  return res.json(customer)
})

server.delete("/usuario", (req, res) => {
  const { customer } = req;

  customer.splice(customer,1);

  return res.status(204).send()
})

server.get("/saldo", (req, res) => {
  const { customer } = req;
  const saldo = pegarSaldo(customer.statement);

  return res.json(saldo)

})

server.listen(3333);