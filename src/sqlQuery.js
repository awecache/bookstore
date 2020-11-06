//SQL queries
const SQL_BOOKS_BY_FIRST_LETTER =
  'SELECT * FROM book2018 WHERE title like ? ORDER BY ? ? limit ? offset ?';

const SQL_BOOK_COUNT =
  'SELECT count(*) as count FROM book2018 WHERE title like ? ';

const SQL_BOOK_BY_ID = 'SELECT * FROM book2018 WHERE book_id= ?';

exports.SQL_BOOK_COUNT = SQL_BOOK_COUNT;
exports.SQL_BOOKS_BY_FIRST_LETTER = SQL_BOOKS_BY_FIRST_LETTER;
exports.SQL_BOOK_BY_ID = SQL_BOOK_BY_ID;
