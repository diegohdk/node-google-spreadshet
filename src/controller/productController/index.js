/* eslint-disable no-restricted-globals */
/* eslint-disable class-methods-use-this */
const cosmosService = require('../../service/cosmosservice');
const { Context, Product } = require('../../service/googlesheetsservice');
const customError = require('../../util/error');

class ProductController {
  async getAll(request, response) {
    const context = new Context(new Product());
    const data = await context.getAll().catch((error)=> error);
    if (data.error) {
      response.writeHead(data.details.status);
    }
    return response.end(JSON.stringify(data));
  }

  async getByDescription(request, response) {
    const context = new Context(new Product());
    const { description, database } = request.params;
    if (description) {
      let data = {};
      if (database && database.toUpperCase() === 'COSMOS') {
        data = await cosmosService.getByDescription(description).catch((error)=> error);
      } else {
        data = await context.getByDescription(description).catch((error)=> error);
      }
      if (data && data.error) {
        response.writeHead(data.details.status);
      }
      return response.end(JSON.stringify(data));
    }
    response.writeHead(400);
    return response.end(JSON.stringify({
      error: 'Ops! Erro no envio dos parâmetros',
      details: { ...customError[400], data: 'Enviar parametro description' },
    }));
  }

  async getById(request, response) {
    const context = new Context(new Product());
    const { id } = request.path;
    let data = await context.getById(id).catch((error)=> error);
    if (!data.error) {
      return response.end(JSON.stringify(data));
    }
    data = await cosmosService.geBytLins(id).catch((error)=> error);
    if (data.error) {
      response.writeHead(data.details.status);
    } else {
      /*
        Não foi utilizado o await pois não é necessário aguardar o cadastro para enviar a resposta ao usuário
      */
      context.create(data).then((product)=> console.log('Cadastro no GoogleSheets: OK', product)).catch((error)=> console.log('Cadastro no GoogleSheet: Fail', JSON.stringify(error)));
    }
    return response.end(JSON.stringify(data));
  }

  async getNextPage(request, response) {
    const { nextUrl } = request.params;
    const custom = {};
    if (nextUrl) {
      custom.status = 200;
      custom.data = await cosmosService.getByNextPage(nextUrl);
      if (custom.data.error) {
        custom.status = custom.data.details.status;
      }
      response.writeHead(custom.status);
      return response.end(JSON.stringify(custom.data));
    }
    response.writeHead(400);
    return response.end(JSON.stringify({
      error: 'Ops! Erro no envio dos parâmetros',
      details: { ...customError[400], data: 'Enviar parametro nextUrl' },
    }));
  }

  async delete(request, response) {
    const context = new Context(new Product());
    const { id } = request.path;
    /*
      Além de verificar se o parâmetro foi enviado, é verificado se o mesmo é um número
    */
    if (id && (!isNaN(id))) {
      const data = await context.delete(id).catch((error)=> error);
      if (data.error) {
        response.writeHead(data.details.status);
      }
      return response.end(JSON.stringify(data));
    }
    response.writeHead(404);
    return response.end(JSON.stringify({
      error: 'Ops! Não foi encontrado um produto com os dados enviados',
      details: customError[404],
    }));
  }
}

module.exports = new ProductController();
