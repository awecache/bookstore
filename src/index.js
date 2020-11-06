require('dotenv').config();
const path = require('path');
const express = require('express');
const handlebars = require('express-handlebars');
const app = express();

app.engine('hbs', handlebars({ defaultLayout: 'default.hbs' }));
app.set('view engine', 'hbs');

app.use('/static', express.static(path.join(__dirname, '..', 'public')));

const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

app.get('/', async (req, res) => {
  const alphabets = 'abcdefghijklmnopqrstuvwxyz'.toLocaleUpperCase().split('');
  const numbers = [...Array(10).keys()];
  const baseUrl = req.baseUrl;

  res.render('landing', { alphabets, numbers, baseUrl });
});

app.listen(PORT, () => {
  console.log(`Listening to port ${PORT}`);
});
