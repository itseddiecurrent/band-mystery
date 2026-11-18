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
      { id: 'arthur-phone', label: '检查亚瑟的裤袋', rect: [57, 59, 17, 15] },
    ],
  },
  tony: {
    label: '托尼的隔间',
    image: 'tony-bedroom.png',
    hotspots: [
      { id: 'wake-tony', label: '叫醒托尼', rect: [16, 39, 23, 31] },
      { id: 'milk', label: '床头的牛奶杯', rect: [51, 55, 7, 12] },
      { id: 'backdoor', label: '去后门', rect: [70, 14, 22, 69] },
    ],
  },
  lili: {
    label: '后门台阶',
    image: 'lili-backdoor.png',
    hotspots: [{ id: 'lili-testimony', label: '查看小莉的情况', rect: [26, 18, 47, 48] }],
  },
  yard: {
    label: '后院',
    image: 'backyard-rear-door.png',
    hotspots: [
      { id: 'drink', label: '窗台上的饮料罐', rect: [63, 35, 8, 14] },
      { id: 'cornfield', label: '去玉米地', rect: [81, 37, 18, 52] },
    ],
  },
  cornfield: {
    label: '玉米地',
    image: 'miko-cornfield.png',
    hotspots: [
      { id: 'miko-knife', label: '查看小柔手里的水果刀', rect: [61, 34, 14, 10] },
      { id: 'miko-wrist', label: '查看小柔手腕的伤', rect: [27, 73, 8, 8] },
      { id: 'miko-breathing', label: '检查小柔的呼吸', rect: [18, 29, 12, 17] },
      { id: 'miko-missing-shoe', label: '查看小柔的脚', rect: [80, 55, 19, 34] },
    ],
  },
  fireplace: {
    label: '客厅',
    image: 'living-room-fireplace.png',
    hotspots: [{ id: 'jammer', label: '查看壁炉里的红灯', rect: [76, 48, 10, 13] }],
  },
  'danzai-statement': {
    label: '后门',
    image: 'backyard-rear-door.png',
    hotspots: [{ id: 'danzai-testimony', label: '问蛋仔昨晚的经过', rect: [28, 18, 19, 51] }],
  },
  police: {
    label: '楼梯口',
    image: 'police-staircase-cordon.png',
    hotspots: [],
  },
  'clip-detail': {
    label: '警方取出的领带夹',
    image: 'willy-tie-clip.png',
    hotspots: [],
  },
  'group-photo': {
    label: '当晚的演出合照',
    image: 'band-group-photo.png',
    hotspots: [{ id: 'compare-clip', label: '比对威利胸前的领带夹', rect: [53, 53, 5, 6] }],
  },
  'old-photo': {
    label: '去年夏天的演出合照',
    image: 'band-group-photo-last-summer.png',
    hotspots: [{ id: 'record-old-photo', label: '查看去年夏天的合照', rect: [0, 0, 100, 100] }],
  },
  hospital: {
    label: '医院病房',
    image: 'hospital-visit.png',
    hotspots: [],
  },
};

// Physical connections are independent of which story events are ready.
export const nearbyScenes = {
  landing: ['arthur'],
  arthur: ['landing', 'tony'],
  tony: ['arthur', 'yard'],
  yard: ['tony', 'cornfield', 'fireplace'],
  cornfield: ['yard'],
  fireplace: ['yard'],
};

export const dialogues = {
  opening: [
    [null, '洛克在楼上房间的沙发上醒来，四周一片昏暗。'],
    ['洛克', '头好晕，我怎么了？'],
    ['洛克', '对了，昨晚刚演完。托尼租了这栋房子，叫大家过来庆功。'],
    [null, '洛克想起小柔昨晚跟他说过的话。'],
  ],
  'opening-memory': [
    [null, '昨天晚上。'],
    ['小柔', '洛克，有你和我们一起真好，演出这么成功多亏了你的调音了！'],
    ['洛克', '哪里哪里，你们演得好啊，一个晚上都是粉丝的尖叫声。'],
    ['小柔', '兄弟，得好好跟你喝一杯！'],
    ['洛克', '哈哈哈哈，我感觉今晚喝得有点多了。'],
    ['小柔', '你从彩排忙到现在，连晚饭都没顾上吧？先歇一会儿。'],
    ['小柔', '等我去给你拿杯水！'],
    [null, '……'],
  ],
  'opening-return': [
    ['洛克', '我记得然后我就睡着了。喝太多了吗？太久没喝了。'],
    ['洛克', '倒是她笑起来的样子，我还记得很清楚。'],
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
  'tony-arrival': [[null, '洛克走进隔间，打开灯。托尼还躺在床上。']],
  'wake-tony': [
    ['洛克', '托尼，醒醒。亚瑟死了。'],
    ['托尼', '什么？他昨晚还好好的。'],
  ],
  milk: [
    ['洛克', '昨晚后来发生了什么？这杯牛奶是谁倒的？'],
    ['托尼', '你在楼上喝着喝着就睡了，我们就下楼继续喝。我不舒服，小柔给我端了杯牛奶。我喝了几口就困得起不来，隐约听见有人吵架，也可能是在做梦。'],
    ['洛克', '其他人呢？'],
    ['托尼', '不知道。先报警吧。'],
    [null, '托尼拿起手机拨打报警电话，电话没有接通。洛克也试了一次，屏幕上显示“无服务”。'],
    ['洛克', '两部手机都没信号，Wi-Fi 也搜不到。昨晚我还在楼梯口接过电话。'],
    [null, '托尼掀开被子，刚把脚放到地上，又停住了。'],
    ['托尼', '我昨晚也在楼下发过消息。你亲眼看见亚瑟摔下去了？'],
    ['洛克', '我醒来时就我一个人。下楼找到他的时候，他已经躺在那里了。'],
    [null, '洛克用手电照向杯口，看见几粒没化开的白色粉末。'],
    ['洛克', '杯口有白色粉末。你看见小柔倒牛奶了吗？'],
    ['托尼', '没有，她在厨房倒的。她把杯子放下以后，我还出去拿过水。'],
    ['洛克', '可能是安眠药。杯子留在这儿，先找人。'],
  ],
  backdoor: [
    [null, '两人打开手机手电，走出隔间。走廊尽头通往后院的门虚掩着，冷风从门缝里吹进来。'],
    ['托尼', '后门怎么开着？昨晚是我关的。'],
    ['洛克', '等等。台阶下面好像有人。'],
    [null, '洛克推开后门，把光往台阶下移。有人侧倒在后院的石板边。托尼跟出来，把手电照向那人的脸。'],
  ],
  'lili-discovery': [['托尼', '小莉？']],
  'lili-testimony': [
    [null, '洛克下台阶，蹲到小莉身边，叫了她一声。小莉昏倒在地，还有呼吸，但没有回应。'],
    [null, '过了一会儿，小莉皱了皱眉，慢慢睁开眼睛。托尼把手机的光移到一旁。'],
    ['小莉', '洛克？……我怎么还在外面？'],
    ['洛克', '你没事吧？有没有受伤？'],
    ['小莉', '头好晕。洛克？发生了什么？'],
    ['洛克', '你记得昨晚发生了什么吗？'],
    ['小莉', '我跟蛋仔在后院抽烟，听见小柔、亚瑟和威利在吵。小柔在哭，他们在吵什么我也没听清，只是他们情绪很激动。然后屋里“咚”的一声，紧接着就是玻璃碎的声音。'],
    ['洛克', '蛋仔呢？'],
    ['小莉', '他先进屋，让我等。我没等到他，有点晕，还是上了台阶。刚要拉门，门就从里面撞到我肩膀，我往后一退就踩空了。门板挡着，我没看见是谁。'],
  ],
  drink: [
    ['洛克', '窗台上那罐是你的？'],
    ['小莉', '嗯，抽烟那会儿喝了两口，就搁那儿了。'],
  ],
  'yard-report': [
    [null, '托尼从停车处跑回来，手里还攥着车钥匙。'],
    ['托尼', '我车窗被砸了。后座那个箱子也没了，里面是演出会用到的信号屏蔽器，虽然这次没用到，但我一直放车里。'],
    ['小莉', '有人开了屏蔽器，所以我们打不出去？'],
    [null, '蛋仔从玉米地里钻出来，裤腿上都是泥。'],
    ['蛋仔', '小柔在玉米地里，我叫不醒她。电话也打不通，快来帮忙。'],
  ],
  cornfield: [
    [null, '蛋仔带众人进入玉米地。小柔倒在垄沟边，手腕受了伤。洛克叫她，她没有回应。托尼蹲下来守着她，小莉留在地边给洛克照路。'],
    ['托尼', '洛克，去找那个箱子。找到就打电话，我在这儿等你。'],
    ['洛克', '小柔，是我。托尼在这儿陪你。我很快就回来。'],
  ],
  jammer: [[null, '壁炉里有个指示灯在闪。洛克用手电一照，认出是托尼丢失的设备。']],
  'call-police': [
    [null, '洛克关掉屏蔽器，指示灯熄灭。手机重新显示信号。'],
    ['洛克', '喂，我要报警。这里有一个人死了，后院还有一个人昏迷。请派救护车。'],
  ],
  'danzai-arrival': [[null, '等待救援时，洛克在后门遇见蛋仔。']],
  'danzai-testimony': [
    ['洛克', '小莉说你听到响声就先进了屋。你当时看见了什么？'],
    ['蛋仔', '我在楼上拿手机往下一照，亚瑟已经躺在那儿了。我就没下去。后来听见车响，应该是威利走了。'],
  ],
  'police-arrival': [
    [null, '救护人员把小柔送往医院，也检查了小莉的伤。警方拉起警戒带，封锁了楼梯口。'],
  ],
  'inspect-clip': [[null, '警方从亚瑟右手取出一枚领带夹。洛克认出那就是他先前在指缝里看见的银色物件。夹面上有三道斜纹。']],
  'ask-tony-photo': [
    ['洛克', '这个花纹……托尼，你昨晚是不是拍了合照？'],
    ['托尼', '拍了。收工的时候，大家还没换衣服。'],
  ],
  'compare-clip': [
    [null, '威利领带上的夹子和亚瑟手里的一样。照片里的亚瑟站在他旁边，手还搭着他的肩膀。'],
    ['洛克', '亚瑟摔下去的时候，可能抓住了威利的领带夹。'],
  ],
  'hospital-arrival': [
    [null, '小柔脱离危险。她手腕上的伤没有危及生命。警方征得她同意后，让洛克来见她。'],
    ['小柔', '洛克，你能坐近一点吗？我现在说话没什么力气。'],
    ['洛克', '嗯。你慢慢说，我在这儿。'],
    [null, '小柔说医生确认她此前怀孕约两个月，已经流产。'],
  ],
};

export const clues = {
  'miko-knife': {
    label: '小柔手里的水果刀',
    detail: '小柔手里拿着的是水果刀，应该是厨房里的。',
  },
  'miko-wrist': {
    label: '小柔手腕的伤',
    detail: '伤口不深，但流了很多血，得快点接受治疗！',
  },
  'miko-breathing': {
    label: '小柔的呼吸',
    detail: '小柔没有死，还活着，气息很微弱。',
  },
  'miko-missing-shoe': {
    label: '小柔少了一只鞋',
    detail: '小柔一只脚还穿着黑色平底鞋，另一只脚光着。她的另一只鞋去哪儿了？',
  },
  'tie-clip': {
    label: '威利的领带夹',
    detail: '警方从亚瑟右手取出的领带夹有三道斜纹，与威利在当晚合照里佩戴的一致。',
    image: 'willy-tie-clip.png',
  },
  'old-photo': {
    label: '去年夏天的演出合照',
    detail: '去年夏天大家在露天唱演出大获成功。那时小柔和威利还是一对情侣。',
    image: 'band-group-photo-last-summer.png',
  },
  glass: {
    label: '碎酒杯',
    detail: '楼梯口的木地板上散落着碎玻璃，旁边还有一截杯脚。',
  },
  hand: {
    label: '亚瑟的右手',
    detail: '右手紧握，指缝间隐约露出一点银色。指甲缝里有些黑色残屑。',
    image: 'arthur-right-hand.png',
  },
  'arthur-phone': {
    label: '亚瑟的手机',
    detail: '手机在亚瑟的裤袋里，锁着。壁纸是他和小柔在阳光下的合照。她笑得跟昨晚一样。我多看了一眼，才按灭屏幕。',
    image: 'arthur-phone-lock-screen.png',
  },
  milk: {
    label: '托尼的牛奶',
    detail: '托尼说牛奶是小柔端来的。他喝了几口后困得起不来。我在杯壁和牛奶表面都看到了白色粉末，成分还不清楚。',
    image: 'tony-milk-closeup.png',
  },
  'lili-testimony': {
    label: '小莉的证词',
    detail: '小莉和蛋仔在后院抽烟时听见小柔、亚瑟和威利争吵，随后听见一声闷响和玻璃碎裂声。蛋仔先回屋。小莉上台阶时被从里面打开的门撞到，往后踩空，没看见开门的人。',
  },
  drink: {
    label: '小莉的饮料',
    detail: '小莉在后院抽烟时喝了两口，把饮料罐留在后门右侧的窗台上。',
  },
  'danzai-testimony': {
    label: '蛋仔的证词',
    detail: '蛋仔说他从楼上用手机照到亚瑟已经倒在楼梯底，自己没有下楼。后来他听见车响，猜是威利走了。',
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
  ['洛克', '调音师', '你扮演的角色。医学系学生，平时帮乐队做现场调音。', 24],
  ['托尼', '团长 · 贝斯', '负责订场地、安排演出，也是这次庆功宴的组织者。', 25],
  ['小莉', '鼓手', '乐队的鼓手，留着蓝色短发，戴黑框眼镜。', 25],
  ['亚瑟', '木吉他', '负责乐队的木吉他演奏，紫色短发，演出时戴着金链。', 27],
  ['蛋仔', '电吉他', '乐队的电吉他手，戴琥珀色圆框眼镜。', 21],
  ['小柔', '女主唱', '乐队的女主唱。她和威利曾经交往一年，分手后仍一起演出。', 23],
  ['威利', '男主唱 · 键盘', '乐队的另一位主唱，同时负责键盘。', 28],
];

export const characterProfileNames = {
  'arthur-profile': '亚瑟',
  'tony-profile': '托尼',
};

export const arthurRelationships = [
  '洛克是乐队的调音师，负责亚瑟和其他成员的现场声音。',
  '托尼是团长兼贝斯手，也是这次庆功宴的组织者。排练和演出由他和乐队成员一起筹备。',
  '蛋仔弹电吉他，亚瑟弹木吉他。小莉打鼓，三人在同一支乐队里排练、演出。',
  '小柔和威利是乐队的两位主唱，威利也弹键盘。成员们都看得出来亚瑟对小柔有意思。',
];
