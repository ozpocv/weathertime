const W = require('../services/weatherService');
module.exports = {
  async getByCity(req,res,next)   { try { res.json(await W.getByCity(req.query.city));              } catch(e){next(e);} },
  async getByCoords(req,res,next) { try { res.json(await W.getByCoords(req.query.lat,req.query.lon));} catch(e){next(e);} },
  async getHourly(req,res,next)   { try { res.json(await W.getHourly(req.query.lat,req.query.lon)); } catch(e){next(e);} },
  async get7Day(req,res,next)     { try { res.json(await W.get7Day(req.query.lat,req.query.lon));   } catch(e){next(e);} },
  async getHistory(req,res,next)  { try { res.json(await W.getHistory());                            } catch(e){next(e);} },
};

module.exports.getQuote = async function(req, res, next) {
  try { res.json(await require('../services/weatherService').getQuote()); }
  catch(e) { next(e); }
};
