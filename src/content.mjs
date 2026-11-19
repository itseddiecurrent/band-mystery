export const scenes = {
  rehearsal: {
    label: '排练室',
    image: 'rehearsal-confrontation.png',
    hotspots: [],
  },
  wake: {
    label: '楼上房间',
    image: 'upstairs-wake-up.png',
    backstageImage: 'opening-backstage.png',
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
  'tony-car': {
    label: '托尼的车',
    image: 'tony-suv-broken-rear-window.png',
    description: '托尼的车窗被砸碎，里面放着几把演出的吉他，还有一个开着的盒子。有人偷走了里面的信号屏蔽器？谁会这么做？',
    hotspots: [{ id: 'tony-tire-tracks', label: '查看车右边的地面', rect: [80, 40, 20, 60] }],
  },
  'tony-tire-tracks': {
    label: '托尼车旁的轮胎印',
    image: 'tony-suv-tire-tracks.png',
    description: '托尼的车旁边有一条车轮印，本来停在这里的是威利的车，他把车开走了？',
    hotspots: [],
  },
  'bedroom-hall': {
    label: '卧室走廊', image: 'upstairs-hallway.png', hotspots: [],
  },
  'band-bedroom': {
    label: '亚瑟、威利和蛋仔的房间', image: 'band-shared-bedroom.png', hotspots: [],
    inspection: '一张床，地上铺着毯子和充气床垫。房间里没有人。',
  },
  'miko-lili-bedroom': {
    label: '小柔和小莉的房间', image: 'miko-lili-shared-bedroom.png',
    hotspots: [{ id: 'miko-purse', label: '查看小柔的挎包', rect: [53, 64, 16, 21] }],
    inspection: '房间里没有人。小柔的挎包还留在房里。',
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
    closeup: {
      label: '壁炉里的信号屏蔽器', image: 'fireplace-jammer-closeup.png',
      hotspots: [{ id: 'disable-jammer', label: '信号屏蔽器电源', rect: [59, 66, 5.5, 12] }],
    },
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
  'willy-crash': {
    label: '威利的车祸现场',
    image: 'willy-wall-crash.png',
    hotspots: [],
  },
  hospital: {
    label: '医院病房',
    image: 'hospital-visit.png',
    hotspots: [],
  },
};

export const purseImages = {
  closed: 'miko-purse-closed.png',
  open: 'miko-purse-open.png',
};

export const purseHotspots = [
  { id: 'miko-pill-box', label: '查看药盒', rect: [29.5, 24, 16.5, 18.8] },
  { id: 'miko-diagnosis-prescription', label: '查看诊断书和处方', rect: [46.8, 25, 24.4, 26.5] },
  { id: 'miko-injury-record', label: '查看泛黄的检查记录', rect: [25, 43, 20, 26] },
  { id: 'miko-pregnancy-test', label: '查看未拆封的盒子', rect: [46, 51.5, 25, 20] },
];

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
  'solve-success': [
    [null, '解密成功！点击前进推动后续剧情'],
  ],
  'rehearsal-arrival': [
    [null, '案发当晚的事看似已经结束。洛克和托尼把蛋仔约到排练室，说有几样亚瑟的遗物想让他认一认。蛋仔穿着一件灰绿夹克进来。桌上摊着照片和报告。'],
  ],
  opening: [
    [null, '洛克在楼上房间的沙发上醒来，四周一片昏暗。'],
    ['洛克', '头好晕，我怎么了？'],
    ['洛克', '对了，昨晚刚演完。托尼租了这栋房子，叫大家过来庆功。'],
    [null, '洛克想起昨晚散场时，大家还在后台收拾器材。'],
  ],
  'opening-backstage': [
    [null, '昨晚，演出结束后。大家正在后台收拾器材。'],
    ['威利', '跟你说了叫你多练最后一段，弹得跟狗屎一样。观众没朝你扔白菜都给你面子了。'],
    ['亚瑟', '会不会好好说话？你怎么知道我没练？为了把这段弹好，我这周天天都练到凌晨。'],
    ['威利', '那就不是练得不好，是水平不行。'],
    ['亚瑟', '你就负责张张嘴唱唱歌，弹几个钢琴键，你懂个啥？今天唱得跟卡带似的。要不是小柔唱得好，把你盖过去了，早就没观众了。'],
    ['小柔', '好了啦，明明大家都演得很棒，何必这么针锋相对。'],
    ['小莉', '他们俩就是这样，吵得越凶感情越深。老是看到你们和蛋仔凑在一起，跟密谋什么似的。'],
    ['蛋仔', '别乱说，咱就是练练琴。上了台大家都是战友，没有私人恩怨。小柔和威利分手多久了，不也一样一起演出？'],
    ['威利', '给我闭嘴吧蛋仔。大家都这么熟，就别哪壶不开提哪壶了。'],
    ['托尼', '你们别打起来啊。冲动起来，蛋仔可是会拿琴砸你的。'],
    ['蛋仔', '我咋会这样？以前也就是做做样子。我的主张就是不爽就说出来，憋着会憋出内伤的。'],
    ['洛克', '好啦好啦，大家都这么棒，何必这样。'],
  ],
  'opening-memory': [
    [null, '后来，到了庆功的房子，小柔过来找洛克。'],
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
  hand: [[null, '他的手里紧紧抓着什么东西，好像是什么银色的金属，但是亚瑟的身体已经僵硬，无法掰开查看。他的指甲缝里还有黑色的碎屑']],
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
    ['托尼', '我车窗被砸了。后座那个箱子被打开，里面东西被拿走了，是演出会用到的信号屏蔽器，虽然这次没用到，但我一直放车里。'],
    ['小莉', '有人开了屏蔽器，所以我们打不出去？'],
  ],
  'danzai-return': [
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
  'willy-crash': [
    [null, '去医院前，警方传来消息：他们在附近公路的围墙边找到了威利的车。'],
    [null, '威利驾车离开后，一只后轮在行驶中脱落。车身失控甩向路边，撞上围墙。威利因头部重伤死亡。', { image: 'willy-body-in-car.png', alt: '威利倒在撞毁的车内，头部严重受伤' }],
    [null, '车头严重损毁，但车厢仍完整，车辆可以拖回检查。警方在车内找到了威利的手机。后轮脱落的原因还在调查。', { image: 'willy-recovered-phone.png', alt: '警方从威利车里找回的手机，屏幕锁定' }],
    [null, '警方检查手机时，发现了多段不同日期拍摄的照片和视频，记录着威利对小柔的殴打、折磨和威胁。警方向洛克和托尼说明了相关内容。', { image: 'willy-recovered-phone.png', alt: '警方找回的威利手机，屏幕锁定' }],
    ['洛克', '不是只有一次……他一直在伤害她。'],
    ['托尼', '我们还跟他一起排练、一起演出。她一个人撑了这么久。'],
    [null, '手机里接连出现的记录，拼出了小柔长期遭受威利虐待的经过。洛克想起她平时遮住手腕的袖口，决定到医院听她亲口说说。'],
  ],
  'hospital-arrival': [
    [null, '在小柔同意后，凯特医生来到病房，向洛克和托尼说明她的情况。'],
    ['凯特医生', '小柔已经脱离危险。她手腕上的伤已经处理过，目前没有生命危险。'],
    ['凯特医生', '检查确认，她此前怀孕约两个月，现在已经流产。我们会继续观察她的身体情况。'],
    ['凯特医生', '她现在需要休息。她愿意见你们，但请尽量简短一些，如果她觉得累了，就让她休息。'],
    ['小柔', '洛克，你能坐近一点吗？我现在说话没什么力气。'],
    ['洛克', '嗯。你慢慢说，我在这儿。'],
  ],
  'hospital-followup': [
    ['小柔', '我已经决定不留下孩子了。我提前叫威利在外面等，想让亚瑟当着他的面把话说清楚。可亚瑟叫我酒醒再谈。'],
    ['洛克', '我想问清楚两件事。我喝的那杯和托尼的牛奶，你有往里面放过什么吗？'],
    ['小柔', '放了。药是我平时失眠吃的。我怕你们上来劝，最后又只剩我一个人在说。我也告诉了蛋仔，他说小莉那边他来想办法。'],
  ],
  'miko-text': [
    [null, '小柔发给威利的短信：“你先在外面等一下。我叫你了再进来。”'],
    [null, '根据小柔的讲述，洛克回想起昨晚楼梯口发生的事。'],
  ],
  'miko-memory': [
    ['小柔', '我已经想好了。你先让我说完。'],
    ['亚瑟', '你喝了多少？这话明天再说行吗？'],
    [null, '威利走了进来。'],
    ['威利', '哪天的事？'],
    ['亚瑟', '巡演回来那天。'],
    ['威利', '那天晚上你还来我房间喝酒。你一晚上什么都没说。'],
    [null, '威利把酒杯摔在楼梯边。亚瑟想走，威利追上去拉住他。亚瑟转身时踩到碎玻璃，脚下一滑，伸手抓住威利胸前的领带夹。夹子被扯下来，亚瑟摔下楼梯。小柔冲下去时碰倒一只空酒瓶，玻璃碎了一地。'],
    [null, '回到病房。'],
  ],
  'hospital-aftermath': [
    ['洛克', '你下去的时候，他还活着吗？'],
    ['小柔', '我喊他，他没应。我和威利离开楼梯去找手机。回来时，蛋仔在楼梯口拦住我们，说亚瑟已经死了，催威利趁大家还没醒赶紧走。'],
    ['洛克', '电话是怎么断的？'],
    ['小柔', '威利说要拖一会儿。我陪他去停车处，他砸了托尼的车窗拿箱子。回屋后，他断了路由器的电，把屏蔽器藏进壁炉。我跟他走到后门，突然不想跟他走了，就推门跑了出去。'],
    ['洛克', '小莉当时就在门外。'],
    ['小柔', '我听见门撞了一下，还以为撞的是墙。'],
  ],
};

export const clues = {
  'willy-crash': {
    label: '威利的车祸记录',
    detail: '威利驾车离开后，一只后轮在行驶中脱落，车辆失控撞上路边围墙。威利因头部重伤死亡。车厢仍完整，警方已回收车辆和车内物品，后轮脱落的原因仍在调查。',
    image: 'willy-wall-crash.png',
  },
  'willy-phone': {
    label: '威利手机里的施暴记录',
    detail: '警方从威利车内找回手机，发现不同日期拍摄的多张照片和多段视频，记录了他对小柔的殴打、折磨和威胁。这些记录表明小柔长期遭受威利虐待。',
    image: 'willy-recovered-phone.png',
  },
  'miko-pill-box': {
    label: '小柔的药盒',
    detail: '药盒里放了不少安眠药胶囊。原来小柔一直都在吃安眠药。',
    image: purseImages.open,
    crop: { x: 471, y: 205, width: 307, height: 207, sourceWidth: 1672 },
  },
  'miko-diagnosis-prescription': {
    label: '小柔的诊断书和处方',
    detail: '诊断书上写着抑郁症和失眠症，旁边是医生开的安眠药处方。',
    image: 'miko-diagnosis-prescription.png',
  },
  'miko-injury-record': {
    label: '小柔的验伤记录',
    detail: '发现一张检查记录，日期是几个月前。',
    image: 'miko-injury-record.png',
  },
  'miko-pregnancy-test': {
    label: '小柔的验孕棒',
    detail: '没开封的验孕棒，小柔的包里怎么会有这个？',
    image: purseImages.open,
    crop: { x: 740, y: 464, width: 466, height: 226, sourceWidth: 1672 },
  },
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
    detail: '他的手里紧紧抓着什么东西，好像是什么银色的金属，但是亚瑟的身体已经僵硬，无法掰开查看。他的指甲缝里还有黑色的碎屑',
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
  'miko-text': {
    label: '小柔发给威利的短信',
    detail: '案发前，小柔发给威利：“你先在外面等一下。我叫你了再进来。”',
  },
  'miko-testimony': {
    label: '小柔的证词',
    detail: '小柔说她和威利离开楼梯时亚瑟还活着。蛋仔拦住他们并催威利离开。威利砸开托尼的车窗取走屏蔽器，回屋后切断路由器并把屏蔽器藏进壁炉。',
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
  凯特医生: 'kat_doctor.png',
};

export const profiles = [
  ['洛克', '调音师', '你扮演的角色。医学系学生，平时帮乐队做现场调音。', 24],
  ['托尼', '团长 · 贝斯', '负责订场地、安排演出，也是这次庆功宴的组织者。', 25],
  ['小莉', '鼓手', '乐队的鼓手，留着蓝色短发，戴黑框眼镜。', 25],
  ['亚瑟', '木吉他', '负责乐队的木吉他演奏，紫色短发，演出时戴着金链。', 27],
  ['蛋仔', '电吉他', '乐队的电吉他手，戴琥珀色圆框眼镜。', 21],
  ['小柔', '女主唱', '乐队的女主唱。她和威利曾经交往一年，分手后仍一起演出。', 23],
  ['威利', '男主唱 · 键盘', '乐队的另一位主唱，同时负责键盘。', 28],
  ['凯特医生', '医生', 'ICU医生', 26],
];

export const characterProfileNames = {
  'arthur-profile': '亚瑟',
  'tony-profile': '托尼',
};

export const arthurRelationships = [
  '亚瑟是乐队的木吉他手',
  '排练时亚瑟和威利经常有分歧，两人性格不太合得来，但私下和威利和蛋仔关系很好',
  '所有人都看得出来亚瑟对小柔有意思'
];
