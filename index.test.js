const supertest = require('supertest');

const {
    app
} = require('./index.js');
const cookieSession = require('cookie-session');
jest.mock('./lib/db.js');

test('if logged out, user is redirected to /registration', () => {
    cookieSession.mockSessionOnce({
        loginID: null
    });
    return supertest(app).get('/welcome').then(res => {
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/register');
    });
});

// test is passed even if statusCode is 404! Why???
test('if logged in, user is redirected from login/registratio to the petition page', () => {
    cookieSession.mockSessionOnce({
        loginID: 3,

    });
    return supertest(app).get('/register').then(res => {
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/add_info');
    });
});


test('if logged in and signed the petition, user will be redirected away from the petition page to the thank you page', () => {
    cookieSession.mockSessionOnce({
        loginID: 3,
        signed: true
    });
    return supertest(app).get('/welcome').then(res => {
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/thanks');
    });
});

test("if logged in but didn't sign the petition, user will be redirected away from the thank you page", () => {
    cookieSession.mockSessionOnce({
        loginID: 3,
        signed: false
    });
    return supertest(app).get('/thanks').then(res => {
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/welcome');

    });
});

test("if signing the petition is successful - redirect to /thanks,", () => {
    cookieSession.mockSessionOnce({
        loginID: 3,
        signed: false
    });
    return supertest(app).post('/welcome').send('signatureUrl=hfjdhsgstefgdj').then(res => {
        expect(res.statusCode).toBe(302);
        expect(res.headers.location).toBe('/thanks');
    });
});