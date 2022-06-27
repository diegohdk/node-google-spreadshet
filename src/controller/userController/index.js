/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-globals */
/* eslint-disable class-methods-use-this */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Context, User } = require('../../service/googlesheetsservice');
const customError = require('../../util/error');

class UserController {
  _checkAdministrador(request, response) {
    response.writeHead(403);
    return response.end(JSON.stringify({
      error: 'Ops! Usuário sem autorização para a operação',
      details: customError[403],
    }));
  }

  _checkLogin(request, response) {
    response.writeHead(401);
    return response.end(JSON.stringify({
      error: 'Ops! Usuário não autenticado',
      details: customError[401],
    }));
  }

  async getAll(request, response) {
    const { user } = request;
    if (!user.role) {
      return this._checkLogin(request, response);
    }
    if (user.role !== 'administrador') {
      return this._checkAdministrador(request, response);
    }
    const context = new Context(new User());
    const data = await context.getAll().catch((error)=> error);
    if (data && data.error) {
      response.writeHead(data.details.status);
    }
    return response.end(JSON.stringify(data));
  }

  async getById(request, response) {
    const { user } = request;
    if (!user.role) {
      return this._checkLogin(request, response);
    }
    if (user.role !== 'administrador') {
      return this._checkAdministrador(request, response);
    }
    const context = new Context(new User());
    const { email } = request.params;
    if (email) {
      const data = await context.getById(email).catch((error)=> error);
      if (data && data.error) {
        response.writeHead(data.details.status);
      }
      return response.end(JSON.stringify(data));
    }
    response.writeHead(404);
    return response.end(JSON.stringify({
      error: 'Ops! Não foi encontrado um usuario com os dados enviados',
      details: customError[404],
    }));
  }

  async save(request, response) {
    const context = new Context(new User());
    const { body } = request;
    const data = await context.create(body).catch((error)=> error);
    if (data && data.error) {
      response.writeHead(data.details.status);
      return response.end(JSON.stringify(data));
    }
    return response.end(JSON.stringify({
      usuario: data,
      token: jwt.sign({ email: data.emailUsuario, role: data.roleUsuario }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRESIN,
      }),
    }));
  }

  async delete(request, response) {
    const { user } = request;
    if (!user.role) {
      return this._checkLogin(request, response);
    }
    if (user.role !== 'administrador') {
      return this._checkAdministrador(request, response);
    }
    const context = new Context(new User());
    const { email } = request.params;
    if (email) {
      const data = await context.delete(email).catch((error)=> error);
      if (data && data.error) {
        response.writeHead(data.details.status);
      }
      return response.end(JSON.stringify(data));
    }
    response.writeHead(404);
    return response.end(JSON.stringify({
      error: 'Ops! Não foi encontrado um usuario com os dados enviados',
      details: customError[404],
    }));
  }

  async login(request, response) {
    const { email, senha } = request.body;
    if (!email || !senha) {
      response.writeHead(400);
      return response.end(JSON.stringify({
        error: 'Ops! Favor enviar os dados corretamente',
        details: { ...customError[400], data: 'Verificar os campos email e senha' },
      }));
    }
    try {
      const context = new Context(new User());
      const user = await context.getById(email);
      if (user) {
        if (await bcrypt.compare(senha, user.senhaUsuario)) {
          const {
            nomeUsuario, emailUsuario, roleUsuario,
          } = user;
          return response.end(JSON.stringify({
            usuario: {
              emailUsuario,
              nomeUsuario,
            },
            token: jwt.sign({ email: emailUsuario, role: roleUsuario }, process.env.JWT_SECRET, {
              expiresIn: process.env.JWT_EXPIRESIN,
            }),
          }));
        }
        response.writeHead(400);
        return response.end(JSON.stringify({
          error: 'Ops! Senha ou email incorretos',
          details: customError[400],
        }));
      }
      response.writeHead(404);
      return response.end(JSON.stringify({
        error: 'Ops! Usuário não encontrado',
        details: customError[404],
      }));
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = new UserController();
