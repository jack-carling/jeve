const express = require('express');
const chalk = require('chalk');
const mongoose = require('mongoose');
const app = express();

const { validateParam } = require('./route');

class Jeve {
  constructor(settings) {
    this.settings = settings;
    this.models = {};
  }

  // Logs
  log(...text) {
    console.log(`[jeve] ${text}`);
  }
  warning(text) {
    console.log(chalk.yellowBright(`[jeve] warning - ${text}`));
  }
  error(text) {
    console.log(chalk.redBright(`[jeve] exit - ${text}`));
  }
  success(text) {
    console.log(chalk.green(`[jeve] ${text}`));
  }

  // Validation
  validTypeLog(variable, name, type, error = false) {
    const valid = this.validType(variable, type);
    if (!valid && error) {
      this.error(`${name} needs to be "${type}"`);
    } else if (!valid) {
      this.warning(`${name} needs to be "${type}"`);
    }
    return valid;
  }
  validType(variable, type) {
    let valid;
    switch (type) {
      case 'string':
        valid = typeof variable === 'string';
        break;
      case 'number':
        valid = typeof variable === 'number';
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
      default:
        valid = false;
        break;
    }
    return valid;
  }

  // Run
  async run() {
    if (!this.settings) return this.error('missing settings');
    const port = this.settings.port ?? 5000;
    if (!this.validTypeLog(port, 'port', 'number', true)) return;
    const database = this.settings.database ?? 'mongodb://127.0.0.1:27017/';
    if (!this.validTypeLog(database, 'database', 'string', true)) return;
    try {
      await mongoose.connect(database);
      this.success('connected to database');
    } catch (e) {
      return this.error(e);
    }
    this.success('initializing...');
    this.initialize();
    app.listen(port, () => {
      this.success('running on port ' + port);
    });
  }

  // Initialization
  initialize() {
    const domain = this.settings.domain;
    if (!this.validTypeLog(domain, 'domain', 'object')) return;
    for (const d in domain) {
      if (!this.validTypeLog(domain[d], `domain.${d}`, 'object')) break;

      const resourceMethods = this.settings.domain[d].resourceMethods ?? ['GET'];
      if (!this.validTypeLog(resourceMethods, `domain.${d}.resourceMethods`, 'array')) break;
      if (!resourceMethods.length) {
        this.warning(`domain.${d}.resourceMethods is empty, defaults to "GET"`);
        resourceMethods.push('GET');
      }
      for (const r of resourceMethods) {
        const validResourceMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
        if (!validResourceMethods.includes(r.toUpperCase())) {
          this.warning(`domain.${d}.resourceMethods contains unknown value "${r}"`);
          continue;
        }
        this.createRoute(r.toLowerCase(), d);
      }

      const schema = this.settings.domain[d].schema;
      if (!this.validTypeLog(schema, `domain.${d}.schema`, 'object')) break;
    }
  }

  // Create Routes
  createRoute(route, domain) {
    app.param('id', (req, res, next, value) => {
      const validation = this.validateParam(req.method, value);
      if (!validation.success) {
        return res.status(400).json({ _success: validation.success, _message: validation.message });
      }
      next();
    });
    app[route](`/${domain}/:id?`, (req, res) => {
      res.json({ resource: domain, params: req.params });
    });
  }
}

Jeve.prototype.validateParam = validateParam;

const settings = {
  domain: {
    people: {
      resourceMethods: ['GET', 'POST'],
      schema: {},
    },
  },
};

const jeve = new Jeve(settings);
jeve.run();
