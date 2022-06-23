/* eslint-disable no-restricted-globals */
/* eslint-disable class-methods-use-this */
const { Context, Market } = require('../../service/googlesheetsservice');
const customError = require('../../util/error');

class MarketController {
  async getAll(request, response) {
    const context = new Context(new Market());
    const data = await context.getAll().catch((error)=> error);
    if (data.error) {
      response.writeHead(data.details.status);
    }
    return response.end(JSON.stringify(data));
  }

  async getById(request, response) {
    const context = new Context(new Market());
    const { cnpj } = request.path;
    if (cnpj) {
      const data = await context.getById(cnpj).catch((error)=> error);
      if (data && data.error) {
        response.writeHead(data.details.status);
      }
      return response.end(JSON.stringify(data));
    }
    response.writeHead(404);
    return response.end(JSON.stringify({
      error: 'Ops! Não foi encontrado um mercado com os dados enviados',
      details: customError[404],
    }));
  }

  async save(request, response) {
    const context = new Context(new Market());
    const { body } = request;
    const data = await context.create(body).catch((error)=> error);
    if (data && data.error) {
      response.writeHead(data.details.status);
    }
    return response.end(JSON.stringify(data));
  }

  async delete(request, response) {
    const context = new Context(new Market());
    const { cnpj } = request.path;
    if (cnpj) {
      const data = await context.delete(cnpj).catch((error)=> error);
      if (data && data.error) {
        response.writeHead(data.details.status);
      }
      return response.end(JSON.stringify(data));
    }
    response.writeHead(404);
    return response.end(JSON.stringify({
      error: 'Ops! Não foi encontrado um mercado com os dados enviados',
      details: customError[404],
    }));
  }
}

module.exports = new MarketController();
