const express = require('express');
const chalk = require('chalk');
const app = express();

class Jeve {
  constructor(settings) {
    this.settings = settings;
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
  validType(variable, name, type, error = false) {
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
      default:
        valid = false;
        break;
    }
    if (!valid && !error) {
      this.warning(`${name} needs to be "${type}"`);
    } else if (!valid) {
      this.error(`${name} needs to be "${type}"`);
    }
    return valid;
  }

  // Run
  async run() {
    const port = this.settings?.port ?? 5000;
    if (!this.validType(port, 'port', 'number', true)) return;
    this.success('initializing...');
    this.initialize();
    app.listen(port, () => {
      this.success('running on port ' + port);
    });
  }

  // Initialization
  initialize() {
    if (!this.settings) return this.warning('missing settings');
    const domain = this.settings.domain;
    if (!this.validType(domain, 'domain', 'object')) return;
    for (const d in domain) {
      if (!this.validType(domain[d], `domain.${d}`, 'object')) break;

      const resourceMethods = this.settings.domain[d].resourceMethods ?? ['GET'];
      if (!this.validType(resourceMethods, `domain.${d}.resourceMethods`, 'array')) break;
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
      if (!this.validType(schema, `domain.${d}.schema`, 'object')) break;
    }
  }

  // Create Routes
  createRoute(route, domain) {
    app[route](`/${domain}`, (req, res) => {
      res.send(domain);
    });
  }
}

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
