const express = require('express');
const router = express.Router();
// const connection = require('./database');


router.get('/', function (req, res, next) {
    let sql = `SELECT title, status, date FROM tododata`;
    connection.query(sql, function (err, data, fields) {
        if(err){
            throw err;
        }
        res.render('home', {userData: data});
    });
});

module.exports = router;
