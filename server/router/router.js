const express = require('express');
const ObjectID = require('mongodb').ObjectID;
const User = require('../schemas/user');
const Part = require('../schemas/part');
const Set = require('../schemas/set');
const indicative = require('indicative');
const util = require('util');


const userValidator = {
    username: 'string|max:15',
    password: 'string',
}

const partValidator = {
    partId: 'string',
    count: 'integer',
    img: 'string|max:2048'
}

const setValidator = {
    setId: 'string',
    partsList: 'array',
    partsCount: 'array'
}

const setIdValidator = {
    setId: 'string',
}

const router = express.Router();

router.post("/parts", async function (req, res) {
    const part = req.body;
    console.log(part);
    indicative.validator.validate(part, partValidator).then(async () => {
        try {
            const newPart = new Part(part.partId, part.count, part.img);

            const query = { partId: part.partId }
            const foundPart = await req.app.locals.db.collection('parts').findOne(query);
            if (!foundPart) {
                req.app.locals.db.collection('parts').insertOne(newPart).then(r => {
                    if (r.result.ok && r.insertedCount === 1) {
                        console.log(`Created part: ${newPart}`);
                        res.status(201).location(`/api/parts/${newPart.partId}`).json(newPart);
                    } else {
                        sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                    }
                }).catch(err => {
                    console.log("Error: Post unsuccessfull.");
                    sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                })
            }
            else {
                foundPart.count += part.count;
                const newValues = { $set: foundPart };
                req.app.locals.db.collection('parts').updateOne(query, newValues).then(r => {
                    if (r.result.ok) {
                        return res.status(200).json(foundPart);
                    } else {
                        sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                    }
                }).catch(err => {
                    console.log("Error: Update unsuccessfull.");
                    sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                })
            }
        } catch (err) {
            console.error(err);

            return res.status(400).json({
                message: `An error occured:: ${err.message}`,
            });
        }
    }).catch(errors => {
        sendErrorResponse(req, res, 400, `Invalid part data: ${util.inspect(errors)}`);
    });
});

router.post("/parts/:username", async function (req, res) {
    const part = req.body;
    console.log(part);
    indicative.validator.validate(part, partValidator).then(async () => {
        try {
            const newPart = new Part(part.partId, part.count, part.img);
            const query = { partId: part.partId }
            const foundPart = await req.app.locals.db.collection("parts-" + req.params.username).findOne(query);
            if (!foundPart) {
                if (part.count > 0) {
                    req.app.locals.db.collection("parts-" + req.params.username).insertOne(newPart).then(r => {
                        if (r.result.ok && r.insertedCount === 1) {
                            console.log(`Created part: ${newPart}`);
                            res.status(201).location(`/api/parts/${req.params.username}/${newPart.partId}`).json(newPart);
                        } else {
                            sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                        }
                    }).catch(err => {
                        console.log("Error: Post unsuccessfull.");
                        sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                    })
                }
                return res.status(404).json({ message: "Part not found" });
            }
            else {
                foundPart.count += part.count;
                if (foundPart.count <= 0) {
                    req.app.locals.db.collection("parts-" + req.params.username).deleteOne(query).then(r => {
                        if (r.result.ok) {
                            return res.status(200).json(foundPart);
                        } else {
                            sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                        }
                    }).catch(err => {
                        console.log("Error: Update unsuccessfull.");
                        sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                    })
                }
                else {
                    const newValues = { $set: foundPart };
                    req.app.locals.db.collection("parts-" + req.params.username).updateOne(query, newValues).then(r => {
                        if (r.result.ok) {
                            return res.status(200).json(foundPart);
                        } else {
                            sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                        }
                    }).catch(err => {
                        console.log("Error: Update unsuccessfull.");
                        sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                    })
                }
            }
        } catch (err) {
            console.error(err);

            return res.status(400).json({
                message: `An error occured:: ${err.message}`,
            });
        }
    }).catch(errors => {
        sendErrorResponse(req, res, 400, `Invalid part data: ${util.inspect(errors)}`);
    });
});

router.get("/parts-get", function (req, res) {
    req.app.locals.db.collection('parts').find().toArray().then(parts => {
        res.json(parts);
    });
});

router.get("/parts/:partId", async function (req, res) {
    const query = { partId: req.params.partId }
    const part = await req.app.locals.db.collection('parts').findOne(query);
    if (!part) {
        return res.status(404).json({ message: "Part not found" });
    } else {
        console.log(part);
        return res.status(200).json(part);
    }
});

router.get("/parts-get/:username", function (req, res) {
    req.app.locals.db.collection("parts-" + req.params.username).find().toArray().then(parts => {
        return res.json(parts);
    });
});

router.get("/sets/:setId", async function (req, res) {
    const query = { setId: req.params.setId }
    const set = await req.app.locals.db.collection('sets').findOne(query);
    if (!set) {
        return res.status(404).json({ message: "Set not found" });
    } else {
        console.log(set);
        return res.status(200).json(set);
    }
});

router.get("/sets-all", async function (req, res) {
    req.app.locals.db.collection('sets').find().toArray().then(sets => {
        res.status(200).json(sets);
    });
});

router.post("/sets", async function (req, res) {
    const set = req.body;
    console.log(set);
    indicative.validator.validate(set, setValidator).then(async () => {
        try {
            const newSet = new Set(set.setId, set.partsList, set.partsCount, set.img);

            const query = { setId: set.setId }
            const foundSet = await req.app.locals.db.collection('sets').findOne(query);
            if (!foundSet) {
                req.app.locals.db.collection('sets').insertOne(newSet).then(r => {
                    if (r.result.ok && r.insertedCount === 1) {
                        console.log(`Created set: ${newSet}`);
                        res.status(201).location(`/api/sets/${newSet.setId}`).json(newSet);
                    } else {
                        sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                    }
                }).catch(err => {
                    console.log("Error: Post unsuccessfull.");
                    sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                })
            } else {
                res.status(304).location(`/api/sets/${newSet.setId}`).json(foundSet);
            }
        } catch (err) {
            console.error(err);

            return res.status(400).json({
                message: `An error occured:: ${err.message}`,
            });
        }
    }).catch(errors => {
        sendErrorResponse(req, res, 400, `Invalid set data: ${util.inspect(errors)}`);
    });
});

router.get("/users/:username", async function (req, res) {
    const query = { username: req.params.username }
    const user = await req.app.locals.db.collection('users').findOne(query);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    } else {
        console.log(user);
        return res.status(200).json(user);
    }
});

router.post("/register", async function (req, res) {
    const user = req.body;
    console.log(user);
    indicative.validator.validate(user, userValidator).then(async () => {
        try {
            const newUser = new User(user.username, user.password);

            const query = { username: user.username }
            const foundUser = await req.app.locals.db.collection('users').findOne(query);
            if (!foundUser) {
                req.app.locals.db.collection('users').insertOne(newUser).then(r => {
                    if (r.result.ok && r.insertedCount === 1) {
                        console.log(`Created new user: ${newUser}`);
                        res.status(201).location(`/api/users/${newUser.username}`).json(newUser);
                    } else {
                        sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                    }
                }).catch(err => {
                    console.log("Error: Post unsuccessfull.");
                    sendErrorResponse(req, res, 500, `Server error: ${err.message}`, err);
                })
            } else {
                res.status(304).location(`/api/users/${foundUser.username}`).json(foundUser);
            }
        } catch (err) {
            console.error(err);

            return res.status(400).json({
                message: `An error occured:: ${err.message}`,
            });
        }
    }).catch(errors => {
        sendErrorResponse(req, res, 400, `Invalid set data: ${util.inspect(errors)}`);
    });
});

sendErrorResponse = function (req, res, status, message, err) {
    if (req.get('env') !== 'development') {
        err = undefined;
    }
    res.status(status).json({
        code: status,
        message,
        error: err
    })
}

module.exports = router;
