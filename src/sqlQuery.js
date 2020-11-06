//SQL queries
const SQL_BOOKS_BY_FIRST_LETTER =
  'SELECT * FROM book2018 WHERE title like ? ORDER BY ? ? limit ? offset ?';

const SQL_BOOK_COUNT =
  'SELECT count(*) as count FROM book2018 WHERE title like ? ';

exports.SQL_BOOK_COUNT = SQL_BOOK_COUNT;
exports.SQL_BOOKS_BY_FIRST_LETTER = SQL_BOOKS_BY_FIRST_LETTER;
