const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { render } = require('ejs');
const connection = require('./database');
const { connect } = require('./database');
const { request, response } = require('express');
const { check, validationResult } = require('express-validator');
const sequelize = require('sequelize');
const { Sequelize, json } = require('sequelize');
let userRouter = require('./routes/userdata');
const { Session } = require('express-session');
const { rows } = require('mssql');
const { param } = require('./routes/userdata');


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});


// Templating Engine
app.set('view engine', 'ejs');
app.set('views', 'views/');




// Session Handling
// let sess;
// app.get('/', (req, res) => {
//     sess = req.session;
//     if(sess.username){
//         return res.render('home');
//     }
//     res.render('login');
// })



let title = [];
let status = [];
let date = [];

// Home Page
app.get('/', function (req, res) {
    let sessionUser = req.session.username;
    connection.query(`SELECT todoid, title, status, date FROM tododata where users_username = '${sessionUser}'`, function (err, result) {
        if (err) {
            throw err;
        }
        res.render('home', { items: result });
    })
})

// Home Page Data
app.post('/', function (req, res) {

    let sessionUser = req.session.username;

    let todoTitle = req.body.title;
    title.push(todoTitle);

    let todoStatus = req.body.status;
    status.push(todoStatus);

    let todoDate = req.body.date;
    date.push(todoDate);

    let sqltodo = `insert into tododata values (0, '${todoTitle}', '${todoStatus}', '${todoDate}', '${sessionUser}')`;
    connection.query(sqltodo, function (err) {
        if (err) {
            throw err;
        }
        connection.query(`SELECT todoid, title, status, date FROM tododata where users_username = '${sessionUser}'`, function (err, result) {
            if (err) {
                throw err;
            }
            res.render('home', { items: result });
        })
    });
});





// SignUp Page
app.get('/signup', (req, res) => {
    res.render('signup');
})


// Signup Post Method
app.post('/signup', function dataPost(req, res) {

    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;
    let error_msg = '';

    if (username && email && password) {
        let databaseUser = `SELECT username from users where username = '${username}'`;
        connection.query(databaseUser, function (err) {
            if (err) {
                let sql = `insert into users values (0, '${username}', '${email}', '${password}')`;
                connection.query(sql, function (err) {
                    if (err) {
                        throw err;
                    }
                    res.redirect('/login');
                })
            } else {
                error_msg = 'Username is Already Exist';
                return res.render('signup', { error_msg: error_msg });
            }
        })

    } else {
        error_msg = "Please Enter valid Details";
        return res.render('signup', { error_msg: error_msg });
    }
})





// Login Page
app.get('/login', (req, res) => {
    res.render('login');
})


// Login Post Data
app.post('/login', (req, res) => {

    // req.session.loggedin = true
    let username = req.body.username;
    let password = req.body.password;
    let error_msg = '';

    if (username && password) {
        connection.query(`SELECT username, password FROM users WHERE username = '${username}' and password = '${password}'`, function (err, result) {

            if (Object.values(result).length >= 1) {
                req.session.loggedin = true;
                req.session.username = username;
                res.redirect('/');
            } else {
                error_msg = "Incorrect Username or Password";
                return res.render('login', { error_msg: error_msg });
            }
            res.end();
        });
    } else {
        error_msg = "Please Enter Username or Password";
        return res.render('login', { error_msg: error_msg });
    }
});


// Logout User
app.get('/logout', (req, res) => {
    res.clearCookie('username');
    req.session.destroy();
    res.redirect('/login');
})




// Delete Data
app.get('/delete/:todoid', (req, res, next) => {
    let sessionUser = req.session.username;
    connection.query(`DELETE FROM tododata WHERE todoid=?`, [req.params.todoid], (err, rows) => {
        if (!err) {
            connection.query(`SELECT todoid, title, status, date FROM tododata where users_username = '${sessionUser}'`, function (err, result) {
                if (err) {
                    throw err;
                }
                res.render('home', { items: result });
            })
        } else {
            console.log(err);
        }
    })
})



// Edit Data
app.get('/edit/:todoid', (req, res, next) => {

    connection.query(`SELECT todoid, title, status, date FROM tododata WHERE todoid=?`, [req.params.todoid], function (err, result) {
        if (err) {
            throw err;
        } else {
            res.render('edit', { data: result[0] });
        }
    })
})

app.post('/edit/:todoid', function (req, res, next) {
    let sessionUser = req.session.username;
    let todoTitle = req.body.title;
    let todoStatus = req.body.status;
    let todoDate = req.body.date;
    let todoid = req.params.todoid;

    connection.query(`UPDATE tododata SET title='${todoTitle}', status='${todoStatus}', date='${todoDate}' WHERE todoid = '${todoid}'`, function (err, result) {
        if (err) {
            throw err;
        }
        connection.query(`SELECT todoid, title, status, date FROM tododata where users_username = '${sessionUser}'`, function (err, result) {
            if (err) {
                throw err;
            }
            res.render('home', { items: result });
        })
    })
})





app.listen(3000, function () {
    console.log('App is runnig at port 3000');
})
