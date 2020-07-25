const ObjectID = require('mongodb').ObjectID;

class Set {
    constructor(setId, partList, partsCount, img){
        this.id = new ObjectID();
        this.setId = setId;
        this.partsList = partList;
        this.partsCount = partsCount;
        this.img = img;
    }
}

module.exports = Set;