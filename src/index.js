require('dotenv').config();
const path = require('path');
const express = require('express');
const handlebars = require('express-handlebars');
const mysql = require('mysql2/promise');
const fetch = require('node-fetch');
const withQuery = require('with-query').default;
const morgan = require('morgan');

const { mkQuery } = require('./utils');

const {
  SQL_BOOKS_BY_FIRST_LETTER,
  SQL_BOOK_COUNT,
  SQL_BOOK_BY_ID
} = require('./sqlQuery');
const { off } = require('process');

// create the database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'goodreads',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 4,
  timezone: '+08:00'
});

const startApp = async (app, pool) => {
  try {
    // acquire a connection from the connection pool
    const conn = await pool.getConnection();

    console.info('Pinging database...');
    await conn.ping();

    // release the connection
    conn.release();

    // start the server
    app.listen(PORT, () => {
      console.info(`Application started on port ${PORT} at ${new Date()}`);
    });
  } catch (e) {
    console.error('Cannot ping database: ', e);
  }
};

const app = express();

app.engine('hbs', handlebars({ defaultLayout: 'default.hbs' }));
app.set('view engine', 'hbs');

app.use(morgan('combined'));

app.use('/static', express.static(path.join(__dirname, '..', 'public')));

const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000;

app.get('/', (req, res) => {
  const alphabets = 'abcdefghijklmnopqrstuvwxyz'.toLocaleUpperCase().split('');
  const numbers = [...Array(10).keys()];
  const baseUrl = req.baseUrl;

  res.render('landing', { alphabets, numbers, baseUrl });
});

app.get('/books/:letter', async (req, res) => {
  const letter = req.params.letter || '';

  const getBookCount = mkQuery(SQL_BOOK_COUNT, pool);
  const listBookByFirstLetter = mkQuery(SQL_BOOKS_BY_FIRST_LETTER, pool);
  const limit = 10;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  try {
    const bookCount = (await getBookCount([`${letter}%`]))[0].count;
    const books = await listBookByFirstLetter([
      `${letter}%`,
      'title',
      'ASC',
      limit,
      offset
    ]);

    //pagination
    const totalPages = Math.ceil(bookCount / limit);
    const prevPage = page > 1 ? page - 1 : undefined;
    const nextPage = page < totalPages ? page + 1 : undefined;

    res.render('bookList', {
      books,
      letter,
      hasResult: !!bookCount,
      page,
      hasPrev: !!prevPage,
      hasNext: !!nextPage,
      prevPage,
      nextPage
    });
  } catch (err) {
    return Promise.reject(err);
  }
});

app.get('/book/:bookId', async (req, res) => {
  const bookId = req.params.bookId;

  const getBookById = mkQuery(SQL_BOOK_BY_ID, pool);

  try {
    const book = (await getBookById([bookId]))[0];

    const authors = book.authors.split('|');
    const authorsStr = authors.join(', ');

    const genres = book.genres.split('|');
    const genresStr = genres.join(', ');

    const jsonResponse = {
      bookId: book.book_id,
      title: book.title,
      authors,
      summary: book.description,
      pages: book.pages,
      rating: book.rating,
      ratingCount: book.rating_count,
      genres
    };

    res.format({
      'text/html': () => {
        res.render('book', {
          book,
          authors: authorsStr,
          genres: genresStr
        });
      },
      'application/json': () => {
        res.json(jsonResponse);
      },
      default: () => {
        res.status(406).send('Not Acceptable');
      }
    });
  } catch (err) {
    return Promise.reject({ err });
  }
});

app.get('/review', async (req, res) => {
  const title = req.query.title.trim();
  const apiRootUri = 'https://api.nytimes.com/svc/books/v3';
  const reviewQueryUri = `${apiRootUri}/reviews.json`;
  const queryEndpoint = withQuery(reviewQueryUri, {
    title,
    'api-key': process.env.API_KEY
  });

  try {
    const results = await fetch(queryEndpoint, { method: 'get' });
    const response = await results.json();
    const numReview = response.num_results;
    const reviews = response.results;
    const copyright = response.copyright;

    res.render('review', { reviews, copyright, hasReview: !!numReview });
  } catch (err) {
    return Promise.reject({ err });
  }
});
startApp(app, pool);
