const ObjectID = require('mongodb').ObjectID;

class Part {
    constructor(partId, count, img){
        this.id = new ObjectID();
        this.partId = partId;
        this.count = count;
        this.img = img;
    }
}

module.exports = Part;