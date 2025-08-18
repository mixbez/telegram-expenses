// run `node index.js` in the terminal

console.log(`Hello Node.js v${process.versions.node}!`);
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running.');
});

app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});
