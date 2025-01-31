const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
require('express-async-errors')
const User = require('../models/user')

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog
        .find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response, next) => {
    const blog = await Blog.findById(request.params.id)
    if (blog) {
        response.json(blog)
    } else {
        response.status(404).end()
    }

})

blogsRouter.post('/', async (request, response) => {
    if (!request.token || !request.decodedToken) {
        return response.status(401).json({ error: 'invalid or missing token' })
    }
    const body = request.body

    const user = await User.findById(request.decodedToken.id)

    const blog = new Blog({
        title: body.title,
        author: body.author,
        user: user.id,
        url: body.url,
        likes: body.likes || 0
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', async (request, response, next) => {
    if (!request.token || !request.decodedToken) {
        return response.status(401).json({ error: 'invalid or missing token' })
    }
    const user = await User.findById(request.decodedToken.id)
    const blogToDelete = await Blog.findById(request.params.id)

    try {
        if (blogToDelete.user.toString() === user.id.toString()) {
            await Blog.findByIdAndDelete(request.params.id)
            return response.status(204).end()
        } else {
            return response.status(401).json({ error: 'incorrect token' })
        }
    } catch (error) {
        return response.status(401).end()
    }
})

blogsRouter.put('/:id', async (request, response, next) => {
    const body = request.body

    const blog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes
    }

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    response.json(updatedBlog)
})

module.exports = blogsRouter








