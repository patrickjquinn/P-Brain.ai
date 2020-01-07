function wrap(func) {
    return (req, res, next) => {
        Promise.resolve(func(req, res, next)).catch(err => {
            console.error(err);
            res.status(503).json({ error: err.message });
        });
    };
}

module.exports = wrap;
