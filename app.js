const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()

const dbPath = path.join(__dirname, 'userData.db')

let db = null
app.use(express.json())

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//register api
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(request.body.password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const createQuery = `INSERT INTO user(username,name,password,gender,location)
     VALUES ("${username}","${name}","${hashedPassword}","${gender}","${location}")`
      const dbResponse = await db.run(createQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//post api
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//put api
app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectQuery = `SELECT * FROM user WHERE username = "${username}";`
  const dbUser = await db.get(selectQuery)
  if (dbUser !== undefined) {
    const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)
    if (isPasswordMatched === false) {
      response.status(400)
      response.send('Invalid current password')
    }
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    }
    if (isPasswordMatched === true) {
      const hashNewPassword = await bcrypt.hash(newPassword, 10)
      const updateQuery = `UPDATE user
      SET password = "${hashNewPassword}"
      WHERE username = "${username}"`
      await db.run(updateQuery)
      response.status(200)
      response.send('Password updated')
    }
  }
})

module.exports = app
