require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose')
const { Schema } = mongoose;
const _ = require('lodash');
//Auth services
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//google
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

//Initialization -start
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
    secret: process.env.SECRET_CODE,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
//Initialization -end

const today = require(__dirname + "/date.js");
const date = today.day();
mongoose.set('strictQuery', true);

//Main connection to mongoDB server using Mongoose
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
//mongoose.connect(process.env.MONGO_URL);

const itemSchema = new Schema({
    text: String,
});
const Item = mongoose.model('Item', itemSchema);
const defaultItems = [];
//Fetching default text
const Prereq = mongoose.model('Prereq',
    new Schema({ pretext: [String] }), 'prereq');
Prereq.findOne({ name: '__pretext' }, (err, preDoc) => {
    if (err) console.log(err);
    else {
        // console.log(preDoc.pretext.length);
        preDoc.pretext.forEach((ptxt) => {
            const item = new Item({
                text: ptxt,
            });
            defaultItems.push(item);
        });
    }
});

const listSchema = new Schema({
    name: String,
    items: [itemSchema],
    hehe: String
});
const List = mongoose.model('List', listSchema);

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    listmap: {
        type: [listSchema],
    },
});

//Auth-Initialization
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

//google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile.emails[0].value);
        User.findOrCreate({ username: profile.emails[0].value }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/auth/google",
    passport.authenticate('google', { scope: ['email'] })
);

app.get("/auth/google/verify",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function (req, res) {
        res.redirect("/");
    });

//Get Register Route
app.get("/register", (req, res) => {
    res.render("register");
});

//#Post Register Route
app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/");
            });
        }
    });
});

//Get Login Route
app.get("/login", (req, res) => {
    res.render("login");
});

//#Post Login Route
app.post("/login", (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/");
            });
        }
    });

});

//Get Logout Route
app.post('/logout', function (req, res, next) {
    if (!req.isAuthenticated) {
        res.redirect('/login');
        return;
    }
    req.logout(function (err) {
        if (err) { next(err); }
        res.redirect('/login');
    });
});

//Get HOME/MAIN Route
app.get('/', (req, res) => {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }

    // console.log(req);
    const listName = 'today';

    User.findOne({ username: req.user.username })
        .populate('listmap')
        .exec(function (err, user) {
            if (err) {
                console.error(err);
                return;
            }
            //If the list doesn't exist, populate with default Items
            if (!user.listmap.some(listmap => listmap.name === listName)) {
                const list1 = new List({
                    name: listName,
                    items: defaultItems
                });
                user.listmap.push(list1);
                user.save();
            }
            // console.log(user.listmap);
            const fList = user.listmap.find(lst => lst.name === listName);
            res.render('todolist', {
                listTitle: date, items: fList.items,
                username: req.user.username
            });
        });

});

//Get-CustomList
app.get('/:customList', (req, res) => {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
        return;
    }

    const listName = _.capitalize(req.params.customList);

    User.findOne({ username: req.user.username })
        .populate('listmap')
        .exec(function (err, user) {
            if (err) {
                console.error(err);
                return;
            }
            //If the list doesn't exist, populate with default Items
            if (!user.listmap.some(listmap => listmap.name === listName)) {
                const list1 = new List({
                    name: listName,
                    items: defaultItems
                });
                user.listmap.push(list1);
                user.save();
            }
            // console.log(user.listmap);
            const fList = user.listmap.find(lst => lst.name === listName);
            res.render('todolist', {
                listTitle: listName, items: fList.items,
                username: req.user.username
            });
        });

});

//Post Home Route
//This handles post from all list
app.post('/', (req, res) => {
    const item = req.body.itemText;
    let listName = req.body.listName;
    // console.log(listName);

    if (listName === date) listName = 'today';
    if (item) {
        const newItem = new Item({
            text: item,
        });
        if (req.isAuthenticated()) {
            User.findOneAndUpdate(
                { username: req.user.username, 'listmap.name': listName },
                { $push: { 'listmap.$.items': newItem } },
                { new: true },
                (err, user) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                }
            );
        };
    }
    if (listName === 'today') listName = '';
    res.redirect('/' + listName);
});

//Delete Entities
app.post("/chk", (req, res) => {
    const checkedItemID = req.body.checkbox;
    let listName = req.body.listName;
    if (listName === date) listName = 'today';

    if (req.isAuthenticated()) {
        User.findOneAndUpdate(
            { username: req.user.username, 'listmap.name': listName },
            { $pull: { 'listmap.$.items': { _id: checkedItemID } } },
            {},
            (err, user) => {
                if (listName === 'today') listName = '';
                if (!err) {
                    res.redirect('/' + listName);
                } else console.log(err);
            }
        );
    };
});

//app.listen(process.env.PORT || 3000, () => { console.log("server started...") });
//Connect to the database before listening
connectDB().then(() => {
    app.listen(process.env.PORT || 3000, () => {
        console.log("listening for requests");
    })
})
