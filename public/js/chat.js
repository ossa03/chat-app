// クライアントサイド
const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sideBar = document.querySelector('#sidebar')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(document.location.search, { ignoreQueryPrefix: true })

// 自動スクロール
const autoscroll = () => {
	// New message element
	const $newMessage = $messages.lastElementChild

	// Height of the new message
	const newMessageStyle = getComputedStyle($newMessage)
	const newMessageMargin = parseInt(newMessageStyle.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

	// Visible height
	const visibleHeight = $messages.offsetHeight

	// Height of messages conrainer
	const containerHeight = $messages.scrollHeight

	// How far have I scrolled?
	const scrollOffset = $messages.scrollTop + visibleHeight

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight
	}
}

// イベント監視
socket.on('message', (message) => {
	console.log('Accept message: ', message)
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('HH:mm'),
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoscroll()
})

socket.on('roomData', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room: room,
		users: users,
	})
	$sideBar.innerHTML = html
})

socket.on('locationMessage', (locationMessage) => {
	console.log('Current Location URL: ', locationMessage)
	const html = Mustache.render(locationMessageTemplate, {
		username: locationMessage.username,
		url: locationMessage.url,
		createdAt: moment(locationMessage.createdAt).format('HH:mm'),
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoscroll()
})

// addEventListener
//* メッセージを送信
$messageForm.addEventListener('submit', (e) => {
	e.preventDefault()
	// sendボタン to enable
	$messageFormButton.setAttribute('disabled', 'disabled')

	let message = e.target.elements.message.value

	socket.emit('sendMessage', message, (error) => {
		// sendボタン to able
		$messageFormButton.removeAttribute('disabled')
		$messageFormInput.focus()
		$messageFormInput.value = ''

		if (error) {
			return console.log(error)
		}

		console.log('The message was delivered', message)
	})
})

//* 現在地を他ユーザーへ共有
$sendLocationButton.addEventListener('click', (e) => {
	// geolocationオブジェクトがサポートされているか確認
	if (!navigator.geolocation) {
		/* geolocation IS NOT available */
		return window.alert('Geo location not supported by your browser !')
	}

	/* geolocation is available */
	$sendLocationButton.setAttribute('disabled', 'disabled')
	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit(
			'sendLocation',
			{
				lat: position.coords.latitude,
				long: position.coords.longitude,
			},
			() => {
				$sendLocationButton.removeAttribute('disabled')
				console.log('Location shared !')
			},
		)
	})
})

socket.emit('join', { username, room }, (error) => {
	if (error) {
		alert(error)
		location.href = '/'
	}
})
