const express = require('express')
const router = express.Router()
var ObjectId = require('mongodb').ObjectID
const Post = require('../models/Post')
const Spot = require('../models/Spot')
const defineUser = require('../helpers/defineUser')
const myNotifications = require('../helpers/notifications')
const myFunctions = require('../helpers/postLikes')
const newPostHelper = require('../helpers/newPostHelper')
const User = require('../models/User')

// NEW POST
router.post('/new', async (req, res) => {
  let mySpot
  const { content, title, mediaFile, location, categories, taggedAthletes } = req.body
  const user = await defineUser(req.session.currentUser)
  const newPost = new Post({
    content,
    title,
    user: user._id,
    mediaFile,
    // location,
    categories,
    taggedAthletes
  })

  // Creating or Updating Spots when the Post is created
  if (req.body.location) {
    const isThereASpot = await Spot.findOne({ placeId: location.place_id })
    if (isThereASpot) {
      try {
        // UPDATE the spot
        mySpot = await Spot.findOneAndUpdate({ placeId: location.place_id }, { $push: { posts: newPost._id } })
        // add location to newPost
        newPost.spot = mySpot._id
      } catch (err) {
        console.log(err)
      }
    } else {
      mySpot = new Spot({
        location,
        placeId: location.place_id,
        posts: newPost._id,
        followedBy: []
      })
      try {
        // CREATE the spot
        mySpot = await mySpot.save()
        // add location to newPost
        newPost.spot = mySpot._id
      } catch (err) {
        console.log(err)
      }
    }
  }

  try {
    // CREATE the post
    const post = await newPost.save()
    await User.findOneAndUpdate({ _id: user._id }, { $push: { posts: post._id } })
    // ADD POST WHERE THE USER IS TAGGED
    taggedAthletes.forEach(async athleteId => {
      await User.findOneAndUpdate({ _id: athleteId }, { $push: { taggedPosts: post._id } })
      await myNotifications.notificationUserTagged(user, athleteId, post)
    })
    newPostHelper.addPostToCategory(categories, post)
    res.status(200).json({ Message: `New post created ${post}` })
  } catch (err) {
    console.log(err)
    res.json('something went wrong: ' + err)
  }
})

// GET ALL POSTS
router.get('/all', async (req, res) => {
  console.log(req.cookies, 'cookies')
  try {
    const posts = await Post.find().sort({ created_at: -1 })
      .populate('spot').populate('user')
    res.status(200).send(posts)
  } catch (err) {
    res.status(400).send({ message: 'Something went wrong' })
  }
})

// GET POSTS WITH SPOT
router.get('/all/spot', async (req, res) => {
  try {
    const postsWithSpot = await Post.find({ spot: { $exists: true } }).sort({ created_at: -1 })
      .populate('spot').populate('user')
    res.status(200).send(postsWithSpot)
  } catch (err) {
    res.status(400).send({ message: 'Something went wrong' })
  }
})

// GET SINGLE POST
router.get('/single/:id', async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id })
      .populate('user').populate('comments.user').populate('spot').populate('taggedAthletes').populate('likes')

    res.status(200).send(post)
  } catch (err) {
    res.status(400).send({ message: 'Something went wrong' })
  }
})

// GET USER POSTS
router.get('/user/:id', async (req, res) => {
  try {
    const userPosts = await Post.find({ user: ObjectId(req.params.id) }).sort({ created_at: -1 })
      .populate('user')
    res.status(200).send(userPosts)
  } catch (err) {
    res.status(400).send({ message: 'Something went wrong' })
  }
})

// DELETE A POST
router.post('/delete/:id', async (req, res) => {
  try {
    await Post.deleteOne({ _id: ObjectId(req.params.id) })
    res.status(200).send({ message: 'post deleted' })
  } catch (err) {
    res.status(400).send({ message: 'Something went wrong' }, err)
  }
})

// LIKE A POST
router.post('/like/:id', async (req, res) => {
  const postId = req.params.id
  try {
    const post = await Post.findById({ _id: postId })
    const user = await defineUser(req.session.currentUser)
    const likeIsPresent = await myFunctions.checkIfLike(post, user)
    if (!likeIsPresent) {
      myFunctions.likeAPost(postId, user._id, true)
      myNotifications.notificationLike(user, post, false)
      res.status(200).send({ message: 'post liked' })
    } else {
      myFunctions.likeAPost(postId, user._id, false)
      res.status(200).send({ message: 'post unliked' })
    }
  } catch (err) {
    console.log('err')
    res.json({ message: 'Something went wrong' })
  }
})

router.post('/:id/comment', async (req, res) => {
  const postId = req.params.id
  const { content } = req.body
  try {
    const user = await defineUser(req.session.currentUser)
    const myPost = await Post.findOneAndUpdate({ _id: postId }, { $push: { comments: { user: user._id, content, date: Date.now() } } }).populate('user')
    myNotifications.notificationComments(user, myPost, 'comment', 'had commented your post')
    res.status(200).send({ myPost })
  } catch (err) {
    console.log(err)
  }
})

module.exports = router
