const Blog = require('../models/blog')

const dummyBlogs = [
    {
        "title": "Thrust",
        "author": "Bro MB",
        "url": "https://www.example.com",
        "likes": 12
    },
    {
        "title": "Torque",
        "author": "Hamo MB",
        "url": "https://www.example.com",
        "likes": 11
    }
]

const blogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map(blog => blog.toJSON())
}

const nonExistingId = async () => {
    const blog = new Blog({
        "title": "boo",
        "author": "far",
        "url": "blah",
        "likes": 0
    })
    await blog.save()
    await blog.deleteOne()

    return blog._id.toString()
}

module.exports = {
    dummyBlogs, blogsInDb, nonExistingId
}