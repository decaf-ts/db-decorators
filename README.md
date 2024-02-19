[![Banner](https://static.wixstatic.com/media/2844e6_eb52a8ed1a5249eb87ddc015c7be7ce2~mv2.jpg/v1/fill/w_438,h_156,al_c,q_80,usm_0.66_1.00_0.01/2021-01-21_11-35-06.webp)](https://www.glass-h2020.eu/)

#### Status
[![Build](https://gitlab.com/glass-project1/wallet/db-decorators/badges/master/pipeline.svg)](http://www.pdmfc.com)

![coverage](https://gitlab.com/glass-project1/wallet/db-decorators/badges/main/coverage.svg?job=coverage)



## DB Decorators

Extension to Decorator Validation with common db functionalities

This is a development repository and as such:
 - The Sync functionality is not properly tested. The ASYNC part is.
 - The logging decorators are not stable. Not to be used yet

Everything else is tested and working

### Installation

In order to use the db decorators package, we need to follow a list of steps presented below.

##### Step 1: Run npm install

To install as a dependency do:
```sh
$ npm install @glass-project1/db-decorators
```

To install as a dev dependency do:
```sh
$ npm install @glass-project1/db-decorators --save-dev
```
instead.




### Repository Structure

```
db-decorators
│
│   .gitignore              <-- Defines files ignored to git
│   .gitlab-ci.yml          <-- GitLab CI/CD config file
│   .nmpignore              <-- Defines files ignored by npm
│   .nmprc                  <-- Defines the Npm registry for this package
│   gulpfile.js             <-- Gulp build scripts. used in the 'build' and 'build:prod' npm scripts
│   jest.config.js          <-- Tests Configuration file
│   jsdocs.json             <-- Documentation generation configuration file
│   LICENCE.md              <-- Licence disclamer
│   nodemon.json            <-- Nodemon config file (allows to live test ts files)
│   package.json
│   package-lock.json
│   README.md               <-- Readme File dynamically compiled from 'workdocs' via the 'docs' npm script
│   tsconfig.json           <-- Typescript config file. Is overriden in 'gulpfile.js' 
│
└───bin
│   │   tag_release.sh      <-- Script to help with releases
│   
└───docs
│   │   ...                 <-- Dinamically generated folder, containing the compiled documentation for this repository. generated via the 'docs' npm script
│   
└───src
│   │   ...                 <-- Source code for this repository
│   
└───tests
│   │   ...                 <-- Test sources for this repository
│   
└───workdocs                <-- Folder with all pre-compiled documentation
|    │   ...
|    │   Readme.md           <-- Entry point to the README.md   
|
└───dist
|    |  ...                 <-- Dinamically generated folder containing the bundles for distribution
|
└───lib
    |   ...                 <-- Dinamically generated folder containing the compiled code
```

### Repository Languages

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![ShellScript](https://img.shields.io/badge/Shell_Script-121011?style=for-the-badge&logo=gnu-bash&logoColor=white)


### Related


### Social

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://pt.linkedin.com/company/pdmfc)

#### Disclaimer:

![Disclamer](https://static.wixstatic.com/media/2844e6_69acaab42d5a47c9a20a187b384741ef~mv2.png/v1/fill/w_531,h_65,al_c,q_85,usm_0.66_1.00_0.01/2021-01-21_11-27-05_edited.webp)
