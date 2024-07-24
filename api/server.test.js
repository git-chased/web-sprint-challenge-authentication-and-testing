const request = require('supertest')
const server = require('./server')
const db = require('../data/dbConfig')
const bcrypt = require('bcryptjs')
const { BCRYPT_ROUNDS } = require('../config/index')

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
})
afterEach(async () => {
  await db('users').truncate()
})

describe('POST /register', () => {
  test('register success', async () => {
    const newUser = {
      username: 'newUser',
      password: 'password1234'
    }
    const response = await request(server)
      .post('/api/auth/register')
      .send(newUser)

    expect(response.status).toBe(201)
  })
  test('register failure', async () => {
    const incompleteUser = {
      username: 'incompleteuser'
    }
    const response = await request(server)
      .post('/api/auth/register')
      .send(incompleteUser)
    
    expect(response.status).toBe(400)
    expect(response.body.message).toBe('username and password required')
  })
})

describe('POST /login', () => {
  test('valid credentials logs in succesfully', async () => {
    const existingUser = {
      username: 'existinguser',
      password: 'password1234'
    }
    const hashedPassword = await bcrypt.hash(existingUser.password, BCRYPT_ROUNDS)
    await db('users').insert({
      username: existingUser.username,
      password: hashedPassword
    })
    const response = await request(server)
      .post('/api/auth/login')
      .send(existingUser)

    expect(response.status).toBe(200)
    expect(response.body.message).toBe(`welcome, ${existingUser.username}`)
  })
  test('returns error for invalid credentials', async () => {
    const response = await request(server)
      .post('/api/auth/login')
      .send({
        username: 'foofoofoo',
        password: 'barbarbar'
      })

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('invalid credentials')
  })
})

describe('GET /jokes', () => {
  let token 
  beforeEach(async () => {
    const user = {
      username:'bazbazbaz',
      password: 'foofoofoo'
    }
    await request(server)
      .post('/api/auth/register')
      .send(user)
    const loginResponse = await request(server)
      .post('/api/auth/login')
      .send(user)
    token = loginResponse.body.token
  })

  test('valid token retrieves jokes', async () => {
    const response = await request(server)
      .get('/api/jokes')
      .set('Authorization', token)
    expect(response.status).toBe(200)
    expect(response.body.length).toBeGreaterThan(0)
  })

  test('invalid token fails', async () => {
    const response = await request(server)
      .get('/api/jokes')
    expect(response.status).toBe(401)
    expect(response.body.message).toBe('token required')
  })
})