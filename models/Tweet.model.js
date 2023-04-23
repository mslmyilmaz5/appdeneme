const mongoose = require('mongoose');

const Tweet = mongoose.model('Tweet', new mongoose.Schema({
    text: String,
    created: Date,
    like_count: Number,
    tweet_id:String,
    lang:String,
    author_screen:String,
    referenced_tweets:Array,
  }), 'tweets');

  module.exports = Tweet;