'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const APP_JS = path.join(__dirname, '..', 'public', 'app.js');

function lift(name) {
  const code = fs.readFileSync(APP_JS, 'utf-8');
  const match = code.match(new RegExp(`function ${name}\\([^{]*\\{([\\s\\S]*?\\n\\})`));
  if (!match) throw new Error(`Could not find ${name} in app.js`);
  return vm.runInContext(`${match[0]}\n\n${name};`, vm.createContext({}));
}

const chooseDefaultBase = lift('chooseDefaultBase');

test('a fork compares against upstream default before its own origin default', () => {
  const refs = {
    current: 'feature/fix',
    branches: [{ name: 'feature/fix' }],
    remotes: [{ name: 'origin/main' }, { name: 'upstream/main' }],
    defaults: { origin: 'origin/main', upstream: 'upstream/main' }
  };

  assert.equal(chooseDefaultBase(refs), 'upstream/main');
});

test('the recorded origin default supports branches named trunk', () => {
  const refs = {
    current: 'feature/fix',
    branches: [{ name: 'feature/fix' }],
    remotes: [{ name: 'origin/trunk' }],
    defaults: { origin: 'origin/trunk' }
  };

  assert.equal(chooseDefaultBase(refs), 'origin/trunk');
});

test('known branch names remain the fallback without remote HEAD metadata', () => {
  const refs = {
    current: 'feature/fix',
    branches: [{ name: 'main' }, { name: 'feature/fix' }],
    remotes: [{ name: 'origin/main' }],
    defaults: {}
  };

  assert.equal(chooseDefaultBase(refs), 'origin/main');
});
