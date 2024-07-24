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
})