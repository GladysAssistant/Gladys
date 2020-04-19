const { assert } = require('chai');
const { Server } = require('mock-socket');

// const kodi = require('node-kodi-ws'); 
const EventEmitter = require('events');

const logger = require('../../../../utils/logger');

// Get require for db access 
const roomFindAll = require('../../../../lib/room/room.getAll');
const serviceGetByName = require('../../../../lib/service/service.getByName');

// Get KodiHandler to test
const KodiHandler = require('../../../../services/kodi/lib/index');

// Mock gladys context
const gladys = {
  event: new EventEmitter(),
  variable: {
    getValue: () => Promise.resolve('test'),
  },
};

// Constant for mock server
const fakeHost = '127.0.0.1';
const fakePort = '9090';
const fakeURL = `ws://${fakeHost}:${fakePort}/jsonrpc`;

// Constant for dummy data 
const fakeDeviceId = '99dc1ca1-ed80-46c7-b330-c0d57383640b'; 
let roomId;
let kodiHandler;
/*
class ChatApp {
	constructor(url) {
		this.messages = [];
		this.connection = new WebSocket(url);
	
		this.connection.onmessage = (event) => {
			this.messages.push(event.data);
		};
	}
	
	sendMessage(message) {
		this.connection.send(message);
	}
}
*/

describe.only('KodiHandler', () => {
	before(async function initData() {
		// runs once before the first test in this block	
		const rooms = await roomFindAll.getAll(); 
		roomId = rooms[0].id;
		logger.trace('Room id in db: ', roomId);

		const service = await serviceGetByName.getByName('test-service');
		logger.trace('Test service id in db: ', service.id); 
		kodiHandler = new KodiHandler(gladys, gladys.event, service.id);

		// TODO SM : get kodi device in db (init devide_id, host, port)

	}); 
	
	const mockServer = new Server(fakeURL);
	mockServer.on('connect', socket => {
		
		socket.on('open', () => {
			socket.send('connect'); 
		});

		socket.on('message', () => {
			socket.send('connect'); 
		});
		
		socket.on('error', () => {
			socket.send('connect'); 
		});

		socket.on('close', () => {
			socket.send('pong'); 
		});
	
		socket.send('open');
		// socket.close();
	});
	mockServer.on('ping', socket  => {
		socket.send('pong'); 
	});
	mockServer.on('open', socket  => {
		socket.send('open'); 
	});
	mockServer.on('connection', socket  => {
		socket.send('open'); 
	});
	mockServer.on('message', socket  => {
		socket.send('open'); 
	});
	mockServer.on('error', socket  => {
		socket.send('open'); 
	});

	// TODO SM : voir pour que le mock KodiHandler redefisse que la methode connect
	
	// const app = new ChatApp(fakeURL);
	// app.sendMessage('test message from app');

	let kodiConnection = null;
	logger.info('Start test of KodiHandler: ');

	it('after start kodi connection must be not null', async ()  => {
		/*
		await kodi('192.168.0.33', '9090').then(function initKodiConnection(connection){
		// await kodi(fakeHost, fakePort).then(function initKodiConnection(connection){
			kodiConnection = connection;
		})
		.catch((err) => {
			logger.error('Kodi connection timeout or other error: ', err);
		});;

		// logger.debug(kodiConnection);
		// logger.debug(kodiConnection.socket);

		if ( kodiConnection ) {
			kodiHandler.mapOfKodiConnection.set(fakeDeviceId, kodiConnection);
		}  
		*/
		
		await kodiHandler.connect();
		kodiConnection = kodiHandler.mapOfKodiConnection.get(fakeDeviceId);
		return assert.equal(await kodiHandler.checkConnectionAndServerSate(kodiConnection, fakeDeviceId), true);
	});

	it('after stop kodi mapOfKodiConnection must be null', async ()  => {
		await kodiHandler.disconnect();
		return assert.equal(kodiHandler.mapOfKodiConnection, null);
	});

	it('ping state must be pong', async ()  => {
		// restart connection
		await kodiHandler.connect();
		kodiConnection = kodiHandler.mapOfKodiConnection.get(fakeDeviceId);

		const serverState = await kodiHandler.pingKodi(fakeDeviceId);
		return assert.equal(serverState, 'pong');
	});

	it('mute state must be true', async ()  => {
		const muteState = await kodiHandler.mute(fakeDeviceId);
		return assert.equal(muteState, true);
	});

	it('mute state must be false', async ()  => {
		const muteState = await kodiHandler.unmute(fakeDeviceId);
		return assert.equal(muteState, false);
	});

	let movies;
	it('movies value must not be null', async ()  => {
		movies = await kodiHandler.getMovies(fakeDeviceId);
		return assert.notEqual(movies, null);
	});

	it('moviesByTitle value must not be null', async ()  => {
		const moviesByTitle = await kodiHandler.getMoviesByTitle(fakeDeviceId, 'Roxane');
		const filePath = JSON.parse(JSON.stringify(moviesByTitle)).movies[0].file;
		logger.debug(filePath);
		return assert.notEqual(moviesByTitle, null);
	});

	it('open media value must not be null', async ()  => {
		const filePath = JSON.parse(JSON.stringify(movies)).movies[0].file;
		logger.debug(filePath);
		const openMediaValue = await kodiHandler.openMedia(fakeDeviceId, filePath);
		return assert.equal(openMediaValue, 'OK');
	});

	it('playerState state must be {speed : 1}', async ()  => {
		const playerState = await kodiHandler.playPlayer(fakeDeviceId);
		return assert.equal(playerState.speed, 0);
	});

	it('playerState state must be OK', async ()  => {
		const playerState = await kodiHandler.stopPlayer(fakeDeviceId);
		return assert.equal(playerState, 'OK');
	});

	it('volumeValue state must be 50', async ()  => {
		const volumeValue = await kodiHandler.setVolume(fakeDeviceId, 50);
		return assert.equal(volumeValue, 50);
	});

	it('volumeValue state must be 52', async ()  => {
		const volumeValue = await kodiHandler.increaseVolume(fakeDeviceId);
		return assert.equal(volumeValue, 52);
	});

	it('volumeValue state must be OK', async ()  => {
		const volumeValue = await kodiHandler.decreaseVolume(fakeDeviceId);
		return assert.equal(volumeValue, 50);
	});

});
