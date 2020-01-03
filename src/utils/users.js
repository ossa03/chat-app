const users = []

//* addUser,removeUser.getUser,getUsersInRoom
const addUser = ({ id, username, room }) => {
	// clean the data
	username = username.trim().toLowerCase()
	room = room.trim().toLowerCase()

	// Validate the data
	if (!username || !room) {
		return { error: 'Username and room are required !' }
	}

	// Check for existing user
	const existingUser = users.find((user) => {
		return user.room === room && user.username === username
	})

	//Validate username
	if (existingUser) {
		return { error: 'username is use!' }
	}

	// Store user
	const user = { id, username, room }
	users.push(user)
	return { user }
}

const removeUser = (id) => {
	// findIndexは一致するものがなければ(-1)を返す
	const index = users.findIndex((user) => {
		return user.id === id
	})

	// user.id === id のuserがいたらusersから削除する
	if (index !== -1) {
		return users.splice(index, 1)[0]
	}
}

const getUser = (id) => {
	// const user = users.find((user) => user.id === id)
	return users.find((user) => user.id === id)

	// if (!user) {
	// 	return { error: 'user not found !' }
	// }

	// return { user }
}

const getUsersInRoom = (room) => {
	room = room.trim().toLowerCase()
	const usersInRoom = users.filter((user) => user.room === room)
	return usersInRoom
}

module.exports = {
	addUser,
	removeUser,
	getUser,
	getUsersInRoom,
}
