const fs = require('fs'); 
const fsPromises = fs.promises;
const path = require('path');

fs.promises.access(path.join(__dirname, 'database/contacts.json'), fs.constants.W_OK)
.then(() => console.log('Can be accessed'))
.catch(() => console.error('Can not be accessed')); 