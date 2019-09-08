const express = require('express');
const bodyParser = require('body-parser');
const app = exports.app = express();
const hb = require('express-handlebars');
const db = require('./lib/db.js');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bc = require('./lib/bc.js');
const helmet = require('helmet');
const csurf = require('csurf');
const {
    ifHasNoSignature,
    ifHasSignature,
    ifIsLoggedIn,
    ifIsNotLoggedIn
} = require('./lib/middleware');

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(helmet());
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(cookieSession({
    secret: 'Death is part of life',
    maxAge: 1000 * 60 * 60 * 24 * 14
}));
app.use(csurf());
app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// middleware - determining when to show logout link
app.use(function(req, res, next) {
    if (req.url != '/register' && req.url != '/login') {
        res.locals.on = true;
        next();
    } else {
        next();
    }
});

// landing page route

app.get('/', (req, res) => {
    res.redirect('/register');
});

// GET route for registration

app.get('/register', ifIsLoggedIn, (req, res) => {
    res.render('register');
});

// POST route for registration

app.post('/register', ifIsLoggedIn, (req, res) => {
    if (req.body.firstName == '' || req.body.lastName == '' || req.body.email == '' || req.body.password == '') {
        res.render('register', {
            warning: true
        });
    } else {
        bc.getHash(req.body.password).then((hash) => {
            return db.insertLogin(req.body.firstName, req.body.lastName, req.body.email, hash);
        }).then((id) => {
            req.session.loginID = id.rows[0].id;
            req.session.userName = req.body.firstName;
            res.redirect('/add_info');
        }).catch((err) => {
            console.log('err in POST route /register ', err.message);
            res.render('register', {
                warning: true
            });
        });
    }
});

//GET route for login
app.get('/login', ifIsLoggedIn, (req, res) => {
    res.render('login');
});

//POST route for login

app.post('/login', ifIsLoggedIn, (req, res) => {
    if (req.body.email == '' || req.body.password == '') {
        res.render('login', {
            warning: true
        });
    } else {
        let idInQuestion;
        db.getLogin(req.body.email).then((result) => {
            idInQuestion = result.rows[0].id;
            return bc.compareHash(req.body.password, result.rows[0].password);
        }).then(() => {
            return db.getNameAndSignature(idInQuestion);
        }).then((results) => {
            req.session.loginID = idInQuestion;
            req.session.userName = results.rows[0].first;
            if (results.rows[0].signature) {
                req.session.signed = true;
            }
            res.redirect('/add_info');
        }).catch((err) => {
            console.log('Error in POST /login route: ', err.message);
            res.render('login', {
                warning: true
            });
        });
    }
});

//GET route logout

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/register');
});



//GET route add_info

app.get('/add_info', ifIsNotLoggedIn, (req, res) => {
    db.checkIfInfoAdded(req.session.loginID).then((obj) => {
        if (obj.rows[0].age != null || obj.rows[0].city != null || obj.rows[0].url != null) {
            res.redirect('/welcome');
        } else {
            res.render('add_info', {
                name: req.session.userName,
                on: true
            });
        }
    }).catch((err) => {
        console.log('Error in GET /add_info route ', err.message);
        res.redirect('/welcome');
    });
});

//POST route add_info

app.post('/add_info', ifIsNotLoggedIn, (req, res) => {
    let url;
    if (!req.body.website.startsWith('http')) {
        url = 'http://' + req.body.website;
    } else {
        url = req.body.website;
    }
    return db.addInfo(req.session.loginID, req.body.age || null, req.body.city || null, url || null).then(() => {
        res.redirect('/welcome');
    }).catch((err) => {
        console.log('Error in POST /add_info route ', err.message);
        res.redirect('/welcome');
    });
});



// GET route for welcome page
app.get('/welcome', ifIsNotLoggedIn, ifHasSignature, (req, res) => {
    res.render('welcome', {
        name: req.session.userName,
    });
});

// POST route for signature
app.post('/welcome', ifIsNotLoggedIn, ifHasSignature, (req, res) => {
    if (req.body.signatureUrl == '') {
        res.render('welcome', {
            name: req.session.userName,
            warning: true
        });
    } else {
        db.insertSignature(req.body.signatureUrl, req.session.loginID)
            .then(() => {
                req.session.signed = true;
                res.redirect('/thanks');
            })
            .catch(function(err) {
                console.log('error in post /welcome route', err.message);
                res.render('welcome', {
                    warning: true,
                    name: req.session.userName
                });
            });
    }
});

//GET route thanks page
app.get('/thanks', ifIsNotLoggedIn, ifHasNoSignature, (req, res) => {
    let num;
    db.getRowCount().then((results) => {
        return num = results.rows[0].count;
    }).then(() => {
        return db.getSignatureUrl(req.session.loginID);
    }).then((url) => {
        url = url.rows[0].signature;
        res.render('thanks', {
            name: req.session.userName,
            numOfRows: num,
            PicUrl: Buffer.from(url, 'base64').toString('utf8'),
            update: req.session.update
        });
        req.session.update = false;
    }).catch(e => console.log('get /thanks route Error ' + e.message));
});

// POST route thanks - delete signatures
app.post('/thanks', ifIsNotLoggedIn, ifHasNoSignature, (req, res) => {
    db.deleteSignature(req.session.loginID).then(() => {
        req.session.signed = false;
        res.redirect('/welcome');
    }).catch((err) => {
        console.log('Error in deleting signature: ', err.message);
        res.status(500);
    });
});

// GET route profile_update

app.get('/profile_update', ifIsNotLoggedIn, ifHasNoSignature, (req, res) => {
    db.getProfile(req.session.loginID).then(results => {
        let row = results.rows[0];
        res.render('profile_update', {
            first: row.first,
            last: row.last,
            email: row.email,
            age: row.age,
            city: row.city,
            url: row.url,
            on: true,
            warning: req.session.updateFailure
        });
        req.session.updateFailure = null;

    }).catch(err => {
        console.log('error in GET profile_update: ', err.message);
        res.status(500);
    });
});

// POST route profile_update

app.post('/profile_update', ifIsNotLoggedIn, ifHasNoSignature, (req, res) => {
    if (req.body.password == '') {
        db.updateUsersNoPassword(req.session.loginID, req.body.first, req.body.last, req.body.email).then(() => {
            db.upsertUserProfile(req.session.loginID, req.body.age || null, req.body.city || null, req.body.url || null);
        }).then(() => {
            req.session.update = true;
            res.redirect('/thanks');
        }).catch(err => {
            console.log('Error in updateUsersNoPassword in POST /profile_update: ', err.message);
            req.session.updateFailure = true;
            res.redirect('/profile_update');
        });
    } else {
        bc.getHash(req.body.password).then(hash => {
            db.updateUsersWithPassword(req.session.loginID, req.body.first, req.body.last, req.body.email, hash);
        }).then(() => {
            db.upsertUserProfile(req.session.loginID, req.body.age || null, req.body.city || null, req.body.url || null);
        }).then(() => {
            req.session.update = true;
            res.redirect('/thanks');
        }).catch(err => {
            console.log('Error in updateUsersWithPassword in POST /profile_update: ', err.message);
            req.session.updateFailure = true;
            res.redirect('/profile_update');
        });
    }
});


// GET route signatures page

app.get('/signers', ifIsNotLoggedIn, ifHasNoSignature, (req, res) => {
    console.log('get /signers');
    let rows;
    db.getRows()
        .then(results => {
            rows = results.rows;
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].url == 'http://') {
                    rows[i].url = null;
                }
            }
            res.render('signers', {
                signers: rows,
            });
        }).catch(e => {
            console.log('error in get /signers route ' + e.message);
        });
});

app.get('/signers/:city', ifIsNotLoggedIn, ifHasNoSignature, (req, res) => {
    db.getCityRows(req.params.city.toLowerCase()).then((results) => {
        console.log(results);
        res.render('cities', {
            signers: results.rows,
            on: true,
            city: req.params.city
        });
    });
});

if (require.main == module) {
    app.listen(process.env.PORT || 8080, () => console.log('listening'));
}