require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());
app.set('etag', false);

const { validateParam, handleGet, handlePost, handlePut, handlePatch, handleDelete } = require('./route');
const { createModelForName } = require('./models');

class Jeve {
  constructor(settings) {
    this.settings = settings;
    this.models = {};
  }

  // Logs
  #log(...text) {
    console.log(chalk.gray(`[jeve] ${text}`));
  }
  #warning(text) {
    console.log(chalk.yellow(`[jeve] warning - ${text}`));
  }
  #error(text) {
    console.log(chalk.red(`[jeve] exit - ${text}`));
  }
  #success(text) {
    console.log(chalk.green(`[jeve] ${text}`));
  }

  // Validation
  #validTypeLog(variable, name, type, error = false) {
    const valid = this.validType(variable, type);
    if (!valid && error) {
      this.#error(`${name} needs to be "${type}"`);
    } else if (!valid) {
      this.#warning(`${name} needs to be "${type}"`);
    }
    return valid;
  }
  #validateCustomRoute(args, functionName) {
    let message = `jeve.${functionName}`;
    if (!args.length) {
      message += '()';
      this.#warning(`${message} is missing arguments`);
      return false;
    } else {
      if (this.validType(args[0], 'string')) {
        message += `('${args[0]}'`;
      } else {
        message += `(${args[0]}`;
      }
      if (args.length > 1) {
        message += `, ...)`;
      } else {
        message += `)`;
      }
    }

    if (!this.#validTypeLog(args[0], `${message} has invalid first argument,`, 'string')) {
      return false;
    }

    if (!args[0].includes('/')) {
      this.#warning(`${message} has invalid first argument, string needs to contain "/"`);
      return false;
    }
    const names = args[0].split('/').filter((v) => v.length);
    const domain = this.settings?.domain;

    if (names.length === 1 && domain) {
      if (names[0] in domain) {
        this.#warning(`conflict with custom route: \`/${names[0]}\` already exists in settings and will be skipped`);
        return false;
      }
    }

    return true;
  }
  validType(variable, type) {
    let valid;
    switch (type) {
      case 'string':
        valid = typeof variable === 'string';
        break;
      case 'number':
        valid = typeof Number(variable) === 'number' && !Number.isNaN(Number.parseInt(variable, 10));
        break;
      case 'object':
        valid = typeof variable === 'object' && !(variable instanceof Array) && variable !== null;
        break;
      case 'boolean':
        valid = typeof variable === 'boolean';
        break;
      case 'array':
        valid = variable instanceof Array;
        break;
      case 'objectid':
        valid = mongoose.isValidObjectId(variable);
        break;
      case 'function':
        valid = typeof variable === 'function';
        break;
      default:
        valid = false;
        break;
    }
    return valid;
  }

  // Check empty object
  isEmptyObject(object) {
    return Object.keys(object).length === 0;
  }

  // Run
  async run() {
    console.time('[jeve] initialization');
    this.#success(`${new Date().toLocaleTimeString()} - starting jeve...`);
    if (!this.settings) return this.#error('missing settings');
    const port = (process.env.PORT || this.settings.port) ?? 5000;
    if (!this.#validTypeLog(port, 'port', 'number', true)) return;
    const database = (process.env.DATABASE || this.settings.database) ?? 'mongodb://localhost';
    if (!this.#validTypeLog(database, 'database', 'string', true)) return;
    try {
      await mongoose.connect(database);
      this.#success('connected to database');
    } catch (e) {
      return this.#error(e);
    }
    this.#success('initializing...');
    await this.#initialize();
    app.listen(port, () => {
      this.#success(`running on port ${port}`);
    });
    console.timeEnd('[jeve] initialization');
  }

  // Initialization
  #initialize() {
    const domain = this.settings.domain;
    return new Promise(async (resolve) => {
      if (!this.#validTypeLog(domain, 'domain', 'object')) return;
      for (const d in domain) {
        if (!this.#validTypeLog(domain[d], `domain.${d}`, 'object')) continue;

        const resourceMethods = this.settings.domain[d].resourceMethods ?? ['GET'];
        if (!this.#validTypeLog(resourceMethods, `domain.${d}.resourceMethods`, 'array')) continue;
        if (!resourceMethods.length) {
          this.#warning(`domain.${d}.resourceMethods is empty, defaults to "GET"`);
          resourceMethods.push('GET');
        }
        for (const r of resourceMethods) {
          const validResourceMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
          if (!validResourceMethods.includes(r.toUpperCase())) {
            this.#warning(`domain.${d}.resourceMethods contains unknown value "${r}"`);
            continue;
          }
          let preHandler = domain[d].preHandler;
          if (preHandler) {
            if (!this.#validTypeLog(preHandler, `domain.${d}.preHandler`, 'function')) {
              preHandler = (req, res, next) => {
                next();
              };
            }
          } else {
            preHandler = (req, res, next) => {
              next();
            };
          }
          await this.#createRoute(r.toLowerCase(), d, preHandler);
        }
        this.#log(`created route(s) for - ${d}`);
        const schema = this.settings.domain[d].schema;
        const validSchema = this.#validTypeLog(schema, `domain.${d}.schema`, 'object');
        if (!validSchema) continue;
        if (this.isEmptyObject(schema)) {
          this.#warning(`schema for ${d} is empty`);
          continue;
        }
        await this.createModelForName(d);
        this.#log(`created model for - ${d}`);
      }
      resolve();
    });
  }

  // Create Routes
  #createRoute(route, domain, preHandler) {
    return new Promise((resolve) => {
      app.param('id', (req, res, next, value) => {
        const validation = this.validateParam(req.method, value);
        if (!validation.success) {
          return res.status(400).json({ _success: validation.success, _error: validation.error });
        }
        next();
      });
      app[route](`/${domain}/:id?`, preHandler, (req, res) => {
        if (req.method === 'GET') {
          this.handleGet(req, res, domain);
        } else if (req.method === 'POST') {
          this.handlePost(req, res, domain);
        } else if (req.method === 'PUT') {
          this.handlePut(req, res, domain);
        } else if (req.method === 'PATCH') {
          this.handlePatch(req, res, domain);
        } else if (req.method === 'DELETE') {
          this.handleDelete(req, res, domain);
        } else {
          res.status(501).json({ _success: false, _error: `Method \`${req.method} is not yet implemented.` });
        }
      });
      resolve();
    });
  }

  get(...args) {
    if (this.#validateCustomRoute(args, 'get')) return app.get(...args);
  }
  post(...args) {
    if (this.#validateCustomRoute(args, 'post')) return app.post(...args);
  }
  put(...args) {
    if (this.#validateCustomRoute(args, 'put')) return app.put(...args);
  }
  patch(...args) {
    if (this.#validateCustomRoute(args, 'patch')) return app.patch(...args);
  }
  delete(...args) {
    if (this.#validateCustomRoute(args, 'delete')) return app.delete(...args);
  }

  model(model) {
    if (model && this.models[model]) {
      return this.models[model];
    }
    return undefined;
  }
}

Jeve.prototype.validateParam = validateParam;
Jeve.prototype.handleGet = handleGet;
Jeve.prototype.handlePost = handlePost;
Jeve.prototype.handlePut = handlePut;
Jeve.prototype.handlePatch = handlePatch;
Jeve.prototype.handleDelete = handleDelete;
Jeve.prototype.createModelForName = createModelForName;

module.exports = Jeve;
