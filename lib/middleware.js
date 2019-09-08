exports.ifHasNoSignature = (req, res, next) => {
    if (!req.session.signed && req.url != '/welcome') {
        return res.redirect('/welcome');
    }
    next();
};
exports.ifHasSignature = (req, res, next) => {
    if (req.session.signed && req.url != '/thanks') {
        return res.redirect('/thanks');
    }
    next();
};
exports.ifIsLoggedIn = (req, res, next) => {
    if (req.session.loginID && req.url != '/add_info') {
        return res.redirect('/add_info');
    }
    next();
};
exports.ifIsNotLoggedIn = (req, res, next) => {
    if (!req.session.loginID && req.url != '/register' && req.url != '/login') {
        return res.redirect('/register');
    }
    next();
};