require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use('/docs', express.static(path.join(__dirname, '..', '/jeve')));
app.use('/assets', express.static(path.join(__dirname, '..', '/jeve/assets')));
app.use('/docs', express.static('docs'));
app.set('etag', false);

const { handleGet, handlePost, handlePut, handlePatch, handleDelete } = require('./route');
const { createModelForName } = require('./models');
const { validType, isEmptyObject } = require('./helpers');

class Jeve {
  constructor(settings) {
    this.settings = settings;
    this.models = {};
  }

  // Logs
  log(...text) {
    console.log(chalk.gray(`[jeve] ${text}`));
  }
  warning(text) {
    console.log(chalk.yellow(`[jeve] warning - ${text}`));
  }
  error(text) {
    console.log(chalk.red(`[jeve] exit - ${text}`));
  }
  success(text) {
    console.log(chalk.green(`[jeve] ${text}`));
  }

  // Validation
  #validTypeLog(variable, name, type, error = false) {
    const valid = validType(variable, type);
    if (!valid && error) {
      this.error(`${name} needs to be "${type}"`);
    } else if (!valid) {
      this.warning(`${name} needs to be "${type}"`);
    }
    return valid;
  }
  #validateCustomRoute(args, functionName) {
    let message = `jeve.${functionName}`;
    if (!args.length) {
      message += '()';
      this.warning(`${message} is missing arguments`);
      return false;
    } else {
      if (validType(args[0], 'string')) {
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
      this.warning(`${message} has invalid first argument, string needs to contain "/"`);
      return false;
    }
    const names = args[0].split('/').filter((v) => v.length);
    const domain = this.settings?.domain;

    if (names.length === 1 && domain) {
      if (names[0] in domain) {
        this.warning(`conflict with custom route: \`/${names[0]}\` already exists in settings and will be skipped`);
        return false;
      }
    }

    return true;
  }

  // Run
  async run() {
    console.time('[jeve] initialization');
    this.success(`${new Date().toLocaleTimeString()} - starting jeve...`);
    if (!this.settings) return this.error('missing settings');
    this.#JSON_();
    const port = (process.env.PORT || this.settings.port) ?? 5000;
    if (!this.#validTypeLog(port, 'port', 'number', true)) return;
    const database = (process.env.DATABASE || this.settings.database) ?? 'mongodb://localhost';
    if (!this.#validTypeLog(database, 'database', 'string', true)) return;
    try {
      await mongoose.connect(database);
      this.success('connected to database');
    } catch (e) {
      return this.error(e);
    }
    this.success('initializing...');
    await this.#initialize();
    app.listen(port, () => {
      this.success(`running on port ${port}`);
    });
    console.timeEnd('[jeve] initialization');
  }

  // Create JSON API docs
  #JSON_() {
    const data = JSON.stringify(this.settings);
    if (!fs.existsSync('docs')) {
      fs.mkdirSync('docs');
    }
    if (!fs.existsSync('docs/api.json')) {
      this.#writeJSON(data);
    } else {
      const fileData = fs.readFileSync('docs/api.json', { encoding: 'utf-8' });
      if (fileData !== data) {
        this.#writeJSON(data);
      }
    }
  }
  #writeJSON(data) {
    fs.writeFileSync('docs/api.json', data, 'utf-8');
  }

  // Initialization
  #initialize() {
    const domain = this.settings.domain;
    return new Promise(async (resolve) => {
      if (!this.#validTypeLog(domain, 'domain', 'object')) return;
      for (const d in domain) {
        if (!this.#validTypeLog(domain[d], `domain.${d}`, 'object')) continue;

        const resourceMethods = this.settings.domain[d].resourceMethods ?? ['GET'];
        const itemMethods = this.settings.domain[d].itemMethods ?? ['GET'];
        if (!this.#validTypeLog(resourceMethods, `domain.${d}.resourceMethods`, 'array')) continue;
        if (!this.#validTypeLog(itemMethods, `domain.${d}.resourceMethods`, 'array')) continue;

        const resourceMethodsMap = resourceMethods.map((v, i) => {
          if (!this.#validTypeLog(v, `domain.${d}.resourceMethods.${i}`, 'string')) {
            return v.toUpperCase();
          } else {
            return v;
          }
        });
        const itemMethodsMap = itemMethods.map((v, i) => {
          if (!this.#validTypeLog(v, `domain.${d}.itemMethods.${i}`, 'string')) {
            return v.toUpperCase();
          } else {
            return v;
          }
        });
        const validMethods = [];
        for (const r of resourceMethodsMap) {
          const validResourceMethods = ['GET', 'POST'];
          if (!validResourceMethods.includes(r)) {
            this.warning(`domain.${d}.resourceMethods contains unknown value "${r}"`);
            continue;
          }
          validMethods.push(r);
        }
        for (const i of itemMethodsMap) {
          const validItemMethods = ['GET', 'PUT', 'PATCH', 'DELETE'];
          if (!validItemMethods.includes(i)) {
            this.warning(`domain.${d}.itemMethods contains unknown value "${i}"`);
            continue;
          }
          validMethods.push(i);
        }
        app.use(`/${d}/:id?`, (req, res, next) => {
          const { id } = req.params;
          if (id && !validType(id, 'objectid')) {
            return res.sendStatus(404);
          }
          if (id && !itemMethodsMap.includes(req.method)) {
            return res.sendStatus(404);
          }
          if (!id && !resourceMethodsMap.includes(req.method)) {
            return res.sendStatus(404);
          }
          next();
        });
        const combinedMethods = Array.from(new Set(validMethods));
        for (const m of combinedMethods) {
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
          await this.#createRoute(m.toLowerCase(), d, preHandler);
        }
        this.log(`created route(s) for - ${d}`);
        const schema = this.settings.domain[d].schema;
        const validSchema = this.#validTypeLog(schema, `domain.${d}.schema`, 'object');
        if (!validSchema) continue;
        if (isEmptyObject(schema)) {
          this.warning(`domain.${d}.schema is empty`);
          continue;
        }
        await this.createModelForName(d);
      }
      resolve();
    });
  }

  // Create Routes
  #createRoute(route, domain, preHandler) {
    return new Promise((resolve) => {
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

  // Custom routes
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

  // Access models
  model(model) {
    if (model && this.models[model]) {
      return this.models[model];
    }
    return undefined;
  }
}

Jeve.prototype.handleGet = handleGet;
Jeve.prototype.handlePost = handlePost;
Jeve.prototype.handlePut = handlePut;
Jeve.prototype.handlePatch = handlePatch;
Jeve.prototype.handleDelete = handleDelete;
Jeve.prototype.createModelForName = createModelForName;

module.exports = Jeve;
