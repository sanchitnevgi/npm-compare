#!/usr/bin/env node

const argv = require('yargs').argv;
const axios = require('axios');
const distanceInWordsToNow = require('date-fns/distance_in_words_to_now');
const Table = require('cli-table');

const packageNames = argv._;

const isValidPackageName = name => !name;

// Stats to compare
// name, version, description, rating, created, modified, downloads, stars, issues, repository, dependencies

const getPackageDetails = name => {
  const url = `https://api.npms.io/v2/package/${name}`;
  return axios.get(url)
    .then(res => {
      if(res.status !== 200) return Promise.reject(res.data.message);
      return res.data;
    })
    .then(data => {
      const package = mapResponseToPackage(data);
      return package;
    })
    .catch(err => {
      console.log(err);
    });
}

const mapResponseToPackage = response => {
  const { metadata: { name, version, description, date, links, dependencies },
          npm, github } = response.collected;
  
  const [ daily, weekly, monthly ] = npm.downloads.map(data => data.count);

  const downloads = { daily, weekly, monthly };

  const package = { name, version, description, modified: distanceInWordsToNow(date),
                    repository: links.repository, dependencies: Object.keys(dependencies).length,
                    stars: github.starsCount, issues: github.issues.openCount,
                    downloads, rating: formatRating(response.score.final) };

  return package;
}

const formatRating = rating => {
  return parseFloat(Math.round(rating*1000)/100).toFixed(2);
}

const printTable = (packages) => {
  
  const table = new Table();
  
  const keys = Object.keys(packages[0]);
  
  keys.forEach(key => table.push({ [key.toUpperCase()]: packages.map(package => package[key]) }));

  console.log(table.toString());  
}

const init = () => {
  
  Promise.all(packageNames.map(getPackageDetails))
  .then(packages => {
    printTable(packages);
  })
  .catch(err => {
    console.log('Oops, looks like the comparison failed');
  })

}

init();
