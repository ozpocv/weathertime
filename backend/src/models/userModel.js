const { query, run, get } = require('../config/db');

module.exports = {
  findByEmail:    email    => get('SELECT * FROM users WHERE email = ?', [email]),
  findByUsername: username => get('SELECT * FROM users WHERE username = ?', [username]),
  findById(id) {
    return get('SELECT id,username,email,avatar_url,bio,created_at FROM users WHERE id = ?', [id]);
  },
  create({ username, email, password_hash }) {
    const lastId = run(
      'INSERT INTO users (username,email,password_hash) VALUES (?,?,?)',
      [username, email, password_hash]
    );
    if (!lastId) return null;
    return get('SELECT id,username,email,avatar_url,bio,created_at FROM users WHERE id = ?', [lastId]);
  },
  update(id, fields) {
    const keys   = Object.keys(fields);
    const values = Object.values(fields);
    const set    = keys.map(k => `${k} = ?`).join(', ');
    run(`UPDATE users SET ${set} WHERE id = ?`, [...values, id]);
    return this.findById(id);
  },
  delete: id => run('DELETE FROM users WHERE id = ?', [id]),
};
