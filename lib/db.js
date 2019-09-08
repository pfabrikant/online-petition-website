var spicedPg = require('spiced-pg');
var db = spicedPg(process.env.DATABASE_URL || 'postgres:postgres:postgres@localhost:5432/signatures');

exports.getRowCount = function() {
    return db.query(`SELECT COUNT (*) FROM signatures`);
};

exports.getRows = function() {
    return db.query(`SELECT first, last, age, city, url FROM users FULL OUTER JOIN user_profiles ON users.id = user_profiles.user_ID`);
};
exports.getProfile = function(id) {
    return db.query(`SELECT first, last, email, password, age, city, url FROM users FULL OUTER JOIN user_profiles ON users.id = user_profiles.user_ID WHERE users.id=${id}`);
};

exports.insertSignature = function(signature, id) {
    return db.query(`INSERT INTO signatures (signature, user_ID) VALUES ('${signature}', ${id});`);
};

exports.insertLogin = function(a, b, c, d) {
    return db.query(`INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id;`, [a, b, c, d]);
};
exports.getLogin = function(email) {
    return db.query(`SELECT id, password FROM users WHERE email='${email}'`);
};

exports.getSignatureUrl = function(id) {
    return db.query(`SELECT signature FROM signatures WHERE user_ID='${id}'`);
};

exports.getNameAndSignature = function(id) {
    return db.query(`SELECT first, signature FROM users FULL OUTER JOIN signatures on users.id = signatures.user_ID WHERE users.id='${id}'`);
};

exports.addInfo = function(id, a, b, c) {
    return db.query(`INSERT INTO user_profiles (user_ID, age, city, url) VALUES ($1, $2, $3, $4);`, [id, a, b, c]);
};
exports.checkIfInfoAdded = function(id) {
    return db.query(`SELECT age, city, url FROM user_profiles FULL OUTER JOIN users on users.id = user_profiles.user_ID WHERE users.id='${id}'`);
};
exports.getCityRows = function(city) {
    return db.query(`SELECT first, last, age, url FROM users FULL OUTER JOIN user_profiles ON users.id = user_profiles.user_ID WHERE LOWER(user_profiles.city)='${city}'`);
};
exports.updateUsersNoPassword = function(id, first, last, email) {
    return db.query(`UPDATE users SET first = $2, last = $3, email = $4 WHERE id = $1;`, [id, first, last, email]);
};
exports.updateUsersWithPassword = function(id, first, last, email, password) {
    return db.query(`UPDATE users SET first = $2, last = $3, email = $4, password = $5 WHERE id = $1;`, [id, first, last, email, password]);
};
exports.upsertUserProfile = function(id, age, city, url) {
    return db.query(`INSERT INTO user_profiles (user_ID, age, city, url) VALUES ($1,$2,$3,$4)
ON CONFLICT (user_ID)
DO UPDATE SET age = $2, city = $3, url= $4;`, [id, age, city, url]);
};
exports.deleteSignature = function(id) {
    return db.query(`DELETE FROM signatures WHERE user_ID=${id};`);
};