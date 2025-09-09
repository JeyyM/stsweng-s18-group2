const Employee = require('../model/employee');
const isAuthenticated = async (req, res, next) => {
    if (req.session.user) {
        // Always check the latest user status from DB
        const user = await Employee.findById(req.session.user._id);
        if (user && user.is_active === true) {
            req.session.user = user; // Optionally update session with fresh data
            return next();
        } else {
            // Destroy session if user is not active
            req.session.destroy(() => {
                res.clearCookie('connect.sid');
                return res.status(401).json({ message: "Account deactivated" });
            });
            return;
        }
    }
    res.status(401).send('<h1>Not Authorized</h1><p>Please login to continue.</p><a href="https://stsweng-unbound.vercel.app//login">Go to Login</a>');// change href to actual deployed page
};
module.exports = isAuthenticated;