#!/usr/bin/env node

const argv = require('yargs').argv;
const axios = require('axios');
const distanceInWordsToNow = require('date-fns/distance_in_words_to_now');
const Table = require('cli-table2');
const chalk = require('chalk');
const packageNames = argv._;

function getPackageDetails(name) {
  const url = `https://api.npms.io/v2/package/${encodeURIComponent(name)}`;
  return axios
    .get(url)
    .then(res => {
      if (res.status !== 200) return Promise.reject(res.data.message);
      return res.data;
    })
    .then(mapResponseToPackage)
    .catch(err => {
      console.log('Could not fetch package details!');
    });
}

/*
  Stats that are compared:
  name, version, description, rating, author, modified, downloads, stars, issues, repository, dependencies
*/
function mapResponseToPackage(response) {
  const {
    metadata: {
      name,
      version = '',
      description = '',
      author = { name: '' },
      date,
      links = { repository: '' },
      dependencies = {},
    },
    npm = { downloads: 0 },
    github = { starsCount: 0, issues: { openCount: 0 } },
  } = response.collected;

  const [daily = 0, weekly = 0, monthly = 0] = npm.downloads.map(
    data => data.count,
  );

  const package = {
    name,
    description,
    version,
    rating: formatRating(response.score.final),
    modified: distanceInWordsToNow(date),
    author: author.name,
    repository: links.repository,
    dependencies: Object.keys(dependencies).length,
    stars: github.starsCount,
    issues: github.issues.openCount,
    daily,
    weekly,
    monthly,
  };

  return package;
}

function formatRating(rating = 0) {
  return parseFloat(Math.round(rating * 1000) / 100).toFixed(2);
}

function printTable(packages) {
  const table = new Table();

  const keys = Object.keys(packages[0]);

  keys.forEach(function(key, index) {
    if (index === 0) {
      table.push({
        [chalk.red(key.toUpperCase())]: packages.map(package =>
          chalk.blue(package[key]),
        ),
      });
    } else {
      let highest = undefined;
      let lowest = undefined;
      packages.map(function(package, index) {
        if (['stars', 'daily', 'weekly', 'monthly', 'rating'].includes(key)) {
          if (highest === undefined) {
            highest = 0;
          }
          if (package[key] > packages[highest][key]) {
            highest = index;
          }
        }
        if (['dependencies', 'issues'].includes(key)) {
          if (lowest === undefined) {
            lowest = 0;
          }
          if (package[key] <= packages[lowest][key]) {
            lowest = index;
          }
        }
        return package[key];
      });
      table.push({
        [chalk.red(key.toUpperCase())]: packages.map(function(package, index) {
          if (['issues', 'stars', 'daily', 'weekly', 'monthly'].includes(key)) {
            package[key] = package[key].toLocaleString('en');
          }
          if (highest !== undefined) {
            if (index === highest || package[key] === packages[highest][key]) {
              return chalk.green(package[key]);
            } else {
              return chalk.red(package[key]);
            }
          } else if (lowest !== undefined) {
            if (index === lowest || package[key] === packages[lowest][key]) {
              return chalk.green(package[key]);
            } else {
              return chalk.red(package[key]);
            }
          } else {
            return package[key];
          }
        }),
      });
    }
  });

  console.log(table.toString());
}

function init() {
  Promise.all(packageNames.map(getPackageDetails))
    .then(printTable)
    .catch(err => {
      console.log('Oops, looks like the comparison failed');
    });
}

init();
