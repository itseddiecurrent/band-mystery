export const scenes = {
  wake: {
    label: '楼上房间',
    image: 'upstairs-wake-up.png',
    hotspots: [{ id: 'phone', label: '发亮的手机', rect: [65, 67, 16, 12] }],
  },
  landing: {
    label: '楼上走廊',
    image: 'upstairs-hallway.png',
    hotspots: [
      { id: 'glass', label: '碎酒杯', rect: [22, 59, 16, 15] },
      { id: 'stairs', label: '楼梯', rect: [59, 56, 26, 25] },
    ],
  },
  arthur: {
    label: '楼梯下',
    image: 'arthur-dead.png',
    hotspots: [
      { id: 'body', label: '检查亚瑟', rect: [13, 13, 42, 48] },
      { id: 'hand', label: '亚瑟的右手', rect: [60, 19, 11, 13] },
    ],
  },
};

export const dialogues = {
  opening: [
    [null, '洛克在楼上房间的沙发上醒来，四周一片昏暗。'],
    ['洛克', '头好晕，我怎么了？'],
    ['洛克', '对了，昨晚刚演完。托尼租了这栋房子，叫大家过来庆功。我在楼上喝了几杯，后来……我只记得这张沙发。'],
    [null, '黑暗里，茶几上有一点光。得先找到能照路的东西。'],
  ],
  phone: [['洛克', '有了！用手机的电筒。']],
  discovery: [
    [null, '洛克把手机电筒往下一照。亚瑟倒在楼梯底。'],
  ],
  examination: [
    [null, '洛克走下楼梯，闻到一股血腥味。'],
    [null, '他蹲下检查。亚瑟已没有呼吸和脉搏，后脑伤得很重。'],
    ['洛克', '像是从楼梯口摔下来的。也可能有人推了他。'],
  ],
  hand: [['洛克', '亚瑟的指甲缝有点黑色的东西，但看不清是什么。']],
};

export const clues = {
  glass: {
    label: '碎酒杯',
    detail: '楼梯口的木地板上散落着碎玻璃，旁边还有一截杯脚。',
  },
  hand: {
    label: '亚瑟的右手',
    detail: '右手紧握，指缝间隐约露出一点银色。指甲缝里有些黑色残屑。',
    image: 'arthur-right-hand.png',
  },
};

export const portrait = {
  洛克: '洛克.png',
  托尼: 'tony.png',
  小莉: '小莉.png',
  亚瑟: 'arthur.png',
  蛋仔: '蛋仔.png',
  小柔: '小柔.png',
  威利: 'willy.png',
};

export const profiles = [
  ['洛克', '调音师', '你扮演的角色。医学系学生，平时帮乐队做现场调音。'],
  ['托尼', '团长 · 贝斯', '负责订场地、安排演出，也是这次庆功宴的组织者。'],
  ['小莉', '鼓手', '乐队的鼓手，留着蓝色短发，戴黑框眼镜。'],
  ['亚瑟', '木吉他', '负责乐队的木吉他演奏，紫色短发，演出时戴着金链。'],
  ['蛋仔', '电吉他', '乐队的电吉他手，戴琥珀色圆框眼镜。'],
  ['小柔', '女主唱', '乐队的女主唱。她和威利曾经交往，分手后仍一起演出。'],
  ['威利', '男主唱 · 键盘', '乐队的另一位主唱，同时负责键盘。'],
];
