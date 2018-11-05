
/**
 *
 */
var RollLabelType = cc.Enum({
    LEFT: 0,
    CENTER: 1,
    RIGHT: 2
});

cc.Class({
    extends: cc.Component,

    properties: {

        roollFontSize: 38,
        roollFontFamily: 'Arial',
        roollLineHeight: 46,
        decimalDigits: 2, // 小数位数, 默认两位(.00),  0：表示整形
        rollLabelColor:  {
            type: cc.Color,
            default:cc.Color.WHITE,
        },
        rollLabelType : {
            type: RollLabelType,
            default:RollLabelType.LEFT,
        },
        lineColor:  {
            type: cc.Color,
            default:cc.Color.WHITE,
        },
        lineWidth: 0.1,
        labelOutLine: {
            type: cc.Boolean,
            default: false,
            // get: function () {
            //     return this._labelOutLine || true;
            // },
            // set: function (value) {
            //     this._labelOutLine = value;
            //     this.lineColor.display = false;
            //     this.lineWidth.display = false;
            // },
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this._initRollLabel();
    },

    // 初始化
    _initRollLabel () {

        /** init data **/
        this.text = 0;
        this.oldTextDigitArray = [];
        this.textDigitArray = []; // [个，十，百，千，万]
        this.animTopDigit = 0;// 播放动画最高位（不变化的高位不播动画）

        this.firstY = 0;
        this.secondY = this.roollLineHeight;

        /** 设置 num **/
        // rollBgNode
        this.rollBgNode = new cc.Node('rollBgNode');
        this.rollBgNode.setAnchorPoint(cc.v2(this.rollLabelType / 2, 1));
        this.rollBgNode.height = this.roollLineHeight;
        let rollBgLayout = this.rollBgNode.addComponent(cc.Layout);
        this.node.addChild(this.rollBgNode);
        rollBgLayout.type = cc.Layout.Type.HORIZONTAL;
        rollBgLayout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
        rollBgLayout.horizontalDirection = cc.Layout.HorizontalDirection.RIGHT_TO_LEFT;


        // digitNode
        this.digitNode = new cc.Node('digitNode');
        this.digitNode.setAnchorPoint(cc.v2(0.5, 1));
        this.digitNode.width = this.roollLineHeight / 2;
        this.digitNode.height = this.roollLineHeight;
        // this.rollBgNode.addChild(this.digitNode);
        let digitMask = this.digitNode.addComponent(cc.Mask);
        digitMask.type = cc.Mask.Type.RECT;


        // numNode
        this.numNode = new cc.Node('numNode');
        this.numNode.setAnchorPoint(cc.v2(0.5, 1));
        this.numNode.width = this.roollLineHeight / 2;
        this.numNode.height = this.roollLineHeight;
        this.digitNode.addChild(this.numNode);
        let numLayout = this.numNode.addComponent(cc.Layout);
        numLayout.type = cc.Layout.Type.VERTICAL;
        numLayout.resizeMode = cc.Layout.ResizeMode.CONTAINER;
        numLayout.horizontalDirection = cc.Layout.HorizontalDirection.TOP_TO_BOTTOM;



        // showLabelNode
        this.showLabelNode = new cc.Node('showLabel');
        this.showLabelNode.setAnchorPoint(cc.v2(0.5, 1));
        this.showLabelNode.color = this.rollLabelColor;
        this.numNode.addChild(this.showLabelNode);
        let showLabel = this.showLabelNode.addComponent(cc.Label);
        showLabel.string = 0;
        showLabel.lineHeight = this.roollLineHeight;
        showLabel.fontSize = this.roollFontSize;
        showLabel.fontFamily = this.roollFontFamily;

        if (this.labelOutLine) {
            let showLabelOutLine = this.showLabelNode.addComponent(cc.LabelOutline);
            showLabelOutLine.width = this.lineWidth;
            showLabelOutLine.color = this.lineColor;
        }

        // readyLabelNode
        this.readyLabelNode = new cc.Node('readyLabel');
        this.readyLabelNode.setAnchorPoint(cc.v2(0.5, 1));
        this.readyLabelNode.color = this.rollLabelColor;
        this.numNode.addChild(this.readyLabelNode);
        let readyLabel = this.readyLabelNode.addComponent(cc.Label);
        readyLabel.string = 1;
        readyLabel.lineHeight = this.roollLineHeight;
        readyLabel.fontSize = this.roollFontSize;
        readyLabel.fontFamily = this.roollFontFamily;

        if (this.labelOutLine) {
            let readyLabelOutLine = this.readyLabelNode.addComponent(cc.LabelOutline);
            readyLabelOutLine.width = this.lineWidth;
            readyLabelOutLine.color = this.lineColor;
        }


        /** 设置 digit **/
        this.digitNodeArray = [];

        // 添加小数部分
        for (let i = 0; i < this.decimalDigits; i++) {
            let digitNode = cc.instantiate(this.digitNode);
            digitNode.getChildByName('numNode').getChildByName('showLabel').getComponent(cc.Label).string = 0;
            digitNode.getChildByName('numNode').getChildByName('readyLabel').getComponent(cc.Label).string = 1;
            this.rollBgNode.addChild(digitNode);
            this.digitNodeArray.push(digitNode); // 节点管理
            this.textDigitArray.push(0); // 数值管理
        }

        // 小数点
        if ( this.decimalDigits > 0) {
            let pointNode = cc.instantiate(this.digitNode);
            pointNode.getChildByName('numNode').getChildByName('showLabel').getComponent(cc.Label).string = '.';
            pointNode.getChildByName('numNode').getChildByName('readyLabel').getComponent(cc.Label).string = '.';
            this.rollBgNode.addChild(pointNode);
        }

        // 默认个位整数
        // this.digitNode.removeFromParent();
        this.rollBgNode.addChild(this.digitNode);
        this.digitNodeArray.push(this.digitNode);
        this.textDigitArray.push(0); // 数值管理
    },


    // 初始化label
    initRoolLabelWithText (text) {

        // 移除节点并初始化
        this.digitNodeArray.map(function (v, i) {
            v.getChildByName('numNode').stopAllActions();
        }.bind(this));
        this.node.removeAllChildren();
        this._initRollLabel();

        // 处理数据
        text = text / 1 || 0;
        this.text = text;
        text = text.toFixed(this.decimalDigits); // 格式化到小数点指定位数
        text = text.split(".").join("");
        this.oldTextDigitArray = this.textDigitArray;
        this.textDigitArray = [];
        this._analysisText(text);
        this._analysisAnimTopDigit();

        // 创建没有的位
        for (let i = 0; i < this.textDigitArray.length - this.oldTextDigitArray.length; i++) {
            let digitNode = cc.instantiate(this.digitNode);
            digitNode.getChildByName('numNode').getChildByName('showLabel').getComponent(cc.Label).string = 0;
            digitNode.getChildByName('numNode').getChildByName('readyLabel').getComponent(cc.Label).string = 1;
            this.rollBgNode.addChild(digitNode);
            this.digitNodeArray.push(digitNode);
        }

        // 初始化值
        this.textDigitArray.map(function (v, i) {
            let __showNum = this.textDigitArray[i]; // 当前位转到的目标值
            let  __readyNum = (__showNum + 1) > 9 ? 0 :(__showNum + 1);
            this.digitNodeArray[i].getChildByName('numNode').y = this.firstY;
            this.digitNodeArray[i].getChildByName('numNode').getChildByName('showLabel').getComponent(cc.Label).string = __showNum;
            this.digitNodeArray[i].getChildByName('numNode').getChildByName('readyLabel').getComponent(cc.Label).string = __readyNum;
        }.bind(this));
    },


    // 设置label text
    setRoolLabelText (text) {

        if (text <= this.text) {
            return;
        }
        this.text = text;
        text = text.toFixed(this.decimalDigits); // 格式化到小数点指定位数
        text = text.split(".").join("");
        this.oldTextDigitArray = this.textDigitArray;
        this.textDigitArray = [];
        this._analysisText(text);
        this._analysisAnimTopDigit();

        // 创建没有的位
        for (let i = 0; i < this.textDigitArray.length - this.oldTextDigitArray.length; i++) {
            let digitNode = cc.instantiate(this.digitNode);
            digitNode.getChildByName('numNode').getChildByName('showLabel').getComponent(cc.Label).string = 0;
            digitNode.getChildByName('numNode').getChildByName('readyLabel').getComponent(cc.Label).string = 1;
            this.rollBgNode.addChild(digitNode);
            this.digitNodeArray.push(digitNode);
        }

        this._rollNumber(0); // 滚动个位(数组下标0的值)
    },

    // 增加
    addNum (num) {
        let count = this.text / 1 + num / 1;
        this.setRoolLabelText(count);
    },

    // 滚动到指定数字
    _rollNumber (index, cb) {

        let _showNum = this.digitNodeArray[index].getChildByName('numNode').getChildByName('showLabel').getComponent(cc.Label).string;
        let textDigit = this.textDigitArray[index]; // 当前位转到的目标值
        let count = 0;
        let isStop = false;

        // 如果最高位相同，则不播放动画
        if (index > this.animTopDigit) {
            if (_showNum == textDigit) {

                setTimeout(function () {
                    this.digitNodeArray[index].getChildByName('numNode').stopAllActions();
                    //
                    let  __readyNum = (textDigit + 1) > 9 ? 0 :(textDigit + 1);
                    this.digitNodeArray[index].getChildByName('numNode').y = this.firstY;
                    this.digitNodeArray[index].getChildByName('numNode').getChildByName('showLabel').getComponent(cc.Label).string = textDigit;
                    this.digitNodeArray[index].getChildByName('numNode').getChildByName('readyLabel').getComponent(cc.Label).string = __readyNum;
                }.bind(this), 0);
                typeof cb == 'function' && cb();
                return;
            }
        }

        // 动画
        this.digitNodeArray[index].getChildByName('numNode').y = this.firstY;
        this.digitNodeArray[index].getChildByName('numNode').stopAllActions();
        let duration = 0.1 - 0.01 * (this.animTopDigit - index);
        let m = cc.moveTo(duration, 0, this.secondY).easing(cc.easeOut(1));
        let f = cc.callFunc(function () {

            let _readyNum = this.digitNodeArray[index].getChildByName('numNode').getChildByName('readyLabel').getComponent(cc.Label).string;
            _showNum = _readyNum;
            ++_readyNum;
            _readyNum = _readyNum > 9 ? 0 : _readyNum;

            if (count >= 0) {
                count++;
            }
            if (count > 0 && index + 1 < this.textDigitArray.length) {
                count = -9999;
                setTimeout(function () {
                    this._rollNumber(index + 1, function () {
                        isStop = true;
                    });
                }.bind(this),0)
            }

            this.digitNodeArray[index].getChildByName('numNode').y = this.firstY;
            this.digitNodeArray[index].getChildByName('numNode').getChildByName('showLabel').getComponent(cc.Label).string = _showNum;
            this.digitNodeArray[index].getChildByName('numNode').getChildByName('readyLabel').getComponent(cc.Label).string = _readyNum;

            if (isStop || index == this.textDigitArray.length - 1) {
                if (_showNum == textDigit) {
                    setTimeout(function () {
                        this.digitNodeArray[index].getChildByName('numNode').stopAllActions();
                        //
                        let  __readyNum = (textDigit + 1) > 9 ? 0 :(textDigit + 1);
                        this.digitNodeArray[index].getChildByName('numNode').y = this.firstY;
                        this.digitNodeArray[index].getChildByName('numNode').getChildByName('showLabel').getComponent(cc.Label).string = textDigit;
                        this.digitNodeArray[index].getChildByName('numNode').getChildByName('readyLabel').getComponent(cc.Label).string = __readyNum;
                    }.bind(this), 0);
                    typeof cb == 'function' && cb();
                }

            }
        }.bind(this));
        this.digitNodeArray[index].getChildByName('numNode').runAction(cc.sequence(m, f).repeatForever());
    },

    // 解析数据
    _analysisText (text) {

        if (text <= 0) {
            return;
        }

        for (let i = text.length - 1; i >= 0; i--) {
            this.textDigitArray.push(text[i]);
        }
    },

    // 计算播放动画最高位（不变化的高位不播动画）
    _analysisAnimTopDigit () {

        this.animTopDigit = 0;
        if (this.textDigitArray.length > this.oldTextDigitArray.length) {
            this.animTopDigit = this.textDigitArray.length - 1;
        } else {
            for (let i = this.textDigitArray.length - 1; i >= 0; --i ) {
                let oldTextDigit = this.oldTextDigitArray[i];
                let textDigit = this.textDigitArray[i];
                if (oldTextDigit != textDigit) {
                    this.animTopDigit = i;
                    return;
                }
            }
        }
    },

});
