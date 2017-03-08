#!/usr/bin/env node

const argv = require('yargs').argv;
const axios = require('axios');

const [ firstPackage, secondPackage ] = argv._;

console.log('You are comparing', firstPackage, secondPackage);

