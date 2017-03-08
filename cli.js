#!/usr/bin/env node

const argv = require('yargs').argv;
const axios = require('axios');

const [ firstPackage, secondPackage ] = argv._;

if(!firstPackage || !secondPackage) {
  console.log('Please specify package');
  return;
}

console.log('You are comparing', firstPackage, secondPackage);

// Stats to compare
// name, version, description, rating, author, created, modified, downloads, stars, issues, repository, dependencies

const getPackageDetails = package => {
  const url = `https://api.npms.io/v2/package/${package}`;
  return axios.get(url)
    .then(res => {
      if(res.status !== 200) return Promise.reject(res.data.message);
      return res.data;
    })
    .then(data => {
      const package = extractDetails(data);
      console.log(package);
    })
    .catch(err => {
      console.log(err);
    });
}

const extractDetails = bloated => {
  const { metadata: { name, version, description, date, author, links, dependencies } } = bloated.collected;
  const package = { name, version, description, modified: date, author: author.name, repository: links.repository, dependencies: Object.keys(dependencies).length };
  return package;
}

getPackageDetails(firstPackage)
