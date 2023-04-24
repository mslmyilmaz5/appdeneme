const express = require("express"); 
const mongoose = require('mongoose');
const app = express();
const axios = require('axios');

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const uri = process.env.MONGODB_CONNECTION_STRING;

let Tweet = require('../models/Tweet.model');

app.set("view engine","ejs"); 
app.use(express.static('public'));
app.use(express.static('node_modules'));

const start_date = new Date(2016, 6, 1)
const end_date =  new Date(2016, 6, 31);

const monthNames = ["January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"];

mongoose.connect(uri , {useNewUrlParser: true, useUnifiedTopology: true});
const connection = mongoose.connection;
connection.once('open', () => { console.log('Database connection established succesfully')});

  const getRecentTweetsByAuthor = async () => {

    const recentTweetsByAuthor = await Tweet.aggregate([
      {
        $match: {
          created: { $gte: start_date, $lt: end_date },
        },
      },
      {
        $group: {
          _id: "$author_screen",
          count: { $sum: 1 },
          author: { $first: "$author_screen" },
        },
      },
      {
        $sort: {
          count: -1,
        },
      }, 
    ]);
  
    return recentTweetsByAuthor;
  };
  

  const topHashtagList = async () => {

    const topList = await Tweet.aggregate([
      {
        $match: {
          created: { $gte: start_date, $lt: end_date },
          hashtags: {$ne: "",},
           
        },
      },
      {
        $unwind: "$hashtags"
      },
      {
        $group: {
          _id: "$hashtags",
          count: {
            $sum: {
              $cond: [
                { $eq: ["$hashtags", "Turkey"] },
                0,
                1
              ]
            }
          }
        },
      },
      {
        $sort: {
          count: -1,
        },
      }, 
      {
         $limit: 10,
      },
    ]);
  
    return topList;
  };


  const topMentionList = async () => {

  
    const topList = await Tweet.aggregate([
      {
        $match: {
          created: { $gte: start_date, $lt: end_date },
          mentions: {$ne: "",},
           
        },
      },
      {
        $unwind: "$mentions"
      },
      {
        $group: {
          _id: "$mentions",
          count: {
            $sum: {
              $cond: [
                { $eq: ["$mentions", "Turkey"] },
                0,
                1
              ]
            }
          }
        },
      },
      {
        $sort: {
          count: -1,
        },
      }, 
      {
         $limit: 10,
      },
    ]);
  
    return topList;
  };

  const sevenDayList = async (startDate, endDate) => {
    
    const topList = await Tweet.aggregate([
      {
        $match: {
          created: {
            $gte: new Date(startDate),
            $lt: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%d",
              date: "$created"
            }
          },
          count: {
            $sum: 1
          }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]);
  
    return topList;
};



  const countTweets = async () => {
    const count = await Tweet.countDocuments({
      created: {
        $gte: start_date,
        $lt: end_date
      }
    });
  
    return count;
  } 

  const getTweetContent30Days = async () => {

  
    const tweet_content = await Tweet.aggregate([
      {
        $match: {
          created: { $gte: start_date, $lt: end_date },
        },
      },
      {
        $project: {
  
          author_screen: 1,
          text: 1,
          like_count: 1,
          reply_count: 1,
          created:1,
          retweet_count:1,
          tweet_id:1
        },
      },
    ]);
  
    return tweet_content;
  };

  const getHitTweets = async (field) => {
    

  
    const tweet_content = await Tweet.aggregate([
      {
        $match: {
          created: { $gte: start_date, $lt: end_date }
        }
      },
      {
        $sort: { [field]:-1 }
      },
      {
        $limit: 1
      },
      {
        $project: { _id: 0, tweet_id: 1 }
      }
    ]);
    
    return tweet_content;
  }
const getTweetHTML = async(tweetURL) => {
    const htmlURL = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetURL)}`;
    try {
      const response = await axios.get(htmlURL);
      //console.log(response.data.html)
      return response.data.html;
      
    } catch (error) {
      console.log(error);
      return null;
    }
  }




app.use("/tweets",async function(req,res){
    
    const like_id = await getHitTweets('like_count');
    const l_html_url = await getTweetHTML(`https://twitter.com/anyuser/status/${like_id[0].tweet_id}`)

    const rt_id = await getHitTweets('retweet_count');
    const rt_html_url = await getTweetHTML(`https://twitter.com/anyuser/status/${rt_id[0].tweet_id}`)
    const rp_id = await getHitTweets('reply_count');
    const rp_html_url = await getTweetHTML(`https://twitter.com/anyuser/status/${rp_id[0].tweet_id}`)
    //const now = new Date();
    //console.log(now)
    //const oneMonthAgo = new Date();
    //oneMonthAgo.setMonth(now.getMonth() - 1);
    //console.log(oneMonthAgo)
    
    const date3= new Date(start_date.getFullYear(),start_date.getMonth()-1,1);
    const date4= new Date(start_date.getFullYear(),end_date.getMonth()-1,31);

    const monthName = monthNames[end_date.getMonth()];
    const b_monthName = monthNames[end_date.getMonth() - 1];
    const tweets = await  getRecentTweetsByAuthor();
    const h_list = await topHashtagList();
    const m_list = await topMentionList();
    const seven_list = await sevenDayList(start_date,end_date);
    const before_seven_list = await sevenDayList(date3,date4);
    const nOfTweets = await countTweets();

    

    const tweet_type_q = "quoted";
    const document_count_q = await Tweet.countDocuments({
        "referenced_tweets.0.type": tweet_type_q,
        "created": { $gte: start_date , $lt: end_date}
    });

    const tweet_type_rt = "retweeted";
    const document_count_rt = await Tweet.countDocuments({
        "referenced_tweets.0.type": tweet_type_rt,
        "created": { $gte: start_date , $lt: end_date}
    });


    const tweet_type_re = "replied_to";
    const document_count_re = await Tweet.countDocuments({
        "referenced_tweets.0.type": tweet_type_re,
        "created": { $gte: start_date , $lt: end_date}
    });
  
 
    const document_count_t = ( nOfTweets - (document_count_q + document_count_rt + document_count_re));
 
    res.render('tweets',{  
    tweet_list: tweets,
    h_list: h_list,
    m_list: m_list,
    seven_list: seven_list,
    b_seven_list: before_seven_list,
    tweet_number:nOfTweets,
    q_number:document_count_q,
    rt_number:document_count_rt,
    re_number:document_count_re,
    t_number:document_count_t,
    tweet_html_l:l_html_url,
    tweet_html_rt:rt_html_url,
    tweet_html_rp:rp_html_url,
    start_date:start_date,
    end_date:end_date,
    monthName:monthName,
    b_monthName:b_monthName,
     });
});


app.use("/search", async function(req,res){

  const tweets_content = await getTweetContent30Days();
  res.render("search",{
    t_icerik_list:tweets_content,
  })
});

app.use("/dataset", function(req,res){
  res.render("dataset")
});


app.use("/contact", function(req,res){   
  res.render("contact")
});


app.use("/", function(req,res){   
  res.render("index")
});


// 3000 portta webi açar.
app.listen(PORT, () => { console.log(`Server is running on port : ${PORT}`)});


