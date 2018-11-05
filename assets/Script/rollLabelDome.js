cc.Class({
    extends: cc.Component,

    properties: {
        rollLabel: cc.Node,
    },

    // use this for initialization
    onLoad: function () {

    },

    // called every frame
    update: function (dt) {

    },

    btnClick(e, customEventData) {
        this.rollLabel.getComponent('rollLabel').addNum(customEventData);
    },
    btn2Click(e, customEventData) {
        this.rollLabel.getComponent('rollLabel').initRoolLabelWithText(customEventData);
    },

});
