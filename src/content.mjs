export const pendingArtwork = {
  'tony-before-sleep': {
    status: 'generated', target: 'tony-before-sleep-extra-pillow.png', image: 'tony-before-sleep-extra-pillow.png',
    brief: '与现有托尼隔间保持机位和布局一致。托尼入睡前，除头下枕头外，床边多一个备用枕头；当前叫醒托尼的画面不含这个备用枕头。黑白金色回忆滤镜由运行时添加。',
  },
  'arthur-fall': {
    status: 'generated', target: 'miko-memory-arthur-fall.png', image: 'miko-memory-arthur-fall.png',
    brief: '小柔讲述的坠楼回忆：威利摔杯后拉住要离开的亚瑟，亚瑟踩到碎玻璃失足，用左手扯下威利胸前领带夹；小柔近身拉住威利劝阻。亚瑟背朝下行楼梯，体型不变、肌肉线条柔和；碎酒杯在平台地板上。保持既有楼梯布局，不画成有人推下楼。',
  },
  'danzai-pillow-murder': {
    status: 'generated', target: 'danzai-pillow-murder.png', image: 'danzai-pillow-murder.png',
    brief: '最终还原：楼梯下，穿黑羽演出服的蛋仔用托尼的备用枕头闷住亚瑟口鼻，亚瑟临死抓坏黑羽外套，领带夹落在手边；突出枕头、抓握与羽毛，不需新增血腥细节。',
  },
};

export const reviewGroups = {
  'review-drinks': { label: '复查饮料与尸检', clues: ['autopsy', 'drink-analysis'] },
  'review-vehicle': { label: '复查威利的车', clues: ['vehicle'] },
  'review-extortion': { label: '警方发现的内幕', clues: ['extortion'] },
  'review-feather': { label: '复查指甲里的黑色碎屑', clues: ['feather'] },
};

// The first pass connects the story with existing artwork and report dialogues.
export const storyTransitions = {
  'police-conclusion': ['fall-reconstruction', 'fall-reconstruction'],
  'fall-reconstruction': ['review', null],
  'rehearsal-arrival': ['rehearsal', 'confrontation'],
  confrontation: ['final-reconstruction', 'final-reconstruction'],
  'final-reconstruction': ['rehearsal', 'arrest'],
  arrest: ['sunset', 'sunset'],
  sunset: ['hospital-ending', 'kat-miko-private'],
};

export const scenes = {
  rehearsal: {
    label: '排练室',
    image: 'rehearsal-confrontation.png',
    hotspots: [],
  },
  'police-conclusion': { label: '警方初步结论', image: 'police-staircase-cordon.png', hotspots: [] },
  'fall-reconstruction': { label: '小柔所述的坠楼经过', image: 'upstairs-hallway.png', hotspots: [] },
  review: { label: '重新调查', image: 'police-staircase-cordon.png', hotspots: [] },
  'final-reconstruction': { label: '最后的案情还原', image: 'staircase-final-reconstruction.png', hotspots: [] },
  sunset: { label: '日落', image: 'hilltop-sunset.png', hotspots: [] },
  'hospital-ending': { label: '凯特与小柔的私下谈话', image: 'hospital-kat-miko.png', hotspots: [] },
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
      { id: 'hand', label: '亚瑟的左手', rect: [60, 19, 11, 13] },
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
  'tony-memory': {
    label: '托尼的睡前回忆',
    image: pendingArtwork['tony-before-sleep'].image,
    hotspots: [{ id: 'tony-pillow', label: '查看床上的备用枕头', rect: [1, 73, 25, 22] }],
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
    label: '亚瑟、威利和蛋仔的房间', image: 'band-shared-bedroom.png',
    hotspots: [{ id: 'bedroom-shoe', label: '查看门口地面', rect: [17, 85, 72, 15] }],
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
  'pillow-observation': [[null, '托尼记得当时床上还有一个枕头,现在不知道去哪里了。算了不重要。']],
  'police-conclusion': [
    [null, "离开病房后，警方告知洛克目前的初步判断：威利在争执中导致亚瑟坠楼，并可能在坠楼后将他杀害；随后驾车逃离时，车辆后轮脱落，失控撞墙。"],
    ["洛克", "亚瑟不是摔死的。先把小柔讲的经过和现场对一遍。"],
  ],
  'fall-reconstruction': [
    [null, "根据小柔的说法，威利摔碎酒杯，拉住想离开的亚瑟。亚瑟踩到碎玻璃失足，用左手扯下威利的领带夹，摔下楼梯。", {"image": "miko-memory-arthur-fall.png", "memory": true, "pendingAsset": "arthur-fall", "alt": "按小柔证词还原坠楼经过"}],
    ["洛克", "杯子和领带夹都对得上。可小柔只说喊他没有回应，断定他已经死了的人是蛋仔。蛋仔却说自己没有下楼。"],
    [null, "洛克和托尼重新整理证词，向警方了解后续检验结果。"],
  ],
  'review-drinks': [
    ["小莉", "那罐饮料是蛋仔递的。我放到窗台上，他还问我要不要再喝一口。"],
    [null, "警方检验发现，小莉的饮料和托尼的牛奶里有同一种药物。"],
    [null, "尸检确认：亚瑟坠楼后仍然活过一段时间，最终死于机械性窒息。"],
  ],
  'review-vehicle': [
    [null, "车辆复检显示，威利的车在驶离前就已被人动过，后轮在行驶中脱落，导致失控撞墙。"],
    ["托尼", "散场那会儿，威利在跟我说话。我瞥见好几个人从侧门出去过搬东西。外面就是停车处。"],
    ["洛克", "所以争执之前，大家都有机会接近威利的车。"]
  ],
  'review-extortion': [
    [null, "警方查出蛋仔、威利和亚瑟长期私下用黑客手段勒索企业。现有调查将三人的真实 IP 泄露归因于蛋仔的一次疏忽。"],
    [null, "泄露之后，亚瑟和威利退出三人群，私下整理的记录只留下蛋仔经手的部分，遗漏了几件三人共同参与的事。"],
    ["洛克", "他们只留下蛋仔经手的记录。蛋仔看出了他们想让他一个人扛。"],
  ],
  'review-feather': [
    [null, "检验人员在亚瑟左手指甲缝里发现几丝黑色残屑，经鉴定是某种鸟的羽毛。", {"image": "arthur-right-hand.png", "alt": "亚瑟左手指甲缝里的残屑"}],
    [null, "洛克重新打开散场时的合照。", {"image": "band-group-photo.png", "alt": "散场时的合照"}],
    ["洛克", "亚瑟摔下去时抓的是领带夹。这些黑色碎屑是什么时候进到他指甲里的？"],
  ],
  'confrontation': [
    ["蛋仔", "亚瑟的遗物，有什么要我认的？"],
    ["洛克", "亚瑟和威利想把勒索案推到你头上。小柔告诉你他们当晚会碰面，你就知道威利可能会慌得开车逃走。"],
    ["托尼", "散场时我看见你从侧门出去了。威利的车就停在外面，警方查出那辆车在开走前就被人动过。"],
    ["蛋仔", "那你看见我碰他的车了吗？"],
    ["洛克", "你答应帮小柔支开小莉。你递给小莉的饮料里有药。她还没去拉门就已经头晕了。"],
    [null, "蛋仔把桌上的照片往前一推。"],
    ["蛋仔", "说完了？你们根本没有证据。"],
    ["洛克", "亚瑟坠楼后还活着，死因是机械性窒息。"],
    ["蛋仔", "那也是威利干的。亚瑟手里还攥着他的领带夹。"],
    ["洛克", "领带夹确实是亚瑟摔下去时扯下来的。可他那只手的指甲缝里还卡着黑羽毛。你看合照，当晚只有你穿着带黑羽的外套。"],
    ["洛克", "你说你没下楼。那亚瑟是怎么抓到你衣服的？"],
    [null, "蛋仔看着照片，没说话。"],
    ["洛克", "你催威利开车走。他以为自己害死了亚瑟，根本不知道车已被动过。等我们发现领带夹，自然会去追查他。"],
  ],
  'final-reconstruction': [
    [null, "小柔和威利离开去找手机后，蛋仔下了楼。亚瑟还活着，左手仍攥着领带夹。"],
    [null, "蛋仔拿走托尼房里的备用枕头，用它闷住亚瑟口鼻。挣扎中，亚瑟的左手松开领带夹，抓住蛋仔的黑羽演出服，把衣服抓坏。", {"image": "danzai-pillow-murder.png", "memory": true, "pendingAsset": "danzai-pillow-murder", "alt": "蛋仔用枕头杀害亚瑟，黑羽衣服被抓住"}],
    [null, "蛋仔拿出亚瑟手里羽毛，把领带夹塞回他的左手，却没留意指甲缝里还有残屑。"],
    [null, "在后院报信前，蛋仔销毁了枕头和被抓坏的黑羽演出服，换上便装。"],
  ],
  'arrest': [
    [null, "回到排练室。蛋仔站起来，趁托尼低头收照片，抄起椅子朝他扑过去。洛克一把拉开托尼。等在门外的警察冲进来，把蛋仔制住。"],
    ["托尼", "你连我们也想一起灭口？"],
    [null, "蛋仔没有回答。警察把他带走。桌上的合照里，他还穿着那件黑羽演出服。"],
  ],
  'sunset': [
    [null, "小柔身体恢复了一些。洛克陪她外出，两人坐在无人的山坡上看日落。"],
    ["洛克", "你跟威利分手前，有次排练，伸手拿麦克风的时候，袖口滑了下来。你说手上的淤青是撞的。去年夏天那场演出，合照里我们都穿短袖或背心，只有你把袖口扣到了手腕。后来想想，那阵子你一直是这么穿的。直到警方查到威利手机里的那些记录，我才知道，你遭受的伤害一直都在继续。"],
    [null, "小柔望着山脊，没有回头。"],
    ["洛克", "那阵子你连排练都快撑不住了。我记得亚瑟就是那时候开始常来找你。你说你想让他当着威利的面把话说清楚。你们私下谈过什么，我也只能猜。"],
    [null, "风吹过坡上的草。洛克停了一会儿。"],
    ["洛克", "我记得你演出后一直看着窗外。那个角度能看到威利的车。蛋仔也是那时候去的停车处。你是不是看见他在车边做了什么？"],
    ["洛克", "后来他催威利开车。要是你之前就看见了，听到那句话时，你可能已经猜到了他的意思。"],
    ["洛克", "威利在发生争端的时候有这种习惯一个人开车出去冷静，这点我们大家都知道，但是小柔你如果劝他不要开车的话，他是一定会听的，但你却没有这么做不是吗？"],
    ["洛克", "后来警察问起那晚，你也没提停车场。"],
    [null, "小柔始终没有开口。太阳沉到山脊后面，她把头靠在洛克肩上。洛克伸手抱住她，她也抱住了他。画面渐暗。"],
  ],

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
    [null, '托尼回想起入睡前的隔间：床边还放着一个备用枕头。', { ...pendingArtwork['tony-before-sleep'], memory: true, alt: '托尼入睡前的隔间，床尾多一个备用枕头' }],
    [null, '回到现在，托尼身边只剩下头下的枕头。', { image: 'tony-bedroom.png', alt: '现在的托尼隔间，没有备用枕头' }],
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
    [null, '蛋仔从玉米地里钻出来，穿着便装，裤腿上都是泥。'],
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
  'inspect-clip': [
    ['洛克', '亚瑟的情况查清楚了吗？他是摔下楼梯时伤到头才死的吗？', { image: 'police-staircase-cordon.png', alt: '警方封锁楼梯口，向众人说明亚瑟的情况' }],
    [null, '警方把调查结果告诉了在场的众人：亚瑟的死因是窒息。他头部的伤势虽然严重，但并不致命。', { image: 'police-staircase-cordon.png', alt: '警方封锁楼梯口，向众人说明亚瑟的情况' }],
    ['洛克', '也就是说，他摔下楼梯后还活着……', { image: 'police-staircase-cordon.png', alt: '警方封锁楼梯口，向众人说明亚瑟的情况' }],
    [null, '警方从亚瑟左手取出一枚领带夹。洛克认出那就是他先前在指缝里看见的银色物件。夹面上有三道斜纹。'],
  ],
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
    [null, "凯特医生把洛克和托尼带到病房门口。"],
    ["凯特医生", "她已经脱离危险了，但现在还很虚弱。别聊太久，让她多休息。"],
    [null, "洛克和托尼走进病房，洛克把带来的东西放在床头。"],
    ["小柔", "你们来了。"],
    ["洛克", "嗯，我们来看看你。你要是累了，我们就先走。"],
    ["小柔", "你能坐近一点吗？"],
    [null, "洛克把椅子拉到床边。"],
    ["洛克", "现在感觉怎么样？"],
    ["小柔", "好多了。就是没什么力气。"],
    ["洛克", "那就别急着说话。你要喝水吗？"],
    ["小柔", "不用。你坐着就好。"],
    [null, "两人安静了一会儿。"],
  ],
  'hospital-followup': [
    ["小柔", "洛克，对不起。"],
    ["洛克", "怎么了？"],
    ["小柔", "昨晚那杯水……我放了安眠药。托尼的牛奶里也放了。"],
    [null, "洛克看着她。"],
    ["小柔", "是我平时失眠吃的。我知道你醒过来以后，一定会来找我。"],
    ["洛克", "你可以跟我说的。"],
    ["小柔", "跟你说了，你还会让我去吗？"],
    [null, "洛克没有回答。"],
    ["小柔", "这是我跟威利、亚瑟之间的事。我只想让你们睡一觉，不用听，也不用管。蛋仔知道我要找他们谈，他说小莉那边他来想办法。"],
    ["小柔", "可后来……事情完全不是我想的那样。"],
    ["洛克", "你本来想跟他们谈什么？"],
    [null, "小柔低头攥着被角。"],
    ["小柔", "我之前怀孕了。凯特刚刚跟我说，孩子已经没了。其实我早就决定不要了，但有些话，我还是想当着他们两个人的面说清楚。"],
    [null, "洛克愣了一下，没有打断她。"],
    ["小柔", "你会不会觉得我很糟糕？"],
    ["洛克", "小柔，我只是很担心你。"],
    [null, "小柔抬起头，看了他一会儿。"],
    ["小柔", "我知道。你一直都对我很好。"],
    [null, "洛克伸手把她滑到床边的被子拉好。"],
    ["小柔", "我提前让威利在外面等，想先跟亚瑟说。亚瑟一直叫我酒醒了再谈。后来威利进来，他们就吵起来了。"],
    ["小柔", "威利摔了杯子。亚瑟想走，他就去拉……亚瑟踩到地上的玻璃，一下子摔下去了。", { ...pendingArtwork['arthur-fall'], memory: true, alt: '小柔回忆亚瑟失足坠楼' }],
    [null, "她停下来，呼吸有些急。"],
    ["小柔", "我跑下去叫他，他没有回答。我想打电话叫救护车，可手机没带在身上，就跟威利去找了。"],
    ["小柔", "回来的时候，蛋仔拦住我们，说亚瑟已经死了。他一直催威利走，说再不走就来不及了。"],
    ["小柔", "亚瑟摔下楼就不动了，威利说不要报警，然后还抓了个锤子跑到车那里，然后听到什么玻璃碎了。"],
    ["洛克", "也就是说，是威利想起来托尼带了屏蔽器，把它打开装在壁炉里，想要拖延大家报警，让自己有时间逃跑？"],
    ["小柔", "我那时候脑子很乱……我不知道怎么会变成这样。"],
  ],
  'miko-text': [
    [null, "小柔发给威利的短信：“你先在外面等一下。我叫你了再进来。”"],
  ],
  'miko-memory': [
    [null, "小柔说，威利摔了杯子，亚瑟踩到地上的玻璃，摔下楼梯。"],
  ],
  // Final scene: after the sunset outing and return to hospital; ends on Miko's silence.
  'kat-miko-private': [
    [null, '看完日落回到医院。洛克离开后，凯特医生来到病房。'],
    ["凯特医生", "小柔，你身体怎么样了。"],
    ["小柔", "差不多恢复了，谢谢你哦凯特，真想不到你会是我的主治医生。发生了这么恐怖的事情，看到你真的让我宽慰了很多。"],
    ["凯特医生", "我也很惊讶呢。你的那些朋友，看着对你真的很好啊。刚刚那个叫洛克的，是不是还跟你出去约会了。"],
    ["小柔", "不是约会啦。经过了这么多事，最不想做的就是再约会了。"],
    ["凯特医生", "所以说，你愿意跟我说实话发生了什么吗？"],
    ["小柔", "?"],
    ["凯特医生", "你怀孕的事啊! 那孩子在你腹中很早之前就已经死了，在你血液里面还检查出来堕胎药物和迷幻药物的成分。这个报告我帮你压下来了，但你到底经历了什么？"],
    ["小柔", "。。。"],
    ["小柔", "其实我也不知道那孩子是谁的，从怀孕之后我一直心惊胆战，感觉自己已经不干净了，带着一个挥之不去的罪孽，所以我才不想把ta留下来。"],
    ["凯特医生", "你的意思是说。。？"],
    ["小柔", "其实和威利的关系结束之后，我和威利还有亚瑟其实还挺经常开那种party的，就我们三个人的那种。孩子可能是他们两个里任何一个人的。"],
    ["凯特医生", "案子的细节我都听警察和你朋友说了，毕竟我是案件重要人物的主治医生。我听说警察已经抓住了杀害他们两个的凶手，他们是因为做黑客IP泄漏才内部分裂的，也正好是这个时候。"],
    ["小柔", "你想说什么？"],
    ["凯特医生", "这世界上哪有这么巧的事，你偏偏挑了演出之后大家都在的场合和他们摊牌，偏偏就在那天晚上，他们两个都死了。"],
    ["小柔", "你的意思是说，这是我策划的？"],
    ["凯特医生", "你以前可是个程式天才啊，大学是全专业第一名毕业的，你在威利和亚瑟家这么久，不可能不知道他们在干什么吧。"],
    ["小柔", "我是知道，但这代表什么？"],
    ["凯特医生", "他们的ip会泄露这件事，和你有关系吗？而且那个叫蛋仔的凶手，他是不是也喜欢你？"],
    ["小柔", "你是说是我指示蛋仔的？怎么会？我哪有这么神通广大？"],
    ["凯特医生", "我当然没有证据, 其实那些渣男死了也是活该。但是，我真的不敢相信也不愿意相信你会做这种事。"],
    ["小柔", "你怎么会这么不相信我？"],
    ["凯特医生", "算了小柔，对不起，你就当我胡说八道吧。那个洛克，看着像个好人，但你们这个圈子已经是个无底沼泽了。等你病好还是想办法离开吧。"],
    ["小柔", "。。。"],
  ],
  'hospital-aftermath': [
    ["洛克", "先不说了。"],
    ["小柔", "我真的只是想把话说清楚。"],
    ["洛克", "嗯，我听见了。"],
    [null, "洛克把水杯递给她，等她喝了一口，再接回床头。"],
    ["小柔", "你是不是有很多事想问我？"],
    ["洛克", "等你好一点再说。今天先休息。"],
    ["小柔", "那你再坐一会儿，好不好？"],
    ["洛克", "好。"],
    [null, "小柔松开攥着被角的手。洛克留在床边，没有再问。"],
  ],

};

export const clues = {
  'bedroom-shoe': {
    label: '门口的女式鞋',
    detail: '门口有一只女式鞋，会是谁的？',
    image: 'miko-shoe-bedroom-doorway.png',
  },
  'tony-pillow': {
    label: '不见的备用枕头',
    detail: '托尼记得当时床上还有一个枕头,现在不知道去哪里了。算了不重要。',
    image: 'tony-before-sleep-extra-pillow.png',
  },
  'autopsy': {"label": "亚瑟的尸检报告", "detail": "亚瑟坠楼后仍存活过一段时间，最终死于机械性窒息。"},
  'drink-analysis': {"label": "饮料药物检验", "detail": "小莉称饮料由蛋仔递给她；警方在饮料和托尼的牛奶里检出了同一种药物。"},
  'vehicle': {"label": "威利的车辆复检", "detail": "后轮在驶离前被人动过；托尼看见蛋仔在散场时去往停车处。小柔提前告诉过蛋仔威利会来。"},
  'extortion': {"label": "勒索案记录", "detail": "三人共同实施黑客勒索。IP 泄露后，威利和亚瑟整理的材料只留下蛋仔经手的部分。"},
  'feather': {"label": "指甲里的黑羽", "detail": "亚瑟左手指甲缝的残屑经检验为黑色羽毛。"},

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
    detail: '警方从亚瑟左手取出的领带夹有三道斜纹，与威利在当晚合照里佩戴的一致。',
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
    label: '亚瑟的左手',
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
    detail: '小柔主动承认在洛克的水和托尼的牛奶里放了安眠药，称只想让无关的人置身事外。她说蛋仔答应支开小莉；自己约威利和亚瑟谈怀孕的事，并转述凯特私下告知她已流产，争执中威利摔杯、拉住亚瑟，亚瑟踩到碎玻璃后坠楼。她说自己与威利离开楼梯口找手机叫救护车，回来时蛋仔声称亚瑟已死，并催威利离开。她还说威利不让报警，拿锤子跑向停车处，随后传来玻璃碎裂声。洛克据此推测威利取走并开启屏蔽器、藏进壁炉，以拖延报警、争取逃跑时间。洛克见她不适，停止追问。',
  },
};

export const portrait = {
  洛克: '洛克.png',
  托尼: 'tony.png',
  小莉: '小莉.png',
  亚瑟: 'arthur.png',
  蛋仔: '蛋仔-便装.png',
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

export function portraitFor(speaker, dialogueId) {
  if (speaker === '蛋仔' && ['opening-backstage', 'final-reconstruction'].includes(dialogueId)) return '蛋仔.png';
  return portrait[speaker];
}

// Keep the spoken line and the history consistent when the optional photo was skipped.
export function lineFor(progress) {
  const { id, line } = progress.dialogue;
  const row = dialogues[id][line];
  if (id !== 'sunset' || progress.clues.includes('old-photo') || !row[1].includes('合照里我们都穿')) return row;
  return [row[0], row[1].replace('去年夏天那场演出，合照里我们都穿短袖或背心，只有你把袖口扣到了手腕。', '去年夏天那场演出，大家都穿短袖或背心，我记得只有你把袖口扣到了手腕。'), ...row.slice(2)];
}
