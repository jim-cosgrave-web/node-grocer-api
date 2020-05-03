const jwt = require("jsonwebtoken");

exports.authenticateToken = function(req, res, next) {
    // Gather the jwt access token from the request header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401); // if there isn't any token
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        req.user = user;
        next(); // pass the execution off to whatever request the client intended
    });
}

exports.generateAccessToken = function(username) {
    return jwt.sign(username, process.env.ACCESS_TOKEN_SECRET);
    
    //
    // Not sure why, but I'm unable to set expiresIn
    //
    //return jwt.sign(username, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "7d" });
}