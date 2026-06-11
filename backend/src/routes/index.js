const express    = require('express');
const auth       = require('../middlewares/authMiddleware');
const { AuthController }  = require('../controllers/authController');
const WeatherCtrl         = require('../controllers/weatherController');
const MoodCtrl            = require('../controllers/moodController');
const CompanionCtrl       = require('../controllers/companionController');
const { UserController, PlacesController } = require('../controllers/mainController');

// AUTH
const authRouter = express.Router();
authRouter.post('/register', AuthController.register);
authRouter.post('/login',    AuthController.login);
authRouter.post('/logout',   auth, AuthController.logout);
authRouter.get('/me',        auth, AuthController.me);

// WEATHER
const weatherRouter = express.Router();
weatherRouter.get('/',       WeatherCtrl.getByCity);
weatherRouter.get('/coords', WeatherCtrl.getByCoords);
weatherRouter.get('/hourly', auth, WeatherCtrl.getHourly);
weatherRouter.get('/7day',   auth, WeatherCtrl.get7Day);
weatherRouter.get('/history',auth, WeatherCtrl.getHistory);
weatherRouter.get('/quote',  auth, WeatherCtrl.getQuote);

// MOODS
const moodRouter = express.Router();
moodRouter.post('/',      auth, MoodCtrl.publish);
moodRouter.get('/nearby', auth, MoodCtrl.getNearby);
moodRouter.get('/me',     auth, MoodCtrl.getMyMood);
moodRouter.delete('/:id', auth, MoodCtrl.delete);

// COMPANIONS
const companionRouter = express.Router();
companionRouter.get('/find',         auth, CompanionCtrl.findCompatible);
companionRouter.get('/pending',      auth, CompanionCtrl.getPending);
companionRouter.post('/',            auth, CompanionCtrl.send);
companionRouter.patch('/:id/accept', auth, CompanionCtrl.accept);
companionRouter.patch('/:id/decline',auth, CompanionCtrl.decline);
companionRouter.get('/chat/:chatId', auth, CompanionCtrl.getChat);

// USERS
const userRouter = express.Router();
userRouter.get('/:id',    auth, UserController.getById);
userRouter.patch('/:id',  auth, UserController.update);
userRouter.delete('/:id', auth, UserController.delete);

// PLACES & REPORTS
const placesRouter = express.Router();
placesRouter.get('/', auth, PlacesController.getNearby);

const reportRouter = express.Router();
reportRouter.post('/', auth, UserController.report);

module.exports = { authRouter, weatherRouter, moodRouter, companionRouter, userRouter, placesRouter, reportRouter };
