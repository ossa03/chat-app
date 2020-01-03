// モジュール
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocatinMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const PORT = process.env.PORT || 3000
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialPath = path.join(__dirname, '../templates/partials')

// Setup handlebars engine and views location
// app.set('view engine', 'html')
// app.set('views', viewsPath)
// hbs.registerPartials(partialPath)

// Setup static directory to serve
app.use(express.static(publicDirectoryPath))

// チャット接続
io.on('connect', (socket) => {
	console.log('New WebSocket Connection')

	socket.on('join', (options, callback) => {
		const { error, user } = addUser({
			id: socket.id,
			...options,
		})

		if (error) {
			return callback(error)
		}

		socket.join(user.room)

		// イベント発火 メッセージ送信
		socket.emit('message', generateMessage('Welcome !', 'Admin'))
		// 新しいユーザーが接続したらそのroomの他の全ユーザーへ知らせる
		socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined !`, 'Admin'))
		io.to(user.room).emit('roomData', {
			room: user.room,
			users: getUsersInRoom(user.room),
		})

		// errorがないので空のcallbackを渡す
		callback()
	})

	// あるユーザーがメッセージを送信したら全ユーザーへ送信する
	socket.on('sendMessage', (message, callback) => {
		// 'sendMessage'をemitしてきたuserを取得する
		const user = getUser(socket.id)

		// 俗語が含まれていないかどうか確認
		const filter = new Filter()
		if (filter.isProfane(message)) {
			return callback('The message contains profane language')
		}

		if (message === '') {
			return callback('The message is empty')
		}

		io.to(user.room).emit('message', generateMessage(message, user.username))
		callback()
	})

	// あるユーザーが接続を解除したらその他の全ユーザーへ知らせる
	socket.on('disconnect', () => {
		const user = removeUser(socket.id)

		if (user) {
			io.to(user.room).emit('message', generateMessage(`${user.username} has left !`, 'Admin'))
			io.to(user.room).emit('roomData', {
				room: user.room,
				users: getUsersInRoom(user.room),
			})
		}
	})

	socket.on('sendLocation', ({ lat, long }, callback) => {
		// 'sendLocation'をemitしてきたuserを取得する
		const user = getUser(socket.id)

		// googleMap
		io.to(user.room).emit(
			'locationMessage',
			generateLocatinMessage(`https://www.google.com/maps?${lat},${long}`, user.username),
		)
		callback()
	})
})

server.listen(PORT, () => console.log(`Server starting on port ${PORT} !`))
