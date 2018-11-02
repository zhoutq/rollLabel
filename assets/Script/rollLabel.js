/**
 *
 */
cc.Class({
    extends: cc.Component,

    properties: {
        rollBgNode: cc.Node,
        digitNode: cc.Node,
        numNode: cc.Node,
        showLabelNode: cc.Node,
        decimalDigits: 2, // 小数位数, 默认两位(.00),  0：表示整形
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.text = 0;
        this.oldTextDigitArray = [];
        this.textDigitArray = []; // [个，十，百，千，万]
        this.animTopDigit = 0;// 播放动画最高位（不变化的高位不播动画）

        this._initRollLabel();
    },

    // 初始化
    _initRollLabel () {

        /** 设置 num **/
        // label
        this.showLabelNode.getComponent(cc.Label).string = 0;
        this.readyLabelNode = cc.instantiate(this.showLabelNode);
        this.readyLabelNode.name = 'readyLabel';
        this.readyLabelNode.getComponent(cc.Label).string = 1;
        this.numNode.addChild(this.readyLabelNode);

        // num  w = lab.w
        this.numNode.width = this.showLabelNode.width;

        // digit w = lab.w, h = lab.lh
        this.digitNode.width = this.showLabelNode.width;
        this.digitNode.height = this.showLabelNode.getComponent(cc.Label).lineHeight;

        // rollBg  h
        this.rollBgNode.height = this.showLabelNode.getComponent(cc.Label).lineHeight;

        // digit count   todo

        this.firstY = 0;
        this.secondY = this.showLabelNode.getComponent(cc.Label).lineHeight;

        /** 设置 digit **/
        this.digitNodeArray = [];

        // 添加小数部分
        for (let i = 0; i < this.decimalDigits; i++) {
            let digitNode = cc.instantiate(this.digitNode);
            digitNode.getChildByName('num').getChildByName('showLabel').getComponent(cc.Label).string = 0;
            digitNode.getChildByName('num').getChildByName('readyLabel').getComponent(cc.Label).string = 1;
            this.rollBgNode.addChild(digitNode);
            this.digitNodeArray.push(digitNode); // 节点管理
            this.textDigitArray.push(0); // 数值管理
        }

        // 小数点
        if ( this.decimalDigits > 0) {
            let pointNode = cc.instantiate(this.digitNode);
            pointNode.getChildByName('num').getChildByName('showLabel').getComponent(cc.Label).string = '.';
            pointNode.getChildByName('num').getChildByName('readyLabel').getComponent(cc.Label).string = '.';
            this.rollBgNode.addChild(pointNode);
        }

        // 默认个位整数
        this.digitNode.removeFromParent();
        this.rollBgNode.addChild(this.digitNode);
        this.digitNodeArray.push(this.digitNode);
        this.textDigitArray.push(0); // 数值管理
    },


    // 增加
    addNum (num) {
        let count = this.text / 1 + num / 1;
        this.setRoolLabelText(count);
    },

    // 设置label
    setRoolLabelText (text) {

        if (text <= this.text) {
            return;
        }
        this.text = text;
        text = text.toFixed(this.decimalDigits) + ''; // 格式化到小数点指定位数
        text = text.split(".").join("");
        this.oldTextDigitArray = this.textDigitArray;
        this.textDigitArray = [];
        this._analysisText(text);
        this._analysisAnimTopDigit();

        // 创建没有的位
        for (let i = 0; i < this.textDigitArray.length - this.oldTextDigitArray.length; i++) {
            let digitNode = cc.instantiate(this.digitNode);
            digitNode.getChildByName('num').getChildByName('showLabel').getComponent(cc.Label).string = 0;
            digitNode.getChildByName('num').getChildByName('readyLabel').getComponent(cc.Label).string = 1;
            this.rollBgNode.addChild(digitNode);
            this.digitNodeArray.push(digitNode);
        }

        this._rollNumber(0); // 滚动个位(数组下标0的值)
    },

    // 滚动到指定数字
    _rollNumber (index, cb) {

        let _showNum = this.digitNodeArray[index].getChildByName('num').getChildByName('showLabel').getComponent(cc.Label).string;
        let textDigit = this.textDigitArray[index]; // 当前位转到的目标值
        let count = 0;
        let isStop = false;

        // 如果最高位相同，则不播放动画
        if (index > this.animTopDigit) {
            if (_showNum == textDigit) {
                this.digitNodeArray[index].getChildByName('num').stopAllActions();
                typeof cb == 'function' && cb();
                return;
            }
        }

        // 动画
        this.digitNodeArray[index].getChildByName('num').y = this.firstY;
        this.digitNodeArray[index].getChildByName('num').stopAllActions();
        let duration = 0.1 - 0.01 * (this.animTopDigit - index);
        let m = cc.moveTo(duration, 0, this.secondY).easing(cc.easeOut(1));
        let f = cc.callFunc(function () {

            let _readyNum = this.digitNodeArray[index].getChildByName('num').getChildByName('readyLabel').getComponent(cc.Label).string;
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

            this.digitNodeArray[index].getChildByName('num').y = this.firstY;
            this.digitNodeArray[index].getChildByName('num').getChildByName('showLabel').getComponent(cc.Label).string = _showNum;
            this.digitNodeArray[index].getChildByName('num').getChildByName('readyLabel').getComponent(cc.Label).string = _readyNum;

            if (isStop || index == this.textDigitArray.length - 1) {
                if (_showNum == textDigit) {
                    this.digitNodeArray[index].getChildByName('num').stopAllActions();
                    typeof cb == 'function' && cb();
                }

            }
        }.bind(this));
        this.digitNodeArray[index].getChildByName('num').runAction(cc.sequence(m, f).repeatForever());
    },

    // 解析数据
    _analysisText (text) {

        if (text <= 0) {
            return;
        }

        let _integer = parseInt(text / 10); // 取整
        let _remainder = text % 10; // 取余

        this.textDigitArray.push(_remainder);
        this._analysisText(_integer);

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
