const mkQuery = (sqlQuery, pool) => {
  const f = async (params) => {
    const conn = await pool.getConnection();

    try {
      const results = await conn.query(sqlQuery, params);
      return results[0];
    } catch (e) {
      return Promise.reject(e);
    } finally {
      conn.release();
    }
  };
  return f;
};

exports.mkQuery = mkQuery;
