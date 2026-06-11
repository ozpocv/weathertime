const { query, run, get } = require('../config/db');

module.exports = {
  create({ sender_id, receiver_id, activity, mood }) {
    const existing = get(
      `SELECT id FROM companion_requests
       WHERE ((sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?))
         AND status='pending'`,
      [sender_id, receiver_id, receiver_id, sender_id]
    );
    if (existing) return null;
    const id = run(
      'INSERT INTO companion_requests (sender_id,receiver_id,activity,mood) VALUES (?,?,?,?)',
      [sender_id, receiver_id, activity, mood]
    );
    return get('SELECT * FROM companion_requests WHERE id = ?', [id]);
  },

  findById: id => get('SELECT * FROM companion_requests WHERE id = ?', [id]),

  findPendingForUser(user_id) {
    return query(
      `SELECT r.*, u.username AS sender_username, u.bio AS sender_bio
       FROM companion_requests r JOIN users u ON u.id = r.sender_id
       WHERE r.receiver_id = ? AND r.status = 'pending'`,
      [user_id]
    );
  },

  updateStatus(id, status, chat_id = null) {
    run('UPDATE companion_requests SET status=?, chat_id=? WHERE id=?', [status, chat_id, id]);
    return get('SELECT * FROM companion_requests WHERE id = ?', [id]);
  },
};
