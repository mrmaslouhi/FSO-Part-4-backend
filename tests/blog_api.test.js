const { test, after, beforeEach } = require('node:test')
const mongoose = require('mongoose')
const assert = require('node:assert')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')

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

after(async () => {
    await mongoose.connection.close()
})