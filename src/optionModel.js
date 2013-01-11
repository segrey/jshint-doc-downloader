function Group(title, description) {
    this.title = title;
    this.description = description;
    this.options = {};
}

Group.prototype.addOption = function(name, description) {
    if (this.options[name] != null) {
        throw new Error("Duplicate option: " + name);
    }
    this.options[name] = description;
};

exports.createGroup = function() {
    var obj = Object.create(Group.prototype);
    Group.apply(obj, arguments);
    return obj;
};
