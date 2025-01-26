const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const assert = require('node:assert')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const bcryptjs = require('bcryptjs')

const Blog = require('../models/blog')
const User = require('../models/user')

const api = supertest(app)

beforeEach(async () => {
    await Blog.deleteMany({})

    for (let blog of helper.dummyBlogs) {
        let blogObject = new Blog(blog)
        await blogObject.save()
    }
})

test('blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('should return all blogs', async () => {
    const blogs = await api.get('/api/blogs')

    assert.strictEqual(blogs.body.length, helper.dummyBlogs.length)
})

test('unique identifier is named id not _id', async () => {
    const response = await api.get('/api/blogs')

    const ids = Object.keys(response.body)

    assert.strictEqual(ids.some(id => id === '_id'), false)
})

test('should post a new blog', async () => {
    const newBlog = {
        title: "boojkhkjh",
        url: "blahkljlkjlkm",
        author: "farkljljlkj",
        likes: 444
    }


    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const blogsAfterThePostRequest = await helper.blogsInDb()
    assert.strictEqual(blogsAfterThePostRequest.length, helper.dummyBlogs.length + 1)
})

test('if likes are missing, default to 0', async () => {
    const blogWithoutLikes = {
        title: "boo",
        url: "blahkljlkjlkm",
        author: "far"
    }


    await api
        .post('/api/blogs')
        .send(blogWithoutLikes)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const blogsAfterThePostRequest = await helper.blogsInDb()
    assert.strictEqual(blogsAfterThePostRequest.length, helper.dummyBlogs.length + 1)

    assert.strictEqual(blogsAfterThePostRequest[blogsAfterThePostRequest.length - 1].likes, 0)
})

test('should be able to delete a the first blog', async () => {
    const blogsAtTheStart = await helper.blogsInDb()

    await api
        .delete(`/api/blogs/${blogsAtTheStart[0].id}`)
        .expect(204)

    const blogsAfterTheDeleteRequest = await helper.blogsInDb()

    assert.strictEqual(blogsAfterTheDeleteRequest.length, blogsAtTheStart.length - 1)
})

test('should be able to update a blog', async () => {
    const blogsAtTheStart = await helper.blogsInDb()

    const blogToUpdate = blogsAtTheStart[0]
    const newBlog = {
        ...blogToUpdate,
        likes: 2718281828
    }

    await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

describe('one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcryptjs.hash('sirr', 10)
        const user = new User({ username: 'broski', passwordHash })

        await user.save()
    })

    test('posting should work', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'Anas',
            password: 'kalimat al morour',
            name: 'Anas Al-Maslouhi'
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAfterThePostRequest = await helper.usersInDb()
        assert.strictEqual(usersAfterThePostRequest.length, usersAtStart.length + 1)
    })

    test('posting fails when username is taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'broski',
            password: 'kalimat al morour',
            name: 'Anas Al-Maslouhi'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        assert(result.body.error.includes('expected `username` to be unique'))

        assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
})

after(async () => {
    await mongoose.connection.close()
})