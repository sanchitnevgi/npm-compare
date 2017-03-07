const argv = require('yargs').argv;
const axios = require('axios');

const [ firstPackage, secondPackage ] = argv._;

const getPackage = package => {
  const url = ``;
  return axios.get(url);
}
